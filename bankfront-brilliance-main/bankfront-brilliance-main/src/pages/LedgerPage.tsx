import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/ui/page-header';
import { AlertBanner } from '@/components/ui/alert-banner';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ledgerService } from '@/services';
import type { LedgerResponse } from '@/types/banking';
import type { LedgerRecordResponse } from '@/types/banking';

const ledgerSchema = z.object({
  reference_id: z.string().min(1, 'Reference ID is required'),
  debit_account_id: z.string().min(1, 'Debit Account ID is required'),
  credit_account_id: z.string().min(1, 'Credit Account ID is required'),
  debit_customer_id: z.string().min(1, 'Debit Customer ID is required'),
  credit_customer_id: z.string().min(1, 'Credit Customer ID is required'),
  debit_branch_id: z.string().min(1, 'Debit Branch ID is required'),
  credit_branch_id: z.string().min(1, 'Credit Branch ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  narration: z.string().min(1, 'Narration is required'),
});

type LedgerFormData = z.infer<typeof ledgerSchema>;

export default function LedgerPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
type LastLedgerEntry = {
  ledger_id: number;
  reference_id: string;
  amount: number;
  narration: string;
};

const [lastEntry, setLastEntry] = useState<LastLedgerEntry | null>(null);
  useEffect(() => {
  const fetchLastLedger = async () => {
    try {
      const data = await ledgerService.getLastLedger();

      // 🔒 DO NOT overwrite valid state with null/empty
      if (data && data.ledger_id) {
        setLastEntry(data);
      }
    } catch (e) {
      // silent fail
    }
  };

  fetchLastLedger();
}, []);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LedgerFormData>({
    resolver: zodResolver(ledgerSchema),
  });

  const onRecordLedger = async (data: LedgerFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await ledgerService.recordLedger({
        reference_id: data.reference_id,
        debit_account_id: data.debit_account_id,
        credit_account_id: data.credit_account_id,
        debit_customer_id: data.debit_customer_id,
        credit_customer_id: data.credit_customer_id,
        debit_branch_id: data.debit_branch_id,
        credit_branch_id: data.credit_branch_id,
        amount: data.amount,
        narration: data.narration,
      });
      setLastEntry(response);
      setAlert({ type: 'success', message: `Ledger entry recorded! ID: ${response.ledger_id}` });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to record ledger entry';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Ledger Management" 
          description="Record double-entry ledger transactions"
        />

        {alert && (
          <AlertBanner 
            type={alert.type} 
            title={alert.type === 'success' ? 'Success' : 'Error'} 
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Record Ledger Entry</h3>
              <p className="text-sm text-muted-foreground">Create double-entry accounting record</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onRecordLedger)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reference_id">Reference ID *</Label>
                <Input 
                  id="reference_id" 
                  {...register('reference_id')} 
                  placeholder="REF-001"
                  className="input-banking"
                />
                {errors.reference_id && <p className="text-xs text-destructive">{errors.reference_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input 
                  id="amount" 
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })} 
                  placeholder="10000"
                  className="input-banking"
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="narration">Narration *</Label>
                <Textarea 
                  id="narration" 
                  {...register('narration')} 
                  placeholder="Fund transfer between accounts"
                  className="input-banking min-h-[80px]"
                />
                {errors.narration && <p className="text-xs text-destructive">{errors.narration.message}</p>}
              </div>
            </div>

            {/* Debit Side */}
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-medium text-destructive mb-4">Debit Side</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="debit_account_id">Account ID *</Label>
                  <Input 
                    id="debit_account_id" 
                    {...register('debit_account_id')} 
                    placeholder="ACC-001"
                    className="input-banking"
                  />
                  {errors.debit_account_id && <p className="text-xs text-destructive">{errors.debit_account_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="debit_customer_id">Customer ID *</Label>
                  <Input 
                    id="debit_customer_id" 
                    {...register('debit_customer_id')} 
                    placeholder="CIF-001"
                    className="input-banking"
                  />
                  {errors.debit_customer_id && <p className="text-xs text-destructive">{errors.debit_customer_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="debit_branch_id">Branch ID *</Label>
                  <Input 
                    id="debit_branch_id" 
                    {...register('debit_branch_id')} 
                    placeholder="BR-001"
                    className="input-banking"
                  />
                  {errors.debit_branch_id && <p className="text-xs text-destructive">{errors.debit_branch_id.message}</p>}
                </div>
              </div>
            </div>

            {/* Credit Side */}
            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
              <h4 className="font-medium text-success mb-4">Credit Side</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credit_account_id">Account ID *</Label>
                  <Input 
                    id="credit_account_id" 
                    {...register('credit_account_id')} 
                    placeholder="ACC-002"
                    className="input-banking"
                  />
                  {errors.credit_account_id && <p className="text-xs text-destructive">{errors.credit_account_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_customer_id">Customer ID *</Label>
                  <Input 
                    id="credit_customer_id" 
                    {...register('credit_customer_id')} 
                    placeholder="CIF-002"
                    className="input-banking"
                  />
                  {errors.credit_customer_id && <p className="text-xs text-destructive">{errors.credit_customer_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_branch_id">Branch ID *</Label>
                  <Input 
                    id="credit_branch_id" 
                    {...register('credit_branch_id')} 
                    placeholder="BR-002"
                    className="input-banking"
                  />
                  {errors.credit_branch_id && <p className="text-xs text-destructive">{errors.credit_branch_id.message}</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="btn-gold" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
              Record Ledger Entry
            </Button>
          </form>
        </div>

        {/* Last Entry */}
        {lastEntry && (
          <div className="glass-card p-6 animate-scale-in">
            <h3 className="text-lg font-semibold mb-4">Last Ledger Entry</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Ledger ID</p>
                <p className="font-mono font-medium">{lastEntry.ledger_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reference ID</p>
                <p className="font-mono">{lastEntry.reference_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-bold text-primary">
  ₹{lastEntry.amount
    ? lastEntry.amount.toLocaleString('en-IN')
    : '0'}
</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Narration</p>
                <p className="text-sm">{lastEntry.narration}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
