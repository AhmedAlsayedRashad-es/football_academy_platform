import { useState, useEffect } from 'react';
import { Link , useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Star, Calendar, Clock, MapPin, User, Award,
  ChevronRight, CheckCircle2, Phone, MessageCircle
} from 'lucide-react';

// Day names for schedule display
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function PrivateTraining() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);

  // Fetch coaches with ratings
  const { data: coaches = [], isLoading: loadingCoaches } = trpc.privateTraining.getCoaches.useQuery();
  
  // Fetch locations
  const { data: locations = [] } = trpc.privateTraining.getLocations.useQuery();
  
  // Fetch coach details when selected
  const { data: coachDetails } = trpc.privateTraining.getCoachDetails.useQuery(
    { coachId: selectedCoach?.userId },
    { enabled: !!selectedCoach }
  );

  // Get parent's players
  const { data: myPlayers = [] } = trpc.players.getForParent.useQuery(undefined, {
    enabled: !!user && user.role === 'parent',
  });

  // Book mutation
  const bookMutation = trpc.privateTraining.book.useMutation({
    onSuccess: (data) => {
      if (data.isRecurring && data.totalBooked > 1) {
        toast.success(isRTL 
          ? `تم حجز ${data.totalBooked} جلسات تدريب بنجاح!` 
          : `${data.totalBooked} training sessions booked successfully!`);
      } else {
        toast.success(isRTL ? 'تم حجز التدريب بنجاح!' : 'Training booked successfully!');
      }
      setShowBookingModal(false);
      setSelectedCoach(null);
      setSelectedSlot(null);
      setSelectedDate('');
      setNotes('');
      setIsRecurring(false);
      setRecurringWeeks(4);
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'حدث خطأ في الحجز' : 'Booking failed'));
    },
  });

  const handleBook = () => {
    if (!selectedCoach || !selectedSlot || !selectedDate || !selectedPlayer) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const location = locations.find((l: any) => l.id === selectedSlot.locationId) || locations[0];
    
    bookMutation.mutate({
      coachId: selectedCoach.userId,
      playerId: parseInt(selectedPlayer),
      locationId: location?.id || 1,
      slotId: selectedSlot.id,
      sessionDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      notes,
      price: selectedSlot.pricePerSession,
      isRecurring,
      recurringWeeks: isRecurring ? recurringWeeks : undefined,
    });
  };

  // Generate next available dates for a slot
  const getNextDates = (dayOfWeek: number, count: number = 4) => {
    const dates = [];
    const today = new Date();
    let current = new Date(today);
    
    // Find the next occurrence of this day
    while (current.getDay() !== dayOfWeek) {
      current.setDate(current.getDate() + 1);
    }
    
    for (let i = 0; i < count; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return dates;
  };

  // Control body overflow when modal is open
  useEffect(() => {
    if (showBookingModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBookingModal]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-700 dark:text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                <h1 className="text-xl font-bold">{isRTL ? 'التدريب الخاص' : 'Private Training'}</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {isRTL ? 'احجز جلسة تدريب خاصة' : 'Book a Private Training Session'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'اختر المدرب المناسب واحجز جلسة تدريب فردية لتطوير مهارات طفلك'
              : 'Choose the right coach and book a one-on-one training session to develop your child\'s skills'
            }
          </p>
        </div>

        {/* Coach Selection */}
        {!selectedCoach ? (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground">
              {isRTL ? 'اختر المدرب' : 'Select a Coach'}
            </h3>
            
            {loadingCoaches ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card/50 border-border animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4" />
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : coaches.length === 0 ? (
              <Card className="bg-card/50 border-border p-8 text-center">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isRTL ? 'لا يوجد مدربين متاحين حالياً' : 'No Coaches Available'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL 
                    ? 'سيتم إضافة مدربين قريباً'
                    : 'Coaches will be added soon'
                  }
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coaches.map((coach: any) => (
                  <Card 
                    key={coach.id}
                    className="bg-card/50 border-border hover:border-cyan-500 transition-colors cursor-pointer"
                    onClick={() => setSelectedCoach(coach)}
                  >
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        {coach.photoUrl || coach.avatarUrl ? (
                          <img 
                            src={coach.photoUrl || coach.avatarUrl} 
                            alt={coach.name}
                            className="h-20 w-20 rounded-full mx-auto object-cover border-2 border-cyan-500"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-full mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <User className="h-10 w-10 text-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-semibold text-foreground text-center mb-2">
                        {coach.name || (isRTL ? 'مدرب' : 'Coach')}
                      </h4>
                      
                      {coach.specialization && (
                        <Badge className="mx-auto block w-fit mb-3 bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                          {coach.specialization}
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {renderStars(coach.averageRating)}
                        <span className="text-sm text-muted-foreground">
                          ({coach.reviewCount} {isRTL ? 'تقييم' : 'reviews'})
                        </span>
                      </div>
                      
                      {coach.bio && (
                        <p className="text-sm text-muted-foreground text-center line-clamp-2 mb-4">
                          {coach.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{coach.availableSlots} {isRTL ? 'موعد متاح' : 'slots'}</span>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-cyan-700 dark:text-cyan-400 ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Coach Details & Booking */
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedCoach(null)}
            >
              <ArrowLeft className={`h-4 w-4 mr-2 ${isRTL ? 'rotate-180' : ''}`} />
              {isRTL ? 'العودة للمدربين' : 'Back to Coaches'}
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coach Profile */}
              <Card className="bg-card/50 border-border lg:col-span-1">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {selectedCoach.photoUrl || selectedCoach.avatarUrl ? (
                      <img 
                        src={selectedCoach.photoUrl || selectedCoach.avatarUrl} 
                        alt={selectedCoach.name}
                        className="h-32 w-32 rounded-full mx-auto object-cover border-4 border-cyan-500"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <User className="h-16 w-16 text-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground text-center mb-2">
                    {selectedCoach.name}
                  </h3>
                  
                  {selectedCoach.specialization && (
                    <Badge className="mx-auto block w-fit mb-4 bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                      {selectedCoach.specialization}
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {renderStars(selectedCoach.averageRating)}
                    <span className="text-muted-foreground">
                      {selectedCoach.averageRating.toFixed(1)} ({selectedCoach.reviewCount})
                    </span>
                  </div>
                  
                  {selectedCoach.bio && (
                    <p className="text-muted-foreground text-center mb-4">
                      {selectedCoach.bio}
                    </p>
                  )}
                  
                  {selectedCoach.qualifications && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                        {isRTL ? 'المؤهلات' : 'Qualifications'}
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedCoach.qualifications}</p>
                    </div>
                  )}
                  
                  {selectedCoach.experience && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        {isRTL ? 'الخبرة' : 'Experience'}
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedCoach.experience}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Slots */}
              <Card className="bg-card/50 border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    {isRTL ? 'المواعيد المتاحة' : 'Available Time Slots'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coachDetails?.slots && coachDetails.slots.length > 0 ? (
                    <div className="space-y-4">
                      {coachDetails.slots.map((slot: any) => (
                        <div 
                          key={slot.id}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                            selectedSlot?.id === slot.id
                              ? 'bg-cyan-500/20 border-cyan-500'
                              : 'bg-muted/50 border-border hover:border-cyan-500/50'
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">
                                  {isRTL ? DAYS_AR[slot.dayOfWeek] : DAYS[slot.dayOfWeek]}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {slot.isRecurring ? (isRTL ? 'أسبوعي' : 'Weekly') : (isRTL ? 'مرة واحدة' : 'One-time')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-foreground">
                                <Clock className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                                <span>{slot.startTime} - {slot.endTime}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              {slot.pricePerSession && (
                                <div className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                                  {slot.pricePerSession} {isRTL ? 'ج.م' : 'EGP'}
                                </div>
                              )}
                              {selectedSlot?.id === slot.id && (
                                <CheckCircle2 className="h-5 w-5 text-cyan-700 dark:text-cyan-400 ml-auto mt-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {selectedSlot && (
                        <Button 
                          className="w-full bg-cyan-600 hover:bg-cyan-700 mt-4"
                          onClick={() => setShowBookingModal(true)}
                        >
                          {isRTL ? 'متابعة الحجز' : 'Continue to Book'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isRTL 
                          ? 'لا توجد مواعيد متاحة حالياً'
                          : 'No available slots at the moment'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            {coachDetails?.reviews && coachDetails.reviews.length > 0 && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                    {isRTL ? 'التقييمات' : 'Reviews'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coachDetails.reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تأكيد الحجز' : 'Confirm Booking'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isRTL 
                ? 'أكمل تفاصيل الحجز أدناه'
                : 'Complete the booking details below'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Coach & Slot Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  <span className="font-semibold">{selectedCoach?.name}</span>
                </div>
                {selectedSlot && (
                  <>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{isRTL ? DAYS_AR[selectedSlot.dayOfWeek] : DAYS[selectedSlot.dayOfWeek]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                    </div>
                  </>
                )}
              </div>

            {/* Select Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? 'اختر التاريخ' : 'Select Date'}</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder={isRTL ? 'اختر تاريخ' : 'Choose a date'} />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border z-[10001]">
                  {selectedSlot && getNextDates(selectedSlot.dayOfWeek).map((date) => (
                    <SelectItem 
                      key={date.toISOString()} 
                      value={date.toISOString().split('T')[0]}
                      className="text-foreground hover:bg-muted"
                    >
                      {date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Player */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? 'اختر اللاعب' : 'Select Player'}</Label>
              {myPlayers.length > 0 ? (
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder={isRTL ? 'اختر لاعب' : 'Choose a player'} />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border z-[10001]">
                    {myPlayers.map((player: any) => (
                      <SelectItem 
                        key={player.id} 
                        value={player.id.toString()}
                        className="text-foreground hover:bg-muted"
                      >
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {isRTL 
                    ? 'لا يوجد لاعبين مسجلين. يرجى تسجيل لاعب أولاً.'
                    : 'No players registered. Please register a player first.'
                  }
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRTL ? 'أي طلبات خاصة أو مجالات للتركيز عليها...' : 'Any special requests or focus areas...'}
                className="bg-muted border-border"
              />
            </div>

            {/* Recurring Booking Option */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-muted text-cyan-700 dark:text-cyan-500 focus:ring-cyan-500"
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  {isRTL ? 'حجز أسبوعي متكرر' : 'Book Weekly Recurring Sessions'}
                </Label>
              </div>
              
              {isRecurring && (
                <div className="space-y-2 pt-2">
                  <Label className="text-sm font-medium block">
                    {isRTL ? 'عدد الأسابيع' : 'Number of Weeks'}
                  </Label>
                  <Select value={recurringWeeks.toString()} onValueChange={(v) => setRecurringWeeks(parseInt(v))}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border z-[10001]">
                      {[2, 4, 6, 8, 10, 12].map((weeks) => (
                        <SelectItem 
                          key={weeks} 
                          value={weeks.toString()}
                          className="text-foreground hover:bg-muted"
                        >
                          {weeks} {isRTL ? 'أسابيع' : 'weeks'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isRTL 
                      ? `سيتم حجز ${recurringWeeks} جلسات في نفس الوقت كل أسبوع`
                      : `${recurringWeeks} sessions will be booked at the same time each week`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Price */}
            {selectedSlot?.pricePerSession && (
              <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                <span className="text-muted-foreground">
                  {isRTL 
                    ? (isRecurring ? `السعر الإجمالي (${recurringWeeks} جلسات)` : 'السعر')
                    : (isRecurring ? `Total Price (${recurringWeeks} sessions)` : 'Price')
                  }
                </span>
                <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                  {isRecurring 
                    ? (selectedSlot.pricePerSession * recurringWeeks)
                    : selectedSlot.pricePerSession
                  } {isRTL ? 'ج.م' : 'EGP'}
                </span>
              </div>
            )}

            {/* Book Button */}
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              onClick={handleBook}
              disabled={bookMutation.isPending || !selectedDate || !selectedPlayer}
            >
              {bookMutation.isPending 
                ? (isRTL ? 'جاري الحجز...' : 'Booking...') 
                : (isRTL ? 'تأكيد الحجز' : 'Confirm Booking')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Contact */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/201004186970?text=I'm interested in booking a private training session"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden md:inline">{isRTL ? 'تواصل معنا' : 'Contact Us'}</span>
        </a>
      </div>
    </div>
    </>
  );
}
