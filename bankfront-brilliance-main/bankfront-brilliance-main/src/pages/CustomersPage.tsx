import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlertBanner } from '@/components/ui/alert-banner';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { customerService } from '@/services';
import type { CustomerCreate, CustomerResponse, CustomerStatus } from '@/types/banking';

const customerSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  full_name: z.string().min(1, 'Full name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  email: z.string().email('Valid email required'),
  pan: z.string().min(10, 'Valid PAN required').max(10),
  aadhaar: z.string().min(12, 'Valid Aadhaar required').max(12),
  branch_id: z.string().min(1, 'Branch ID is required'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(5, 'Pincode required'),
  country: z.string().min(1, 'Country required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchId, setSearchId] = useState('');
  const [customerData, setCustomerData] = useState<CustomerResponse | null>(null);
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus | null>(null);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      risk_level: 'LOW',
    },
  });

  const onCreateCustomer = async (data: CustomerFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await customerService.createCustomer(data as CustomerCreate);
      setAlert({ type: 'success', message: `Customer ${response.customer_id} created successfully!` });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create customer';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onSearchCustomer = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setAlert(null);
    setCustomerData(null);
    setCustomerStatus(null);
    try {
      const data = await customerService.getCustomer(searchId);
      setCustomerData(data);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Customer not found';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyKYC = async (customerId: string) => {
    setLoading(true);
    setAlert(null);
    try {
      await customerService.verifyKYC(customerId);
      setAlert({ type: 'success', message: `KYC verified for customer ${customerId}` });
      // Refresh customer data
      const data = await customerService.getCustomer(customerId);
      setCustomerData(data);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'KYC verification failed';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onGetStatus = async (customerId: string) => {
    setLoading(true);
    try {
      const status = await customerService.getCustomerStatus(customerId);
      setCustomerStatus(status);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get status';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Customer Management" 
          description="Create, search, and manage customer CIF records"
        />

        {alert && (
          <AlertBanner 
            type={alert.type} 
            title={alert.type === 'success' ? 'Success' : 'Error'} 
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Customer
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Search className="h-4 w-4 mr-2" />
              Search & Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6">Create New Customer</h3>
              <form onSubmit={handleSubmit(onCreateCustomer)} className="space-y-6">
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
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input 
                      id="full_name" 
                      {...register('full_name')} 
                      placeholder="John Doe"
                      className="input-banking"
                    />
                    {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input 
                      id="dob" 
                      type="date"
                      {...register('dob')} 
                      className="input-banking"
                    />
                    {errors.dob && <p className="text-xs text-destructive">{errors.dob.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select onValueChange={(value) => setValue('gender', value)}>
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">MALE</SelectItem>
                        <SelectItem value="FEMALE">FEMALE</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile *</Label>
                    <Input 
                      id="mobile" 
                      {...register('mobile')} 
                      placeholder="9876543210"
                      className="input-banking"
                    />
                    {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email"
                      {...register('email')} 
                      placeholder="john@example.com"
                      className="input-banking"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  {/* ---------------- ADDRESS FIELDS (NEW) ---------------- */}

<div className="space-y-2 lg:col-span-3">
  <Label htmlFor="address_line1">Address Line 1 *</Label>
  <Input
    id="address_line1"
    {...register('address_line1')}
    placeholder="House No, Street Name"
    className="input-banking"
  />
  {errors.address_line1 && (
    <p className="text-xs text-destructive">{errors.address_line1.message}</p>
  )}
</div>

<div className="space-y-2 lg:col-span-3">
  <Label htmlFor="address_line2">Address Line 2</Label>
  <Input
    id="address_line2"
    {...register('address_line2')}
    placeholder="Area / Landmark (Optional)"
    className="input-banking"
  />
</div>

<div className="space-y-2">
  <Label htmlFor="city">City *</Label>
  <Input
    id="city"
    {...register('city')}
    placeholder="City"
    className="input-banking"
  />
  {errors.city && (
    <p className="text-xs text-destructive">{errors.city.message}</p>
  )}
</div>

<div className="space-y-2">
  <Label htmlFor="state">State *</Label>
  <Input
    id="state"
    {...register('state')}
    placeholder="State"
    className="input-banking"
  />
  {errors.state && (
    <p className="text-xs text-destructive">{errors.state.message}</p>
  )}
</div>

<div className="space-y-2">
  <Label htmlFor="pincode">Pincode *</Label>
  <Input
    id="pincode"
    {...register('pincode')}
    placeholder="600001"
    className="input-banking"
  />
  {errors.pincode && (
    <p className="text-xs text-destructive">{errors.pincode.message}</p>
  )}
</div>

<div className="space-y-2">
  <Label htmlFor="country">Country *</Label>
  <Input
    id="country"
    {...register('country')}
    placeholder="India"
    className="input-banking"
  />
  {errors.country && (
    <p className="text-xs text-destructive">{errors.country.message}</p>
  )}
</div>


                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN *</Label>
                    <Input 
                      id="pan" 
                      {...register('pan')} 
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="input-banking uppercase"
                    />
                    {errors.pan && <p className="text-xs text-destructive">{errors.pan.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadhaar">Aadhaar *</Label>
                    <Input 
                      id="aadhaar" 
                      {...register('aadhaar')} 
                      placeholder="123456789012"
                      maxLength={12}
                      className="input-banking"
                    />
                    {errors.aadhaar && <p className="text-xs text-destructive">{errors.aadhaar.message}</p>}
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
                    <Label htmlFor="risk_level">Risk Level *</Label>
                    <Select onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setValue('risk_level', value)} defaultValue="LOW">
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">LOW</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.risk_level && <p className="text-xs text-destructive">{errors.risk_level.message}</p>}
                  </div>
                  
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create Customer
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Search Customer</h3>
                <div className="flex gap-4">
                  <Input 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Customer ID (e.g., CIF-001)"
                    className="input-banking flex-1"
                  />
                  <Button onClick={onSearchCustomer} disabled={loading} className="btn-gold">
                    {loading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>
              </div>

              {customerData && (
                <div className="glass-card p-6 animate-scale-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Customer Details</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onGetStatus(customerData.customer_id)}
                        disabled={loading}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Get Status
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => onVerifyKYC(customerData.customer_id)}
                        disabled={loading}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify KYC
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Customer ID</p>
                      <p className="font-mono font-medium">{customerData.customer_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Full Name</p>
                      <p className="font-medium">{customerData.full_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p>{customerData.dob}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p>{customerData.gender}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p>{customerData.mobile}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p>{customerData.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">PAN</p>
                      <p className="font-mono">{customerData.pan}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Aadhaar</p>
                      <p className="font-mono">{customerData.aadhaar}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Branch ID</p>
                      <p className="font-mono">{customerData.branch_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Risk Level</p>
                      <StatusBadge status={
                        customerData.risk_level === 'LOW' ? 'success' : 
                        customerData.risk_level === 'MEDIUM' ? 'warning' : 'danger'
                      }>
                        {customerData.risk_level}
                      </StatusBadge>
                    </div>
                    {customerData.kyc_verified !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">KYC Status</p>
                        <StatusBadge status={customerData.kyc_verified ? 'success' : 'warning'}>
                          {customerData.kyc_verified ? 'Verified' : 'Pending'}
                        </StatusBadge>
                      </div>
                    )}
                    {/* ---------------- ADDRESS DETAILS ---------------- */}
                  {customerData.address_line1 && (
                    <div className="lg:col-span-3 space-y-1 mt-4">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {customerData.address_line1}
                        {customerData.address_line2 && `, ${customerData.address_line2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customerData.city}, {customerData.state} - {customerData.pincode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customerData.country}
                      </p>
                    </div>
                  )}
                  </div>

                  {customerStatus && (
                    <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2">Customer Status</h4>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <StatusBadge status={customerStatus.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {customerStatus.status}
                          </StatusBadge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">KYC</p>
                          <StatusBadge status={customerStatus.kyc_verified ? 'success' : 'warning'}>
                            {customerStatus.kyc_verified ? 'Verified' : 'Pending'}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
