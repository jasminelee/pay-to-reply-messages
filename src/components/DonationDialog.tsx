
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heart, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { DEFAULT_DONATION_ADDRESS, processDonation } from '@/utils/donationService';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/components/ui/use-toast';

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId?: string;
  amount?: number;
  onSuccess?: () => void;
}

const DonationDialog: React.FC<DonationDialogProps> = ({
  open,
  onOpenChange,
  messageId,
  amount = 0,
  onSuccess
}) => {
  const { getAnchorWallet, refreshBalance } = useWallet();
  const [donationAmount, setDonationAmount] = useState<number>(amount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDonationComplete, setIsDonationComplete] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  const handleDonate = async () => {
    setIsProcessing(true);
    
    try {
      const wallet = getAnchorWallet();
      
      if (!wallet) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to make a donation.",
          variant: "destructive"
        });
        return;
      }
      
      const signature = await processDonation(wallet, {
        amountSol: donationAmount,
        messageId,
        onSuccess: (sig) => {
          setTxSignature(sig);
          setIsDonationComplete(true);
          refreshBalance();
          
          toast({
            title: "Donation Successful",
            description: `Thank you for donating ${donationAmount} SOL!`,
          });
          
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (error) => {
          toast({
            title: "Donation Failed",
            description: `Error: ${error.message}`,
            variant: "destructive"
          });
        }
      });
      
      if (!signature) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Donation error:", error);
      toast({
        title: "Donation Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    setDonationAmount(isNaN(numValue) ? 0 : numValue);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Donate to Charity
          </DialogTitle>
          <DialogDescription>
            Donate some or all of your received payment to our partner charity.
          </DialogDescription>
        </DialogHeader>
        
        {!isDonationComplete ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Donation Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0.001"
                value={donationAmount}
                onChange={handleAmountChange}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Funds will be donated to support open source development
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Donation Address</Label>
              <div className="bg-secondary p-2 rounded-md text-xs font-mono overflow-hidden text-ellipsis">
                {DEFAULT_DONATION_ADDRESS}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="font-medium">Donation Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for your donation of {donationAmount} SOL
              </p>
              {txSignature && (
                <a 
                  href={`https://explorer.sonic.game/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent underline"
                >
                  View transaction
                </a>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          {!isDonationComplete ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleDonate} disabled={isProcessing || donationAmount <= 0}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Donate
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DonationDialog;
