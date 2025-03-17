import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AtSign, MessageSquare, Send, ArrowRight, Twitter, Wallet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Layout from '@/components/Layout';
import ComposeMessage from '@/components/ComposeMessage';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatAmount } from '@/utils/mockData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createMessagePayment } from '@/utils/anchorClient';

const Share = () => {
  const { username } = useParams<{ username: string }>();
  const { user, profile, isLoading: authLoading, signInWithTwitter } = useAuth();
  const { 
    isConnected, 
    isLoading: walletLoading, 
    connectWallet, 
    isSupportedWalletInstalled,
    walletName,
    walletIcon,
    getAnchorWallet
  } = useWallet();
  const [recipient, setRecipient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0.5);
  const [isSending, setIsSending] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const SUPPORTED_WALLETS = [
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('twitter_username', username)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          toast({
            variant: 'destructive',
            title: 'User not found',
            description: 'We couldn\'t find this user in our system.'
          });
        } else {
          setRecipient(data);
        }
      } catch (err) {
        console.error('Exception fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [username]);
  
  const isSelfMessage = profile?.twitter_username === username;
  
  const handleSendMessage = async () => {
    if (!message) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to send a message.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const wallet = getAnchorWallet();
      if (!wallet) {
        throw new Error('Failed to get wallet');
      }
      
      const recipientAddress = recipient.wallet_address;
      if (!recipientAddress) {
        throw new Error('Recipient wallet address not found');
      }
      
      // Create message payment - this function already saves the message to Supabase
      const tx = await createMessagePayment(wallet, recipientAddress, amount, message);
      
      // No need to save the message again - it's already saved by createMessagePayment
      // The message_id is generated inside createMessagePayment to ensure consistency
      
      toast({
        title: 'Message Sent',
        description: `Your message to @${recipient.twitter_username} has been sent with ${formatAmount(amount)}.`,
      });
      
      console.log('Transaction signature:', tx);
      console.log("https://explorer.sonic.game/tx/" + tx);

      setIsSending(false);
      setMessage('');
      setAmount(0.5);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error sending payment:', error);
      toast({
        title: 'Transaction Failed',
        description: `Failed to send payment. Please try again. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
      setIsSending(false);
    }
  };

  const openWalletDialog = () => {
    setIsWalletDialogOpen(true);
  };

  const closeWalletDialog = () => {
    setIsWalletDialogOpen(false);
  };

  const handleWalletSelection = async (wallet: any) => {
    await connectWallet(wallet);
    closeWalletDialog();
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (showSuccess) {
    return (
      <Layout>
        <div className="flex flex-col space-y-8 animate-fade-in max-w-3xl mx-auto">
          <Card className="web3-card">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 mx-auto flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-medium">Message Sent Successfully!</h2>
                <p className="text-muted-foreground">
                  Your message to @{recipient.twitter_username} has been delivered
                </p>
                <div className="pt-6 flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setShowSuccess(false)}>
                    Send Another Message
                  </Button>
                  <Button className="web3-button" onClick={goToDashboard}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-fade-in max-w-3xl mx-auto">
        {isLoading || authLoading ? (
          <Card className="web3-card animate-pulse">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-52 bg-accent/10 rounded-md"></div>
                <div className="h-6 w-72 bg-accent/5 rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        ) : recipient ? (
          <>
            <Card className="web3-card overflow-hidden">
              <CardHeader className="relative border-b border-white/5">
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-primary/20 to-accent/20 opacity-50"></div>
                <div className="flex items-center space-x-4 pt-4">
                  <Avatar className="h-14 w-14 ring-2 ring-accent/20 shadow-lg">
                    <AvatarImage src={recipient.avatar_url} alt={recipient.twitter_username} />
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {recipient.twitter_username?.charAt(0).toUpperCase() || recipient.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {recipient.twitter_username ? (
                        <span className="web3-gradient-text">@{recipient.twitter_username}</span>
                      ) : (
                        <span>{recipient.username}</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      <span>Send a direct message</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {isSelfMessage ? (
                <CardContent className="py-8">
                  <div className="text-center space-y-4 py-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                      <AtSign className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">This is your share page!</h3>
                      <p className="text-muted-foreground mt-1">
                        Share this link with others so they can send you direct messages:
                      </p>
                      <div className="mt-4 p-3 bg-black/40 rounded-md border border-white/10 font-mono text-sm overflow-x-auto">
                        {window.location.origin}/share/{username}
                      </div>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-white/10 hover:bg-accent/5 hover:border-accent/20"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/share/${username}`);
                          toast({
                            title: 'Link Copied',
                            description: 'Your share link has been copied to clipboard.'
                          });
                        }}
                      >
                        Copy Share Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-6">
                  {!isConnected || !user ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">Sign in to send a message</h3>
                        <p className="text-muted-foreground">Complete these steps to send a direct message to @{recipient.twitter_username}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className={`web3-card transition-all duration-300 ${isConnected ? 'ring-2 ring-green-500/20' : ''}`}>
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center space-y-4">
                              <div className={`h-10 w-10 rounded-full ${isConnected ? 'bg-green-500/10' : 'bg-accent/10'} flex items-center justify-center`}>
                                {isConnected ? (
                                  <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Wallet className="h-5 w-5 text-accent" />
                                )}
                              </div>
                              <h4 className="font-medium">Step 1: Connect Wallet</h4>
                              <p className="text-sm text-muted-foreground text-center">
                                {isConnected 
                                  ? `Connected to ${walletName}` 
                                  : 'Connect your wallet to pay for messages'}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter>
                            {isConnected ? (
                              <Button disabled variant="outline" className="w-full opacity-50 cursor-not-allowed">
                                Connected
                                <Check className="ml-2 h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                className="w-full border-white/10 hover:bg-accent/5 hover:border-accent/20"
                                onClick={openWalletDialog}
                              >
                                Connect Wallet
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                        
                        <Card className={`web3-card transition-all duration-300 ${user ? 'ring-2 ring-green-500/20' : ''}`}>
                          <CardContent className="pt-6">
                            <div className="flex flex-col items-center space-y-4">
                              <div className={`h-10 w-10 rounded-full ${user ? 'bg-green-500/10' : 'bg-accent/10'} flex items-center justify-center`}>
                                {user ? (
                                  <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Twitter className="h-5 w-5 text-accent" />
                                )}
                              </div>
                              <h4 className="font-medium">Step 2: Twitter Sign-In</h4>
                              <p className="text-sm text-muted-foreground text-center">
                                {user 
                                  ? `Signed in as @${profile?.twitter_username}` 
                                  : 'Sign in with Twitter to identify yourself'}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter>
                            {user ? (
                              <Button disabled variant="outline" className="w-full opacity-50 cursor-not-allowed">
                                Signed In
                                <Check className="ml-2 h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                className="w-full bg-[#1DA1F2] hover:bg-[#1a91da]" 
                                onClick={signInWithTwitter}
                              >
                                <Twitter className="mr-2 h-4 w-4" />
                                Sign In with Twitter
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                          id="message"
                          placeholder={`Write your message to @${recipient.twitter_username}...`}
                          className="glass-input min-h-32 resize-none"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {message.length} characters
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Payment Amount ({formatAmount(amount)})</Label>
                          <Slider
                            id="amount"
                            min={0}
                            max={1}
                            step={0.001}
                            value={[amount]}
                            onValueChange={(values) => setAmount(values[0])}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{formatAmount(0)}</span>
                          <span>{formatAmount(1)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSendMessage} 
                        className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-button mt-4"
                        disabled={isSending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSending ? 'Sending...' : 'Send Message'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </>
        ) : (
          <Card className="web3-card">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                  <AtSign className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium">User Not Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find a user with the username @{username}
                </p>
                <Button className="web3-button mt-4" asChild>
                  <a href="/">
                    Go to Homepage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
    </Layout>
  );
};

export default Share;
