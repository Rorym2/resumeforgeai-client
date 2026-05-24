import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { colors, spacing, font, radius } from '../theme';
import { generate } from '../lib/api';
import { supabase } from '../lib/supabase';

const STEPS = [
  { label: 'Parsing your resume',    tag: 'EXTRACT', sub: 'Reading between the lines...',         eyeColor: '#06B6D4', mood: 'scan'  },
  { label: 'Analyzing the job',      tag: 'ANALYZE', sub: 'Decoding what they actually want...',  eyeColor: '#A78BFA', mood: 'think' },
  { label: 'Scoring your match',     tag: 'SCORE',   sub: 'Counting your wins...',                eyeColor: '#1D4ED8', mood: 'score' },
  { label: 'Finding your strengths', tag: 'MAP',     sub: 'Spotting your superpowers...',         eyeColor: '#06B6D4', mood: 'map'   },
  { label: 'Rewriting for ATS',      tag: 'FORGE',   sub: 'Making the robots love you...',        eyeColor: '#EA580C', mood: 'forge' },
  { label: 'Writing cover letter',   tag: 'WRITE',   sub: 'Crafting your first impression...',    eyeColor: '#10B981', mood: 'write' },
];

// ─── Robot styles ─────────────────────────────────────────────────────────────
const robot = StyleSheet.create({
  antennaWrap: {
    alignItems: 'center',
    marginBottom: 2,
  },
  antennaStem: {
    width: 3,
    height: 14,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  antennaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -2,
  },
  head: {
    width: 88,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  eye: {
    width: 22,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeChar: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0,
  },
  mouth: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  mouthExcited: {
    backgroundColor: '#EA580C',
  },
  bodyWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  body: {
    width: 56,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyLight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.9,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: spacing.xl,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  robotWrap: {
    marginBottom: spacing.xl,
    height: 160,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stepLabel: {
    fontSize: font.xl,
    fontWeight: '700',
    color: '#F8FAFF',
    marginBottom: spacing.xs,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  stepSub: {
    fontSize: font.sm,
    color: '#64748B',
    marginBottom: spacing.xl,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3A8A',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
  },
  dotDone: {
    backgroundColor: '#1D4ED8',
  },
  hint: {
    fontSize: 12,
    color: '#334155',
    letterSpacing: 0.3,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIconText: {
    color: '#FCA5A5',
    fontSize: 24,
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: '#F8FAFF',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: font.md,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.accent,
  },
});

// ─── Robot Mascot ────────────────────────────────────────────────────────────
function RobotMascot({ step }) {
  const bobAnim    = useRef(new Animated.Value(0)).current;
  const blinkAnim  = useRef(new Animated.Value(1)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  // Idle bob
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Eye blink every 3s
  useEffect(() => {
    const doBlink = () => {
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.08, duration: 70,  useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 70,  useNativeDriver: false }),
      ]).start();
    };
    const t = setInterval(doBlink, 3200);
    return () => clearInterval(t);
  }, []);

  // Pulse on step change
  useEffect(() => {
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [step.tag]);

  // Forge glow
  useEffect(() => {
    if (step.mood === 'forge') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [step.mood]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E3A8A', '#EA580C'],
  });

  const MOOD_CHAR = {
    scan:  '—',
    think: '?',
    score: '%',
    map:   '>',
    forge: '!',
    write: '~',
  };

  return (
    <Animated.View style={{ transform: [{ translateY: bobAnim }, { scale: pulseAnim }] }}>
      {/* Antenna */}
      <View style={robot.antennaWrap}>
        <View style={robot.antennaStem} />
        <View style={[robot.antennaDot, { backgroundColor: step.eyeColor }]} />
      </View>

      {/* Head */}
      <Animated.View style={[robot.head, { borderColor }]}>
        {/* Eyes row */}
        <View style={robot.eyeRow}>
          <Animated.View style={[robot.eye, { backgroundColor: step.eyeColor, transform: [{ scaleY: blinkAnim }] }]}>
            <Text style={robot.eyeChar}>{MOOD_CHAR[step.mood]}</Text>
          </Animated.View>
          <Animated.View style={[robot.eye, { backgroundColor: step.eyeColor, transform: [{ scaleY: blinkAnim }] }]}>
            <Text style={robot.eyeChar}>{MOOD_CHAR[step.mood]}</Text>
          </Animated.View>
        </View>
        {/* Mouth */}
        <View style={[robot.mouth, step.mood === 'forge' ? robot.mouthExcited : null]} />
      </Animated.View>

      {/* Body */}
      <View style={robot.bodyWrap}>
        <View style={[robot.body, { borderColor: step.eyeColor }]}>
          <View style={[robot.bodyLight, { backgroundColor: step.eyeColor }]} />
        </View>
      </View>
    </Animated.View>
  );
}

export default function ProcessingScreen({ navigation, route }) {
  const { resumeId, resumeText, jobText } = route.params;
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function run() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Your session expired. Please sign in again.');
          return;
        }
        const result = await generate(resumeText, jobText, resumeId, session.access_token);
        navigation.replace('Results', { result });
      } catch (err) {
        if (err.code === 'FREE_TIER_LIMIT') {
          navigation.replace('Paywall');
        } else {
          setError(err.message || 'Something went wrong. Please try again.');
        }
      }
    }
    run();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Generation Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const step = STEPS[stepIndex];

  return (
    <View style={styles.container}>
      {/* Tag chip */}
      <View style={[styles.tagChip, { borderColor: step.eyeColor }]}>
        <Text style={[styles.tagText, { color: step.eyeColor }]}>{step.tag}</Text>
      </View>

      {/* Robot mascot */}
      <View style={styles.robotWrap}>
        <RobotMascot step={step} />
      </View>

      {/* Step label */}
      <Text style={styles.stepLabel}>{step.label}</Text>
      <Text style={styles.stepSub}>{step.sub}</Text>

      {/* Step dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex && styles.dotActive,
              i === stepIndex && { backgroundColor: step.eyeColor },
              i < stepIndex && styles.dotDone,
            ]}
          />
        ))}
      </View>

      <Text style={styles.hint}>Usually takes about a minute</Text>
    </View>
  );
}


