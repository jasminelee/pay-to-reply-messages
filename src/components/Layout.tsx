
import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const Layout = ({ children, requireAuth = false }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Protect routes that require authentication
  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      // Store the current URL for redirect after authentication
      localStorage.setItem('auth_redirect_before', window.location.href);
      navigate('/auth', { state: { from: location } });
    }
  }, [user, isLoading, requireAuth, navigate, location]);

  // Detect if running in Lovable preview environment
  const isLovablePreview = () => {
    return window.location.hostname.includes('lovable.app') || 
           window.location.hostname.includes('squeaky-wheel.lovable.app');
  };

  // Log environment information for debugging
  useEffect(() => {
    console.log("Layout environment check:", {
      hostname: window.location.hostname,
      isLovablePreview: isLovablePreview(),
      origin: window.location.origin
    });
  }, []);

  // Show loading state when checking authentication
  if (isLoading && requireAuth) {
    return (
      <div className="flex flex-col min-h-screen mesh-bg">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-32 bg-accent/20 rounded-md mb-4 mx-auto"></div>
            <div className="h-4 w-48 bg-accent/10 rounded-md mx-auto"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen mesh-bg">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="py-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SqueakyWheel. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;