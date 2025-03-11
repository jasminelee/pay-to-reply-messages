import { ArrowRight, CheckCircle, DollarSign, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-blue-500/80 to-purple-600/80 py-4 mb-8 w-full">
        <div className="container px-4 mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span className="text-white font-medium">Introducing Pay-to-Reply Messaging</span>
          </div>
          <div className="text-white/80 text-sm hidden md:block">
            Powered by sonicSOL
          </div>
        </div>
      </section>
      
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <div className="inline-block animate-float">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter animate-slide-up">
              Pay-to-Reply Messaging
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed animate-slide-up" style={{animationDelay: '100ms'}}>
              Send direct messages backed by cryptocurrency. Recipients have full control to approve or reject messages.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{animationDelay: '200ms'}}>
              <Link to="/compose">
                <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 shadow-button">
                  Start Messaging
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/inbox">
                <Button variant="outline" className="shadow-button">
                  View Your Inbox
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="glass-card animate-scale-in" style={{animationDelay: '300ms'}}>
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle>Cryptocurrency Backed</CardTitle>
                <CardDescription>
                  Send messages with sonicSOL payments attached
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every message is backed by cryptocurrency, ensuring meaningful interactions and reducing spam.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card animate-scale-in" style={{animationDelay: '400ms'}}>
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle>Recipient Control</CardTitle>
                <CardDescription>
                  Full power to approve or reject messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Recipients decide which messages to accept, and rejected message payments are automatically refunded.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card animate-scale-in" style={{animationDelay: '500ms'}}>
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                </div>
                <CardTitle>Donation Option</CardTitle>
                <CardDescription>
                  Redirect received payments to causes you care about
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Easily donate received payments to your preferred causes or organizations with just a few clicks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-12 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter">
              How It Works
            </h2>
            <p className="max-w-[700px] text-muted-foreground">
              Send and receive messages with cryptocurrency payments in just a few simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Connect Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect your sonicSOL compatible wallet to get started with secure transactions.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Send a Message</h3>
              <p className="text-sm text-muted-foreground">
                Compose your message, attach a payment amount, and send it to your recipient.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Manage Responses</h3>
              <p className="text-sm text-muted-foreground">
                Recipients can approve or reject messages, with automatic refunds for rejected messages.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 mt-auto">
        <div className="container px-4 md:px-6">
          <div className="glass-panel rounded-xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4">
              Ready to Start Messaging?
            </h2>
            <p className="max-w-[600px] mx-auto text-muted-foreground mb-6">
              Connect your wallet now and experience a new way of direct messaging with cryptocurrency.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/compose">
                <Button size="lg" className="bg-primary hover:bg-primary/90 transition-all duration-300 shadow-button">
                  Start Messaging
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
