
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  fetchUserProfile: () => Promise<void>;
  createAdminAccount: (email: string, fullName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if email is from admin domain
  const isAdminDomain = (email: string) => {
    return email.endsWith('@srmist.edu.in') || email.endsWith('@ist.srmtrichy.edu.in');
  };

  const fetchUserProfile = async () => {
    if (!user) {
      setUserRole(null);
      return;
    }
    
    try {
      console.log('Fetching user profile for:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      console.log('User role fetched:', data?.role);
      setUserRole(data?.role || 'student');
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fetch user profile when user logs in, but defer it to avoid recursion
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile();
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update fetchUserProfile when user changes
  useEffect(() => {
    if (user && !userRole) {
      fetchUserProfile();
    }
  }, [user, userRole]);

  const signUp = async (email: string, password: string, fullName: string, role: string = 'student') => {
    // Check if trying to create admin account via regular signup
    if (isAdminDomain(email)) {
      const error = new Error('Admin accounts cannot be created through regular signup');
      toast({
        title: "Sign Up Error",
        description: "Admin accounts cannot be created through this form. Please contact the system administrator.",
        variant: "destructive",
      });
      return { error };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: 'student' // Force all regular signups to be students
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      });
    }

    return { error };
  };

  const createAdminAccount = async (email: string, fullName: string) => {
    if (!isAdminDomain(email)) {
      const error = new Error('Only SRMIST domain emails can be admin accounts');
      toast({
        title: "Admin Account Error",
        description: "Only @srmist.edu.in or @ist.srmtrichy.edu.in emails can be admin accounts.",
        variant: "destructive",
      });
      return { error };
    }

    const commonPassword = 'SRMIST@2024'; // Common initial password for admin accounts
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password: commonPassword,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: 'admin'
        }
      }
    });

    if (error) {
      toast({
        title: "Admin Account Creation Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Admin Account Created",
        description: `Admin account created with default password. Please ask the user to change it using 'Forgot Password'.`,
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUserRole(null);
    }
  };

  const isAdmin = () => userRole === 'admin';
  const isStudent = () => userRole === 'student';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin,
      isStudent,
      fetchUserProfile,
      createAdminAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
