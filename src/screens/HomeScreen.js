import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { uploadResume } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Session Expired', 'Please sign in again.');
        setUploading(false);
        return;
      }

      const data = await uploadResume(file.uri, file.name, file.mimeType, session.access_token);

      setUploadedFile({
        name: file.name,
        resumeId: data.resume_id,
        resumeText: data.text,
      });

      setUploading(false);
    } catch (err) {
      setUploading(false);
      Alert.alert('Upload Failed', err.message || 'Could not upload your resume. Please try again.');
    }
  }

  function handleNext() {
    navigation.navigate('JobInput', {
      resumeId: uploadedFile.resumeId,
      resumeText: uploadedFile.resumeText,
    });
  }

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepBar}>
        <View style={styles.stepActive}><Text style={styles.stepActiveText}>1</Text></View>
        <View style={styles.stepLine} />
        <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>2</Text></View>
        <View style={styles.stepLine} />
        <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>3</Text></View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Upload Resume</Text>
        <Text style={styles.subtitle}>
          We'll analyze it and tailor it to any job — instantly.
        </Text>
      </View>

      {/* Upload area */}
      <TouchableOpacity
        style={[styles.uploadBox, uploadedFile && styles.uploadBoxDone]}
        onPress={handlePickFile}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : uploadedFile ? (
          <>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.uploadedName} numberOfLines={1}>{uploadedFile.name}</Text>
            <Text style={styles.uploadHint}>Tap to change</Text>
          </>
        ) : (
          <>
            <View style={styles.uploadIconWrap}>
              <Text style={styles.uploadIconText}>↑</Text>
            </View>
            <Text style={styles.uploadLabel}>Upload Resume</Text>
            <Text style={styles.uploadHint}>PDF or DOCX · Max 10MB</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Accepted formats pill */}
      {!uploadedFile && (
        <View style={styles.formatRow}>
          {['PDF', 'DOCX'].map(fmt => (
            <View key={fmt} style={styles.formatPill}>
              <Text style={styles.formatText}>{fmt}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Next CTA */}
      {uploadedFile && (
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Next: Add Job Description</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  stepActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActiveText: {
    color: '#FFFFFF',
    fontSize: font.sm,
    fontWeight: '700',
  },
  stepInactive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInactiveText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.border,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
  },
  uploadBoxDone: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    backgroundColor: colors.primaryLight,
  },
  uploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadIconText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  uploadLabel: {
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  uploadedName: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
    maxWidth: '80%',
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  formatPill: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: colors.ember,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
});
