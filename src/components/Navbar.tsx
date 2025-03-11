
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Home, LogIn, LogOut, Mail, Menu, MessageSquare, Plus, User, X, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnect from './WalletConnect';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signInWithTwitter, signOut } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5" /> },
    { name: 'Inbox', path: '/inbox', icon: <Mail className="h-5 w-5" /> },
    { name: 'Compose', path: '/compose', icon: <Plus className="h-5 w-5" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <User className="h-5 w-5" /> },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogin = async () => {
    try {
      await signInWithTwitter();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">PayToReply</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu & Wallet */}
          <div className="flex items-center space-x-4">
            <button className="relative p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.username || user.email || ''} />
                      <AvatarFallback>{profile?.username?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile?.username && (
                        <p className="font-medium">@{profile.username}</p>
                      )}
                      {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                size="sm" 
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-[#1DA1F2] hover:bg-[#1a91da] transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
                <span>Sign in</span>
              </Button>
            )}
            
            <WalletConnect />

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-5 w-5" />
                ) : (
                  <Menu className="block h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="glass-panel px-2 pt-2 pb-3 space-y-1 sm:px-3 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closeMenu}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                location.pathname === link.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-gray-800/50'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
          
          {!user && (
            <Button 
              onClick={handleLogin}
              className="flex items-center w-full justify-start space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 bg-[#1DA1F2] hover:bg-[#1a91da]"
            >
              <Twitter className="h-5 w-5" />
              <span>Sign in with Twitter</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
