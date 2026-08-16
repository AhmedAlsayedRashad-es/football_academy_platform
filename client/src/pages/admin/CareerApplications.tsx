import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import {FileText, Eye, CheckCircle, XCircle, Clock, Download, ArrowLeft} from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function CareerApplications() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: applications, isLoading, refetch } = trpc.careers.getAll.useQuery();
  const updateStatusMutation = trpc.careers.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Application status updated successfully');
      refetch();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const filteredApplications = applications?.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a) => a.status === 'pending').length || 0,
    underReview: applications?.filter((a) => a.status === 'reviewing').length || 0,
    approved: applications?.filter((a) => a.status === 'accepted').length || 0,
    rejected: applications?.filter((a) => a.status === 'rejected').length || 0,
  };

  const handleStatusUpdate = (applicationId: number, newStatus: 'pending' | 'rejected' | 'accepted' | 'reviewing' | 'shortlisted' | 'interviewed') => {
    updateStatusMutation.mutate({
      id: applicationId,
      status: newStatus,
      adminNotes: adminNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      interviewed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
              <BackButton />
<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Career Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage coach and staff applications</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-700 dark:text-yellow-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
                <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-700 dark:text-green-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Under Review</SelectItem>
                  <SelectItem value="accepted">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApplications?.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {application.fullName}
                        </div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">{application.email}</div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">{application.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{application.position}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {application.yearsExperience} years
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(application.status)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-gray-400">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Dialog
                        open={isDialogOpen && selectedApplication?.id === application.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (open) {
                            setSelectedApplication(application);
                            setAdminNotes('');
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                            <DialogDescription>Review and manage this application</DialogDescription>
                          </DialogHeader>
                          {selectedApplication && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {selectedApplication.fullName}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">{selectedApplication.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Phone
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">{selectedApplication.phone}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Position
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {selectedApplication.position}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Years of Experience
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {selectedApplication.yearsExperience} years
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                  </label>
                                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Qualifications
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {selectedApplication.qualifications}
                                </p>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Cover Letter
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {selectedApplication.coverLetter}
                                </p>
                              </div>

                              {selectedApplication.cvUrl && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    CV/Resume
                                  </label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => window.open(selectedApplication.cvUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download CV
                                  </Button>
                                </div>
                              )}

                              {selectedApplication.adminNotes && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Previous Admin Notes
                                  </label>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                    {selectedApplication.adminNotes}
                                  </p>
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Add Admin Notes
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add internal notes about this application..."
                                  className="mt-2"
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2 pt-4">
                                {selectedApplication.status !== 'accepted' && (
                                  <Button
                                    onClick={() => handleStatusUpdate(selectedApplication.id, 'accepted')}
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                )}
                                {selectedApplication.status !== 'reviewing' && (
                                  <Button
                                    onClick={() => handleStatusUpdate(selectedApplication.id, 'reviewing')}
                                    variant="outline"
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Under Review
                                  </Button>
                                )}
                                {selectedApplication.status !== 'rejected' && (
                                  <Button
                                    onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                                    variant="destructive"
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApplications?.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No applications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
