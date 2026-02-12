import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export function AlertBanner({ type, title, message, onClose, className }: AlertBannerProps) {
  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-success/10 border-success/20',
      text: 'text-success',
    },
    error: {
      icon: XCircle,
      bg: 'bg-destructive/10 border-destructive/20',
      text: 'text-destructive',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-warning/10 border-warning/20',
      text: 'text-warning',
    },
    info: {
      icon: Info,
      bg: 'bg-info/10 border-info/20',
      text: 'text-info',
    },
  };

  const { icon: Icon, bg, text } = config[type];

  return (
    <div className={cn("rounded-lg border p-4", bg, className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", text)} />
        <div className="flex-1">
          <p className={cn("font-medium", text)}>{title}</p>
          {message && <p className="text-sm text-muted-foreground mt-1">{message}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
