// This file helps TypeScript resolve the @/types/book import

// Import the actual type
declare module '@/types/book' {
  import { Book } from '../../../types/book';
  export { Book };
  export default Book;
}
