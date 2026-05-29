import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User, Token, UserCreate, InventoryItem, InventoryItemCreate,
  InventoryItemUpdate, InventoryStats, AnalysisReport,
} from '../types';

const BASE_URL = 'http://localhost:8000';

let token: string | null = null;

export const setToken = async (newToken: string) => {
  token = newToken;
  await AsyncStorage.setItem('access_token', newToken);
};

export const getToken = async (): Promise<string | null> => {
  if (token) return token;
  const storedToken = await AsyncStorage.getItem('access_token');
  token = storedToken;
  return storedToken;
};

export const clearToken = async () => {
  token = null;
  await AsyncStorage.removeItem('access_token');
};

const authHeaders = async (): Promise<HeadersInit> => {
  const accessToken = await getToken();
  if (!accessToken) throw new Error('未登录');
  return { Authorization: `Bearer ${accessToken}` };
};

export const login = async (username: string, password: string): Promise<Token> => {
  const response = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '登录失败' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : '登录失败');
  }
  const data = await response.json();
  await setToken(data.accessToken);
  return data;
};

export const register = async (user: UserCreate): Promise<User> => {
  const response = await fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '注册失败' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : '注册失败');
  }
  return response.json();
};

export const getCurrentUser = async (): Promise<User> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/users/me`, { headers });
  if (!response.ok) throw new Error('获取用户信息失败');
  return response.json();
};

export const updateProfile = async (data: { steamId?: string }): Promise<User> => {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('更新资料失败');
  return response.json();
};

export const getInventoryItems = async (params?: {
  weapon_type?: string;
  rarity?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<InventoryItem[]> => {
  const headers = await authHeaders();
  const query = new URLSearchParams();
  if (params?.weapon_type) query.append('weapon_type', params.weapon_type);
  if (params?.rarity) query.append('rarity', params.rarity);
  if (params?.search) query.append('search', params.search);
  if (params?.skip !== undefined) query.append('skip', String(params.skip));
  if (params?.limit !== undefined) query.append('limit', String(params.limit));
  const qs = query.toString();
  const response = await fetch(`${BASE_URL}/api/inventory${qs ? `?${qs}` : ''}`, { headers });
  if (!response.ok) throw new Error('获取库存失败');
  return response.json();
};

export const getInventoryStats = async (): Promise<InventoryStats> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/inventory/stats`, { headers });
  if (!response.ok) throw new Error('获取统计失败');
  return response.json();
};

export const addInventoryItem = async (item: InventoryItemCreate): Promise<InventoryItem> => {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  const response = await fetch(`${BASE_URL}/api/inventory`, {
    method: 'POST',
    headers,
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error('添加物品失败');
  return response.json();
};

export const updateInventoryItem = async (itemId: number, data: InventoryItemUpdate): Promise<InventoryItem> => {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  const response = await fetch(`${BASE_URL}/api/inventory/${itemId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('更新物品失败');
  return response.json();
};

export const deleteInventoryItem = async (itemId: number): Promise<void> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/inventory/${itemId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('删除物品失败');
};

export const generateAnalysis = async (): Promise<string> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/analysis/generate/stream`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw new Error('生成分析失败');
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          fullContent += data;
        }
      }
    }
  }
  return fullContent;
};

export const getAnalysisReports = async (): Promise<AnalysisReport[]> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/analysis`, { headers });
  if (!response.ok) throw new Error('获取分析报告失败');
  return response.json();
};

export const getLatestAnalysisReport = async (): Promise<AnalysisReport> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/analysis/latest`, { headers });
  if (!response.ok) throw new Error('获取最新分析报告失败');
  return response.json();
};

export const getSteamLoginUrl = async (): Promise<string> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/auth/steam/login`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '获取Steam登录地址失败' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : '获取Steam登录地址失败');
  }
  const data = await response.json();
  return data.url;
};

export const getSteamDirectLoginUrl = async (): Promise<string> => {
  const response = await fetch(`${BASE_URL}/api/auth/steam/login-with-steam`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '获取Steam登录地址失败' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : '获取Steam登录地址失败');
  }
  const data = await response.json();
  return data.url;
};

export const getSteamInventory = async (userId: number): Promise<any> => {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}/api/auth/steam/inventory/${userId}`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '获取Steam库存失败' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : '获取Steam库存失败');
  }
  return response.json();
};
