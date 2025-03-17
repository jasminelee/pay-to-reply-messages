import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Clock, MessageSquare, Repeat, Wallet, Zap, Shield, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import MessageCard from '@/components/UpdatedMessageCard';
import TransactionHistory from '@/components/TransactionHistory';
import { formatAmount } from '@/utils/mockData';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/hooks/useAuth';
import { AtSign } from 'lucide-react';
import { fetchMessages, getMessageStats, MessageData } from '@/utils/messageService';
import { useToast } from "@/hooks/use-toast";
import DashboardDonationCard from '@/components/DashboardDonationCard';

const Dashboard = () => {
  const { balance, walletAddress, isConnected } = useWallet();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [receivedMessages, setReceivedMessages] = useState<MessageData[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageData[]>([]);
  const [activeTab, setActiveTab] = useState('received');
  const [isLoading, setIsLoading] = useState(false);
  
  const [messageStats, setMessageStats] = useState({
    pendingReceived: 0,
    approvedReceived: 0,
    totalReceived: 0,
    pendingSent: 0,
    approvedSent: 0,
    totalSent: 0,
    totalEarnings: 0
  });
  
  const [pendingTransactions, setPendingTransactions] = useState(0);
  
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return address.length > 12 ? 
      `${address.slice(0, 6)}...${address.slice(-4)}` : 
      address;
  };
  
  useEffect(() => {
    const loadMessagesAndStats = async () => {
      if (isConnected && walletAddress) {
        setIsLoading(true);
        try {
          const [received, sent, stats] = await Promise.all([
            fetchMessages(walletAddress, 'received'),
            fetchMessages(walletAddress, 'sent'),
            getMessageStats(walletAddress)
          ]);
          
          setReceivedMessages(received);
          setSentMessages(sent);
          setMessageStats(stats);
          
          const pendingAmount = received
            .filter(msg => msg.status === 'pending')
            .reduce((sum, msg) => sum + parseFloat(msg.amount as any), 0);
            
          setPendingTransactions(pendingAmount);
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
      }
    };
    
    loadMessagesAndStats();
  }, [isConnected, walletAddress, toast]);
  
  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight web3-gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.twitter_username ? `@${profile.twitter_username}` : profile?.username || 'User'}! Here's an overview of your messaging activity.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="web3-card animate-scale-in" style={{animationDelay: '100ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold web3-gradient-text">{formatAmount(messageStats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                From {messageStats.approvedReceived} approved messages
              </p>
            </CardContent>
          </Card>
          
          <Card className="web3-card animate-scale-in" style={{animationDelay: '150ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messageStats.pendingReceived}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your response
              </p>
            </CardContent>
          </Card>
          
          <Card className="web3-card animate-scale-in" style={{animationDelay: '200ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messageStats.totalSent}</div>
              <p className="text-xs text-muted-foreground">
                {messageStats.approvedSent} approved, {messageStats.pendingSent} pending
              </p>
            </CardContent>
          </Card>
          
          <Card className="web3-card animate-scale-in" style={{animationDelay: '250ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <BarChart className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="web3-button-outline h-9">
                  <Link to="/compose">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Compose
                  </Link>
                </Button>
                <Button asChild variant="outline" className="web3-button-outline h-9">
                  <Link to="/share">
                    <AtSign className="h-4 w-4 mr-1" />
                    Share
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-7">
          <div className="space-y-4 col-span-4">
            <h2 className="text-xl font-semibold tracking-tight mb-4">Recent Messages</h2>
            
            <Tabs defaultValue="received" onValueChange={setActiveTab}>
              <TabsList className="bg-secondary mb-4">
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
              <TabsContent value="received">
                {isLoading ? (
                  <Card className="web3-card p-6">
                    <div className="text-center text-muted-foreground py-8">
                      <div className="animate-pulse">Loading messages...</div>
                    </div>
                  </Card>
                ) : messageStats.totalReceived === 0 ? (
                  <Card className="web3-card p-6">
                    <div className="text-center text-muted-foreground py-8 bg-card/30 rounded-lg border border-white/5">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>You haven't received any messages yet.</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {receivedMessages.slice(0, 3).map((message) => (
                      <MessageCard key={message.id} message={message} variant="compact" />
                    ))}
                    {receivedMessages.length > 3 && (
                      <div className="text-center mt-4">
                        <Button asChild variant="ghost" className="text-accent">
                          <Link to="/inbox">
                            View All Messages
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="sent">
                {isLoading ? (
                  <Card className="web3-card p-6">
                    <div className="text-center text-muted-foreground py-8">
                      <div className="animate-pulse">Loading messages...</div>
                    </div>
                  </Card>
                ) : messageStats.totalSent === 0 ? (
                  <Card className="web3-card p-6">
                    <div className="text-center text-muted-foreground py-8 bg-card/30 rounded-lg border border-white/5">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>You haven't sent any messages yet.</p>
                      <Button asChild className="web3-button mt-4">
                        <Link to="/compose">
                          Compose a Message
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {sentMessages.slice(0, 3).map((message) => (
                      <MessageCard key={message.id} message={message} variant="compact" />
                    ))}
                    {sentMessages.length > 3 && (
                      <div className="text-center mt-4">
                        <Button asChild variant="ghost" className="text-accent">
                          <Link to="/inbox">
                            View All Messages
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <Card className="web3-card">
              <Tabs defaultValue="all">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle>Transaction History</CardTitle>
                    <TabsList className="bg-secondary">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="sent">Sent</TabsTrigger>
                      <TabsTrigger value="received">Received</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <TabsContent value="all" className="m-0">
                    <TransactionHistory userId={walletAddress || ''} limit={5} />
                  </TabsContent>
                  <TabsContent value="sent" className="m-0">
                    <div className="text-center text-muted-foreground py-8 bg-card/30 rounded-lg border border-white/5">
                      <Wallet className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>Sent transactions filter will be implemented soon.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="received" className="m-0">
                    <div className="text-center text-muted-foreground py-8 bg-card/30 rounded-lg border border-white/5">
                      <Wallet className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>Received transactions filter will be implemented soon.</p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
          
          <div className="space-y-4 col-span-3">
            <h2 className="text-xl font-semibold tracking-tight mb-4">Wallet</h2>
            
            <Card className="web3-card overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent opacity-50"></div>
              <CardHeader className="relative">
                <CardTitle>Wallet Status</CardTitle>
                <CardDescription>Your connected wallet</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-xs text-muted-foreground font-mono">{isConnected ? truncateAddress(walletAddress) : "Not connected"}</p>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                </div>
                <Separator className="my-4 bg-white/5" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm flex items-center">
                      <Zap className="h-4 w-4 text-accent mr-2" />
                      Balance
                    </p>
                    <p className="text-sm font-medium">{isConnected ? balance.toFixed(4) : "0.00"} <span className="text-accent">SOL</span></p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm flex items-center">
                      <Shield className="h-4 w-4 text-accent mr-2" />
                      Pending
                    </p>
                    <p className="text-sm font-medium">{pendingTransactions.toFixed(4)} <span className="text-accent">SOL</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <DashboardDonationCard />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
