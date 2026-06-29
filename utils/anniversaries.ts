export type AnniversaryType = 'birthday' | 'travel' | 'anniversary' | 'custom';
export type AnniversaryCalendar = 'solar' | 'lunar';

export interface AnniversaryItem {
  id: string;
  title: string;
  date: string;
  type: AnniversaryType;
  calendar: AnniversaryCalendar;
  recurring: boolean;
  note?: string;
}

export interface AnniversaryCountdown extends AnniversaryItem {
  daysUntil: number;
  nextDate: Date;
  isToday: boolean;
  isPinnedSoon: boolean;
}

export const ANNIVERSARIES_STORAGE_KEY = 'anniversaryItems';
export const ANNIVERSARY_PIN_THRESHOLD_DAYS = 1;
const LUNAR_DATE_FORMATTER = new Intl.DateTimeFormat('zh-Hans-CN-u-ca-chinese', {
  month: 'long',
  day: 'numeric',
});
const LUNAR_DAY_NAMES = [
  '',
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
];

export const DEFAULT_ANNIVERSARIES: AnniversaryItem[] = [
  {
    id: 'default-birthday',
    title: '臭宝生日',
    date: '2000-08-22',
    type: 'birthday',
    calendar: 'solar',
    recurring: true,
    note: '每年 8 月 22 日',
  },
  {
    id: 'default-anniversary',
    title: '5.14',
    date: '2000-05-14',
    type: 'anniversary',
    calendar: 'solar',
    recurring: true,
    note: '每年 5 月 14 日',
  },
];

export function createAnniversaryItem(overrides: Partial<AnniversaryItem> = {}): AnniversaryItem {
  return {
    id: `anniversary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'custom',
    calendar: 'solar',
    recurring: true,
    note: '',
    ...overrides,
  };
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getLunarMonthDay(date: Date): { month: string; day: number } | null {
  const parts = LUNAR_DATE_FORMATTER.formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value;
  const dayValue = parts.find((part) => part.type === 'day')?.value;
  const day = dayValue ? Number(dayValue) : NaN;
  if (!month || !Number.isInteger(day) || day < 1 || day > 30) return null;
  return { month, day };
}

function findNextLunarOccurrence(baseDate: Date, now: Date): Date | null {
  const target = getLunarMonthDay(baseDate);
  if (!target) return null;
  const today = startOfLocalDay(now);

  // ponytail: a 400-day scan is enough for yearly lunar repeats; replace with a converter only if this becomes hot.
  for (let offset = 0; offset <= 400; offset += 1) {
    const candidate = addDays(today, offset);
    const lunar = getLunarMonthDay(candidate);
    if (lunar && lunar.month === target.month && lunar.day === target.day) return candidate;
  }

  return null;
}

export function getNextAnniversaryDate(item: AnniversaryItem, now = new Date()): Date | null {
  const baseDate = parseLocalDate(item.date);
  if (!baseDate) return null;
  const today = startOfLocalDay(now);
  if (item.calendar === 'lunar') {
    if (!item.recurring) return startOfLocalDay(baseDate);
    return findNextLunarOccurrence(baseDate, now);
  }
  if (!item.recurring) return startOfLocalDay(baseDate);

  let next = new Date(today.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate());
  return next;
}

export function formatSolarDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatLunarDate(date: Date): string {
  const lunar = getLunarMonthDay(date);
  if (!lunar) return '';
  return `${lunar.month}${LUNAR_DAY_NAMES[lunar.day] ?? lunar.day}`;
}

export function getAnniversaryCountdowns(items: AnniversaryItem[], now = new Date()): AnniversaryCountdown[] {
  const today = startOfLocalDay(now);
  const dayMs = 24 * 60 * 60 * 1000;
  return items
    .map((item) => {
      const nextDate = getNextAnniversaryDate(item, now);
      if (!nextDate) return null;
      const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / dayMs);
      if (!item.recurring && daysUntil < 0) return null;
      return {
        ...item,
        nextDate,
        daysUntil,
        isToday: daysUntil === 0,
        isPinnedSoon: daysUntil >= 0 && daysUntil <= ANNIVERSARY_PIN_THRESHOLD_DAYS,
      };
    })
    .filter((item): item is AnniversaryCountdown => Boolean(item))
    .sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title));
}

export function sanitizeAnniversaryItems(value: unknown): AnniversaryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Partial<AnniversaryItem> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' && item.id ? item.id : createAnniversaryItem().id,
      title: typeof item.title === 'string' ? item.title.slice(0, 80) : '',
      date: typeof item.date === 'string' ? item.date : '',
      type: isAnniversaryType(item.type) ? item.type : 'custom',
      calendar: isAnniversaryCalendar(item.calendar) ? item.calendar : 'solar',
      recurring: typeof item.recurring === 'boolean' ? item.recurring : true,
      note: typeof item.note === 'string' ? item.note.slice(0, 160) : '',
    }))
    .filter((item) => item.title.trim() && parseLocalDate(item.date));
}

function isAnniversaryType(value: unknown): value is AnniversaryType {
  return value === 'birthday' || value === 'travel' || value === 'anniversary' || value === 'custom';
}

function isAnniversaryCalendar(value: unknown): value is AnniversaryCalendar {
  return value === 'solar' || value === 'lunar';
}

export function readAnniversaryItems(): AnniversaryItem[] {
  try {
    const raw = localStorage.getItem(ANNIVERSARIES_STORAGE_KEY);
    if (!raw) return DEFAULT_ANNIVERSARIES;
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeAnniversaryItems(parsed);
    return sanitized.length > 0 ? sanitized : [];
  } catch (error) {
    console.warn('Failed to read anniversary items', error);
    return DEFAULT_ANNIVERSARIES;
  }
}

export function writeAnniversaryItems(items: AnniversaryItem[]) {
  localStorage.setItem(ANNIVERSARIES_STORAGE_KEY, JSON.stringify(sanitizeAnniversaryItems(items)));
}

export function resetAnniversaryItems() {
  localStorage.removeItem(ANNIVERSARIES_STORAGE_KEY);
}
