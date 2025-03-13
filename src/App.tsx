
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WalletProvider } from "@/contexts/WalletContext";
import { ThemeProvider } from "@/components/ui/use-theme";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Compose from "./pages/Compose";
import Share from "./pages/Share";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Detect if we're running in the Lovable preview environment
  const isLovablePreview = window.location.hostname.includes('lovable.app');
  
  // Log important environment information
  console.log("App initialization:", {
    environment: import.meta.env.MODE,
    isLovablePreview,
    origin: window.location.origin,
    hostname: window.location.hostname
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <WalletProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/compose" element={<Compose />} />
                  <Route path="/share/:username" element={<Share />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
