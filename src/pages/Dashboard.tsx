import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import EventCard from '@/components/EventCard';
import ParticipantDashboard from '@/components/ParticipantDashboard';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  PlusCircle,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

type Event = Tables<'events'>;
type Registration = Tables<'registrations'>;

const Dashboard: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('registered');

  // Determine if user is admin for dashboard features
  const showAdminTabs = isAdmin();

  // Fetch approved events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
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

  // Fetch user's registrations (only for students)
  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations', user?.id],
    queryFn: async () => {
      if (!user || !isStudent()) return [];
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as Registration[];
    },
    enabled: !!user && isStudent(),
  });

  // Fetch user's organized events (only for admins)
  const { data: organizedEvents = [] } = useQuery({
    queryKey: ['organized-events', user?.id],
    queryFn: async () => {
      if (!user || !isAdmin()) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user && isAdmin(),
  });

  // Get approved events created by current admin for participant management
  const approvedAdminEvents = organizedEvents.filter(event => event.status === 'approved');

  // Fetch event registrations for approved events created by the current admin
  const { data: eventRegistrations = {} } = useQuery({
    queryKey: ['event-registrations', user?.id],
    queryFn: async () => {
      if (!user || !isAdmin() || approvedAdminEvents.length === 0) return {};
      
      const approvedEventIds = approvedAdminEvents.map(event => event.id);
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*, profiles:user_id(*)')
        .in('event_id', approvedEventIds);
      
      if (error) throw error;
      
      // Group registrations by event_id
      const grouped = (data as any[]).reduce((acc, registration) => {
        if (!acc[registration.event_id]) {
          acc[registration.event_id] = [];
        }
        acc[registration.event_id].push(registration);
        return acc;
      }, {} as Record<string, any[]>);
      
      return grouped;
    },
    enabled: !!user && isAdmin() && approvedAdminEvents.length > 0,
  });

  // Register for event mutation (only for students)
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');
      if (!isStudent()) throw new Error('Only students can register for events');

      // Fetch user profile data for required fields
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, student_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile)
        throw new Error("User profile not found. Please update your profile.");

      // Get student_id as roll_number
      const roll_number = profile.student_id || "";

      // Insert with all required fields
      const { error } = await supabase.from('registrations').insert({
        event_id: eventId,
        user_id: user.id,
        status: 'pending',
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || "",
        roll_number: roll_number,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast({
        title: "Registration Successful",
        description:
          "You have successfully registered for the event. Your registration is pending approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for the event.",
        variant: "destructive",
      });
    },
  });

  // Update registration status mutation
  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('registrations')
        .update({ status, approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      toast({
        title: "Registration Updated",
        description: "The registration status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update registration status.",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organized-events'] });
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete the event.",
        variant: "destructive",
      });
    },
  });

  // Filter events based on search and category
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(events.map(event => event.category).filter(Boolean)));

  // Check if user is registered for an event (only for students)
  const isRegistered = (eventId: string) => {
    if (!isStudent()) return false;
    return registrations.some(reg => reg.event_id === eventId);
  };

  // Get user's registered events (only for students)
  const getRegisteredEvents = () => {
    if (!isStudent()) return [];
    return events.filter(event => 
      registrations.some(reg => reg.event_id === event.id)
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your events and registrations all in one place.
              </p>
            </div>
            
            {showAdminTabs && (
              <div className="flex gap-2">
                <Button asChild className="btn-hover">
                  <Link to="/create-event">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Event
                  </Link>
                </Button>
                {approvedAdminEvents.length > 0 && (
                  <Badge variant="outline" className="px-3 py-1">
                    <Users className="h-3 w-3 mr-1" />
                    {approvedAdminEvents.length} Approved Event{approvedAdminEvents.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue={isStudent() ? "registered" : "organized"} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`w-full ${
            showAdminTabs && approvedAdminEvents.length > 0 
              ? "grid grid-cols-3" 
              : showAdminTabs 
                ? "grid grid-cols-2" 
                : "grid grid-cols-1"
          }`}>
            {isStudent() && <TabsTrigger value="registered">My Registrations</TabsTrigger>}
            {showAdminTabs && <TabsTrigger value="organized">My Events</TabsTrigger>}
            {showAdminTabs && approvedAdminEvents.length > 0 && (
              <TabsTrigger value="participants" className="relative">
                Manage Participants
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {approvedAdminEvents.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* My Registrations Tab (Only for students) */}
          {isStudent() && (
            <TabsContent value="registered" className="mt-6">
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">My Registered Events</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View all events you have registered for.
                  </p>
                </div>
                
                {registrations.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getRegisteredEvents().map((event) => (
                        <Link to={`/events/${event.id}`} key={event.id}>
                          <EventCard
                            event={event}
                            isRegistered={true}
                            showRegisterButton={false}
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
                    <Button asChild>
                      <Link to="/events">Browse Events</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* My Events Tab (Organized Events) - only admins */}
          {showAdminTabs && (
            <TabsContent value="organized" className="mt-6">
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">My Organized Events</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage events that you've created.
                  </p>
                </div>
                
                {organizedEvents.length > 0 ? (
                  <div className="px-4 py-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Participants</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizedEvents.map((event) => {
                          const eventRegs = eventRegistrations[event.id] || [];
                          const approvedCount = eventRegs.filter(r => r.status === 'approved').length;
                          
                          return (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium truncate max-w-[200px]">
                                {event.title}
                              </TableCell>
                              <TableCell>{formatDate(event.event_date)}</TableCell>
                              <TableCell>
                                <Badge className={
                                  event.status === 'approved' ? 'bg-green-500' : 
                                  event.status === 'pending_approval' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }>
                                  {event.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {event.status === 'approved' ? (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span>{approvedCount}/{event.max_participants || '∞'}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/events/${event.id}`} className="w-full cursor-pointer">
                                        View Event
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to={`/edit-event/${event.id}`} className="w-full cursor-pointer">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Event
                                      </Link>
                                    </DropdownMenuItem>
                                    {event.status === 'approved' && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => setActiveTab('participants')}
                                          className="cursor-pointer"
                                        >
                                          <Users className="mr-2 h-4 w-4" />
                                          Manage Participants
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600 focus:text-red-600" 
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this event?')) {
                                          deleteEventMutation.mutate(event.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
                    <Button asChild>
                      <Link to="/create-event">Create an Event</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Enhanced Participants Tab with ParticipantDashboard */}
          {showAdminTabs && approvedAdminEvents.length > 0 && (
            <TabsContent value="participants" className="mt-6">
              <div className="space-y-6">
                {approvedAdminEvents.map((event) => {
                  const eventRegs = eventRegistrations[event.id] || [];
                  const participantData = eventRegs.map(reg => ({
                    id: reg.id,
                    full_name: reg.full_name,
                    email: reg.email,
                    phone: reg.phone,
                    roll_number: reg.roll_number,
                    status: reg.status,
                    registration_date: reg.registration_date,
                    approved_at: reg.approved_at,
                    approved_by: reg.approved_by,
                  }));

                  return (
                    <ParticipantDashboard
                      key={event.id}
                      event={event}
                      participants={participantData}
                      onUpdateStatus={(registrationId, status) => 
                        updateRegistrationMutation.mutate({ id: registrationId, status })
                      }
                    />
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Browse Events */}
        <section className="mt-8">
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Browse Events</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover upcoming events on campus.
              </p>
            </div>
            
            <div className="p-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by category" />
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
                </div>
              </div>
              
              {/* Events Grid */}
              {eventsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-64"></div>
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <Link key={event.id} to={`/events/${event.id}`}>
                      <EventCard
                        event={event}
                        onRegister={isStudent() ? (eventId) => registerMutation.mutate(eventId) : undefined}
                        isRegistered={isRegistered(event.id)}
                        showRegisterButton={isStudent()}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
