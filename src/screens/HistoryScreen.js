import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { getDocuments } from '../lib/api';
import { colors, spacing, font, radius } from '../theme';

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getJobTitle(item) {
  // Try to extract job title from parsed_job or fall back to a snippet of job_text
  return item.parsed_job?.title
    || item.parsed_job?.job_title
    || item.job_text?.split('\n')[0]?.slice(0, 50)
    || 'Untitled Job';
}

function getCompany(item) {
  return item.parsed_job?.company
    || item.parsed_job?.company_name
    || '';
}

function getScore(item) {
  return item.match_score?.score
    || item.match_score?.overall
    || null;
}

function scoreColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
}

export default function HistoryScreen({ navigation }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await getDocuments(session.access_token);
      setDocuments(data);
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  // Reload every time the user navigates to this screen
  useFocusEffect(useCallback(() => { loadDocuments(); }, []));

  function handleOpen(item) {
    navigation.navigate('Results', { result: item });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDocuments}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>No documents yet</Text>
        <Text style={styles.emptySubtitle}>
          Upload your resume and generate your first tailored resume to see it here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const score = getScore(item);
        return (
          <TouchableOpacity style={styles.card} onPress={() => handleOpen(item)}>
            <View style={styles.cardLeft}>
              <Text style={styles.jobTitle} numberOfLines={1}>{getJobTitle(item)}</Text>
              {getCompany(item) ? (
                <Text style={styles.company} numberOfLines={1}>{getCompany(item)}</Text>
              ) : null}
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            {score !== null && (
              <View style={[styles.scoreBadge, { backgroundColor: scoreColor(score) + '20' }]}>
                <Text style={[styles.scoreText, { color: scoreColor(score) }]}>{score}%</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  jobTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  company: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  scoreBadge: {
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: font.sm,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: font.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: font.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: font.md,
  },
});
