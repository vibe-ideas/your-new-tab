import React from 'react';
import { t } from '@/utils/i18n';

const formatTime = (date: Date): string => date.toLocaleTimeString('zh-CN', {
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const formatDate = (date: Date): string => {
  const weekdays = [
    t('weekdaySunday'), t('weekdayMonday'), t('weekdayTuesday'),
    t('weekdayWednesday'), t('weekdayThursday'), t('weekdayFriday'), t('weekdaySaturday'),
  ];
  return t('dateFormatYearMonthDay', {
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    weekday: weekdays[date.getDay()],
  });
};

export const TimeDisplay: React.FC<{ now: Date }> = ({ now }) => (
  <div className="time-display">
    <div className="time">{formatTime(now)}</div>
    <div className="date">{formatDate(now)}</div>
  </div>
);
