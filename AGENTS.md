# TreasuryOS — Agent Notes

## Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| TreasurySplitter | Arc Testnet | `0xa90bcefa574a78af25528191fef7e97471e5ca95` | [View](https://explorer.testnet.arc.io/address/0xa90bcefa574a78af25528191fef7e97471e5ca95) |
| TreasurySplitter | Arc Mainnet | _not yet deployed — deploy from your own wallet and set `VITE_TREASURY_SPLITTER_ADDRESS`_ | — |

## Constructor Args Used

- `_usdc`: `0x3600000000000000000000000000000000000000` (Arc Testnet USDC)
- `_owner`: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer wallet)
- Initial buckets: all set to the deployer address (placeholder — user must call `updateBucketConfig` with their own addresses)
- Initial percentages: 5000 / 3000 / 2000 bps (50% / 30% / 20%)

## Key Design Decisions

- `distribute(amount)` pulls USDC from the caller and immediately splits it to bucket addresses.
- `depositForContractors(amount)` holds USDC inside the contract for future `payContractor` calls.
- `usdcToken` is immutable (gas savings + security).
- All percentages are in basis points (10000 = 100%).
- MVP: no upgradability, no KYC, no fiat off-ramp.

## Environment

- `VITE_ARC_CHAIN_ID=5042002` — Arc Testnet
- `VITE_TREASURY_SPLITTER_ADDRESS=0xa90bcefa574a78af25528191fef7e97471e5ca95`
