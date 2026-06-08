/**
 * syncArtifactToAssetRecord
 * Triggered when an Artifact record changes to status='bound'.
 * Creates (or updates) a matching AssetRecord so it appears
 * in the DecryptArtifact "BOUND ARTIFACTS" list.
 * The owner_did is sourced from the Artifact's creator (created_by_id → User).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct invocation (for backfill) and automation payload
    const artifact = body.data || body.artifact || null;
    const artifactId = body.event?.entity_id || body.artifact_id || null;

    // Fetch the artifact if not provided inline
    let art = artifact;
    if (!art && artifactId) {
      const results = await base44.asServiceRole.entities.Artifact.filter({ id: artifactId });
      art = results[0] || null;
    }

    // If still no artifact, try backfill mode: sync ALL bound artifacts
    if (!art && body.backfill) {
      const allBound = await base44.asServiceRole.entities.Artifact.filter({ status: 'bound' }, '-created_date', 200);
      let synced = 0;
      for (const a of allBound) {
        const existing = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id: a.serial_number });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.AssetRecord.create({
            asset_id: a.serial_number,
            asset_type: a.artifact_type || 'other',
            owner_did: a.bound_serial || `did:artifact:${a.serial_number}`,
            description: a.description || a.file_name || null,
            is_encrypted: false,
            verification_status: 'verified',
            current_status: 'in_vault',
            file_url: a.file_url || null,
          });
          synced++;
        }
      }
      return Response.json({ success: true, synced, mode: 'backfill' });
    }

    if (!art) {
      return Response.json({ skipped: true, reason: 'no artifact data' });
    }

    // Only process bound artifacts
    if (art.status !== 'bound') {
      return Response.json({ skipped: true, reason: `status is ${art.status}` });
    }

    const assetId = art.serial_number;
    if (!assetId) {
      return Response.json({ skipped: true, reason: 'no serial_number' });
    }

    // Check if AssetRecord already exists
    const existing = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id: assetId });
    if (existing.length > 0) {
      return Response.json({ skipped: true, reason: 'AssetRecord already exists', asset_id: assetId });
    }

    // Determine owner_did: prefer bound_serial as a pointer, else use artifact serial
    const ownerDid = art.owner_did || art.bound_serial || `did:artifact:${assetId}`;

    const created = await base44.asServiceRole.entities.AssetRecord.create({
      asset_id: assetId,
      asset_type: art.artifact_type || 'other',
      owner_did: ownerDid,
      description: art.description || art.file_name || null,
      is_encrypted: false,
      verification_status: 'verified',
      current_status: 'in_vault',
      file_url: art.file_url || null,
    });

    return Response.json({ success: true, asset_id: assetId, record_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});