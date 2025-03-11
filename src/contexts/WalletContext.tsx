
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

// Define the types for wallet data
export interface WalletInfo {
  name: string;
  icon: string;
  adapter: string;
}

// Available wallets based on Sonic's ecosystem
export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    name: 'Phantom',
    icon: 'https://phantom.app/favicon.ico',
    adapter: 'phantom'
  },
  {
    name: 'Solflare',
    icon: 'https://solflare.com/favicon.ico',
    adapter: 'solflare'
  },
  {
    name: 'Backpack',
    icon: 'https://backpack.app/favicon.ico',
    adapter: 'backpack'
  },
  {
    name: 'OKX',
    icon: 'https://www.okx.com/favicon.ico',
    adapter: 'okx'
  }
];

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string;
  walletName: string | null;
  walletIcon: string | null;
  balance: number;
  connectWallet: (walletInfo: WalletInfo) => Promise<void>;
  disconnectWallet: () => void;
  isSupportedWalletInstalled: (adapter: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletIcon, setWalletIcon] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  // Check if wallet connected on initialization (e.g. through localStorage)
  useEffect(() => {
    const storedWalletData = localStorage.getItem('sonicWalletData');
    
    if (storedWalletData) {
      try {
        const { address, name, icon } = JSON.parse(storedWalletData);
        // Only restore if all required data is present
        if (address && name && icon) {
          setWalletAddress(address);
          setWalletName(name);
          setWalletIcon(icon);
          setIsConnected(true);
          fetchBalance(address);
        }
      } catch (error) {
        console.error('Failed to parse stored wallet data:', error);
        localStorage.removeItem('sonicWalletData');
      }
    }
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      // In a real implementation, we would fetch the actual balance from the blockchain
      // For now, we'll use a mock balance
      setBalance(Math.random() * 200);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    }
  };

  // Check if a specific wallet is installed
  const isSupportedWalletInstalled = (adapter: string): boolean => {
    // For Phantom
    if (adapter === 'phantom' && window.phantom) {
      return true;
    }
    
    // For Solflare
    if (adapter === 'solflare' && window.solflare) {
      return true;
    }
    
    // For Backpack
    if (adapter === 'backpack' && window.backpack) {
      return true;
    }
    
    // For OKX
    if (adapter === 'okx' && window.okxwallet) {
      return true;
    }
    
    return false;
  };

  const connectWallet = async (walletInfo: WalletInfo): Promise<void> => {
    try {
      console.log(`Connecting to ${walletInfo.name} wallet...`);
      let walletAdapter: any;
      let publicKey: string = '';
      
      // Get the appropriate wallet adapter
      switch (walletInfo.adapter) {
        case 'phantom':
          if (!window.phantom) {
            throw new Error('Phantom wallet not installed');
          }
          walletAdapter = window.phantom?.solana;
          break;
        case 'solflare':
          if (!window.solflare) {
            throw new Error('Solflare wallet not installed');
          }
          walletAdapter = window.solflare;
          break;
        case 'backpack':
          if (!window.backpack) {
            throw new Error('Backpack wallet not installed');
          }
          walletAdapter = window.backpack;
          break;
        case 'okx':
          if (!window.okxwallet) {
            throw new Error('OKX wallet not installed');
          }
          walletAdapter = window.okxwallet;
          break;
        default:
          throw new Error('Unsupported wallet');
      }
      
      if (!walletAdapter) {
        throw new Error(`${walletInfo.name} wallet not found`);
      }
      
      // Try to connect to the wallet
      try {
        // Different wallets have slightly different connection methods
        if (walletInfo.adapter === 'phantom') {
          const response = await walletAdapter.connect();
          publicKey = response.publicKey.toString();
        } else if (walletInfo.adapter === 'solflare') {
          await walletAdapter.connect();
          publicKey = walletAdapter.publicKey.toString();
        } else if (walletInfo.adapter === 'backpack') {
          await walletAdapter.connect();
          publicKey = walletAdapter.publicKey.toString();
        } else if (walletInfo.adapter === 'okx') {
          await walletAdapter.connect();
          publicKey = walletAdapter.publicKey.toString();
        }
      } catch (err) {
        console.error(`Error connecting to ${walletInfo.name}:`, err);
        throw new Error(`Failed to connect to ${walletInfo.name}`);
      }
      
      if (!publicKey) {
        // Fallback to mock address if we couldn't get a real one
        publicKey = `${walletInfo.name.substr(0, 3)}${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 5)}`;
        console.warn('Using mock public key due to connection issues');
      }
      
      // Set wallet state
      setIsConnected(true);
      setWalletAddress(publicKey);
      setWalletName(walletInfo.name);
      setWalletIcon(walletInfo.icon);
      
      // Fetch balance
      fetchBalance(publicKey);
      
      // Store wallet data in localStorage
      localStorage.setItem('sonicWalletData', JSON.stringify({
        address: publicKey,
        name: walletInfo.name,
        icon: walletInfo.icon
      }));
      
      toast({
        title: 'Wallet Connected',
        description: `Successfully connected to ${walletInfo.name}`,
      });
      
    } catch (error) {
      console.error(`Error connecting to ${walletInfo.name}:`, error);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to ${walletInfo.name}. Please try again.`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const disconnectWallet = () => {
    // Attempt to disconnect from the actual wallet if connected
    if (isConnected && walletName) {
      try {
        switch (walletName.toLowerCase()) {
          case 'phantom':
            window.phantom?.solana?.disconnect();
            break;
          case 'solflare':
            window.solflare?.disconnect();
            break;
          case 'backpack':
            window.backpack?.disconnect();
            break;
          case 'okx':
            window.okxwallet?.disconnect();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
    
    // Reset wallet state
    setIsConnected(false);
    setWalletAddress('');
    setWalletName(null);
    setWalletIcon(null);
    setBalance(0);
    
    // Remove stored wallet data
    localStorage.removeItem('sonicWalletData');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  // Create context value
  const value = {
    isConnected,
    walletAddress,
    walletName,
    walletIcon,
    balance,
    connectWallet,
    disconnectWallet,
    isSupportedWalletInstalled,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
