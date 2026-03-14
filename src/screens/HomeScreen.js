import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { uploadResume } from '../lib/api';

// Temporary hardcoded token for testing — will be replaced with real auth in a later step
const DEV_TOKEN = null;

export default function HomeScreen({ navigation }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

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

      // Upload to backend and get extracted text back
      const data = await uploadResume(file.uri, file.name, file.mimeType, DEV_TOKEN);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ResumeForge AI</Text>
        <Text style={styles.subtitle}>
          Upload your resume and we'll tailor it to any job — instantly.
        </Text>
      </View>

      {/* Upload area */}
      <TouchableOpacity
        style={[styles.uploadBox, uploadedFile && styles.uploadBoxDone]}
        onPress={handlePickFile}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : uploadedFile ? (
          <>
            <Text style={styles.uploadIcon}>✓</Text>
            <Text style={styles.uploadedName}>{uploadedFile.name}</Text>
            <Text style={styles.uploadHint}>Tap to change</Text>
          </>
        ) : (
          <>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadLabel}>Upload Resume</Text>
            <Text style={styles.uploadHint}>PDF or DOCX · Max 10MB</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Next button — only shows after upload */}
      {uploadedFile && (
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next: Add Job Description →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
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
    lineHeight: 24,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  uploadBoxDone: {
    borderColor: colors.success,
    borderStyle: 'solid',
    backgroundColor: '#F0FDF4',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '600',
  },
});
