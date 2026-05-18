const BASE = '';

export async function saveAssessment(payload) {
  const res = await fetch(`${BASE}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return res.json();
}

export async function fetchAssessments(limit = 5) {
  const res = await fetch(`${BASE}/api/assessments?limit=${limit}`);
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return res.json();
}
