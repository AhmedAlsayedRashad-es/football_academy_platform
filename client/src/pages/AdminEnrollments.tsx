import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, Search, Filter, ArrowLeft} from 'lucide-react';
import { useLocation } from 'wouter';
import { BackButton } from '@/components/BackButton';


export default function AdminEnrollments() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: enrollments, refetch } = trpc.enrollments.getAll.useQuery();
  
  const updateStatus = trpc.enrollments.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم التحديث" : "Updated",
        description: language === 'ar' ? "تم تحديث حالة الطلب بنجاح" : "Enrollment status updated successfully",
      });
      refetch();
      setIsDetailsOpen(false);
      setSelectedEnrollment(null);
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateStatus.mutate({ id, status: "approved", notes });
  };

  const handleReject = (id: number) => {
    updateStatus.mutate({ id, status: "rejected", notes });
  };

  const openDetails = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setNotes(enrollment.notes || "");
    setIsDetailsOpen(true);
  };

  const filteredEnrollments = enrollments?.filter((enrollment) => {
    const matchesSearch = 
      enrollment.studentFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.studentLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.parentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800">{language === 'ar' ? 'موافق عليه' : 'Approved'}</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800">{language === 'ar' ? 'مرفوض' : 'Rejected'}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          
          <BackButton />
<CardTitle className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة طلبات التسجيل' : 'Enrollment Management'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'البحث بالاسم أو البريد الإلكتروني' : 'Search by name or email'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="approved">{language === 'ar' ? 'موافق عليه' : 'Approved'}</option>
                <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'اسم الطالب' : 'Student Name'}</TableHead>
                  <TableHead>{language === 'ar' ? 'ولي الأمر' : 'Parent'}</TableHead>
                  <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                  <TableHead>{language === 'ar' ? 'البرنامج' : 'Program'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {language === 'ar' ? 'لا توجد طلبات تسجيل' : 'No enrollment applications found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments?.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.studentFirstName} {enrollment.studentLastName}
                      </TableCell>
                      <TableCell>
                        {enrollment.parentFirstName} {enrollment.parentLastName}
                      </TableCell>
                      <TableCell>{enrollment.parentEmail}</TableCell>
                      <TableCell className="capitalize">{enrollment.program}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status ?? 'pending')}</TableCell>
                      <TableCell>
                        {new Date(enrollment.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(enrollment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {enrollment.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(enrollment.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleReject(enrollment.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تفاصيل طلب التسجيل' : 'Enrollment Details'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'معلومات كاملة عن الطلب' : 'Complete application information'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEnrollment && (
            <div className="space-y-4">
              {/* Student Information */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'ar' ? 'معلومات الطالب' : 'Student Information'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">{language === 'ar' ? 'الاسم:' : 'Name:'}</span> {selectedEnrollment.studentFirstName} {selectedEnrollment.studentLastName}</div>
                  <div><span className="font-medium">{language === 'ar' ? 'تاريخ الميلاد:' : 'DOB:'}</span> {new Date(selectedEnrollment.dateOfBirth).toLocaleDateString()}</div>
                  <div><span className="font-medium">{language === 'ar' ? 'الجنس:' : 'Gender:'}</span> {selectedEnrollment.gender}</div>
                </div>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'ar' ? 'معلومات ولي الأمر' : 'Parent Information'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">{language === 'ar' ? 'الاسم:' : 'Name:'}</span> {selectedEnrollment.parentFirstName} {selectedEnrollment.parentLastName}</div>
                  <div><span className="font-medium">{language === 'ar' ? 'البريد:' : 'Email:'}</span> {selectedEnrollment.parentEmail}</div>
                  <div><span className="font-medium">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {selectedEnrollment.parentPhone}</div>
                </div>
              </div>

              {/* Program Information */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'ar' ? 'معلومات البرنامج' : 'Program Information'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">{language === 'ar' ? 'المستوى:' : 'Level:'}</span> {selectedEnrollment.programLevel}</div>
                  <div><span className="font-medium">{language === 'ar' ? 'الفئة العمرية:' : 'Age Group:'}</span> {selectedEnrollment.ageGroup || 'N/A'}</div>
                  <div><span className="font-medium">{language === 'ar' ? 'المركز المفضل:' : 'Position:'}</span> {selectedEnrollment.preferredPosition || 'N/A'}</div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedEnrollment.previousExperience || selectedEnrollment.medicalConditions || selectedEnrollment.emergencyContact) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === 'ar' ? 'معلومات إضافية' : 'Additional Information'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedEnrollment.previousExperience && (
                      <div><span className="font-medium">{language === 'ar' ? 'الخبرة السابقة:' : 'Previous Experience:'}</span> {selectedEnrollment.previousExperience}</div>
                    )}
                    {selectedEnrollment.medicalConditions && (
                      <div><span className="font-medium">{language === 'ar' ? 'الحالات الطبية:' : 'Medical Conditions:'}</span> {selectedEnrollment.medicalConditions}</div>
                    )}
                    {selectedEnrollment.emergencyContact && (
                      <div><span className="font-medium">{language === 'ar' ? 'جهة الاتصال في الطوارئ:' : 'Emergency Contact:'}</span> {selectedEnrollment.emergencyContact}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes'}
                </h3>
                <Textarea
                  placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                </h3>
                {getStatusBadge(selectedEnrollment.status)}
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedEnrollment?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleReject(selectedEnrollment.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'رفض' : 'Reject'}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedEnrollment.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'موافقة' : 'Approve'}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
