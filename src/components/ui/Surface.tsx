import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('card', className)} {...props} />
);

export const Panel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('card-soft', className)} {...props} />
);

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('chip', className)} {...props} />
);
