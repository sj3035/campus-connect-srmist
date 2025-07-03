
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-srmist-blue/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-8 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-indigo-500/4 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <RoleBasedHeader />
      
      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-srmist-blue text-white hover:bg-srmist-dark-blue transition-colors duration-300 animate-fade-in">
              SRMIST Event Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-srmist-blue via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in hover:scale-105 transition-transform duration-500">
              CampusConnect
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed animate-fade-in delay-200">
              Your gateway to campus life at SRMIST. Discover events, connect with peers, and make the most of your university experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
              {!user ? (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="bg-srmist-blue hover:bg-srmist-dark-blue transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/events">
                    <Button size="lg" variant="outline" className="border-2 hover:border-srmist-blue hover:text-srmist-blue transform hover:scale-105 transition-all duration-300">
                      Browse Events
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/events">
                    <Button size="lg" className="bg-srmist-blue hover:bg-srmist-dark-blue transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      Browse Events
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  {isAdmin() && (
                    <Link to="/admin">
                      <Button size="lg" variant="outline" className="border-2 hover:border-srmist-blue hover:text-srmist-blue transform hover:scale-105 transition-all duration-300">
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
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-110 transition-transform duration-300">
                <div className="text-4xl font-bold text-srmist-blue mb-2 group-hover:text-srmist-dark-blue transition-colors">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">{stat.label}</div>
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
              <Card key={index} className="border-0 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-950/90 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-srmist-blue/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-srmist-blue/20 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-srmist-blue group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <CardTitle className="group-hover:text-srmist-blue transition-colors duration-300">{feature.title}</CardTitle>
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
        <section className="py-20 px-4 bg-gradient-to-r from-srmist-blue via-blue-600 to-indigo-600 text-white relative overflow-hidden">
          {/* Animated background elements for CTA */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="container mx-auto text-center relative">
            <h2 className="text-4xl font-bold mb-4 animate-fade-in">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in delay-200">
              Join thousands of SRMIST students who are already using CampusConnect to enhance their university experience.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-srmist-blue hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fade-in delay-300">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPage;
