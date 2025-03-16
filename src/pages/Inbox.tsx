
import { useState, useEffect, useCallback } from 'react';
import { Filter, Search } from 'lucide-react';
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
  
  // Load messages from Supabase
  const loadMessages = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    
    setIsLoading(true);
    try {
      const [received, sent] = await Promise.all([
        fetchMessages(walletAddress, 'received'),
        fetchMessages(walletAddress, 'sent')
      ]);
      
      setReceivedMessages(received);
      setSentMessages(sent);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "There was a problem loading your messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isConnected, toast]);
  
  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);
  
  // Filter and sort messages
  useEffect(() => {
    // Get base messages depending on tab
    let messages = tab === 'received' ? receivedMessages : sentMessages;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      messages = messages.filter(msg => msg.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      messages = messages.filter(
        msg => 
          (msg.content?.toLowerCase().includes(query)) || 
          (msg.senderUsername?.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
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

  // Refresh messages after approval/rejection
  const refreshMessages = () => {
    loadMessages();
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Message Inbox</h1>
          <p className="text-muted-foreground">
            Manage your direct messages with payments
          </p>
        </div>
        
        <Tabs defaultValue="received" className="space-y-4" onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList className="bg-muted/50 h-10">
              <TabsTrigger value="received" className="px-4">Received</TabsTrigger>
              <TabsTrigger value="sent" className="px-4">Sent</TabsTrigger>
            </TabsList>
            
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
    </Layout>
  );
};

export default Inbox;
