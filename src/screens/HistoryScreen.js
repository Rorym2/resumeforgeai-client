import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { getDocuments } from '../lib/api';
import { colors, spacing, font, radius } from '../theme';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getJobTitle(item) {
  return item.parsed_job?.title
    || item.parsed_job?.job_title
    || item.job_text?.split('\n')[0]?.slice(0, 50)
    || 'Untitled Job';
}

function getCompany(item) {
  return item.parsed_job?.company || item.parsed_job?.company_name || '';
}

function getScore(item) {
  return item.match_score?.score || item.match_score?.overall || null;
}

function scoreColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
}

function ScorePill({ score }) {
  const color = scoreColor(score);
  return (
    <View style={[pill.wrap, { borderColor: color, backgroundColor: color + '15' }]}>
      <Text style={[pill.text, { color }]}>{score}%</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  text: {
    fontSize: font.sm,
    fontWeight: '700',
  },
});

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

  useFocusEffect(useCallback(() => { loadDocuments(); }, []));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
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
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>↗</Text>
        </View>
        <Text style={styles.emptyTitle}>No documents yet</Text>
        <Text style={styles.emptySubtitle}>
          Generate your first tailored resume and it'll appear here.
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
        const company = getCompany(item);
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Results', { result: item })}
            activeOpacity={0.75}
          >
            {/* Left accent bar */}
            <View style={[styles.accentBar, score !== null && { backgroundColor: scoreColor(score) }]} />
            <View style={styles.cardBody}>
              <Text style={styles.jobTitle} numberOfLines={1}>{getJobTitle(item)}</Text>
              {company ? <Text style={styles.company} numberOfLines={1}>{company}</Text> : null}
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            {score !== null && <ScorePill score={score} />}
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
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.sm + 4,
    marginRight: spacing.sm,
  },
  jobTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  company: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
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
    fontWeight: '700',
    fontSize: font.md,
  },
});
