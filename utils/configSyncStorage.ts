import { SYNC_PREFIX, SYNC_SECTIONS, SYNC_LIMIT, validateSection, type SyncPatch, type SyncSection } from './configSyncModel';

type Records = Record<string, unknown>;
const bytes = (value: string) => new TextEncoder().encode(value).length;
export const storageBytes = (records: Records) => Object.entries(records).reduce((sum, [key, value]) => sum + bytes(key) + bytes(JSON.stringify(value)), 0);
const digest = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (byte) => byte.toString(16).padStart(2, '0')).join('');

export async function encodeSections(patch: SyncPatch): Promise<Records> {
  const records: Records = {};
  for (const section of SYNC_SECTIONS) {
    if (!(section in patch)) continue;
    const text = JSON.stringify(validateSection(section, patch[section]));
    const revision = await digest(text);
    const parts: string[] = [];
    let part = '', size = 0;
    // Count JSON escaping as well as UTF-8; never split a surrogate pair.
    for (const character of text) {
      const cost = bytes(JSON.stringify(character)) - 2;
      if (size + cost > 7000) { parts.push(part); part = ''; size = 0; }
      part += character; size += cost;
    }
    parts.push(part);
    const key = SYNC_PREFIX + section;
    records[key] = { version: 1, revision, parts: parts.length };
    parts.forEach((data, index) => { records[`${key}.${index}`] = { revision, data }; });
  }
  return records;
}

export async function decodeSections(records: Records): Promise<{ values: SyncPatch; errors: string[]; exists: boolean }> {
  const values: SyncPatch = {}, errors: string[] = [];
  const exists = Object.keys(records).some((key) => key.startsWith(SYNC_PREFIX));
  for (const section of SYNC_SECTIONS) {
    const key = SYNC_PREFIX + section;
    if (!(key in records)) continue;
    try {
      const manifest = records[key] as { version: number; revision: string; parts: number };
      if (!manifest || manifest.version !== 1 || typeof manifest.revision !== 'string' || !Number.isInteger(manifest.parts) || manifest.parts < 1 || manifest.parts > 512) throw new Error();
      let text = '';
      for (let index = 0; index < manifest.parts; index++) {
        const part = records[`${key}.${index}`] as { revision: string; data: string };
        if (!part || part.revision !== manifest.revision || typeof part.data !== 'string') throw new Error();
        text += part.data;
      }
      if (await digest(text) !== manifest.revision) throw new Error();
      values[section] = validateSection(section, JSON.parse(text));
    } catch { errors.push(section); }
  }
  // Orphaned chunks can arrive ahead of their manifest; never seed over them.
  if (exists && !Object.keys(values).length && !errors.length) errors.push('configuration');
  return { values, errors, exists };
}

export function checkSyncQuota(records: Records) {
  if (storageBytes(records) > SYNC_LIMIT || Object.keys(records).length > 512 || Object.entries(records).some(([key, value]) => bytes(key) + bytes(JSON.stringify(value)) > 8192)) {
    throw new Error('SYNC_QUOTA');
  }
}

export function obsoleteChunks(records: Records, writes: Records, sections: SyncSection[]): string[] {
  return Object.keys(records).filter((key) => sections.some((section) => key.startsWith(`${SYNC_PREFIX}${section}.`)) && !(key in writes));
}
