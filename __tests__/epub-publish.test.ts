import { NextResponse } from 'next/server';
import { getSession } from '@/actions/auth/get-session';
import { generateEpub } from '@/actions/books/publish/epub-actions/generateEpub';

// Mock the getSession function
jest.mock('@/actions/auth/get-session');
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('EPUB Publish API', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockBookSlug = 'test-book';
  const mockOptions = {
    generate_toc: true,
    include_imprint: true,
    embed_metadata: true,
    cover: true,
    toc_depth: 2
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User-Initiated Flow', () => {
    it('should generate EPUB for authenticated user', async () => {
      // Mock authenticated session
      mockGetSession.mockResolvedValueOnce({
        user: mockUser,
        expires: new Date().toISOString()
      });

      // Mock successful response
      const mockResponse = { success: true, url: 'http://example.com/test.epub' };
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateEpub(mockBookSlug, mockOptions);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/books/${mockBookSlug}/publish/epub`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should reject unauthenticated requests', async () => {
      // Mock unauthenticated session
      mockGetSession.mockResolvedValueOnce(null);

      await expect(generateEpub(mockBookSlug, mockOptions)).rejects.toThrow('Not authenticated');
    });
  });

  describe('GitHub Actions Flow', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should generate EPUB for GitHub Actions with valid token', async () => {
      // Mock successful response
      const mockResponse = { success: true, url: 'http://example.com/test.epub' };
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateEpub(mockBookSlug, mockOptions, true);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/books/${mockBookSlug}/publish/epub`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
});
