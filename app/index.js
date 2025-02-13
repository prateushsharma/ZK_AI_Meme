const snarkjs = require("snarkjs");
const fs = require("fs");
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const ethers = require("ethers");
const yargs = require("yargs/yargs");
const { hideBin } = require('yargs/helpers');
require('dotenv').config({ path: ['.env', '.env.secrets'] });

function hexToDecimalArray(hexStr) {
    try {
        if (!hexStr || typeof hexStr !== 'string') {
            console.error('Invalid hex string:', hexStr);
            throw new Error('Invalid hex string input');
        }
        const cleanHex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
        const decimalStr = BigInt('0x' + cleanHex).toString();
        return [decimalStr, "0"];
    } catch (error) {
        console.error('Error in hexToDecimalArray:', error);
        throw error;
    }
}

async function generateProof(model, prompt, meme) {
    try {
        const input = {
            model_hash: hexToDecimalArray(model),
            prompt_hash: hexToDecimalArray(prompt),
            meme_hash: hexToDecimalArray(meme)
        };
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "build/verification.wasm",
            "build/circuit_final.zkey"
        );
        const formattedProof = {
            pi_a: proof.pi_a,
            pi_b: proof.pi_b,
            pi_c: proof.pi_c,
            protocol: "groth16",
            curve: "bn128"
        };
        return { proof: formattedProof, publicSignals };
    } catch (error) {
        console.error("Error generating proof:", error);
        throw error;
    }
}

async function submitProofManually(proof, vk, publicSignals) {
    const { ZKV_RPC_URL, ZKV_SEED_PHRASE } = process.env;

    // Connect to the blockchain node
    const provider = new WsProvider(ZKV_RPC_URL);
    const api = await ApiPromise.create({ provider });

    // Format the verification key as an enum
    const formattedVk = {
        Vk: {
            curve: vk.curve === "bn128" ? "bn254" : vk.curve,
            alpha_g1: vk.vk_alpha_1,
            beta_g2: vk.vk_beta_2,
            gamma_g2: vk.vk_gamma_2,
            delta_g2: vk.vk_delta_2,
            gamma_abc_g1: vk.IC
        }
    };

    // Construct the extrinsic
    const extrinsic = api.tx.settlementGroth16Pallet.submitProof(
        { Vk: formattedVk }, // vk_or_hash (enum)
        { curve: "bn254", proof }, // proof
        publicSignals, // pubs
        null // domain_id (optional)
    );

    // Sign and send the extrinsic
    const keyring = new Keyring({ type: 'sr25519' });
    const account = keyring.addFromUri(ZKV_SEED_PHRASE);
    const hash = await extrinsic.signAndSend(account);

    console.log(`Extrinsic submitted with hash: ${hash}`);
    return hash;
}

async function run() {
    argv = yargs(hideBin(process.argv))
        .usage('Usage: $0 --model [hash] --prompt [hash] --meme [hash]')
        .option('model', { type: 'string', description: 'Model hash in hex format' })
        .option('prompt', { type: 'string', description: 'Prompt hash in hex format' })
        .option('meme', { type: 'string', description: 'Meme hash in hex format' })
        .demandOption(['model', 'prompt', 'meme'])
        .parse();

    const { model, prompt, meme } = argv;
    const hexRegex = /^0x[0-9a-fA-F]{64}$/;
    if (!hexRegex.test(model) || !hexRegex.test(prompt) || !hexRegex.test(meme)) {
        throw new Error('Invalid hex format. Each hash should be 32 bytes (64 characters) with 0x prefix');
    }

    const {
        ZKV_RPC_URL,
        ETH_RPC_URL,
        ETH_ZKVERIFY_CONTRACT_ADDRESS,
        ETH_APP_CONTRACT_ADDRESS
    } = process.env;

    const evmAccount = "0x94CB770fCB38A12ddB5fc5dDDede16f2Fb0EfC78";
    const WALLET_PRIVATE_KEY = "0x3c326b2ef0a8899bce095a492363ff06e3c5312a4825f71b452275e6851c50dc";

    try {
        const { proof, publicSignals } = await generateProof(model, prompt, meme);
        console.log("Proof generated successfully");

        const rawVk = JSON.parse(fs.readFileSync("build/verification_key.json"));
        const vk = {
            protocol: "groth16",
            curve: rawVk.curve,
            nPublic: rawVk.nPublic,
            vk_alpha_1: rawVk.vk_alpha_1,
            vk_beta_2: rawVk.vk_beta_2,
            vk_gamma_2: rawVk.vk_gamma_2,
            vk_delta_2: rawVk.vk_delta_2,
            IC: rawVk.IC
        };

        console.log("Verification Key (vk):", JSON.stringify(vk, null, 2));

        // Submit proof manually
        const txHash = await submitProofManually(proof, vk, publicSignals);
        console.log(`Proof submitted successfully. Transaction hash: ${txHash}`);

        // Listen for attestation and other events (if needed)
        const provider = new ethers.JsonRpcProvider(ETH_RPC_URL, null, { polling: true });
        const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

        const abiZkvContract = ["event AttestationPosted(uint256 indexed attestationId, bytes32 indexed root)"];
        const abiAppContract =  [
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
        ]; // Include your ABI here

        const zkvContract = new ethers.Contract(ETH_ZKVERIFY_CONTRACT_ADDRESS, abiZkvContract, provider);
        const appContract = new ethers.Contract(ETH_APP_CONTRACT_ADDRESS, abiAppContract, wallet);

        // Listen for attestation posting
        const filterAttestationsById = zkvContract.filters.AttestationPosted(null, null);
        zkvContract.once(filterAttestationsById, async (_id, _root) => {
            const txResponse = await appContract.verifyMeme(
                _id,
                [], // Merkle proof (if available)
                0, // Number of leaves (if available)
                0, // Leaf index (if available)
                model,
                prompt,
                meme
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

    } catch (error) {
        console.error("Error in proof generation or verification:", error);
        throw error;
    }
}

run()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });