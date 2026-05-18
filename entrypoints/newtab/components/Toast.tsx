import React from 'react';

export const Toast: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="newtab-toast" role="status" aria-live="polite">{message}</div>
  );
};
