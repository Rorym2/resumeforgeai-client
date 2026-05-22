// ResumeForge AI — Purchases / RevenueCat wrapper

import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export async function initPurchases() {
  if (Platform.OS !== 'android') return;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  await Purchases.configure({ apiKey: ANDROID_KEY });
}

export async function identifyUser(userId) {
  if (Platform.OS !== 'android') return;
  await Purchases.logIn(userId);
}

export async function resetUser() {
  if (Platform.OS !== 'android') return;
  await Purchases.logOut();
}

export async function getSubscriptionStatus() {
  if (Platform.OS !== 'android') return { isPro: false, activeSubscription: null };
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    const activeSubscription = isPro
      ? customerInfo.entitlements.active['pro'].productIdentifier
      : null;
    return { isPro, activeSubscription };
  } catch (e) {
    console.error('[Purchases] getSubscriptionStatus error:', e);
    return { isPro: false, activeSubscription: null };
  }
}

// rcPackage must be a RevenueCat Package object from getOfferings(), not a string ID.
// Returns { success, userCancelled?, error?, notSupported? } — never throws.
export async function purchaseSubscription(rcPackage) {
  // notSupported signals the caller that this platform doesn't support purchases
  // (as opposed to a genuine failure) so it can show the right UI.
  if (Platform.OS !== 'android') return { success: false, notSupported: true };
  if (!rcPackage) {
    // Offerings haven't loaded yet — tell the caller so they can show a retry prompt.
    return { success: false, error: 'Pricing unavailable — please try again in a moment.' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(rcPackage);
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    return { success: isPro };
  } catch (e) {
    if (!e.userCancelled) {
      console.error('[Purchases] purchaseSubscription error:', e);
    }
    return { success: false, userCancelled: e.userCancelled };
  }
}

// Returns { isPro, notSupported? } — never throws.
export async function restorePurchases() {
  if (Platform.OS !== 'android') return { isPro: false, notSupported: true };
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    return { isPro };
  } catch (e) {
    console.error('[Purchases] restorePurchases error:', e);
    return { isPro: false };
  }
}

export async function getOfferings() {
  if (Platform.OS !== 'android') return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('[Purchases] getOfferings error:', e);
    return null;
  }
}

// Static fallback prices (shown while live offerings load or as a layout reference)
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
    price: '$7.99',
    period: 'per month, billed annually',
    description: 'Save 38% — best value',
    highlighted: true,
  },
];
