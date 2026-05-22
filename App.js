import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Update this to your backend URL when deploying
const API_URL = 'http://localhost:3000';

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('input');

  async function handleAnalyze() {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please enter both your resume and the job description.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data);
      setPhase('results');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPhase('input');
    setAnalysis(null);
    setError('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoLetter}>R</Text>
        </View>
        <Text style={styles.headerTitle}>ResumeForge AI</Text>
      </View>

      {phase === 'input' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.inputContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Score Your Resume</Text>
            <Text style={styles.subtitle}>
              Paste your resume and a job description to see how well you match — and how much AI can improve it.
            </Text>

            <Text style={styles.label}>Your Resume</Text>
            <TextInput
              style={[styles.textArea, { height: 180 }]}
              multiline
              placeholder="Paste your resume text here..."
              placeholderTextColor="#9ca3af"
              value={resumeText}
              onChangeText={setResumeText}
            />

            <Text style={styles.label}>Job Description</Text>
            <TextInput
              style={[styles.textArea, { height: 150 }]}
              multiline
              placeholder="Paste the job description here..."
              placeholderTextColor="#9ca3af"
              value={jobDescription}
              onChangeText={setJobDescription}
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Analyze Match</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.scoreHero}>
            <Text style={styles.scoreSuperLabel}>YOUR MATCH SCORE</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{analysis.overallScore}</Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
            <View style={styles.improvedBadge}>
              <Text style={styles.improvedText}>
                Improves to {analysis.improvedScore}% with AI optimization
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Score Breakdown</Text>
            {Object.entries(analysis.categories).map(([key, value]) => (
              <View key={key} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${value}%`, backgroundColor: scoreColor(value) },
                    ]}
                  />
                </View>
                <Text style={styles.categoryValue}>{value}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Strengths</Text>
            {analysis.strengths.map((item, i) => (
              <BulletRow key={i} icon="✓" iconColor="#22c55e" text={item} />
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gaps</Text>
            {analysis.gaps.map((item, i) => (
              <BulletRow key={i} icon="✕" iconColor="#ef4444" text={item} />
            ))}
          </View>

          <View style={[styles.card, styles.suggestionsCard]}>
            <Text style={styles.cardTitle}>Suggestions</Text>
            {analysis.suggestions.map((item, i) => (
              <BulletRow key={i} icon="→" iconColor="#4f46e5" text={item} />
            ))}
          </View>

          <TouchableOpacity style={styles.outlineButton} onPress={handleReset}>
            <Text style={styles.outlineButtonText}>Analyze Another Job</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BulletRow({ icon, iconColor, text }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function scoreColor(score) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },

  inputContainer: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  resultsContainer: { padding: 20, paddingBottom: 48 },
  scoreHero: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreSuperLabel: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  scoreNumber: { fontSize: 88, fontWeight: '900', color: '#fff', lineHeight: 88 },
  scorePercent: { fontSize: 36, fontWeight: '700', color: '#c7d2fe', marginBottom: 10 },
  improvedBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  improvedText: { color: '#e0e7ff', fontSize: 13, fontWeight: '500' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryLabel: { width: 88, fontSize: 13, color: '#374151', fontWeight: '500' },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  categoryValue: { width: 36, fontSize: 13, color: '#6b7280', textAlign: 'right' },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bulletIcon: { fontSize: 15, fontWeight: '700', width: 24, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  suggestionsCard: { borderColor: '#e0e7ff', backgroundColor: '#fafafe' },

  outlineButton: {
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineButtonText: { color: '#4f46e5', fontWeight: '700', fontSize: 16 },
});
