
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Auth page loaded, checking for session...");
    
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Session check result:", session ? "Session found" : "No session");
      setSession(session);
      if (session) {
        // If logged in, redirect to dashboard
        console.log("User is logged in, redirecting to dashboard");
        navigate('/dashboard');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        setSession(session);
        if (session) {
          // If logged in, redirect to dashboard
          console.log("User is now logged in, redirecting to dashboard");
          navigate('/dashboard');
        }
      }
    );

    // Check if we have hash parameters (OAuth callback)
    if (window.location.hash) {
      console.log("Detected hash parameters in URL - likely an OAuth callback");
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTwitterLogin = async () => {
    try {
      setLoading(true);
      console.log("Initiating Twitter login...");
      
      // Get the current URL to use as redirect - ensure it ends with /auth
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/auth`;
      console.log("Using redirect URL:", redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: redirectTo,
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
      
      console.log("Twitter login initiated successfully:", data);
    } catch (error: any) {
      console.error("Login error:", error);
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
          
          {/* Debug section - visible in all environments for troubleshooting */}
          <div className="mt-8 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="space-y-1">
              <p>Current Origin: {window.location.origin}</p>
              <p>Current Path: {location.pathname}</p>
              <p>Redirect URL: {`${window.location.origin}/auth`}</p>
              <p>Has Hash Params: {window.location.hash ? 'Yes' : 'No'}</p>
              <p>Is Session Active: {session ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
