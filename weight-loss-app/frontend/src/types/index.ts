export interface User {
  id: number;
  username: string;
  email: string;
  steamId?: string;
}

export interface InventoryItem {
  id: number;
  userId: number;
  weaponType: string;
  skinName: string;
  rarity: string;
  wear: string;
  floatValue?: number;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalysisReport {
  id: number;
  userId: number;
  title: string;
  content: string;
  analysisType: string;
  totalValue?: number;
  createdAt?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  totalQuantity: number;
  rarityDistribution: Record<string, number>;
  weaponDistribution: Record<string, number>;
  mostValuableItem?: InventoryItem;
}

export interface Token {
  accessToken: string;
  tokenType: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  steamId?: string;
}

export interface InventoryItemCreate {
  weaponType: string;
  skinName: string;
  rarity: string;
  wear: string;
  floatValue?: number;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
}

export interface InventoryItemUpdate {
  weaponType?: string;
  skinName?: string;
  rarity?: string;
  wear?: string;
  floatValue?: number;
  price?: number;
  quantity?: number;
  imageUrl?: string;
  notes?: string;
}
