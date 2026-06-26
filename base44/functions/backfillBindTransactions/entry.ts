/**
 * backfillBindTransactions
 * Scans all AssetRecords and creates a Transaction record for any that
 * don't have one yet. Fixes the "VERIFYING HASH CHAIN..." hang in the
 * Decrypt Engine for assets bound before the ensureBindTransaction
 * automation was active.
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
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const assets = await base44.asServiceRole.entities.AssetRecord.list('-created_date', 500);
    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const record of assets) {
      try {
        const existing = await base44.asServiceRole.entities.Transaction.filter({ asset_id: record.asset_id });
        if (existing.length > 0) { skipped++; continue; }

        const now = new Date().toISOString();
        const txId = `TX-BIND-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        const prevTxs = await base44.asServiceRole.entities.Transaction.list('-created_date', 1);
        const prevHash = prevTxs[0]?.transaction_hash || '0'.repeat(64);
        const assetHash = await sha256Hex(JSON.stringify({ asset_id: record.asset_id, owner_did: record.owner_did }));
        const txHash = await sha256Hex(`${txId}${record.asset_id}${record.owner_did || ''}${prevHash}${now}`);

        await base44.asServiceRole.entities.Transaction.create({
          transaction_id: txId,
          transaction_type: 'asset_created',
          asset_id: record.asset_id,
          previous_hash: prevHash,
          transaction_hash: txHash,
          merkle_root: await sha256Hex([txHash, assetHash].join('')),
          payload: { asset_id: record.asset_id, owner_did: record.owner_did, encrypted: record.is_encrypted, backfilled: true },
          signed_by: record.owner_did,
          status: 'confirmed',
          confirmations: 1,
        });
        created++;
      } catch (e) {
        errors.push({ asset_id: record.asset_id, error: e.message });
      }
    }

    return Response.json({
      success: true,
      total_assets: assets.length,
      transactions_created: created,
      transactions_already_present: skipped,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});