// Operational Formatters for Transportation Telemetry

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatWeightKg(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} t`;
  }
  return `${Math.round(kg)} kg`;
}

export function formatWeightQuintals(quintals: number): string {
  return `${quintals.toFixed(1)} qtl`;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
  }
  return `${Math.round(minutes)} min`;
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatSpeedKmh(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

export function formatPowerKw(kw: number): string {
  return `${Math.round(kw)} kW`;
}

export function formatTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHrs === 1) return "1 hour ago";
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

