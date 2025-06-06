
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRegistrationOpen = () => {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    return deadline > now && event.status === 'approved';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {event.image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
          <Badge variant={event.status === 'approved' ? 'default' : 'secondary'}>
            {event.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {event.current_participants || 0}
              {event.max_participants && ` / ${event.max_participants}`} participants
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Registration closes: {formatDate(event.registration_deadline)}</span>
          </div>
        </div>

        {event.category && (
          <Badge variant="outline">{event.category}</Badge>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {showRegisterButton && isRegistrationOpen() && !isRegistered && (
          <Button 
            onClick={() => onRegister?.(event.id)}
            className="w-full"
            disabled={event.max_participants ? (event.current_participants || 0) >= event.max_participants : false}
          >
            {event.max_participants && (event.current_participants || 0) >= event.max_participants 
              ? 'Event Full' 
              : 'Register'
            }
          </Button>
        )}

        {isRegistered && (
          <Button variant="outline" className="w-full" disabled>
            Already Registered
          </Button>
        )}

        {!isRegistrationOpen() && event.status === 'approved' && (
          <Button variant="outline" className="w-full" disabled>
            Registration Closed
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
