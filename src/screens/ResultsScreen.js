import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../theme';

function formatResume(optimizedResume) {
  if (!optimizedResume) return 'No resume data.';
  if (typeof optimizedResume === 'string') return optimizedResume;

  // Format structured JSON resume into readable text
  const r = optimizedResume;
  const lines = [];

  if (r.contact) {
    lines.push(r.contact.name || '');
    if (r.contact.email) lines.push(r.contact.email);
    if (r.contact.phone) lines.push(r.contact.phone);
    if (r.contact.location) lines.push(r.contact.location);
    lines.push('');
  }

  if (r.summary) {
    lines.push('SUMMARY');
    lines.push(r.summary);
    lines.push('');
  }

  if (r.experience?.length) {
    lines.push('EXPERIENCE');
    r.experience.forEach(job => {
      lines.push(`${job.title} — ${job.company}`);
      if (job.dates) lines.push(job.dates);
      if (job.bullets?.length) job.bullets.forEach(b => lines.push(`• ${b}`));
      lines.push('');
    });
  }

  if (r.skills?.length) {
    lines.push('SKILLS');
    lines.push(r.skills.join(' · '));
    lines.push('');
  }

  if (r.education?.length) {
    lines.push('EDUCATION');
    r.education.forEach(e => {
      lines.push(`${e.degree} — ${e.institution}`);
      if (e.dates) lines.push(e.dates);
    });
  }

  return lines.join('\n');
}

function formatCoverLetter(coverLetter) {
  if (!coverLetter) return 'No cover letter data.';
  if (typeof coverLetter === 'string') return coverLetter;
  return coverLetter.body || coverLetter.text || JSON.stringify(coverLetter, null, 2);
}

export default function ResultsScreen({ route }) {
  const { result } = route.params;
  const [activeTab, setActiveTab] = useState('resume');

  const resumeText = formatResume(result.optimized_resume);
  const coverLetterText = formatCoverLetter(result.cover_letter);

  const matchScore = result.match_score?.score ?? result.match_score?.overall ?? null;

  return (
    <View style={styles.container}>
      {/* Match score badge */}
      {matchScore && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Match Score: {matchScore}%</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resume' && styles.tabActive]}
          onPress={() => setActiveTab('resume')}
        >
          <Text style={[styles.tabText, activeTab === 'resume' && styles.tabTextActive]}>
            Resume
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cover' && styles.tabActive]}
          onPress={() => setActiveTab('cover')}
        >
          <Text style={[styles.tabText, activeTab === 'cover' && styles.tabTextActive]}>
            Cover Letter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.bodyText}>
          {activeTab === 'resume' ? resumeText : coverLetterText}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  scoreText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: font.sm,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentInner: {
    padding: spacing.md,
  },
  bodyText: {
    fontSize: font.sm,
    color: colors.textPrimary,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});
