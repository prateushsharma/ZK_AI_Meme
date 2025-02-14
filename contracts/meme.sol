// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract ZkMemeVerifier {
    /// The hash of the identifier of the proving system
    bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("groth16"));

    /// The address of the ZkvAttestationContract
    address public immutable zkvContract;
    /// The hash of the verification key of the circuit
    bytes32 public immutable vkHash;

    /// Mapping to track verified memes
    mapping(bytes32 => bool) public verifiedMemes;
    /// Mapping to track who created which memes
    mapping(address => bytes32[]) public userMemes;

    event MemeVerified(
        address indexed creator,
        bytes32 indexed memeHash,
        bytes32 modelHash,
        bytes32 promptHash
    );

    constructor(address _zkvContract, bytes32 _vkHash) {
        zkvContract = _zkvContract;
        vkHash = _vkHash;
    }

    function verifyMeme(
        uint256 attestationId,
        bytes32[] calldata merklePath,
        uint256 leafCount,
        uint256 index,
        bytes32 modelHash,
        bytes32 promptHash,
        bytes32 memeHash
    ) external {
        require(!verifiedMemes[memeHash], "Meme already verified");
        
        require(
            _verifyProofHasBeenPostedToZkv(
                attestationId,
                msg.sender,
                merklePath,
                leafCount,
                index,
                modelHash,
                promptHash,
                memeHash
            ),
            "Invalid proof"
        );

        // Record the verification
        verifiedMemes[memeHash] = true;
        userMemes[msg.sender].push(memeHash);

        emit MemeVerified(msg.sender, memeHash, modelHash, promptHash);
    }

    function getUserMemes(address user) external view returns (bytes32[] memory) {
        return userMemes[user];
    }

    function _verifyProofHasBeenPostedToZkv(
        uint256 attestationId,
        address inputAddress,
        bytes32[] calldata merklePath,
        uint256 leafCount,
        uint256 index,
        bytes32 modelHash,
        bytes32 promptHash,
        bytes32 memeHash
    ) internal view returns (bool) {
        // Encode the public inputs in the same order as in the circuit
        bytes memory encodedInput = abi.encodePacked(
            _changeEndianess(uint256(uint160(inputAddress))),
            _changeEndianess(uint256(modelHash)),
            _changeEndianess(uint256(promptHash)),
            _changeEndianess(uint256(memeHash))
        );

        bytes32 leaf = keccak256(
            abi.encodePacked(PROVING_SYSTEM_ID, vkHash, keccak256(encodedInput))
        );

        (bool callSuccessful, bytes memory validProof) = zkvContract.staticcall(
            abi.encodeWithSignature(
                "verifyProofAttestation(uint256,bytes32,bytes32[],uint256,uint256)",
                attestationId,
                leaf,
                merklePath,
                leafCount,
                index
            )
        );

        require(callSuccessful, "ZKV call failed");

        return abi.decode(validProof, (bool));
    }

    function _changeEndianess(uint256 input) internal pure returns (uint256 v) {
        v = input;
        // swap bytes
        v = ((v & 0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((v & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
        // swap 2-byte long pairs
        v = ((v & 0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((v & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
        // swap 4-byte long pairs
        v = ((v & 0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((v & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);
        // swap 8-byte long pairs
        v = ((v & 0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >> 64) |
            ((v & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);
        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }
}