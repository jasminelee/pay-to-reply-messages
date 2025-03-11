
import { useState, FormEvent } from 'react';
import { AtSign, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { users, formatAmount } from '@/utils/mockData';
import { toast } from '@/components/ui/use-toast';

interface ComposeMessageProps {
  onSuccess?: () => void;
}

const ComposeMessage = ({ onSuccess }: ComposeMessageProps) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
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
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Message Sent',
        description: `Your message to @${recipient} has been sent with ${formatAmount(amount)}.`,
      });
      
      setIsSubmitting(false);
      setRecipient('');
      setMessage('');
      setAmount(5);
      
      if (onSuccess) {
        onSuccess();
      }
    }, 1500);
  };

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
            <Select value={recipient} onValueChange={setRecipient}>
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
                min={1}
                max={50}
                step={0.5}
                value={[amount]}
                onValueChange={(values) => setAmount(values[0])}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatAmount(1)}</span>
              <span>{formatAmount(50)}</span>
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
