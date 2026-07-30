import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export type MediaKind = 'photo' | 'video';

export async function saveMediaToDevice(uri: string, kind: MediaKind): Promise<string> {
  const extension = kind === 'video' ? 'mp4' : 'jpg';
  const filename = `anva-ai-${Date.now()}.${extension}`;

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Download failed (${response.status}).`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return uri;
  }

  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo-library access to save this creation.');
  }
  if (!FileSystem.documentDirectory) {
    throw new Error('Device storage is unavailable.');
  }

  const localUri = `${FileSystem.documentDirectory}${filename}`;
  const download = await FileSystem.downloadAsync(uri, localUri);
  if (download.status < 200 || download.status >= 300) {
    throw new Error(`Download failed (${download.status}).`);
  }

  const asset = await MediaLibrary.createAssetAsync(download.uri);
  const album = await MediaLibrary.getAlbumAsync('Anva AI');
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } else {
    await MediaLibrary.createAlbumAsync('Anva AI', asset, false);
  }
  return download.uri;
}
