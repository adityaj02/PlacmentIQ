/**
 * PlacementIQ – API Client Module
 * Connects React Frontend to FastAPI backend.
 */

const BASE_URL = 'http://127.0.0.1:8000/api';

export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function getModelInfo() {
  const res = await fetch(`${BASE_URL}/model-info`);
  if (!res.ok) throw new Error(`Failed to load model info: ${res.statusText}`);
  return res.json();
}

export async function predictPlacement(profile, decisionThreshold = 0.50) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      decision_threshold: decisionThreshold,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Prediction failed with status ${res.status}`);
  }
  return res.json();
}

export async function batchPredictPlacement(students, decisionThreshold = 0.50) {
  const res = await fetch(`${BASE_URL}/batch-predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      students,
      decision_threshold: decisionThreshold,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Batch prediction failed with status ${res.status}`);
  }
  return res.json();
}

export async function getExplanation(profile, topN = 12) {
  const res = await fetch(`${BASE_URL}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      top_n: topN,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Explanation failed with status ${res.status}`);
  }
  return res.json();
}

export async function getSkillGap(profile) {
  const res = await fetch(`${BASE_URL}/skill-gap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Skill-gap analysis failed with status ${res.status}`);
  }
  return res.json();
}

export async function simulateWhatIf(original, modifications, decisionThreshold = 0.50) {
  const res = await fetch(`${BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original,
      modifications,
      decision_threshold: decisionThreshold,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Simulation failed with status ${res.status}`);
  }
  return res.json();
}
