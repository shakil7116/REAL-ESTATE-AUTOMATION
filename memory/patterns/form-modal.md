# Pattern: Form Modal
# ────────────────────
# The standard way to do create/edit forms in a modal in PropertyEase.

## Problem
We need a consistent UX for create/edit forms across 8 entities
(Property, Unit, Tenant, Lease, Payment, MaintenanceTask, Lead, Campaign).
Each has the same shape: trigger button → modal with form → submit →
close modal → refresh data.

## When to Use
- ✅ Create any entity (Property, Unit, Tenant, Lease, etc.)
- ✅ Edit any entity
- ✅ Form has 3–10 fields
- ✅ Form submit is a server action or API call

**Don't use when:**
- Form has > 10 fields (use a full page instead)
- Form needs multi-step wizard (use a dedicated step component)
- Form is read-only (use a detail modal, not a form modal)

## Implementation

### 1. Trigger

```tsx
<Button onClick={() => setOpen(true)}>{t('addProperty')}</Button>
```

### 2. Modal with Form

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, t('nameRequired')),
  address: z.string().min(1),
  city: z.string().min(1),
  // ...
});

type FormData = z.infer<typeof schema>;

export function AddPropertyModal({ open, onOpenChange, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '', city: 'Doha' },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error);
    toast.success(t('propertyCreated'));
    reset();
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addProperty')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          {/* ... more fields ... */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('loading') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Rules

- Always `reset()` on success
- Always use the standard error envelope (`{ ok, data, error }`)
- Always show toast on success/error
- Always close modal on success
- All labels via `t()` from `i18n.ts`
- RTL-safe layout (test with `dir="rtl"`)

## Anti-Patterns
- ❌ Don't put the form inline in the page — use a modal or full page
- ❌ Don't use uncontrolled inputs with refs — use `react-hook-form`
- ❌ Don't write your own validation — use zod
- ❌ Don't skip the i18n keys — add them in both `en` and `ar` sections

## Examples in the Codebase
- `propertyease/src/components/modals/AddPropertyModal.tsx`
- `propertyease/src/components/modals/AddUnitModal.tsx`
- `propertyease/src/components/modals/AddTenantModal.tsx`
