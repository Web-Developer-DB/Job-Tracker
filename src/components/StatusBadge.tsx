import type { ApplicationStatus } from '../types';

// Jede Status-Art bekommt eine feste Farbe, damit sie überall gleich aussieht.
export type DisplayStatus = ApplicationStatus | 'Follow-up fällig';

export const STATUS_COLORS: Record<DisplayStatus, string> = {
  Entwurf: '#93a4c2',
  Beworben: '#5aa0ff',
  Interview: '#7ac7f5',
  Angebot: '#6fdc8f',
  Abgelehnt: '#ff7272',
  Zurückgezogen: '#8b95a9',
  'Follow-up fällig': '#f6b450'
};

export const getStatusColor = (status: DisplayStatus): string => STATUS_COLORS[status];

// Hilfsfunktion: aus einer Hex-Farbe eine RGBA-Farbe mit Transparenz bauen.
export const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Kleine Komponente, die den Status als farbige „Pille“ anzeigt.
export const StatusBadge = ({ status }: { status: DisplayStatus }) => {
  const color = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex min-h-7 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide shadow-soft backdrop-blur-sm"
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
