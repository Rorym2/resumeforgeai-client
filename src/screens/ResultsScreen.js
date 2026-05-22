import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, font, radius } from '../theme';

// Guard against AI returning the literal string "undefined" or "null" for missing fields
function sanitize(val) {
  return (val && val !== 'undefined' && val !== 'null') ? val : '';
}

// Build a date string from start_date / end_date fields (parser format)
// or fall back to a combined 'dates' field (older format)
function formatDates(item) {
  if (sanitize(item.dates)) return item.dates;
  const start = sanitize(item.start_date);
  const end = sanitize(item.end_date);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  return '';
}

// Format the structured JSON resume into readable sections
function formatResume(optimizedResume) {
  if (!optimizedResume) return 'No resume data.';
  if (typeof optimizedResume === 'string') return optimizedResume;

  const r = optimizedResume;
  const sections = [];

  // Contact info
  if (r.contact) {
    const contact = [
      r.contact.name,
      r.contact.email,
      r.contact.phone,
      r.contact.location,
    ].filter(Boolean).join('\n');
    if (contact) sections.push({ type: 'contact', text: contact });
  }

  // Summary
  if (r.summary) {
    sections.push({ type: 'heading', text: 'SUMMARY' });
    sections.push({ type: 'body', text: r.summary });
  }

  // Experience
  const experience = r.experience || r.work_experience || [];
  if (experience.length) {
    sections.push({ type: 'heading', text: 'EXPERIENCE' });
    experience.forEach(job => {
      const company = job.company || job.organization || '';
      const title = job.title || job.role || '';
      const dates = formatDates(job);
      const header = [title, company].filter(Boolean).join(' — ');
      if (header) sections.push({ type: 'jobTitle', text: header });
      if (dates) sections.push({ type: 'dates', text: dates });
      (job.bullets || job.responsibilities || []).forEach(b => {
        sections.push({ type: 'bullet', text: `• ${b}` });
      });
    });
  }

  // Skills
  const skills = r.skills;
  if (skills) {
    sections.push({ type: 'heading', text: 'SKILLS' });
    if (Array.isArray(skills)) {
      sections.push({ type: 'body', text: skills.join(' · ') });
    } else if (typeof skills === 'object') {
      const allSkills = [
        ...(skills.technical || []),
        ...(skills.languages || []),
        ...(skills.other || []),
      ];
      if (allSkills.length) sections.push({ type: 'body', text: allSkills.join(' · ') });
    }
  }

  // Education
  const education = r.education || [];
  if (education.length) {
    sections.push({ type: 'heading', text: 'EDUCATION' });
    education.forEach(e => {
      const institution = e.institution || e.school || '';
      const degree = e.degree || e.field || '';
      const dates = formatDates(e) || sanitize(e.graduation_date);
      const header = [degree, institution].filter(Boolean).join(' — ');
      if (header) sections.push({ type: 'jobTitle', text: header });
      if (dates) sections.push({ type: 'dates', text: dates });
    });
  }

  // Leadership / Activities
  const leadership = r.leadership_activities || r.leadership || [];
  if (leadership.length) {
    sections.push({ type: 'heading', text: 'LEADERSHIP & ACTIVITIES' });
    leadership.forEach(item => {
      const org = item.organization || '';
      const role = item.role || item.title || '';
      const dates = formatDates(item);
      const header = [role, org].filter(Boolean).join(' — ');
      if (header) sections.push({ type: 'jobTitle', text: header });
      if (dates) sections.push({ type: 'dates', text: dates });
      (item.bullets || []).forEach(b => {
        sections.push({ type: 'bullet', text: `• ${b}` });
      });
    });
  }

  return sections;
}

function formatCoverLetter(coverLetter) {
  if (!coverLetter) return 'No cover letter data.';
  if (typeof coverLetter === 'string') return coverLetter;
  return coverLetter.body || coverLetter.text || JSON.stringify(coverLetter, null, 2);
}

// Convert sections array to plain text for clipboard
function sectionsToPlainText(sections) {
  if (!Array.isArray(sections)) return sections;
  return sections.map(s => s.text).join('\n');
}

function scoreColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
}

