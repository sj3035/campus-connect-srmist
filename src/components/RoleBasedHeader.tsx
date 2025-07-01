
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Plus, Settings, LogOut, User, Shield } from 'lucide-react';

const RoleBasedHeader = () => {
  const { user, userRole, signOut, isAdmin, isStudent, isExecutive } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-srmist-blue">
              CampusConnect
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/events">
                <Button variant="ghost">Events</Button>
              </Link>
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-srmist-blue">
            CampusConnect
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link to="/events">
              <Button variant="ghost">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>
            </Link>
            
            {isStudent() && (
              <Link to="/dashboard">
                <Button variant="ghost">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            
            {/* Only regular admins can create events */}
            {isAdmin() && (
              <Link to="/create-event">
                <Button variant="ghost">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
            
            {/* Executives get approval panel */}
            {isExecutive() && (
              <Link to="/executive">
                <Button variant="ghost">
                  <Shield className="h-4 w-4 mr-2" />
                  Executive Panel
                </Button>
              </Link>
            )}
            
            {/* Only regular admins get admin panel (not executives) */}
            {isAdmin() && (
              <Link to="/admin">
                <Button variant="ghost">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {userRole}
              </Badge>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default RoleBasedHeader;
