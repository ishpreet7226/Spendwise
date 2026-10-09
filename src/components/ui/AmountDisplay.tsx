import { Currency, CURRENCY_SYMBOLS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AmountDisplayProps {
  amount: number;
  currency?: Currency;
  showSign?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-xl font-semibold', xl: 'text-3xl font-bold' };

export function AmountDisplay({ amount, currency = 'INR', showSign = false, className, size = 'md' }: AmountDisplayProps) {
  const symbol = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const colorClass =
    amount > 0 ? 'text-leaf' : amount < 0 ? 'text-coral' : 'text-muted-foreground';

  const prefix = showSign ? (amount > 0 ? '+' : amount < 0 ? '−' : '') : '';

  return (
    <span className={cn(sizeClasses[size], colorClass, 'font-semibold tabular-nums', className)}>
      {prefix}{symbol}{formatted}
    </span>
  );
}

