import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Edit, Trash2, Plus, Upload, Image, Video, Users, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Tables, Enums } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import AdminCreation from './AdminCreation';
import ParticipantDashboard from './ParticipantDashboard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Event = Tables<'events'>;
type EventMedia = Tables<'event_media'>;
type EventStatus = Enums<'event_status'>;

const AdminPanel = () => {
  const { user, isAdmin, isExecutive } = useAuth();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [rejectingEvent, setRejectingEvent] = useState<Event | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch user's organized events for participant management
  const { data: organizedEvents = [] } = useQuery({
    queryKey: ['organized-events', user?.id],
    queryFn: async () => {
      if (!user || (!isAdmin() && !isExecutive())) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user && (isAdmin() || isExecutive()),
  });

  // Get approved events for participant management
  const approvedAdminEvents = organizedEvents.filter(event => event.status === 'approved');

  // Fetch event registrations for approved events
  const { data: eventRegistrations = {} } = useQuery({
    queryKey: ['event-registrations', user?.id],
    queryFn: async () => {
      if (!user || (!isAdmin() && !isExecutive()) || approvedAdminEvents.length === 0) return {};
      
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
    enabled: !!user && (isAdmin() || isExecutive()) && approvedAdminEvents.length > 0,
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

  useEffect(() => {
    if (isAdmin() || isExecutive()) {
      fetchEvents();
      fetchMedia();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      console.log('Fetching events...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      
      console.log('Events fetched:', data?.length || 0);
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      console.log('Fetching media...');
      const { data, error } = await supabase
        .from('event_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching media:', error);
        throw error;
      }
      
      console.log('Media fetched:', data?.length || 0);
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(fileName);

        // Save to event_media table
        const { error: dbError } = await supabase
          .from('event_media')
          .insert({
            event_id: eventId,
            file_url: publicUrl,
            file_type: file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'document',
            uploaded_by: user?.id,
            caption: file.name
          });

        if (dbError) throw dbError;

      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Upload Successful",
      description: "Media files have been uploaded successfully",
    });
    fetchMedia();
    
    // Clear the input
    event.target.value = '';
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) return;

    try {
      const { error } = await supabase
        .from('event_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Media file deleted successfully",
      });
      fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: "Error",
        description: "Failed to delete media file",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEventStatus = async (eventId: string, status: EventStatus, reason?: string) => {
    try {
      const updateData: any = { 
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      };
      
      if (status === 'rejected' && reason) {
        updateData.declined_reason = reason;
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${status} successfully`,
      });
      fetchEvents();
      setRejectingEvent(null);
      setDeclineReason('');
    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  const handleRejectEvent = () => {
    if (!rejectingEvent) return;
    
    if (!declineReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for declining the event",
        variant: "destructive",
      });
      return;
    }

    handleUpdateEventStatus(rejectingEvent.id, 'rejected', declineReason);
  };

  if (!isAdmin() && !isExecutive()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Access denied. Admin or Executive privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-gray-600">Manage events, media content, and admin accounts</p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events Management</TabsTrigger>
          <TabsTrigger value="media">Media Management</TabsTrigger>
          <TabsTrigger value="participants">Participant Management</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Events</h2>
            {isAdmin() && (
              <Button onClick={() => window.location.href = '/create-event'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>

          {/* Info banner for admins about approval process */}
          {isAdmin() && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Executive Approval Required</h3>
                    <p className="text-sm text-blue-700">
                      All events created by admins require approval from the executive before being published to students.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={
                          event.status === 'approved' ? 'default' :
                          event.status === 'rejected' ? 'destructive' :
                          event.status === 'pending_approval' ? 'secondary' :
                          'outline'
                        }>
                          {event.status === 'pending_approval' ? 'Pending Approval' : event.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span>{event.venue}</span>
                        <span>{event.current_participants || 0} participants</span>
                      </div>
                      {event.status === 'rejected' && event.declined_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800">Decline Reason:</p>
                          <p className="text-sm text-red-700">{event.declined_reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* Only executives can approve/reject events */}
                      {isExecutive() && event.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateEventStatus(event.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Dialog open={rejectingEvent?.id === event.id} onOpenChange={(open) => {
                            if (!open) {
                              setRejectingEvent(null);
                              setDeclineReason('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectingEvent(event)}
                              >
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Event</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting "{event.title}". This will help the organizer understand what needs to be improved.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="decline-reason">Reason for rejection</Label>
                                  <Textarea
                                    id="decline-reason"
                                    placeholder="Explain why this event cannot be approved..."
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRejectingEvent(null);
                                    setDeclineReason('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleRejectEvent}
                                  disabled={!declineReason.trim()}
                                >
                                  Reject Event
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Event Media Management</h2>
          </div>

          {/* Only show media management for completed events */}
          {events.filter(event => event.status === 'completed').length > 0 ? (
            <div className="space-y-6">
              {events.filter(event => event.status === 'completed').map((event) => {
                const eventMedia = media.filter(item => item.event_id === event.id);
                
                return (
                  <Card key={event.id} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <p className="text-sm text-gray-500">
                          Event Date: {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id={`file-upload-${event.id}`}
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, event.id)}
                          className="hidden"
                        />
                        <Button
                          onClick={() => document.getElementById(`file-upload-${event.id}`)?.click()}
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Media
                        </Button>
                      </div>
                    </div>

                    {eventMedia.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventMedia.map((item) => (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                {item.file_type === 'image' ? (
                                  item.file_url ? (
                                    <img 
                                      src={item.file_url} 
                                      alt={item.caption || 'Event media'}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Image className="h-8 w-8 text-gray-400" />
                                  )
                                ) : (
                                  <Video className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline">{item.file_type}</Badge>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteMedia(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                {item.caption && (
                                  <p className="text-sm text-gray-600">{item.caption}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {format(new Date(item.created_at!), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No media uploaded for this event yet.</p>
                        <p className="text-sm">Upload images, videos, or documents to share with participants.</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No completed events yet.</p>
                  <p className="text-sm text-gray-400">
                    Media can only be uploaded for events that have been completed.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Participant Management</h2>
          </div>

          {approvedAdminEvents.length > 0 ? (
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
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No approved events yet.</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Create an event and wait for approval to start managing participants.
                  </p>
                  <Button onClick={() => window.location.href = '/create-event'}>
                    Create an Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
