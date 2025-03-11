
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Clock, MessageSquare, Repeat, Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import MessageCard from '@/components/MessageCard';
import TransactionHistory from '@/components/TransactionHistory';
import { currentUser, getMessagesByUser, formatAmount, messages } from '@/utils/mockData';

const Dashboard = () => {
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser.displayName}! Here's an overview of your messaging activity.
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card animate-scale-in" style={{animationDelay: '100ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                From {approvedReceived} approved messages
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in" style={{animationDelay: '150ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReceived}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your response
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in" style={{animationDelay: '200ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSent}</div>
              <p className="text-xs text-muted-foreground">
                {approvedSent} approved, {pendingSent} pending
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in" style={{animationDelay: '250ms'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages Received</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
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
            <Card className="glass-card">
              <CardHeader className="flex items-center justify-between space-y-0">
                <CardTitle>Recent Messages</CardTitle>
                <Link to="/inbox">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View All
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
                    <p className="text-center text-muted-foreground py-8">
                      No messages received yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <Tabs defaultValue="all">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle>Transaction History</CardTitle>
                    <TabsList className="bg-muted/50">
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
                    <p className="text-center text-muted-foreground py-8">
                      Sent transactions filter will be implemented soon.
                    </p>
                  </TabsContent>
                  <TabsContent value="received" className="m-0">
                    <p className="text-center text-muted-foreground py-8">
                      Received transactions filter will be implemented soon.
                    </p>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="md:col-span-3 space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Quick access to common actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" asChild>
                  <Link to="/compose">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Compose New Message
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/inbox">
                    <Clock className="mr-2 h-4 w-4" />
                    View Pending Messages ({pendingReceived})
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Wallet Status</CardTitle>
                <CardDescription>Your connected wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-xs text-muted-foreground">{currentUser.walletAddress}</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <p className="text-sm">Balance</p>
                    <p className="text-sm font-medium">125.00 sonicSOL</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm">Pending</p>
                    <p className="text-sm font-medium">12.00 sonicSOL</p>
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
