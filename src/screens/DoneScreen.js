import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { exportAsPdf, exportAsWord } from '../lib/exportResume';

function scoreColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
}

function ExportRow({ label, onPdf, onText, loadingPdf, loadingText }) {
  return (
    <View style={styles.exportRow}>
      <Text style={styles.exportLabel}>{label}</Text>
      <View style={styles.exportButtons}>
        <TouchableOpacity
          style={[styles.exportBtn, loadingPdf && styles.exportBtnDisabled]}
          onPress={onPdf}
          disabled={loadingPdf || loadingText}
        >
          {loadingPdf
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.exportBtnText}>PDF</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportBtn, loadingText && styles.exportBtnDisabled]}
          onPress={onText}
          disabled={loadingPdf || loadingText}
        >
          {loadingText
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.exportBtnText}>Word</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DoneScreen({ navigation, route }) {
  const { result } = route.params;
  const matchScore = result.match_score?.overall_score ?? null;

  const [loading, setLoading] = useState({
    resumePdf: false,
    resumeWord: false,
    coverPdf: false,
    coverWord: false,
  });

  async function handleExport(type, format) {
    const key = `${type === 'resume' ? 'resume' : 'cover'}${format === 'pdf' ? 'Pdf' : 'Word'}`;
    setLoading(l => ({ ...l, [key]: true }));
    try {
      if (format === 'pdf') {
        await exportAsPdf(type, result);
      } else {
        await exportAsWord(type, result);
      }
    } catch (err) {
      Alert.alert('Export Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }

  return (
    <View style={styles.container}>
      {/* Score summary */}
      {matchScore !== null && (
        <View style={[styles.scoreBadge, { borderColor: scoreColor(matchScore) }]}>
          <Text style={[styles.scoreNumber, { color: scoreColor(matchScore) }]}>{matchScore}%</Text>
          <Text style={styles.scoreLabel}>Match Score</Text>
        </View>
      )}

      <Text style={styles.title}>Your documents are ready</Text>
      <Text style={styles.subtitle}>Download your resume and cover letter below</Text>

      {/* Export cards */}
      <View style={styles.card}>
        <ExportRow
          label="Resume"
          loadingPdf={loading.resumePdf}
          loadingText={loading.resumeWord}
          onPdf={() => handleExport('resume', 'pdf')}
          onText={() => handleExport('resume', 'word')}
        />
        <View style={styles.divider} />
        <ExportRow
          label="Cover Letter"
          loadingPdf={loading.coverPdf}
          loadingText={loading.coverWord}
          onPdf={() => handleExport('cover', 'pdf')}
          onText={() => handleExport('cover', 'word')}
        />
      </View>

      <Text style={styles.hint}>
        PDF for sending · Word to edit in Google Docs
      </Text>

      {/* Back to home */}
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  scoreLabel: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  exportLabel: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exportBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    minWidth: 56,
    alignItems: 'center',
  },
  exportBtnDisabled: {
    borderColor: colors.border,
  },
  exportBtnText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  homeButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: font.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
