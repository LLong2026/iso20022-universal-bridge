import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_grams, sender, receiver } = await req.json();

    if (!amount_grams || !sender || !receiver) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const startTime = Date.now();
    const txId = 'LSL-' + Math.floor(Math.random() * 999999);

    // Get active UTXO
    const utxos = await base44.entities.SatoshiUTXO.filter({ status: 'queued' }, '-created_date', 1);
    const currentUtxo = utxos[0];

    if (!currentUtxo) {
      return Response.json({ error: 'No UTXO available' }, { status: 400 });
    }

    // Generate ISO 20022 XML
    const timestamp = new Date().toISOString();
    const iso20022Xml = `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${txId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <SttlmInf>
        <SttlmMtd>XRP_LEDGER</SttlmMtd>
        <ClrSys><Cd>XRPL</Cd></ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <IntrBkSttlmAmt Ccy="XAU">${amount_grams}.00</IntrBkSttlmAmt>
      <XrpBridge>
        <UTXO>${currentUtxo.utxo_id}</UTXO>
        <NetworkFee>0.00001 XRP</NetworkFee>
      </XrpBridge>
      <Dbtr><Nm>${sender}</Nm></Dbtr>
      <Cdtr><Nm>${receiver}</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

    // Simulate XRP settlement (in production, this would call XRPL SDK)
    const settlementTime = Date.now() - startTime + 3200; // Simulate 3.2s settlement
    const xrpTxHash = '0xXRPL' + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Update UTXO status
    await base44.entities.SatoshiUTXO.update(currentUtxo.id, {
      status: 'used',
      last_used: new Date().toISOString()
    });

    // Create new UTXO for next transaction
    const newUtxoId = 'SAT-' + Math.floor(Math.random() * 999999);
    await base44.entities.SatoshiUTXO.create({
      utxo_id: newUtxoId,
      status: 'queued'
    });

    // Log transaction
    const transaction = await base44.entities.LedgerTransaction.create({
      transaction_id: txId,
      type: 'TRANSFER',
      amount_grams,
      sender,
      receiver,
      satoshi_utxo: currentUtxo.utxo_id,
      xrp_ledger_index: xrpTxHash,
      iso20022_xml: iso20022Xml,
      status: 'settled',
      settlement_time_ms: settlementTime
    });

    return Response.json({
      success: true,
      transaction,
      usedUtxo: currentUtxo.utxo_id,
      nextUtxo: newUtxoId,
      settlementTimeMs: settlementTime,
      xrpTxHash
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});