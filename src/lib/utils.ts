import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成证书编号
 * 格式：RZ-NE-2026-XXXXX 或 RZ-AC-2026-XXXXX
 */
export function generateCertNo(type: 'energy' | 'acoustic'): string {
  const prefix = type === 'energy' ? 'RZ-NE' : 'RZ-AC';
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-5);
  return `${prefix}-${year}-${seq}`;
}
