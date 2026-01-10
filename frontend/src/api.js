const API_BASE = "http://localhost:8000";

export function getAuthHeaders() {
  return {
    "X-Api-Key": localStorage.getItem("apiKey"),
    "X-Api-Secret": localStorage.getItem("apiSecret"),
  };
}

export async function getPayments() {
  const res = await fetch(`${API_BASE}/api/v1/payments`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}
