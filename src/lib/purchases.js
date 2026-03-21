// ResumeForge AI — Purchases / RevenueCat wrapper
//
// Automatically uses the real RevenueCat SDK in EAS production/preview builds,
// and falls back to a safe mock in Expo Go (where native modules can't load).
//
// RevenueCat dashboard setup required before real purchases work:
//   1. Create a "pro" Entitlement
//   2. Create a default Offering with Monthly + Annual packages
//   3. Link App Store Connect / Google Play subscription products

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Expo Go sets appOwnership to 'expo'. EAS builds set it to 'standalone' or null.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Lazy-load the native SDK so Expo Go doesn't crash trying to import it
let Purchases = null;
let LOG_LEVEL = null;
if (!IS_EXPO_GO) {
  try {
    const rc = require('react-native-purchases');
    Purchases = rc.default;
    LOG_LEVEL = rc.LOG_LEVEL;
  } catch (e) {
    console.warn('[Purchases] react-native-purchases not available:', e.message);
  }
}

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
  if (IS_EXPO_GO || !Purchases) return; // no-op in Expo Go
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: API_KEY });
}

// Call after a user logs in — links RevenueCat data to the Supabase user ID.
export async function identifyUser(userId) {
  if (IS_EXPO_GO || !Purchases) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[Purchases] Failed to identify user:', e.message);
  }
}

// Call on logout — clears the user identity from RevenueCat.
export async function resetUser() {
  if (IS_EXPO_GO || !Purchases) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    // logOut throws if user is already anonymous — safe to ignore
  }
}

// Returns whether the current user has an active Pro subscription.
export async function getSubscriptionStatus() {
  if (IS_EXPO_GO || !Purchases) {
    return { isPro: false, activeSubscription: null };
  }
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
export async function purchaseSubscription(packageId) {
  if (IS_EXPO_GO || !Purchases) {
    // In Expo Go — simulate success for UI testing
    console.log(`[Purchases Mock] Would purchase: ${packageId}`);
    return { success: true, isPro: true, mock: true };
  }

  const offerings = await Purchases.getOfferings();
  if (!offerings.current) {
    throw new Error('No offerings available. Please try again later.');
  }

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
  if (IS_EXPO_GO || !Purchases) {
    return { isPro: false, mock: true };
  }
  const customerInfo = await Purchases.restorePurchases();
  const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  return { isPro };
}

// Static package definitions used for UI display (labels, prices, descriptions).
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
