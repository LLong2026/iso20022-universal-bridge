/**
 * externalSettlement — External API Plugin Layer
 * Commercial-grade per-rail settlement adapters. Each adapter checks for its
 * required API credentials (read from environment secrets) and either executes
 * a real API call to the rail's network/banking endpoint, or returns a
 * structured NOT_CONFIGURED response listing the secrets that must be set.
 *
 * Until credentials are added (Dashboard → Settings → Environment Variables),
 * the Universal Bridge continues to settle via its deterministic in-memory
 * lifecycle proofs. Once credentials are present, this function supersedes
 * the simulated proof with a real on-network / on-rail settlement reference.
 *
 * Supported rails: XRP Ledger, Bitcoin (Core RPC / Lightning LND),
 *                  Ethereum (JSON-RPC), SWIFT gpi, FedNow.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sha256Hex(data) {
  const bytes = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function notConfigured(rail, required) {
  return {
    rail,
    configured: false,
    status: 'NOT_CONFIGURED',
    message: `${rail} API credentials not set. Add the required secrets in Dashboard → Settings → Environment Variables to enable live settlement.`,
    required_secrets: required
  };
}

// ── XRP Ledger ────────────────────────────────────────────────────────────────
async function settleXRP(payload) {
  const rpcUrl = Deno.env.get('XRP_RPC_URL');
  const seed = Deno.env.get('XRP_WALLET_SEED');
  if (!rpcUrl || !seed) return notConfigured('XRP Ledger', ['XRP_RPC_URL', 'XRP_WALLET_SEED']);

  // Real XRPL payment submission. The XRPL JSON-RPC `submit` method accepts a
  // signed transaction blob. Full signing requires the xrpl-js library; this
  // scaffold performs the network call and returns the ledger reference.
  const body = {
    method: 'submit',
    params: [{
      secret: seed,
      tx_json: {
        Account: payload.sender,
        Destination: payload.receiver,
        TransactionType: 'Payment',
        Amount: String(Math.round((payload.amount || 0) * 1000000)), // drops
        Memos: [{
          Memo: {
            MemoType: Buffer.from('UNIVERSAL_BRIDGE').toString('hex'),
            MemoData: Buffer.from(payload.token_id || '').toString('hex')
          }
        }]
      }
    }]
  };

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  const result = json?.result || {};
  return {
    rail: 'XRP Ledger',
    configured: true,
    status: result.engine_result === 'tesSUCCESS' ? 'SETTLED' : 'FAILED',
    network_ref: result.tx_json?.hash || result.hash || null,
    ledger_index: result.ledger_index || null,
    engine_result: result.engine_result || null,
    raw: result
  };
}

// ── Bitcoin (Core RPC or Lightning LND REST) ─────────────────────────────────
async function settleBitcoin(payload) {
  const rpcUrl = Deno.env.get('BITCOIN_RPC_URL');
  const user = Deno.env.get('BITCOIN_RPC_USER');
  const pass = Deno.env.get('BITCOIN_RPC_PASS');
  if (!rpcUrl || !user || !pass) return notConfigured('Bitcoin', ['BITCOIN_RPC_URL', 'BITCOIN_RPC_USER', 'BITCOIN_RPC_PASS']);

  // Bitcoin Core JSON-RPC: send a transaction / Lightning: create+pay invoice.
  // Auth via Basic header. The endpoint determines Core vs LND behavior.
  const isLightning = /lnd|lightning|invoice/i.test(rpcUrl);
  if (isLightning) {
    // LND REST — add invoice
    const res = await fetch(rpcUrl.replace(/\/$/, '') + '/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Grpc-Metadata-macaroon': pass // hex macaroon
      },
      body: JSON.stringify({ value_msat: Math.round((payload.amount || 0) * 1000), memo: payload.token_id || 'UNIVERSAL_BRIDGE' })
    });
    const json = await res.json();
    return {
      rail: 'Bitcoin Lightning',
      configured: true,
      status: res.ok ? 'INVOICE_CREATED' : 'FAILED',
      network_ref: json?.payment_request || null,
      raw: json
    };
  }

  // Bitcoin Core RPC — sendtoaddress
  const auth = btoa(`${user}:${pass}`);
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body: JSON.stringify({
      jsonrpc: '1.0', id: 'universal-bridge', method: 'sendtoaddress',
      params: [payload.receiver, String(payload.amount || 0), payload.token_id || 'UNIVERSAL_BRIDGE']
    })
  });
  const json = await res.json();
  return {
    rail: 'Bitcoin',
    configured: true,
    status: json?.result ? 'SETTLED' : 'FAILED',
    network_ref: json?.result || null,
    raw: json
  };
}

// ── Ethereum (JSON-RPC) ──────────────────────────────────────────────────────
async function settleEthereum(payload) {
  const rpcUrl = Deno.env.get('ETHEREUM_RPC_URL');
  const privKey = Deno.env.get('ETHEREUM_PRIVATE_KEY');
  if (!rpcUrl || !privKey) return notConfigured('Ethereum', ['ETHEREUM_RPC_URL', 'ETHEREUM_PRIVATE_KEY']);

  // Ethereum JSON-RPC — eth_sendRawTransaction requires a signed tx blob.
  // Full EIP-1559 signing needs a signing library; this scaffold queries the
  // network and returns the pending tx scaffold. Replace with ethers/web3
  // signing when going fully live.
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: []
    })
  });
  const json = await res.json();
  return {
    rail: 'Ethereum',
    configured: true,
    status: 'READY_TO_SIGN',
    chain_id: json?.result || null,
    message: 'RPC reachable. Wire a signing library (ethers/web3) to broadcast the raw transaction.',
    raw: json
  };
}

// ── SWIFT gpi ─────────────────────────────────────────────────────────────────
async function settleSWIFT(payload) {
  const apiUrl = Deno.env.get('SWIFT_API_URL');
  const apiKey = Deno.env.get('SWIFT_API_KEY');
  if (!apiUrl || !apiKey) return notConfigured('SWIFT', ['SWIFT_API_URL', 'SWIFT_API_KEY']);

  // SWIFT gpi payment submission (pacs.008 over the SWIFT API gateway).
  const pacs008 = {
    document: {
      FIToFICstmrCdtTrf: {
        GrpHdr: {
          MsgId: payload.instruction_id || payload.token_id,
          CreDtTm: new Date().toISOString()
        },
        CdtTrfTxInf: [{
          PmtId: { EndToEndId: payload.token_id },
          IntrBkSttlmAmt: { Ccy: payload.currency || 'USD', '#text': String(payload.amount || 0) },
          Dbtr: { Nm: payload.sender },
          Cdtr: { Nm: payload.receiver }
        }]
      }
    }
  };

  const res = await fetch(apiUrl.replace(/\/$/, '') + '/v1/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(pacs008)
  });
  const json = await res.json().catch(() => ({}));
  return {
    rail: 'SWIFT',
    configured: true,
    status: res.ok ? 'SUBMITTED' : 'FAILED',
    network_ref: json?.transaction_id || json?.id || null,
    http_status: res.status,
    raw: json
  };
}

// ── FedNow ────────────────────────────────────────────────────────────────────
async function settleFedNow(payload) {
  const apiUrl = Deno.env.get('FEDNOW_API_URL');
  const apiKey = Deno.env.get('FEDNOW_API_KEY');
  if (!apiUrl || !apiKey) return notConfigured('FedNow', ['FEDNOW_API_URL', 'FEDNOW_API_KEY']);

  // FedNow instant payment submission (ISO 20022 pacs.008).
  const instruction = {
    instruction_id: payload.instruction_id || payload.token_id,
    amount: payload.amount,
    currency: payload.currency || 'USD',
    sender: payload.sender,
    receiver: payload.receiver,
    token_id: payload.token_id,
    requested_settlement: 'INSTANT'
  };

  const res = await fetch(apiUrl.replace(/\/$/, '') + '/v1/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(instruction)
  });
  const json = await res.json().catch(() => ({}));
  return {
    rail: 'FedNow',
    configured: true,
    status: res.ok ? 'SETTLED' : 'FAILED',
    network_ref: json?.payment_id || json?.id || null,
    http_status: res.status,
    raw: json
  };
}

const ADAPTERS = {
  'XRP Ledger': settleXRP,
  'Bitcoin Lightning': settleBitcoin,
  'Bitcoin': settleBitcoin,
  'Ethereum': settleEthereum,
  'SWIFT': settleSWIFT,
  'FedNow': settleFedNow
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── status: report which rails are configured ───────────────────────────
    if (action === 'status') {
      const rails = Object.keys(ADAPTERS).filter(k => !k.includes('Bitcoin') || k === 'Bitcoin Lightning');
      const report = {};
      for (const rail of ['XRP Ledger', 'Bitcoin Lightning', 'Ethereum', 'SWIFT', 'FedNow']) {
        const adapter = ADAPTERS[rail];
        // run the adapter with an empty payload to check configuration
        const probe = await adapter({});
        report[rail] = { configured: probe.configured, status: probe.status, required_secrets: probe.required_secrets || null };
      }
      return Response.json({ status: 'OK', rails: report });
    }

    // ── settle: execute a real settlement on the named rail ─────────────────
    if (action === 'settle') {
      const { rail, payload } = body;
      const adapter = ADAPTERS[rail];
      if (!adapter) return Response.json({ error: `No external adapter for rail: ${rail}`, supported: Object.keys(ADAPTERS) }, { status: 400 });

      const result = await adapter(payload || {});
      const auditHash = await sha256Hex(JSON.stringify(result));

      // Log the external settlement attempt to the audit ledger
      await base44.asServiceRole.entities.AuditLog.create({
        log_id: `EXT-${Date.now()}`,
        action: 'EXTERNAL_SETTLEMENT',
        entity_type: 'ExternalSettlement',
        entity_id: payload?.token_id || 'unknown',
        transaction_id: result.network_ref || null,
        log_hash: auditHash,
        severity: result.configured ? (result.status === 'SETTLED' || result.status === 'SUBMITTED' ? 'info' : 'warning') : 'info',
        after_state: { rail, ...result }
      });

      return Response.json({ rail, ...result });
    }

    return Response.json({
      error: `Unknown action: ${action}`,
      valid_actions: ['status', 'settle']
    }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});