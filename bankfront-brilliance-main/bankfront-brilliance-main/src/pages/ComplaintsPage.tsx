import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Search, XCircle, List, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlertBanner } from '@/components/ui/alert-banner';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { complaintService } from '@/services';
import type { ComplaintResponse } from '@/types/banking';

const complaintSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  branch_id: z.string().min(1, 'Branch ID is required'),
  account_id: z.string().min(1, 'Account ID is required'),
  transaction_id: z.string().min(1, 'Transaction ID is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

export default function ComplaintsPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [searchId, setSearchId] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintResponse | null>(null);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
  });

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintService.listComplaints();
      setComplaints(data);
    } catch (error: any) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const onCreateComplaint = async (data: ComplaintFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await complaintService.createComplaint({
        customer_id: data.customer_id,
        branch_id: data.branch_id,
        account_id: data.account_id,
        transaction_id: data.transaction_id,
        category: data.category,
        description: data.description,
      });
      setAlert({ type: 'success', message: `Complaint ${response.complaint_id} created successfully!` });
      reset();
      loadComplaints();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create complaint';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onSearchComplaint = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setAlert(null);
    setSelectedComplaint(null);
    try {
      const data = await complaintService.getComplaint(searchId);
      setSelectedComplaint(data);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Complaint not found';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onCloseComplaint = async (complaintId: string) => {
    setLoading(true);
    setAlert(null);
    try {
      await complaintService.closeComplaint(complaintId);
      setAlert({ type: 'success', message: `Complaint ${complaintId} closed successfully!` });
      if (selectedComplaint?.complaint_id === complaintId) {
        const data = await complaintService.getComplaint(complaintId);
        setSelectedComplaint(data);
      }
      loadComplaints();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to close complaint';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'TRANSACTION_DISPUTE',
    'CARD_ISSUE',
    'ACCOUNT_ISSUE',
    'SERVICE_QUALITY',
    'FRAUD_REPORT',
    'LOAN_ISSUE',
    'OTHER'
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Complaint Management" 
          description="Create, track, and resolve customer complaints"
        />

        {alert && (
          <AlertBanner 
            type={alert.type} 
            title={alert.type === 'success' ? 'Success' : 'Error'} 
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="h-4 w-4 mr-2" />
              All Complaints
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Complaint
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">All Complaints</h3>
                <Button variant="outline" size="sm" onClick={loadComplaints} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
                </Button>
              </div>

              {complaints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No complaints found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-banking">
                    <thead>
                      <tr>
                        <th>Complaint ID</th>
                        <th>Customer</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => (
                        <tr key={complaint.complaint_id}>
                          <td className="font-mono">{complaint.complaint_id}</td>
                          <td className="font-mono">{complaint.customer_id}</td>
                          <td>
                            <StatusBadge status="info">
                              {complaint.category.replace(/_/g, ' ')}
                            </StatusBadge>
                          </td>
                          <td>
                            <StatusBadge status={
                              complaint.status === 'OPEN' ? 'warning' : 
                              complaint.status === 'CLOSED' ? 'success' : 'info'
                            }>
                              {complaint.status}
                            </StatusBadge>
                          </td>
                          <td className="text-sm text-muted-foreground">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            {complaint.status !== 'CLOSED' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onCloseComplaint(complaint.complaint_id)}
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Close
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Create New Complaint</h3>
                  <p className="text-sm text-muted-foreground">Register a customer complaint</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onCreateComplaint)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Customer ID *</Label>
                    <Input 
                      id="customer_id" 
                      {...register('customer_id')} 
                      placeholder="CIF-001"
                      className="input-banking"
                    />
                    {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch_id">Branch ID *</Label>
                    <Input 
                      id="branch_id" 
                      {...register('branch_id')} 
                      placeholder="BR-001"
                      className="input-banking"
                    />
                    {errors.branch_id && <p className="text-xs text-destructive">{errors.branch_id.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_id">Account ID *</Label>
                    <Input 
                      id="account_id" 
                      {...register('account_id')} 
                      placeholder="ACC-001"
                      className="input-banking"
                    />
                    {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction_id">Transaction ID *</Label>
                    <Input 
                      id="transaction_id" 
                      {...register('transaction_id')} 
                      placeholder="TXN-001"
                      className="input-banking"
                    />
                    {errors.transaction_id && <p className="text-xs text-destructive">{errors.transaction_id.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    {...register('description')} 
                    placeholder="Describe the complaint in detail..."
                    className="input-banking min-h-[120px]"
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Create Complaint
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Search Complaint</h3>
                <div className="flex gap-4">
                  <Input 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Complaint ID"
                    className="input-banking flex-1"
                  />
                  <Button onClick={onSearchComplaint} disabled={loading} className="btn-gold">
                    {loading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>
              </div>

              {selectedComplaint && (
                <div className="glass-card p-6 animate-scale-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Complaint Details</h3>
                    {selectedComplaint.status !== 'CLOSED' && (
                      <Button 
                        onClick={() => onCloseComplaint(selectedComplaint.complaint_id)}
                        disabled={loading}
                        className="bg-success hover:bg-success/90"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Complaint
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Complaint ID</p>
                      <p className="font-mono font-medium">{selectedComplaint.complaint_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Customer ID</p>
                      <p className="font-mono">{selectedComplaint.customer_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Branch ID</p>
                      <p className="font-mono">{selectedComplaint.branch_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Account ID</p>
                      <p className="font-mono">{selectedComplaint.account_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Transaction ID</p>
                      <p className="font-mono">{selectedComplaint.transaction_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Category</p>
                      <StatusBadge status="info">
                        {selectedComplaint.category.replace(/_/g, ' ')}
                      </StatusBadge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={
                        selectedComplaint.status === 'OPEN' ? 'warning' : 
                        selectedComplaint.status === 'CLOSED' ? 'success' : 'info'
                      }>
                        {selectedComplaint.status}
                      </StatusBadge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Created At</p>
                      <p>{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                    </div>
                    {selectedComplaint.closed_at && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Closed At</p>
                        <p>{new Date(selectedComplaint.closed_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{selectedComplaint.description}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
