// ResumeForge AI — Purchases / RevenueCat wrapper
//
// Real RevenueCat SDK implementation for EAS production builds.
// Requires react-native-purchases (native module — does not work in Expo Go).
//
// RevenueCat dashboard setup required before this works:
//   1. Create a "pro" Entitlement
//   2. Create a default Offering with Monthly + Annual packages
//   3. Link App Store Connect / Google Play subscription products
//   4. Set separate iOS and Android API keys in .env (see below)

import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat uses separate API keys for iOS and Android.
// Add EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
// to your .env and Railway env vars before go-live.
// For now we fall back to the single key already in .env.
const API_KEY =
  Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_KEY)
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || process.env.EXPO_PUBLIC_REVENUECAT_KEY);

// Call once on app start (before any purchase calls).
export async function initPurchases() {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: API_KEY });
}

// Call after a user logs in — links RevenueCat data to the Supabase user ID.
// This ensures purchase history is restored correctly across devices.
export async function identifyUser(userId) {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[Purchases] Failed to identify user:', e.message);
  }
}

// Call on logout — clears the user identity from RevenueCat.
export async function resetUser() {
  try {
    await Purchases.logOut();
  } catch (e) {
    // logOut throws if user is already anonymous — safe to ignore
  }
}

// Returns whether the current user has an active Pro subscription.
export async function getSubscriptionStatus() {
  const customerInfo = await Purchases.getCustomerInfo();
  const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  return {
    isPro,
    activeSubscription: isPro
      ? customerInfo.entitlements.active['pro'].productIdentifier
      : null,
  };
}

// Purchases a subscription package by the package ID defined in PACKAGES below.
// Fetches the live offering from RevenueCat so prices shown match what was
// configured in App Store Connect / Google Play Console.
export async function purchaseSubscription(packageId) {
  const offerings = await Purchases.getOfferings();
  if (!offerings.current) {
    throw new Error('No offerings available. Please try again later.');
  }

  // Map our local package ID to RevenueCat's package type shorthand
  const pkg =
    packageId === 'pro_monthly'
      ? offerings.current.monthly
      : offerings.current.annual;

  if (!pkg) {
    throw new Error('Package not found. Please check your RevenueCat offering configuration.');
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  return { success: true, isPro };
}

// Restores previous purchases — required by Apple and Google guidelines.
export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  return { isPro };
}

// Static package definitions used for UI display (labels, prices, descriptions).
// Prices here are shown as fallback — RevenueCat fetches live prices from the stores.
// Update these to match your App Store Connect / Google Play Console product prices.
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
