import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import './Header.css'

function Header() {
  const { isConnected, connectWallet, disconnectWallet, address } = useWallet()

  return (
    <header className="header">
      <div className="logo">
        <h1>Meme Market</h1>
      </div>
      <nav>
        <Link to="/">Marketplace</Link>
        <Link to="/my-memes">My Memes</Link>
      </nav>
      <button 
        className="wallet-button"
        onClick={isConnected ? disconnectWallet : connectWallet}
      >
        {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
      </button>
    </header>
  )
}

export default Header