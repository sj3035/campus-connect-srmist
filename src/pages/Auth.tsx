
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Check if email is from admin domain
  const isAdminDomain = (email: string) => {
    return email.endsWith('@srmist.edu.in') || email.endsWith('@ist.srmtrichy.edu.in');
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    // Admin domain emails will automatically become admins, student emails become students
    const role = isAdminDomain(email) ? 'admin' : 'student';
    await signUp(email, password, fullName, role);
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-srmist-blue">CampusConnect</h1>
          <p className="text-gray-600 dark:text-gray-400">
            SRMIST Event Management Platform
          </p>
        </div>

        <Card className="border-0 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-950/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="data-[state=active]:bg-srmist-blue data-[state=active]:text-white">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-srmist-blue data-[state=active]:text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="animate-fade-in">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@srmist.edu.in"
                      required
                      autoComplete="email"
                      className="bg-white/50 dark:bg-gray-900/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <a 
                        href="#" 
                        className="text-xs text-srmist-blue hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Password reset functionality would be implemented here.');
                        }}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="pr-10 bg-white/50 dark:bg-gray-900/50"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-srmist-blue hover:bg-srmist-dark-blue"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

              </TabsContent>
              
              <TabsContent value="signup" className="animate-fade-in">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Your Full Name"
                      required
                      className="bg-white/50 dark:bg-gray-900/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@srmist.edu.in"
                      required
                      className="bg-white/50 dark:bg-gray-900/50"
                    />
                    <p className="text-xs text-gray-500">
                      SRMIST domain emails (@srmist.edu.in or @ist.srmtrichy.edu.in) automatically become admin accounts.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        minLength={6}
                        required
                        className="pr-10 bg-white/50 dark:bg-gray-900/50"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Password must be at least 6 characters.</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-srmist-blue hover:bg-srmist-dark-blue"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <p className="text-center text-xs text-gray-500 mt-6">
              By continuing, you agree to CampusConnect's{' '}
              <a href="#" className="text-srmist-blue hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-srmist-blue hover:underline">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
