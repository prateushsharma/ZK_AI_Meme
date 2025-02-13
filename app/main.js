const snarkjs = require("snarkjs");
const fs = require("fs");
const { zkVerifySession, ZkVerifyEvents } = require("zkverifyjs");
const ethers = require("ethers");
const yargs = require("yargs/yargs");
const { hideBin } = require('yargs/helpers');
require('dotenv').config({ path: ['.env', '.env.secrets'] });

function hexToDecimalArray(hexStr) {
    try {
        // Ensure hexStr is a string and handle potential undefined
        if (!hexStr || typeof hexStr !== 'string') {
            console.error('Invalid hex string:', hexStr);
            throw new Error('Invalid hex string input');
        }

        // Remove '0x' prefix if present
        const cleanHex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
        
        // Convert to decimal string (to avoid scientific notation)
        const decimalStr = BigInt('0x' + cleanHex).toString();
        
        // Return as array with two elements [decimal, "0"]
        return [decimalStr, "0"];
    } catch (error) {
        console.error('Error in hexToDecimalArray:', error);
        throw error;
    }
}

async function generateProof(model, prompt, meme) {
    try {
        console.log('Input values:');
        console.log('model:', model);
        console.log('prompt:', prompt);
        console.log('meme:', meme);

        // Convert hex inputs to decimal arrays for the circuit
        const input = {
            model_hash: hexToDecimalArray(model),
            prompt_hash: hexToDecimalArray(prompt),
            meme_hash: hexToDecimalArray(meme)
        };

        console.log("Circuit input:", JSON.stringify(input, null, 2));

        // Generate the proof using snarkjs
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "build/verification.wasm",
            "build/circuit_final.zkey"
        );

        // Format the proof for zkverifyjs
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

async function run() {
    // Parse command line arguments, ensuring we get raw strings
    argv = yargs(hideBin(process.argv))
        .usage('Usage: $0 --model [hash] --prompt [hash] --meme [hash]')
        .option('model', {
            type: 'string',
            description: 'Model hash in hex format'
        })
        .option('prompt', {
            type: 'string',
            description: 'Prompt hash in hex format'
        })
        .option('meme', {
            type: 'string',
            description: 'Meme hash in hex format'
        })
        .demandOption(['model', 'prompt', 'meme'])
        .parse();

    const { model, prompt, meme } = argv;

    // Validate hex format
    const hexRegex = /^0x[0-9a-fA-F]{64}$/;
    if (!hexRegex.test(model) || !hexRegex.test(prompt) || !hexRegex.test(meme)) {
        throw new Error('Invalid hex format. Each hash should be 32 bytes (64 characters) with 0x prefix');
    }

    const {
        ZKV_RPC_URL,
        ZKV_SEED_PHRASE,
        ETH_RPC_URL,
        ETH_ZKVERIFY_CONTRACT_ADDRESS,
        ETH_APP_CONTRACT_ADDRESS
    } = process.env;

    const evmAccount = "0x94CB770fCB38A12ddB5fc5dDDede16f2Fb0EfC78";
    const WALLET_PRIVATE_KEY = "0x3c326b2ef0a8899bce095a492363ff06e3c5312a4825f71b452275e6851c50dc";

    try {
        // Generate proof
        const { proof, publicSignals } = await generateProof(model, prompt, meme);
        console.log("Proof generated successfully");
        console.log("Public Signals:", publicSignals);
        console.log("Proof:", JSON.stringify(proof, null, 2));

        // [Rest of your verification code remains the same...]

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