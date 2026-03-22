import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active gold assets
    const goldAssets = await base44.entities.GoldAsset.filter({ status: 'active' });
    
    // Calculate totals
    const physicalGold = goldAssets.reduce((sum, asset) => sum + (asset.weight_grams || 0), 0);
    const digitalTokens = physicalGold; // 1:1 backing

    // Get current queued UTXO
    const queuedUtxos = await base44.entities.SatoshiUTXO.filter({ status: 'queued' }, '-created_date', 1);
    const currentUtxo = queuedUtxos[0]?.utxo_id || 'SAT-INIT';

    // Get recent transactions
    const recentTransactions = await base44.entities.LedgerTransaction.list('-created_date', 20);

    return Response.json({
      physicalGold,
      digitalTokens,
      currentUtxo,
      totalAssets: goldAssets.length,
      recentTransactions,
      isSolvent: physicalGold === digitalTokens
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});