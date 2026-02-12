import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { API_CONFIG, SERVICE_NAMES } from '@/config/api';

interface ServiceStatus {
  url: string;
  name: string;
  status: 'online' | 'offline' | 'checking';
}

export function TopBar() {
  const [services, setServices] = useState<ServiceStatus[]>(
    Object.entries(API_CONFIG).map(([key, url]) => ({
      url,
      name: key.replace('_SERVICE', '').replace(/_/g, ' '),
      status: 'checking' as const,
    }))
  );

  useEffect(() => {
  const checkServices = async () => {
    const entries = Object.entries(API_CONFIG);

    const updated = await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(`${url}/health`, {
            method: "GET",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          return {
            url,
            name: key.replace("_SERVICE", "").replace(/_/g, " "),
            status: res.ok ? "online" : "offline",
          } as ServiceStatus;
        } catch {
          return {
            url,
            name: key.replace("_SERVICE", "").replace(/_/g, " "),
            status: "offline",
          } as ServiceStatus;
        }
      })
    );

    setServices(updated);
  };

  checkServices();
  const interval = setInterval(checkServices, 30000);
  return () => clearInterval(interval);
}, []);


  const onlineCount = services.filter(s => s.status === 'online').length;
  const totalCount = services.length;

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left: Service Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Services</span>
          </div>
          <div className="flex items-center gap-1">
            {services.map((service) => (
              <div
                key={service.url}
                className="group relative"
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    service.status === 'online'
                      ? 'bg-success shadow-[0_0_8px_hsl(var(--success))]'
                      : service.status === 'offline'
                      ? 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]'
                      : 'bg-muted-foreground animate-pulse'
                  }`}
                />
                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="glass-card px-2 py-1 whitespace-nowrap">
                    <p className="text-xs font-medium">{service.name}</p>
                    <p className={`text-xs ${
                      service.status === 'online' ? 'text-success' : 
                      service.status === 'offline' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {service.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {onlineCount}/{totalCount} online
          </span>
        </div>

        {/* Right: Status Summary */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            onlineCount === totalCount 
              ? 'bg-success/10 text-success border border-success/20' 
              : onlineCount > 0 
              ? 'bg-warning/10 text-warning border border-warning/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {onlineCount === totalCount ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                All Systems Operational
              </>
            ) : onlineCount > 0 ? (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                Partial Outage
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                Services Offline
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
