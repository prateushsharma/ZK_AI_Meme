from web3 import Web3
import json
import re
import sys


# ==== CONFIGURATION ====
RPC_URL = "https://rpc.open-campus-codex.gelato.digital/"  # Replace with your RPC endpoint
PRIVATE_KEY = "3c326b2ef0a8899bce095a492363ff06e3c5312a4825f71b452275e6851c50dc"  # Replace with your private key
CONTRACT_ADDRESS = "0x386D489e0e0996D76BA300dA55FbADfd22F69D58"  # Replace with deployed contract address

# Load ABI from abi.json
with open("abi.json", "r") as abi_file:
    ABI = json.load(abi_file)

# Connect to blockchain
web3 = Web3(Web3.HTTPProvider(RPC_URL))
assert web3.is_connected(), "Failed to connect to blockchain"

# Load contract
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)
account = web3.eth.account.from_key(PRIVATE_KEY)

# ==== FUNCTION TO ADD MEME ====
def add_meme(name, uri, proof_hash):
    tx = contract.functions.addMeme(name, uri, proof_hash).build_transaction({
        'from': account.address,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': contract.functions.addMeme(name, uri, proof_hash).estimate_gas({'from': account.address}),
        'gasPrice': web3.eth.gas_price
    })
    signed_tx = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Meme added! TX Hash: {web3.to_hex(tx_hash)}")

def extract_transaction_hash(filename):
    with open(filename, 'r') as file:
        content = file.read()
    
    match = re.search(r'Transaction hash: (0x[a-fA-F0-9]+)', content)
    if match:
        return match.group(1)
    return None

# ==== TRIGGER ADD MEME ====
filename = "result.txt"
tx_hash = extract_transaction_hash(filename)
if tx_hash:
    print("Transaction Hash:", tx_hash)
else:
    print("Transaction hash not found.")


if len(sys.argv) != 3:
    print("Usage: python contract_interact.py <name> <uri>")
    sys.exit(1)

name = sys.argv[1]
uri = sys.argv[2]

add_meme(name, uri, tx_hash)
