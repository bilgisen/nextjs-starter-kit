// Test the EPUB publish API directly
import { NextResponse } from 'next/server';

async function testEpubPublish() {
  const API_URL = 'http://localhost:3000/api/books/test-book/publish/epub';
  
  console.log('=== Testing EPUB Publish API ===\n');

  // Test 1: Test without authentication
  console.log('1. Testing without authentication...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        options: {
          generate_toc: true,
          include_imprint: true,
          embed_metadata: true,
          cover: true,
          toc_depth: 2
        },
        content: '<h1>Test Book</h1>',
        styles: 'body { font-family: Arial; }',
        metadata: {
          title: 'Test Book',
          author: 'Test Author',
          language: 'en'
        }
      })
    });

    // Log response headers
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Log raw response text
    const responseText = await response.text();
    console.log('\nRaw Response:');
    console.log(responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    // Try to parse as JSON if possible
    try {
      const result = responseText ? JSON.parse(responseText) : {};
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('\nCould not parse response as JSON');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }

  // Test 2: Test with GitHub Actions token
  console.log('\n2. Testing with GitHub Actions token...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_ACTIONS_TOKEN || 'test-token'}`
      },
      body: JSON.stringify({
        options: {
          generate_toc: true,
          include_imprint: true,
          embed_metadata: true,
          cover: true,
          toc_depth: 2
        },
        content: '<h1>GitHub Actions Test</h1>',
        styles: 'body { font-family: Arial; }',
        metadata: {
          title: 'GitHub Actions Test',
          author: 'GitHub Actions',
          language: 'en'
        }
      })
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEpubPublish().catch(console.error);
