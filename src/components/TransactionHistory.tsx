import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, RefreshCcw, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatDate, getStatusColor } from '@/utils/mockData';
import { Transaction, User, users } from '@/utils/mockData';
import { useWallet } from '@/contexts/WalletContext';
import { Connection, PublicKey, LAMPORTS_PER_SOL, ConfirmedSignatureInfo } from '@solana/web3.js';

interface TransactionHistoryProps {
  userId?: string;
  limit?: number;
}

// Interface for on-chain transactions
interface OnChainTransaction {
  id: string;
  signature: string;
  senderId: string;
  recipientId: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  type: 'send' | 'receive';
  timestamp: string;
}

const TransactionHistory = ({ userId = 'user-1', limit = 10 }: TransactionHistoryProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress, isConnected } = useWallet();

  useEffect(() => {
    // If wallet is not connected, fall back to mock data
    if (!isConnected || !walletAddress) {
      // Use mock data as fallback
      let userTransactions = [...filteredTransactions];
      
      // Sort by timestamp (newest first)
      userTransactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Apply limit if provided
      if (limit) {
        userTransactions = userTransactions.slice(0, limit);
      }
      
      setFilteredTransactions(userTransactions);
      setIsLoading(false);
      return;
    }

    // Function to fetch transaction history from the blockchain
    const fetchTransactionHistory = async () => {
      try {
        setIsLoading(true);
        
        // Connect to Solana (using Sonic DevNet)
        const connection = new Connection("https://api.testnet.sonic.game", "confirmed");
        
        // Get recent transactions for the wallet
        const signatures = await connection.getSignaturesForAddress(
          new PublicKey(walletAddress),
          { limit }
        );
        
        // Process each transaction
        const onChainTransactions: OnChainTransaction[] = [];
        
        for (const signatureInfo of signatures) {
          try {
            const txInfo = await connection.getTransaction(signatureInfo.signature);
            
            if (txInfo && txInfo.meta) {
              // Check if this is potentially a payment transaction
              const preBalances = txInfo.meta.preBalances;
              const postBalances = txInfo.meta.postBalances;
              const accountKeys = txInfo.transaction.message.accountKeys;
              
              // Find the sender and recipient
              let senderId = '';
              let recipientId = '';
              let amount = 0;
              
              // Simplistic approach: look for accounts with balance changes
              for (let i = 0; i < accountKeys.length; i++) {
                const accountKey = accountKeys[i].toBase58();
                const preBalance = preBalances[i];
                const postBalance = postBalances[i];
                const balanceChange = postBalance - preBalance;
                
                // If balance decreased, this might be the sender
                if (balanceChange < 0 && accountKey === walletAddress) {
                  senderId = accountKey;
                  amount = Math.abs(balanceChange) / LAMPORTS_PER_SOL;
                }
                // If balance increased, this might be the recipient
                else if (balanceChange > 0 && accountKey !== walletAddress) {
                  recipientId = accountKey;
                }
              }
              
              // If we identified a payment transaction
              if (senderId && recipientId && amount > 0) {
                onChainTransactions.push({
                  id: signatureInfo.signature,
                  signature: signatureInfo.signature,
                  senderId,
                  recipientId,
                  amount,
                  status: 'completed',
                  type: senderId === walletAddress ? 'send' : 'receive',
                  timestamp: new Date(signatureInfo.blockTime! * 1000).toISOString()
                });
              }
            }
          } catch (err) {
            console.error(`Error processing transaction ${signatureInfo.signature}:`, err);
          }
        }
        
        // Convert to the format expected by the UI
        const formattedTransactions: Transaction[] = onChainTransactions.map(tx => ({
          id: tx.id,
          messageId: undefined,
          senderId: tx.senderId,
          recipientId: tx.recipientId,
          amount: tx.amount,
          status: tx.status,
          type: tx.type,
          timestamp: tx.timestamp
        }));
        
        setFilteredTransactions(formattedTransactions);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        // Fall back to empty array on error
        setFilteredTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactionHistory();
  }, [walletAddress, isConnected, limit]);

  const getTransactionIcon = (transaction: Transaction) => {
    const isSender = transaction.senderId === walletAddress || transaction.senderId === userId;
    
    switch (transaction.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return isSender ? 
          <ArrowUpRight className="h-5 w-5 text-red-500" /> : 
          <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'refunded':
        return <RefreshCcw className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const getCounterpartyUser = (transaction: Transaction): User | undefined => {
    const counterpartyId = (transaction.senderId === walletAddress || transaction.senderId === userId) 
      ? transaction.recipientId 
      : transaction.senderId;
    return users.find(user => user.id === counterpartyId);
  };

  const getTransactionDescription = (transaction: Transaction) => {
    // For real blockchain transactions, we might not have user info
    // So display the address if user info isn't available
    const counterparty = getCounterpartyUser(transaction);
    const isSender = transaction.senderId === walletAddress || transaction.senderId === userId;
    
    // For on-chain transactions, we might display addresses
    const counterpartyAddress = isSender ? transaction.recipientId : transaction.senderId;
    const shortAddress = counterpartyAddress && counterpartyAddress.length > 8 
      ? `${counterpartyAddress.substring(0, 4)}...${counterpartyAddress.substring(counterpartyAddress.length - 4)}` 
      : counterpartyAddress;
    
    if (!counterparty) {
      return isSender ? `Payment to ${shortAddress}` : `Payment from ${shortAddress}`;
    }
    
    switch (transaction.type) {
      case 'send':
        return `Payment to @${counterparty.username}`;
      case 'receive':
        return `Payment from @${counterparty.username}`;
      case 'refund':
        return isSender ? `Refund from @${counterparty.username}` : `Refund to @${counterparty.username}`;
      case 'donation':
        return isSender ? `Donation to @${counterparty.username}` : `Donation from @${counterparty.username}`;
      default:
        return `Transaction with @${counterparty.username}`;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Your recent payment activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions found.</p>
          ) : (
            filteredTransactions.map((transaction) => {
              const statusColors = getStatusColor(transaction.status);
              const isSender = transaction.senderId === walletAddress || transaction.senderId === userId;
              
              return (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      {getTransactionIcon(transaction)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getTransactionDescription(transaction)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={`font-medium ${isSender ? 'text-red-500' : 'text-green-500'}`}>
                      {isSender ? '-' : '+'}{formatAmount(transaction.amount)}
                    </p>
                    <Badge variant="outline" className={`text-xs mt-1 ${statusColors}`}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
