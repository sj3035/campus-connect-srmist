import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  ArrowLeft,
  Tag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type Event = Tables<'events'>;
type Registration = Tables<'registrations'>;

const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isStudent } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('Event ID is required');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Event not found');
      
      return data as Event;
    },
    enabled: !!id,
  });

  // Fetch user's registration status (only for students)
  const { data: registration } = useQuery({
    queryKey: ['registration', id, user?.id],
    queryFn: async () => {
      if (!id || !user || !isStudent()) return null;
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      
      return data as Registration | null;
    },
    enabled: !!(id && user && isStudent()),
  });

  // Register for event mutation (only for students)
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!isStudent()) throw new Error('Only students can register for events');
      if (!id) throw new Error('Event ID is required');

      setRegistering(true);

      // Fetch user profile for registration required fields
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone, student_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile)
        throw new Error(
          "User profile not found. Please update your profile."
        );

      const roll_number = profile.student_id || "";

      const { error } = await supabase.from("registrations").insert({
        event_id: id,
        user_id: user.id,
        status: "pending",
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || "",
        roll_number: roll_number,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration"] });
      toast({
        title: "Registration Successful",
        description:
          "You have successfully registered for the event. Your registration is pending approval.",
      });
      setRegistering(false);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for the event.",
        variant: "destructive",
      });
      setRegistering(false);
    },
  });

  // Format date for display
  const formatEventDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  // Check if registration is open
  const isRegistrationOpen = () => {
    if (!event) return false;
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    return deadline > now;
  };
  
  // Calculate registration capacity percentage
  const getCapacityPercentage = () => {
    if (!event || !event.max_participants) return 100;
    return Math.min(Math.round((event.current_participants || 0) / event.max_participants * 100), 100);
  };

  // Handle share event
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'SRMIST Event',
        text: event?.description || 'Check out this event at SRMIST!',
        url: window.location.href,
      }).catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="group text-gray-500"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </Button>
        </div>
        
        {eventLoading ? (
          <div className="space-y-8">
            {/* Skeleton loader for image */}
            <Skeleton className="w-full h-[300px] md:h-[400px] rounded-xl" />
            
            {/* Skeleton loader for title */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
            </div>
            
            {/* Skeleton loader for details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-[120px] w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
        ) : event ? (
          <div className="space-y-8">
            {/* Event header with image */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <img 
                src={event.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1200&h=400'} 
                alt={event.title}
                className="w-full h-[300px] md:h-[400px] object-cover"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {event.category && (
                    <Badge className="bg-white/90 text-srmist-blue backdrop-blur-sm">
                      {event.category}
                    </Badge>
                  )}
                  
                  {isRegistrationOpen() ? (
                    <Badge variant="outline" className="bg-green-500/90 text-white border-none">
                      Registration Open
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-500/90 text-white border-none">
                      Registration Closed
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
                
                <div className="mt-2 text-white/90">
                  <p>Happening {formatDistanceToNow(parseISO(event.event_date), { addSuffix: true })}</p>
                </div>
              </div>
            </div>
            
            {/* Event details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left column - Description & Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {event.description}
                  </p>
                  
                  {event.requirements && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {event.requirements}
                      </p>
                    </div>
                  )}
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Event Details</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-3 text-srmist-blue mt-0.5" />
                      <div>
                        <h3 className="font-medium">Date & Time</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {formatEventDate(event.event_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-srmist-blue mt-0.5" />
                      <div>
                        <h3 className="font-medium">Location</h3>
                        <p className="text-gray-600 dark:text-gray-400">{event.venue}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-3 text-srmist-blue mt-0.5" />
                      <div>
                        <h3 className="font-medium">Participants</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {event.current_participants || 0}
                          {event.max_participants && ` / ${event.max_participants} participants`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-3 text-srmist-blue mt-0.5" />
                      <div>
                        <h3 className="font-medium">Registration Deadline</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {format(parseISO(event.registration_deadline), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="mt-6 w-full md:w-auto" 
                    variant="outline" 
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              </div>
              
              {/* Right column - Registration */}
              <div>
                <div className="bg-white dark:bg-gray-950 rounded-xl shadow-sm p-6 sticky top-24">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Registration</h3>
                    {event.max_participants && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Spots filled</span>
                          <span>{event.current_participants || 0} / {event.max_participants}</span>
                        </div>
                        <Progress value={getCapacityPercentage()} className="h-2" />
                      </div>
                    )}
                    
                    {registration ? (
                      <div className="rounded-lg border p-4 text-center">
                        <Badge className="mb-2 bg-primary">
                          {registration.status === 'approved' ? 'Registered' : 'Pending Approval'}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {registration.status === 'approved' 
                            ? 'Your registration has been approved.' 
                            : 'Your registration is pending approval.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {isStudent() && isRegistrationOpen() && (
                          <Button 
                            className="w-full"
                            disabled={!user || registering || 
                              (!!event.max_participants && (event.current_participants || 0) >= event.max_participants)}
                            onClick={() => setShowRegistrationForm(true)}
                          >
                            Register Now
                          </Button>
                        )}
                        
                        {event.max_participants && (event.current_participants || 0) >= event.max_participants && (
                          <p className="text-sm text-center text-destructive mt-2">
                            Event is at full capacity
                          </p>
                        )}
                        
                        {!isRegistrationOpen() && (
                          <p className="text-sm text-center text-muted-foreground">
                            Registration is now closed for this event
                          </p>
                        )}
                        
                        {!user && (
                          <p className="text-sm text-center text-muted-foreground mt-2">
                            Please sign in to register for this event
                          </p>
                        )}
                        
                        {user && !isStudent() && (
                          <p className="text-sm text-center text-muted-foreground mt-2">
                            Only students can register for events
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Registration Form Modal */}
            {isStudent() && (
              <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
                <DialogContent className="max-w-md">
                  <h2 className="font-semibold text-lg mb-4">Register for this Event</h2>
                  <EventRegistrationForm eventId={event.id} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Event not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <a href="/events">Browse All Events</a>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventDetailsPage;
