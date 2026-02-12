import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Landmark, PlayCircle } from 'lucide-react';
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
import { loanService } from '@/services';
import type { LoanResponse, EMIProcessResponse } from '@/types/banking';

const loanSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  branch_id: z.string().min(1, 'Branch ID is required'),
  account_id: z.string().min(1, 'Account ID is required'),
  loan_type: z.string().min(1, 'Loan type is required'),
  principal_amount: z.number().min(1000, 'Minimum loan amount is ₹1000'),
  interest_rate: z.number().min(0.01, 'Interest rate is required').max(50),
  tenure_months: z.number().min(1, 'Minimum tenure is 1 month').max(360),
  start_date: z.string().min(1, 'Start date is required'),
});

type LoanFormData = z.infer<typeof loanSchema>;

export default function LoansPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastLoan, setLastLoan] = useState<LoanResponse | null>(null);
  const [emiResult, setEmiResult] = useState<EMIProcessResponse | null>(null);
  const [minOverdueDays, setMinOverdueDays] = useState(1);
  const [overdueData, setOverdueData] = useState<any[]>([]);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      interest_rate: 10.5,
      tenure_months: 12,
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  const onCreateLoan = async (data: LoanFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await loanService.createLoan({
        customer_id: data.customer_id,
        branch_id: data.branch_id,
        account_id: data.account_id,
        loan_type: data.loan_type,
        principal_amount: data.principal_amount,
        interest_rate: data.interest_rate,
        tenure_months: data.tenure_months,
        start_date: data.start_date,
      });
      setLastLoan(response);
      setAlert({ type: 'success', message: `Loan ${response.loan_id} created successfully!` });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create loan';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onProcessEMI = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const result = await loanService.processEMI();
setEmiResult(result);

setAlert({
  type: 'success',
  message: `EMI processing completed! Processed ${result.processed_emis} EMI(s)`
});


    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'EMI processing failed';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const loanTypes = ['HOME', 'PERSONAL', 'VEHICLE', 'EDUCATION', 'BUSINESS', 'GOLD', 'AGRICULTURE'];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Loan Management" 
          description="Create loans and process EMI payments"
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
              <Landmark className="h-4 w-4 mr-2" />
              Create Loan
            </TabsTrigger>
            <TabsTrigger value="emi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PlayCircle className="h-4 w-4 mr-2" />
              Process EMI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Landmark className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Create New Loan</h3>
                  <p className="text-sm text-muted-foreground">Disburse a new loan to customer</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onCreateLoan)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <Label htmlFor="loan_type">Loan Type *</Label>
                    <Select onValueChange={(value) => setValue('loan_type', value)}>
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                      <SelectContent>
                        {loanTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.loan_type && <p className="text-xs text-destructive">{errors.loan_type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principal_amount">Principal Amount *</Label>
                    <Input 
                      id="principal_amount" 
                      type="number"
                      {...register('principal_amount', { valueAsNumber: true })} 
                      placeholder="100000"
                      className="input-banking"
                    />
                    {errors.principal_amount && <p className="text-xs text-destructive">{errors.principal_amount.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                    <Input 
                      id="interest_rate" 
                      type="number"
                      step="0.01"
                      {...register('interest_rate', { valueAsNumber: true })} 
                      placeholder="10.5"
                      className="input-banking"
                    />
                    {errors.interest_rate && <p className="text-xs text-destructive">{errors.interest_rate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenure_months">Tenure (Months) *</Label>
                    <Input 
                      id="tenure_months" 
                      type="number"
                      {...register('tenure_months', { valueAsNumber: true })} 
                      placeholder="12"
                      className="input-banking"
                    />
                    {errors.tenure_months && <p className="text-xs text-destructive">{errors.tenure_months.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input 
                      id="start_date" 
                      type="date"
                      {...register('start_date')} 
                      className="input-banking"
                    />
                    {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
                  </div>
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Landmark className="h-4 w-4 mr-2" />}
                  Create Loan
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="emi">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-success/20">
                  <PlayCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Process EMI</h3>
                  <p className="text-sm text-muted-foreground">Trigger EMI processing for all due loans</p>
                </div>
              </div>


              <div className="p-6 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-muted-foreground mb-4">
                  This will process EMI payments for all loans that have due installments.
                </p>
                <Button onClick={onProcessEMI} className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                  Process All EMIs
                </Button>
              </div>

              {emiResult && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-success font-medium">
                      Processed {emiResult.processed_emis} loan(s)
                    </p>
                  </div>
                  {emiResult.details.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="table-banking">
                        <thead>
                          <tr>
                            <th>Customer ID</th>
                            <th>Loan ID</th>
                            <th>EMI No</th>
                            <th>Due Date</th>
                            <th>EMI Amount</th>
                            <th>Status</th>

                          </tr>
                        </thead>
                        <tbody>
                          {emiResult.details.map((result) => (
                            <tr key={`${result.loan_id}-${result.emi_number}`}>
                    <td className="font-mono">{result.customer_id}</td>
                    <td className="font-mono">{result.loan_id}</td>
                    <td>{result.emi_number}</td>
                    <td>{result.due_date}</td>
                    <td>₹{result.emi_amount?.toLocaleString('en-IN')}</td>
                    <td>
                      <StatusBadge status={result.status === 'PAID' ? 'success' : 'danger'}>
                        {result.status}
                      </StatusBadge>
                    </td>
                  </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="glass-card p-6 mt-8">
  <h3 className="text-lg font-semibold mb-4">Overdue EMIs</h3>

  <div className="flex gap-4 items-center mb-6">
    <Input
      type="number"
      min={1}
      value={minOverdueDays}
      onChange={(e) => setMinOverdueDays(Number(e.target.value))}
      placeholder="Min overdue days"
      className="input-banking w-48"
    />

    <Button
      onClick={async () => {
        const res = await loanService.getOverdueEMIs(minOverdueDays);
        setOverdueData(res.overdues);
      }}
      className="btn-gold"
    >
      Check Overdues
    </Button>
  </div>

  {overdueData.length > 0 && (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th>Customer ID</th>
            <th>Loan ID</th>
            <th>EMI No</th>
            <th>Due Date</th>
            <th>Overdue Days</th>
            <th>EMI Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {overdueData.map((emi) => (
            <tr key={`${emi.loan_id}-${emi.emi_number}`} className="border-b">
              <td>{emi.customer_id}</td>
              <td>{emi.loan_id}</td>
              <td>{emi.emi_number}</td>
              <td>{emi.due_date}</td>
              <td className="text-danger font-semibold">{emi.overdue_days}</td>
              <td>₹{emi.emi_amount.toLocaleString('en-IN')}</td>
              <td>
                <StatusBadge status="danger">OVERDUE</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

            </div>
          </TabsContent>
        </Tabs>

        

        {/* Last Created Loan */}
        {lastLoan && (
  <div className="glass-card p-6 animate-scale-in">
    <h3 className="text-lg font-semibold mb-4">Last Created Loan</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Loan ID</p>
        <p className="font-mono font-medium">{lastLoan.loan_id}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Status</p>
        <StatusBadge status="success">{lastLoan.loan_status}</StatusBadge>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">EMI Amount</p>
        <p className="font-bold text-success">
          ₹{lastLoan.emi_amount.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  </div>
)}

      </div>
    </MainLayout>
  );
}
