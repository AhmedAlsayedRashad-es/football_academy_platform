import { useState } from "react";
import { toast } from 'sonner';
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  Star,
  DollarSign,
  TrendingUp,
  Users,
  ArrowLeft,
  Repeat
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

export default function BookingManagement() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  // Coach queries
  const { data: coachBookings, refetch: refetchCoachBookings } = trpc.privateTraining.getCoachBookings.useQuery(
    undefined,
    { enabled: isCoach }
  );
  const { data: coachStats } = trpc.privateTraining.getCoachStats.useQuery(
    undefined,
    { enabled: isCoach }
  );

  // Parent queries
  const { data: parentBookings, refetch: refetchParentBookings } = trpc.privateTraining.getMyBookings.useQuery(
    undefined,
    { enabled: !isCoach }
  );

  // Mutations
  const confirmBooking = trpc.privateTraining.confirmBooking.useMutation({
    onSuccess: () => {
      refetchCoachBookings();
    },
  });

  const completeBooking = trpc.privateTraining.completeBooking.useMutation({
    onSuccess: () => {
      refetchCoachBookings();
    },
  });

  const cancelBooking = trpc.privateTraining.cancelBooking.useMutation({
    onSuccess: () => {
      isCoach ? refetchCoachBookings() : refetchParentBookings();
    },
  });

  const cancelRecurringSeries = trpc.privateTraining.cancelRecurringSeries.useMutation({
    onSuccess: (data) => {
      toast.success(`Cancelled ${data.cancelledCount} sessions in the series`);
      isCoach ? refetchCoachBookings() : refetchParentBookings();
    },
  });

  const [cancelSeriesModalOpen, setCancelSeriesModalOpen] = useState(false);
  const [selectedSeriesGroupId, setSelectedSeriesGroupId] = useState<string | null>(null);
  const [cancelSeriesReason, setCancelSeriesReason] = useState("");

  const submitReview = trpc.privateTraining.submitBookingReview.useMutation({
    onSuccess: () => {
      setReviewModalOpen(false);
      setSelectedBooking(null);
      setReviewRating(5);
      setReviewComment("");
      refetchParentBookings();
    },
  });

  const bookings = isCoach ? coachBookings : parentBookings;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      completed: { variant: "outline", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filterBookings = (status: string) => {
    if (!bookings) return [];
    if (status === "upcoming") {
      return bookings.filter(b => b.status === "confirmed" || b.status === "pending");
    }
    return bookings.filter(b => b.status === status);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openReviewModal = (booking: any) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedBooking) return;
    submitReview.mutate({
      bookingId: selectedBooking.id,
      coachId: selectedBooking.coachId,
      rating: reviewRating,
      comment: reviewComment || undefined,
    });
  };

  if (!user) {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please log in to view your bookings</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  return (
    <>
    <div >
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">
            {isCoach ? "Booking Management" : "My Bookings"}
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            {isCoach 
              ? "Manage your private training sessions and view your schedule"
              : "View and manage your private training bookings"
            }
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Coach Stats */}
        {isCoach && coachStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{coachStats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{coachStats.upcoming}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{coachStats.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{coachStats.cancelled}</p>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{coachStats.revenue} EGP</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {["upcoming", "completed", "cancelled"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="space-y-4">
                {filterBookings(tabValue).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No {tabValue} bookings found
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filterBookings(tabValue).map((booking: any) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {isCoach 
                                  ? `${booking.playerFirstName || ''} ${booking.playerLastName || ''}`.trim() || 'Player'
                                  : booking.coachName || 'Coach'
                                }
                              </h3>
                              {getStatusBadge(booking.status)}
                              {booking.isRecurring && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Repeat className="h-3 w-3" />
                                  {booking.recurringIndex}/{booking.recurringWeeks}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(booking.sessionDate)}
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
                              {booking.totalPrice && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {booking.totalPrice} EGP
                                </span>
                              )}
                            </div>
                            {booking.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <strong>Notes:</strong> {booking.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {/* Coach actions */}
                            {isCoach && booking.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => confirmBooking.mutate({ bookingId: booking.id })}
                                  disabled={confirmBooking.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => cancelBooking.mutate({ bookingId: booking.id })}
                                  disabled={cancelBooking.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}
                            {isCoach && booking.status === 'confirmed' && (
                              <Button 
                                size="sm"
                                onClick={() => completeBooking.mutate({ bookingId: booking.id })}
                                disabled={completeBooking.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Complete
                              </Button>
                            )}

                            {/* Parent actions */}
                            {!isCoach && booking.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => cancelBooking.mutate({ bookingId: booking.id })}
                                  disabled={cancelBooking.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                {booking.isRecurring && booking.recurringGroupId && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSeriesGroupId(booking.recurringGroupId);
                                      setCancelSeriesModalOpen(true);
                                    }}
                                  >
                                    <Repeat className="h-4 w-4 mr-1" />
                                    Cancel All
                                  </Button>
                                )}
                              </>
                            )}
                            {!isCoach && booking.status === 'completed' && !booking.hasReview && (
                              <Button 
                                size="sm"
                                onClick={() => openReviewModal(booking)}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Leave Review
                              </Button>
                            )}
                            {!isCoach && booking.status === 'completed' && booking.hasReview && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-700 dark:text-yellow-400" />
                                Reviewed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Cancel Recurring Series Modal */}
      <Dialog open={cancelSeriesModalOpen} onOpenChange={setCancelSeriesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Cancel Recurring Series
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              This will cancel all remaining sessions in this recurring booking series. 
              Sessions that have already been completed will not be affected.
            </p>
            <div>
              <Label htmlFor="cancelReason">Reason (optional)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Why are you cancelling the series?"
                value={cancelSeriesReason}
                onChange={(e) => setCancelSeriesReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCancelSeriesModalOpen(false);
              setSelectedSeriesGroupId(null);
              setCancelSeriesReason("");
            }}>
              Keep Sessions
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedSeriesGroupId) {
                  cancelRecurringSeries.mutate({
                    recurringGroupId: selectedSeriesGroupId,
                    reason: cancelSeriesReason || undefined,
                  });
                  setCancelSeriesModalOpen(false);
                  setSelectedSeriesGroupId(null);
                  setCancelSeriesReason("");
                }
              }}
              disabled={cancelRecurringSeries.isPending}
            >
              {cancelRecurringSeries.isPending ? "Cancelling..." : "Cancel All Sessions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        star <= reviewRating 
                          ? 'fill-yellow-400 text-yellow-700 dark:text-yellow-400' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience with this coach..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
