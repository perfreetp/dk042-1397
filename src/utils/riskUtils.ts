import type { LifePart, RiskLevel } from "@/types";

export function computeRiskLevel(part: LifePart): RiskLevel {
  const cycleRatio = part.totalCycles > 0 ? part.remainingCycles / part.totalCycles : 1;

  if (cycleRatio <= 0.05 || part.remainingDays <= 15) {
    return "CRITICAL";
  }
  if (cycleRatio <= 0.15 || part.remainingDays <= 30) {
    return "WARNING";
  }
  if (cycleRatio <= 0.30 || part.remainingDays <= 60) {
    return "CAUTION";
  }
  return "NORMAL";
}

export const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  WARNING: 1,
  CAUTION: 2,
  NORMAL: 3,
};

export function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case "CRITICAL":
      return "#c53030";
    case "WARNING":
      return "#e86a2c";
    case "CAUTION":
      return "#d69e2e";
    default:
      return "#2e7d52";
  }
}

export function riskBgClass(risk: RiskLevel): string {
  switch (risk) {
    case "CRITICAL":
      return "bg-alert-critical/10 text-alert-critical border-alert-critical/30";
    case "WARNING":
      return "bg-alert-warning/10 text-alert-warning border-alert-warning/30";
    case "CAUTION":
      return "bg-alert-caution/10 text-alert-caution border-alert-caution/30";
    default:
      return "bg-alert-safe/10 text-alert-safe border-alert-safe/30";
  }
}

export function riskBarClass(risk: RiskLevel): string {
  switch (risk) {
    case "CRITICAL":
      return "bg-alert-critical animate-pulse-fast";
    case "WARNING":
      return "bg-alert-warning animate-pulse-slow";
    case "CAUTION":
      return "bg-alert-caution";
    default:
      return "bg-alert-safe";
  }
}
