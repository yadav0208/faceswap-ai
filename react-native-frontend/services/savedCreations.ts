import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'anva_saved_creations';

export type SavedCreation = {
  id: string;
  uri: string;
  title: string;
  createdAt: string;
  type: 'photo' | 'video';
};

export async function getSavedCreations(): Promise<SavedCreation[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];

  try {
    const items = JSON.parse(value) as SavedCreation[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function saveCreation(
  creation: Omit<SavedCreation, 'id' | 'createdAt'>,
): Promise<SavedCreation> {
  const current = await getSavedCreations();
  const existing = current.find((item) => item.uri === creation.uri);
  if (existing) return existing;

  const item: SavedCreation = {
    ...creation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...current]));
  return item;
}

export async function removeSavedCreation(id: string): Promise<void> {
  const current = await getSavedCreations();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(current.filter((item) => item.id !== id)),
  );
}
