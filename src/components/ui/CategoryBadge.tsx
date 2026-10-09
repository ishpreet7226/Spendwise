import { ExpenseCategory, CATEGORY_META } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: ExpenseCategory;
  showLabel?: boolean;
  className?: string;
}

export function CategoryBadge({ category, showLabel = true, className }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
    >
      <span>{meta.emoji}</span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}

