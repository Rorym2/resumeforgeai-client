import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import { scrapeJobUrl } from '../lib/api';
import { colors, spacing, font, radius } from '../theme';

const MIN_LENGTH = 100;

const LINKEDIN_EXTRACT_SCRIPT = `
  (function() {
    function extract() {
      const selectors = [
        '.description__text',
        '.show-more-less-html__markup',
        '[class*="description__text"]',
        '[class*="job-view-layout"] .description',
        '.jobs-description__content',
        '.jobs-box__html-content',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText && el.innerText.length > 100) {
          const title = document.querySelector('h1')?.innerText || '';
          const company = document.querySelector('[class*="company-name"], .topcard__org-name-link')?.innerText || '';
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'JOB_TEXT',
            text: (title ? title + '\\n' : '') + (company ? company + '\\n\\n' : '') + el.innerText
          }));
          return;
        }
      }
    }
    extract();
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      extract();
      if (attempts >= 10) clearInterval(interval);
    }, 1000);
  })();
  true;
`;

export default function JobInputScreen({ navigation, route }) {
  const { resumeId, resumeText } = route.params;
  const [jobText, setJobText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showLinkedInWebView, setShowLinkedInWebView] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const webViewRef = useRef(null);

  const charCount = jobText.trim().length;
  const isReady = charCount >= MIN_LENGTH;

  function handleGenerate() {
    navigation.navigate('Processing', { resumeId, resumeText, jobText: jobText.trim() });
  }

  async function handleFetchUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http')) {
      setFetchError('Please enter a full URL starting with http:// or https://');
      return;
    }
    setFetching(true);
    setFetchError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Session Expired', 'Please sign in again.');
        return;
      }
      const result = await scrapeJobUrl(url, session.access_token);
      setJobText(result.text);
      setUrlInput('');
    } catch (err) {
      if (err.code === 'LINKEDIN_LOGIN_REQUIRED') {
        setLinkedInUrl(url);
        setShowLinkedInWebView(true);
      } else {
        setFetchError(err.message || 'Could not fetch job from that URL. Please paste the description below.');
      }
    } finally {
      setFetching(false);
    }
  }

  function handleWebViewMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'JOB_TEXT' && msg.text) {
        setJobText(msg.text.trim());
        setShowLinkedInWebView(false);
        setUrlInput('');
      }
    } catch {
      // ignore non-JSON
    }
  }

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step indicator */}
          <View style={styles.stepBar}>
            <View style={styles.stepDone}><Text style={styles.stepDoneText}>✓</Text></View>
            <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
            <View style={styles.stepActive}><Text style={styles.stepActiveText}>2</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>3</Text></View>
          </View>

          {/* URL import */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.accentDot} />
              <Text style={styles.label}>Import from URL</Text>
            </View>
            <Text style={styles.hint}>Indeed, ZipRecruiter, or LinkedIn</Text>
            <View style={styles.urlRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
                value={urlInput}
                onChangeText={(v) => { setUrlInput(v); setFetchError(null); }}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.fetchButton, (fetching || !urlInput.trim()) && styles.fetchButtonDisabled]}
                onPress={handleFetchUrl}
                disabled={fetching || !urlInput.trim()}
              >
                {fetching
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.fetchButtonText}>Fetch</Text>
                }
              </TouchableOpacity>
            </View>
            {fetchError && <Text style={styles.fetchError}>{fetchError}</Text>}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or paste manually</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual paste */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.accentDot} />
              <Text style={styles.label}>Paste job description</Text>
            </View>
            <Text style={styles.hint}>Copy the full job posting and paste it below</Text>
            <TextInput
              style={[styles.input, isReady && styles.inputReady]}
              multiline
              placeholder="Paste job description here..."
              placeholderTextColor={colors.textMuted}
              value={jobText}
              onChangeText={setJobText}
              textAlignVertical="top"
            />
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: `${Math.min((charCount / MIN_LENGTH) * 100, 100)}%` },
                isReady && styles.progressFillDone,
              ]} />
            </View>
            <Text style={[styles.charCount, isReady && styles.charCountReady]}>
              {isReady ? '✓ Ready to generate' : `${MIN_LENGTH - charCount} more characters needed`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, !isReady && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={!isReady}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Generate Optimized Resume</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* LinkedIn WebView modal */}
      <Modal
        visible={showLinkedInWebView}
        animationType="slide"
        onRequestClose={() => setShowLinkedInWebView(false)}
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Sign in to LinkedIn</Text>
            <Text style={styles.webViewSubtitle}>
              Log in and navigate to the job — we'll read it automatically.
            </Text>
            <TouchableOpacity style={styles.webViewClose} onPress={() => setShowLinkedInWebView(false)}>
              <Text style={styles.webViewCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <WebView
            ref={webViewRef}
            source={{ uri: linkedInUrl }}
            injectedJavaScript={LINKEDIN_EXTRACT_SCRIPT}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  urlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  urlInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: font.sm,
    color: colors.textPrimary,
  },
  fetchButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    minWidth: 64,
    alignItems: 'center',
  },
  fetchButtonDisabled: {
    backgroundColor: colors.border,
  },
  fetchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: font.sm,
  },
  fetchError: {
    fontSize: font.sm,
    color: colors.error,
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.md,
    color: colors.textPrimary,
    minHeight: 200,
    marginBottom: spacing.sm,
  },
  inputReady: {
    borderColor: colors.primary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressFillDone: {
    backgroundColor: colors.primary,
  },
  charCount: {
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  charCountReady: {
    color: colors.primary,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.ember,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webViewHeader: {
    backgroundColor: '#0F172A',
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  webViewTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: '#F8FAFF',
    marginBottom: spacing.xs,
  },
  webViewSubtitle: {
    fontSize: font.sm,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  webViewClose: {
    alignSelf: 'flex-start',
  },
  webViewCloseText: {
    fontSize: font.sm,
    color: colors.error,
    fontWeight: '600',
  },
});
