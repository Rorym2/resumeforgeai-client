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

// JavaScript injected into the LinkedIn WebView once the page loads.
// It looks for the job description container and sends the text back to the app.
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
      // Not found yet — will retry via interval
    }

    // Try immediately and then every second for up to 10 seconds
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

  const isReady = jobText.trim().length >= MIN_LENGTH;

  function handleGenerate() {
    navigation.navigate('Processing', {
      resumeId,
      resumeText,
      jobText: jobText.trim(),
    });
  }

  async function handleFetchUrl() {
    const url = urlInput.trim();
    if (!url) return;

    // Basic URL check
    if (!url.startsWith('http')) {
      setFetchError('Please enter a full URL starting with http:// or https://');
      return;
    }

    setFetching(true);
    setFetchError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await scrapeJobUrl(url, session.access_token);
      setJobText(result.text);
      setUrlInput('');
    } catch (err) {
      if (err.code === 'LINKEDIN_LOGIN_REQUIRED') {
        // Open LinkedIn in the in-app browser so the user can log in
        // and we can extract the job description via JavaScript injection
        setLinkedInUrl(url);
        setShowLinkedInWebView(true);
      } else {
        setFetchError(err.message || 'Could not fetch job from that URL. Please paste the description below.');
      }
    } finally {
      setFetching(false);
    }
  }

  // Called when the LinkedIn WebView sends us the extracted job text
  function handleWebViewMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'JOB_TEXT' && msg.text) {
        setJobText(msg.text.trim());
        setShowLinkedInWebView(false);
        setUrlInput('');
      }
    } catch {
      // Ignore non-JSON messages
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* URL import section */}
          <Text style={styles.label}>Import from a job listing URL</Text>
          <Text style={styles.hint}>
            Paste a link from Indeed, ZipRecruiter, or LinkedIn and we'll read it for you.
          </Text>

          <View style={styles.urlRow}>
            <TextInput
              style={styles.urlInput}
              placeholder="https://www.indeed.com/viewjob?jk=..."
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

          {fetchError && (
            <Text style={styles.fetchError}>{fetchError}</Text>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or paste manually</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual paste area */}
          <Text style={styles.label}>Paste the job description</Text>
          <Text style={styles.hint}>
            Copy the full job posting and paste it below.
          </Text>

          <TextInput
            style={styles.input}
            multiline
            placeholder="Paste job description here..."
            placeholderTextColor={colors.textMuted}
            value={jobText}
            onChangeText={setJobText}
            textAlignVertical="top"
          />

          <Text style={[styles.charCount, isReady && styles.charCountReady]}>
            {!isReady
              ? `${MIN_LENGTH - jobText.trim().length} more characters needed`
              : `✓ Ready to generate`}
          </Text>

          <TouchableOpacity
            style={[styles.button, !isReady && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={!isReady}
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
            <TouchableOpacity
              style={styles.webViewClose}
              onPress={() => setShowLinkedInWebView(false)}
            >
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
            onLoadEnd={() => {
              // Re-inject the script after page load completes
              webViewRef.current?.injectJavaScript(LINKEDIN_EXTRACT_SCRIPT);
            }}
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
  label: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
    marginBottom: spacing.sm,
  },
  urlInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.sm,
    color: colors.textPrimary,
  },
  fetchButton: {
    backgroundColor: colors.primary,
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
    fontWeight: '600',
    fontSize: font.sm,
  },
  fetchError: {
    fontSize: font.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.md,
    color: colors.textPrimary,
    minHeight: 220,
  },
  charCount: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  charCountReady: {
    color: colors.success,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '600',
  },
  // LinkedIn WebView modal
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webViewHeader: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  webViewTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  webViewSubtitle: {
    fontSize: font.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
