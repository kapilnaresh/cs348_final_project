const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export async function seedBasic() {
  const res = await fetch(`${API_BASE}/seed/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed');
  return res.json();
}

export async function getTeams() {
  const res = await fetch(`${API_BASE}/ref/teams`);
  if (!res.ok) throw new Error('Failed to load teams');
  return res.json();
}

export async function getPlayers() {
  const res = await fetch(`${API_BASE}/ref/players`);
  if (!res.ok) throw new Error('Failed to load players');
  return res.json();
}

export async function createTeam(payload) {
  const res = await fetch(`${API_BASE}/ref/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create team');
  return res.json();
}

export async function createPlayer(payload) {
  const res = await fetch(`${API_BASE}/ref/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create player');
  return res.json();
}

export async function deleteTeam(id) {
  const res = await fetch(`${API_BASE}/ref/teams/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete team');
  }
  return res.json();
}

export async function deletePlayer(id) {
  const res = await fetch(`${API_BASE}/ref/players/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete player');
  }
  return res.json();
}

export async function createParlay(payload) {
  const res = await fetch(`${API_BASE}/parlays/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create parlay');
  return res.json();
}

export async function listParlays(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/parlays/?${query}`);
  if (!res.ok) throw new Error('Failed to load parlays');
  return res.json();
}

export async function updateParlay(id, payload) {
  const res = await fetch(`${API_BASE}/parlays/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log("body is " + JSON.stringify(payload) + "\n")
  if (!res.ok) {
    let errorMessage = `Failed to update parlay: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      // If JSON parsing fails, use default message
    }
    console.error('Update error details:', { status: res.status, payload, errorMessage });
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function deleteParlay(id) {
  const res = await fetch(`${API_BASE}/parlays/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete parlay');
  return res.json();
}

export async function reportSummary(filters) {
  const res = await fetch(`${API_BASE}/reports/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  if (!res.ok) throw new Error('Failed to load report');
  return res.json();
}


