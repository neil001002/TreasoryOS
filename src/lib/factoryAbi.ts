/**
 * ABI for TreasurySplitterFactory.
 * Deploys a TreasurySplitter per user wallet.
 */
export const TREASURY_FACTORY_ABI = [
  {
    type: 'constructor',
    inputs: [{ name: '_usdc', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createTreasury',
    inputs: [
      { name: 'buckets', type: 'address[]', internalType: 'address[]' },
      { name: 'percentages', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [{ name: 'treasury', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasTreasury',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTreasury',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'treasuryOf',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allTreasuriesCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdcToken',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TreasuryCreated',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'treasury', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
] as const
