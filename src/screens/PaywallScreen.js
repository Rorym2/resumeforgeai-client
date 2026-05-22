import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { purchaseSubscription, restorePurchases, getOfferings, PACKAGES } from '../lib/purchases';

export default function PaywallScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('pro_annual');
  const [rcOffering, setRcOffering] = useState(null);

  useEffect(() => {
    getOfferings().then(offering => setRcOffering(offering));
  }, []);

  function getSelectedRcPackage() {
    return rcOffering?.availablePackages?.find(p => p.identifier === selectedId) ?? null;
  }

  function getDisplayPrice() {
    const rcPackage = getSelectedRcPackage();
    if (rcPackage?.product?.priceString) return rcPackage.product.priceString;
    return PACKAGES.find(p => p.id === selectedId)?.price ?? '';
  }

  async function handlePurchase() {
    setLoading(true);
    try {
      const result = await purchaseSubscription(getSelectedRcPackage());
      if (result.notSupported) {
        Alert.alert('Not Available', 'Purchases are only supported on Android at this time.');
      } else if (result.userCancelled) {
        // user dismissed — do nothing
      } else if (result.success) {
        Alert.alert("You're now Pro!", 'Enjoy unlimited tailored resumes and cover letters.', [
          { text: "Let's Go", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const result = await restorePurchases();
      if (result.notSupported) {
        Alert.alert('Not Available', 'Purchases are only supported on Android at this time.');
      } else if (result.isPro) {
        Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('No Subscription Found', "We couldn't find an active subscription to restore.");
      }
    } finally {
      setLoading(false);
    }
  }

  const FEATURES = [
    'Unlimited resume optimizations',
    'Unlimited cover letters',
    'ATS match score for every job',
    'Full document history',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Dark hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroIconText}>↑</Text>
        </View>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          You've used your 3 free generations.{'\n'}
          Unlock unlimited access.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Packages */}
      <View style={styles.packages}>
        {PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              selectedId === pkg.id && styles.packageCardSelected,
            ]}
            onPress={() => setSelectedId(pkg.id)}
            activeOpacity={0.8}
          >
            {pkg.highlighted && (
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            <View style={styles.packageLeft}>
              <Text style={[styles.packageLabel, selectedId === pkg.id && styles.packageLabelSelected]}>
                {pkg.label}
              </Text>
              <Text style={styles.packageDescription}>{pkg.description}</Text>
            </View>
            <View style={styles.packageRight}>
              <Text style={[styles.packagePrice, selectedId === pkg.id && styles.packagePriceSelected]}>
                {pkg.price}
              </Text>
              <Text style={styles.packagePeriod}>{pkg.period}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
        onPress={handlePurchase}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.ctaText}>Start Pro — {getDisplayPrice()}</Text>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleRestore} disabled={loading}>
          <Text style={styles.footerLink}>Restore Purchase</Text>
        </TouchableOpacity>
        <Text style={styles.footerDot}>·</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.footerLink}>Maybe Later</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.legalText}>
        Subscriptions renew automatically. Cancel anytime in your Google Play settings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ember,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: '#F8FAFF',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: font.md,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  featureText: {
    fontSize: font.md,
    color: colors.textPrimary,
  },
  packages: {
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  packageLeft: {
    flex: 1,
  },
  packageLabel: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  packageLabelSelected: {
    color: colors.primary,
  },
  packageDescription: {
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packagePriceSelected: {
    color: colors.primary,
  },
  packagePeriod: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  ctaButton: {
    backgroundColor: colors.ember,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.border,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  footerLink: {
    fontSize: font.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  footerDot: {
    color: colors.textMuted,
  },
  legalText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginHorizontal: spacing.lg,
  },
});
