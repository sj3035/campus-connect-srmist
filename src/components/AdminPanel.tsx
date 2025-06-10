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

type Event = Tables<'events'>;
type EventMedia = Tables<'event_media'>;
type EventStatus = Enums<'event_status'>;

const AdminPanel = () => {
  const { user, isAdmin, isExecutive } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [rejectingEvent, setRejectingEvent] = useState<Event | null>(null);
  const [declineReason, setDeclineReason] = useState('');

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
          <TabsTrigger value="admins">Admin Management</TabsTrigger>
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
            <h2 className="text-2xl font-semibold">Media Files</h2>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {item.file_type === 'image' ? (
                      <Image className="h-8 w-8 text-gray-400" />
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
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Admin Management</h2>
          </div>

          <div className="grid gap-6">
            <AdminCreation />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Admin Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Admin Domain Requirements:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>@srmist.edu.in</li>
                    <li>@ist.srmtrichy.edu.in</li>
                  </ul>
                  <p><strong>Default Password:</strong> SRMIST@2024</p>
                  <p><strong>Password Change:</strong> New admins should use the "Forgot Password" feature to set their own password.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
