
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ui/use-theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import WalletConnect from './WalletConnect';

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  
  return (
    <div className="shadow-sm bg-black/40 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
      <div className="container h-16 mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl web3-gradient-text">Squeaky Wheel</span>
        </Link>
        <div className="flex items-center space-x-4">
          <WalletConnect />
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'User'} />
                    <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/share/${profile?.twitter_username}`}>Share Page</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
