import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { generate } from '../lib/api';
import { supabase } from '../lib/supabase';

const STEPS = [
  { label: 'Parsing resume',        tag: 'EXTRACT' },
  { label: 'Analyzing job listing', tag: 'ANALYZE' },
  { label: 'Scoring your match',    tag: 'SCORE'   },
  { label: 'Finding strengths',     tag: 'MAP'     },
  { label: 'Rewriting for ATS',     tag: 'FORGE'   },
  { label: 'Writing cover letter',  tag: 'WRITE'   },
];

export default function ProcessingScreen({ navigation, route }) {
  const { resumeId, resumeText, jobText } = route.params;
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function run() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Your session expired. Please sign in again.');
          return;
        }
        const result = await generate(resumeText, jobText, resumeId, session.access_token);
        navigation.replace('Results', { result });
      } catch (err) {
        if (err.code === 'FREE_TIER_LIMIT') {
          navigation.replace('Paywall');
        } else {
          setError(err.message || 'Something went wrong. Please try again.');
        }
      }
    }
    run();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Generation Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const step = STEPS[stepIndex];

  return (
    <View style={styles.container}>
      {/* Spinner ring */}
      <View style={styles.spinnerWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
        <View style={styles.spinnerInner}>
          <Text style={styles.spinnerTag}>{step.tag}</Text>
        </View>
      </View>

      <Text style={styles.stepLabel}>{step.label}...</Text>
      <Text style={styles.hint}>This usually takes 20–30 seconds</Text>

      {/* Step dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex && styles.dotActive,
              i < stepIndex && styles.dotDone,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  spinnerWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  spinnerInner: {
    position: 'absolute',
  },
  spinnerTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
  stepLabel: {
    fontSize: font.xl,
    fontWeight: '600',
    color: '#F8FAFF',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: font.sm,
    color: '#475569',
    marginBottom: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3A8A',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  // Error state
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIconText: {
    color: '#FCA5A5',
    fontSize: 24,
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: '#F8FAFF',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: font.md,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.accent,
  },
});

