// src/ConnectWalletButton.js
import React, { useState } from 'react';
import Web3 from 'web3';

const ConnectWalletButton = () => {
    const [isConnected, setIsConnected] = useState(false);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('Connected to account:', accounts[0]);
                setIsConnected(true);

                // Create a web3 instance
                const web3 = new Web3(window.ethereum);

                // Example: Get the current block number
                const blockNumber = await web3.eth.getBlockNumber();
                console.log('Current block number:', blockNumber);

                // You can now interact with the blockchain using web3
                // For example, you can send a transaction, call a smart contract, etc.

                // Remember to handle the promise and any potential errors

            } catch (error) {
                console.error("User denied account access", error);
            }
        } else {
            alert('Please install MetaMask to use this feature.');
        }
    };

    const disconnectWallet = async () => {
        if (window.ethereum) {
            try {
                // This will prompt the user to disconnect their wallet
                await window.ethereum.request({ method: 'eth_requestAccounts', params: [{ force: false }] });
                console.log('Wallet disconnected');
                setIsConnected(false);
            } catch (error) {
                console.error("Error disconnecting wallet", error);
            }
        } else {
            alert('Please install MetaMask to use this feature.');
        }
    };

    return (
        <div>
            <button onClick={isConnected ? disconnectWallet : connectWallet}>
                {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
            </button>
        </div>
    );
};

export default ConnectWalletButton;
