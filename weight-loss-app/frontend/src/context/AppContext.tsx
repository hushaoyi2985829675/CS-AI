import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, InventoryItem, InventoryItemUpdate, InventoryStats, AnalysisReport } from '../types';
import * as api from '../api';

interface AppContextType {
  user: User | null;
  inventoryItems: InventoryItem[];
  inventoryStats: InventoryStats | null;
  latestReport: AnalysisReport | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  fetchData: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  addItem: (item: any) => Promise<void>;
  updateItem: (itemId: number, data: InventoryItemUpdate) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  runAnalysis: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [latestReport, setLatestReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refreshInventory = async () => {
    const [items, stats] = await Promise.all([
      api.getInventoryItems(),
      api.getInventoryStats(),
    ]);
    setInventoryItems(items);
    setInventoryStats(stats);
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await api.login(username, password);
      setIsLoggedIn(true);
      await fetchData();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      await api.register(userData);
      await api.login(userData.username, userData.password);
      setIsLoggedIn(true);
      await fetchData();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  const logout = async () => {
    await api.clearToken();
    setUser(null);
    setInventoryItems([]);
    setInventoryStats(null);
    setLatestReport(null);
    setIsLoggedIn(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      setIsLoggedIn(true);
      setInventoryItems([]);
      setInventoryStats(null);
      setLatestReport(null);
      return userData;
    } catch {
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (item: any) => {
    setIsLoading(true);
    try {
      await api.addInventoryItem(item);
      await refreshInventory();
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: number, data: InventoryItemUpdate) => {
    setIsLoading(true);
    try {
      await api.updateInventoryItem(itemId, data);
      await refreshInventory();
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      await api.deleteInventoryItem(itemId);
      await refreshInventory();
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const content = await api.generateAnalysis();
      setLatestReport({
        id: Date.now(),
        userId: user?.id || 0,
        title: 'AI 库存分析报告',
        content,
        analysisType: 'general',
        totalValue: inventoryStats?.totalValue,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData().then((userData) => {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('steam_bind') === 'success') {
          window.history.replaceState({}, '', window.location.pathname);
          fetchData();
        }
      }
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        inventoryItems,
        inventoryStats,
        latestReport,
        isLoading,
        isLoggedIn,
        login,
        register,
        logout,
        fetchData,
        refreshInventory,
        addItem,
        updateItem,
        removeItem,
        runAnalysis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
