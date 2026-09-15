# Contract: i18n Keys
# ────────────────────
# Version: 1.0.0
# Status: Accepted
# Last updated: 2026-08-26
# Owner: @frontend-eng
# Reviewers: @product-owner, @qa-tester

## Purpose

Every user-facing string in the PropertyEase UI must be:
1. Stored in `propertyease/src/lib/i18n.ts` (single source of truth)
2. Available in both English (`en`) and Arabic (`ar`)
3. Arabic copy is MSA-grade, not literal translation
4. Accessible via the `t(key, locale)` function

## How to add a new key

### 1. Decide the key name

Use `camelCase` for the key. Group related keys by prefix:

- `add*` — for "Add X" buttons (`addProperty`, `addUnit`)
- `*Required` — for validation messages
- `*Created`, `*Updated`, `*Deleted` — for success toasts
- `*Error`, `*Failed` — for error toasts

### 2. Add to BOTH `en` and `ar` blocks

```typescript
// propertyease/src/lib/i18n.ts
export const translations = {
  en: {
    // ...
    addProperty: 'Add Property',  // ← add here
  },
  ar: {
    // ...
    addProperty: 'إضافة عقار',    // ← and here
  },
} as const;
```

The TypeScript compiler will fail if you add to only one block (because
`TranslationKey = keyof typeof translations.en` and the blocks are
typed as `Record<TranslationKey, string>`).

### 3. Use it in the component

```tsx
import { t } from '@/lib/i18n';

<Button>{t('addProperty', locale)}</Button>
```

The `locale` comes from the `CountryContext` (or `useLocale()` hook).

## RTL handling

Some strings need different translations in RTL contexts:

- **Icons with directional meaning** (e.g., back arrow): use `rtl:` Tailwind
  variants to flip, don't change the translation
- **Punctuation:** Arabic uses Arabic comma `،` and question mark `؟`
- **Numbers:** always Western Arabic numerals (0–9), not Eastern (٠–٩),
  except in user-typed phone numbers
- **Directional text** like "Next →" or "← Back" should be mirrored in RTL

## Placeholders

Placeholders for form inputs are a separate concern. Add them with a
`*Placeholder` suffix:

```typescript
en: { companyNamePlaceholder: 'e.g. Al Mansouri Properties' },
ar: { companyNamePlaceholder: 'مثال: عقارات المنصوري' },
```

## Plurals (v2)

v1 has no plural forms. We use singular even when the count > 1
(e.g., "5 property" instead of "5 properties"). This is intentional —
it keeps the i18n file simple and MSA Arabic doesn't have the same
plural inflection rules as English.

If we need proper plurals in v2, we'll migrate to `Intl.PluralRules`
+ `i18next`. Not now.

## Currency formatting

Currency is handled by the `formatCurrency()` helper, NOT by i18n keys.
See `propertyease/src/lib/format.ts` (to be created).

```typescript
formatCurrency(1234, 'QAR', locale)  // "QAR 1,234.00" or "١٬٢٣٤٫٠٠ ر.ق"
```

## Forbidden

- ❌ Hard-coded English strings in components
- ❌ Hard-coded Arabic strings in components
- ❌ Inline `t('...' + dynamicVar + '...')` — i18n keys are static
- ❌ Adding a key to only one language block
- ❌ Using `string.replace()` to interpolate — use placeholder props

## Tests

- ✅ `t('addProperty', 'en')` returns `"Add Property"`
- ✅ `t('addProperty', 'ar')` returns `"إضافة عقار"`
- ✅ `t('nonexistent', 'en')` returns the key itself (fallback)
- ✅ All RTL pages render without broken layout
- ✅ Every new component has a snapshot test in `__tests__/`

## Lint rule (to add)

```javascript
// .eslintrc.js
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: "JSXText[value=/^[A-Z][a-z]+ [a-z]+/]",
      message: "Hard-coded English string in JSX. Use t() from i18n.ts instead."
    }
  ]
}
```

## Changelog

- **1.0.0** (2026-08-26) — Initial contract
