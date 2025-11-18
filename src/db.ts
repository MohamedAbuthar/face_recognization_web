// IndexedDB storage using Dexie for face embeddings

import Dexie, { Table } from 'dexie';
import { StoredIdentity } from './types';

class FaceRecognitionDB extends Dexie {
  identities!: Table<StoredIdentity>;

  constructor() {
    super('FaceRecognitionDB');
    this.version(1).stores({
      identities: '++id, name, createdAt',
    });
  }
}

export const db = new FaceRecognitionDB();

/**
 * Save a face embedding with a name
 * @param name Identity name
 * @param embedding Face embedding vector
 */
export async function saveEmbedding(
  name: string,
  embedding: Float32Array
): Promise<number> {
  const identity: Omit<StoredIdentity, 'id'> = {
    name,
    embedding,
    createdAt: new Date(),
  };
  return await db.identities.add(identity as StoredIdentity);
}

/**
 * Get all stored identities
 */
export async function getAllIdentities(): Promise<StoredIdentity[]> {
  return await db.identities.toArray();
}

/**
 * Get identity by ID
 */
export async function getIdentityById(id: number): Promise<StoredIdentity | undefined> {
  return await db.identities.get(id);
}

/**
 * Delete an identity by ID
 */
export async function deleteIdentity(id: number): Promise<void> {
  await db.identities.delete(id);
}

/**
 * Search for identity by name
 */
export async function findIdentityByName(name: string): Promise<StoredIdentity | undefined> {
  return await db.identities.where('name').equals(name).first();
}

/**
 * Clear all identities
 */
export async function clearAllIdentities(): Promise<void> {
  await db.identities.clear();
}

