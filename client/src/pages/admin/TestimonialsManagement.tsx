import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {CheckCircle, XCircle, Star, StarOff, Loader2, Filter, ArrowLeft} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function TestimonialsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  
  const { data: testimonials, isLoading, refetch } = trpc.testimonials.getAll.useQuery();
  const approveMutation = trpc.testimonials.approve.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Testimonial approved successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (id: number, featured: boolean = false) => {
    approveMutation.mutate({ id, featured });
  };

  const filteredTestimonials = testimonials?.filter(t => {
    if (filter === 'pending') return !t.isApproved;
    if (filter === 'approved') return t.isApproved;
    return true;
  });

  const pendingCount = testimonials?.filter(t => !t.isApproved).length || 0;
  const approvedCount = testimonials?.filter(t => t.isApproved).length || 0;

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
          Testimonials Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage testimonials from your community
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-500">{testimonials?.length || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Testimonials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">{pendingCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-700 dark:text-green-500">{approvedCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          All ({testimonials?.length || 0})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          className="gap-2"
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          className="gap-2"
        >
          Approved ({approvedCount})
        </Button>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {filteredTestimonials?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground dark:text-gray-400">
                No testimonials found for this filter
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTestimonials?.map((testimonial) => (
            <Card key={testimonial.id} className={testimonial.isApproved ? 'border-green-200 dark:border-green-900' : 'border-yellow-200 dark:border-yellow-900'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{testimonial.name}</CardTitle>
                      {testimonial.role && (
                        <Badge variant="outline" className="text-xs">
                          {testimonial.role}
                        </Badge>
                      )}
                      {testimonial.isApproved && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      {!testimonial.isApproved && (
                        <Badge className="bg-yellow-500 text-black">
                          Pending Review
                        </Badge>
                      )}
                      {testimonial.isFeatured && (
                        <Badge className="bg-orange-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'fill-orange-500 text-orange-700 dark:text-orange-500'
                              : 'text-muted-foreground dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {testimonial.rating}/5
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Submitted on {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.testimonial}"
                </p>
                
                {!testimonial.isApproved && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleApprove(testimonial.id, false)}
                      disabled={approveMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApprove(testimonial.id, true)}
                      disabled={approveMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Star className="w-4 h-4 mr-2" />
                      )}
                      Approve & Feature
                    </Button>
                  </div>
                )}
                
                {testimonial.isApproved && !testimonial.isFeatured && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleApprove(testimonial.id, true)}
                      disabled={approveMutation.isPending}
                      variant="outline"
                      className="border-orange-500 text-orange-700 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Star className="w-4 h-4 mr-2" />
                      )}
                      Make Featured
                    </Button>
                  </div>
                )}
                
                {testimonial.isApproved && testimonial.isFeatured && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleApprove(testimonial.id, false)}
                      disabled={approveMutation.isPending}
                      variant="outline"
                      className="border-gray-500 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-950"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <StarOff className="w-4 h-4 mr-2" />
                      )}
                      Remove from Featured
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    </>
  );
}
