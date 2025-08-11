import React from 'react';

export default function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div style={{ border: '1px solid #eee', padding: '16px', borderRadius: '8px' }} className={className}>{children}</div>;
}