// ResumeForge AI — Purchases / RevenueCat wrapper
//
// Currently a mock — safe to run in Expo Go and EAS development builds.
//
// When ready to run the EAS production build (Step 6 of Phase 9):
//   1. Run: npx expo install react-native-purchases
//   2. Swap the mock functions below for the real SDK (see HANDOFF.md)

// ─── MOCK IMPLEMENTATION ────────────────────────────────────────────────────

export async function initPurchases() {
  // no-op until real SDK is installed
}

export async function identifyUser(userId) {
  // no-op until real SDK is installed
}

export async function resetUser() {
  // no-op until real SDK is installed
}

export async function getSubscriptionStatus() {
  return { isPro: false, activeSubscription: null };
}

export async function purchaseSubscription(packageId) {
  console.log(`[Purchases Mock] Would purchase: ${packageId}`);
  return { success: true, mock: true };
}

export async function restorePurchases() {
  return { isPro: false, mock: true };
}

export const PACKAGES = [
  {
    id: 'pro_monthly',
    label: 'Pro Monthly',
    price: '$12.99',
    period: 'per month',
    description: 'Unlimited tailored resumes & cover letters',
    highlighted: false,
  },
  {
    id: 'pro_annual',
    label: 'Pro Annual',
    price: '$95.88',
    period: 'per year · $7.99/mo',
    description: 'Save 38% vs monthly — best value',
    highlighted: true,
  },
];
