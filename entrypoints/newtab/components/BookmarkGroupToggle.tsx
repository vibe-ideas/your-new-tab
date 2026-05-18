import React from 'react';
import { BOOKMARK_GROUP_IDS, type BookmarkGroupId, type BookmarkGroupLabels } from '@/utils/bookmarkGroups';
import { t } from '@/utils/i18n';

interface BookmarkGroupToggleProps {
  activeGroup: BookmarkGroupId;
  groupLabels: BookmarkGroupLabels;
  onSelect: (group: BookmarkGroupId) => void;
}

const resolveLabel = (group: BookmarkGroupId, labels: BookmarkGroupLabels): string => {
  const stored = labels[group]?.trim();
  if (stored) return stored;
  return t(group === 'external' ? 'bookmarkGroupExternal' : 'bookmarkGroupInternal');
};

export const BookmarkGroupToggle: React.FC<BookmarkGroupToggleProps> = ({ activeGroup, groupLabels, onSelect }) => (
  <div className="bookmark-group-toggle" role="tablist" aria-label={t('bookmarkGroupSelectorLabel')}>
    {BOOKMARK_GROUP_IDS.map((group) => (
      <button
        key={group}
        type="button"
        role="tab"
        aria-selected={activeGroup === group}
        className={`bookmark-group-toggle-button${activeGroup === group ? ' active' : ''}`}
        onClick={() => onSelect(group)}
      >
        {resolveLabel(group, groupLabels)}
      </button>
    ))}
  </div>
);
