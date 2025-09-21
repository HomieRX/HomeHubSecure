import type { IStorage } from '../storage';
import { createStorageRepositories, type StorageRepositories } from './contracts';
import { getStorage } from '../storage';

let cachedStorage: IStorage | null = null;
let cachedRepositories: StorageRepositories | null = null;

export async function getStorageRepositories(): Promise<StorageRepositories> {
  const storage = await getStorage();
  if (!cachedStorage || cachedStorage !== storage || !cachedRepositories) {
    cachedStorage = storage;
    cachedRepositories = createStorageRepositories(storage);
  }
  return cachedRepositories;
}
