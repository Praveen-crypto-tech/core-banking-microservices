import { 
  Users, 
  Wallet, 
  ArrowLeftRight, 
  CreditCard, 
  Landmark, 
  Shield, 
  FileText
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { useNavigate } from 'react-router-dom';

type DashboardOverview = {
  total_customers: number;
  active_accounts: number;
  todays_transactions: number;
  active_loans: number;
  cards_issued: number;
  fraud_alerts: number;
  open_complaints: number;
};

export default function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await axios.get(
          `${API_CONFIG.API_GATEWAY}/dashboard/overview`
        );
        setOverview(res.data);
      } catch (err) {
        console.error('Failed to load dashboard overview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-up">
        <PageHeader 
          title="Dashboard" 
          description="Enterprise Core Banking System Overview"
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Customers"
            value={overview ? overview.total_customers.toLocaleString() : '—'}
            subtitle="Active CIF records"
            icon={Users}
          />
          <KPICard
            title="Active Accounts"
            value={overview ? overview.active_accounts.toLocaleString() : '—'}
            subtitle="All account types"
            icon={Wallet}
          />
          <KPICard
            title="Today's Transactions"
            value={overview ? overview.todays_transactions.toLocaleString() : '—'}
            subtitle="Today's volume"
            icon={ArrowLeftRight}
          />
          <KPICard
            title="Active Loans"
            value={overview ? overview.active_loans.toLocaleString() : '—'}
            subtitle="Outstanding loans"
            icon={Landmark}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Cards Issued"
            value={overview ? overview.cards_issued.toLocaleString() : '—'}
            subtitle="Debit + Credit cards"
            icon={CreditCard}
          />
          <KPICard
            title="Fraud Alerts"
            value={overview ? overview.fraud_alerts.toString() : '—'}
            subtitle="Pending review"
            icon={Shield}
          />
          <KPICard
            title="Open Complaints"
            value={overview ? overview.open_complaints.toString() : '—'}
            subtitle="Active cases"
            icon={FileText}
          />
        </div>

        {/* Quick Actions & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'New Customer', icon: Users, path: '/customers', color: 'from-blue-500 to-blue-600' },
                { label: 'Open Account', icon: Wallet, path: '/accounts', color: 'from-green-500 to-green-600' },
                { label: 'Transfer Funds', icon: ArrowLeftRight, path: '/transactions', color: 'from-orange-500 to-orange-600' },
                { label: 'Issue Card', icon: CreditCard, path: '/cards', color: 'from-purple-500 to-purple-600' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-all hover-lift"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Status (UNCHANGED) */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              {[
                { service: 'Customer Service', port: 8000 },
                { service: 'Account Service', port: 8001 },
                { service: 'Transaction Service', port: 8002 },
                { service: 'Ledger Service', port: 8003 },
                { service: 'Card Service', port: 8004 },
                { service: 'Complaint Service', port: 8005 },
                { service: 'Loan Service', port: 8006 },
                { service: 'Fraud Service', port: 8007 },
              ].map((service) => (
                <div key={service.service} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_hsl(var(--success))]" />
                    <span className="text-sm">{service.service}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">:{service.port}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity (LEFT AS-IS ON PURPOSE) */}
        {/* You can make this live later without touching KPIs */}
      </div>
    </MainLayout>
  );
}
