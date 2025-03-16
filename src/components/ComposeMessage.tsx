
import { FormEvent, useState } from 'react';
import { Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { formatAmount } from '@/utils/mockData';
import { users } from '@/utils/mockData';
import { useWallet } from '@/contexts/WalletContext';
import { createMessagePayment } from '@/utils/anchorClient';
import { v4 as uuidv4 } from 'uuid'; 

interface ComposeMessageProps {
  onSuccess?: () => void;
  preselectedRecipient?: string;
  streamlined?: boolean;
}

// Mock addresses for users
const USER_ADDRESSES: Record<string, string> = {
  'jasmineflee': '8rRSCYJWGrgEnBXUHtgUMseNBfkrXLHVQvVmvn7Puqp4',
  'mikezhang': 'DM5gyrYPj5jfRGKT6BbLJVrYxpJ9pZMWuP1gCvxBMrcg',
  'sarahkim': 'CxDc845MD8jxYbGjUCjQ5GHVH1Ex4UEwxK6JmGGZT7vF',
  'willsmith': 'BN3gGhxPcn2YxFL1QZsmPqDf3WrDMEZtjzdFm4SJzgdT',
  'taylorj': 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'
};

const ComposeMessage = ({ onSuccess, preselectedRecipient, streamlined }: ComposeMessageProps) => {
  const [recipient, setRecipient] = useState(preselectedRecipient || '');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isConnected, getAnchorWallet } = useWallet();

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
    
    // Get the recipient's address
    const recipientAddress = USER_ADDRESSES[recipient];
    if (!recipientAddress) {
      toast({
        title: 'Invalid Recipient',
        description: 'Could not find address for the selected recipient.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the anchor wallet adapter
      const wallet = getAnchorWallet();
      if (!wallet) {
        throw new Error('Failed to get wallet');
      }
      
      // Generate a unique message ID
      const messageId = uuidv4();
      
      // Create the message payment with escrow (instead of direct transfer)
      const tx = await createMessagePayment(wallet, recipientAddress, amount, messageId);
      
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
      toast({
        title: 'Transaction Failed',
        description: `Failed to send payment. Please try again. ${error instanceof Error ? error.message : ''}`,
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
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    );
  }

  return (
    <Card className="glass-card max-w-xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Compose Message</CardTitle>
        <CardDescription>
          Send a direct message with a payment. Recipients can approve or reject your message.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select 
              value={recipient} 
              onValueChange={setRecipient}
              disabled={!!preselectedRecipient}
            >
              <SelectTrigger id="recipient" className="glass-input">
                <SelectValue placeholder="Select a recipient" />
              </SelectTrigger>
              <SelectContent className="glass-panel">
                {users
                  .filter(user => user.id !== 'user-1') // Filter out current user
                  .map(user => (
                    <SelectItem key={user.id} value={user.username}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>@{user.username}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
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
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ComposeMessage;
