# TreasuryOS Multi-User

## Summary
Any user who connects their wallet gets their own `TreasurySplitter` contract deployed from a shared factory. The app detects whether a connected wallet has a treasury, onboards new users with a one-click deploy, and routes all reads/writes to that user's personal contract. Existing single-user flows are unchanged — they just become per-user.

## Architecture

**New contract: `TreasurySplitterFactory.sol`**
- Deploys a new `TreasurySplitter` per caller with `msg.sender` as owner
- Records `mapping(address => address) public treasuryOf` — wallet → contract
- Emits `TreasuryCreated(owner, treasuryAddress)`
- `hasTreasury(address owner) returns (bool)` view

**Frontend changes**
- `NetworkContext` — add `factoryAddress` (testnet + mainnet) alongside the existing contract addresses
- New hook `useTreasury` — reads `factory.treasuryOf(address)`, returns the user's contract address or null
- New page component `SetupTreasury` — shown instead of dashboard when user has no treasury; lets them pick bucket splits and click "Create my treasury"
- All existing components that read `contractAddress` from `NetworkContext` now get it from `useTreasury` instead
- Settings page shows the user's own contract address and factory address

## Files to Create/Modify

### Contracts
1. `contracts/TreasurySplitterFactory.sol` — new factory contract
2. Deploy factory on Arc Testnet → wire address into `.env`

### Frontend — new files
3. `src/hooks/useTreasury.ts` — reads `factory.treasuryOf(connectedAddress)` on-chain
4. `src/components/SetupTreasury.tsx` — onboarding UI: bucket split picker + "Deploy my treasury" button
5. `src/lib/factoryAbi.ts` — factory ABI

### Frontend — modified files
6. `src/context/NetworkContext.tsx` — add `factoryAddress` to context value
7. `src/lib/arc.ts` — add `TREASURY_FACTORY_TESTNET` + `TREASURY_FACTORY_MAINNET` env vars
8. `src/pages/Dashboard.tsx` — wrap with `useTreasury`, show `SetupTreasury` if no treasury found
9. `src/pages/Buckets.tsx` — use per-user contract address from `useTreasury`
10. `src/pages/Payments.tsx` — same
11. `src/pages/Settings.tsx` — show factory address + user's contract address
12. `.env` + `env.example` — add factory addresses

## Build Sequence
1. Write + audit `TreasurySplitterFactory.sol`
2. Deploy factory on Arc Testnet
3. Write `factoryAbi.ts` + `useTreasury.ts`
4. Write `SetupTreasury.tsx`
5. Update `NetworkContext` + `arc.ts`
6. Update Dashboard, Buckets, Payments, Settings to use per-user contract
7. Update `.env` + `env.example`
8. Lint + typecheck

## Done When
- [ ] Any wallet that connects and has no treasury sees the SetupTreasury onboarding screen
- [ ] Clicking "Create my treasury" deploys a fresh `TreasurySplitter` owned by that wallet
- [ ] After deploy, the dashboard loads with that user's own contract address
- [ ] Two different wallets get two separate contract instances with independent configs
- [ ] Existing owner wallet (`0xed5531...`) still works — it has a treasury in the factory mapping
- [ ] Zero lint/typecheck errors
- [ ] Factory deployed on Arc Testnet, address in `.env`
