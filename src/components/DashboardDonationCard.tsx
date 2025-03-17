import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heart, HeartHandshake, HandCoins, Loader2, Info } from "lucide-react";
import { DonationDialog } from "@/components/DonationDialog";
import { DEFAULT_DONATION_ADDRESS, CHARITY_ORGANIZATIONS } from "@/utils/donationService";
import { useWallet } from "@/contexts/WalletContext";
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

const DashboardDonationCard = () => {
  const [donationAmount, setDonationAmount] = useState<number>(0.01);
  const [selectedCharity, setSelectedCharity] = useState(CHARITY_ORGANIZATIONS[0].address);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { balance } = useWallet();
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDonationAmount(value);
    }
  };
  
  const handleOpenDonationDialog = () => {
    setIsDialogOpen(true);
  };

  // Find the selected charity details
  const selectedCharityDetails = CHARITY_ORGANIZATIONS.find(charity => charity.address === selectedCharity);
  
  return (
    <>
      <Card className="web3-card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-radial from-pink-500/5 to-transparent opacity-50"></div>
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-pink-500" />
              Donate to Charity
            </CardTitle>
            <HeartHandshake className="h-5 w-5 text-pink-500/80" />
          </div>
          <CardDescription>
            Support open source development
          </CardDescription>
        </CardHeader>
        <CardContent className="relative pb-3">
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  value={donationAmount}
                  onChange={handleAmountChange}
                  min={0.001}
                  step={0.001}
                  className="border-pink-500/20 focus-visible:ring-pink-500/50"
                />
              </div>
              <span className="text-accent font-medium">SOL</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HandCoins className="h-4 w-4 text-pink-500/80" />
                <span>Suggested amounts:</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-500"
                onClick={() => setDonationAmount(0.001)}
              >
                0.001
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-500"
                onClick={() => setDonationAmount(0.01)}
              >
                0.01
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-500"
                onClick={() => setDonationAmount(0.05)}
              >
                0.05
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-pink-500/30 hover:bg-pink-500/10 hover:text-pink-500"
                onClick={() => setDonationAmount(0.1)}
              >
                0.1
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-pink-500/80" />
                <span>Select charity:</span>
              </div>
              <Select value={selectedCharity} onValueChange={setSelectedCharity}>
                <SelectTrigger className="border-pink-500/20 focus:ring-pink-500/50 text-sm">
                  <SelectValue placeholder="Select a charity" />
                </SelectTrigger>
                <SelectContent>
                  {CHARITY_ORGANIZATIONS.map((charity) => (
                    <SelectItem key={charity.address} value={charity.address}>
                      <span className="font-medium">{charity.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCharityDetails && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCharityDetails.description}
                </p>
              )}
            </div>
            
            <Separator className="my-2 bg-white/5" />
            
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <p>Recipient address:</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="max-w-xs">This is the wallet address where your donation will be sent.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="font-mono text-[10px] truncate">{selectedCharity}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            className="w-full gradient-button bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            onClick={handleOpenDonationDialog}
            disabled={donationAmount <= 0 || donationAmount > balance}
          >
            <Heart className="mr-2 h-4 w-4" />
            Donate {donationAmount} SOL
          </Button>
        </CardFooter>
      </Card>
      
      <DonationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        amount={donationAmount}
        donationAddress={selectedCharity}
        onSuccess={() => {
          setIsDialogOpen(false);
        }}
      />
    </>
  );
};

export default DashboardDonationCard;
