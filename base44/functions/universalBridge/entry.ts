/**
 * universalBridge
 * Universal Bridge Logic — replaces the fixed XRP-only flow with
 * deterministic multi-rail universal routing.
 *
 * Flow: Normalize → Seed → Token → Evaluate Rails → Select Rail
 *       → Execute Lifecycle → Generate Universal Receipt
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function sha256Hex(data) {
  const bytes = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function rand() { return Math.random().toString(36).substr(2, 8).toUpperCase(); }

// ── Step 1: Normalize ──────────────────────────────────────────────────────────
function normalizeInstruction(body) {
  const now = new Date().toISOString();
  let amount, currency, sender, receiver, instruction_id;

  if (body.instruction) {
    const i = body.instruction;
    amount = parseFloat(i.amount) || 0;
    currency = i.currency || 'USD';
    sender = i.sender || 'UNKNOWN_SENDER';
    receiver = i.receiver || 'UNKNOWN_RECEIVER';
    instruction_id = i.instruction_id || `ISO-${Date.now()}`;
  } else if (body.iso20022_xml) {
    const get = (tag) => {
      const m = body.iso20022_xml.match(new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]+)<`));
      return m ? m[1].trim() : '';
    };
    amount = parseFloat(get('InstdAmt') || get('Amt') || 0);
    currency = get('Ccy') || 'USD';
    sender = get('Dbtr') || get('InitgPty') || 'UNKNOWN_SENDER';
    receiver = get('Cdtr') || 'UNKNOWN_RECEIVER';
    instruction_id = get('InstrId') || get('EndToEndId') || `ISO-${Date.now()}`;
  } else {
    amount = parseFloat(body.amount) || 0;
    currency = body.currency || 'USD';
    sender = body.sender || 'UNKNOWN_SENDER';
    receiver = body.receiver || 'UNKNOWN_RECEIVER';
    instruction_id = body.instruction_id || `ISO-${Date.now()}`;
  }

  return { amount, currency, sender, receiver, instruction_id, timestamp: now };
}

// ── Step 4: Deterministic Evaluation ──────────────────────────────────────────
function scoreRails(rails) {
  const costs = rails.map(r => r.cost ?? 0);
  const speeds = rails.map(r => r.speed ?? 0);
  const minCost = Math.min(...costs), maxCost = Math.max(...costs);
  const maxSpeed = Math.max(...speeds) || 1;
  // Fixed weights → deterministic: same rails → same scores → same selection
  const W = { cost: 0.20, speed: 0.25, liquidity: 0.20, compliance: 0.20, finality: 0.15 };

  return rails.map(r => {
    const costScore = maxCost === minCost ? 1 : (maxCost - (r.cost ?? 0)) / (maxCost - minCost);
    const speedScore = (r.speed ?? 0) / maxSpeed;
    const liquidityScore = (r.liquidity ?? 0) / 100;
    const complianceScore = (r.compliance ?? 0) / 100;
    const finalityScore = (r.finality ?? 0) / 100;
    const score = W.cost * costScore + W.speed * speedScore + W.liquidity * liquidityScore
      + W.compliance * complianceScore + W.finality * finalityScore;
    return {
      rail_id: r.rail_id, name: r.name, lifecycle_handler: r.lifecycle_handler,
      cost: r.cost, speed: r.speed, liquidity: r.liquidity, compliance: r.compliance, finality: r.finality,
      score: Math.round(score * 10000) / 10000,
      breakdown: {
        cost: Math.round(costScore * 1000) / 1000,
        speed: Math.round(speedScore * 1000) / 1000,
        liquidity: Math.round(liquidityScore * 1000) / 1000,
        compliance: Math.round(complianceScore * 1000) / 1000,
        finality: Math.round(finalityScore * 1000) / 1000
      }
    };
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── List rails (scored) ──────────────────────────────────────────────────
    if (action === 'list_rails') {
      const rails = await base44.asServiceRole.entities.Rail.filter({ is_active: true });
      const scored = scoreRails(rails).sort((a, b) => b.score - a.score);
      return Response.json({ rails: scored });
    }

    // ── List receipts ─────────────────────────────────────────────────────────
    if (action === 'list_receipts') {
      const receipts = await base44.asServiceRole.entities.UniversalReceipt.list('-created_date', 50);
      return Response.json({ receipts });
    }

    // ── Execute full bridge pipeline ──────────────────────────────────────────
    if (action === 'execute') {
      // Step 1 — Normalize
      const normalized = normalizeInstruction(body);
      const seedId = `SEED-${Date.now()}-${rand()}`;
      const seed = { seed_id: seedId, ...normalized };
      const seedHash = await sha256Hex(JSON.stringify(seed));

      // Step 2 — Tokenize (Satoshi Tokenization Machine)
      const tokenId = `UTK-${Date.now()}-${rand()}`;
      const satoshiAnchor = `SAT-${Date.now()}-${rand()}`;
      const tokenHash = await sha256Hex(seedHash + satoshiAnchor);
      const token = {
        token_id: tokenId, seed_id: seedId, token_hash: tokenHash,
        satoshi_anchor: satoshiAnchor, amount: normalized.amount, currency: normalized.currency
      };

      // Step 3 — Rail Registry
      const rails = await base44.asServiceRole.entities.Rail.filter({ is_active: true });
      if (!rails.length) return Response.json({ error: 'No active rails in registry' }, { status: 500 });

      // Step 4 — Deterministic Evaluation
      const scored = scoreRails(rails);

      // Step 5 — Rail Selection (highest deterministic score)
      const sorted = [...scored].sort((a, b) => b.score - a.score);
      const selected = sorted[0];

      // Step 6 — Lifecycle Execution (per-rail handler)
      let lifecycle = null;
      try {
        const res = await base44.functions.invoke('railLifecycle', {
          rail_id: selected.rail_id, token, seed
        });
        lifecycle = res.data || res;
      } catch (e) {
        lifecycle = { lifecycle_id: `LIFE-FAILED-${Date.now()}`, settlement_proof: null, status: 'failed', error: e.message };
      }

      // Step 7 — Universal Receipt
      const receiptId = `URCT-${Date.now()}-${rand()}`;
      const receipt = await base44.asServiceRole.entities.UniversalReceipt.create({
        receipt_id: receiptId,
        seed_id: seedId,
        token_id: tokenId,
        selected_rail: selected.name,
        rail_score: selected.score,
        lifecycle_id: lifecycle.lifecycle_id || null,
        settlement_proof: lifecycle.settlement_proof || null,
        amount: normalized.amount,
        currency: normalized.currency,
        sender: normalized.sender,
        receiver: normalized.receiver,
        instruction_id: normalized.instruction_id,
        status: lifecycle.status === 'failed' ? 'failed' : 'settled'
      });

      // Step 8 — Flow Summary returned to caller
      return Response.json({
        flow: 'Normalize → Seed → Token → Evaluate Rails → Select Rail → Execute Lifecycle → Generate Universal Receipt',
        seed,
        seed_hash: seedHash,
        token,
        scored_rails: sorted,
        selected_rail: selected,
        lifecycle,
        receipt
      });
    }

    return Response.json({
      error: `Unknown action: ${action}`,
      valid_actions: ['execute', 'list_rails', 'list_receipts']
    }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});