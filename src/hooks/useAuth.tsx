
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
        setUserRole('student'); // Default to student if error
        return;
      }
      
      console.log('User role fetched:', data?.role);
      setUserRole(data?.role || 'student');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserRole('student'); // Default to student if error
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle different auth events
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, fetching profile...');
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            if (mounted) {
              try {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                if (mounted) {
                  if (error) {
                    console.error('Error fetching user profile:', error);
                    setUserRole('student');
                  } else {
                    console.log('User role fetched:', data?.role);
                    setUserRole(data?.role || 'student');
                  }
                  setLoading(false);
                }
              } catch (error) {
                console.error('Error in profile fetch:', error);
                if (mounted) {
                  setUserRole('student');
                  setLoading(false);
                }
              }
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            // Use setTimeout for initial session as well
            setTimeout(async () => {
              if (mounted) {
                try {
                  const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();
                  
                  if (mounted) {
                    if (error) {
                      console.error('Error fetching initial user profile:', error);
                      setUserRole('student');
                    } else {
                      console.log('Initial user role fetched:', data?.role);
                      setUserRole(data?.role || 'student');
                    }
                    setLoading(false);
                  }
                } catch (error) {
                  console.error('Error in initial profile fetch:', error);
                  if (mounted) {
                    setUserRole('student');
                    setLoading(false);
                  }
                }
              }
            }, 100);
          } else {
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch user profile for existing session
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (mounted) {
                if (error) {
                  console.error('Error fetching existing session profile:', error);
                  setUserRole('student');
                } else {
                  console.log('Existing session role fetched:', data?.role);
                  setUserRole(data?.role || 'student');
                }
                setLoading(false);
              }
            } catch (error) {
              console.error('Error in existing session profile fetch:', error);
              if (mounted) {
                setUserRole('student');
                setLoading(false);
              }
            }
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: string = 'student') => {
    try {
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
        console.error('Sign up error:', error);
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
    } catch (error) {
      console.error('Sign up catch error:', error);
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred during sign up.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const createAdminAccount = async (email: string, fullName: string) => {
    try {
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
        console.error('Admin account creation error:', error);
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
    } catch (error) {
      console.error('Admin account creation catch error:', error);
      toast({
        title: "Admin Account Creation Error",
        description: "An unexpected error occurred during admin account creation.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign in successful for:', email);
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Sign in catch error:', error);
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred during sign in.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setUserRole(null);
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive",
      });
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
