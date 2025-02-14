import { useState, useEffect } from 'react'
import MemeCard from '../components/MemeCard'
import { useWallet } from '../context/WalletContext'
import './MyMemes.css'

function MyMemes() {
  const [myMemes, setMyMemes] = useState([])
  const { address, isConnected } = useWallet()

  useEffect(() => {
    if (isConnected) {
      // Fetch user's memes
      setMyMemes([
        {
          id: 1,
          title: 'My First Meme',
          price: '0.2',
          creator: address,
          image: 'https://via.placeholder.com/400x300'
        }
      ])
    }
  }, [isConnected, address])

  const handleEdit = (meme) => {
    // Implement edit logic
    console.log('Editing meme:', meme)
  }

  const handleDelist = (meme) => {
    // Implement delist logic
    console.log('Delisting meme:', meme)
  }

  if (!isConnected) {
    return (
      <div className="my-memes">
        <h2>Connect your wallet to view your memes</h2>
      </div>
    )
  }

  return (
    <div className="my-memes">
      <h2>My Memes</h2>
      <div className="meme-grid">
        {myMemes.map(meme => (
          <MemeCard
            key={meme.id}
            meme={meme}
            onEdit={handleEdit}
            onDelist={handleDelist}
            isOwned={true}
          />
        ))}
      </div>
    </div>
  )
}

export default MyMemes
