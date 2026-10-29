// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TreasurySplitter} from "./TreasurySplitter.sol";

/// @title TreasurySplitterFactory
/// @notice Deploys one TreasurySplitter per owner wallet for USDC treasury management.
contract TreasurySplitterFactory {
    /// @notice Maps an owner wallet to its deployed TreasurySplitter contract.
    mapping(address => address) public treasuryOf;

    /// @notice List of all deployed TreasurySplitter contract addresses.
    address[] private _allTreasuries;

    /// @notice USDC token address passed to every deployed TreasurySplitter.
    address public immutable usdcToken;

    /// @notice Emitted when a new treasury is created for an owner.
    /// @param owner Owner wallet that requested the treasury deployment.
    /// @param treasury Newly deployed TreasurySplitter address.
    event TreasuryCreated(address indexed owner, address indexed treasury);

    /// @notice Initializes the factory with the USDC token address used by all treasuries.
    /// @param _usdc USDC token address.
    constructor(address _usdc) {
        require(_usdc != address(0), "Factory: zero USDC address");
        usdcToken = _usdc;
    }

    /// @notice Deploys a TreasurySplitter for the caller if one does not already exist.
    /// @param buckets Recipient bucket addresses for split distributions.
    /// @param percentages Bucket percentages in basis points.
    /// @return treasury Address of the newly deployed TreasurySplitter.
    function createTreasury(
        address[] calldata buckets,
        uint256[] calldata percentages
    ) external returns (address treasury) {
        require(treasuryOf[msg.sender] == address(0), "Factory: treasury already exists");

        TreasurySplitter newTreasury = new TreasurySplitter(usdcToken, msg.sender, buckets, percentages);

        treasury = address(newTreasury);
        treasuryOf[msg.sender] = treasury;
        _allTreasuries.push(treasury);

        emit TreasuryCreated(msg.sender, treasury);
    }

    /// @notice Returns whether an owner already has a deployed treasury.
    /// @param owner Wallet address to query.
    /// @return True if the owner has a treasury, false otherwise.
    function hasTreasury(address owner) external view returns (bool) {
        return treasuryOf[owner] != address(0);
    }

    /// @notice Returns the total number of treasuries created by this factory.
    /// @return Total treasury count.
    function allTreasuriesCount() external view returns (uint256) {
        return _allTreasuries.length;
    }

    /// @notice Returns the treasury address for an owner.
    /// @param owner Wallet address to query.
    /// @return Treasury address for the owner, or zero address if none exists.
    function getTreasury(address owner) external view returns (address) {
        return treasuryOf[owner];
    }
}
