import re

def extract_transaction_hash(filename):
    with open(filename, 'r') as file:
        content = file.read()
    
    match = re.search(r'Transaction hash: (0x[a-fA-F0-9]+)', content)
    if match:
        return match.group(1)
    return None

if __name__ == "__main__":
    filename = "result.txt"
    tx_hash = extract_transaction_hash(filename)
    if tx_hash:
        print("Transaction Hash:", tx_hash)
    else:
        print("Transaction hash not found.")
