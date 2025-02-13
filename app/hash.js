const snarkjs = require("snarkjs");
const fs = require("fs");
const crypto = require("crypto");

function hashData(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
}

function hexToBigInt(hexStr) {
    return BigInt("0x" + hexStr);
}

async function run() {
    // Real data
    const modelData = "AI Model Data";
    const promptData = "User Prompt Data";
    const memeData = "Generated Meme Data";

    // Generate hashes
    const modelHash = hashData(modelData);
    const promptHash = hashData(promptData);
    const memeHash = hashData(memeData);

    // Ensure the first elements are equal
    const commonValue = modelHash.slice(0, 10);

    // Create inputs
    const inputs = {
        model_hash: [hexToBigInt(commonValue), 0], // Convert hex to BigInt
        prompt_hash: [hexToBigInt(commonValue), 0], // Convert hex to BigInt
        meme_hash: [hexToBigInt(commonValue), 0] // Convert hex to BigInt
    };

    console.log("Generated Inputs:", JSON.stringify(inputs, null, 2));

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        "build/verification.wasm",
        "build/circuit_final.zkey"
    );

    console.log("Proof:", JSON.stringify(proof, null, 2));
    console.log("Public Signals:", publicSignals);
}

run().catch(err => {
    console.error("Error:", err);
});