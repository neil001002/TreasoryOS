# TreasuryOS — Agent Notes

## Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| TreasurySplitter v1 (deprecated) | Arc Testnet | `0xa90bcefa574a78af25528191fef7e97471e5ca95` | [View](https://explorer.testnet.arc.io/address/0xa90bcefa574a78af25528191fef7e97471e5ca95) |
| TreasurySplitter v2 (active) | Arc Testnet | `0x17ba9334e74b537ed0729b829331719dd2039d3d` | [View](https://explorer.testnet.arc.io/address/0x17ba9334e74b537ed0729b829331719dd2039d3d) |
| TreasurySplitter v1 (active) | Arc Mainnet | `0x161d1E220b8C4E4C2b79387779074b6EEfCae3e3` | [View](https://explorer.arc.io/address/0x161d1E220b8C4E4C2b79387779074b6EEfCae3e3) |
| TreasurySplitterFactory (multi-user) | Arc Testnet | `0xb7d1b52aecb53ad2d864e5e394be06fe097d8b0e` | [View](https://explorer.testnet.arc.io/address/0xb7d1b52aecb53ad2d864e5e394be06fe097d8b0e) |
| TreasurySplitterFactory (multi-user) | Arc Mainnet | pending — deploy locally | — |

## Constructor Args Used

- `_usdc`: `0x3600000000000000000000000000000000000000` (Arc Testnet USDC)
- `_owner`: `0xed5531eF182B973D08f09390083366716fae6498` (user's own wallet — controls payContractor + updateBucketConfig)
- Operating (50%): `0x1E8fa0f0f03bd7B2EEB269E59311CcFF41e68dEC`
- Tax (30%): `0xF611d9fF9E6EE7FFbF24eF1730A6e7F47349dD99`
- Savings (20%): `0xa752df45ec53E12A991cC211b13F6A7ca4048Baa`
- Percentages: 5000 / 3000 / 2000 bps (50% / 30% / 20%)

## Key Design Decisions

- `distribute(amount)` pulls USDC from the caller and immediately splits it to bucket addresses.
- `depositForContractors(amount)` holds USDC inside the contract for future `payContractor` calls.
- `usdcToken` is immutable (gas savings + security).
- All percentages are in basis points (10000 = 100%).
- MVP: no upgradability, no KYC, no fiat off-ramp.

## Environment

- `VITE_ARC_NETWORK=testnet` — Arc Testnet (default)
- `VITE_ARC_NETWORK=mainnet` — Arc Mainnet
- `VITE_TREASURY_SPLITTER_TESTNET=0x17ba9334e74b537ed0729b829331719dd2039d3d`
- `VITE_TREASURY_SPLITTER_MAINNET=0x161d1E220b8C4E4C2b79387779074b6EEfCae3e3`
