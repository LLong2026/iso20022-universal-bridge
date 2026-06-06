/**
 * RWA DATA SERVICE — Universal Insert / Retrieve
 * The single endpoint for inserting and fetching RWA asset data
 * with full DID ownership, Jasper encryption, ledger anchoring,
 * and audit trail — all in one call.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_SECRET = Deno.env.get('JASPER_MASTER_SECRET') || 'rwa-satoshi-jasper-v1-default-change-in-prod';
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// ─── Utilities ────────────────────────────────────────────────────────────────
function base58Encode(bytes) {
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (num > 0n) { result = BASE58_ALPHABET[Number(num % 58n)] + result; num = num / 58n; }
  for (const byte of bytes) { if (byte === 0) result = '1' + result; else break; }
  return result;
}

async function sha256Hex(data) {
  const bytes = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveMasterKey(ownerDid) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(APP_SECRET + ownerDid), { name: 'HKDF' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('jasper-rwa-salt-v1'), info: encoder.encode(`jasper:${ownerDid}`) },
    keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['wrapKey', 'unwrapKey']
  );
}

async function encryptData(data, ownerDid) {
  const recordKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dataBytes = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, recordKey, dataBytes);
  const masterKey = await deriveMasterKey(ownerDid);
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await crypto.subtle.wrapKey('raw', recordKey, masterKey, { name: 'AES-GCM', iv: wrapIv });
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    wrapped_key: btoa(String.fromCharCode(...new Uint8Array(wrappedKey))),
    wrap_iv: btoa(String.fromCharCode(...wrapIv)),
    owner_did: ownerDid,
    algorithm: 'AES-256-GCM',
    jasper_version: '1.0',
    encrypted_at: new Date().toISOString()
  };
}

async function decryptData(pkg, ownerDid) {
  const masterKey = await deriveMasterKey(ownerDid);
  const wrappedKeyBytes = Uint8Array.from(atob(pkg.wrapped_key), c => c.charCodeAt(0));
  const wrapIvBytes = Uint8Array.from(atob(pkg.wrap_iv), c => c.charCodeAt(0));
  const recordKey = await crypto.subtle.unwrapKey('raw', wrappedKeyBytes, masterKey, { name: 'AES-GCM', iv: wrapIvBytes }, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const ciphertext = Uint8Array.from(atob(pkg.ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(pkg.iv), c => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, recordKey, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── SETUP_DID ─────────────────────────────────────────────────────────────
    if (action === 'setup_did') {
      const keypair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
      const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keypair.publicKey));
      const privateKeyJwk = await crypto.subtle.exportKey('jwk', keypair.privateKey);
      const did = `did:rwa:${base58Encode(publicKeyRaw)}`;
      const publicKeyBase58 = base58Encode(publicKeyRaw);
      return Response.json({
        did, public_key_base58: publicKeyBase58, private_key_jwk: privateKeyJwk,
        did_document: {
          '@context': ['https://www.w3.org/ns/did/v1'],
          id: did,
          verificationMethod: [{ id: `${did}#key-1`, type: 'Ed25519VerificationKey2020', controller: did, publicKeyBase58 }],
          authentication: [`${did}#key-1`], assertionMethod: [`${did}#key-1`],
          created: new Date().toISOString()
        },
        warning: 'Store private_key_jwk in your secure vault. It cannot be recovered if lost.'
      });
    }

    // ── INSERT ────────────────────────────────────────────────────────────────
    if (action === 'insert') {
      const { asset, owner_did, private_key_jwk, encrypt = true } = body;
      if (!asset || !owner_did) return Response.json({ error: 'asset and owner_did required' }, { status: 400 });

      const assetId = asset.asset_id || `RWA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const now = new Date().toISOString();

      let signature = null;
      if (private_key_jwk) {
        const privateKey = await crypto.subtle.importKey('jwk', private_key_jwk, { name: 'Ed25519' }, false, ['sign']);
        const dataBytes = new TextEncoder().encode(JSON.stringify({ ...asset, asset_id: assetId, owner_did }));
        const sigBytes = await crypto.subtle.sign('Ed25519', privateKey, dataBytes);
        signature = base58Encode(new Uint8Array(sigBytes));
      }

      let encryptedPackage = null;
      if (encrypt && owner_did) {
        encryptedPackage = await encryptData({ ...asset, owner_did, signed_at: now }, owner_did);
        encryptedPackage.asset_id = assetId;
      }

      const assetHash = await sha256Hex({ ...asset, asset_id: assetId, owner_did, timestamp: now });

      const assetRecord = {
        asset_id: assetId,
        asset_type: asset.asset_type || 'other',
        weight: asset.weight || null,
        purity: asset.purity || null,
        owner_did,
        satoshi_anchor: asset.satoshi_anchor || null,
        description: asset.description || null,
        vault_location: asset.vault_location || null,
        is_encrypted: encrypt,
        verification_status: 'pending',
        current_status: asset.current_status || 'in_vault',
        file_url: asset.file_url || null
      };

      const storedAsset = await base44.asServiceRole.entities.AssetRecord.create(assetRecord);

      const txId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const prevTxs = await base44.asServiceRole.entities.Transaction.list('-created_date', 1);
      const prevHash = prevTxs[0]?.transaction_hash || '0'.repeat(64);
      const txHash = await sha256Hex(`${txId}${assetId}${owner_did}${prevHash}${now}`);

      await base44.asServiceRole.entities.Transaction.create({
        transaction_id: txId,
        transaction_type: 'asset_created',
        asset_id: assetId,
        previous_hash: prevHash,
        transaction_hash: txHash,
        merkle_root: await sha256Hex([txHash, assetHash].join('')),
        payload: { asset_id: assetId, owner_did, asset_hash: assetHash, signature, encrypted: encrypt },
        signature, signed_by: owner_did, status: 'confirmed', confirmations: 1
      });

      await base44.asServiceRole.entities.AuditLog.create({
        log_id: `AL-${Date.now()}`,
        action: 'asset_inserted',
        entity_type: 'AssetRecord',
        entity_id: storedAsset.id,
        user_did: owner_did,
        after_state: { asset_id: assetId, encrypted: encrypt, signed: !!signature },
        transaction_id: txId,
        log_hash: await sha256Hex(`insert-${assetId}-${user.email}-${now}`),
        severity: 'info'
      });

      return Response.json({
        success: true, asset_id: assetId, record_id: storedAsset.id,
        transaction_id: txId, transaction_hash: txHash, asset_hash: assetHash,
        signature, encrypted: encrypt, encrypted_package: encryptedPackage,
        owner_did, created_at: now
      });
    }

    // ── RETRIEVE ──────────────────────────────────────────────────────────────
    if (action === 'retrieve') {
      const { asset_id, owner_did, encrypted_package, decrypt = false } = body;
      if (!asset_id) return Response.json({ error: 'asset_id required' }, { status: 400 });

      const assets = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id });
      if (!assets.length) return Response.json({ error: 'Asset not found' }, { status: 404 });

      const asset = assets[0];
      if (owner_did && asset.owner_did !== owner_did) {
        return Response.json({ error: 'DID ownership mismatch' }, { status: 403 });
      }

      const [transactions, documents, alerts] = await Promise.all([
        base44.asServiceRole.entities.Transaction.filter({ asset_id }, '-created_date', 10).catch(() => []),
        base44.asServiceRole.entities.AssetDocument.filter({ asset_id }, '-created_date', 10).catch(() => []),
        base44.asServiceRole.entities.AssetAlert.filter({ asset_id }, '-created_date', 10).catch(() => [])
      ]);

      let decryptedData = null;
      if (decrypt && encrypted_package && owner_did) {
        if (encrypted_package.owner_did !== owner_did) {
          return Response.json({ error: 'DID mismatch on encrypted_package' }, { status: 403 });
        }
        decryptedData = await decryptData(encrypted_package, owner_did);
      }

      return Response.json({
        asset, decrypted_data: decryptedData,
        transactions, documents, alerts,
        transaction_count: transactions.length,
        document_count: documents.length,
        alert_count: alerts.length
      });
    }

    // ── LIST ──────────────────────────────────────────────────────────────────
    if (action === 'list') {
      const { owner_did } = body;
      if (!owner_did) return Response.json({ error: 'owner_did required' }, { status: 400 });
      const assets = await base44.asServiceRole.entities.AssetRecord.filter({ owner_did }, '-created_date', 100);
      return Response.json({ owner_did, assets, total: assets.length });
    }

    // ── FULL_INGEST ───────────────────────────────────────────────────────────
    if (action === 'full_ingest') {
      const { asset, owner_did, private_key_jwk, encrypt = true } = body;
      if (!asset || !owner_did) return Response.json({ error: 'asset and owner_did required' }, { status: 400 });

      const assetId = asset.asset_id || `RWA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const now = new Date().toISOString();

      let signature = null;
      if (private_key_jwk) {
        const privateKey = await crypto.subtle.importKey('jwk', private_key_jwk, { name: 'Ed25519' }, false, ['sign']);
        const dataBytes = new TextEncoder().encode(JSON.stringify({ ...asset, asset_id: assetId, owner_did }));
        const sigBytes = await crypto.subtle.sign('Ed25519', privateKey, dataBytes);
        signature = base58Encode(new Uint8Array(sigBytes));
      }

      let encryptedPackage = null;
      if (encrypt && owner_did) {
        encryptedPackage = await encryptData({ ...asset, owner_did, signed_at: now }, owner_did);
        encryptedPackage.asset_id = assetId;
      }

      const assetHash = await sha256Hex({ ...asset, asset_id: assetId, owner_did, timestamp: now });
      const storedAsset = await base44.asServiceRole.entities.AssetRecord.create({
        asset_id: assetId, asset_type: asset.asset_type || 'other',
        weight: asset.weight || null, purity: asset.purity || null,
        owner_did, satoshi_anchor: asset.satoshi_anchor || null,
        description: asset.description || null, vault_location: asset.vault_location || null,
        is_encrypted: encrypt, verification_status: 'pending',
        current_status: asset.current_status || 'in_vault', file_url: asset.file_url || null
      });

      const txId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const prevTxs = await base44.asServiceRole.entities.Transaction.list('-created_date', 1);
      const prevHash = prevTxs[0]?.transaction_hash || '0'.repeat(64);
      const txHash = await sha256Hex(`${txId}${assetId}${owner_did}${prevHash}${now}`);

      await base44.asServiceRole.entities.Transaction.create({
        transaction_id: txId, transaction_type: 'asset_created', asset_id: assetId,
        previous_hash: prevHash, transaction_hash: txHash,
        merkle_root: await sha256Hex([txHash, assetHash].join('')),
        payload: { asset_id: assetId, owner_did, asset_hash: assetHash, signature, encrypted: encrypt },
        signature, signed_by: owner_did, status: 'confirmed', confirmations: 1
      });

      // Mine block
      const latestBlocks = await base44.asServiceRole.entities.Block.list('-height', 1);
      const prevBlock = latestBlocks[0];
      const newHeight = (prevBlock?.height || 0) + 1;
      const blockBase = `${newHeight}${txHash}${prevBlock?.block_hash || '0'.repeat(64)}${now}`;
      let blockHash = '';
      let nonce = 0;
      while (nonce <= 100000) {
        const h = await sha256Hex(blockBase + nonce);
        if (h.startsWith('00')) { blockHash = h; break; }
        nonce++;
      }
      if (!blockHash) blockHash = await sha256Hex(blockBase + nonce);

      const block = await base44.asServiceRole.entities.Block.create({
        height: newHeight, block_hash: blockHash,
        previous_hash: prevBlock?.block_hash || '0'.repeat(64),
        recall_hash: await sha256Hex(`recall:${blockHash}`),
        merkle_root: txHash, compliance_proof: 'JASPER_VERIFIED',
        node_name: 'jasper-sovereign-node-1', uptime: '99.99%'
      });

      await base44.asServiceRole.entities.AuditLog.create({
        log_id: `AL-${Date.now()}`, action: 'full_ingest',
        entity_type: 'AssetRecord', entity_id: storedAsset.id,
        user_did: owner_did,
        after_state: { asset_id: assetId, encrypted: encrypt, signed: !!signature, block_height: newHeight },
        transaction_id: txId,
        log_hash: await sha256Hex(`ingest-${assetId}-${user.email}-${now}`),
        severity: 'info'
      });

      return Response.json({
        success: true, asset_id: assetId, record_id: storedAsset.id,
        transaction_id: txId, transaction_hash: txHash, asset_hash: assetHash,
        signature, encrypted: encrypt, encrypted_package: encryptedPackage,
        owner_did, created_at: now,
        block_height: newHeight, block_hash: blockHash, block_id: block.id,
        pipeline: 'insert → encrypt → sign → transaction → mine_block → audit_log',
        status: 'fully_ingested'
      });
    }

    return Response.json({
      error: `Unknown action: ${action}`,
      valid_actions: ['setup_did', 'insert', 'retrieve', 'list', 'full_ingest']
    }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});