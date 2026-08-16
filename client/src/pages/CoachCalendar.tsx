import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {Loader2, Calendar as CalendarIcon, Clock, User, MapPin, ArrowLeft} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    studentName: string;
    sessionType: string;
    // Status is nullable on the booking row.
    status: string | null;
    notes?: string;
    duration: number;
  };
}

export default function CoachCalendar() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  const { data: bookings, isLoading } = trpc.privateBookings.getMyBookings.useQuery();

  const events: BookingEvent[] = useMemo(() => {
    if (!bookings) return [];
    
    return bookings.map((booking) => {
      const start = new Date(booking.sessionDate);
      const end = new Date(start.getTime() + booking.duration * 60000);
      
      return {
        id: booking.id,
        title: `${booking.userName || 'Student'} - ${booking.sessionType}`,
        start,
        end,
        resource: {
          studentName: booking.userName || 'Student',
          sessionType: booking.sessionType,
          status: booking.status,
          notes: booking.notes || undefined,
          duration: booking.duration,
        },
      };
    });
  }, [bookings]);

  const eventStyleGetter = (event: BookingEvent) => {
    let backgroundColor = '#3b82f6'; // blue
    
    switch (event.resource.status) {
      case 'confirmed':
        backgroundColor = '#10b981'; // green
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        break;
      case 'completed':
        backgroundColor = '#8b5cf6'; // purple
        break;
      default:
        backgroundColor = '#f59e0b'; // orange (pending)
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedEvent(event);
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-700 dark:text-orange-500" />
        </div>
      </>
    );
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        
        <BackButton />
<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          My Training Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage your upcoming training sessions
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-500">{events.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">
                {events.filter(e => e.resource.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-500">
                {events.filter(e => e.resource.status === 'confirmed').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {events.filter(e => e.resource.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                style={{ height: '100%' }}
                views={['month', 'week', 'day', 'agenda']}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{selectedEvent.resource.studentName}</h3>
                    <Badge
                      className={
                        selectedEvent.resource.status === 'confirmed'
                          ? 'bg-green-500'
                          : selectedEvent.resource.status === 'cancelled'
                          ? 'bg-red-500'
                          : selectedEvent.resource.status === 'completed'
                          ? 'bg-purple-500'
                          : 'bg-yellow-500'
                      }
                    >
                      {selectedEvent.resource.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent.resource.duration} minutes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Session Type</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent.resource.sessionType}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.resource.notes && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Notes</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedEvent.resource.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedEvent.resource.status === 'pending' && (
                  <div className="pt-4 border-t">
                    <Button className="w-full bg-green-500 hover:bg-green-600">
                      Confirm Session
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a session to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
