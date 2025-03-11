
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
      navigate('/auth', { state: { from: location } });
    }
  }, [user, isLoading, requireAuth, navigate, location]);

  // Show loading state when checking authentication
  if (isLoading && requireAuth) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="py-6 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PayToReply. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
