import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {Award, 
  Download, 
  Share2, 
  Calendar, 
  Trophy,
  Search,
  Filter,
  ExternalLink,
  CheckCircle,
  Star,
  Loader2, ArrowLeft} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


interface Certificate {
  id: number;
  courseId: number;
  courseName: string;
  certificateNumber: string;
  certificateUrl: string;
  level: string;
  score: number;
  issuedAt: string;
  expiresAt: string | null;
  verificationCode: string;
}

const levelColors: Record<string, string> = {
  'grassroots': 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50',
  'c_license': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50',
  'b_license': 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/50',
  'a_license': 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50',
  'pro_license': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50',
};

const levelLabels: Record<string, string> = {
  'grassroots': 'Grassroots',
  'c_license': 'C License',
  'b_license': 'B License',
  'a_license': 'A License',
  'pro_license': 'Pro License',
};

export default function CertificateGallery() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  // Fetch certificates
  const { data: certificates = [], isLoading, error } = trpc.certificates.getMyCertificates.useQuery();

  const filteredCertificates = certificates.filter((cert: Certificate) => {
    const matchesSearch = cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterLevel || cert.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const handleDownload = async (cert: Certificate) => {
    try {
      // Open certificate URL in new tab for download
      window.open(cert.certificateUrl, '_blank');
      toast.success('Certificate download started');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  const handleShare = async (cert: Certificate) => {
    const shareUrl = `${window.location.origin}/verify-certificate/${cert.verificationCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cert.courseName} Certificate`,
          text: `I earned a ${levelLabels[cert.level]} certificate in ${cert.courseName}!`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or share failed
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Certificate link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-orange-700 dark:text-orange-400';
  };

  return (
    <>
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Award className="w-8 h-8 text-yellow-700 dark:text-yellow-500" />
            </div>
            <div>
              
              <BackButton />
<h1 className="text-2xl md:text-3xl font-bold text-foreground">My Certificates</h1>
              <p className="text-muted-foreground">View and download your earned certificates</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-700 dark:text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{certificates.length}</p>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-green-700 dark:text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {certificates.filter((c: Certificate) => c.score >= 90).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Distinction</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {certificates.length > 0 
                      ? Math.round(certificates.reduce((acc: number, c: Certificate) => acc + c.score, 0) / certificates.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(certificates.map((c: Certificate) => c.level)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">License Levels</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted border-border text-foreground"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterLevel === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLevel(null)}
                  className={filterLevel === null ? 'bg-purple-600' : 'border-border text-muted-foreground'}
                >
                  All
                </Button>
                {Object.entries(levelLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={filterLevel === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterLevel(key)}
                    className={filterLevel === key ? 'bg-purple-600' : 'border-border text-muted-foreground'}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-700 dark:text-yellow-500" />
          </div>
        ) : error ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load certificates. Please try again.</p>
            </CardContent>
          </Card>
        ) : filteredCertificates.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterLevel 
                  ? 'No certificates match your search criteria'
                  : 'No certificates earned yet. Complete a course to earn your first certificate!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert: Certificate) => (
              <Card 
                key={cert.id} 
                className="bg-card/50 border-border hover:border-yellow-500/50 transition-all duration-300 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge className={`${levelColors[cert.level]} border`}>
                      {levelLabels[cert.level]}
                    </Badge>
                    <div className={`text-2xl font-bold ${getScoreColor(cert.score)}`}>
                      {cert.score}%
                    </div>
                  </div>
                  <CardTitle className="text-foreground text-lg mt-2">{cert.courseName}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Certificate #{cert.certificateNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Certificate Preview */}
                  <div className="brand-gradient-subtle relative mb-4 rounded-lg p-6 border border-yellow-500/20">
                    <div className="absolute top-2 right-2">
                      <Award className="w-8 h-8 text-yellow-500/50" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificate of Completion</p>
                      <p className="text-lg font-bold text-foreground mt-2">{cert.courseName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{levelLabels[cert.level]}</p>
                      {cert.score >= 90 && (
                        <Badge className="mt-2 bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50">
                          <Star className="w-3 h-3 mr-1" />
                          With Distinction
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Issued: {formatDate(cert.issuedAt)}</span>
                    </div>
                    {cert.expiresAt && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Expires: {formatDate(cert.expiresAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => handleDownload(cert)}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleShare(cert)}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(cert.certificateUrl, '_blank')}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
