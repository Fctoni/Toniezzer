import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte uma data para string YYYY-MM-DD sem conversão de timezone
 * Evita o problema de mostrar um dia anterior devido a conversão GMT
 * @param date - Data a ser convertida
 * @returns String no formato YYYY-MM-DD usando o fuso local
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string YYYY-MM-DD para Date sem conversão de timezone
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Date object no fuso local
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}