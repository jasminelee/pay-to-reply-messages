
import { useState } from 'react';
import { Check, ChevronDown, CopyCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { currentUser } from '@/utils/mockData';

const WalletConnect = () => {
  const [isConnected, setIsConnected] = useState(currentUser.isConnected || false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const walletAddress = currentUser.walletAddress || '';

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };

  const connectWallet = () => {
    setIsConnected(true);
    toast({
      title: 'Wallet Connected',
      description: 'Your wallet has been successfully connected.',
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard.',
      });
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative group">
      {isConnected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2 border border-gray-200 shadow-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{truncateAddress(walletAddress)}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass-panel animate-scale-in">
            <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
              {isCopied ? (
                <CopyCheck className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <CopyCheck className="mr-2 h-4 w-4" />
              )}
              <span>Copy Address</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-red-500 focus:text-red-500">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          size="sm" 
          onClick={connectWallet} 
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90 transition-all duration-300 shadow-button"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
