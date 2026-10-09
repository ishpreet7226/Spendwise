import { Group } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GroupAvatarProps {
  group: Pick<Group, 'name' | 'emoji' | 'color'>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-3xl',
};

export function GroupAvatar({ group, size = 'md', className }: GroupAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center flex-shrink-0 font-medium',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${group.color}25` }}
      title={group.name}
    >
      {group.emoji}
    </div>
  );
}

