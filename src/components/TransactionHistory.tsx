
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
import { Transaction, User, formatAmount, formatDate, getStatusColor, transactions, users } from '@/utils/mockData';

interface TransactionHistoryProps {
  userId?: string;
  limit?: number;
}

const TransactionHistory = ({ userId = 'user-1', limit }: TransactionHistoryProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let userTransactions = transactions.filter(
      tx => tx.senderId === userId || tx.recipientId === userId
    );
    
    // Sort by timestamp (newest first)
    userTransactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply limit if provided
    if (limit) {
      userTransactions = userTransactions.slice(0, limit);
    }
    
    setFilteredTransactions(userTransactions);
  }, [userId, limit]);

  const getTransactionIcon = (transaction: Transaction) => {
    const isSender = transaction.senderId === userId;
    
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
    const counterpartyId = transaction.senderId === userId ? transaction.recipientId : transaction.senderId;
    return users.find(user => user.id === counterpartyId);
  };

  const getTransactionDescription = (transaction: Transaction) => {
    const counterparty = getCounterpartyUser(transaction);
    const isSender = transaction.senderId === userId;
    
    if (!counterparty) return '';
    
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
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions found.</p>
          ) : (
            filteredTransactions.map((transaction) => {
              const counterparty = getCounterpartyUser(transaction);
              if (!counterparty) return null;
              
              const statusColors = getStatusColor(transaction.status);
              const isSender = transaction.senderId === userId;
              
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
