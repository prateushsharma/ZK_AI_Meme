import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MemeCard from '../components/MemeCard';
import './MarketPlace.css';
import { contractABI,contractAddress } from '../utils/contract';
const CONTRACT_ADDRESS = contractAddress; // Replace this
const ABI = contractABI;

function MarketPlace() {
  const [memes, setMemes] = useState([]);

  useEffect(() => {
    async function loadMemes() {
      if (!window.ethereum) return;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      try {
        const data = await contract.getAllMemes();
        console.log("Memes data:", data);
        
        const formatted = data.map((meme, index) => ({
          id: index,
          name: meme.name,
          uri: meme.uri,
          creator: meme.creator,
          tipsReceived: Number(meme.tipsReceived)
        }));
        
        setMemes(formatted);
      } catch (err) {
        console.error("Error:", err);
      }
    }

    loadMemes();
  }, []);

  return (
    <div className="marketplace">
      <h2>Meme Market</h2>
      <div className="meme-grid">
        {memes.map(meme => (
          <MemeCard
            key={meme.id}
            meme={meme}
          />
        ))}
      </div>
    </div>
  );
}

export default MarketPlace;
