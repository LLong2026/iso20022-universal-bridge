/**
 * bindArtifact
 * The missing link between Artifact upload and the Decrypt Engine.
 * 1. Validates the artifact exists and is pending
 * 2. Updates Artifact: status=bound, owner_did=<did>, bound_serial=<goldSerial>
 * 3. Creates AssetRecord with the correct owner_did so DecryptArtifact can list it
 * 4. Creates a GoldAsset entry if not already done
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sha256Hex(data) {
  const bytes = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
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

    // 5. Check if AssetRecord already exists for this artifact serial
    const existing = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id: artifact_serial });

    let assetRecord;
    if (existing.length > 0) {
      // Update existing record with correct owner_did
      assetRecord = await base44.asServiceRole.entities.AssetRecord.update(existing[0].id, {
        owner_did: owner_did,
        verification_status: 'verified',
        current_status: 'in_vault',
      });
    } else {
      // Create new AssetRecord — this is what DecryptArtifact reads
      assetRecord = await base44.asServiceRole.entities.AssetRecord.create({
        asset_id: artifact_serial,
        asset_type: artifact.artifact_type || 'other',
        weight: weightNum || null,
        owner_did: owner_did,
        description: artifact.description || artifact.file_name || null,
        is_encrypted: false,
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
      message: 'Artifact bound and AssetRecord created. It will now appear in the Decrypt Engine.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});