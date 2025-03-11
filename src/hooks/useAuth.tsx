
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  twitter_username: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Log the start of the auth check
    console.log("AuthProvider: Initializing auth state check");
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check:", session ? "Session found" : "No session");
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("AuthProvider: User found in session, fetching profile");
        fetchProfile(session.user.id);
      } else {
        console.log("AuthProvider: No user in session");
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthProvider: Auth state change event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("AuthProvider: User available after auth change, fetching profile");
          fetchProfile(session.user.id);
        } else {
          console.log("AuthProvider: No user after auth change");
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log("AuthProvider: Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log("AuthProvider: Fetching profile for user ID:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("AuthProvider: Error fetching profile:", error);
      } else {
        console.log("AuthProvider: Profile fetched successfully:", data);
        setProfile(data);
      }
    } catch (error) {
      console.error("AuthProvider: Exception when fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Twitter
  const signInWithTwitter = async () => {
    setIsLoading(true);
    try {
      console.log("AuthProvider: Initiating Twitter sign-in");
      const redirectTo = `${window.location.origin}/auth`;
      console.log("AuthProvider: Using redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: redirectTo,
        },
      });
      
      if (error) {
        console.error("AuthProvider: Twitter sign-in error:", error);
        throw error;
      }
      
      console.log("AuthProvider: Twitter sign-in initiated successfully");
    } catch (error) {
      console.error("AuthProvider: Sign-in error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log("AuthProvider: Signing out");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("AuthProvider: Sign-out error:", error);
        throw error;
      }
      console.log("AuthProvider: Sign-out successful");
    } catch (error) {
      console.error("AuthProvider: Sign-out exception:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signInWithTwitter,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
