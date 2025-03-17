
import { useState, useEffect, useCallback } from 'react';
import { Filter, Search, RefreshCw, Database, Key, AlertCircle } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { fetchMessages, MessageData, fixDatabaseIssues, fixMessageIds, debugCheckMessages } from '@/utils/messageService';
import { AlertTriangle, Wallet } from 'lucide-react';
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
  const [isFixing, setIsFixing] = useState(false);
  const [isFixingMessageIds, setIsFixingMessageIds] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDebugChecking, setIsDebugChecking] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Load messages from Supabase
  const loadMessages = useCallback(async () => {
    if (!isConnected || !walletAddress) return;
    
    setIsLoading(true);
    setHasError(false);
    setErrorDetails(null);
    
    try {
      console.log('Loading messages for wallet:', walletAddress);
      
      // Try to load messages with additional error handling
      let receivedResult: MessageData[] = [];
      let sentResult: MessageData[] = [];
      
      try {
        receivedResult = await fetchMessages(walletAddress, 'received');
        console.log('Received messages loaded:', receivedResult.length);
      } catch (receivedError) {
        console.error('Error loading received messages:', receivedError);
        toast({
          title: "Error loading received messages",
          description: "There was a problem loading your received messages. Check console for details.",
          variant: "destructive"
        });
      }
      
      try {
        sentResult = await fetchMessages(walletAddress, 'sent');
        console.log('Sent messages loaded:', sentResult.length);
      } catch (sentError) {
        console.error('Error loading sent messages:', sentError);
        toast({
          title: "Error loading sent messages",
          description: "There was a problem loading your sent messages. Check console for details.",
          variant: "destructive"
        });
      }
      
      setReceivedMessages(receivedResult);
      setSentMessages(sentResult);
      
      if (receivedResult.length === 0 && sentResult.length === 0) {
        // If no messages were found, automatically run a debug check
        try {
          console.log('No messages found, running debug check...');
          const debugResult = await debugCheckMessages(walletAddress);
          console.log('Debug check result:', debugResult);
          
          if (debugResult.error) {
            setErrorDetails(`Debug check error: ${debugResult.error}`);
          } else if (debugResult.messages && debugResult.messages.length > 0) {
            setErrorDetails(`Found ${debugResult.messages.length} messages in database that weren't loaded correctly. Check console for details.`);
          }
        } catch (debugError) {
          console.error('Error running debug check:', debugError);
        }
      }
      
      console.log(`Loaded ${receivedResult.length} received and ${sentResult.length} sent messages`);
    } catch (error) {
      console.error('Error loading messages:', error);
      setHasError(true);
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Error loading messages",
        description: "There was a problem loading your messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  // Refresh messages manually
  const handleRefresh = () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    loadMessages();
    
    toast({
      title: "Refreshing messages",
      description: "Fetching your latest messages...",
    });
  };

  // Fix database issues
  const handleFixDatabase = async () => {
    if (isFixing) return;
    
    setIsFixing(true);
    try {
      await fixDatabaseIssues();
      
      toast({
        title: "Database Fix Attempted",
        description: "Check the console for details on what was fixed.",
      });
      
      // Refresh messages after fixing
      loadMessages();
    } catch (error) {
      console.error('Error fixing database:', error);
      
      toast({
        title: "Fix Failed",
        description: "There was a problem fixing the database. Check the console for details.",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Fix message IDs
  const handleFixMessageIds = async () => {
    if (isFixingMessageIds) return;
    
    setIsFixingMessageIds(true);
    try {
      await fixMessageIds();
      
      toast({
        title: "Message IDs Fixed",
        description: "Message IDs have been updated to the correct format. Check the console for details.",
      });
      
      // Refresh messages after fixing
      loadMessages();
    } catch (error) {
      console.error('Error fixing message IDs:', error);
      
      toast({
        title: "Fix Failed",
        description: "There was a problem fixing message IDs. Check the console for details.",
        variant: "destructive"
      });
    } finally {
      setIsFixingMessageIds(false);
    }
  };

  // Debug check current user's messages
  const handleDebugCheck = async () => {
    if (!walletAddress || isDebugChecking) return;
    
    setIsDebugChecking(true);
    try {
      toast({
        title: "Debug Check Started",
        description: "Checking your messages directly. See console for details.",
      });
      
      const result = await debugCheckMessages(walletAddress);
      console.log('Debug check result:', result);
      
      if (result.error) {
        toast({
          title: "Debug Check Found Issues",
          description: result.error,
          variant: "destructive"
        });
        setErrorDetails(result.error);
      } else if (result.messages && result.messages.length === 0) {
        toast({
          title: "No Messages Found",
          description: "The database query returned no messages for your wallet address.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Debug Check Complete",
          description: `Found ${result.stats?.totalMessages || 0} total messages (${result.stats?.receivedMessages || 0} received, ${result.stats?.sentMessages || 0} sent)`,
        });
        
        // If messages were found in debug but not loaded properly, show this info
        if ((result.stats?.totalMessages || 0) > 0 && 
            (receivedMessages.length + sentMessages.length === 0)) {
          setErrorDetails(`Debug found ${result.stats?.totalMessages} messages in the database, but they couldn't be loaded. Check console for details.`);
        }
      }
    } catch (error) {
      console.error('Error during debug check:', error);
      toast({
        title: "Debug Check Failed",
        description: "There was an error during the debug check. See console for details.",
        variant: "destructive"
      });
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error during debug check');
    } finally {
      setIsDebugChecking(false);
    }
  };

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
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Potential Issues Detected</AlertTitle>
            <AlertDescription>
              {errorDetails}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleDebugCheck} className="mr-2">
                  Run Detailed Check
                </Button>
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
              
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleFixDatabase} 
                      disabled={isFixing}
                      className="h-10 w-10"
                    >
                      <Database className={`h-4 w-4 ${isFixing ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fix Database Issues</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleFixMessageIds} 
                      disabled={isFixingMessageIds}
                      className="h-10 w-10"
                    >
                      <Key className={`h-4 w-4 ${isFixingMessageIds ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fix Message IDs</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleDebugCheck} 
                      disabled={isDebugChecking || !walletAddress}
                      className="h-10 w-10"
                    >
                      <AlertCircle className={`h-4 w-4 ${isDebugChecking ? 'animate-pulse' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Debug Check Messages</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        toast({
                          title: "Wallet Info",
                          description: walletAddress ? `Current wallet: ${walletAddress}` : "No wallet connected",
                        });
                        console.log("Current wallet address:", walletAddress);
                      }} 
                      className="h-10 w-10"
                    >
                      <Wallet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check Wallet Info</p>
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
                <Button variant="outline" onClick={handleDebugCheck} className="mt-4 ml-2" disabled={isDebugChecking}>
                  Check Messages in Database
                </Button>
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
                <Button variant="outline" onClick={handleDebugCheck} className="mt-4 ml-2" disabled={isDebugChecking}>
                  Check Messages in Database
                </Button>
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
