# TreasuryOS — CCTP Bridge + StableFX Swap Features

## Summary
Add two independent treasury modules to the existing TreasuryOS app: (1) CCTP cross-chain top-up to bridge USDC from Ethereum/Base/Arbitrum/Polygon into Arc, and (2) StableFX in-treasury conversion to swap USDC → EURC (or cirBTC) on Arc. Neither feature touches the existing TreasurySplitter contract.

## Architecture
- **SDK**: `@circle-fin/app-kit` + `@circle-fin/adapter-viem-v2` — one SDK for both bridge and swap
- **Wallet adapter**: `createViemAdapterFromProvider` from wagmi connector, `withAddChainFallback` for chain-add on bridge
- **Feature flags**: `VITE_FEATURE_CCTP=true` and `VITE_FEATURE_STABLEFX=true` — cards hide when disabled
- **Modules**: `src/features/cctp/` and `src/features/stablefx/` — fully isolated
- **TreasurySplitter**: untouched

## Files to Create/Modify

### Install
1. Add `@circle-fin/app-kit`, `@circle-fin/adapter-viem-v2` packages

### CCTP feature (`src/features/cctp/`)
2. `lib/chains.ts` — source chain config (name, chainId, Circle chain identifier, viem chain)
3. `lib/withAddChainFallback.ts` — wagmi provider wrapper for unknown destination chains
4. `hooks/useCCTPBridge.ts` — bridge logic: switch chain → build adapter → `kit.bridge()` → track steps
5. `components/CCTPBridgeCard.tsx` — source chain dropdown, amount input, "Bridge to Arc" button, step-by-step status UI

### StableFX feature (`src/features/stablefx/`)
6. `lib/tokens.ts` — supported Arc swap pairs (EURC, cirBTC — not NATIVE/USDC)
7. `hooks/useStableFXSwap.ts` — estimate → confirm → `kit.swap()` pattern
8. `components/StableFXCard.tsx` — amount input, token dropdown, rate preview, "Convert" button, result display

### Dashboard integration
9. `src/pages/Dashboard.tsx` — add `<CCTPBridgeCard />` and `<StableFXCard />` as collapsible cards
10. `.env` — add `VITE_FEATURE_CCTP`, `VITE_FEATURE_STABLEFX`
11. `env.example` — document new vars
12. `README.md` — CCTP + StableFX section

## Build Sequence
1. Install `@circle-fin/app-kit` + `@circle-fin/adapter-viem-v2`
2. Build CCTP lib files (chain config, `withAddChainFallback`)
3. Build `useCCTPBridge` hook
4. Build `CCTPBridgeCard` component
5. Build StableFX lib files (token config)
6. Build `useStableFXSwap` hook
7. Build `StableFXCard` component
8. Wire both cards into Dashboard
9. Update `.env`, `env.example`, README
10. Lint + typecheck

## Done When
- [ ] `CCTPBridgeCard` appears on dashboard when `VITE_FEATURE_CCTP=true`; hidden when false
- [ ] User can select source chain (Ethereum/Base/Arbitrum/Polygon), enter amount, click Bridge — sees approve → burn → attest → mint steps with tx hashes
- [ ] `StableFXCard` appears on dashboard when `VITE_FEATURE_STABLEFX=true`; hidden when false
- [ ] User can enter USDC amount, select EURC or cirBTC, see live rate estimate, click Convert — sees tx hash + explorer link
- [ ] Existing TreasurySplitter flows unchanged
- [ ] Zero lint/typecheck errors
- [ ] `bun run build` succeeds
