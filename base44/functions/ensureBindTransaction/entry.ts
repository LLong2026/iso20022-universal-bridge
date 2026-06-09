/**
 * ensureBindTransaction
 * Creates a Transaction record for a bound artifact if one doesn't exist.
 * Called automatically via entity automation when an AssetRecord is created/updated.
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
    const body = await req.json();

    // Can be called directly with asset_id, or via entity automation payload
    const assetId = body.asset_id || body.data?.asset_id || body.event?.entity_id;

    if (!assetId) {
      return Response.json({ error: 'asset_id required' }, { status: 400 });
    }

    // Load the AssetRecord
    const records = await base44.asServiceRole.entities.AssetRecord.filter({ asset_id: assetId });
    if (!records.length) {
      return Response.json({ error: 'AssetRecord not found' }, { status: 404 });
    }
    const record = records[0];

    // Check if a transaction already exists for this asset
    const existing = await base44.asServiceRole.entities.Transaction.filter({ asset_id: assetId });
    if (existing.length > 0) {
      return Response.json({ skipped: true, reason: 'Transaction already exists', transaction_id: existing[0].transaction_id });
    }

    const now = new Date().toISOString();
    const txId = `TX-BIND-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const prevTxs = await base44.asServiceRole.entities.Transaction.list('-created_date', 1);
    const prevHash = prevTxs[0]?.transaction_hash || '0'.repeat(64);
    const assetHash = await sha256Hex(JSON.stringify({ asset_id: assetId, owner_did: record.owner_did }));
    const txHash = await sha256Hex(`${txId}${assetId}${record.owner_did}${prevHash}${now}`);

    const tx = await base44.asServiceRole.entities.Transaction.create({
      transaction_id: txId,
      transaction_type: 'asset_created',
      asset_id: assetId,
      previous_hash: prevHash,
      transaction_hash: txHash,
      merkle_root: await sha256Hex([txHash, assetHash].join('')),
      payload: { asset_id: assetId, owner_did: record.owner_did, encrypted: record.is_encrypted },
      signed_by: record.owner_did,
      status: 'confirmed',
      confirmations: 1,
    });

    return Response.json({ success: true, transaction_id: txId, transaction_hash: txHash });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});