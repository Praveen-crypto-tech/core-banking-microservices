import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Search, RefreshCw } from 'lucide-react';
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
import { accountService } from '@/services';
import type { AccountCreate, AccountResponse, AccountBalance, AccountType } from '@/types/banking';

const accountSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  account_type: z.enum(['CURRENT', 'SAVINGS', 'HIGH-YIELD SAVINGS', 'MONEY MARKET', 'CDs']),
  balance: z.number().min(0, 'Balance must be positive'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountsPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchId, setSearchId] = useState('');
  const [accountData, setAccountData] = useState<AccountResponse | null>(null);
  const [balanceData, setBalanceData] = useState<AccountBalance | null>(null);
  const [updateAmount, setUpdateAmount] = useState('');

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      account_type: 'SAVINGS',
      balance: 0,
    },
  });

  const onCreateAccount = async (data: AccountFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await accountService.createAccount(data as AccountCreate);
      setAlert({ type: 'success', message: `Account ${response.account_id} created successfully!` });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create account';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onSearchAccount = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setAlert(null);
    setAccountData(null);
    setBalanceData(null);
    try {
      const data = await accountService.getAccount(searchId);
      setAccountData(data);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Account not found';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onGetBalance = async (accountId: string) => {
    setLoading(true);
    try {
      const balance = await accountService.getBalance(accountId);
      setBalanceData(balance);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to get balance';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateBalance = async (accountId: string) => {
    if (!updateAmount) return;
    setLoading(true);
    setAlert(null);
    try {
      await accountService.updateBalance(accountId, parseFloat(updateAmount));
      setAlert({ type: 'success', message: 'Balance updated successfully!' });
      // Refresh account data
      const data = await accountService.getAccount(accountId);
      setAccountData(data);
      setUpdateAmount('');
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update balance';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Account Management" 
          description="Create and manage bank accounts"
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
              <Wallet className="h-4 w-4 mr-2" />
              Create Account
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Search className="h-4 w-4 mr-2" />
              Search & Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6">Create New Account</h3>
              <form onSubmit={handleSubmit(onCreateAccount)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <Label htmlFor="account_type">Account Type *</Label>
                    <Select onValueChange={(value: AccountType) => setValue('account_type', value)} defaultValue="SAVINGS">
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="CURRENT">Current</SelectItem>
                        <SelectItem value="HIGH-YIELD SAVINGS">High-Yield Savings</SelectItem>
                        <SelectItem value="MONEY MARKET">Money Market</SelectItem>
                        <SelectItem value="CDs">CDs</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.account_type && <p className="text-xs text-destructive">{errors.account_type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balance">Initial Balance *</Label>
                    <Input 
                      id="balance" 
                      type="number"
                      step="0.01"
                      {...register('balance', { valueAsNumber: true })} 
                      placeholder="10000"
                      className="input-banking"
                    />
                    {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
                  </div>
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                  Create Account
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Search Account</h3>
                <div className="flex gap-4">
                  <Input 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Account ID"
                    className="input-banking flex-1"
                  />
                  <Button onClick={onSearchAccount} disabled={loading} className="btn-gold">
                    {loading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>
              </div>

              {accountData && (
                <div className="glass-card p-6 animate-scale-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Account Details</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onGetBalance(accountData.account_id)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Balance
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Account ID</p>
                      <p className="font-mono font-medium">{accountData.account_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Customer ID</p>
                      <p className="font-mono">{accountData.customer_id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Account Type</p>
                      <StatusBadge status="info">{accountData.account_type}</StatusBadge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{(balanceData?.balance ?? accountData.balance).toLocaleString('en-IN')}
                      </p>
                    </div>
                    {accountData.status && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <StatusBadge status={accountData.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {accountData.status}
                        </StatusBadge>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="font-medium mb-3">Update Balance</h4>
                    <div className="flex gap-4">
                      <Input 
                        type="number"
                        step="0.01"
                        value={updateAmount}
                        onChange={(e) => setUpdateAmount(e.target.value)}
                        placeholder="Enter new balance amount"
                        className="input-banking flex-1"
                      />
                      <Button 
                        onClick={() => onUpdateBalance(accountData.account_id)}
                        disabled={loading || !updateAmount}
                        className="btn-gold"
                      >
                        {loading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="ml-2">Update</span>
                      </Button>
                    </div>
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
