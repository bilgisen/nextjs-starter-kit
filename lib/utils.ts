import { clsx, type ClassValue as ClassValueType } from "clsx"
import { twMerge } from "tailwind-merge"

export type ClassValue = ClassValueType;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
