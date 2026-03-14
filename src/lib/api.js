// ResumeForge AI — Backend API helper
// All calls to the backend go through this file

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Attach the user's JWT token to every request so the backend knows who they are
function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Upload a resume file and get back extracted text + a resume_id
export async function uploadResume(fileUri, fileName, mimeType, token) {
  const formData = new FormData();
  formData.append('resume', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  });

  const res = await fetch(`${API_URL}/upload/resume`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed.');
  return data;
}

// Submit a job description as plain text
export async function submitJob(jobText, token) {
  const res = await fetch(`${API_URL}/scrape/job`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ text: jobText }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Job submission failed.');
  return data;
}

// Scrape a job description from a URL (Indeed, ZipRecruiter, generic)
// Returns { text, source } on success
// Throws with err.code === 'LINKEDIN_LOGIN_REQUIRED' for LinkedIn pages
export async function scrapeJobUrl(url, token) {
  const res = await fetch(`${API_URL}/scrape/job-url`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  if (res.status === 422 && data.code === 'LINKEDIN_LOGIN_REQUIRED') {
    const err = new Error(data.error);
    err.code = 'LINKEDIN_LOGIN_REQUIRED';
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Could not fetch job from URL.');
  return data;
}

// Run the full AI pipeline — returns optimized resume + cover letter
export async function generate(resumeText, jobText, resumeId, token) {
  const res = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      resume_text: resumeText,
      job_text: jobText,
      resume_id: resumeId,
    }),
  });

  const data = await res.json();
  if (res.status === 402) {
    const err = new Error(data.error || 'Free tier limit reached.');
    err.code = 'FREE_TIER_LIMIT';
    throw err;
  }
  if (!res.ok) throw new Error(data.error || 'Generation failed.');
  return data;
}

// Fetch the user's document history
export async function getDocuments(token) {
  const res = await fetch(`${API_URL}/documents`, {
    headers: authHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch documents.');
  return data;
}
