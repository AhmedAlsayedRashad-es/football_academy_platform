import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Clock, Users, AlertTriangle, CheckCircle, Plus, X, CalendarDays } from 'lucide-react';

interface Facility {
  id: number;
  name: string;
  type: string;
  capacity: number;
  available: boolean;
}

interface Booking {
  id: number;
  facility: string;
  team: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  conflict?: boolean;
}

export default function SmartSchedulingHub() {
  const { language } = useLanguage();
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const teams = trpc.teams.getAll.useQuery();

  // Facilities data
  const facilities: Facility[] = [
    { id: 1, name: language === 'ar' ? 'الملعب الرئيسي' : 'Main Pitch', type: 'pitch', capacity: 22, available: true },
    { id: 2, name: language === 'ar' ? 'ملعب التدريب 1' : 'Training Pitch 1', type: 'pitch', capacity: 22, available: true },
    { id: 3, name: language === 'ar' ? 'ملعب التدريب 2' : 'Training Pitch 2', type: 'pitch', capacity: 22, available: false },
    { id: 4, name: language === 'ar' ? 'صالة اللياقة' : 'Fitness Hall', type: 'gym', capacity: 30, available: true },
    { id: 5, name: language === 'ar' ? 'غرفة التحليل' : 'Analysis Room', type: 'room', capacity: 20, available: true },
    { id: 6, name: language === 'ar' ? 'ملعب مصغر (5×5)' : 'Mini Pitch (5v5)', type: 'pitch', capacity: 10, available: true },
  ];

  // Weekly schedule
  const weekDays = language === 'ar' 
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  // Bookings data
  const bookings: Booking[] = [
    { id: 1, facility: 'Main Pitch', team: 'U14', date: '2026-06-08', startTime: '09:00', endTime: '11:00', type: 'training', status: 'confirmed' },
    { id: 2, facility: 'Main Pitch', team: 'U16', date: '2026-06-08', startTime: '11:00', endTime: '13:00', type: 'training', status: 'confirmed' },
    { id: 3, facility: 'Training Pitch 1', team: 'U12', date: '2026-06-08', startTime: '09:00', endTime: '10:30', type: 'training', status: 'confirmed' },
    { id: 4, facility: 'Fitness Hall', team: 'U18', date: '2026-06-08', startTime: '14:00', endTime: '15:30', type: 'fitness', status: 'confirmed' },
    { id: 5, facility: 'Main Pitch', team: 'U14', date: '2026-06-09', startTime: '16:00', endTime: '18:00', type: 'match', status: 'confirmed' },
    { id: 6, facility: 'Main Pitch', team: 'U16', date: '2026-06-09', startTime: '16:00', endTime: '18:00', type: 'training', status: 'conflict', conflict: true },
    { id: 7, facility: 'Analysis Room', team: 'U14', date: '2026-06-10', startTime: '10:00', endTime: '11:00', type: 'analysis', status: 'confirmed' },
    { id: 8, facility: 'Training Pitch 2', team: 'U12', date: '2026-06-10', startTime: '09:00', endTime: '11:00', type: 'training', status: 'pending' },
  ];

  const conflicts = bookings.filter(b => b.conflict);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'conflict': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-500';
      case 'match': return 'bg-red-500';
      case 'fitness': return 'bg-green-500';
      case 'analysis': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'الجدولة الذكية وحجز المرافق' : 'Smart Scheduling & Facility Booking'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' 
                ? 'إدارة المرافق والجدولة مع كشف التعارضات تلقائياً'
                : 'Manage facilities and scheduling with automatic conflict detection'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBookingForm(!showBookingForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'حجز جديد' : 'New Booking'}
            </Button>
            <Button variant="outline">
              <CalendarDays className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تصدير iCal' : 'Export iCal'}
            </Button>
          </div>
        </div>

        {/* Conflict Alert */}
        {conflicts.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  {language === 'ar' 
                    ? `تم اكتشاف ${conflicts.length} تعارض في الجدول`
                    : `${conflicts.length} scheduling conflict(s) detected`}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {conflicts.map(c => `${c.team} @ ${c.facility} (${c.date} ${c.startTime})`).join(', ')}
                </p>
              </div>
              <Button size="sm" variant="destructive" className="ml-auto">
                {language === 'ar' ? 'حل التعارضات' : 'Resolve Conflicts'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المرافق' : 'Facilities'}</p>
                <p className="text-2xl font-bold">{facilities.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'حجوزات هذا الأسبوع' : 'This Week Bookings'}</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'في الانتظار' : 'Pending'}</p>
                <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تعارضات' : 'Conflicts'}</p>
                <p className="text-2xl font-bold">{conflicts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        {showBookingForm && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{language === 'ar' ? 'حجز جديد' : 'New Booking'}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setShowBookingForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'المرفق' : 'Facility'}</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر المرفق' : 'Select Facility'} /></SelectTrigger>
                    <SelectContent>
                      {facilities.map(f => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.name} {!f.available && `(${language === 'ar' ? 'غير متاح' : 'Unavailable'})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الفريق' : 'Team'}</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر الفريق' : 'Select Team'} /></SelectTrigger>
                    <SelectContent>
                      {teams.data?.map((team: any) => (
                        <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'نوع النشاط' : 'Activity Type'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">{language === 'ar' ? 'تدريب' : 'Training'}</SelectItem>
                      <SelectItem value="match">{language === 'ar' ? 'مباراة' : 'Match'}</SelectItem>
                      <SelectItem value="fitness">{language === 'ar' ? 'لياقة' : 'Fitness'}</SelectItem>
                      <SelectItem value="analysis">{language === 'ar' ? 'تحليل' : 'Analysis'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'من' : 'From'}</Label>
                  <Input type="time" />
                </div>
                <div>
                  <Label>{language === 'ar' ? 'إلى' : 'To'}</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button>{language === 'ar' ? 'حجز' : 'Book'}</Button>
                <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">{language === 'ar' ? 'التقويم' : 'Calendar View'}</TabsTrigger>
            <TabsTrigger value="facilities">{language === 'ar' ? 'المرافق' : 'Facilities'}</TabsTrigger>
            <TabsTrigger value="bookings">{language === 'ar' ? 'الحجوزات' : 'Bookings List'}</TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border text-sm font-medium w-16">{language === 'ar' ? 'الوقت' : 'Time'}</th>
                        {weekDays.map((day, idx) => (
                          <th key={idx} className="p-2 border text-sm font-medium">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time) => (
                        <tr key={time}>
                          <td className="p-1 border text-xs text-center text-muted-foreground">{time}</td>
                          {weekDays.map((_, dayIdx) => {
                            const dayBookings = bookings.filter(b => {
                              const bookingDay = new Date(b.date).getDay();
                              return bookingDay === dayIdx && b.startTime === time;
                            });
                            return (
                              <td key={dayIdx} className="p-1 border relative min-h-[30px]">
                                {dayBookings.map((booking) => (
                                  <div 
                                    key={booking.id} 
                                    className={`text-xs p-1 rounded text-white mb-1 ${getTypeColor(booking.type)} ${booking.conflict ? 'ring-2 ring-red-500' : ''}`}
                                  >
                                    <span className="font-medium">{booking.team}</span>
                                    {booking.conflict && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-xs">{language === 'ar' ? 'تدريب' : 'Training'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-xs">{language === 'ar' ? 'مباراة' : 'Match'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-xs">{language === 'ar' ? 'لياقة' : 'Fitness'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-xs">{language === 'ar' ? 'تحليل' : 'Analysis'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((facility) => (
                <Card key={facility.id} className={!facility.available ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium">{facility.name}</h3>
                      </div>
                      <Badge variant={facility.available ? 'default' : 'secondary'}>
                        {facility.available 
                          ? (language === 'ar' ? 'متاح' : 'Available')
                          : (language === 'ar' ? 'مشغول' : 'Occupied')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {facility.capacity}
                      </span>
                      <span className="capitalize">{facility.type}</span>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" className="w-full" disabled={!facility.available}>
                        {language === 'ar' ? 'حجز' : 'Book Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bookings List Tab */}
          <TabsContent value="bookings" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'المرفق' : 'Facility'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'الفريق' : 'Team'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'الوقت' : 'Time'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'النوع' : 'Type'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className={`border-t ${booking.conflict ? 'bg-red-50 dark:bg-red-950' : ''}`}>
                          <td className="p-3 text-sm">{booking.facility}</td>
                          <td className="p-3 text-sm font-medium">{booking.team}</td>
                          <td className="p-3 text-sm">{booking.date}</td>
                          <td className="p-3 text-sm">{booking.startTime} - {booking.endTime}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">{booking.type}</Badge>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status === 'confirmed' && (language === 'ar' ? 'مؤكد' : 'Confirmed')}
                              {booking.status === 'pending' && (language === 'ar' ? 'في الانتظار' : 'Pending')}
                              {booking.status === 'conflict' && (language === 'ar' ? 'تعارض!' : 'Conflict!')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
