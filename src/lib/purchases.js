// ResumeForge AI — Purchases / RevenueCat wrapper
//
// NOTE: react-native-purchases (RevenueCat's SDK) is a native module and
// cannot run inside Expo Go. This file is a mock that mirrors the real API
// exactly. In Phase 9 (EAS Build / production), swap the mock functions below
// for the real Purchases SDK calls — the rest of the app stays unchanged.
//
// To swap in the real SDK (Phase 9):
//   1. npx expo install react-native-purchases
//   2. Replace the mock functions below with real Purchases calls
//   3. Add your RevenueCat API key initialization

// ─── MOCK IMPLEMENTATION (Expo Go compatible) ───────────────────────────────

// Simulates whether the current user has an active Pro subscription.
// In production this calls Purchases.getCustomerInfo() from RevenueCat.
export async function getSubscriptionStatus() {
  // Always returns false in Expo Go — user is always on free tier during dev
  return {
    isPro: false,
    activeSubscription: null,
  };
}

// Simulates purchasing a subscription package.
// In production this calls Purchases.purchasePackage(package).
export async function purchaseSubscription(packageId) {
  // In Expo Go, just simulate a successful purchase for UI testing
  console.log(`[Purchases Mock] Would purchase: ${packageId}`);
  return { success: true, mock: true };
}

// Simulates restoring previous purchases (required by Apple + Google).
// In production this calls Purchases.restorePurchases().
export async function restorePurchases() {
  console.log('[Purchases Mock] Would restore purchases');
  return { isPro: false, mock: true };
}

// Available subscription packages — update prices before launch
export const PACKAGES = [
  {
    id: 'pro_monthly',
    label: 'Pro Monthly',
    price: '$9.99',
    period: 'per month',
    description: 'Unlimited tailored resumes & cover letters',
    highlighted: false,
  },
  {
    id: 'pro_annual',
    label: 'Pro Annual',
    price: '$59.99',
    period: 'per year',
    description: 'Save 50% — best value',
    highlighted: true,
  },
];
