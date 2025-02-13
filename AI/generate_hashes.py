import hashlib
import sys
import subprocess
import os

def generate_hash(input_string):
    """Generate a SHA-256 hash and return it in 0x-prefixed format."""
    hash_hex = hashlib.sha256(input_string.encode()).hexdigest()
    return f"0x{hash_hex}"

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python generate_hashes.py <model> <prompt> <meme>")
        sys.exit(1)

    # Generate hashes
    model_hash = generate_hash(sys.argv[1])
    prompt_hash = generate_hash(sys.argv[2])
    meme_hash = generate_hash(sys.argv[3])

    # Print the hashes for debugging
    print(f"Model Hash: {model_hash}")
    print(f"Prompt Hash: {prompt_hash}")
    print(f"Meme Hash: {meme_hash}")

    # Get the correct path to index.js (one level up and into "app/")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    node_script_path = os.path.abspath(os.path.join(current_dir, "../app/index.js"))

    # Construct the command for Node.js execution
    node_command = [
        "node", node_script_path,
        "--model", model_hash,
        "--prompt", prompt_hash,
        "--meme", meme_hash
    ]

    # Execute the Node.js command
    result = subprocess.run(node_command, capture_output=True, text=True)

    # Print the output from Node.js
    print(result.stdout)
    print(result.stderr)
