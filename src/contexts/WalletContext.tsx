
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
          setBalance(Math.random() * 200); // Mock balance for demo
        }
      } catch (error) {
        console.error('Failed to parse stored wallet data:', error);
        localStorage.removeItem('sonicWalletData');
      }
    }
  }, []);

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
      
      // This is a mock implementation
      // In a real app, we would use the actual wallet adapter
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a fake wallet address
      const mockAddress = `${walletInfo.name.substr(0, 3)}${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 5)}`;
      
      // Set wallet state
      setIsConnected(true);
      setWalletAddress(mockAddress);
      setWalletName(walletInfo.name);
      setWalletIcon(walletInfo.icon);
      setBalance(Math.random() * 200); // Random mock balance
      
      // Store wallet data in localStorage
      localStorage.setItem('sonicWalletData', JSON.stringify({
        address: mockAddress,
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
    }
  };

  const disconnectWallet = () => {
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
