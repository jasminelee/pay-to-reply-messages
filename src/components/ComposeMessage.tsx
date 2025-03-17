import { FormEvent, useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { formatAmount } from '@/utils/mockData';
import { useWallet } from '@/contexts/WalletContext';
import { createMessagePayment } from '@/utils/anchorClient';
import { supabase } from "@/integrations/supabase/client";

interface ComposeMessageProps {
  onSuccess?: () => void;
  preselectedRecipient?: string;
  streamlined?: boolean;
}

interface Profile {
  id: string;
  username: string;
  wallet_address: string;
  avatar_url?: string;
}

const ComposeMessage = ({ onSuccess, preselectedRecipient, streamlined }: ComposeMessageProps) => {
  const [recipient, setRecipient] = useState<string>(preselectedRecipient || '');
  const [message, setMessage] = useState<string>('');
  const [amount, setAmount] = useState<number>(0.5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(false);
  const { isConnected, getAnchorWallet, balance, refreshBalance } = useWallet();

  // Fetch profiles from the database
  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoadingProfiles(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, wallet_address, avatar_url')
          .order('username');
        
        if (error) {
          console.error('Error fetching profiles:', error);
          return;
        }
        
        setProfiles(data || []);
      } catch (error) {
        console.error('Error in fetchProfiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };
    
    fetchProfiles();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to send a message.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!recipient) {
      toast({
        title: 'Recipient Required',
        description: 'Please select a recipient for your message.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!message) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }
    
    // Refresh wallet balance before checking
    await refreshBalance();
    
    // Check if the wallet has enough balance (with a small buffer for fees)
    if (balance < amount + 0.01) {
      toast({
        title: 'Insufficient Balance',
        description: `Your wallet balance (${balance.toFixed(2)} SOL) is too low for this transaction. You need at least ${(amount + 0.01).toFixed(2)} SOL.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Get the recipient's address from the profiles
    const recipientProfile = profiles.find(p => p.username === recipient);
    if (!recipientProfile || !recipientProfile.wallet_address) {
      toast({
        title: 'Invalid Recipient',
        description: 'Could not find wallet address for the selected recipient.',
        variant: 'destructive',
      });
      return;
    }
    
    const recipientAddress = recipientProfile.wallet_address;
    
    setIsSubmitting(true);
    
    try {
      // Get the anchor wallet adapter
      const wallet = getAnchorWallet();
      if (!wallet) {
        throw new Error('Failed to get wallet');
      }
      
      // Create the message payment with escrow (instead of direct transfer)
      const tx = await createMessagePayment(wallet, recipientAddress, amount, message);
      
      toast({
        title: 'Message Sent',
        description: `Your message to @${recipient} has been sent with ${formatAmount(amount)}. It is pending approval.`,
      });
      
      console.log('Transaction signature:', tx);
      
      // Reset form
      if (!preselectedRecipient) {
        setRecipient('');
      }
      setMessage('');
      setAmount(0.5);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending payment:', error);
      
      // Improved error handling
      let errorMessage = 'Failed to send payment. Please try again.';
      let errorTitle = 'Transaction Failed';
      
      if (error instanceof Error) {
        const errorText = error.message;
        
        if (errorText.includes('Insufficient funds')) {
          errorTitle = 'Insufficient Funds';
          errorMessage = 'You don\'t have enough SOL in your wallet. Please add more funds and try again.';
        } else if (errorText.includes('User rejected')) {
          errorTitle = 'Transaction Rejected';
          errorMessage = 'Transaction was rejected by your wallet.';
        } else if (errorText.includes('seeds constraint') || errorText.includes('ConstraintSeeds')) {
          errorTitle = 'Technical Error';
          errorMessage = 'There was a technical issue with the transaction. Please try again with a different message or amount.';
        } else if (errorText.includes('network error')) {
          errorTitle = 'Network Error';
          errorMessage = 'Connection to the blockchain failed. Please check your internet connection and try again.';
        } else {
          // For other errors, use the original message but clean it up
          errorMessage = errorText.replace('Error: ', '');
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (streamlined) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="message">Your Message</Label>
          <Textarea
            id="message"
            placeholder={`Write your message to @${recipient}...`}
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
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message with Payment'}
        </Button>
      </form>
    );
  }

  return (
    <Card className="glass-card border-none shadow-lg">
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
        <CardDescription>
          Send a message with SOL payment. The recipient will need to approve your message to receive the payment.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select
              value={recipient}
              onValueChange={setRecipient}
              disabled={!!preselectedRecipient || isLoadingProfiles}
            >
              <SelectTrigger className="glass-input">
                {isLoadingProfiles ? (
                  <span className="text-muted-foreground">Loading profiles...</span>
                ) : recipient ? (
                  <span>@{recipient}</span>
                ) : (
                  <span className="text-muted-foreground">Select a recipient</span>
                )}
              </SelectTrigger>
              <SelectContent className="glass-panel">
                {isLoadingProfiles ? (
                  <div className="p-2 text-center text-muted-foreground">Loading profiles...</div>
                ) : profiles.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">No profiles found</div>
                ) : (
                  profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.username}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>@{profile.username}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
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
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Message with Payment
              </span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ComposeMessage;
