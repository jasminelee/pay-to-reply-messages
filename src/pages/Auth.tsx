import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, checkSupabaseConnection, checkTwitterAuthConfig } from '@/integrations/supabase/client';
import { Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';

// Import these constants from the client file to ensure consistency
const SUPABASE_URL = "https://umvaywtxpxpyybpkwptc.supabase.co";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [twitterAuthStatus, setTwitterAuthStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking');
  const [twitterAuthError, setTwitterAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {    
    // Check Supabase connection
    const verifyConnection = async () => {
      try {
        const result = await checkSupabaseConnection();
        if (result.success) {
          setConnectionStatus('success');
          
          // Now check Twitter auth configuration
          const twitterCheck = await checkTwitterAuthConfig();
          if (twitterCheck.success) {
            setTwitterAuthStatus('configured');
          } else {
            setTwitterAuthStatus('not-configured');
            setTwitterAuthError(twitterCheck.message || "Twitter authentication is not properly configured");
          }
        } else {
          setConnectionStatus('error');
          setConnectionError(result.error.message);
        }
      } catch (error) {
        setConnectionStatus('error');
        setConnectionError(error.message);
      }
    };
    
    verifyConnection();
    
    // Check if we're in a callback from OAuth
    const handleAuthCallback = async () => {
      try {
        // Get hash fragment or query parameters
        const hashParams = window.location.hash;
        const queryParams = window.location.search;
                
        // Check for error parameter first
        if (queryParams.includes('error=')) {
          const params = new URLSearchParams(queryParams);
          const errorCode = params.get('error_code') || 'unknown';
          const errorDescription = params.get('error_description') || 'Unknown error during authentication';
          
          console.error("Auth error in callback:", errorCode, errorDescription);
          setAuthError(errorDescription);
          toast({
            title: `Authentication Error (${errorCode})`,
            description: errorDescription,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        // Process OAuth code callback
        if (queryParams.includes('code=')) {
          setLoading(true);
          
          try {
            // Clear any existing session data first to prevent conflicts
            const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
            if (signOutError) {
              console.warn("Error clearing previous session:", signOutError);
            }
            
            // Exchange the code for a session directly
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(queryParams);
            
            if (exchangeError) {
              console.error("Error exchanging code for session:", exchangeError);
              setAuthError(exchangeError.message);
              toast({
                title: 'Authentication Error',
                description: exchangeError.message,
                variant: 'destructive',
              });
              setLoading(false);
              return;
            }
            
            // Now check if we have a session
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error getting session after code exchange:", error);
              setAuthError(error.message);
              toast({
                title: 'Authentication Error',
                description: error.message,
                variant: 'destructive',
              });
            } else if (data.session) {
              toast({
                title: 'Successfully signed in',
                description: 'Welcome back!',
              });
              
              // Redirect to dashboard
              navigate('/dashboard');
            } else {
              setAuthError("No session established after authentication");
              toast({
                title: 'Authentication Error',
                description: 'Failed to establish a session',
                variant: 'destructive',
              });
            }
          } catch (err) {
            console.error("Exception during code exchange:", err);
            setAuthError(err.message);
            toast({
              title: 'Authentication Error',
              description: err.message,
              variant: 'destructive',
            });
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Exception during auth callback handling:", err);
        setAuthError(err.message);
        setLoading(false);
      }
    };
    
    // Run the callback handler
    handleAuthCallback();
    
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If logged in, redirect to dashboard
        console.log("User is logged in, redirecting to dashboard");
        navigate('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          // If logged in, redirect to dashboard
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTwitterLogin = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Use the current origin for the redirect URL
      const redirectTo = `${window.location.origin}/auth`;
      
      // Store the current URL state to match after redirect
      localStorage.setItem('auth_redirect_before', window.location.href);
      
      // Simple Twitter OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo,
          // Add scopes if needed
          scopes: 'tweet.read users.read',
        },
      });
      
      if (error) {
        console.error("Twitter login error:", error);
        toast({
          title: 'Error logging in',
          description: error.message || 'An error occurred during login',
          variant: 'destructive',
        });
        throw error;
      }
      
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message);
      toast({
        title: 'Error logging in',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="w-full max-w-md p-8 space-y-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <Button 
              onClick={handleTwitterLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a91da] transition-all duration-200"
            >
              <Twitter className="h-5 w-5" />
              <span>{loading ? 'Connecting...' : 'Sign in with Twitter'}</span>
            </Button>
            
            <div className="text-center text-sm mt-6 text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
          
          <div className="mt-8 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="space-y-1">
              <p>Current URL: {window.location.href}</p>
              <p>Redirect URL: {`${window.location.origin}/auth`}</p>
              <p>Supabase URL: {SUPABASE_URL}</p>
              <p>Connection Status: {connectionStatus === 'checking' ? 'Checking...' : connectionStatus === 'success' ? '✅ Connected' : '❌ Error'}</p>
              {connectionError && <p className="text-red-500">Connection Error: {connectionError}</p>}
              <p>Twitter Auth: {twitterAuthStatus === 'checking' ? 'Checking...' : twitterAuthStatus === 'configured' ? '✅ Configured' : '❌ Not Configured'}</p>
              {twitterAuthError && <p className="text-red-500">Twitter Auth Error: {twitterAuthError}</p>}
              {authError && <p className="text-red-500">Auth Error: {authError}</p>}
              <p>Hash: {window.location.hash || 'none'}</p>
              <p>Query: {window.location.search || 'none'}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;