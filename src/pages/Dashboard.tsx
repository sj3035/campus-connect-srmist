
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import EventCard from '@/components/EventCard';
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
  const { user, isAdmin } = useAuth();
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

  // Fetch user's registrations
  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as Registration[];
    },
    enabled: !!user,
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

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');

      // ERROR FIX: Fetch user profile data for required fields
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

      // Insert with all required fields, maintain other fields as null/undefined if not available
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

  // Check if user is registered for an event
  const isRegistered = (eventId: string) => {
    return registrations.some(reg => reg.event_id === eventId);
  };

  // Get user's registered events
  const getRegisteredEvents = () => {
    return events.filter(event => 
      registrations.some(reg => reg.event_id === event.id)
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy");
  };

  // Download participants list as CSV
  const downloadParticipantsList = (eventId: string, eventTitle: string) => {
    const registrationsList = eventRegistrations[eventId] || [];
    const approvedRegistrations = registrationsList.filter(r => r.status === 'approved');
    
    if (approvedRegistrations.length === 0) {
      toast({
        title: "No Participants",
        description: "There are no approved participants for this event.",
      });
      return;
    }
    
    let csvContent = "Name,Email,Registration Date,Status\n";
    
    approvedRegistrations.forEach(reg => {
      const profile = reg.profiles;
      const name = profile?.full_name || 'N/A';
      const email = profile?.email || 'N/A';
      const date = format(parseISO(reg.registration_date), "yyyy-MM-dd");
      
      csvContent += `"${name}","${email}","${date}","${reg.status}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventTitle.replace(/\s+/g, '_')}_participants.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Tabs defaultValue="registered" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={"w-full " + (showAdminTabs ? "grid grid-cols-3" : "grid grid-cols-1")}>
            <TabsTrigger value="registered">My Registrations</TabsTrigger>
            {showAdminTabs && <TabsTrigger value="organized">My Events</TabsTrigger>}
            {showAdminTabs && (
              <TabsTrigger value="participants" className="relative">
                Manage Participants
                {approvedAdminEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {approvedAdminEvents.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* My Registrations Tab (Always visible) */}
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

          {/* My Events Tab (Organized Events) - only admins */}
          {showAdminTabs &&
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
          }

          {/* Participants Tab (Participant management) - only for approved events by current admin */}
          {showAdminTabs &&
            <TabsContent value="participants" className="mt-6">
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Manage Event Participants</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Approve or reject participants for your approved events.
                      </p>
                    </div>
                    {approvedAdminEvents.length > 0 && (
                      <Badge variant="outline">
                        {approvedAdminEvents.length} Approved Event{approvedAdminEvents.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {approvedAdminEvents.length > 0 ? (
                  <div>
                    {approvedAdminEvents.map((event) => {
                      const eventRegs = eventRegistrations[event.id] || [];
                      const pendingCount = eventRegs.filter(r => r.status === 'pending').length;
                      const approvedCount = eventRegs.filter(r => r.status === 'approved').length;
                      
                      return (
                        <div key={event.id} className="border-b last:border-b-0">
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium text-lg">{event.title}</h3>
                                <div className="flex gap-2">
                                  {pendingCount > 0 && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      {pendingCount} Pending
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {approvedCount} Approved
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(parseISO(event.event_date), 'PPP')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>Max: {event.max_participants || 'Unlimited'}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => downloadParticipantsList(event.id, event.title)}
                              disabled={approvedCount === 0}
                            >
                              <Download className="h-3 w-3" />
                              Export ({approvedCount})
                            </Button>
                          </div>
                          
                          {eventRegs.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Roll Number</TableHead>
                                    <TableHead>Registration Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {eventRegs.map((reg) => (
                                    <TableRow key={reg.id}>
                                      <TableCell className="font-medium">
                                        {reg.full_name || 'N/A'}
                                      </TableCell>
                                      <TableCell>{reg.email || 'N/A'}</TableCell>
                                      <TableCell>{reg.phone || 'N/A'}</TableCell>
                                      <TableCell>{reg.roll_number || 'N/A'}</TableCell>
                                      <TableCell>{format(parseISO(reg.registration_date), 'PPP')}</TableCell>
                                      <TableCell>
                                        <Badge className={
                                          reg.status === 'approved' ? 'bg-green-500' : 
                                          reg.status === 'pending' ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }>
                                          {reg.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {reg.status === 'pending' && (
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                              onClick={() => updateRegistrationMutation.mutate({
                                                id: reg.id,
                                                status: 'approved'
                                              })}
                                              title="Approve"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                              onClick={() => updateRegistrationMutation.mutate({
                                                id: reg.id,
                                                status: 'rejected'
                                              })}
                                              title="Reject"
                                            >
                                              <XCircle className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        )}
                                        {reg.status !== 'pending' && (
                                          <Badge variant="outline" className="ml-2">
                                            {reg.status === 'approved' ? (
                                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                            ) : (
                                              <XCircle className="h-3 w-3 text-red-500 mr-1" />
                                            )}
                                            {reg.status}
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">No registrations yet</p>
                              <p className="text-sm">Participants will appear here once they register for your event.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500 mb-2">No approved events yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Once your events are approved by executives, you'll be able to manage participants here.
                    </p>
                    <Button asChild>
                      <Link to="/create-event">Create an Event</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          }
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
                        onRegister={(eventId) => registerMutation.mutate(eventId)}
                        isRegistered={isRegistered(event.id)}
                        showRegisterButton={!!user}
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
