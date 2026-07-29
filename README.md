# ISO20022 Universal Bridge

Patent-pending multi-rail settlement system (U.S. Patent Application No. 19/693,343) — ISO 20022, Bitcoin Taproot, XRP Ledger, and wholesale CBDC.

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21450025-blue)](https://doi.org/10.5281/zenodo.21450025)
![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)

---

## Overview
The ISO20022 Universal Bridge provides deterministic cross-ledger settlement alignment between traditional banking rails (ISO 20022 pacs.008) and blockchain networks (Bitcoin Taproot, XRP Ledger, wholesale CBDC). Features include:
- Semantic tokenization with meaning-preserving identity resolution
- Post-quantum signature verification (CRYSTALS-Dilithium3, Kyber-1024, SPHINCS+-256f)
- ThreadZero audit trail with hash-chain integrity
- Squirrel OS v1.1 self-healing (15 entities, 60 repair playbooks)

## Repository Structure

```
/
├── README.md              # This file
├── LICENSE                # All Rights Reserved
├── .github/FUNDING.yml    # Sponsor config
├── .github/workflows/     # CI pipeline
├── base44/                # Base44 app config (entities, agents, connectors, workflows)
├── src/                   # React frontend source
├── package.json           # Dependencies
├── vite.config.js         # Build config
└── ...                    # Standard JS tooling config
```

## Local Development
```bash
npm install
cp .env.example .env.local  # Set your Base44 app credentials
npm run dev
```

## Patent Coverage
- **19/693,343** — ISO 20022 cross-chain settlement (full application)
- **64/114,746** — Jasper universal adaptive intelligence orchestration
- **64/119,191** — Deterministically governed probabilistic neural mesh

## Licensing
All works are **All Rights Reserved**. Commercial use requires a license agreement.

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | Read-only access |
| Licensed | $25,000 | Full implementation rights |
| SaaS | $2,500/mo | Hosted integration + support |
