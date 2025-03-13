
import { useState } from 'react';
import { ArrowRight, MessageSquare, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useWallet, SUPPORTED_WALLETS } from '@/contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AuthRequiredCardProps {
  title: string;
  description: string;
}

const AuthRequiredCard = ({ title, description }: AuthRequiredCardProps) => {
  const { user, signInWithTwitter } = useAuth();
  const { 
    isConnected, 
    connectWallet, 
    isSupportedWalletInstalled
  } = useWallet();
  
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

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
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-center gap-4">
        {!isConnected && (
          <Card className="web3-card flex-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <h4 className="font-medium">Step 1: Connect Wallet</h4>
                <p className="text-sm text-muted-foreground text-center">
                  Connect your wallet to pay for messages
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-white/10 hover:bg-accent/5 hover:border-accent/20"
                onClick={openWalletDialog}
              >
                Connect Wallet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {isConnected && !user && (
          <Card className="web3-card flex-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <h4 className="font-medium">Step 2: Sign In</h4>
                <p className="text-sm text-muted-foreground text-center">
                  Sign in with Twitter to identify yourself
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full web3-button" 
                onClick={signInWithTwitter}
              >
                Sign In with Twitter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {isConnected && user && (
          <Card className="web3-card flex-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                </div>
                <h4 className="font-medium">Ready to Message</h4>
                <p className="text-sm text-muted-foreground text-center">
                  You're all set to compose your message!
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                Start Composing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
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

export default AuthRequiredCard;
