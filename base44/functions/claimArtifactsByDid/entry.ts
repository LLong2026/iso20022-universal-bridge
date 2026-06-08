/**
 * claimArtifactsByDid
 * Takes the caller's DID and creates AssetRecord entries for all
 * bound Artifacts that don't yet have a matching AssetRecord.
 * This bridges the GoldAsset/Artifact flow → DecryptArtifact list.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { owner_did } = body;
    if (!owner_did) return Response.json({ error: 'owner_did required' }, { status: 400 });

    // Get all bound artifacts
    const artifacts = await base44.asServiceRole.entities.Artifact.filter({ status: 'bound' }, '-created_date', 200);

    let created = 0;
    let skipped = 0;
    const results = [];

    for (const art of artifacts) {
      const assetId = art.serial_number;
      if (!assetId) { skipped++; continue; }

      // Check if AssetRecord already exists for this serial
      const existing = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id: assetId });
      if (existing.length > 0) { skipped++; continue; }

      // Create the AssetRecord linked to the user's DID
      const rec = await base44.asServiceRole.entities.AssetRecord.create({
        asset_id: assetId,
        asset_type: art.artifact_type || 'other',
        owner_did: owner_did,
        description: art.description || art.file_name || null,
        is_encrypted: false,
        verification_status: 'verified',
        current_status: 'in_vault',
        file_url: art.file_url || null,
      });

      // Also update the Artifact to store the owner_did
      await base44.asServiceRole.entities.Artifact.update(art.id, { owner_did });

      created++;
      results.push({ asset_id: assetId, record_id: rec.id });
    }

    return Response.json({ success: true, created, skipped, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});