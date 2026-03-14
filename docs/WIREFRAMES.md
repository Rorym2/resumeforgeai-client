# ResumeForge AI — Screen Wireframes
_Last updated: 2026-03-14_

These wireframes cover every screen in the app — both built and planned. They are intended for the designer and advisor developer as a reference for UI/UX decisions.

---

## App Flow Overview

```
┌─────────────┐     ┌──────────────┐
│  Onboarding │────▶│  Login /     │
│  (Phase 9)  │     │  Sign Up     │
└─────────────┘     └──────┬───────┘
                           │ signed in
                           ▼
                    ┌──────────────┐
                    │  Home Screen │  ◀── always returns here after Results
                    │  (Upload)    │
                    └──────┬───────┘
                           │ resume uploaded
                           ▼
                    ┌──────────────┐
                    │  Job Input   │
                    └──────┬───────┘
                           │ "Generate" tapped
                           ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  Processing  │────▶│   Results    │
                    │  (Loading)   │     │  (Resume /   │
                    └──────────────┘     │  Cover Ltr)  │
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │   History    │
                                         │  (Phase 8)   │
                                         └──────────────┘
```

---

## Screen 1 — Login / Sign Up
**Status:** NOT YET BUILT (Phase 5)
**Route:** Shown automatically when no active session

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│        [App Logo / Icon]        │
│                                 │
│       ResumeForge AI            │
│   Land your next job faster     │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Email address            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Password          👁     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Sign In              │  │  ← primary button (full width)
│  └───────────────────────────┘  │
│                                 │
│       Forgot password?          │  ← text link
│                                 │
│  ─────────────  or  ──────────  │
│                                 │
│       Don't have an account?    │
│       [ Create Account ]        │  ← toggles to signup view
│                                 │
└─────────────────────────────────┘
```

**Sign Up view** (same screen, toggled):
```
┌─────────────────────────────────┐
│                                 │
│        [App Logo / Icon]        │
│       Create your account       │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Full name                │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Email address            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Password          👁     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Create Account       │  │
│  └───────────────────────────┘  │
│                                 │
│  Already have an account?       │
│       [ Sign In ]               │
│                                 │
└─────────────────────────────────┘
```

---

## Screen 2 — Home (Resume Upload)
**Status:** BUILT (Phase 4)
**Route:** `Home`

```
┌─────────────────────────────────┐
│  ResumeForge AI          [≡]    │  ← nav bar / hamburger (Phase 9)
├─────────────────────────────────┤
│                                 │
│   ResumeForge AI                │  ← large heading
│   Upload your resume and we'll  │
│   tailor it to any job —        │
│   instantly.                    │
│                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│                                 │
│  │         📄                │  │
│                                 │
│  │     Upload Resume         │  │  ← dashed border upload zone
│       PDF or DOCX · Max 10MB    │
│  │                           │  │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                 │
│  ← after upload, box turns green:
│                                 │
│  ┌───────────────────────────┐  │
│  │  ✓  my_resume.pdf         │  │  ← success state, green border
│  │     Tap to change         │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Next: Add Job Description│  │  ← only appears after upload
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Notes for designer:**
- Upload zone should feel inviting — large tap target
- Green success state gives clear confirmation
- "Next" button only appears after successful upload (not before)

---

## Screen 3 — Job Input
**Status:** BUILT (Phase 4)
**Route:** `JobInput`

