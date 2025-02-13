const snarkjs = require("snarkjs");
const fs = require("fs");
const { zkVerifySession, ZkVerifyEvents } = require("zkverifyjs");
const ethers = require("ethers");
const yargs = require("yargs/yargs");
const { hideBin } = require('yargs/helpers');
require('dotenv').config({ path: ['.env', '.env.secrets'] });

async function run() {
    // Parse command line arguments for model_hash, prompt_hash, and meme_hash
    argv = yargs(hideBin(process.argv))
        .usage('Usage: $0 --model [hash] --prompt [hash] --meme [hash]')
        .demandOption(['model', 'prompt', 'meme'])
        .parse();
    const { model, prompt, meme } = argv;

    const {
        ZKV_RPC_URL,
        ZKV_SEED_PHRASE,
        ETH_RPC_URL,
        ETH_ZKVERIFY_CONTRACT_ADDRESS,
        ETH_APP_CONTRACT_ADDRESS
    } = process.env;

    const evmAccount = "0x94CB770fCB38A12ddB5fc5dDDede16f2Fb0EfC78";
    const WALLET_PRIVATE_KEY = "0x3c326b2ef0a8899bce095a492363ff06e3c5312a4825f71b452275e6851c50dc";

    // Generate groth16 proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { 
            model_hash: [model, "0"],
            prompt_hash: [prompt, "0"],
            meme_hash: [meme, "0"]
        },
        "build/verification.wasm",
        "build/circuit_final.zkey"
    );

    // Read and format the verification key
    const rawVk = JSON.parse(fs.readFileSync("build/verification_key.json"));
    const vk = {
        Vk: {
            curve: rawVk.curve === "bn128" ? "bn254" : rawVk.curve,
            alpha_g1: rawVk.vk_alpha_1,
            beta_g2: rawVk.vk_beta_2,
            gamma_g2: rawVk.vk_gamma_2,
            delta_g2: rawVk.vk_delta_2,
            gamma_abc_g1: rawVk.IC
        }
    };

    // Establish a session with zkVerify
    const session = await zkVerifySession.start()
        .Custom(ZKV_RPC_URL)
        .withAccount(ZKV_SEED_PHRASE);

    // Send the proof to zkVerify chain for verification
    const { events, transactionResult } = await session.verify()
        .groth16()
        .waitForPublishedAttestation()
        .execute({
            proofData: {
                vk,
                proof,
                publicSignals
            },
            statement: "0x0000000000000000000000000000000000000000000000000000000000000000",
            publicInputs: {
                model_hash: model,
                prompt_hash: prompt,
                meme_hash: meme
            }
        });

    // Listen for events
    events.on(ZkVerifyEvents.IncludedInBlock, ({ txHash }) => {
        console.log(`Transaction accepted in zkVerify, tx-hash: ${txHash}`);
    });

    events.on(ZkVerifyEvents.Finalized, ({ blockHash }) => {
        console.log(`Transaction finalized in zkVerify, block-hash: ${blockHash}`);
    });

    events.on('error', (error) => {
        console.error('An error occurred during the transaction:', error);
    });

    // Get attestation details
    let attestationId, leafDigest;
    try {
        ({ attestationId, leafDigest } = await transactionResult);
        console.log(`Attestation published on zkVerify`)
        console.log(`\tattestationId: ${attestationId}`);
        console.log(`\tleafDigest: ${leafDigest}`);
    } catch (error) {
        console.error('Transaction failed:', error);
    }

    // Get Merkle proof details
    let merkleProof, numberOfLeaves, leafIndex;
    try {
        const proofDetails = await session.poe(attestationId, leafDigest);
        ({ proof: merkleProof, numberOfLeaves, leafIndex } = await proofDetails);
        console.log(`Merkle proof details`)
        console.log(`\tmerkleProof: ${merkleProof}`);
        console.log(`\tnumberOfLeaves: ${numberOfLeaves}`);
        console.log(`\tleafIndex: ${leafIndex}`);
    } catch (error) {
        console.error('RPC failed:', error);
    }

    // Setup Ethereum connection
    const provider = new ethers.JsonRpcProvider(ETH_RPC_URL, null, { polling: true });
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

    // Contract ABIs
    const abiZkvContract = [
        "event AttestationPosted(uint256 indexed attestationId, bytes32 indexed root)"
    ];

    const abiAppContract = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_zkvContract",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "_vkHash",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "creator",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "memeHash",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "internalType": "bytes32",
                    "name": "modelHash",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "internalType": "bytes32",
                    "name": "promptHash",
                    "type": "bytes32"
                }
            ],
            "name": "MemeVerified",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "attestationId",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes32[]",
                    "name": "merklePath",
                    "type": "bytes32[]"
                },
                {
                    "internalType": "uint256",
                    "name": "leafCount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "index",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes32",
                    "name": "modelHash",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "promptHash",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "memeHash",
                    "type": "bytes32"
                }
            ],
            "name": "verifyMeme",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "user",
                    "type": "address"
                }
            ],
            "name": "getUserMemes",
            "outputs": [
                {
                    "internalType": "bytes32[]",
                    "name": "",
                    "type": "bytes32[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "PROVING_SYSTEM_ID",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "userMemes",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "name": "verifiedMemes",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "vkHash",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "zkvContract",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]

    const zkvContract = new ethers.Contract(ETH_ZKVERIFY_CONTRACT_ADDRESS, abiZkvContract, provider);
    const appContract = new ethers.Contract(ETH_APP_CONTRACT_ADDRESS, abiAppContract, wallet);

    // Listen for attestation posting
    const filterAttestationsById = zkvContract.filters.AttestationPosted(attestationId, null);
    zkvContract.once(filterAttestationsById, async (_id, _root) => {
        // Send verification transaction to the app contract
        const txResponse = await appContract.verifyMeme(
            attestationId,
            merkleProof,
            numberOfLeaves,
            leafIndex,
            model,      // modelHash
            prompt,     // promptHash
            meme        // memeHash
        );
        const { hash } = await txResponse;
        console.log(`Tx sent to EVM, tx-hash ${hash}`);
    });

    // Listen for successful verification
    const filterAppEventsByCaller = appContract.filters.MemeVerified(evmAccount, meme);
    appContract.once(filterAppEventsByCaller, async (creator, memeHash, modelHash, promptHash) => {
        console.log("Meme has been successfully verified!");
        console.log(`Creator: ${creator}`);
        console.log(`Meme Hash: ${memeHash}`);
        console.log(`Model Hash: ${modelHash}`);
        console.log(`Prompt Hash: ${promptHash}`);
    });
}

run()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });