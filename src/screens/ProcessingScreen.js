import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { colors, spacing, font } from '../theme';
import { generate } from '../lib/api';

// Temporary hardcoded token for testing — replaced with real auth later
const DEV_TOKEN = null;

const STEPS = [
  'Parsing your resume...',
  'Analyzing the job listing...',
  'Scoring your match...',
  'Finding your strengths...',
  'Rewriting for ATS...',
  'Writing your cover letter...',
];

export default function ProcessingScreen({ navigation, route }) {
  const { resumeId, resumeText, jobText } = route.params;
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);

  // Cycle through the step labels every 4 seconds so the user knows something is happening
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Kick off the AI pipeline as soon as this screen loads
  useEffect(() => {
    async function run() {
      try {
        const result = await generate(resumeText, jobText, resumeId, DEV_TOKEN);
        navigation.replace('Results', { result });
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    }
    run();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Generation Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.stepLabel}>{STEPS[stepIndex]}</Text>
      <Text style={styles.hint}>This usually takes 20–30 seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  stepLabel: {
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: font.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
