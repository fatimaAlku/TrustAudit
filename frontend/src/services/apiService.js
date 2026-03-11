const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

async function handleResponse(response) {
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let message = `Request failed with status ${response.status}`;

    if (contentType.includes('application/json')) {
      try {
        const data = await response.json();
        if (data && (data.error || data.message)) {
          message = data.error || data.message;
        } else {
          message = JSON.stringify(data);
        }
      } catch {
        // fall through to default message
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
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

export async function createAudit(payload) {
  const res = await fetch(`${API_BASE_URL}/audits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateAudit(id, payload) {
  const res = await fetch(`${API_BASE_URL}/audits/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getControls(framework) {
  const url = new URL(`${API_BASE_URL}/controls`);
  if (framework) {
    url.searchParams.set('framework', framework);
  }
  const res = await fetch(url.toString());
  return handleResponse(res);
}

export async function getControlTests(auditId) {
  const res = await fetch(`${API_BASE_URL}/audits/${auditId}/control-tests`);
  return handleResponse(res);
}

export async function saveControlTest(auditId, payload) {
  const res = await fetch(`${API_BASE_URL}/audits/${auditId}/control-tests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getEvidence(auditId) {
  const res = await fetch(`${API_BASE_URL}/audits/${auditId}/evidence`);
  return handleResponse(res);
}

export async function createEvidence(auditId, payload) {
  const res = await fetch(`${API_BASE_URL}/audits/${auditId}/evidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

