import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// SecureStore has a 2048-byte limit per key.
// Supabase session tokens exceed this, so we chunk large values across multiple keys.
const CHUNK_SIZE = 1800; // safely under the limit

const ChunkedSecureStoreAdapter = {
  async getItem(key) {
    // Check if this value was stored in chunks
    const chunkCount = await SecureStore.getItemAsync(`${key}__chunks`);
    if (chunkCount) {
      const parts = [];
      for (let i = 0; i < parseInt(chunkCount, 10); i++) {
        const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
        if (chunk == null) return null;
        parts.push(chunk);
      }
      return parts.join('');
    }
    // Fall back to reading as a single key (for small values)
    return SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    if (value.length <= CHUNK_SIZE) {
      // Small enough — store as a single key, clean up any old chunks
      await SecureStore.setItemAsync(key, value);
      await SecureStore.deleteItemAsync(`${key}__chunks`);
      return;
    }

    // Split into chunks and store each one
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunks[i]);
    }
    await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length));
    // Remove any plain key that might exist from before this fix
    await SecureStore.deleteItemAsync(key);
  },

  async removeItem(key) {
    const chunkCount = await SecureStore.getItemAsync(`${key}__chunks`);
    if (chunkCount) {
      for (let i = 0; i < parseInt(chunkCount, 10); i++) {
        await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}__chunks`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ChunkedSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
