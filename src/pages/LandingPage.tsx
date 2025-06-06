
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Event = Tables<'events'>;

const LandingPage = () => {
  const { user } = useAuth();

  // Fetch featured events
  const { data: featuredEvents = [] } = useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('event_date', { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data as Event[];
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-srmist-blue to-srmist-light-blue overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.5),rgba(255,255,255,0.1))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Your Gateway to <span className="text-yellow-300">SRMIST Events</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-xl">
                Discover, participate and organize campus events all in one place. Stay connected with what's happening across SRMIST.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button asChild size="lg" className="bg-white text-srmist-blue hover:bg-white/90 transition btn-hover">
                  <Link to="/events">Browse Events</Link>
                </Button>
                {!user && (
                  <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10 transition btn-hover">
                    <Link to="/auth">Login as Organizer</Link>
                  </Button>
                )}
                {user && (
                  <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10 transition btn-hover">
                    <Link to="/create-event">Create Event</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="hidden md:flex justify-center relative">
              <div className="absolute -rotate-12 transform-gpu blur-xl opacity-50 bg-blue-400 rounded-full w-72 h-72"></div>
              <div className="absolute rotate-12 transform-gpu blur-xl opacity-50 bg-purple-400 rounded-full w-72 h-72 translate-x-10"></div>
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 z-10 w-[400px] rotate-3 transform-gpu">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Badge className="bg-srmist-blue">Technical</Badge>
                    <h3 className="text-lg font-bold mt-2">AI Workshop Series</h3>
                  </div>
                  <div className="flex items-center text-sm bg-srmist-gray rounded-full px-3 py-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>June 15</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="h-3 w-3 mr-2" />
                    <span>2:00 PM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-3 w-3 mr-2" />
                    <span>Tech Park Auditorium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need For Campus Events</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center space-y-4 hover-scale">
              <div className="bg-srmist-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-srmist-blue" />
              </div>
              <h3 className="text-xl font-semibold">Discover Events</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find and filter events by department, date, or category to discover what interests you.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center space-y-4 hover-scale">
              <div className="bg-srmist-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-srmist-blue" />
              </div>
              <h3 className="text-xl font-semibold">Easy Registration</h3>
              <p className="text-gray-600 dark:text-gray-400">
                One-click registration for events with instant confirmation and reminders.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center space-y-4 hover-scale">
              <div className="bg-srmist-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-srmist-blue" />
              </div>
              <h3 className="text-xl font-semibold">Organize Events</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage your own events with powerful tools for organizers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Button asChild variant="outline" className="group">
              <Link to="/events" className="flex items-center">
                View All
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map((event) => (
              <Link to={`/events/${event.id}`} key={event.id}>
                <Card className="overflow-hidden card-hover h-full">
                  <div className="aspect-video w-full relative">
                    <img 
                      src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-srmist-blue backdrop-blur-sm">{event.category || 'Event'}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-white/90 text-black text-xs font-semibold px-2 py-1 rounded backdrop-blur-sm">
                        {formatDate(event.event_date)}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {event.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{event.venue}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {featuredEvents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No upcoming events at the moment. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-srmist-blue to-srmist-light-blue rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Get Involved?</h2>
              <p className="text-xl text-white/90">
                Join the SRMIST community today and never miss another campus event.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {!user ? (
                  <>
                    <Button asChild size="lg" className="bg-white text-srmist-blue hover:bg-white/90 btn-hover">
                      <Link to="/auth">Sign Up Now</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10 btn-hover">
                      <Link to="/events">Browse Events</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="lg" className="bg-white text-srmist-blue hover:bg-white/90 btn-hover">
                    <Link to="/create-event">Create an Event</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
