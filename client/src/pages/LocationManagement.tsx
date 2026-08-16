import { useState } from 'react';
import { Link , useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, MapPin, Plus, Trash2, Edit2, Users, Check, X
} from 'lucide-react';

export default function LocationManagement() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    address: '',
    capacity: 2,
  });

  // Fetch all locations (admin)
  const { data: locations = [], refetch: refetchLocations } = trpc.privateTraining.getAllLocations.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  // Mutations
  const createLocationMutation = trpc.privateTraining.createLocation.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم إضافة الموقع بنجاح' : 'Location added successfully');
      setShowAddModal(false);
      refetchLocations();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const updateLocationMutation = trpc.privateTraining.updateLocation.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم تحديث الموقع بنجاح' : 'Location updated successfully');
      setEditingLocation(null);
      refetchLocations();
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const resetForm = () => {
    setNewLocation({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      address: '',
      capacity: 2,
    });
  };

  const handleAddLocation = () => {
    if (!newLocation.name) {
      toast.error(isRTL ? 'يرجى إدخال اسم الموقع' : 'Please enter location name');
      return;
    }
    createLocationMutation.mutate(newLocation);
  };

  const handleUpdateLocation = () => {
    if (!editingLocation) return;
    updateLocationMutation.mutate({
      id: editingLocation.id,
      name: editingLocation.name,
      nameAr: editingLocation.nameAr,
      description: editingLocation.description,
      descriptionAr: editingLocation.descriptionAr,
      address: editingLocation.address,
      capacity: editingLocation.capacity,
      isActive: editingLocation.isActive,
    });
  };

  const toggleLocationActive = (location: any) => {
    updateLocationMutation.mutate({
      id: location.id,
      isActive: !location.isActive,
    });
  };

  // Check if user is authorized
  if (!user || user.role !== 'admin') {
    return (
      <>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="bg-card/50 border-border p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {isRTL ? 'غير مصرح' : 'Unauthorized'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {isRTL
              ? 'هذه الصفحة متاحة للمسؤولين فقط'
              : 'This page is only available for administrators'
            }
          </p>
          <Link href="/">
            <Button>{isRTL ? 'العودة للرئيسية' : 'Back to Home'}</Button>
          </Link>
        </Card>
      </div>
      </>
    );
  }

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
                <MapPin className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                <h1 className="text-xl font-bold">{isRTL ? 'إدارة المواقع' : 'Location Management'}</h1>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'إضافة موقع' : 'Add Location'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{locations.length}</div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'إجمالي المواقع' : 'Total Locations'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                {locations.filter((l: any) => l.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'نشط' : 'Active'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {locations.reduce((sum: number, l: any) => sum + (l.capacity || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'إجمالي السعة' : 'Total Capacity'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location: any) => (
            <Card 
              key={location.id}
              className={`border transition-colors ${
                location.isActive 
                  ? 'bg-card/50 border-border hover:border-cyan-500' 
                  : 'bg-card/30 border-border/50 opacity-75'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground text-lg">
                      {isRTL ? location.nameAr || location.name : location.name}
                    </CardTitle>
                    {location.address && (
                      <CardDescription className="text-muted-foreground text-sm mt-1">
                        {location.address}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={location.isActive ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-500/20 text-muted-foreground'}>
                    {location.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {(location.description || location.descriptionAr) && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {isRTL ? location.descriptionAr || location.description : location.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                  <span className="text-sm text-muted-foreground">
                    {isRTL ? `السعة: ${location.capacity} جلسة متزامنة` : `Capacity: ${location.capacity} concurrent sessions`}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingLocation(location)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleLocationActive(location)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      location.isActive 
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {location.isActive 
                      ? (isRTL ? 'تعطيل' : 'Deactivate') 
                      : (isRTL ? 'تفعيل' : 'Activate')
                    }
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {locations.length === 0 && (
            <Card className="bg-card/50 border-border col-span-full p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isRTL ? 'لا توجد مواقع' : 'No Locations'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isRTL 
                  ? 'أضف مواقع التدريب لبدء قبول الحجوزات'
                  : 'Add training locations to start accepting bookings'
                }
              </p>
              <Button onClick={() => setShowAddModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                {isRTL ? 'إضافة موقع' : 'Add Location'}
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة موقع جديد' : 'Add New Location'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isRTL 
                ? 'أضف موقع تدريب جديد للأكاديمية'
                : 'Add a new training location for the academy'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                <Input
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="Main Field"
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                <Input
                  value={newLocation.nameAr}
                  onChange={(e) => setNewLocation({ ...newLocation, nameAr: e.target.value })}
                  placeholder="الملعب الرئيسي"
                  className="bg-muted border-border"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <Label>{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
              <Textarea
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                placeholder="Full-size grass field with professional lighting"
                className="bg-muted border-border"
              />
            </div>

            <div>
              <Label>{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
              <Textarea
                value={newLocation.descriptionAr}
                onChange={(e) => setNewLocation({ ...newLocation, descriptionAr: e.target.value })}
                placeholder="ملعب عشبي كامل الحجم مع إضاءة احترافية"
                className="bg-muted border-border"
                dir="rtl"
              />
            </div>

            <div>
              <Label>{isRTL ? 'العنوان' : 'Address'}</Label>
              <Input
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                placeholder="Future Stars Academy, New Cairo"
                className="bg-muted border-border"
              />
            </div>

            <div>
              <Label>{isRTL ? 'السعة (جلسات متزامنة)' : 'Capacity (concurrent sessions)'}</Label>
              <Input
                type="number"
                value={newLocation.capacity}
                onChange={(e) => setNewLocation({ ...newLocation, capacity: parseInt(e.target.value) || 1 })}
                min={1}
                className="bg-muted border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL 
                  ? 'عدد الجلسات التي يمكن إجراؤها في نفس الوقت'
                  : 'Number of sessions that can run at the same time'
                }
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddLocation}
              disabled={createLocationMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {createLocationMutation.isPending 
                ? (isRTL ? 'جاري الإضافة...' : 'Adding...') 
                : (isRTL ? 'إضافة' : 'Add Location')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل الموقع' : 'Edit Location'}</DialogTitle>
          </DialogHeader>
          
          {editingLocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input
                    value={editingLocation.name}
                    onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                    className="bg-muted border-border"
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    value={editingLocation.nameAr || ''}
                    onChange={(e) => setEditingLocation({ ...editingLocation, nameAr: e.target.value })}
                    className="bg-muted border-border"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <Label>{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Textarea
                  value={editingLocation.description || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>

              <div>
                <Label>{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Textarea
                  value={editingLocation.descriptionAr || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, descriptionAr: e.target.value })}
                  className="bg-muted border-border"
                  dir="rtl"
                />
              </div>

              <div>
                <Label>{isRTL ? 'العنوان' : 'Address'}</Label>
                <Input
                  value={editingLocation.address || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                  className="bg-muted border-border"
                />
              </div>

              <div>
                <Label>{isRTL ? 'السعة' : 'Capacity'}</Label>
                <Input
                  type="number"
                  value={editingLocation.capacity}
                  onChange={(e) => setEditingLocation({ ...editingLocation, capacity: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="bg-muted border-border"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'نشط' : 'Active'}</Label>
                <Switch
                  checked={editingLocation.isActive}
                  onCheckedChange={(checked) => setEditingLocation({ ...editingLocation, isActive: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLocation(null)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleUpdateLocation}
              disabled={updateLocationMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {updateLocationMutation.isPending 
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                : (isRTL ? 'حفظ التغييرات' : 'Save Changes')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
