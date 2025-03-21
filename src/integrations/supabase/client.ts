// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Update with correct URL - fix any typos
const SUPABASE_URL = "https://umvaywtxpxpyybpkwptc.supabase.co";
// Make sure this is the correct anon key from your Supabase project settings
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdmF5d3R4cHhweXlicGt3cHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzM1MDQsImV4cCI6MjA1NzMwOTUwNH0.UyOWu-kBwNIL9m0VjlDFVFEubZsNHKtapmnNaK_VwwA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create the Supabase client with default settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Utility function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection error:", error);
      return { success: false, error };
    }
    
    console.log("Supabase connection successful:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Exception checking Supabase connection:", error);
    return { success: false, error };
  }
};

// Check if Twitter auth is configured
export const checkTwitterAuthConfig = async () => {
  try {
    // Try to get the configured OAuth providers
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error checking auth configuration:", error);
      return { success: false, error, message: "Could not check auth configuration" };
    }
    
    // Try to initiate the Twitter OAuth flow without redirecting
    // This is just to check if the provider is configured
    const authUrlCheck = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        skipBrowserRedirect: true,
        redirectTo: `${window.location.origin}/auth`
      },
    });
    
    if (authUrlCheck.error) {
      console.error("Twitter auth configuration error:", authUrlCheck.error);
      return { 
        success: false, 
        error: authUrlCheck.error,
        message: "Twitter authentication is not properly configured in Supabase"
      };
    }
    
    // Check the URL that's being generated to make sure it's correct
    const url = authUrlCheck.data?.url;
    if (url) {
      // The URL should contain the proper redirect parameters
      // Check for expected parameters
      const urlObj = new URL(url);
      const redirectParam = urlObj.searchParams.get('redirect_to');
      
      if (!redirectParam || !redirectParam.includes(window.location.origin)) {
        return {
          success: false,
          message: `Twitter auth URL has incorrect redirect: ${redirectParam || 'none'}`
        };
      }
    }
    
    return { 
      success: true, 
      data: authUrlCheck.data,
      message: "Twitter authentication is properly configured"
    };
  } catch (error) {
    console.error("Exception checking Twitter auth configuration:", error);
    return { success: false, error, message: "Exception checking Twitter auth configuration" };
  }
};