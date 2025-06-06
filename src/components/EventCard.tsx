
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type Event = Tables<'events'>;

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  isRegistered?: boolean;
  showRegisterButton?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onRegister, 
  isRegistered = false,
  showRegisterButton = true 
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy");
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "h:mm a");
  };

  // Check if registration is open
  const isRegistrationOpen = () => {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    return deadline > now && event.status === 'approved';
  };

  // Prevent event bubbling for register button click
  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRegister?.(event.id);
  };

  return (
    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 card-hover">
      <div className="aspect-video w-full relative">
        <img 
          src={event.image_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800'} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 text-srmist-blue backdrop-blur-sm">
            {event.category || 'Event'}
          </Badge>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="font-bold text-lg text-white line-clamp-1">{event.title}</h3>
        </div>
      </div>
      
      <CardContent className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {event.description}
        </p>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-2 text-srmist-blue" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-2 text-srmist-blue" />
            <span>{formatTime(event.event_date)}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <MapPin className="h-4 w-4 mr-2 text-srmist-blue" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Users className="h-4 w-4 mr-2 text-srmist-blue" />
            <span>
              {event.current_participants || 0}
              {event.max_participants && ` / ${event.max_participants}`} participants
            </span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          {showRegisterButton && isRegistrationOpen() && !isRegistered ? (
            <Button 
              onClick={handleRegisterClick}
              size="sm"
              disabled={event.max_participants ? (event.current_participants || 0) >= event.max_participants : false}
              className={cn(
                "flex-1 mr-2",
                event.max_participants && (event.current_participants || 0) >= event.max_participants && "bg-gray-400"
              )}
            >
              {event.max_participants && (event.current_participants || 0) >= event.max_participants 
                ? 'Event Full' 
                : 'Register'
              }
            </Button>
          ) : isRegistered ? (
            <Badge variant="outline" className="bg-green-500 text-white border-green-500">Registered</Badge>
          ) : !isRegistrationOpen() && event.status === 'approved' ? (
            <Badge variant="outline" className="bg-gray-500 text-white border-gray-500">Registration Closed</Badge>
          ) : null}
          
          <Link to={`/events/${event.id}`} className="group flex items-center text-srmist-blue">
            <span className="hidden sm:inline mr-1">Details</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
