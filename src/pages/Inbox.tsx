import { useState, useEffect, useCallback } from 'react';
import { Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import MessageCard from '@/components/MessageCard';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { fetchMessages, MessageData } from '@/utils/messageService';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Amount' },
  { value: 'lowest', label: 'Lowest Amount' },
];

const Inbox = () => {
  const { walletAddress, isConnected } = useWallet();
  const { toast } = useToast();
  
  const [receivedMessages, setReceivedMessages] = useState<MessageData[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageData[]>([]);
  
  const [tab, setTab] = useState('received');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const loadMessages = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    
    setIsLoading(true);
    setHasError(false);
    setErrorDetails(null);
    
    try {
      console.log('Loading messages for wallet:', walletAddress);
      
      const [received, sent] = await Promise.all([
        fetchMessages(walletAddress, 'received'),
        fetchMessages(walletAddress, 'sent')
      ]);
      
      console.log(`Loaded ${received.length} received messages and ${sent.length} sent messages`);
      
      setReceivedMessages(received);
      setSentMessages(sent);
    } catch (error) {
      console.error('Error loading messages:', error);
      setHasError(true);
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [walletAddress, isConnected]);
  
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);
  
  useEffect(() => {
    let messages = tab === 'received' ? receivedMessages : sentMessages;
    
    if (statusFilter !== 'all') {
      messages = messages.filter(msg => msg.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      messages = messages.filter(
        msg => 
          (msg.content?.toLowerCase().includes(query)) || 
          (msg.senderUsername?.toLowerCase().includes(query))
      );
    }
    
    messages = [...messages].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return parseFloat(b.amount as any) - parseFloat(a.amount as any);
        case 'lowest':
          return parseFloat(a.amount as any) - parseFloat(b.amount as any);
        default:
          return 0;
      }
    });
    
    setFilteredMessages(messages);
  }, [tab, statusFilter, sortBy, searchQuery, receivedMessages, sentMessages]);
  
  const handleRefresh = () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    loadMessages();
    
    toast({
      title: "Refreshing messages",
      description: "Fetching your latest messages...",
    });
  };

  const refreshMessages = () => {
    loadMessages();
  };

  return (
    <Layout>
      <div className="container px-4 py-6 mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Message Inbox</h1>
            <p className="text-muted-foreground">
              Manage your direct messages with payments
            </p>
          </div>
        
          {hasError && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading messages</AlertTitle>
              <AlertDescription>
                There was a problem loading your messages. Please try refreshing or check the console for details.
                {errorDetails && <div className="mt-2 text-sm font-mono bg-background/20 p-2 rounded">{errorDetails}</div>}
              </AlertDescription>
            </Alert>
          )}
        
          {errorDetails && !hasError && (
            <Alert variant="warning" className="animate-fade-in border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Potential Issues Detected</AlertTitle>
              <AlertDescription>
                {errorDetails}
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Refresh Messages
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        
          <Tabs defaultValue="received" className="space-y-4" onValueChange={setTab}>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-center gap-2">
                <TabsList className="bg-muted/50 h-10">
                  <TabsTrigger value="received" className="px-4">Received</TabsTrigger>
                  <TabsTrigger value="sent" className="px-4">Sent</TabsTrigger>
                </TabsList>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing || isLoading}
                        className="h-10 w-10"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh Messages</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    className="glass-input pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="glass-input w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="glass-input w-full sm:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="received" className="space-y-4 m-0 pt-2 animate-fade-in">
              {isLoading ? (
                <div className="glass-panel rounded-lg p-8 text-center">
                  <p className="text-muted-foreground animate-pulse">Loading messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="glass-panel rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No messages found.</p>
                  {statusFilter !== 'all' && (
                    <Button variant="ghost" onClick={() => setStatusFilter('all')} className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMessages.map((message, index) => (
                    <div key={message.id} className="animate-scale-in" style={{animationDelay: `${index * 50}ms`}}>
                      <MessageCard 
                        message={message} 
                        onMessageUpdated={refreshMessages}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sent" className="space-y-4 m-0 pt-2 animate-fade-in">
              {isLoading ? (
                <div className="glass-panel rounded-lg p-8 text-center">
                  <p className="text-muted-foreground animate-pulse">Loading messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="glass-panel rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No sent messages found.</p>
                  {statusFilter !== 'all' && (
                    <Button variant="ghost" onClick={() => setStatusFilter('all')} className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMessages.map((message, index) => (
                    <div key={message.id} className="animate-scale-in" style={{animationDelay: `${index * 50}ms`}}>
                      <MessageCard 
                        message={message}
                        onMessageUpdated={refreshMessages}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;
