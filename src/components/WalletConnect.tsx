
import { useState } from 'react';
import { Check, ChevronDown, CopyCheck, Wallet, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWallet, SUPPORTED_WALLETS } from '@/contexts/WalletContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const WalletConnect = () => {
  const { user } = useAuth();
  const { 
    isConnected, 
    walletAddress, 
    walletName, 
    walletIcon,
    balance, 
    connectWallet, 
    disconnectWallet,
    isSupportedWalletInstalled
  } = useWallet();
  
  const [isCopied, setIsCopied] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return address.length > 12 ? 
      `${address.slice(0, 6)}...${address.slice(-4)}` : 
      address;
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

  const openWalletDialog = () => {
    setIsWalletDialogOpen(true);
  };

  const closeWalletDialog = () => {
    setIsWalletDialogOpen(false);
  };

  const handleWalletSelection = async (wallet: typeof SUPPORTED_WALLETS[0]) => {
    await connectWallet(wallet);
    closeWalletDialog();
  };

  return (
    <div className="relative group">
      {isConnected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2 border border-white/10 shadow-sm bg-black/50 backdrop-blur-sm hover:bg-accent/5 hover:border-accent/20">
              {walletIcon && (
                <Avatar className="h-5 w-5 mr-1">
                  <AvatarImage src={walletIcon} alt={walletName || 'Wallet'} />
                  <AvatarFallback><Wallet className="h-3 w-3" /></AvatarFallback>
                </Avatar>
              )}
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
              <span className="text-sm font-medium font-mono">{truncateAddress(walletAddress)}</span>
              <ChevronDown className="h-4 w-4 text-accent" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 neo-glass animate-scale-in">
            <div className="p-2 border-b border-white/5">
              <div className="text-xs font-medium text-muted-foreground mb-1">Balance</div>
              <div className="font-medium web3-gradient-text">{balance.toFixed(2)} SOL</div>
            </div>
            <DropdownMenuItem onClick={copyAddress} className="cursor-pointer hover:bg-accent/5">
              {isCopied ? (
                <CopyCheck className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <CopyCheck className="mr-2 h-4 w-4" />
              )}
              <span>Copy Address</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          size="sm" 
          onClick={openWalletDialog}
          className="web3-button"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>
      )}

      {/* Wallet Selection Dialog */}
      <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
        <DialogContent className="sm:max-w-md neo-glass">
          <DialogHeader>
            <DialogTitle className="web3-gradient-text">Connect Wallet</DialogTitle>
            <DialogDescription>
              Select a wallet to connect
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            {SUPPORTED_WALLETS.map((wallet) => {
              const isInstalled = isSupportedWalletInstalled(wallet.adapter);
              
              return (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className={`flex items-center justify-between p-4 h-auto border-white/5 ${
                    isInstalled 
                      ? 'hover:bg-accent/5 hover:border-accent/20' 
                      : 'opacity-50'
                  }`}
                  onClick={() => isInstalled && handleWalletSelection(wallet)}
                  disabled={!isInstalled}
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={wallet.icon} alt={wallet.name} />
                      <AvatarFallback className="bg-accent/10 text-accent">{wallet.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  {!isInstalled && (
                    <span className="text-xs text-muted-foreground">Not installed</span>
                  )}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletConnect;
