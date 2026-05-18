import React from 'react';
import { sanitizeHttpUrl } from '@/utils/safeUrl';
import { getSafeIconImageSrc } from '../icons';
import type { Bookmark } from '../hooks/useBookmarkLoader';

const ROW_SIZE = 6;

const splitRows = (items: Bookmark[]): Bookmark[][] => {
  const rows: Bookmark[][] = [];
  for (let i = 0; i < items.length; i += ROW_SIZE) {
    rows.push(items.slice(i, i + ROW_SIZE));
  }
  return rows;
};

export const ShortcutsGrid: React.FC<{ bookmarks: Bookmark[] }> = ({ bookmarks }) => {
  const handleClick = (rawUrl: string) => {
    const safe = sanitizeHttpUrl(rawUrl);
    if (safe) window.open(safe, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="shortcuts-grid">
      {splitRows(bookmarks).map((row, rowIndex) => (
        <div key={rowIndex} className="shortcuts-row">
          {row.map((bookmark) => {
            const iconSrc = getSafeIconImageSrc(bookmark.icon);
            return (
              <div
                key={bookmark.id}
                className="shortcut-item"
                onClick={() => handleClick(bookmark.url)}
              >
                <div className="shortcut-icon">
                  {iconSrc
                    ? <img src={iconSrc} alt={bookmark.title} />
                    : bookmark.title.charAt(0)}
                </div>
                <div className="shortcut-label">{bookmark.title}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
