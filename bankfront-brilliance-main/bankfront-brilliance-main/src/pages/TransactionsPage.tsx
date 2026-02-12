import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { AlertBanner } from '@/components/ui/alert-banner';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { transactionService } from '@/services';
import type { TransactionResponse } from '@/types/banking';

const debitCreditSchema = z.object({
  account_id: z.string().min(1, 'Account ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  channel: z.string().min(1, 'Channel is required'),
});

const transferSchema = z.object({
  from_account_id: z.string().min(1, 'From Account ID is required'),
  to_account_id: z.string().min(1, 'To Account ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  channel: z.string().min(1, 'Channel is required'),
});

type DebitCreditFormData = z.infer<typeof debitCreditSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

export default function TransactionsPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastTransaction, setLastTransaction] = useState<TransactionResponse | null>(null);

  const debitForm = useForm<DebitCreditFormData>({
    resolver: zodResolver(debitCreditSchema),
  });

  const creditForm = useForm<DebitCreditFormData>({
    resolver: zodResolver(debitCreditSchema),
  });

  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const onDebit = async (data: DebitCreditFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await transactionService.debit({
        account_id: data.account_id,
        amount: data.amount,
        channel: data.channel,
      });
      setLastTransaction(response);
      setAlert({ type: 'success', message: `Debit transaction successful! ID: ${response.transaction_id}` });
      debitForm.reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Debit failed';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onCredit = async (data: DebitCreditFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await transactionService.credit({
        account_id: data.account_id,
        amount: data.amount,
        channel: data.channel,
      });
      setLastTransaction(response);
      setAlert({ type: 'success', message: `Credit transaction successful! ID: ${response.transaction_id}` });
      creditForm.reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Credit failed';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onTransfer = async (data: TransferFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await transactionService.transfer({
        from_account_id: data.from_account_id,
        to_account_id: data.to_account_id,
        amount: data.amount,
        channel: data.channel,
      });
      setLastTransaction(response);
      setAlert({ type: 'success', message: `Transfer successful! ID: ${response.transaction_id}` });
      transferForm.reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Transfer failed';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const channels = ['UPI', 'NEFT', 'IMPS', 'RTGS', 'BRANCH', 'ATM', 'MOBILE', 'INTERNET'];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Transactions" 
          description="Process debit, credit, and fund transfer transactions"
        />

        {alert && (
          <AlertBanner 
            type={alert.type} 
            title={alert.type === 'success' ? 'Success' : 'Error'} 
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Tabs defaultValue="debit" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="debit" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Debit
            </TabsTrigger>
            <TabsTrigger value="credit" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Credit
            </TabsTrigger>
            <TabsTrigger value="transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="debit">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-destructive/20">
                  <ArrowUpRight className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Debit Transaction</h3>
                  <p className="text-sm text-muted-foreground">Withdraw funds from an account</p>
                </div>
              </div>
              <form onSubmit={debitForm.handleSubmit(onDebit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="debit_account_id">Account ID *</Label>
                    <Input 
                      id="debit_account_id" 
                      {...debitForm.register('account_id')} 
                      placeholder="ACC-001"
                      className="input-banking"
                    />
                    {debitForm.formState.errors.account_id && (
                      <p className="text-xs text-destructive">{debitForm.formState.errors.account_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="debit_amount">Amount *</Label>
                    <Input 
                      id="debit_amount" 
                      type="number"
                      step="0.01"
                      {...debitForm.register('amount', { valueAsNumber: true })} 
                      placeholder="1000"
                      className="input-banking"
                    />
                    {debitForm.formState.errors.amount && (
                      <p className="text-xs text-destructive">{debitForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="debit_channel">Channel *</Label>
                    <select 
                      id="debit_channel"
                      {...debitForm.register('channel')}
                      className="input-banking w-full"
                    >
                      <option value="">Select channel</option>
                      {channels.map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                    {debitForm.formState.errors.channel && (
                      <p className="text-xs text-destructive">{debitForm.formState.errors.channel.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="bg-destructive hover:bg-destructive/90" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
                  Process Debit
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="credit">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-success/20">
                  <ArrowDownLeft className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Credit Transaction</h3>
                  <p className="text-sm text-muted-foreground">Deposit funds to an account</p>
                </div>
              </div>
              <form onSubmit={creditForm.handleSubmit(onCredit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="credit_account_id">Account ID *</Label>
                    <Input 
                      id="credit_account_id" 
                      {...creditForm.register('account_id')} 
                      placeholder="ACC-001"
                      className="input-banking"
                    />
                    {creditForm.formState.errors.account_id && (
                      <p className="text-xs text-destructive">{creditForm.formState.errors.account_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credit_amount">Amount *</Label>
                    <Input 
                      id="credit_amount" 
                      type="number"
                      step="0.01"
                      {...creditForm.register('amount', { valueAsNumber: true })} 
                      placeholder="1000"
                      className="input-banking"
                    />
                    {creditForm.formState.errors.amount && (
                      <p className="text-xs text-destructive">{creditForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credit_channel">Channel *</Label>
                    <select 
                      id="credit_channel"
                      {...creditForm.register('channel')}
                      className="input-banking w-full"
                    >
                      <option value="">Select channel</option>
                      {channels.map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                    {creditForm.formState.errors.channel && (
                      <p className="text-xs text-destructive">{creditForm.formState.errors.channel.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="bg-success hover:bg-success/90" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <ArrowDownLeft className="h-4 w-4 mr-2" />}
                  Process Credit
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="transfer">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/20">
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Fund Transfer</h3>
                  <p className="text-sm text-muted-foreground">Transfer funds between accounts</p>
                </div>
              </div>
              <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="from_account_id">From Account ID *</Label>
                    <Input 
                      id="from_account_id" 
                      {...transferForm.register('from_account_id')} 
                      placeholder="ACC-001"
                      className="input-banking"
                    />
                    {transferForm.formState.errors.from_account_id && (
                      <p className="text-xs text-destructive">{transferForm.formState.errors.from_account_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to_account_id">To Account ID *</Label>
                    <Input 
                      id="to_account_id" 
                      {...transferForm.register('to_account_id')} 
                      placeholder="ACC-002"
                      className="input-banking"
                    />
                    {transferForm.formState.errors.to_account_id && (
                      <p className="text-xs text-destructive">{transferForm.formState.errors.to_account_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer_amount">Amount *</Label>
                    <Input 
                      id="transfer_amount" 
                      type="number"
                      step="0.01"
                      {...transferForm.register('amount', { valueAsNumber: true })} 
                      placeholder="1000"
                      className="input-banking"
                    />
                    {transferForm.formState.errors.amount && (
                      <p className="text-xs text-destructive">{transferForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer_channel">Channel *</Label>
                    <select 
                      id="transfer_channel"
                      {...transferForm.register('channel')}
                      className="input-banking w-full"
                    >
                      <option value="">Select channel</option>
                      {channels.map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                    {transferForm.formState.errors.channel && (
                      <p className="text-xs text-destructive">{transferForm.formState.errors.channel.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <ArrowLeftRight className="h-4 w-4 mr-2" />}
                  Process Transfer
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>

        {/* Last Transaction */}
        {lastTransaction && (
          <div className="glass-card p-6 animate-scale-in">
            <h3 className="text-lg font-semibold mb-4">Last Transaction</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="font-mono font-medium">{lastTransaction.transaction_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{lastTransaction.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-bold text-primary">₹{lastTransaction.amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium text-success">{lastTransaction.status}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
