// This file ensures TypeScript can resolve @/types/* imports

// Export all types from the book module
export * from './book';

// For backward compatibility with @/types/book imports
declare module '@/types/book' {
  export * from './book';
}

// For any other types under @/types/
declare module '@/types/*' {
  const value: any;
  export default value;
}
