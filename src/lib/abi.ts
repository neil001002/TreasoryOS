/**
 * TreasurySplitter ABI.
 * Keep in sync with contracts/TreasurySplitter.sol.
 */
export const TREASURY_SPLITTER_ABI = [
  // Read
  {
    name: 'usdcToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getBuckets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'buckets', type: 'address[]' },
      { name: 'percentages', type: 'uint256[]' },
    ],
  },
  {
    name: 'getBucketCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // Write
  {
    name: 'depositForContractors',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amountUSDC', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'distribute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amountUSDC', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'payContractor',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amountUSDC', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'updateBucketConfig',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'newBuckets', type: 'address[]' },
      { name: 'newPercentages', type: 'uint256[]' },
    ],
    outputs: [],
  },
  // Events
  {
    name: 'FundsDistributed',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'buckets', type: 'address[]', indexed: false },
      { name: 'amounts', type: 'uint256[]', indexed: false },
    ],
  },
  {
    name: 'ContractorPaid',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'BucketConfigUpdated',
    type: 'event',
    inputs: [
      { name: 'buckets', type: 'address[]', indexed: false },
      { name: 'percentages', type: 'uint256[]', indexed: false },
    ],
  },
] as const
