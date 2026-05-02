import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { purchaseSubscription, restorePurchases, PACKAGES } from '../lib/purchases';

export default function PaywallScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('pro_annual');

  async function handlePurchase() {
    setLoading(true);
    try {
      const result = await purchaseSubscription(selectedId);
      if (result.mock) {
        Alert.alert(
          'Test Mode',
          'Payments are not active in Expo Go. Purchases will work in the production build.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Success!', 'You\'re now a Pro member. Enjoy unlimited generations!', [
          { text: 'Let\'s Go', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      // User cancelling the purchase sheet throws an error — don't show an alert for that
      if (err.userCancelled) return;
      Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const result = await restorePurchases();
      if (result.isPro) {
        Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription to restore.');
      }
    } catch (err) {
      Alert.alert('Restore Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>🚀</Text>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          You've used your 3 free generations this month.{'\n'}
          Upgrade for unlimited tailored resumes and cover letters.
        </Text>
      </View>

      {/* Feature list */}
      <View style={styles.features}>
        {[
          'Unlimited resume optimizations',
          'Unlimited cover letters',
          'ATS match score for every job',
          'Save & access your full history',
        ].map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Pricing options */}
      <View style={styles.packages}>
        {PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              selectedId === pkg.id && styles.packageCardSelected,
              pkg.highlighted && styles.packageCardHighlighted,
            ]}
            onPress={() => setSelectedId(pkg.id)}
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

      {/* CTA button */}
      <TouchableOpacity
        style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
        onPress={handlePurchase}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.ctaText}>Start Pro — {PACKAGES.find(p => p.id === selectedId)?.price}</Text>
        )}
      </TouchableOpacity>

      {/* Footer links */}
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
        Subscriptions renew automatically. Cancel anytime in your App Store or Google Play settings.
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
  featureCheck: {
    fontSize: font.md,
    color: colors.success,
    fontWeight: '700',
    width: 20,
  },
  featureText: {
    fontSize: font.md,
    color: colors.textPrimary,
  },
  packages: {
    gap: spacing.md,
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
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  packageCardHighlighted: {
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.border,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
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
  },
});
