
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageData, updateMessageStatus } from "@/utils/messageService";
import { formatAmount, formatDateTime } from "@/utils/mockData";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import MessageActionButtons from './MessageActionButtons';

interface MessageCardProps {
  message: MessageData;
  variant?: 'full' | 'compact';
  onRefresh?: () => void;
  onClick?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/80';
    case 'approved':
      return 'bg-green-500/80';
    case 'rejected':
      return 'bg-red-500/80';
    default:
      return 'bg-gray-500/80';
  }
};

const MessageCard: React.FC<MessageCardProps> = ({ 
  message, 
  variant = 'full',
  onRefresh,
  onClick
}) => {
  const { walletAddress, isConnected, getAnchorWallet, refreshBalance } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if current user is recipient
  const isRecipient = isConnected && walletAddress && message.recipient_id 
    ? message.recipient_id.toLowerCase() === walletAddress.toLowerCase() 
    : false;
  
  // Determine if current user is sender
  const isSender = isConnected && walletAddress && message.sender_id 
    ? message.sender_id.toLowerCase() === walletAddress.toLowerCase() 
    : false;
  
  const handleApprove = async () => {
    try {
      setIsLoading(true);
      
      if (!isConnected) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to approve this message.",
          variant: "destructive"
        });
        return;
      }
      
      // Update message status in database
      const success = await updateMessageStatus(message.message_id, 'approved');
      
      if (success) {
        toast({
          title: "Message Approved",
          description: `You have approved the message and received ${formatAmount(message.amount)}.`,
        });
        
        // Refresh wallet balance
        refreshBalance();
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error("Failed to update message status");
      }
    } catch (error) {
      console.error('Error approving message:', error);
      toast({
        title: "Approval Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async () => {
    try {
      setIsLoading(true);
      
      if (!isConnected) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to reject this message.",
          variant: "destructive"
        });
        return;
      }
      
      // Update message status in database
      const success = await updateMessageStatus(message.message_id, 'rejected');
      
      if (success) {
        toast({
          title: "Message Rejected",
          description: "You have rejected the message.",
        });
        
        // Call refresh callback if provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error("Failed to update message status");
      }
    } catch (error) {
      console.error('Error rejecting message:', error);
      toast({
        title: "Rejection Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReply = () => {
    // Handle reply logic (navigate to compose with pre-filled recipient)
    console.log('Reply to message', message.id);
  };
  
  // Render a compact version of the card if requested
  if (variant === 'compact') {
    return (
      <Card className={`web3-card relative overflow-hidden cursor-pointer ${onClick ? 'hover:bg-card/80' : ''}`} onClick={onClick}>
        <div className={`absolute top-0 right-0 h-full w-1 ${getStatusColor(message.status)}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={isSender ? message.recipientUsername : message.senderUsername} />
                <AvatarFallback>
                  {(isSender ? message.recipientUsername : message.senderUsername || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {isSender 
                    ? `To: ${message.recipientUsername || 'Unknown User'}`
                    : `From: ${message.senderUsername || 'Unknown User'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{formatAmount(message.amount)}</p>
              <Badge variant="outline" className={`text-xs ${getStatusColor(message.status)} text-white`}>
                {message.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {message.content}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Full message card
  return (
    <Card className="web3-card relative overflow-hidden">
      <div className={`absolute top-0 right-0 h-full w-1 ${getStatusColor(message.status)}`} />
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={isSender ? message.recipientUsername : message.senderAvatarUrl} />
              <AvatarFallback>
                {(isSender ? message.recipientUsername : message.senderUsername || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {isSender 
                  ? `To: ${message.recipientUsername || 'Unknown User'}`
                  : `From: ${message.senderUsername || 'Unknown User'}`
                }
              </CardTitle>
              <CardDescription>{formatDateTime(message.created_at)}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-semibold web3-gradient-text">{formatAmount(message.amount)}</p>
            <Badge variant="outline" className={`${getStatusColor(message.status)} text-white`}>
              {message.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Processing...</span>
          </div>
        ) : (
          <MessageActionButtons
            message={message}
            isRecipient={isRecipient}
            onApprove={handleApprove}
            onReject={handleReject}
            onReply={handleReply}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default MessageCard;
