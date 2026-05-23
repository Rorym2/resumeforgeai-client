import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { exportDocx } from './api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitize(val) {
  return (val && val !== 'undefined' && val !== 'null') ? String(val) : '';
}

function formatDates(item) {
  if (sanitize(item.dates)) return item.dates;
  const start = sanitize(item.start_date);
  const end = sanitize(item.end_date);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  return '';
}

// ─── Plain-text builder ─────────────────────────────────────────────────────

function buildResumeText(resume) {
  if (!resume) return '';
  if (typeof resume === 'string') return resume;
  const r = resume;
  const lines = [];

  if (r.contact) {
    if (r.contact.name) lines.push(r.contact.name);
    const contactLine = [r.contact.email, r.contact.phone, r.contact.location].filter(Boolean).join(' | ');
    if (contactLine) lines.push(contactLine);
    lines.push('');
  }

  if (r.summary) {
    lines.push('SUMMARY');
    lines.push('─'.repeat(60));
    lines.push(r.summary);
    lines.push('');
  }

  const experience = r.experience || r.work_experience || [];
  if (experience.length) {
    lines.push('EXPERIENCE');
    lines.push('─'.repeat(60));
    experience.forEach(job => {
      const title = sanitize(job.title || job.role);
      const company = sanitize(job.company || job.organization);
      const dates = formatDates(job);
      if (company) lines.push(`${company}${dates ? `  ${dates}` : ''}`);
      if (title) lines.push(title);
      (job.bullets || job.responsibilities || []).forEach(b => lines.push(`  • ${b}`));
      lines.push('');
    });
  }

  const skills = r.skills;
  if (skills) {
    lines.push('SKILLS');
    lines.push('─'.repeat(60));
    if (Array.isArray(skills)) {
      lines.push(skills.join(' | '));
    } else if (typeof skills === 'object') {
      const all = [...(skills.technical || []), ...(skills.languages || []), ...(skills.other || [])];
      if (all.length) lines.push(all.join(' | '));
    }
    lines.push('');
  }

  const education = r.education || [];
  if (education.length) {
    lines.push('EDUCATION');
    lines.push('─'.repeat(60));
    education.forEach(e => {
      const institution = sanitize(e.institution || e.school);
      const degree = sanitize(e.degree || e.field);
      const dates = formatDates(e) || sanitize(e.graduation_date);
      if (institution) lines.push(`${institution}${dates ? `  ${dates}` : ''}`);
      if (degree) lines.push(degree);
      lines.push('');
    });
  }

  const leadership = r.leadership_activities || r.leadership || [];
  if (leadership.length) {
    lines.push('LEADERSHIP & ACTIVITIES');
    lines.push('─'.repeat(60));
    leadership.forEach(item => {
      const org = sanitize(item.organization);
      const role = sanitize(item.role || item.title);
      const dates = formatDates(item);
      if (org) lines.push(`${org}${dates ? `  ${dates}` : ''}`);
      if (role) lines.push(role);
      (item.bullets || []).forEach(b => lines.push(`  • ${b}`));
      lines.push('');
    });
  }

  return lines.join('\n');
}

function buildCoverLetterText(coverLetter) {
  if (!coverLetter) return '';
  if (typeof coverLetter === 'string') return coverLetter;
  return coverLetter.body || coverLetter.text || '';
}

