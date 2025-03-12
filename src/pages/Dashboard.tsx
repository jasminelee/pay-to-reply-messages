
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Clock, MessageSquare, Repeat, Wallet, Zap, Shield, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import MessageCard from '@/components/MessageCard';
import TransactionHistory from '@/components/TransactionHistory';
import { currentUser, getMessagesByUser, formatAmount, messages } from '@/utils/mockData';
import { useWallet } from '@/contexts/WalletContext';

const Dashboard = () => {
  const { balance, walletAddress, isConnected } = useWallet();
  const sentMessages = getMessagesByUser(currentUser.id, 'sent');
  const receivedMessages = getMessagesByUser(currentUser.id, 'received');
  
  // Calculate stats
  const pendingReceived = receivedMessages.filter(msg => msg.status === 'pending').length;
  const approvedReceived = receivedMessages.filter(msg => msg.status === 'approved').length;
  const totalReceived = receivedMessages.length;
  
  const pendingSent = sentMessages.filter(msg => msg.status === 'pending').length;
  const approvedSent = sentMessages.filter(msg => msg.status === 'approved').length;
  const totalSent = sentMessages.length;
  
  // Calculate total earnings (sum of approved message payment amounts)
  const totalEarnings = receivedMessages
    .filter(msg => msg.status === 'approved')
    .reduce((sum, msg) => sum + msg.paymentAmount, 0);

  const recentReceivedMessages = receivedMessages
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight web3-gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser.displayName}! Here's an overview of your messaging activity.
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="web3-card animate-scale-in" style={{animationDelay: '100ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold web3-gradient-text">{formatAmount(totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                From {approvedReceived} approved messages
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
              <div className="text-2xl font-bold">{pendingReceived}</div>
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
              <div className="text-2xl font-bold">{totalSent}</div>
              <p className="text-xs text-muted-foreground">
                {approvedSent} approved, {pendingSent} pending
              </p>
            </CardContent>
          </Card>
          
          <Card className="web3-card animate-scale-in" style={{animationDelay: '250ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Received</CardTitle>
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Repeat className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReceived}</div>
              <p className="text-xs text-muted-foreground">
                {approvedReceived} approved, {pendingReceived} pending
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
          {/* Main content */}
          <div className="md:col-span-4 space-y-4">
            <Card className="web3-card">
              <CardHeader className="flex items-center justify-between space-y-0">
                <CardTitle>Recent Messages</CardTitle>
                <Link to="/inbox">
                  <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 hover:bg-accent/5">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReceivedMessages.length > 0 ? (
                    recentReceivedMessages.map(message => (
                      <MessageCard key={message.id} message={message} variant="compact" />
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8 bg-card/30 rounded-lg border border-white/5">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No messages received yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
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
                    <TransactionHistory userId={currentUser.id} limit={5} />
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
          
          {/* Sidebar */}
          <div className="md:col-span-3 space-y-4">
            <Card className="web3-card">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Quick access to common actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start web3-button" asChild>
                  <Link to="/compose">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Compose New Message
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-white/5 hover:bg-accent/5 hover:border-accent/20" asChild>
                  <Link to="/inbox">
                    <Clock className="mr-2 h-4 w-4" />
                    View Pending Messages ({pendingReceived})
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
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
                    <p className="text-xs text-muted-foreground font-mono">{isConnected ? walletAddress : currentUser.walletAddress}</p>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                </div>
                <Separator className="my-4 bg-white/5" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm flex items-center">
                      <Zap className="h-4 w-4 text-accent mr-2" />
                      Balance
                    </p>
                    <p className="text-sm font-medium">{isConnected ? balance.toFixed(2) : "0.00"} <span className="text-accent">sonicSOL</span></p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm flex items-center">
                      <Shield className="h-4 w-4 text-accent mr-2" />
                      Pending
                    </p>
                    <p className="text-sm font-medium">12.00 <span className="text-accent">SOL</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
