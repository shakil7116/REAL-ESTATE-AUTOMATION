// ==========================================
// GLOBAL APP STATE — Zustand Store
// ==========================================
// Central reactive state that powers cross-page
// data synchronization without Redux/Zustand complexity.
// Every page that imports this store auto-subscribes
// to changes → triggers re-renders everywhere.
// ==========================================

import { create } from 'zustand';
import { toast } from 'react-hot-toast';

export type MutationType =
  | 'property_created' | 'property_updated' | 'property_deleted'
  | 'unit_created' | 'unit_updated' | 'unit_status_changed'
  | 'tenant_created' | 'tenant_updated'
  | 'lease_created' | 'lease_updated'
  | 'payment_received' | 'payment_recorded'
  | 'ticket_created' | 'ticket_updated'
  | 'campaign_created'
  | 'lead_created' | 'lead_updated'
  | 'settings_updated' | 'account_deleted' | 'data_cleared';

export interface AppState {
  lastMutation: MutationType | null;
  lastMutationAt: number;
  toastQueue: Array<{ id: string; message: string; type: 'success' | 'error' }>;

  // Action dispatch — called after any successful API mutation
  notify: (type: MutationType, message: string) => void;

  // Generic invalidation for cross-page reactivity
  invalidate: (entity: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  lastMutation: null,
  lastMutationAt: 0,
  toastQueue: [],

  notify: (type, message) =>
    set({ lastMutation: type, lastMutationAt: Date.now() }),

  invalidate: (entity) =>
    set((s) => ({
      toastQueue: [
        ...s.toastQueue,
        {
          id: `${entity}_${Date.now()}`,
          message: `🔄 ${entity} data refreshed across all views`,
          type: 'success',
        },
      ],
    })),
}));

/**
 * Call this AFTER a successful API write to trigger:
 *  1. Zustand state update (causes cross-component reactivity)
 *  2. Toast notification (visual confirmation for demo)
 *  3. Cross-page broadcast via custom event (fallback for non-Zustand consumers)
 */
export function notifyChange(
  type: MutationType,
  message: string,
): void {
  try { useAppStore.getState().notify(type, message); } catch { /* store unavailable on SSR */ }
  try { toast.success(message, { duration: 3500, style: { fontSize: '13px', fontWeight: '600' } }); } catch { /* toast not mounted */ }
  // SSR guard — window doesn't exist during server rendering / build
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('propertyease:mutation', {
        detail: { type, message, timestamp: Date.now() },
      }));
    } catch { /* ignore */ }
  }
}
