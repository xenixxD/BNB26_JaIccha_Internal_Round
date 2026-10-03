import { get, set, del } from 'idb-keyval';

/**
 * Client-side IndexedDB binary storage helper for large video/audio Blobs.
 * Avoids consuming localStorage quotas.
 */
export const storageService = {
  async saveBlob(id, blob) {
    try {
      await set(`blob_${id}`, blob);
      return true;
    } catch (err) {
      console.error('Failed to save Blob in IndexedDB:', err);
      return false;
    }
  },

  async getBlob(id) {
    try {
      const blob = await get(`blob_${id}`);
      return blob || null;
    } catch (err) {
      console.error('Failed to retrieve Blob from IndexedDB:', err);
      return null;
    }
  },

  async removeBlob(id) {
    try {
      await del(`blob_${id}`);
      return true;
    } catch (err) {
      console.error('Failed to delete Blob from IndexedDB:', err);
      return false;
    }
  }
};
