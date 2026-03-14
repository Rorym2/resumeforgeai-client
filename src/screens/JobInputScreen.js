import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../theme';

export default function JobInputScreen({ navigation, route }) {
  const { resumeId, resumeText } = route.params;
  const [jobText, setJobText] = useState('');

  const MIN_LENGTH = 100;
  const isReady = jobText.trim().length >= MIN_LENGTH;

  function handleGenerate() {
    navigation.navigate('Processing', {
      resumeId,
      resumeText,
      jobText: jobText.trim(),
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Paste the job description</Text>
        <Text style={styles.hint}>
          Copy the full job posting and paste it below. The more detail, the better the match.
        </Text>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Paste job description here..."
          placeholderTextColor={colors.textMuted}
          value={jobText}
          onChangeText={setJobText}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>
          {jobText.trim().length < MIN_LENGTH
            ? `${MIN_LENGTH - jobText.trim().length} more characters needed`
            : `✓ Ready to generate`}
        </Text>

        <TouchableOpacity
          style={[styles.button, !isReady && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={!isReady}
        >
          <Text style={styles.buttonText}>Generate Optimized Resume</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  label: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.md,
    color: colors.textPrimary,
    minHeight: 280,
  },
  charCount: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '600',
  },
});
