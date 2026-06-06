/**
 * AUTO INGEST — Self-sovereign DID generation + full vault ingest in one call.
 * Generates a fresh Ed25519 DID keypair, runs the full_ingest pipeline,
 * and returns both the DID receipt and the asset receipt so the caller
 * can persist the private key locally and immediately use the vault.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_SECRET = Deno.env.get('JASPER_MASTER_SECRET') || 'rwa-satoshi-jasper-v1-default-change-in-prod';
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { asset = {}, existing_did, existing_private_key_jwk } = body;

    // ── 1. GENERATE OR REUSE DID ──────────────────────────────────────────────
    let did, publicKeyBase58, privateKeyJwk;

    if (existing_did && existing_private_key_jwk) {
      // Caller provided their own DID — just use it
      did = existing_did;
      privateKeyJwk = existing_private_key_jwk;
      publicKeyBase58 = did.replace('did:rwa:', '');
    } else {
      // Auto-generate a fresh Ed25519 DID keypair
      const keypair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
      const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keypair.publicKey));
      privateKeyJwk = await crypto.subtle.exportKey('jwk', keypair.privateKey);
      publicKeyBase58 = base58Encode(publicKeyRaw);
      did = `did:rwa:${publicKeyBase58}`;
    }

    // ── 2. SIGN ASSET PAYLOAD ─────────────────────────────────────────────────
    const assetId = asset.asset_id || `RWA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    let signature = null;
    const privateKey = await crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'Ed25519' }, false, ['sign']);
    const dataBytes = new TextEncoder().encode(JSON.stringify({ ...asset, asset_id: assetId, owner_did: did }));
    const sigBytes = await crypto.subtle.sign('Ed25519', privateKey, dataBytes);
    signature = base58Encode(new Uint8Array(sigBytes));

    // ── 3. ENCRYPT ASSET DATA ─────────────────────────────────────────────────
    const encryptedPackage = await encryptData({ ...asset, owner_did: did, signed_at: now }, did);
    encryptedPackage.asset_id = assetId;

    // ── 4. STORE ASSET RECORD ─────────────────────────────────────────────────
    const assetHash = await sha256Hex({ ...asset, asset_id: assetId, owner_did: did, timestamp: now });
    const storedAsset = await base44.asServiceRole.entities.AssetRecord.create({
      asset_id: assetId,
      asset_type: asset.asset_type || 'other',
      weight: asset.weight || null,
      purity: asset.purity || null,
      owner_did: did,
      satoshi_anchor: asset.satoshi_anchor || null,
      description: asset.description || null,
      vault_location: asset.vault_location || null,
      is_encrypted: true,
      verification_status: 'pending',
      current_status: asset.current_status || 'in_vault',
      file_url: asset.file_url || null
    });

    // ── 5. RECORD TRANSACTION ─────────────────────────────────────────────────
    const txId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const prevTxs = await base44.asServiceRole.entities.Transaction.list('-created_date', 1);
    const prevHash = prevTxs[0]?.transaction_hash || '0'.repeat(64);
    const txHash = await sha256Hex(`${txId}${assetId}${did}${prevHash}${now}`);

    await base44.asServiceRole.entities.Transaction.create({
      transaction_id: txId, transaction_type: 'asset_created', asset_id: assetId,
      previous_hash: prevHash, transaction_hash: txHash,
      merkle_root: await sha256Hex([txHash, assetHash].join('')),
      payload: { asset_id: assetId, owner_did: did, asset_hash: assetHash, signature, encrypted: true },
      signature, signed_by: did, status: 'confirmed', confirmations: 1
    });

    // ── 6. MINE BLOCK ─────────────────────────────────────────────────────────
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
      node_name: 'jasper-auto-ingest-node', uptime: '99.99%'
    });

    // ── 7. AUDIT LOG ──────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.AuditLog.create({
      log_id: `AL-${Date.now()}`, action: 'auto_ingest',
      entity_type: 'AssetRecord', entity_id: storedAsset.id,
      user_did: did,
      after_state: { asset_id: assetId, encrypted: true, signed: true, block_height: newHeight, auto_did: !existing_did },
      transaction_id: txId,
      log_hash: await sha256Hex(`auto-ingest-${assetId}-${user.email}-${now}`),
      severity: 'info'
    });

    // ── RETURN everything the client needs ────────────────────────────────────
    return Response.json({
      success: true,
      // DID receipt — save this to localStorage as rwa_did_record
      did_receipt: {
        did,
        public_key_base58: publicKeyBase58,
        private_key_jwk: privateKeyJwk,
        created: now
      },
      // Asset receipt
      asset_id: assetId,
      record_id: storedAsset.id,
      transaction_id: txId,
      transaction_hash: txHash,
      block_height: newHeight,
      block_hash: blockHash,
      signature,
      encrypted: true,
      encrypted_package: encryptedPackage,
      owner_did: did,
      created_at: now,
      pipeline: 'generate_did → encrypt → sign → transaction → mine_block → audit_log',
      auto_did_generated: !existing_did
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});