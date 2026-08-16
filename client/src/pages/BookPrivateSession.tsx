import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Calendar as CalendarIcon, Clock, User, CheckCircle, AlertCircle, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function generateTimeSlots(startTime: string, endTime: string, durationMins: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current + durationMins <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += durationMins;
  }
  return slots;
}

export default function BookPrivateSession() {
  const [location, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  // Pre-select coach from URL query param (e.g. /book-private-session?coachId=5)
  const urlCoachId = new URLSearchParams(location.split('?')[1] || '').get('coachId');
  const [selectedCoach, setSelectedCoach] = useState<number | null>(urlCoachId ? Number(urlCoachId) : null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [sessionType, setSessionType] = useState<string>("technical");
  const [notes, setNotes] = useState<string>("");

  const { data: coaches, isLoading: coachesLoading } = trpc.coaches.getAvailable.useQuery();
  const { data: coachAvailability, isLoading: availabilityLoading } = trpc.coachAvailability.getByCoach.useQuery(
    { coachId: selectedCoach! },
    { enabled: !!selectedCoach }
  );

  const createBooking = trpc.privateBookings.create.useMutation({
    onSuccess: () => {
      toast.success("Booking created successfully! The coach will confirm your session soon.");
      navigate("/dashboard/my-bookings");
    },
    onError: (error) => {
      toast.error("Failed to create booking: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { navigate("/"); return null; }

  // Compute available time slots based on selected coach's availability for the selected day
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !coachAvailability || coachAvailability.length === 0) {
      // Fallback: show default slots if no availability set
      return ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"];
    }
    const dayOfWeek = selectedDate.getDay(); // 0=Sunday
    const daySlots = coachAvailability.filter(
      (a: any) => a.dayOfWeek === dayOfWeek && a.isAvailable !== false
    );
    if (daySlots.length === 0) return [];
    const allSlots: string[] = [];
    daySlots.forEach((slot: any) => {
      const slots = generateTimeSlots(slot.startTime, slot.endTime, duration);
      slots.forEach(s => { if (!allSlots.includes(s)) allSlots.push(s); });
    });
    return allSlots.sort();
  }, [selectedDate, coachAvailability, duration]);

  // Determine which days the coach is available for the calendar
  const availableDays = useMemo(() => {
    if (!coachAvailability || coachAvailability.length === 0) return null;
    return new Set(coachAvailability.filter((a: any) => a.isAvailable !== false).map((a: any) => a.dayOfWeek));
  }, [coachAvailability]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) { toast.error("Please select a coach"); return; }
    if (!selectedDate) { toast.error("Please select a date"); return; }
    if (!selectedTime) { toast.error("Please select a time"); return; }
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const sessionDateTime = new Date(selectedDate);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    createBooking.mutate({ coachId: selectedCoach, sessionDate: sessionDateTime.toISOString(), duration, sessionType, notes });
  };

  const selectedCoachData = coaches?.find((c: any) => c.id === selectedCoach);
  const sessionPrice = duration === 60 ? 300 : duration === 90 ? 400 : 200;

  return (
    <>
      <div className="space-y-6">
        <div>
          
          <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8" />
            Book Private Training Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Schedule a one-on-one session with our expert coaches
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>Fill in the details below to book your private training session</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Coach Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="coach">Select Coach *</Label>
                    {coachesLoading ? (
                      <div className="text-sm text-muted-foreground">Loading coaches...</div>
                    ) : (
                      <Select
                        value={selectedCoach?.toString() ?? ""}
                        onValueChange={(value) => {
                          setSelectedCoach(parseInt(value));
                          setSelectedDate(undefined);
                          setSelectedTime("");
                        }}
                      >
                        <SelectTrigger id="coach">
                          <SelectValue placeholder="Choose a coach" />
                        </SelectTrigger>
                        <SelectContent>
                          {coaches?.map((coach: any) => (
                            <SelectItem key={coach.id} value={coach.id.toString()}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {coach.name} - {coach.specialty || "General Coach"}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Coach Availability Info */}
                  {selectedCoach && !availabilityLoading && coachAvailability && coachAvailability.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Coach Available Days:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(coachAvailability.filter((a: any) => a.isAvailable !== false).map((a: any) => a.dayOfWeek as number))).sort().map((day: number) => {
                          const slots = coachAvailability.filter((a: any) => a.dayOfWeek === day && a.isAvailable !== false);
                          return (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {DAY_NAMES[day]}: {slots.map((s: any) => `${s.startTime}–${s.endTime}`).join(", ")}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedCoach && !availabilityLoading && (!coachAvailability || coachAvailability.length === 0) && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">This coach hasn't set their availability yet. Default time slots will be shown.</p>
                    </div>
                  )}

                  {/* Duration (before date so slots are correct) */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Session Duration *</Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => { setDuration(parseInt(value)); setSelectedTime(""); }}
                    >
                      <SelectTrigger id="duration"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes - EGP 200</SelectItem>
                        <SelectItem value="60">60 minutes - EGP 300</SelectItem>
                        <SelectItem value="90">90 minutes - EGP 400</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>Select Date *</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedTime(""); }}
                      disabled={(date) => {
                        if (date < new Date()) return true;
                        if (availableDays && availableDays.size > 0) {
                          return !availableDays.has(date.getDay());
                        }
                        return false;
                      }}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Select Time *</Label>
                    {selectedDate && availableTimeSlots.length === 0 ? (
                      <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-700 dark:text-red-300">
                          No available slots on {DAY_NAMES[selectedDate.getDay()]}. Please choose another date.
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                        <SelectTrigger id="time">
                          <SelectValue placeholder={selectedDate ? "Choose a time slot" : "Select a date first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {time}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Session Type */}
                  <div className="space-y-2">
                    <Label htmlFor="sessionType">Session Focus *</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger id="sessionType"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Skills</SelectItem>
                        <SelectItem value="tactical">Tactical Understanding</SelectItem>
                        <SelectItem value="physical">Physical Conditioning</SelectItem>
                        <SelectItem value="mental">Mental Preparation</SelectItem>
                        <SelectItem value="goalkeeping">Goalkeeping</SelectItem>
                        <SelectItem value="general">General Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific goals or areas you'd like to focus on..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createBooking.isPending || availableTimeSlots.length === 0}>
                    {createBooking.isPending ? "Creating Booking..." : "Book Session"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {selectedCoachData && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Coach</div>
                    <div className="font-semibold">{selectedCoachData.name}</div>
                    {selectedCoachData.specialty && (
                      <Badge variant="outline" className="mt-1">{selectedCoachData.specialty}</Badge>
                    )}
                  </div>
                )}
                {selectedDate && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Date</div>
                    <div className="font-semibold">
                      {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>
                )}
                {selectedTime && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                    <div className="font-semibold">{selectedTime}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  <div className="font-semibold">{duration} minutes</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Session Type</div>
                  <div className="font-semibold capitalize">{sessionType.replace("_", " ")}</div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Price</span>
                    <span className="text-orange-700 dark:text-orange-500">EGP {sessionPrice}</span>
                  </div>
                </div>
                <div className="pt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-700 dark:text-green-500" />
                    <span>Coach will confirm within 24 hours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-700 dark:text-green-500" />
                    <span>Free cancellation up to 24 hours before</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-700 dark:text-green-500" />
                    <span>Payment on arrival</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
