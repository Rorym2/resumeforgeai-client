import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, font, radius } from '../theme';

function formatDates(item) {
  if (item.dates) return item.dates;
  const start = item.start_date || '';
  const end = item.end_date || '';
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  return '';
}

function formatResume(optimizedResume) {
  if (!optimizedResume) return 'No resume data.';
  if (typeof optimizedResume === 'string') return optimizedResume;

  const r = optimizedResume;
  const sections = [];

  if (r.contact) {
    const contact = [r.contact.name, r.contact.email, r.contact.phone, r.contact.location]
      .filter(Boolean).join('\n');
    if (contact) sections.push({ type: 'contact', text: contact });
  }

  if (r.summary) {
    sections.push({ type: 'heading', text: 'SUMMARY' });
    sections.push({ type: 'body', text: r.summary });
  }

  const experience = r.experience || r.work_experience || [];
  if (experience.length) {
    sections.push({ type: 'heading', text: 'EXPERIENCE' });
    experience.forEach(job => {
      const header = [job.title || job.role, job.company || job.organization].filter(Boolean).join(' — ');
      const dates = formatDates(job);
      if (header) sections.push({ type: 'jobTitle', text: header });
      if (dates) sections.push({ type: 'dates', text: dates });
      (job.bullets || job.responsibilities || []).forEach(b => {
        sections.push({ type: 'bullet', text: `• ${b}` });
      });
    });
  }

  const skills = r.skills;
  if (skills) {
    sections.push({ type: 'heading', text: 'SKILLS' });
    if (Array.isArray(skills)) {
      sections.push({ type: 'body', text: skills.join(' · ') });
    } else if (typeof skills === 'object') {
      const all = [...(skills.technical || []), ...(skills.languages || []), ...(skills.other || [])];
      if (all.length) sections.push({ type: 'body', text: all.join(' · ') });
    }
  }

  const education = r.education || [];
  if (education.length) {
    sections.push({ type: 'heading', text: 'EDUCATION' });
    education.forEach(e => {
      const header = [e.degree || e.field, e.institution || e.school].filter(Boolean).join(' — ');
      const dates = formatDates(e) || e.graduation_date || '';
      if (header) sections.push({ type: 'jobTitle', text: header });
      if (dates) sections.push({ type: 'dates', text: dates });
    });
  }

  const leadership = r.leadership_activities || r.leadership || [];
  if (leadership.length) {
    sections.push({ type: 'heading', text: 'LEADERSHIP & ACTIVITIES' });
    leadership.forEach(item => {
      const header = [item.role || item.title, item.organization].filter(Boolean).join(' — ');
      const dates = formatDates(item);
      if (header) sections.push({ type: 'jobTitle', text: header });
      if (dates) sections.push({ type: 'dates', text: dates });
      (item.bullets || []).forEach(b => sections.push({ type: 'bullet', text: `• ${b}` }));
    });
  }

  return sections;
}

function formatCoverLetter(coverLetter) {
  if (!coverLetter) return 'No cover letter data.';
  if (typeof coverLetter === 'string') return coverLetter;
  return coverLetter.body || coverLetter.text || JSON.stringify(coverLetter, null, 2);
}

function sectionsToPlainText(sections) {
  if (!Array.isArray(sections)) return sections;
  return sections.map(s => s.text).join('\n');
}

function scoreColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
}

function ScoreBadge({ score }) {
  const color = scoreColor(score);
  return (
    <View style={[badge.wrap, { borderColor: color }]}>
      <View style={[badge.dot, { backgroundColor: color }]} />
      <Text style={[badge.label, { color }]}>Match Score</Text>
      <Text style={[badge.score, { color }]}>{score}%</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  score: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default function ResultsScreen({ route }) {
  const { result } = route.params;
  const [activeTab, setActiveTab] = useState('resume');
  const [copied, setCopied] = useState(false);

  const resumeSections = formatResume(result.optimized_resume);
  const coverLetterText = formatCoverLetter(result.cover_letter);
  const matchScore = result.match_score?.score ?? result.match_score?.overall ?? null;

  async function handleCopy() {
    const text = activeTab === 'resume' ? sectionsToPlainText(resumeSections) : coverLetterText;
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
        case 'contact':  return <Text key={i} style={styles.contactText}>{section.text}</Text>;
        case 'heading':  return <Text key={i} style={styles.sectionHeading}>{section.text}</Text>;
        case 'jobTitle': return <Text key={i} style={styles.jobTitle}>{section.text}</Text>;
        case 'dates':    return <Text key={i} style={styles.datesText}>{section.text}</Text>;
        case 'bullet':   return <Text key={i} style={styles.bulletText}>{section.text}</Text>;
        default:         return <Text key={i} style={styles.bodyText}>{section.text}</Text>;
      }
    });
  };

  return (
    <View style={styles.container}>
      {matchScore !== null && <ScoreBadge score={matchScore} />}

      {/* Tabs */}
      <View style={styles.tabs}>
        {['resume', 'cover'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'resume' ? 'Resume' : 'Cover Letter'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {activeTab === 'resume'
          ? renderResume()
          : <Text style={styles.bodyText}>{coverLetterText}</Text>
        }
      </ScrollView>

      {/* Copy button */}
      <TouchableOpacity style={[styles.copyButton, copied && styles.copyButtonDone]} onPress={handleCopy}>
        <Text style={[styles.copyButtonText, copied && styles.copyButtonTextDone]}>
          {copied ? '✓ Copied to clipboard' : 'Copy to Clipboard'}
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#F8FAFF',
  },
  content: {
    flex: 1,
    marginHorizontal: spacing.lg,
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
  contactText: {
    fontSize: font.md,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentLight,
    paddingBottom: 3,
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
  copyButton: {
    margin: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.ember,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  copyButtonDone: {
    backgroundColor: colors.primary,
  },
  copyButtonText: {
    fontSize: font.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  copyButtonTextDone: {
    color: '#FFFFFF',
  },
});
