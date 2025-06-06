
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Tables } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Search, Filter, Clock, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type Event = Tables<'events'>;

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-listing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(events.map(event => event.category).filter(Boolean)));
  
  // Filter events based on search, category, and date
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    
    let matchesDate = true;
    if (dateFilter === 'upcoming') {
      matchesDate = isFuture(parseISO(event.event_date));
    } else if (dateFilter === 'past') {
      matchesDate = isPast(parseISO(event.event_date));
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy · h:mm a');
  };

  // Check if registration is open
  const isRegistrationOpen = (event: Event) => {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    return deadline > now;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero section */}
      <section className="bg-srmist-blue py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Campus Events</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Discover academic, cultural, and technical events happening across SRMIST campus.
          </p>
        </div>
      </section>
      
      {/* Search and Filters */}
      <section className="bg-white dark:bg-gray-950 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            
            <div className="flex items-center gap-2 md:hidden">
              <Button 
                variant="outline" 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full md:w-auto flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            <div className={cn(
              "md:flex items-center gap-4",
              isFiltersOpen ? "flex flex-col md:flex-row" : "hidden"
            )}>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
      
      {/* Events Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5 mb-4" />
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Link to={`/events/${event.id}`} key={event.id}>
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 card-hover">
                    <div className="aspect-video w-full relative">
                      <img 
                        src={event.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800'} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-srmist-blue backdrop-blur-sm">
                          {event.category || 'Event'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="font-bold text-lg text-white">{event.title}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatEventDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Users className="h-4 w-4 mr-2" />
                          <span>
                            {event.current_participants || 0}
                            {event.max_participants && ` / ${event.max_participants}`} participants
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              Registration {isRegistrationOpen(event) ? 'Open' : 'Closed'}
                            </span>
                          </div>
                          <Button size="sm" variant="ghost" className="text-srmist-blue">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mb-4">
                <Filter className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                No events match your current filters. Try adjusting your search criteria or check back later for new events.
              </p>
              <Button 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setDateFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
