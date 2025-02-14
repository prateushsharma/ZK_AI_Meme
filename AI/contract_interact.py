from web3 import Web3
import json

# Connect to Ethereum node (Replace with your node URL)
RPC_URL = "https://your_rpc_url_here"
PRIVATE_KEY = "your_private_key_here"
FACTORY_ADDRESS = "your_meme_factory_contract_address_here"

# Initialize web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)

# Load ABI for MemeFactory contract
with open("MemeFactoryABI.json", "r") as f:
    factory_abi = json.load(f)

factory_contract = w3.eth.contract(address=FACTORY_ADDRESS, abi=factory_abi)

def create_meme_token(name, symbol, initial_supply, meme_uri, proof_hash):
    tx = factory_contract.functions.createMemeToken(
        name, symbol, initial_supply, meme_uri, proof_hash
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 5000000,
        'gasPrice': w3.to_wei('10', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"Transaction sent: {tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Meme Token Created at: {receipt.contractAddress}")
    return receipt.contractAddress

def get_all_memes():
    return factory_contract.functions.getAllMemes().call()

# Example Usage
if __name__ == "__main__":
    # Create a new meme token
    meme_token_address = create_meme_token("DogeCoin", "DOGE", 1000000, "https://meme.com/doge.png", "abc123")
    
    # Fetch all meme tokens
    all_memes = get_all_memes()
    print("All Meme Tokens:", all_memes)
