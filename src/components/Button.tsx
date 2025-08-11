// الملف: src/components/Button.tsx

import React from 'react';

// التغيير هنا: أضفنا fullWidth إلى قائمة الخصائص المفككة
export default function Button({ children, isLoading, fullWidth, ...props }: { children: React.ReactNode, isLoading?: boolean, fullWidth?: boolean, [key: string]: any }) {
  // الآن، `fullWidth` تم استهلاكها ولن تمرر إلى عنصر <button>
  // يمكنك حتى استخدامها لتطبيق ستايل معين
  const style = fullWidth ? { width: '100%' } : {};
  
  return <button {...props} style={style}>{isLoading ? "Loading..." : children}</button>;
}