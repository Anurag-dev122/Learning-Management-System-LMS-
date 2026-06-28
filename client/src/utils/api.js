const getUserId = () => localStorage.getItem('userId') || null;
const getRole = () => localStorage.getItem('role') || null;
const getUserName = () => localStorage.getItem('userName') || null;

const headers = () => {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getUserId() || ''
  };
};

export const API = {
  getUserId,
  getRole,
  getUserName,

  setSession(id, name, role) {
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.setItem('role', role);
  },

  clearSession() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
  },

  async get(url) {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  async upload(url, formData) {
    const customHeaders = {
      'x-user-id': getUserId() || ''
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: customHeaders,
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
