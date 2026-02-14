import React from 'react';

interface BadgeProps {
  text: string;
  status: 'pending' | 'used' | 'missing';
}

export const Badge: React.FC<BadgeProps> = ({ text, status }) => {
  const styles = {
    pending: "bg-gray-100 text-gray-700 border-gray-200",
    used: "bg-green-100 text-green-800 border-green-200 line-through decoration-green-500/50",
    missing: "bg-red-50 text-red-800 border-red-200"
  };

  return (
    <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium border ${styles[status]} transition-colors duration-300`}>
      {text}
    </span>
  );
};