```
┌─────────────────────────────────┐
│  ← Job Description              │  ← nav header with back button
├─────────────────────────────────┤
│                                 │
│   Paste the job description     │  ← heading
│   Copy the full job posting.    │
│   More detail = better match.   │
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │  Paste job description    │  │
│  │  here...                  │  │  ← large multiline text input
│  │                           │  │     min height ~280px
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│   87 more characters needed     │  ← char counter, turns green when ready
│                                 │
│  ┌───────────────────────────┐  │
│  │  Generate Optimized Resume│  │  ← disabled (gray) until 100+ chars
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Notes for designer:**
- Keyboard should push the button up (KeyboardAvoidingView is implemented)
- Character counter is live feedback — changes color when ready
- Button stays gray/disabled until minimum length met

**Future addition (Phase 7):**
```
│   ─────── or paste a URL ───── │
│  ┌───────────────────────────┐  │
│  │  https://linkedin.com/... │  │  ← URL input field
│  └───────────────────────────┘  │
```

---

## Screen 4 — Processing (Loading)
**Status:** BUILT (Phase 4)
**Route:** `Processing`
**Note:** Back button is hidden on this screen — user cannot navigate back during generation.

```
┌─────────────────────────────────┐
│  Generating...                  │  ← nav header (no back button)
├─────────────────────────────────┤
│                                 │
│                                 │
│                                 │
│           ⟳                    │  ← large spinner (ActivityIndicator)
│                                 │
│    Rewriting for ATS...         │  ← step label, cycles every 4 seconds:
│                                 │     "Parsing your resume..."
│  This usually takes 20–30 sec   │     "Analyzing the job listing..."
│                                 │     "Scoring your match..."
│                                 │     "Finding your strengths..."
│                                 │     "Rewriting for ATS..."
│                                 │     "Writing your cover letter..."
│                                 │
│                                 │
│   ── Error state (if it fails) ─│
│                                 │
│           ⚠️                    │
│     Generation Failed           │
│   [error message here]          │
│                                 │
└─────────────────────────────────┘
```

**Notes for designer:**
- This screen is purely informational — no buttons, no interaction
- Animated step labels keep user engaged during the 20–30 second wait
- Consider a subtle progress bar or pulsing animation (not yet implemented)

---

## Screen 5 — Results
**Status:** BUILT (Phase 4)
**Route:** `Results`

```
┌─────────────────────────────────┐
│  ← Your Results                 │  ← nav header
├─────────────────────────────────┤
│                                 │
│  [Match Score: 87%]             │  ← colored badge (only if score returned)
│                                 │
│  ┌──────────┬──────────────┐    │
│  │  Resume  │ Cover Letter │    │  ← tab bar
│  └──────────┴──────────────┘    │
│                                 │
│  ┌───────────────────────────┐  │
│  │ JOHN SMITH                │  │
│  │ john@email.com            │  │
│  │ New York, NY              │  │
│  │                           │  │
│  │ SUMMARY                   │  │  ← scrollable content area
│  │ Results-driven marketing  │  │     shows Resume or Cover Letter
│  │ professional with 8 years │  │     depending on active tab
│  │ experience...             │  │
│  │                           │  │
│  │ EXPERIENCE                │  │
│  │ Senior Manager — Acme Co  │  │
│  │ 2021 – Present            │  │
│  │ • Led team of 12...       │  │
│  │ • Increased revenue by... │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  📋 Copy to Clipboard     │  │  ← NOT YET BUILT (Phase 9 polish)
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Notes for designer:**
- Match score badge color should reflect score quality: green (80+), amber (60–79), red (<60)
- Active tab should have a clear visual distinction
- The text content is monospace right now — designer should spec a better font
- "Copy to Clipboard" and "Share" / "Download" actions are not yet built

---

## Screen 6 — Paywall / Subscription
**Status:** NOT YET BUILT (Phase 6)
**Route:** `Paywall` — shown when free tier limit (3/month) is reached

```
┌─────────────────────────────────┐
│  ✕                              │  ← dismiss button (if allowed)
├─────────────────────────────────┤
│                                 │
│      🚀                         │
│                                 │
│   You've used your 3 free       │
│   generations this month.       │
│                                 │
│   Upgrade to ResumeForge Pro    │
│   for unlimited tailored        │
│   resumes and cover letters.    │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ⭐ Monthly — $9.99/mo    │  │  ← subscription option
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ ⭐ Annual — $59.99/yr    │  │  ← subscription option (best value)
│  │    Save 50%               │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    Start Free Trial       │  │  ← primary CTA
│  └───────────────────────────┘  │
│                                 │
│  Restore Purchase               │  ← required by Apple / Google
│  Terms · Privacy                │
│                                 │
└─────────────────────────────────┘
```

