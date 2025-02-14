import hashlib
import sys
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

    # Define the output file path
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../app/"))
    output_file = os.path.join(output_dir, "hashes.txt")

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Write the hashes to the file
    with open(output_file, "w") as f:
        f.write(f"Model Hash: {model_hash}\n")
        f.write(f"Prompt Hash: {prompt_hash}\n")
        f.write(f"Meme Hash: {meme_hash}\n")

    print(f"Hashes saved to {output_file}")
