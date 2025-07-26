// Type definitions for @/types/*
// This file helps TypeScript resolve paths like @/types/book

declare module '@/types/book' {
  export * from '../../types/book';
}

declare module '@/types/*' {
  export * from '../../types/*';
}
