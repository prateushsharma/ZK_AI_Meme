import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI,contractAddress } from '../utils/contract';
export function useContract() {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setSigner(signer);
        
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setContract(contract);
      }
    };

    init();
  }, []);

  return { contract, signer };
}