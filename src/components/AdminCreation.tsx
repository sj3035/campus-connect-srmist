
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus } from 'lucide-react';

const AdminCreation = () => {
  const { createAdminAccount, isExecutive } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for executives, not regular admins
  if (!isExecutive()) {
    return null;
  }

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('adminEmail') as string;
    const fullName = formData.get('adminFullName') as string;
    
    await createAdminAccount(email, fullName);
    setIsLoading(false);
    
    // Reset form
    e.currentTarget.reset();
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Admin Account
        </CardTitle>
        <CardDescription>
          Create new admin accounts for SRMIST domain emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminFullName">Full Name</Label>
            <Input
              id="adminFullName"
              name="adminFullName"
              type="text"
              placeholder="Admin Full Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="admin@srmist.edu.in"
              required
            />
            <p className="text-xs text-gray-500">
              Must be @srmist.edu.in or @ist.srmtrichy.edu.in domain
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
          </Button>
          <p className="text-xs text-gray-500">
            Default password: SRMIST@2024 (admin should change it using 'Forgot Password')
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminCreation;
