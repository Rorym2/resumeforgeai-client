import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, font, radius } from '../theme';

// Build a date string from start_date / end_date fields (parser format)
// or fall back to a combined 'dates' field (older format)
function formatDates(item) {
  if (item.dates) return item.dates;
  const start = item.start_date || '';
  const end = item.end_date || '';
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
      const dates = formatDates(e) || e.graduation_date || '';
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

export default function ResultsScreen({ route }) {
  const { result } = route.params;
  const [activeTab, setActiveTab] = useState('resume');
  const [copied, setCopied] = useState(false);

  const resumeSections = formatResume(result.optimized_resume);
  const coverLetterText = formatCoverLetter(result.cover_letter);
  const matchScore = result.match_score?.score ?? result.match_score?.overall ?? null;

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

  return (
    <View style={styles.container}>
      {/* Match score badge */}
      {matchScore !== null && (
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor(matchScore) + '20' }]}>
          <Text style={[styles.scoreText, { color: scoreColor(matchScore) }]}>
            Match Score: {matchScore}%
          </Text>
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
        {activeTab === 'resume'
          ? renderResume()
          : <Text style={styles.bodyText}>{coverLetterText}</Text>
        }
      </ScrollView>

      {/* Copy button */}
      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Text style={styles.copyButtonText}>
          {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scoreBadge: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  scoreText: {
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
    fontSize: font.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    paddingLeft: spacing.sm,
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
