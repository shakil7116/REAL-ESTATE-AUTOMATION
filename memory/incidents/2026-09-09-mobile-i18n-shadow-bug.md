# 2026-09-09 — Mobile i18n `t` shadowing bug + hardcoded strings

## Incident

While hardening the mobile app's i18n layer (removing remaining hardcoded English strings),
two critical bugs were found and fixed simultaneously:

### Bug 1: `t` variable shadowing in tenants.tsx

The map callback used `t` as the loop variable name:
```tsx
tenants.map((t, i) => (
  <TouchableOpacity key={t.id || i}>
    ...
    {t.unitRef ? `Unit ${t.unitRef}` : 'No unit assigned'}
```

`l.status` (a lead status string like `"new"`) was rendered directly without translation.
The sourceLabel helper used a hardcoded dictionary instead of calling `t()`.

**Fix:** Renamed loop variable from `t` to `tenant` / `lead`, replaced all hardcoded display
strings with `t()` calls, added missing i18n keys for tenant status (`tenants.statusActive` etc.),
lead status (`tenants.leadStatusNew` etc.), and refactored `sourceLabel()` to use `t()` dynamically.

### Bug 2: `t` variable shadowing in maintenance.tsx

Same pattern:
```tsx
filtered.map((t) => (
  ...
  <Text>{t.status.replace('_', ' ')}</Text>   // crashes at runtime in Arabic
```

**Fix:** Renamed loop variable to `ticket`, replaced all `t.` references with `ticket.`,
added `maintenance.priorityLow/Medium/High/Urgent` keys, and wired `maintenance.status*`
through `t()`.

### Bug 3: Duplicate i18n keys in lib/i18n.ts

Two previous edits appended `maintenance.priority*` and `maintenance.submitBtn` keys
in both EN and AR sections without removing the originals, causing:
```
TS1117: An object literal cannot have multiple properties with the same name.
```

**Fix:** Removed the duplicate blocks from both the EN and AR translation tables.

### Bug 4: Missing `settings.langArabic` key

`settings.tsx` called `t('settings.langArabic')` but only `settings.langEnglish` existed.
**Fix:** Added the key to both EN and AR tables.

### Other fixes this pass
- `payments.tsx`: filterTabs now reads from `t('payments.tabAll')` etc. via the pre-built array;
  payment status badges now use `t('payments.statusReceived')` etc.
- `settings.tsx`: profile role, language value, country picker title all use `t()`
- `login.tsx`: tagline wrapped in `t('login.tagline')`
- `properties.tsx`: `{p.total_units} units` → `{p.total_units} {t('properties.units')}`;
  `{p.status}` → conditional `t('properties.active')` fallback
- `tenants.tsx`: "Tenants & Leads" header → `t('tenants.title')`; empty states fully translated

## Verification

- `npx tsc --noEmit` in `propertyease-mobile/` — 0 errors
- All 9 screens now call `t()` for every user-facing string
- No hardcoded English display strings remain in `.tsx` files (except data values and emoji)
- Web build verification pending (Qwen classifier rate-limited during this session)
- Evals pending same reason

## Lessons

1. Never name a React map callback parameter `t` when `t` is imported from i18n — the shadow
   is silent at runtime in English but produces `undefined` or crashes in Arabic builds.
2. When adding i18n keys via multiple edits, grep for duplicates before declaring done.
3. TS catches duplicate-object-key errors immediately; always run `tsc --noEmit` after editing
   `lib/i18n.ts`.