**Notes for developer:**
- Pricing and trial details TBD — placeholder values above
- Will use RevenueCat SDK for purchase handling
- Must include "Restore Purchase" per App Store / Play Store guidelines

---

## Screen 7 — Document History
**Status:** NOT YET BUILT (Phase 8)
**Route:** `History` — accessible from nav or after Results screen

```
┌─────────────────────────────────┐
│  My Resumes                     │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📄 Software Engineer      │  │
│  │    Acme Corp              │  │  ← job title + company (from generation)
│  │    Mar 12 · Match: 91%    │  │  ← date + score
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📄 Product Manager        │  │
│  │    TechStartup Inc        │  │
│  │    Mar 10 · Match: 74%    │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📄 Marketing Director     │  │
│  │    BigCo                  │  │
│  │    Mar 8 · Match: 83%     │  │
│  └───────────────────────────┘  │
│                                 │
│   ─── empty state ────────────  │
│                                 │
│        📂                       │
│   No resumes yet.               │
│   Upload your resume to get     │
│   started.                      │
│                                 │
└─────────────────────────────────┘
```

---

## Screen 8 — Onboarding
**Status:** NOT YET BUILT (Phase 9)
**Route:** Shown only on first launch, before Login

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│                                 │   │                                 │   │                                 │
│          📄→✨→💼               │   │          🎯                    │   │          🔒                    │
│                                 │   │                                 │   │                                 │
│   Beat the ATS.                 │   │   Tailored to every job.        │   │   3 free. Unlimited with Pro.   │
│   Land more interviews.         │   │   Paste any job description     │   │   Try it free — no card needed  │
│                                 │   │   and we'll customize your      │   │                                 │
│   AI-powered resume             │   │   resume in seconds.            │   │                                 │
│   optimization in seconds.      │   │                                 │   │                                 │
│                                 │   │                                 │   │  ┌─────────────────────────┐   │
│         ●  ○  ○                 │   │         ○  ●  ○                 │   │  │   Get Started Free      │   │
│                                 │   │                                 │   │  └─────────────────────────┘   │
│  ┌───────────────────────────┐  │   │  ┌───────────────────────────┐  │   │                                 │
│  │        Next →             │  │   │  │        Next →             │  │   │  Already have an account?       │
│  └───────────────────────────┘  │   │  └───────────────────────────┘  │   │  Sign in                        │
│                                 │   │                                 │   │                                 │
└─────────────────────────────────┘   └─────────────────────────────────┘   └─────────────────────────────────┘
      Slide 1 of 3                          Slide 2 of 3                          Slide 3 of 3
```

---

## Summary: Screen Build Status

| Screen | Route | Status | Phase |
|---|---|---|---|
| Onboarding | — | Not built | 9 |
| Login / Sign Up | `Login` | Not built | 5 |
| Home (Upload) | `Home` | ✅ Built | 4 |
| Job Input | `JobInput` | ✅ Built | 4 |
| Processing | `Processing` | ✅ Built | 4 |
| Results | `Results` | ✅ Built | 4 |
| Paywall | `Paywall` | Not built | 6 |
| Document History | `History` | Not built | 8 |

---

## Design Notes for the Designer

When you bring in a designer, here are the key decisions still to be made:

1. **Brand colors** — current palette is placeholder indigo. Replace in `src/theme/index.js`.
2. **Typography** — no custom fonts loaded yet. Using system defaults. Load via `expo-font`.
3. **App icon + splash screen** — placeholder assets in `assets/`. Needs final brand assets.
4. **Match score color coding** — green/amber/red thresholds need designer sign-off.
5. **Paywall design** — high stakes screen, worth investing design time here.
6. **Micro-animations** — Processing screen would benefit from a custom animation (Lottie or Reanimated).
7. **Empty states** — History screen and any error states need illustration/icon treatment.
