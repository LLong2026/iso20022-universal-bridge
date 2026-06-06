/**
 * DID KEY MANAGER — RWA Satoshi Tokenization
 * Generates, stores, and verifies Decentralized Identifiers (DID)
 * using Ed25519 keypairs via Web Crypto API (FIPS-compliant).
 *
 * DID Format: did:rwa:<base58_public_key>
 *
 * Endpoints (via JSON body action):
 *   generate  — create new DID keypair for a user
 *   resolve   — retrieve DID document by did
 *   sign      — sign a payload with DID private key
 *   verify    — verify a signature against a DID
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Base58 encode/decode (Bitcoin alphabet) ──────────────────────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes) {
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  for (const byte of bytes) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

function base58Decode(str) {
  let num = 0n;
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx < 0) throw new Error('Invalid base58 character');
    num = num * 58n + BigInt(idx);
  }
  const hex = num.toString(16).padStart(64, '0');
  return new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
}

// ─── DID Document builder ─────────────────────────────────────────────────────
function buildDIDDocument(did, publicKeyBytes, created) {
  const pubKeyBase58 = base58Encode(publicKeyBytes);
  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/ed25519-2020/v1'],
    id: did,
    verificationMethod: [{
      id: `${did}#key-1`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyBase58: pubKeyBase58
    }],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    created,
    updated: created
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── GENERATE ────────────────────────────────────────────────────────────
    if (action === 'generate') {
      const keypair = await crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
      );

      const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keypair.publicKey));
      const privateKeyJwk = await crypto.subtle.exportKey('jwk', keypair.privateKey);

      const did = `did:rwa:${base58Encode(publicKeyRaw)}`;
      const created = new Date().toISOString();
      const didDocument = buildDIDDocument(did, publicKeyRaw, created);

      return Response.json({
        did,
        did_document: didDocument,
        private_key_jwk: privateKeyJwk,
        public_key_base58: base58Encode(publicKeyRaw),
        created,
        instructions: 'Store private_key_jwk securely. Use "sign" action to sign payloads.'
      });
    }

    // ── SIGN ─────────────────────────────────────────────────────────────────
    if (action === 'sign') {
      const { payload, private_key_jwk } = body;
      if (!payload || !private_key_jwk) {
        return Response.json({ error: 'payload and private_key_jwk required' }, { status: 400 });
      }

      const privateKey = await crypto.subtle.importKey(
        'jwk',
        private_key_jwk,
        { name: 'Ed25519' },
        false,
        ['sign']
      );

      const dataBytes = new TextEncoder().encode(
        typeof payload === 'string' ? payload : JSON.stringify(payload)
      );

      const signatureBytes = await crypto.subtle.sign('Ed25519', privateKey, dataBytes);
      const signature = base58Encode(new Uint8Array(signatureBytes));

      const hashBytes = await crypto.subtle.digest('SHA-256', dataBytes);
      const dataHash = Array.from(new Uint8Array(hashBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

      return Response.json({
        signature,
        data_hash: dataHash,
        signed_at: new Date().toISOString(),
        algorithm: 'Ed25519'
      });
    }

    // ── VERIFY ───────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const { payload, signature, public_key_base58 } = body;
      if (!payload || !signature || !public_key_base58) {
        return Response.json({ error: 'payload, signature, and public_key_base58 required' }, { status: 400 });
      }

      const publicKeyBytes = base58Decode(public_key_base58);
      const publicKey = await crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        { name: 'Ed25519' },
        false,
        ['verify']
      );

      const dataBytes = new TextEncoder().encode(
        typeof payload === 'string' ? payload : JSON.stringify(payload)
      );
      const signatureBytes = base58Decode(signature);

      const valid = await crypto.subtle.verify('Ed25519', publicKey, signatureBytes, dataBytes);

      return Response.json({
        valid,
        verified_at: new Date().toISOString(),
        algorithm: 'Ed25519'
      });
    }

    // ── RESOLVE ──────────────────────────────────────────────────────────────
    if (action === 'resolve') {
      const { did } = body;
      if (!did || !did.startsWith('did:rwa:')) {
        return Response.json({ error: 'Valid did:rwa:<key> required' }, { status: 400 });
      }

      const pubKeyBase58 = did.replace('did:rwa:', '');
      let publicKeyBytes;
      try {
        publicKeyBytes = base58Decode(pubKeyBase58);
      } catch {
        return Response.json({ error: 'Invalid DID format' }, { status: 400 });
      }

      const didDocument = buildDIDDocument(did, publicKeyBytes, new Date().toISOString());
      return Response.json({ did, did_document: didDocument });
    }

    return Response.json({ error: `Unknown action: ${action}. Use: generate, sign, verify, resolve` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});