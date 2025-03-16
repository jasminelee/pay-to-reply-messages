import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';
import { BrowserWalletAdapter } from '@/utils/browserWalletAdapter';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

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
  isLoading: boolean;
  walletAddress: string;
  walletName: string | null;
  walletIcon: string | null;
  balance: number;
  connectWallet: (walletInfo: WalletInfo) => Promise<void>;
  disconnectWallet: () => void;
  isSupportedWalletInstalled: (adapter: string) => boolean;
  getAnchorWallet: () => BrowserWalletAdapter | null;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletIcon, setWalletIcon] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  
  // Connection to Sonic DevNet
  const connection = new Connection("https://api.testnet.sonic.game", "confirmed");

  useEffect(() => {
    const storedWalletData = localStorage.getItem('sonicWalletData');
    
    if (storedWalletData) {
      try {
        const { address, name, icon } = JSON.parse(storedWalletData);
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
      // Actually fetch balance from the blockchain
      const publicKey = new PublicKey(address);
      const balanceInLamports = await connection.getBalance(publicKey);
      const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL;
      setBalance(balanceInSOL);
      console.log(`Fetched balance for ${address}: ${balanceInSOL} SOL`);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    }
  };

  const refreshBalance = async () => {
    if (isConnected && walletAddress) {
      await fetchBalance(walletAddress);
    }
  };

  const isSupportedWalletInstalled = (adapter: string): boolean => {
    if (adapter === 'phantom' && window.phantom) {
      return true;
    }
    
    if (adapter === 'solflare' && window.solflare) {
      return true;
    }
    
    if (adapter === 'backpack' && window.backpack) {
      return true;
    }
    
    if (adapter === 'okx' && window.okxwallet) {
      return true;
    }
    
    return false;
  };

  const getAnchorWallet = (): BrowserWalletAdapter | null => {
    if (!isConnected || !walletName) return null;
    
    let walletAdapter: any;
    
    switch (walletName.toLowerCase()) {
      case 'phantom':
        walletAdapter = window.phantom?.solana;
        return new BrowserWalletAdapter('phantom', walletAdapter);
      case 'solflare':
        walletAdapter = window.solflare;
        return new BrowserWalletAdapter('solflare', walletAdapter);
      case 'backpack':
        walletAdapter = window.backpack;
        return new BrowserWalletAdapter('backpack', walletAdapter);
      case 'okx':
        walletAdapter = window.okxwallet?.solana;
        return new BrowserWalletAdapter('okx', walletAdapter);
      default:
        return null;
    }
  };

  const connectWallet = async (walletInfo: WalletInfo): Promise<void> => {
    try {
      setIsLoading(true);
      console.log(`Connecting to ${walletInfo.name} wallet...`);
      let walletAdapter: any;
      let publicKey: string = '';
      
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
      
      try {
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
        throw new Error(`Failed to get public key from ${walletInfo.name}`);
      }
      
      setIsConnected(true);
      setWalletAddress(publicKey);
      setWalletName(walletInfo.name);
      setWalletIcon(walletInfo.icon);
      
      fetchBalance(publicKey);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
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
            window.okxwallet?.solana?.disconnect();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
    
    setIsConnected(false);
    setWalletAddress('');
    setWalletName(null);
    setWalletIcon(null);
    setBalance(0);
    
    localStorage.removeItem('sonicWalletData');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  const value = {
    isConnected,
    isLoading,
    walletAddress,
    walletName,
    walletIcon,
    balance,
    connectWallet,
    disconnectWallet,
    isSupportedWalletInstalled,
    getAnchorWallet,
    refreshBalance
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
