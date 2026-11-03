import { Clipboard, Device, File, PermissionError, Share, Storage } from '@apps-in-toss/web-framework';

export type PickedPhoto = { id: string; src: string };

function sniffMime(b64: string) {
  if (b64.startsWith('iVBOR')) return 'image/png';
  if (b64.startsWith('R0lG')) return 'image/gif';
  if (b64.startsWith('UklGR')) return 'image/webp';
  if (b64.startsWith('PHN2') || b64.startsWith('PD94')) return 'image/svg+xml';
  return 'image/jpeg';
}

function toBlobUrl(dataUri: string): string {
  if (/^(blob:|https?:|file:)/.test(dataUri)) return dataUri;
  const b64 = dataUri.startsWith('data:') ? dataUri.slice(dataUri.indexOf(',') + 1) : dataUri;
  const mime = /^data:([^;,]+)/.exec(dataUri)?.[1] ?? sniffMime(b64);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

type PickOptions = { maxCount: number; maxWidth: number };

async function pickOnce(opts: PickOptions) {
  const o = { ...opts, base64: true };
  if (Device.getAlbumItems.isSupported()) {
    const items = await Device.getAlbumItems({ ...o, types: ['PHOTO'] });
    return items.filter((i) => i.type === 'PHOTO');
  }
  return Device.getPhotos(o);
}

export type PickResult = { ok: true; photos: PickedPhoto[] } | { ok: false; reason: 'denied' | 'error' };

/** 앨범에서 사진을 고르게 하고, 권한이 없으면 권한 요청 다이얼로그를 띄워요. */
export async function pickPhotos(opts: PickOptions = { maxCount: 50, maxWidth: 720 }): Promise<PickResult> {
  try {
    const status = await Device.getPhotos.getPermission().catch(() => 'notDetermined');
    if (status === 'denied') {
      const r = await Device.getPhotos.openPermissionDialog();
      if (r !== 'allowed') return { ok: false, reason: 'denied' };
    }
    let items;
    try {
      items = await pickOnce(opts);
    } catch (e) {
      if (!(e instanceof PermissionError)) throw e;
      const r = await Device.getPhotos.openPermissionDialog();
      if (r !== 'allowed') return { ok: false, reason: 'denied' };
      items = await pickOnce(opts);
    }
    return { ok: true, photos: items.map((i) => ({ id: i.id, src: toBlobUrl(i.dataUri) })) };
  } catch (e) {
    console.error(e);
    return { ok: false, reason: 'error' };
  }
}

export async function openLink(url: string) {
  try {
    await Device.openURL(url);
  } catch {
    window.open(url, '_blank');
  }
}

export async function copyText(text: string) {
  try {
    await Clipboard.setText(text);
    return true;
  } catch {
    try {
      const r = await Clipboard.setText.openPermissionDialog();
      if (r === 'allowed') {
        await Clipboard.setText(text);
        return true;
      }
    } catch {
      /* 아래로 */
    }
    return navigator.clipboard?.writeText(text).then(() => true, () => false) ?? false;
  }
}

export async function shareText(message: string) {
  try {
    await Share.sendMessage({ message });
  } catch {
    /* 사용자가 닫음 */
  }
}

export async function saveFile(base64: string, fileName: string, mimeType: string) {
  if (!File.saveBase64.isSupported()) return false;
  try {
    await File.saveBase64({ data: base64, fileName, mimeType });
    return true;
  } catch {
    return false;
  }
}

export function haptic(type: 'tap' | 'success' | 'basicWeak' = 'tap') {
  Device.triggerHaptic({ type }).catch(() => {});
}

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await Storage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  Storage.setItem(key, JSON.stringify(value)).catch(() => {});
}
