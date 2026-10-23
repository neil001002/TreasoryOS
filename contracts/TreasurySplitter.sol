// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TreasurySplitter
/// @notice Splits incoming USDC payments across configured treasury buckets using basis-point percentages.
contract TreasurySplitter is Ownable {
    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant MIN_BUCKETS = 2;
    uint256 private constant MAX_BUCKETS = 5;

    /// @notice USDC token address used for all transfers.
    address public immutable usdcToken;

    /// @notice Destination addresses that receive split funds.
    address[] public bucketAddresses;

    /// @notice Split percentages in basis points (must sum to 10_000).
    uint256[] public bucketPercentages;

    /// @notice Emitted when funds are split and distributed to all buckets.
    /// @param from Sender whose funds were pulled.
    /// @param totalAmount Total USDC amount distributed.
    /// @param buckets Bucket addresses that received funds.
    /// @param amounts Per-bucket amounts transferred.
    event FundsDistributed(address indexed from, uint256 totalAmount, address[] buckets, uint256[] amounts);

    /// @notice Emitted when the owner pays a contractor from contract-held funds.
    /// @param from Caller that initiated the payment.
    /// @param to Recipient contractor address.
    /// @param amount Amount of USDC transferred.
    event ContractorPaid(address indexed from, address indexed to, uint256 amount);

    /// @notice Emitted when bucket destinations or percentages are updated.
    /// @param buckets Updated bucket addresses.
    /// @param percentages Updated bucket percentages in basis points.
    event BucketConfigUpdated(address[] buckets, uint256[] percentages);

    /// @notice Initializes the splitter with token, owner, and initial bucket configuration.
    /// @param _usdc USDC ERC-20 token address.
    /// @param _owner Owner address for administrative functions.
    /// @param _buckets Initial bucket addresses (2 to 5 buckets).
    /// @param _percentages Initial bucket percentages in basis points (must sum to 10_000).
    constructor(
        address _usdc,
        address _owner,
        address[] memory _buckets,
        uint256[] memory _percentages
    ) Ownable(_owner) {
        require(_usdc != address(0), "TreasurySplitter: zero USDC address");
        require(_owner != address(0), "TreasurySplitter: zero owner address");

        usdcToken = _usdc;
        _setBucketConfig(_buckets, _percentages);
    }

    /// @notice Deposits USDC into this contract to fund future contractor payments.
    /// @dev Caller must approve this contract for at least `amountUSDC` beforehand.
    ///      These funds are NOT distributed to buckets — they stay in the contract.
    /// @param amountUSDC Amount of USDC to deposit for contractor payments.
    function depositForContractors(uint256 amountUSDC) external {
        require(amountUSDC > 0, "TreasurySplitter: zero amount");
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amountUSDC),
            "TreasurySplitter: deposit failed"
        );
    }

    /// @notice Pulls USDC from the caller and distributes it across configured buckets.
    /// @dev Caller must approve this contract for at least `amountUSDC` beforehand.
    ///      The final bucket receives any remainder to avoid dust from integer division.
    /// @param amountUSDC Amount of USDC to pull and distribute.
    function distribute(uint256 amountUSDC) external {
        require(amountUSDC > 0, "TreasurySplitter: zero amount");

        IERC20 token = IERC20(usdcToken);
        require(token.transferFrom(msg.sender, address(this), amountUSDC), "TreasurySplitter: transferFrom failed");

        uint256 bucketCount = bucketAddresses.length;
        uint256[] memory distributedAmounts = new uint256[](bucketCount);
        address[] memory buckets = bucketAddresses;

        uint256 distributedSoFar;
        for (uint256 i = 0; i < bucketCount; i++) {
            uint256 amountForBucket;
            if (i == bucketCount - 1) {
                amountForBucket = amountUSDC - distributedSoFar;
            } else {
                amountForBucket = (amountUSDC * bucketPercentages[i]) / BPS_DENOMINATOR;
                distributedSoFar += amountForBucket;
            }

            distributedAmounts[i] = amountForBucket;
            require(token.transfer(buckets[i], amountForBucket), "TreasurySplitter: bucket transfer failed");
        }

        emit FundsDistributed(msg.sender, amountUSDC, buckets, distributedAmounts);
    }

    /// @notice Pays a contractor from USDC held by this contract.
    /// @param to Contractor recipient address.
    /// @param amountUSDC Amount of USDC to transfer.
    function payContractor(address to, uint256 amountUSDC) external onlyOwner {
        require(to != address(0), "TreasurySplitter: zero recipient address");
        require(amountUSDC > 0, "TreasurySplitter: zero amount");

        require(IERC20(usdcToken).transfer(to, amountUSDC), "TreasurySplitter: contractor transfer failed");
        emit ContractorPaid(msg.sender, to, amountUSDC);
    }

    /// @notice Updates the bucket addresses and percentages used for distributions.
    /// @param newBuckets New bucket addresses (2 to 5 buckets, no zero addresses).
    /// @param newPercentages New bucket percentages in basis points (must sum to 10_000).
    function updateBucketConfig(
        address[] calldata newBuckets,
        uint256[] calldata newPercentages
    ) external onlyOwner {
        _setBucketConfig(newBuckets, newPercentages);
        emit BucketConfigUpdated(bucketAddresses, bucketPercentages);
    }

    /// @notice Returns the number of configured buckets.
    /// @return Number of bucket entries.
    function getBucketCount() external view returns (uint256) {
        return bucketAddresses.length;
    }

    /// @notice Returns all bucket addresses and their percentages.
    /// @return buckets Configured bucket addresses.
    /// @return percentages Configured basis-point percentages.
    function getBuckets() external view returns (address[] memory buckets, uint256[] memory percentages) {
        return (bucketAddresses, bucketPercentages);
    }

    /// @dev Validates and stores bucket configuration.
    function _setBucketConfig(address[] memory buckets, uint256[] memory percentages) internal {
        uint256 length = buckets.length;

        require(length == percentages.length, "TreasurySplitter: length mismatch");
        require(length >= MIN_BUCKETS, "TreasurySplitter: too few buckets");
        require(length <= MAX_BUCKETS, "TreasurySplitter: too many buckets");

        uint256 totalBps;
        for (uint256 i = 0; i < length; i++) {
            require(buckets[i] != address(0), "TreasurySplitter: zero bucket address");
            totalBps += percentages[i];
        }
        require(totalBps == BPS_DENOMINATOR, "TreasurySplitter: invalid percentage total");

        delete bucketAddresses;
        delete bucketPercentages;

        for (uint256 i = 0; i < length; i++) {
            bucketAddresses.push(buckets[i]);
            bucketPercentages.push(percentages[i]);
        }
    }
}
