const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(res);
}

export async function getAudits() {
  const res = await fetch(`${API_BASE_URL}/audits`);
  return handleResponse(res);
}

export async function uploadEvidence(payload) {
  const res = await fetch(`${API_BASE_URL}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

