/**
 * ActionBanner - Full-width colored banner section for call-to-action elements
 * Similar to Swedbank's design with centered content and colored backgrounds
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActionBannerProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'muted';
  className?: string;
}

export function ActionBanner({ children, variant = 'primary', className }: ActionBannerProps) {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className={cn('w-full', variantClasses[variant])}>
      <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
