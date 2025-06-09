
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  LogOut,
  User,
  Calendar,
  Bell,
  Menu,
  X,
  Home,
  PlusCircle,
  ListTodo,
  Moon,
  Sun,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-gray-950 border-b shadow-sm backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-srmist-blue to-srmist-light-blue text-transparent bg-clip-text">CampusConnect</span>
              <Badge variant="outline" className="hidden md:flex font-semibold text-xs">SRMIST</Badge>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={cn(
                "px-1 py-2 text-sm font-medium animated-link", 
                isActive('/') ? "text-primary" : "text-gray-700 dark:text-gray-300"
              )}
            >
              Home
            </Link>
            <Link 
              to="/events" 
              className={cn(
                "px-1 py-2 text-sm font-medium animated-link", 
                isActive('/events') ? "text-primary" : "text-gray-700 dark:text-gray-300"
              )}
            >
              Events
            </Link>
            {user && (
              <Link 
                to="/dashboard" 
                className={cn(
                  "px-1 py-2 text-sm font-medium animated-link", 
                  isActive('/dashboard') ? "text-primary" : "text-gray-700 dark:text-gray-300"
                )}
              >
                Dashboard
              </Link>
            )}
            {user && isAdmin() && (
              <Link 
                to="/create-event" 
                className={cn(
                  "px-1 py-2 text-sm font-medium animated-link", 
                  isActive('/create-event') ? "text-primary" : "text-gray-700 dark:text-gray-300"
                )}
              >
                Create Event
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            {user ? (
              <>
                {/* Notification bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-[300px] overflow-auto">
                      <div className="p-3 hover:bg-muted rounded-md">
                        <p className="text-sm font-medium">Your event registration was approved</p>
                        <p className="text-xs text-muted-foreground mt-1">3 minutes ago</p>
                      </div>
                      <div className="p-3 hover:bg-muted rounded-md">
                        <p className="text-sm font-medium">New event in your department</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              
                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full h-8 w-8 border">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Events</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild className="bg-srmist-blue hover:bg-srmist-dark-blue" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-b shadow-lg animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                <span>Home</span>
              </div>
            </Link>
            <Link to="/events" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Events</span>
              </div>
            </Link>
            {user && (
              <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="flex items-center">
                  <ListTodo className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </div>
              </Link>
            )}
            {user && isAdmin() && (
              <Link to="/create-event" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Create Event</span>
                </div>
              </Link>
            )}
            {!user && (
              <div className="px-3 pt-4">
                <Button asChild className="w-full">
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
