import os
import subprocess

# Get the base directory (ZK_AI_Meme)
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Paths
ai_dir = os.path.join(base_dir, "AI")
app_dir = os.path.join(base_dir, "app")
hashes_file = os.path.join(app_dir, "hashes.txt")
result_file = os.path.join(ai_dir, "result.txt")

# Step 1: Ensure the "app" directory exists
if not os.path.exists(app_dir):
    print(f"Error: app directory not found at {app_dir}")
    exit(1)

# Step 2: Read hashes from "hashes.txt"
try:
    with open(hashes_file, "r") as file:
        lines = file.read().splitlines()

        if len(lines) < 3:
            print("Error: hashes.txt must contain at least 3 lines (model, prompt, meme hashes).")
            exit(1)

        model_hash = lines[0].split(": ")[1].strip()
        prompt_hash = lines[1].split(": ")[1].strip()
        meme_hash = lines[2].split(": ")[1].strip()

        # Ensure hashes have the correct format
        if not (model_hash.startswith("0x") and prompt_hash.startswith("0x") and meme_hash.startswith("0x")):
            print("Error: Each hash in hashes.txt must start with '0x'.")
            exit(1)

except FileNotFoundError:
    print(f"Error: {hashes_file} not found.")
    exit(1)

# Step 3: Change to the "app" directory and run "node index.js"
os.chdir(app_dir)
node_command = [
    "node", "index.js",
    "--model", model_hash,
    "--prompt", prompt_hash,
    "--meme", meme_hash
]

try:
    result = subprocess.run(node_command, capture_output=True, text=True)
    output = result.stdout + "\n" + result.stderr
    print(output)
    output = result.stdout
    # Ensure "AI" directory exists before saving the result
    os.makedirs(ai_dir, exist_ok=True)

    # Step 4: Save output to result.txt inside "AI" folder
    with open(result_file, "w") as output_file:
        output_file.write(output)

    print(f"Output saved to {result_file}")

except Exception as e:
    print(f"Error running node script: {str(e)}")
    exit(1)

# Step 5: Change back to "AI" directory
os.chdir(ai_dir)
