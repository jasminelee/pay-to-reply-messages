
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Twitter, Wallet, Check, AlertCircle } from 'lucide-react';

interface ProfileManagerProps {
  onComplete?: () => void;
  compact?: boolean;
}

const ProfileManager = ({ onComplete, compact = false }: ProfileManagerProps) => {
  const { user, profile, signInWithTwitter } = useAuth();
  const { walletAddress, isConnected, connectWallet, walletName } = useWallet();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasAssociatedWallet, setHasAssociatedWallet] = useState(false);

  // Check if user has a wallet already associated in their profile
  useEffect(() => {
    if (profile && profile.wallet_address) {
      setHasAssociatedWallet(true);
    } else {
      setHasAssociatedWallet(false);
    }
  }, [profile]);

  const handleSaveWalletConnection = async () => {
    if (!user || !walletAddress) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: walletAddress,
          wallet_name: walletName
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setHasAssociatedWallet(true);
      toast({
        title: "Wallet connected",
        description: "Your wallet has been successfully connected to your profile",
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Connection failed",
        description: "There was a problem connecting your wallet",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-4 p-4 border border-white/10 bg-black/30 rounded-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 text-[#1DA1F2]" />
            <span className="text-sm">
              {profile?.twitter_username ? (
                <span className="flex items-center gap-1">
                  @{profile.twitter_username} <Check className="h-3 w-3 text-green-500" />
                </span>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={signInWithTwitter}
                  className="h-8 text-xs"
                >
                  Connect Twitter
                </Button>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-purple-400" />
            <span className="text-sm">
              {isConnected ? (
                <span className="flex items-center gap-1">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  {hasAssociatedWallet ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleSaveWalletConnection}
                      disabled={isUpdating}
                      className="h-7 ml-1 text-xs px-2"
                    >
                      Save
                    </Button>
                  )}
                </span>
              ) : (
                <span className="text-amber-400 text-xs">Connect wallet first</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="web3-card">
      <CardHeader>
        <CardTitle>Connect Your Accounts</CardTitle>
        <CardDescription>Link your Twitter account and wallet to send messages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Twitter Account</h3>
          <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-md">
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
            <div className="flex-1">
              {profile?.twitter_username ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{profile.twitter_username}</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Connected</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Not connected</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={signInWithTwitter}
                    className="bg-[#1DA1F2]/10 border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20"
                  >
                    Connect Twitter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Wallet</h3>
          <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-md">
            <Wallet className="h-5 w-5 text-purple-400" />
            <div className="flex-1">
              {isConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                    {hasAssociatedWallet ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  {hasAssociatedWallet ? (
                    <span className="text-xs text-muted-foreground">Connected</span>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSaveWalletConnection}
                      disabled={isUpdating}
                      className="bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20"
                    >
                      Save Connection
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Not connected</span>
                  <Button onClick={() => null} disabled variant="outline" size="sm">
                    Connect wallet first
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!hasAssociatedWallet && profile?.twitter_username && isConnected && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-200">Action needed</p>
                <p className="text-muted-foreground">
                  Your wallet is not yet associated with your profile. Click "Save Connection" to link them.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileManager;
