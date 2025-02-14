import { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const WalletContext = createContext()

export function WalletProvider({ children }) {
  const [address, setAddress] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        setAddress(accounts[0])
        setIsConnected(true)
      } catch (error) {
        console.error('Error connecting wallet:', error)
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  const disconnectWallet = () => {
    setAddress('')
    setIsConnected(false)
  }

  return (
    <WalletContext.Provider value={{
      address,
      isConnected,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  )
}

WalletProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const useWallet = () => useContext(WalletContext)