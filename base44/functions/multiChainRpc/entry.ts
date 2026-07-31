import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const RPC_ENDPOINTS: Record<string, string> = {
  ethereum: process.env.ETH_RPC_URL || "https://ethereum.publicnode.com",
  bitcoin: process.env.BTC_RPC_URL || "https://mempool.space/api",
  xrpl: process.env.XRP_RPC_URL || "https://xrplcluster.com",
  solana: process.env.SOL_RPC_URL || "https://solana-rpc.publicnode.com",
  stellar: process.env.STELLAR_RPC_URL || "https://horizon.stellar.org",
};

async function ethereumRpc(method: string, params: any[] = [], id = 1) {
  const response = await fetch(RPC_ENDPOINTS.ethereum, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id }),
  });
  return response.json();
}

async function bitcoinRpc(method: string, params: any[] = []) {
  const baseUrl = RPC_ENDPOINTS.bitcoin;
  const methodMap: Record<string, string> = {
    "getblockcount": "/blocks/tip/height",
    "getbestblockhash": "/blocks/tip/hash",
    "getblockhash": "/block-height/" + (params[0] || 0),
    "getblock": "/block/" + (params[0] || ""),
    "getrawtransaction": "/tx/" + (params[0] || ""),
    "getaddressinfo": "/address/" + (params[0] || ""),
    "getbalance": "/address/" + (params[0] || "") + "/balance",
    "getmempoolinfo": "/mempool",
  };
  const isPost = method === "sendrawtransaction";
  if (isPost) {
    const response = await fetch(baseUrl + "/tx", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: params[0] || "",
    });
    return { result: await response.text(), error: response.ok ? undefined : { code: response.status, message: await response.text() } };
  }
  const endpoint = methodMap[method] || "/" + method;
  const response = await fetch(baseUrl + endpoint);
  if (!response.ok) {
    return { result: null, error: { code: response.status, message: "Bitcoin RPC error: " + response.statusText } };
  }
  const contentType = response.headers.get("content-type") || "";
  return { result: contentType.includes("json") ? await response.json() : await response.text() };
}

async function xrplRpc(method: string, params: any[] = []) {
  const response = await fetch(RPC_ENDPOINTS.xrpl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: params.length > 0 ? params : [{}] }),
  });
  const data = await response.json();
  return {
    jsonrpc: "2.0", id: 1,
    result: data.result,
    error: data.error ? { code: data.error_code || -1, message: data.error_message || data.error } : undefined,
  };
}

async function solanaRpc(method: string, params: any[] = [], id = 1) {
  const response = await fetch(RPC_ENDPOINTS.solana, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id }),
  });
  return response.json();
}

async function stellarRpc(method: string, params: any[] = []) {
  const baseUrl = RPC_ENDPOINTS.stellar;
  let url: string;
  if (method === "ledgers" || method === "transactions" || method === "operations" || method === "payments" || method === "effects") {
    const query = params[0] ? "?" + params[0] : "?limit=1";
    url = baseUrl + "/" + method + query;
  } else if (params[0]) {
    url = baseUrl + "/" + method + "/" + params[0];
  } else {
    url = baseUrl + "/" + method;
  }
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    return { result: null, error: { code: response.status, message: "Stellar RPC error: " + text } };
  }
  return { result: await response.json() };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const body = await req.json();
    const chain = body.chain;
    const method = body.method;
    const params = body.params || [];
    const id = body.id || 1;
    if (!chain || !method) {
      return Response.json({ error: "Missing required fields: chain, method" }, { status: 400 });
    }
    let result: any;
    const startTime = Date.now();
    switch (chain) {
      case "ethereum": result = await ethereumRpc(method, params, id); break;
      case "bitcoin": result = await bitcoinRpc(method, params); break;
      case "xrpl": result = await xrplRpc(method, params); break;
      case "solana": result = await solanaRpc(method, params, id); break;
      case "stellar": result = await stellarRpc(method, params); break;
      default: return Response.json({ error: "Unsupported chain: " + chain }, { status: 400 });
    }
    const latencyMs = Date.now() - startTime;
    return Response.json({
      chain: chain, method: method, latency_ms: latencyMs,
      endpoint: RPC_ENDPOINTS[chain],
      response: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ error: "RPC handler error: " + err.message }, { status: 500 });
  }
});