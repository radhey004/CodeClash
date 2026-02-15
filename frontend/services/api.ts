const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchAPI = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    fetchAPI(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    }),

  login: (email: string, password: string) =>
    fetchAPI(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }),

  getMe: () => fetchAPI(`${API_URL}/auth/me`, { headers: getAuthHeader() }),

  forgotPassword: (email: string) =>
    fetchAPI(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }),

  resetPassword: (token: string, password: string) =>
    fetchAPI(`${API_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
};

export const problemAPI = {
  getProblems: () => fetchAPI(`${API_URL}/problems`, { headers: getAuthHeader() }),
  getRandomProblem: () => fetchAPI(`${API_URL}/problems/random`, { headers: getAuthHeader() }),
  getProblem: (id: string) => fetchAPI(`${API_URL}/problems/${id}`, { headers: getAuthHeader() })
};

export const battleAPI = {
  createBattle: () =>
    fetchAPI(`${API_URL}/battles/create`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
    }),

  submitCode: (battleId: string, code: string, language: string) =>
    fetchAPI(`${API_URL}/battles/submit`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ battleId, code, language })
    }),

  getBattle: (id: string) => fetchAPI(`${API_URL}/battles/${id}`, { headers: getAuthHeader() }),
  getUserBattles: () => fetchAPI(`${API_URL}/battles/user`, { headers: getAuthHeader() })
};

export const leaderboardAPI = {
  getLeaderboard: (type: 'global' | 'weekly' = 'global') =>
    fetchAPI(`${API_URL}/leaderboard?type=${type}`, { headers: getAuthHeader() }),
  getMyLeague: () => fetchAPI(`${API_URL}/leaderboard/my-league`, { headers: getAuthHeader() }),
  getTopPlayers: () => fetchAPI(`${API_URL}/leaderboard/top-players`, { headers: getAuthHeader() })
};

export const friendAPI = {
  searchUsers: (query: string) =>
    fetchAPI(`${API_URL}/friends/search?query=${encodeURIComponent(query)}`, { headers: getAuthHeader() }),
  getFriends: () => fetchAPI(`${API_URL}/friends`, { headers: getAuthHeader() }),
  getPendingRequests: () => fetchAPI(`${API_URL}/friends/pending`, { headers: getAuthHeader() }),
  getSentRequests: () => fetchAPI(`${API_URL}/friends/sent`, { headers: getAuthHeader() }),
  
  sendFriendRequest: (recipientId: string) =>
    fetchAPI(`${API_URL}/friends/request`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId })
    }),

  acceptFriendRequest: (requestId: string) =>
    fetchAPI(`${API_URL}/friends/accept/${requestId}`, { method: 'POST', headers: getAuthHeader() }),
  
  declineFriendRequest: (requestId: string) =>
    fetchAPI(`${API_URL}/friends/decline/${requestId}`, { method: 'POST', headers: getAuthHeader() }),
  
  cancelFriendRequest: (requestId: string) =>
    fetchAPI(`${API_URL}/friends/cancel/${requestId}`, { method: 'DELETE', headers: getAuthHeader() }),
  
  removeFriend: (friendshipId: string) =>
    fetchAPI(`${API_URL}/friends/${friendshipId}`, { method: 'DELETE', headers: getAuthHeader() })
};