// ─── Harvard-style HTML builder ─────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildResumeHtml(resume) {
  if (!resume || typeof resume === 'string') return `<p>${escapeHtml(resume || '')}</p>`;
  const r = resume;
  let html = '';

  // Contact header
  if (r.contact) {
    const name = escapeHtml(sanitize(r.contact.name));
    const contactLine = [r.contact.email, r.contact.phone, r.contact.location]
      .filter(Boolean).map(escapeHtml).join(' &nbsp;|&nbsp; ');
    html += `
      <div class="name">${name}</div>
      <div class="contact">${contactLine}</div>
      <div class="divider-thin"></div>
    `;
  }

  // Summary
  if (r.summary) {
    html += `
      <div class="section-header">SUMMARY</div>
      <p class="summary">${escapeHtml(r.summary)}</p>
    `;
  }

  // Experience
  const experience = r.experience || r.work_experience || [];
  if (experience.length) {
    html += `<div class="section-header">EXPERIENCE</div>`;
    experience.forEach((job) => {
      const company = escapeHtml(sanitize(job.company || job.organization));
      const title = escapeHtml(sanitize(job.title || job.role));
      const dates = escapeHtml(formatDates(job));
      html += `<div class="entry-header"><span class="entry-org">${company}</span><span class="entry-date">${dates}</span></div>`;
      if (title) html += `<div class="entry-title">${title}</div>`;
      const bullets = job.bullets || job.responsibilities || [];
      if (bullets.length) {
        html += `<ul>` + bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('') + `</ul>`;
      }
    });
  }

  // Skills
  const skills = r.skills;
  if (skills) {
    let skillList = [];
    if (Array.isArray(skills)) {
      skillList = skills;
    } else if (typeof skills === 'object') {
      skillList = [...(skills.technical || []), ...(skills.languages || []), ...(skills.other || [])];
    }
    if (skillList.length) {
      html += `
        <div class="section-header">SKILLS</div>
        <p class="skills-list">${skillList.map(escapeHtml).join(' &nbsp;&middot;&nbsp; ')}</p>
      `;
    }
  }

  // Education
  const education = r.education || [];
  if (education.length) {
    html += `<div class="section-header">EDUCATION</div>`;
    education.forEach(e => {
      const institution = escapeHtml(sanitize(e.institution || e.school));
      const degree = escapeHtml(sanitize(e.degree || e.field));
      const dates = escapeHtml(formatDates(e) || sanitize(e.graduation_date));
      html += `<div class="entry-header"><span class="entry-org">${institution}</span><span class="entry-date">${dates}</span></div>`;
      if (degree) html += `<div class="entry-title">${degree}</div>`;
    });
  }

  // Leadership
  const leadership = r.leadership_activities || r.leadership || [];
  if (leadership.length) {
    html += `<div class="section-header">LEADERSHIP &amp; ACTIVITIES</div>`;
    leadership.forEach(item => {
      const org = escapeHtml(sanitize(item.organization));
      const role = escapeHtml(sanitize(item.role || item.title));
      const dates = escapeHtml(formatDates(item));
      html += `<div class="entry-header"><span class="entry-org">${org}</span><span class="entry-date">${dates}</span></div>`;
      if (role) html += `<div class="entry-title">${role}</div>`;
      const bullets = item.bullets || [];
      if (bullets.length) {
        html += `<ul>` + bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('') + `</ul>`;
      }
    });
  }

  return html;
}

function buildCoverLetterHtml(coverLetter, contactName) {
  let text = '';
  if (typeof coverLetter === 'string') text = coverLetter;
  else text = coverLetter?.body || coverLetter?.text || '';

  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  const body = paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');

  return `
    ${contactName ? `<div class="name">${escapeHtml(contactName)}</div><div class="divider-thin"></div>` : ''}
    <div class="cover-letter-body">${body}</div>
  `;
}

const HARVARD_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #000;
    margin: 72pt;
    line-height: 1.35;
  }
  .name {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 4pt;
  }
  .contact {
    font-size: 10pt;
    text-align: center;
    margin-bottom: 8pt;
  }
  .divider-thin {
    border-top: 1px solid #000;
    margin-bottom: 10pt;
  }
  .section-header {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    border-bottom: 1px solid #000;
    margin-top: 12pt;
    margin-bottom: 5pt;
    padding-bottom: 2pt;
  }
  .summary {
    margin-bottom: 4pt;
  }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 6pt;
  }
  .entry-org {
    font-weight: bold;
    font-size: 11pt;
  }
  .entry-date {
    font-size: 10pt;
    white-space: nowrap;
    margin-left: 8pt;
  }
  .entry-title {
    font-style: italic;
    font-size: 11pt;
    margin-bottom: 3pt;
  }
  ul {
    margin-left: 18pt;
    margin-bottom: 4pt;
  }
  li {
    margin-bottom: 2pt;
    font-size: 11pt;
  }
  .skills-list {
    margin-bottom: 4pt;
  }
  .cover-letter-body p {
    margin-bottom: 10pt;
    text-align: left;
  }
`;

function wrapHtml(bodyContent) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${HARVARD_CSS}</style>
</head>
<body>${bodyContent}</body>
</html>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function exportAsPdf(type, result) {
  const contactName = result.optimized_resume?.contact?.name || null;
  const htmlBody = type === 'resume'
    ? buildResumeHtml(result.optimized_resume)
    : buildCoverLetterHtml(result.cover_letter, contactName);

  await Print.printAsync({ html: wrapHtml(htmlBody) });
}

export async function exportAsWord(type, result) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Session expired. Please sign in again.');

  const apiType = type === 'cover' ? 'cover_letter' : type;
  console.log('[exportAsWord] type:', type, '→ apiType:', apiType);

  const blob = await exportDocx(apiType, result, session.access_token);
  console.log('[exportAsWord] blob received, size:', blob?.size);

  // Convert blob to base64 and write to cache
  const filename = type === 'resume' ? 'Resume.docx' : 'CoverLetter.docx';
  const dest = FileSystem.cacheDirectory + filename;

  const reader = new FileReader();
  const base64 = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });
  console.log('[exportAsWord] file written to:', dest);
  await Sharing.shareAsync(dest, {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    dialogTitle: `Open ${filename}`,
  });
}
