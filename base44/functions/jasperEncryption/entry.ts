/**
 * JASPER ENCRYPTION SERVICE — RWA Satoshi Tokenization
 * AES-256-GCM encryption tied to DID-derived keys.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_SECRET = Deno.env.get('JASPER_MASTER_SECRET') || 'rwa-satoshi-jasper-v1-default-change-in-prod';

// ─── Key Derivation ───────────────────────────────────────────────────────────
async function deriveMasterKey(ownerDid) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(APP_SECRET + ownerDid),
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode('jasper-rwa-salt-v1'),
      info: encoder.encode(`jasper:${ownerDid}`)
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['wrapKey', 'unwrapKey']
  );
}

// ─── AES-GCM Encrypt ──────────────────────────────────────────────────────────
async function aesEncrypt(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = typeof plaintext === 'string' ? encoder.encode(plaintext) : encoder.encode(JSON.stringify(plaintext));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

// ─── AES-GCM Decrypt ──────────────────────────────────────────────────────────
async function aesDecrypt(ciphertextB64, ivB64, key) {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const decoded = new TextDecoder().decode(plaintext);
  try { return JSON.parse(decoded); } catch { return decoded; }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── ENCRYPT ───────────────────────────────────────────────────────────────
    if (action === 'encrypt') {
      const { data, owner_did, asset_id } = body;
      if (!data || !owner_did) {
        return Response.json({ error: 'data and owner_did required' }, { status: 400 });
      }

      const recordKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      const { ciphertext, iv } = await aesEncrypt(data, recordKey);

      const masterKey = await deriveMasterKey(owner_did);
      const wrapIv = crypto.getRandomValues(new Uint8Array(12));
      const wrappedKeyFinal = await crypto.subtle.wrapKey('raw', recordKey, masterKey, { name: 'AES-GCM', iv: wrapIv });

      const encryptedPackage = {
        ciphertext,
        iv,
        wrapped_key: btoa(String.fromCharCode(...new Uint8Array(wrappedKeyFinal))),
        wrap_iv: btoa(String.fromCharCode(...wrapIv)),
        owner_did,
        asset_id: asset_id || null,
        algorithm: 'AES-256-GCM',
        key_wrap: 'AES-256-GCM + HKDF-SHA256',
        jasper_version: '1.0',
        encrypted_at: new Date().toISOString()
      };

      return Response.json({
        success: true,
        encrypted_package: encryptedPackage,
        message: 'Data encrypted with Jasper AES-256-GCM.'
      });
    }

    // ── DECRYPT ───────────────────────────────────────────────────────────────
    if (action === 'decrypt') {
      const { encrypted_package, owner_did } = body;
      if (!encrypted_package || !owner_did) {
        return Response.json({ error: 'encrypted_package and owner_did required' }, { status: 400 });
      }

      if (encrypted_package.owner_did !== owner_did) {
        return Response.json({ error: 'DID mismatch — not the owner of this record' }, { status: 403 });
      }

      const { ciphertext, iv, wrapped_key, wrap_iv } = encrypted_package;
      const masterKey = await deriveMasterKey(owner_did);
      const wrappedKeyBytes = Uint8Array.from(atob(wrapped_key), c => c.charCodeAt(0));
      const wrapIvBytes = Uint8Array.from(atob(wrap_iv), c => c.charCodeAt(0));

      const recordKey = await crypto.subtle.unwrapKey(
        'raw',
        wrappedKeyBytes,
        masterKey,
        { name: 'AES-GCM', iv: wrapIvBytes },
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const plaintext = await aesDecrypt(ciphertext, iv, recordKey);

      return Response.json({
        success: true,
        data: plaintext,
        decrypted_at: new Date().toISOString(),
        owner_did
      });
    }

    // ── DERIVE (testing/setup) ────────────────────────────────────────────────
    if (action === 'derive') {
      const { owner_did } = body;
      if (!owner_did) return Response.json({ error: 'owner_did required' }, { status: 400 });

      const masterKey = await deriveMasterKey(owner_did);
      const exportedKey = await crypto.subtle.exportKey('raw', masterKey);
      const keyHex = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');

      return Response.json({
        success: true,
        master_key_hex: keyHex,
        owner_did,
        note: 'Master key derived from DID + app secret via HKDF-SHA256. NEVER expose in production.'
      });
    }

    return Response.json({ error: `Unknown action: ${action}. Use: encrypt, decrypt, derive` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});