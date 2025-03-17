import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heart, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { DEFAULT_DONATION_ADDRESS, processDonation, CHARITY_ORGANIZATIONS } from '@/utils/donationService';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId?: string;
  amount?: number;
  donationAddress?: string;
  onSuccess?: () => void;
}

export const DonationDialog: React.FC<DonationDialogProps> = ({
  open,
  onOpenChange,
  messageId,
  amount = 0,
  donationAddress,
  onSuccess
}) => {
  const { getAnchorWallet, refreshBalance } = useWallet();
  const [donationAmount, setDonationAmount] = useState<number>(amount);
  const [selectedCharity, setSelectedCharity] = useState(donationAddress || CHARITY_ORGANIZATIONS[0].address);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDonationComplete, setIsDonationComplete] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  // Update donation amount when the prop changes
  React.useEffect(() => {
    setDonationAmount(amount);
  }, [amount]);

  // Update selected charity when donationAddress prop changes
  React.useEffect(() => {
    if (donationAddress) {
      setSelectedCharity(donationAddress);
    }
  }, [donationAddress]);
  
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
        donationAddress: selectedCharity,
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

  const handleSuggestedAmount = (amount: number) => {
    setDonationAmount(amount);
  };
  
  // Reset the dialog state when it's closed
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setIsDonationComplete(false);
        setTxSignature(null);
      }, 300);
    }
  }, [open]);

  // Find the selected charity details
  const selectedCharityDetails = CHARITY_ORGANIZATIONS.find(charity => charity.address === selectedCharity);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Donate to Charity
          </DialogTitle>
          <DialogDescription>
            Donate SOL to support open source development.
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
                Funds will be donated to support charitable organizations
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Suggested amounts:</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0.001, 0.01, 0.05, 0.1].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4 py-1 border-pink-500/20 hover:bg-pink-500/10"
                    onClick={() => handleSuggestedAmount(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Select Charity</Label>
              <Select value={selectedCharity} onValueChange={setSelectedCharity}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select a charity" />
                </SelectTrigger>
                <SelectContent className="glass-panel">
                  {CHARITY_ORGANIZATIONS.map((charity) => (
                    <SelectItem key={charity.address} value={charity.address}>
                      <div>
                        <span className="font-medium">{charity.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCharityDetails && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedCharityDetails.description}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Donation Address
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">This is the wallet address where your donation will be sent.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="bg-secondary p-2 rounded-md text-xs font-mono overflow-hidden text-ellipsis">
                {selectedCharity}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="font-medium">Donation Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for your donation of {donationAmount} SOL to {selectedCharityDetails?.name}
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
              <Button 
                onClick={handleDonate} 
                disabled={isProcessing || donationAmount <= 0}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
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
