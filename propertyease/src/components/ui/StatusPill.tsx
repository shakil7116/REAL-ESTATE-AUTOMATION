'use client';
/**
 * StatusPill — domain-status pill with tone derived from status keyword.
 * Use for entity status (lease, property, ticket, payment, campaign).
 * Keeps the tone-mapping logic in one place.
 */
import Badge from './Badge';
import type { BadgeTone } from './Badge';

export type StatusKind = 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const KIND_TONE: Record<StatusKind, BadgeTone> = {
  active:   'emerald',
  success:  'emerald',
  inactive: 'slate',
  neutral:  'slate',
  pending:  'amber',
  warning:  'amber',
  danger:   'rose',
  info:     'sky',
};

/** Auto-derive a kind from a raw status string. */
export function deriveStatusKind(status: string): StatusKind {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'completed' || s === 'received' || s === 'occupied' || s === 'healthy' || s === 'approved' || s === 'converted') return 'active';
  if (s === 'inactive' || s === 'cancelled' || s === 'expired' || s === 'terminated' || s === 'vacant') return 'inactive';
  if (s === 'pending' || s === 'pending_renewal' || s === 'waiting_parts' || s === 'paused' || s === 'in_progress' || s === 'contacted' || s === 'attention') return 'pending';
  if (s === 'open' || s === 'overdue' || s === 'urgent' || s === 'maintenance' || s === 'new') return 'warning';
  if (s === 'failed' || s === 'rejected' || s === 'bounced') return 'danger';
  return 'neutral';
}

/** Pretty-print a status: "under_renovation" → "Under Renovation". */
export function prettyStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export interface StatusPillProps {
  status: string;
  className?: string;
}

export default function StatusPill({ status, className }: StatusPillProps) {
  const kind = deriveStatusKind(status);
  return (
    <Badge tone={KIND_TONE[kind]} className={className}>
      {prettyStatus(status)}
    </Badge>
  );
}
