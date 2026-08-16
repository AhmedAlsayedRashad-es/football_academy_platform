import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Briefcase, CheckCircle, ArrowLeft} from 'lucide-react';
import { Link, useLocation} from 'wouter';
import { BackButton } from '@/components/BackButton';


export default function Careers() {
  const [, navigate] = useLocation();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    yearsExperience: "",
    qualifications: "",
    previousClubs: "",
    cvUrl: "",
    coverLetter: "",
    linkedinUrl: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitApplication = trpc.careers.submit.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم الإرسال بنجاح" : "Application Submitted!",
        description: language === 'ar' 
          ? "شكراً لتقديمك. سنتواصل معك قريباً" 
          : "Thank you for applying. We'll contact you soon.",
      });
      setSubmitted(true);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في إرسال الطلب" : "Failed to submit application"),
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = language === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    }

    if (!formData.position) {
      newErrors.position = language === 'ar' ? 'الوظيفة مطلوبة' : 'Position is required';
    }

    if (!formData.yearsExperience) {
      newErrors.yearsExperience = language === 'ar' ? 'سنوات الخبرة مطلوبة' : 'Years of experience is required';
    } else if (parseInt(formData.yearsExperience) < 0) {
      newErrors.yearsExperience = language === 'ar' ? 'سنوات الخبرة غير صحيحة' : 'Invalid years of experience';
    }

    if (!formData.qualifications.trim()) {
      newErrors.qualifications = language === 'ar' ? 'المؤهلات مطلوبة' : 'Qualifications are required';
    }

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = language === 'ar' ? 'خطاب التقديم مطلوب' : 'Cover letter is required';
    } else if (formData.coverLetter.trim().length < 50) {
      newErrors.coverLetter = language === 'ar' ? 'خطاب التقديم يجب أن يكون 50 حرفاً على الأقل' : 'Cover letter must be at least 50 characters';
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: language === 'ar' ? "خطأ في النموذج" : "Form Error",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    submitApplication.mutate({
      ...formData,
      position: formData.position as "other" | "goalkeeper_coach" | "fitness_coach" | "analyst" | "physiotherapist" | "football_coach" | "sports_psychologist",
      yearsExperience: parseInt(formData.yearsExperience)
    });
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'تم الإرسال بنجاح!' : 'Application Submitted!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {language === 'ar' 
                ? 'شكراً لتقديمك طلب التوظيف. سنقوم بمراجعة طلبك والتواصل معك قريباً.' 
                : 'Thank you for your application. We will review it and contact you soon.'}
            </p>
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-10 h-10 text-emerald-600" />
            
            <BackButton />
<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'انضم لفريقنا' : 'Join Our Team'}
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {language === 'ar' 
              ? 'نبحث عن مدربين موهوبين لتطوير نجوم المستقبل' 
              : 'We are looking for talented coaches to develop future stars'}
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </Link>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              {language === 'ar' ? 'طلب التوظيف' : 'Job Application'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={language === 'ar' ? '+966 50 123 4567' : '+966 50 123 4567'}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Position */}
              <div>
                <Label htmlFor="position">{language === 'ar' ? 'الوظيفة المطلوبة' : 'Position'} *</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger className={errors.position ? 'border-red-500' : ''}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر الوظيفة' : 'Select position'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="football_coach">{language === 'ar' ? 'مدرب كرة قدم' : 'Football Coach'}</SelectItem>
                    <SelectItem value="fitness_coach">{language === 'ar' ? 'مدرب لياقة بدنية' : 'Fitness Coach'}</SelectItem>
                    <SelectItem value="goalkeeper_coach">{language === 'ar' ? 'مدرب حراس مرمى' : 'Goalkeeper Coach'}</SelectItem>
                    <SelectItem value="sports_psychologist">{language === 'ar' ? 'أخصائي نفسي رياضي' : 'Sports Psychologist'}</SelectItem>
                    <SelectItem value="analyst">{language === 'ar' ? 'محلل أداء' : 'Performance Analyst'}</SelectItem>
                    <SelectItem value="physiotherapist">{language === 'ar' ? 'أخصائي علاج طبيعي' : 'Physiotherapist'}</SelectItem>
                    <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
              </div>

              {/* Years of Experience */}
              <div>
                <Label htmlFor="yearsExperience">{language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience'} *</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  placeholder={language === 'ar' ? '5' : '5'}
                  className={errors.yearsExperience ? 'border-red-500' : ''}
                />
                {errors.yearsExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsExperience}</p>}
              </div>

              {/* Qualifications */}
              <div>
                <Label htmlFor="qualifications">{language === 'ar' ? 'المؤهلات والشهادات' : 'Qualifications & Certifications'} *</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder={language === 'ar' 
                    ? 'مثال: شهادة UEFA Pro، شهادة تدريب اللياقة البدنية...' 
                    : 'e.g., UEFA Pro License, Fitness Training Certificate...'}
                  rows={3}
                  className={errors.qualifications ? 'border-red-500' : ''}
                />
                {errors.qualifications && <p className="text-red-500 text-sm mt-1">{errors.qualifications}</p>}
              </div>

              {/* Previous Clubs */}
              <div>
                <Label htmlFor="previousClubs">{language === 'ar' ? 'الأندية السابقة' : 'Previous Clubs'}</Label>
                <Textarea
                  id="previousClubs"
                  value={formData.previousClubs}
                  onChange={(e) => setFormData({ ...formData, previousClubs: e.target.value })}
                  placeholder={language === 'ar' 
                    ? 'اذكر الأندية التي عملت بها سابقاً' 
                    : 'List clubs you have worked with previously'}
                  rows={3}
                />
              </div>

              {/* CV Upload */}
              <div>
                <Label>{language === 'ar' ? 'السيرة الذاتية (PDF)' : 'CV/Resume (PDF)'}</Label>
                <FileUpload
                  onUploadComplete={(url) => setFormData({ ...formData, cvUrl: url })}
                  accept=".pdf,.doc,.docx"
                  maxSizeMB={5}
                />
                {formData.cvUrl && (
                  <p className="text-sm text-emerald-600 mt-2">
                    {language === 'ar' ? '✓ تم رفع الملف' : '✓ File uploaded'}
                  </p>
                )}
              </div>

              {/* Cover Letter */}
              <div>
                <Label htmlFor="coverLetter">{language === 'ar' ? 'خطاب التقديم' : 'Cover Letter'} *</Label>
                <Textarea
                  id="coverLetter"
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  placeholder={language === 'ar' 
                    ? 'اشرح لماذا تريد الانضمام لفريقنا وما الذي يميزك...' 
                    : 'Explain why you want to join our team and what makes you stand out...'}
                  rows={6}
                  className={errors.coverLetter ? 'border-red-500' : ''}
                />
                {errors.coverLetter && <p className="text-red-500 text-sm mt-1">{errors.coverLetter}</p>}
              </div>

              {/* LinkedIn */}
              <div>
                <Label htmlFor="linkedinUrl">{language === 'ar' ? 'رابط LinkedIn' : 'LinkedIn URL'}</Label>
                <Input
                  id="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...') 
                  : (language === 'ar' ? 'إرسال الطلب' : 'Submit Application')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
