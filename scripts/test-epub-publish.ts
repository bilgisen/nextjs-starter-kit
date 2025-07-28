import { NextResponse } from 'next/server';
import { getSession } from '@/actions/auth/get-session';
import { generateEpub } from '@/actions/books/publish/epub-actions/generateEpub';

// Mock the getSession function
const mockGetSession = jest.fn();

// Simple test runner
async function runTests() {
  console.log('=== Testing EPUB Publish API ===\n');

  // Test 1: User-initiated flow with valid session
  console.log('1. Testing user-initiated flow with valid session...');
  try {
    // Mock authenticated session
    mockGetSession.mockResolvedValueOnce({
      user: { id: 'test-user', email: 'test@example.com' },
      expires: new Date().toISOString()
    });

    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, url: 'http://example.com/test.epub' })
    });

    const result = await generateEpub('test-book', {
      generate_toc: true,
      include_imprint: true,
      embed_metadata: true,
      cover: true,
      toc_depth: 2
    });

    console.log('✅ Success:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  // Test 2: GitHub Actions flow
  console.log('\n2. Testing GitHub Actions flow...');
  try {
    // Mock GitHub Actions environment
    process.env.GITHUB_ACTIONS = 'true';
    
    // Mock fetch response for GitHub Actions
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, url: 'http://example.com/gh-test.epub' })
    });

    const result = await generateEpub(
      'test-book',
      {
        generate_toc: true,
        include_imprint: true,
        embed_metadata: true,
        cover: true,
        toc_depth: 2
      },
      true // isGitHubAction
    );

    console.log('✅ Success:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    delete process.env.GITHUB_ACTIONS;
  }

  console.log('\n=== Test completed ===');
}

// Run the tests
runTests().catch(console.error);
