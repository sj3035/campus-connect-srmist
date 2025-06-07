
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, ArrowRight, Star, Zap, Shield } from 'lucide-react';
import RoleBasedHeader from '@/components/RoleBasedHeader';
import { useAuth } from '@/hooks/useAuth';

const LandingPage = () => {
  const { user, isAdmin } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: "Event Management",
      description: "Create, manage, and discover campus events with ease",
    },
    {
      icon: Users,
      title: "Community Engagement",
      description: "Connect with fellow students and join exciting activities",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure platform with different access levels for students and admins",
    },
  ];

  const stats = [
    { label: "Active Events", value: "150+" },
    { label: "Registered Users", value: "2,500+" },
    { label: "Successful Events", value: "500+" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <RoleBasedHeader />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-srmist-blue text-white">
              SRMIST Event Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-srmist-blue to-blue-600 bg-clip-text text-transparent">
              CampusConnect
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Your gateway to campus life at SRMIST. Discover events, connect with peers, and make the most of your university experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="bg-srmist-blue hover:bg-srmist-dark-blue">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button size="lg" variant="outline">
                      Browse Events
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/events">
                    <Button size="lg" className="bg-srmist-blue hover:bg-srmist-dark-blue">
                      Browse Events
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  {isAdmin() && (
                    <Link to="/admin">
                      <Button size="lg" variant="outline">
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-srmist-blue mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose CampusConnect?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built specifically for SRMIST students, our platform offers everything you need to stay connected with campus life.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-srmist-blue/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-srmist-blue" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 px-4 bg-gradient-to-r from-srmist-blue to-blue-600 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of SRMIST students who are already using CampusConnect to enhance their university experience.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-srmist-blue hover:bg-gray-100">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPage;
