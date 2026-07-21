import type { ReactNode } from 'react';
import styles from './BigButton.module.css';

export interface BigButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function BigButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: BigButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${variant === 'primary' ? styles.primary : styles.secondary}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
