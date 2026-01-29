import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serial_number, weight_grams } = await req.json();

    if (!serial_number || !weight_grams) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate 586-bit binding hash (using SHA-512 + additional entropy)
    const timestamp = Date.now();
    const entropy = crypto.randomUUID();
    const dataString = `${serial_number}:${weight_grams}:${timestamp}:${entropy}`;
    
    const hash1 = createHash('sha512').update(dataString).digest('hex');
    const hash2 = createHash('sha256').update(hash1 + entropy).digest('hex');
    const bindingHash = '0x' + hash1 + hash2.substring(0, 20);

    // Generate new Satoshi UTXO
    const utxoId = 'SAT-' + Math.floor(Math.random() * 999999);
    
    // Create UTXO record
    await base44.entities.SatoshiUTXO.create({
      utxo_id: utxoId,
      status: 'queued',
      bound_gold_weight: weight_grams
    });

    // Create Gold Asset
    const goldAsset = await base44.entities.GoldAsset.create({
      serial_number,
      weight_grams,
      binding_hash: bindingHash,
      satoshi_utxo: utxoId,
      status: 'active',
      mint_timestamp: new Date().toISOString()
    });

    // Log to ledger
    await base44.entities.LedgerTransaction.create({
      transaction_id: `MINT-${timestamp}`,
      type: 'MINT',
      amount_grams: weight_grams,
      satoshi_utxo: utxoId,
      status: 'settled'
    });

    return Response.json({
      success: true,
      goldAsset,
      bindingHash,
      utxoId
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});