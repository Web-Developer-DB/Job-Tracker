import type { ApplicationStatus } from '../types';

// Jede Status-Art bekommt eine feste Farbe, damit sie überall gleich aussieht.
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Entwurf: '#94a3b8',
  Beworben: '#2563eb',
  Interview: '#0ea5a4',
  Angebot: '#16a34a',
  Abgelehnt: '#dc2626',
  Zurückgezogen: '#64748b'
};

// Hilfsfunktion: aus einer Hex-Farbe eine RGBA-Farbe mit Transparenz bauen.
const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Kleine Komponente, die den Status als farbige „Pille“ anzeigt.
export const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const color = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
      style={{
        color,
        borderColor: hexToRgba(color, 0.38),
        backgroundColor: hexToRgba(color, 0.14)
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
};
