import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, CheckCircle } from 'lucide-react';
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
import { cardService } from '@/services';
import type { CardResponse } from '@/types/banking';

const issueCardSchema = z.object({
  card_id: z.string().min(1, 'Card ID is required'),
  account_id: z.string().min(1, 'Account ID is required'),
  card_number: z.string().min(16, 'Valid card number required').max(16),
  card_type: z.string().min(1, 'Card type is required'),
  status: z.string().min(1, 'Status is required'),
  daily_limit: z.number().min(0, 'Daily limit must be positive'),
  daily_used: z.number().min(0, 'Daily used must be positive'),
  issued_at: z.string().min(1, 'Issue date is required'),
});

const validateCardSchema = z.object({
  card_id: z.string().min(1, 'Card ID is required'),
  card_number: z.string().min(16, 'Valid card number required').max(16),
  amount: z.number().optional(),
});

type IssueCardFormData = z.infer<typeof issueCardSchema>;
type ValidateCardFormData = z.infer<typeof validateCardSchema>;

export default function CardsPage() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastCard, setLastCard] = useState<CardResponse | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  const issueForm = useForm<IssueCardFormData>({
    resolver: zodResolver(issueCardSchema),
    defaultValues: {
      status: 'ACTIVE',
      daily_limit: 50000,
      daily_used: 0,
      issued_at: new Date().toISOString().split('T')[0],
    },
  });

  const validateForm = useForm<ValidateCardFormData>({
    resolver: zodResolver(validateCardSchema),
  });

  const onIssueCard = async (data: IssueCardFormData) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await cardService.issueCard({
        card_id: data.card_id,
        account_id: data.account_id,
        card_number: data.card_number,
        card_type: data.card_type,
        status: data.status,
        daily_limit: data.daily_limit,
        daily_used: data.daily_used,
        issued_at: data.issued_at,
      });
      setLastCard(response);
      setAlert({ type: 'success', message: `Card ${response.card_id} issued successfully!` });
      issueForm.reset();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to issue card';
      setAlert({ type: 'error', message: typeof message === 'string' ? message : JSON.stringify(message) });
    } finally {
      setLoading(false);
    }
  };

  const onValidateCard = async (data: ValidateCardFormData) => {
  setLoading(true);
  setAlert(null);
  setValidationResult(null);

  try {
    const result: any = await cardService.validateCard({
      card_id: data.card_id,
      card_number: data.card_number,
      amount: data.amount,
    });

    const normalizedResult = {
  valid: true, // ✅ API returned 200 → success
  message:
    result.message ||
    result.reason ||
    result.detail ||
    "Card validated successfully",
};

    setValidationResult(normalizedResult); // ✅ success only
  } catch (error) {
    setAlert({
      type: "error",
      message: "Card validation failed",
    });
  } finally {
    setLoading(false);
  }
};

  const cardTypes = ['DEBIT', 'CREDIT', 'PREPAID', 'VIRTUAL'];
  const cardStatuses = ['ACTIVE', 'BLOCKED', 'EXPIRED', 'PENDING'];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-up">
        <PageHeader 
          title="Card Management" 
          description="Issue and validate banking cards"
        />

        {alert && (
          <AlertBanner 
            type={alert.type} 
            title={alert.type === 'success' ? 'Success' : 'Error'} 
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Tabs defaultValue="issue" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="issue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4 mr-2" />
              Issue Card
            </TabsTrigger>
            <TabsTrigger value="validate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issue">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/20">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Issue New Card</h3>
                  <p className="text-sm text-muted-foreground">Create a new debit or credit card</p>
                </div>
              </div>

              <form onSubmit={issueForm.handleSubmit(onIssueCard)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="card_id">Card ID *</Label>
                    <Input 
                      id="card_id" 
                      {...issueForm.register('card_id')} 
                      placeholder="CARD-001"
                      className="input-banking"
                    />
                    {issueForm.formState.errors.card_id && (
                      <p className="text-xs text-destructive">{issueForm.formState.errors.card_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_id">Account ID *</Label>
                    <Input 
                      id="account_id" 
                      {...issueForm.register('account_id')} 
                      placeholder="ACC-001"
                      className="input-banking"
                    />
                    {issueForm.formState.errors.account_id && (
                      <p className="text-xs text-destructive">{issueForm.formState.errors.account_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card_number">Card Number *</Label>
                    <Input 
                      id="card_number" 
                      {...issueForm.register('card_number')} 
                      placeholder="4532123456789012"
                      maxLength={16}
                      className="input-banking font-mono"
                    />
                    {issueForm.formState.errors.card_number && (
                      <p className="text-xs text-destructive">{issueForm.formState.errors.card_number.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card_type">Card Type *</Label>
                    <Select onValueChange={(value) => issueForm.setValue('card_type', value)}>
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {issueForm.formState.errors.card_type && (
                      <p className="text-xs text-destructive">{issueForm.formState.errors.card_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select 
                      onValueChange={(value) => issueForm.setValue('status', value)} 
                      defaultValue="ACTIVE"
                    >
                      <SelectTrigger className="input-banking">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily_limit">Daily Limit *</Label>
                    <Input 
                      id="daily_limit" 
                      type="number"
                      {...issueForm.register('daily_limit', { valueAsNumber: true })} 
                      placeholder="50000"
                      className="input-banking"
                    />
                    {issueForm.formState.errors.daily_limit && (
                      <p className="text-xs text-destructive">{issueForm.formState.errors.daily_limit.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daily_used">Daily Used</Label>
                    <Input 
                      id="daily_used" 
                      type="number"
                      {...issueForm.register('daily_used', { valueAsNumber: true })} 
                      placeholder="0"
                      className="input-banking"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issued_at">Issue Date *</Label>
                    <Input 
                      id="issued_at" 
                      type="date"
                      {...issueForm.register('issued_at')} 
                      className="input-banking"
                    />
                    {issueForm.formState.errors.issued_at && (
                      <p className="text-xs text-destructive">{issueForm.formState.errors.issued_at.message}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Issue Card
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="validate">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-success/20">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Validate Card</h3>
                  <p className="text-sm text-muted-foreground">Check card validity and limits</p>
                </div>
              </div>

              <form onSubmit={validateForm.handleSubmit(onValidateCard)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="validate_card_id">Card ID *</Label>
                    <Input 
                      id="validate_card_id" 
                      {...validateForm.register('card_id')} 
                      placeholder="CARD-001"
                      className="input-banking"
                    />
                    {validateForm.formState.errors.card_id && (
                      <p className="text-xs text-destructive">{validateForm.formState.errors.card_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validate_card_number">Card Number *</Label>
                    <Input 
                      id="validate_card_number" 
                      {...validateForm.register('card_number')} 
                      placeholder="4532123456789012"
                      maxLength={16}
                      className="input-banking font-mono"
                    />
                    {validateForm.formState.errors.card_number && (
                      <p className="text-xs text-destructive">{validateForm.formState.errors.card_number.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validate_amount">Amount (Optional)</Label>
                    <Input 
                      id="validate_amount" 
                      type="number"
                      step="0.01"
                      {...validateForm.register('amount', { valueAsNumber: true })} 
                      placeholder="1000"
                      className="input-banking"
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-success hover:bg-success/90" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Validate Card
                </Button>
              </form>

              {validationResult && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  validationResult.valid 
                    ? 'bg-success/10 border-success/20' 
                    : 'bg-destructive/10 border-destructive/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={validationResult.valid ? 'success' : 'danger'}>
                      {validationResult.valid ? 'VALID' : 'INVALID'}
                    </StatusBadge>
                    <span className="text-sm">{validationResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Last Issued Card */}
        {lastCard && (
          <div className="glass-card p-6 animate-scale-in">
            <h3 className="text-lg font-semibold mb-4">Last Issued Card</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Card ID</p>
                <p className="font-mono font-medium">{lastCard.card_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Card Number</p>
                <p className="font-mono">****{lastCard.card_number.slice(-4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <StatusBadge status="info">{lastCard.card_type}</StatusBadge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={lastCard.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {lastCard.status}
                </StatusBadge>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
