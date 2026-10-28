# TreasuryOS for Creators & Small SaaS

A minimal treasury dashboard that lets creators and small SaaS founders receive USDC on Arc, auto-split it into Operating / Tax / Savings buckets, and pay contractors — all from one dashboard.

Built with [Arc Studio](https://studio.arc.io)

---

## Tech Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** — Arc Light design system
- **wagmi v2 + viem + ConnectKit** — wallet connection and onchain reads/writes
- **Solidity (Foundry)** — TreasurySplitter.sol, deployable on Arc Testnet or Arc Mainnet

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with wallet connect CTA |
| `/dashboard` | Overview: balances, quick actions, activity feed |
| `/dashboard/buckets` | Bucket balances, distribute form, config editor |
| `/dashboard/payments` | Fund contractor pool, pay contractor form |
| `/dashboard/settings` | Contract address, chain, owner info |
| `/pay?to=0x...&amount=10` | Shareable payment link — anyone can pay you USDC on Arc |

---

## Development

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Foundry (`forge`) for contract compilation and deployment

### Install

```bash
bun install
```

### Environment Variables

Copy `env.example` to `.env` and fill in your values.

| Variable | Purpose | Required |
|---|---|---|
| `VITE_ARC_NETWORK` | `testnet` (default) or `mainnet` — flips all chain config at once | No |
| `VITE_TREASURY_SPLITTER_TESTNET` | TreasurySplitter address on Arc Testnet | No (testnet already deployed) |
| `VITE_TREASURY_SPLITTER_MAINNET` | TreasurySplitter address on Arc Mainnet — fill after `forge create` | No |
| `VITE_WC_PROJECT_ID` | WalletConnect Cloud project ID — enables mobile wallets | Yes for mobile |
| `VITE_CLIENT_KEY` | Circle Console Client Key — enables passkey wallet connection | No |
| `VITE_CLIENT_URL` | Circle API URL (default `https://api.circle.com`) | No |
| `VITE_APP_URL` | Your deployed app URL — used for shareable payment links | Yes (set to Vercel URL) |
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy | Optional outside Arc Studio |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy token | Optional outside Arc Studio |
| `RPC_PROXY_CHAINS` | Comma-separated chain keys for the proxy | Optional outside Arc Studio |

**To switch networks**, change one line in `.env` and restart the dev server:
```
VITE_ARC_NETWORK=mainnet   # → Arc Mainnet (chain 5042, real USDC)
VITE_ARC_NETWORK=testnet   # → Arc Testnet (chain 5042002, free testnet USDC)
```

### Run locally

```bash
bun run dev
```

### Build

```bash
bun run build
```

---

## Smart Contract

### TreasurySplitter.sol

Located at `contracts/TreasurySplitter.sol`. Key functions:

- `distribute(amountUSDC)` — pulls USDC from caller, splits to configured buckets
- `depositForContractors(amountUSDC)` — deposits USDC into the contract for contractor payments
- `payContractor(to, amountUSDC)` — owner-only: transfers USDC from contract to a contractor
- `updateBucketConfig(buckets, percentages)` — owner-only: update bucket splits (basis points, must sum to 10000)
- `getBuckets()` — returns current bucket addresses and percentages

### Deploy TreasurySplitter

```bash
# Build the contract
bun run contracts:build
```

Constructor args (in order):
1. `_usdc` — USDC ERC-20 address on the target chain (`0x3600000000000000000000000000000000000000` on both Arc Testnet and Mainnet)
2. `_owner` — your wallet address (must own the contract to call `payContractor` and `updateBucketConfig`)
3. `_buckets` — array of 2–5 wallet addresses (e.g. `["0xOperating","0xTax","0xSavings"]`)
4. `_percentages` — basis points per bucket, must sum to 10000 (e.g. `[5000,3000,2000]`)

**Arc Testnet** (already deployed — use for development):
```
VITE_ARC_NETWORK=testnet
VITE_TREASURY_SPLITTER_TESTNET=0x17ba9334e74b537ed0729b829331719dd2039d3d
```

**Arc Mainnet** (deploy from your own wallet — involves real USDC):

> **Warning:** Arc Mainnet uses real USDC. Independently review and test on testnet before deploying. You are solely responsible for the deployment and its operation.

```bash
forge create contracts/TreasurySplitter.sol:TreasurySplitter \
  --rpc-url https://rpc.mainnet.arc.io \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    0x3600000000000000000000000000000000000000 \
    $YOUR_OWNER_ADDRESS \
    "[0xOperating,0xTax,0xSavings]" \
    "[5000,3000,2000]" \
  --broadcast
```

Then update `.env`:
```
VITE_ARC_NETWORK=mainnet
VITE_TREASURY_SPLITTER_MAINNET=<your deployed mainnet address>
```

Restart the dev server after any `.env` change — Vite reads env files only at startup.

### Default Bucket Setup (example)

```
Operating: 0xYourOperatingAddress — 5000 bps (50%)
Tax:        0xYourTaxAddress       — 3000 bps (30%)
Savings:    0xYourSavingsAddress   — 2000 bps (20%)
```

You can use separate wallet addresses (or the same address) for each bucket. Update them any time via the Buckets → Edit config panel.

---

## Limitations (MVP)

This is a hackathon MVP — no KYC, fiat off-ramp, multi-user auth, or production security hardening. Audit before using with real funds.
