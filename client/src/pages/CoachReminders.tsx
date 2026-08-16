import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MessageCircle,
  Bell,
  CheckCircle,
  ArrowLeft,
  Phone
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

export default function CoachReminders() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [sentReminders, setSentReminders] = useState<Set<number>>(new Set());

  const { data: tomorrowsBookings, isLoading } = trpc.privateTraining.getTomorrowsBookings.useQuery();

  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  if (!isCoach) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">This page is only accessible to coaches.</p>
              <Link href="/">
                <Button className="mt-4">Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSendReminder = (bookingId: number, whatsappUrl: string) => {
    window.open(whatsappUrl, '_blank');
    setSentReminders(prev => new Set(Array.from(prev).concat(bookingId)));
  };

  return (
    <>
    <div >
      {/* Header */}
      <div className="brand-gradient text-white">
        <div className="container py-8">
          <Link href="/booking-management">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Session Reminders</h1>
              <p className="text-emerald-100 mt-1">
                Send WhatsApp reminders for tomorrow's training sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tomorrowsBookings?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Tomorrow's Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sentReminders.size}</p>
                  <p className="text-sm text-muted-foreground">Reminders Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Bell className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(tomorrowsBookings?.length || 0) - sentReminders.size}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Reminders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tomorrow's Training Sessions
            </CardTitle>
            <CardDescription>
              Click the WhatsApp button to send a reminder to each parent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading sessions...
              </div>
            ) : !tomorrowsBookings || tomorrowsBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Tomorrow</h3>
                <p className="text-muted-foreground">
                  You don't have any confirmed training sessions scheduled for tomorrow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tomorrowsBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className={`p-4 rounded-lg border ${
                      sentReminders.has(booking.id) 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {booking.playerName}
                          </h3>
                          {sentReminders.has(booking.id) && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reminder Sent
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Parent: {booking.parentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.startTime} - {booking.endTime}
                          </span>
                          {booking.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {booking.locationName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDate(booking.sessionDate)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={sentReminders.has(booking.id) ? "outline" : "default"}
                          className={sentReminders.has(booking.id) ? "" : "bg-green-600 hover:bg-green-700"}
                          onClick={() => handleSendReminder(booking.id, booking.whatsappReminderUrl)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {sentReminders.has(booking.id) ? "Send Again" : "Send Reminder"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Academy WhatsApp
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contact the academy directly for any scheduling issues
              </p>
              <a 
                href="https://wa.me/201004186970" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open Academy WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Manage Schedule
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your availability and time slots
              </p>
              <Link href="/coach-schedule">
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Go to Schedule
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
