import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/useToast';

interface MonitoredService {
  name: string;
  status: 'up' | 'down';
}

interface HealthResponse {
  services: MonitoredService[];
}

const SERVICE_LABELS: Record<string, string> = {
  'loxecutivo-core': 'Core',
  'loxecutivo-auth': 'Autenticação',
  'loxecutivo-export': 'Exportação',
};

const POLL_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 5_000;

export default function ServiceHealthMonitor() {
  const location = useLocation();
  const notify = useToast();
  const previousDownServices = useRef<Set<string> | null>(null);
  const monitorUnavailable = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const onProtectedPage = location.pathname === '/dashboard' || location.pathname.startsWith('/cadastros/');
    if (!token || !onProtectedPage) return;

    let active = true;
    let inFlight = false;
    let controller: AbortController | undefined;

    const checkHealth = async () => {
      if (inFlight || !active) return;
      inFlight = true;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch('/monitor/services', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const data = await response.json() as HealthResponse;
        if (!Array.isArray(data.services)) throw new Error('Resposta inválida do monitor de serviços.');
        if (!active) return;

        if (monitorUnavailable.current) {
          notify('Conexão com o monitoramento restabelecida.', 'success');
          monitorUnavailable.current = false;
        }

        const downServices = new Set(
          data.services.filter((service) => service.status === 'down').map((service) => service.name),
        );
        const previous = previousDownServices.current;

        const newlyDown = [...downServices].filter((name) => !previous?.has(name));
        if (newlyDown.length > 0) {
          const labels = newlyDown.map((name) => SERVICE_LABELS[name] ?? name).join(', ');
          notify(`Sem conexão com: ${labels}.`, 'error');
        }

        if (previous) {
          const recovered = [...previous].filter((name) => !downServices.has(name));
          if (recovered.length > 0) {
            const labels = recovered.map((name) => SERVICE_LABELS[name] ?? name).join(', ');
            notify(`Conexão restabelecida com: ${labels}.`, 'success');
          }
        }

        previousDownServices.current = downServices;
      } catch {
        if (active && !monitorUnavailable.current) {
          notify('Não foi possível consultar a saúde dos serviços.', 'error');
          monitorUnavailable.current = true;
        }
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
      }
    };

    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, [location.pathname, notify]);

  return null;
}
