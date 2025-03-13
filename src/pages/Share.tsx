
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AtSign, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Layout from '@/components/Layout';
import ComposeMessage from '@/components/ComposeMessage';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/components/ui/use-toast';
import AuthRequiredCard from '@/components/AuthRequiredCard';

const Share = () => {
  const { username } = useParams<{ username: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isConnected, isLoading: walletLoading } = useWallet();
  const [recipient, setRecipient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('twitter_username', username)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          toast({
            variant: 'destructive',
            title: 'User not found',
            description: 'We couldn\'t find this user in our system.'
          });
        } else {
          setRecipient(data);
        }
      } catch (err) {
        console.error('Exception fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [username]);
  
  // Prevent sending messages to yourself
  const isSelfMessage = profile?.twitter_username === username;
  
  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-fade-in max-w-3xl mx-auto">
        {isLoading || authLoading ? (
          <Card className="web3-card animate-pulse">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-52 bg-accent/10 rounded-md"></div>
                <div className="h-6 w-72 bg-accent/5 rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        ) : recipient ? (
          <>
            <Card className="web3-card overflow-hidden">
              <CardHeader className="relative border-b border-white/5">
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-primary/20 to-accent/20 opacity-50"></div>
                <div className="flex items-center space-x-4 pt-4">
                  <Avatar className="h-14 w-14 ring-2 ring-accent/20 shadow-lg">
                    <AvatarImage src={recipient.avatar_url} alt={recipient.twitter_username} />
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {recipient.twitter_username?.charAt(0).toUpperCase() || recipient.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {recipient.twitter_username ? (
                        <span className="web3-gradient-text">@{recipient.twitter_username}</span>
                      ) : (
                        <span>{recipient.username}</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      <span>Send a direct message</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {isSelfMessage ? (
                <CardContent className="py-8">
                  <div className="text-center space-y-4 py-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                      <AtSign className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">This is your share page!</h3>
                      <p className="text-muted-foreground mt-1">
                        Share this link with others so they can send you direct messages:
                      </p>
                      <div className="mt-4 p-3 bg-black/40 rounded-md border border-white/10 font-mono text-sm overflow-x-auto">
                        {window.location.origin}/share/{username}
                      </div>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-white/10 hover:bg-accent/5 hover:border-accent/20"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/share/${username}`);
                          toast({
                            title: 'Link Copied',
                            description: 'Your share link has been copied to clipboard.'
                          });
                        }}
                      >
                        Copy Share Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : user && isConnected ? (
                <CardContent className="p-0">
                  <ComposeMessage 
                    preselectedRecipient={recipient.twitter_username || recipient.username}
                    streamlined={true}
                  />
                </CardContent>
              ) : (
                <CardContent className="py-8">
                  <AuthRequiredCard 
                    title="Connect to send a message"
                    description={`You need to connect your wallet and sign in to send a message to @${recipient.twitter_username || recipient.username}`}
                  />
                </CardContent>
              )}
            </Card>
          </>
        ) : (
          <Card className="web3-card">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                  <AtSign className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium">User Not Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find a user with the username @{username}
                </p>
                <Button className="web3-button mt-4" asChild>
                  <a href="/">
                    Go to Homepage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Share;
