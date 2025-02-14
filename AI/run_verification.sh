#!/bin/bash

# Move to the app directory
cd ..
cd app

# Read hashes from hashes.txt
model_hash=$(sed -n 's/Model Hash: \(0x[a-fA-F0-9]*\)/\1/p' hashes.txt)
prompt_hash=$(sed -n 's/Prompt Hash: \(0x[a-fA-F0-9]*\)/\1/p' hashes.txt)
meme_hash=$(sed -n 's/Meme Hash: \(0x[a-fA-F0-9]*\)/\1/p' hashes.txt)

# Ensure hashes are found
if [[ -z "$model_hash" || -z "$prompt_hash" || -z "$meme_hash" ]]; then
    echo "Error: Could not read hashes from hashes.txt"
    exit 1
fi

echo "Model Hash: $model_hash"
echo "Prompt Hash: $prompt_hash"
echo "Meme Hash: $meme_hash"

# Run the Node.js script
output=$(node index.js --model "$model_hash" --prompt "$prompt_hash" --meme "$meme_hash")

# Print output for debugging
echo "$output"

# Save output to a file in the ai directory
echo "$output" > ../ai/result.txt

# Move back to the ai directory
cd ..
cd ai
