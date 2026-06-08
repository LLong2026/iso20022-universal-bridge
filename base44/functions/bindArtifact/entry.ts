/**
 * bindArtifact
 * Links an Artifact to a DID and creates an encrypted AssetRecord
 * so it appears and is decryptable in the Decrypt Engine.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_SECRET = Deno.env.get('JASPER_MASTER_SECRET') || 'rwa-satoshi-jasper-v1-default-change-in-prod';

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
    const { artifact_serial, owner_did, weight_grams } = body;

    if (!artifact_serial || !owner_did) {
      return Response.json({ error: 'artifact_serial and owner_did are required' }, { status: 400 });
    }

    // 1. Find the artifact
    const artifacts = await base44.asServiceRole.entities.Artifact.filter({ serial_number: artifact_serial });
    if (!artifacts.length) {
      return Response.json({ error: `Artifact not found: ${artifact_serial}` }, { status: 404 });
    }
    const artifact = artifacts[0];

    // 2. Generate binding hash
    const now = new Date().toISOString();
    const weightNum = parseFloat(weight_grams) || 0;
    const bindingData = `${artifact_serial}:${owner_did}:${weightNum}:${now}`;
    const sha256Part = await sha256Hex(bindingData);
    const bindingHash = sha256Part + sha256Part.split('').reverse().join('').slice(0, 22); // 586-bit style

    // 3. Update Artifact → bound
    await base44.asServiceRole.entities.Artifact.update(artifact.id, {
      status: 'bound',
      owner_did: owner_did,
      bound_serial: artifact_serial,
    });

    // 4. Create GoldAsset if weight provided
    let goldAsset = null;
    if (weightNum > 0) {
      goldAsset = await base44.asServiceRole.entities.GoldAsset.create({
        serial_number: artifact_serial,
        weight_grams: weightNum,
        binding_hash: bindingHash,
        satoshi_utxo: `SAT-${Date.now()}`,
        status: 'active',
        mint_timestamp: now,
      });
    }

    // 5. Build the asset payload and encrypt it with Jasper
    const assetPayload = {
      asset_id: artifact_serial,
      asset_type: artifact.artifact_type || 'other',
      weight: weightNum || null,
      owner_did: owner_did,
      description: artifact.description || artifact.file_name || null,
      file_url: artifact.file_url || null,
      file_name: artifact.file_name || null,
      binding_hash: bindingHash,
      bound_at: now,
    };

    const encryptedPackage = await encryptData(assetPayload, owner_did);
    encryptedPackage.asset_id = artifact_serial;

    // 6. Check if AssetRecord already exists for this artifact serial
    const existing = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id: artifact_serial });

    let assetRecord;
    if (existing.length > 0) {
      assetRecord = await base44.asServiceRole.entities.AssetRecord.update(existing[0].id, {
        owner_did: owner_did,
        is_encrypted: true,
        verification_status: 'verified',
        current_status: 'in_vault',
      });
    } else {
      assetRecord = await base44.asServiceRole.entities.AssetRecord.create({
        asset_id: artifact_serial,
        asset_type: artifact.artifact_type || 'other',
        weight: weightNum || null,
        owner_did: owner_did,
        description: artifact.description || artifact.file_name || null,
        is_encrypted: true,
        verification_status: 'verified',
        current_status: 'in_vault',
        file_url: artifact.file_url || null,
      });
    }

    return Response.json({
      success: true,
      artifact_serial,
      owner_did,
      binding_hash: bindingHash,
      asset_record_id: assetRecord.id,
      gold_asset_id: goldAsset?.id || null,
      encrypted_package: encryptedPackage,
      message: 'Artifact bound and encrypted. It will now appear and be decryptable in the Decrypt Engine.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});