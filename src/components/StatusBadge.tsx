import type { ApplicationStatus } from '../types';

// Jede Status-Art bekommt eine feste Farbe, damit sie überall gleich aussieht.
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Entwurf: '#93a4c2',
  Beworben: '#5aa0ff',
  Interview: '#7ac7f5',
  Angebot: '#6fdc8f',
  Abgelehnt: '#ff7272',
  Zurückgezogen: '#8b95a9'
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
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-soft backdrop-blur-sm"
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
