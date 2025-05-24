import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Cache duration in milliseconds
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,  // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Cache keys
export const CACHE_KEYS = {
  CATEGORIES: "categories",
  PAYMENT_TYPES: "payment_types",
  RECURRING_TRANSACTIONS: "recurring_transactions",
  PAYMENT_SCHEDULES: "payment_schedules",
  EXPENSES: "expenses",
  PROJECTED_PAYMENTS: "projected_payments",
} as const;

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  duration: number;
}

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<any>>();

// Helper to generate cache key
function generateCacheKey(key: string, userId: Id<"users">, params?: Record<string, any>): string {
  const paramString = params ? `:${JSON.stringify(params)}` : '';
  return `${key}:${userId}${paramString}`;
}

// Helper to get cached data
function getCachedData<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.duration) {
    cacheStore.delete(key);
    return null;
  }

  return entry.data;
}

// Helper to set cached data
function setCachedData<T>(key: string, data: T, duration: number): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
    duration,
  });
}

// Helper to invalidate cache
function invalidateCache(key: string): void {
  cacheStore.delete(key);
}

// Helper to invalidate all cache entries for a user
function invalidateUserCache(userId: Id<"users">): void {
  for (const [key] of cacheStore) {
    if (key.startsWith(`${userId}:`)) {
      cacheStore.delete(key);
    }
  }
}

// Cache middleware for queries
export function withCache<T>(
  key: string,
  duration: number,
  queryFn: () => Promise<T>
): Promise<T> {
  const cacheKey = key;
  const cachedData = getCachedData<T>(cacheKey);
  
  if (cachedData !== null) {
    return Promise.resolve(cachedData);
  }

  return queryFn().then(data => {
    setCachedData(cacheKey, data, duration);
    return data;
  });
}

// Export cache utilities
export const cache = {
  generateCacheKey,
  getCachedData,
  setCachedData,
  invalidateCache,
  invalidateUserCache,
  withCache,
}; 