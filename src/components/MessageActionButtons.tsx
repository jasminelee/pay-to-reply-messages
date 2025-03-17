
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, Heart, Reply } from "lucide-react";
import { MessageData } from "@/utils/messageService";
import { useWallet } from "@/contexts/WalletContext";
import DonationDialog from './DonationDialog';
import { toast } from '@/components/ui/use-toast';

interface MessageActionButtonsProps {
  message: MessageData;
  isRecipient: boolean;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onReply?: () => void;
}

const MessageActionButtons: React.FC<MessageActionButtonsProps> = ({
  message,
  isRecipient,
  onApprove,
  onReject,
  onReply
}) => {
  const { isConnected } = useWallet();
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  
  // Only show the donate option for approved messages where the user is the recipient
  const showDonateOption = isRecipient && message.status === 'approved';
  
  // Show the approve/reject buttons only for pending messages where the user is the recipient
  const showApproveReject = isRecipient && message.status === 'pending';
  
  const handleDonateClick = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to donate.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDonationDialogOpen(true);
  };
  
  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {showApproveReject && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
              onClick={onApprove}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
              onClick={onReject}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}
        
        {showDonateOption && (
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border-pink-500/20"
            onClick={handleDonateClick}
          >
            <Heart className="h-4 w-4 mr-1" />
            Donate
          </Button>
        )}
        
        {onReply && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onReply}
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        )}
      </div>
      
      <DonationDialog
        open={isDonationDialogOpen}
        onOpenChange={setIsDonationDialogOpen}
        messageId={message.message_id}
        amount={parseFloat(message.amount as unknown as string) || 0}
      />
    </>
  );
};

export default MessageActionButtons;
