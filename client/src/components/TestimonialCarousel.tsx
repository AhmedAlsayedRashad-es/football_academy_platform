import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Testimonial {
  id: number;
  name: string;
  role?: string | null;
  rating: number;
  testimonial: string;
  // Nullable on the stored row.
  isFeatured: boolean | null;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  interval?: number;
  variant?: 'default' | 'compact' | 'hero';
}

export default function TestimonialCarousel({
  testimonials,
  autoPlay = true,
  interval = 5000,
  variant = 'default',
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoPlay || isPaused || testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, testimonials.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  if (variant === 'hero') {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Quote className="w-12 h-12 text-orange-700 dark:text-orange-500 mx-auto mb-6 opacity-50" />
              <p className="text-2xl md:text-3xl font-light text-foreground mb-6 leading-relaxed italic">
                "{currentTestimonial.testimonial}"
              </p>
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < currentTestimonial.rating
                        ? 'fill-orange-500 text-orange-700 dark:text-orange-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xl font-semibold text-foreground">{currentTestimonial.name}</p>
              {currentTestimonial.role && (
                <p className="text-muted-foreground mt-1">{currentTestimonial.role}</p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-orange-500 w-8'
                    : 'bg-gray-400 hover:bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative w-full">
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < currentTestimonial.rating
                            ? 'fill-orange-500 text-orange-700 dark:text-orange-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 text-sm italic">
                    "{currentTestimonial.testimonial}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{currentTestimonial.name}</p>
                      {currentTestimonial.role && (
                        <p className="text-muted-foreground text-xs">{currentTestimonial.role}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPrevious}
                        className="h-8 w-8 p-0 text-foreground hover:bg-white/10"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNext}
                        className="h-8 w-8 p-0 text-foreground hover:bg-white/10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-xl">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center text-center">
                  <Quote className="w-10 h-10 text-orange-700 dark:text-orange-500 mb-6 opacity-50" />
                  <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed italic">
                    "{currentTestimonial.testimonial}"
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < currentTestimonial.rating
                            ? 'fill-orange-500 text-orange-700 dark:text-orange-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentTestimonial.name}
                  </p>
                  {currentTestimonial.role && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {currentTestimonial.role}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {testimonials.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 rounded-full shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 rounded-full shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-orange-500 w-8'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
