import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, AlertTriangle, MessageSquare } from 'lucide-react';
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
import { fraudService } from '@/services';
import type { FraudAlert } from '@/types/banking';

const fraudCheckSchema = z.object({
  transaction_id: z.coerce.number(),
  account_id: z.coerce.number(),
  branch_id: z.coerce.number(),
  amount: z.coerce.number(),
  channel: z.string().min(1),
});

const feedbackSchema = z.object({
  alert_id: z.coerce.number(),
  feedback_type: z.string().min(1),
  feedback_date: z.string().min(1),
});

type FraudCheckFormData = z.infer<typeof fraudCheckSchema>;
type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function FraudPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fraudResult, setFraudResult] = useState<FraudAlert | null>(null);

  const checkForm = useForm<FraudCheckFormData>({
    resolver: zodResolver(fraudCheckSchema),
  });

  const feedbackForm = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback_date: new Date().toISOString().split('T')[0],
    },
  });

  const onCheckFraud = async (data: FraudCheckFormData) => {
    setLoading(true);
    setAlert(null);
    setFraudResult(null);
    try {
      const result = await fraudService.checkFraud({
  transaction_id: data.transaction_id,
  account_id: data.account_id,
  branch_id: data.branch_id, // ✅ REQUIRED FIX
  amount: data.amount,
  channel: data.channel,
});
      setFraudResult(result);
      if (result.fraud_flag) {
        setAlert({ type: 'error', message: `⚠️ FRAUD DETECTED! Risk Score: ${result.risk_score}` });
      } else {
        setAlert({ type: 'success', message: `Transaction is safe. Risk Score: ${result.risk_score}` });
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Fraud check failed';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onAttachFeedback = async (data: FeedbackFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      await fraudService.attachFeedback({
        alert_id: data.alert_id,
        feedback_type: data.feedback_type,
        feedback_date: data.feedback_date,
      });
      setAlert({ type: 'success', message: 'Feedback attached successfully!' });
      feedbackForm.reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to attach feedback';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const channels = ['UPI', 'NEFT', 'IMPS', 'RTGS', 'BRANCH', 'ATM', 'MOBILE', 'INTERNET'];
  const feedbackTypes = ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'UNDER_REVIEW', 'RESOLVED'];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Fraud Detection" 
          description="Check transactions for fraud and manage alerts"
        />

        {alert && (
          <AlertBanner 
            type={alert.type} 
            title={alert.type === 'success' ? 'Analysis Complete' : 'Alert'} 
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Tabs defaultValue="check" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="check" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4 mr-2" />
              Fraud Check
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              Attach Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="check">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-warning/20">
                  <Shield className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Fraud Check</h3>
                  <p className="text-sm text-muted-foreground">Analyze transaction for potential fraud</p>
                </div>
              </div>

              <form onSubmit={checkForm.handleSubmit(onCheckFraud)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="transaction_id">Transaction ID *</Label>
                    <Input 
                      id="transaction_id" 
                      {...checkForm.register('transaction_id')} 
                      placeholder="TXN-001"
                      className="input-banking"
                    />
                    {checkForm.formState.errors.transaction_id && (
                      <p className="text-xs text-destructive">{checkForm.formState.errors.transaction_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_id">Account ID *</Label>
                    <Input 
                      id="account_id" 
                      {...checkForm.register('account_id')} 
                      placeholder="ACC-001"
                      className="input-banking"
                    />
                    {checkForm.formState.errors.account_id && (
                      <p className="text-xs text-destructive">{checkForm.formState.errors.account_id.message}</p>
                    )}
                  </div>

                    <div className="space-y-2">
                    <Label htmlFor="branch_id">Branch ID *</Label>
                    <Input
                      id="branch_id"
                      {...checkForm.register('branch_id')}
                      placeholder="101"
                      className="input-banking"
                    />
                    {checkForm.formState.errors.branch_id && (
                      <p className="text-xs text-destructive">
                        Branch ID is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      step="0.01"
                      {...checkForm.register('amount', { valueAsNumber: true })} 
                      placeholder="10000"
                      className="input-banking"
                    />
                    {checkForm.formState.errors.amount && (
                      <p className="text-xs text-destructive">{checkForm.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel *</Label>
                    <select 
                      id="channel"
                      {...checkForm.register('channel')}
                      className="input-banking w-full"
                    >
                      <option value="">Select channel</option>
                      {channels.map(ch => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                    {checkForm.formState.errors.channel && (
                      <p className="text-xs text-destructive">{checkForm.formState.errors.channel.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                  Check for Fraud
                </Button>
              </form>
            </div>

            {/* Fraud Result */}
            {fraudResult && (
              <div className={`glass-card p-6 animate-scale-in mt-6 ${
                fraudResult.fraud_flag ? 'border-destructive' : 'border-success'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className={`h-8 w-8 ${
                    fraudResult.fraud_flag ? 'text-destructive' : 'text-success'
                  }`} />
                  <div>
                    <h3 className="text-lg font-semibold">Fraud Analysis Result</h3>
                    <StatusBadge status={fraudResult.fraud_flag ? 'danger' : 'success'}>
                      {fraudResult.fraud_flag ? 'FRAUD DETECTED' : 'SAFE'}
                    </StatusBadge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Alert ID</p>
                    <p className="font-mono font-medium">{fraudResult.alert_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="font-mono">{fraudResult.transaction_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className={`text-2xl font-bold ${
                      fraudResult.risk_score > 70 ? 'text-destructive' : 
                      fraudResult.risk_score > 40 ? 'text-warning' : 'text-success'
                    }`}>
                      {fraudResult.risk_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fraud Flag</p>
                    <StatusBadge status={fraudResult.fraud_flag ? 'danger' : 'success'}>
                      {fraudResult.fraud_flag ? 'YES' : 'NO'}
                    </StatusBadge>
                  </div>
                  {fraudResult.reason && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="text-sm">{fraudResult.reason}</p>
                    </div>
                  )}
                  {fraudResult.anomaly && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Anomaly</p>
                      <p className="text-sm">{fraudResult.anomaly}</p>
                    </div>
                  )}
                  {fraudResult.resolution_status && (
                    <div>
                      <p className="text-xs text-muted-foreground">Resolution Status</p>
                      <StatusBadge status={
                        fraudResult.resolution_status === 'RESOLVED' ? 'success' : 'warning'
                      }>
                        {fraudResult.resolution_status}
                      </StatusBadge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-info/20">
                  <MessageSquare className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Attach Feedback</h3>
                  <p className="text-sm text-muted-foreground">Add resolution feedback to fraud alerts</p>
                </div>
              </div>

              <form onSubmit={feedbackForm.handleSubmit(onAttachFeedback)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="alert_id">Alert ID *</Label>
                    <Input 
                      id="alert_id" 
                      {...feedbackForm.register('alert_id')} 
                      placeholder="ALERT-001"
                      className="input-banking"
                    />
                    {feedbackForm.formState.errors.alert_id && (
                      <p className="text-xs text-destructive">{feedbackForm.formState.errors.alert_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback_type">Feedback Type *</Label>
                    <Select onValueChange={(value) => feedbackForm.setValue('feedback_type', value)}>
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select feedback type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feedbackTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {feedbackForm.formState.errors.feedback_type && (
                      <p className="text-xs text-destructive">{feedbackForm.formState.errors.feedback_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback_date">Feedback Date *</Label>
                    <Input 
                      id="feedback_date" 
                      type="date"
                      {...feedbackForm.register('feedback_date')} 
                      className="input-banking"
                    />
                    {feedbackForm.formState.errors.feedback_date && (
                      <p className="text-xs text-destructive">{feedbackForm.formState.errors.feedback_date.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="bg-info hover:bg-info/90" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  Attach Feedback
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
