
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import Header from '@/components/Header';

type Event = Tables<'events'>;

const ExecutivePanel = () => {
  const { user, isExecutive } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  useEffect(() => {
    if (isExecutive()) {
      fetchPendingEvents();
    }
  }, [user]);

  const fetchPendingEvents = async () => {
    try {
      console.log('=== EXECUTIVE PANEL DEBUG ===');
      console.log('Executive user:', user?.email, user?.id);
      console.log('Is Executive:', isExecutive());
      
      // First, let's check if we can query the events table at all
      console.log('Testing basic events table access...');
      const { data: testQuery, error: testError } = await supabase
        .from('events')
        .select('id, title, status, organizer_id, created_at')
        .limit(5);
        
      if (testError) {
        console.error('ERROR: Cannot access events table:', testError);
        toast({
          title: "Database Error",
          description: `Cannot access events table: ${testError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✓ Events table accessible. Found', testQuery?.length || 0, 'total events');
      console.log('All events sample:', testQuery);
      
      // Now check for pending approval events specifically
      console.log('Querying for pending_approval events...');
      const { data: pendingEvents, error: pendingError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('ERROR fetching pending events:', pendingError);
        toast({
          title: "Error",
          description: `Failed to fetch pending events: ${pendingError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✓ Pending events query successful');
      console.log('Pending events found:', pendingEvents?.length || 0);
      console.log('Pending events data:', pendingEvents);
      
      // Check for any events with status variations
      const { data: allStatuses, error: statusError } = await supabase
        .from('events')
        .select('id, title, status')
        .order('created_at', { ascending: false });
        
      if (!statusError && allStatuses) {
        console.log('All event statuses in database:');
        allStatuses.forEach(event => {
          console.log(`- ${event.title}: "${event.status}" (ID: ${event.id})`);
        });
      }
      
      setEvents(pendingEvents || []);
    } catch (error) {
      console.error('CATCH ERROR in fetchPendingEvents:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      console.log('Approving event:', eventId);
      
      const { error } = await supabase
        .from('events')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error approving event:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Event approved successfully",
      });
      
      fetchPendingEvents();
    } catch (error) {
      console.error('Error approving event:', error);
      toast({
        title: "Error",
        description: "Failed to approve event",
        variant: "destructive",
      });
    }
  };

  const handleDeclineEvent = async () => {
    if (!selectedEvent || !declineReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for declining",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Declining event:', selectedEvent.id, 'Reason:', declineReason);
      
      const { error } = await supabase
        .from('events')
        .update({
          status: 'rejected',
          declined_reason: declineReason.trim(),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedEvent.id);

      if (error) {
        console.error('Error declining event:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Event declined successfully",
      });
      
      setShowDeclineDialog(false);
      setDeclineReason('');
      setSelectedEvent(null);
      fetchPendingEvents();
    } catch (error) {
      console.error('Error declining event:', error);
      toast({
        title: "Error",
        description: "Failed to decline event",
        variant: "destructive",
      });
    }
  };

  if (!isExecutive()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Access denied. Executive privileges required.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Executive Panel</h1>
          <p className="text-gray-600">Review and approve events awaiting executive approval</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={fetchPendingEvents} variant="outline" size="sm">
              Refresh Events
            </Button>
            <Button 
              onClick={async () => {
                // Debug button to check database connection
                const { data, error } = await supabase.from('events').select('count');
                console.log('Debug query result:', { data, error });
                toast({
                  title: "Debug Info",
                  description: error ? `Error: ${error.message}` : `Database accessible`,
                });
              }} 
              variant="outline" 
              size="sm"
            >
              Test DB Connection
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Pending Events</h3>
                  <p className="text-gray-500">There are no events waiting for executive approval.</p>
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">
                      If you expect to see events here, please check the browser console for debugging information
                      or try refreshing the page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant="secondary">Pending Approval</Badge>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Date: {format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        <div>
                          <span>Venue: {event.venue}</span>
                        </div>
                        <div>
                          <span>Max Participants: {event.max_participants || 'Unlimited'}</span>
                        </div>
                        <div>
                          <span>Category: {event.category || 'N/A'}</span>
                        </div>
                      </div>
                      {event.requirements && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-1">Requirements:</h4>
                          <p className="text-sm text-gray-600">{event.requirements}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApproveEvent(event.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Decline Event: {selectedEvent?.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Reason for declining:</label>
                              <Textarea
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="Please provide a clear reason for declining this event..."
                                className="mt-1"
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDeclineDialog(false);
                                  setDeclineReason('');
                                  setSelectedEvent(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeclineEvent}
                                disabled={!declineReason.trim()}
                              >
                                Decline Event
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutivePanel;
