// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemeFactory {
    struct MemeInfo {
        address tokenAddress;
        string name;
        string symbol;
        string memeURI;
        string proofHash;
        uint256 initialSupply;
    }

    MemeInfo[] public allMemes; // Store all meme tokens

    event MemeTokenCreated(address indexed tokenAddress, string name, string symbol, string memeURI, string proofHash, uint256 initialSupply);

    function createMemeToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory memeURI,
        string memory proofHash
    ) external returns (address) {
        MemeToken newToken = new MemeToken(name, symbol, msg.sender, initialSupply, memeURI, proofHash);
        MemeInfo memory memeData = MemeInfo(address(newToken), name, symbol, memeURI, proofHash, initialSupply);
        allMemes.push(memeData);

        emit MemeTokenCreated(address(newToken), name, symbol, memeURI, proofHash, initialSupply);
        return address(newToken);
    }

    function getAllMemes() external view returns (MemeInfo[] memory) {
        return allMemes;
    }
}

contract MemeToken is ERC20, Ownable {
    string private _memeURI; // Store the meme's image URI
    string private _proofHash; // Store the proof hash

    constructor(
        string memory name,
        string memory symbol,
        address creator,
        uint256 initialSupply,
        string memory memeURI,
        string memory proofHash
    ) ERC20(name, symbol) Ownable(creator) {  // Pass creator as the owner
        _mint(creator, initialSupply * (10**18)); // Mint tokens
        _memeURI = memeURI; // Store meme image URI
        _proofHash = proofHash; // Store proof hash
    }

    // Function to get the meme's image URI
    function memeURI() external view returns (string memory) {
        return _memeURI;
    }

    // Function to update the meme image URI (only owner)
    function updateMemeURI(string memory newURI) external onlyOwner {
        _memeURI = newURI;
    }

    // Function to get the proof hash
    function proofHash() external view returns (string memory) {
        return _proofHash;
    }

    // Function to update the proof hash (only owner)
    function updateProofHash(string memory newHash) external onlyOwner {
        _proofHash = newHash;
    }
}