function BulletRow({ icon, iconColor, text }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function ResultsScreen({ route }) {
  const { result } = route.params;
  const [activeTab, setActiveTab] = useState('score');
  const [copied, setCopied] = useState(false);

  const resumeSections = formatResume(result.optimized_resume);
  const coverLetterText = formatCoverLetter(result.cover_letter);
  const scoreData = result.match_score ?? null;
  const matchScore = scoreData?.overall_score ?? null;

  async function handleCopy() {
    const text = activeTab === 'resume'
      ? sectionsToPlainText(resumeSections)
      : coverLetterText;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const renderResume = () => {
    if (!Array.isArray(resumeSections)) {
      return <Text style={styles.bodyText}>{resumeSections}</Text>;
    }
    return resumeSections.map((section, i) => {
      switch (section.type) {
        case 'contact':
          return <Text key={i} style={styles.contactText}>{section.text}</Text>;
        case 'heading':
          return <Text key={i} style={styles.sectionHeading}>{section.text}</Text>;
        case 'jobTitle':
          return <Text key={i} style={styles.jobTitle}>{section.text}</Text>;
        case 'dates':
          return <Text key={i} style={styles.datesText}>{section.text}</Text>;
        case 'bullet':
          return <Text key={i} style={styles.bulletText}>{section.text}</Text>;
        default:
          return <Text key={i} style={styles.bodyText}>{section.text}</Text>;
      }
    });
  };

  const renderScore = () => {
    if (!scoreData) return <Text style={styles.bodyText}>No score data available.</Text>;
    const breakdown = scoreData.breakdown ?? {};
    const breakdownLabels = { skills_match: 'Skills', experience_match: 'Experience', education_match: 'Education' };
    return (
      <>
        {/* Score hero */}
        <View style={styles.scoreHero}>
          <Text style={styles.scoreSuperLabel}>YOUR MATCH SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{matchScore}</Text>
            <Text style={styles.scorePercent}>%</Text>
          </View>
        </View>

        {/* Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardTitle}>Score Breakdown</Text>
            {Object.entries(breakdown).map(([key, value]) => (
              <View key={key} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{breakdownLabels[key] ?? key}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${value}%`, backgroundColor: scoreColor(value) }]} />
                </View>
                <Text style={styles.categoryValue}>{value}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Strengths */}
        {scoreData.strengths?.length > 0 && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardTitle}>Strengths</Text>
            {scoreData.strengths.map((item, i) => (
              <BulletRow key={i} icon="✓" iconColor={colors.success} text={item} />
            ))}
          </View>
        )}

        {/* Weaknesses */}
        {scoreData.weaknesses?.length > 0 && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardTitle}>Gaps</Text>
            {scoreData.weaknesses.map((item, i) => (
              <BulletRow key={i} icon="✕" iconColor={colors.error} text={item} />
            ))}
          </View>
        )}

        {/* ATS Issues */}
        {scoreData.ats_issues?.length > 0 && (
          <View style={[styles.scoreCard, styles.suggestionsCard]}>
            <Text style={styles.scoreCardTitle}>ATS Suggestions</Text>
            {scoreData.ats_issues.map((item, i) => (
              <BulletRow key={i} icon="→" iconColor={colors.primary} text={item} />
            ))}
          </View>
        )}

        {/* Recommendation */}
        {!!scoreData.recommendation && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardTitle}>Recommendation</Text>
            <Text style={styles.bodyText}>{scoreData.recommendation}</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'score' && styles.tabActive]}
          onPress={() => setActiveTab('score')}
        >
          <Text style={[styles.tabText, activeTab === 'score' && styles.tabTextActive]}>
            Score
          </Text>
        </TouchableOpacity>
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
      <ScrollView style={activeTab === 'score' ? styles.scoreContent : styles.content}
        contentContainerStyle={activeTab === 'score' ? styles.scoreContentInner : styles.contentInner}>
        {activeTab === 'score'
          ? renderScore()
          : activeTab === 'resume'
            ? renderResume()
            : <Text style={styles.bodyText}>{coverLetterText}</Text>
        }
      </ScrollView>

      {/* Copy button — only for resume/cover letter tabs */}
      {activeTab !== 'score' && (
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Score tab styles
  scoreContent: {
    flex: 1,
  },
  scoreContentInner: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: 14,
  },
  scoreHero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  scoreSuperLabel: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 80,
  },
  scorePercent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#c7d2fe',
    marginBottom: 8,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreCardTitle: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLabel: {
    width: 80,
    fontSize: font.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryValue: {
    width: 36,
    fontSize: font.sm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletIcon: {
    fontSize: 14,
    fontWeight: '700',
    width: 22,
    marginTop: 2,
  },
  suggestionsCard: {
    borderColor: '#e0e7ff',
    backgroundColor: '#fafafe',
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
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentInner: {
    padding: spacing.md,
    gap: 4,
  },
  // Resume section styles
  contactText: {
    fontSize: font.md,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 2,
  },
  jobTitle: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  datesText: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bulletText: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bodyText: {
    fontSize: font.sm,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  // Copy button
  copyButton: {
    margin: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.primary,
  },
});
