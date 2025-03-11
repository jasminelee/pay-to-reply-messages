
import { useState } from 'react';
import { Check, Clock, EyeIcon, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Message, formatAmount, formatDate, getStatusColor } from '@/utils/mockData';
import { toast } from '@/components/ui/use-toast';

interface MessageCardProps {
  message: Message;
  variant?: 'compact' | 'full';
}

const MessageCard = ({ message, variant = 'full' }: MessageCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleView = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const initiateApprove = () => {
    setConfirmAction('approve');
    setIsConfirmOpen(true);
  };

  const initiateReject = () => {
    setConfirmAction('reject');
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (confirmAction === 'approve') {
      // Handle approve action
      toast({
        title: 'Message Approved',
        description: `You've approved the message from @${message.senderUsername}.`,
      });
    } else if (confirmAction === 'reject') {
      // Handle reject action
      toast({
        title: 'Message Rejected',
        description: `You've rejected the message from @${message.senderUsername}. The payment will be refunded.`,
      });
    }
    
    setIsConfirmOpen(false);
    setIsOpen(false);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
  };

  const statusColors = getStatusColor(message.status);
  const isPending = message.status === 'pending';
  
  if (variant === 'compact') {
    return (
      <Card className="glass-card hover:shadow-hover transition-all group">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-white/50">
              <AvatarImage src={message.senderAvatarUrl} alt={message.senderDisplayName} />
              <AvatarFallback>{message.senderDisplayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">@{message.senderUsername}</p>
                <Badge variant="outline" className={`text-xs ${statusColors}`}>
                  {message.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{message.content}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
                <p className="text-xs font-medium">{formatAmount(message.paymentAmount)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card hover:shadow-hover transition-all group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 border-2 border-white/50">
              <AvatarImage src={message.senderAvatarUrl} alt={message.senderDisplayName} />
              <AvatarFallback>{message.senderDisplayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-none">{message.senderDisplayName}</p>
              <p className="text-sm text-muted-foreground">@{message.senderUsername}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs ${statusColors}`}>
            {message.status}
          </Badge>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm line-clamp-2">{message.content}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(message.timestamp)}
            </p>
            <p className="text-sm font-medium">{formatAmount(message.paymentAmount)}</p>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleView}>
              <EyeIcon className="h-4 w-4 mr-1" /> View
            </Button>
            {isPending && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:bg-red-500/10"
                  onClick={initiateReject}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-500 hover:bg-green-500/10"
                  onClick={initiateApprove}
                >
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-panel sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Message from {message.senderDisplayName}</span>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-2 mt-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.senderAvatarUrl} alt={message.senderDisplayName} />
                  <AvatarFallback>{message.senderDisplayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">@{message.senderUsername}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="border-y border-border py-4 my-4">
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <Badge variant="outline" className={`${statusColors}`}>
              {message.status}
            </Badge>
            <p className="font-medium">{formatAmount(message.paymentAmount)}</p>
          </div>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
            {isPending && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="text-red-500 hover:bg-red-500/10"
                  onClick={initiateReject}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={initiateApprove}
                >
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="glass-panel sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve' ? 'Approve Message' : 'Reject Message'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'approve'
                ? `Are you sure you want to approve this message? You will receive ${formatAmount(message.paymentAmount)}.`
                : `Are you sure you want to reject this message? The payment of ${formatAmount(message.paymentAmount)} will be refunded.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2">
            <Button variant="outline" onClick={handleCancelConfirm}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirm}
            >
              {confirmAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageCard;
