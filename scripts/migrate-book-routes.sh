#!/bin/bash

# Create new directory structure with [slug]
mkdir -p /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/new
mkdir -p /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/__slug__
mkdir -p /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/__slug__/edit

# Move and update files
mv /Users/regalstand/turna/app/dashboard/books/\[id\]/chapters/page.tsx /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/\[id\]/chapters/new/page.tsx /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/new/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/\[id\]/chapters/\[chapterid\]/page.tsx /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/__slug__/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/\[id\]/chapters/\[chapterid\]/edit/page.tsx /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/__slug__/edit/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/\[id\]/edit/page.tsx /Users/regalstand/turna/app/dashboard/books/__temp__/edit/page.tsx

# Create new directory structure
mkdir -p /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/new
mkdir -p /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/\[chapterSlug\]
mkdir -p /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/\[chapterSlug\]/edit

# Move files to new location
mv /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/page.tsx /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/new/page.tsx /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/new/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/__slug__/page.tsx /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/\[chapterSlug\]/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/__temp__/chapters/__slug__/edit/page.tsx /Users/regalstand/turna/app/dashboard/books/\[slug\]/chapters/\[chapterSlug\]/edit/page.tsx
mv /Users/regalstand/turna/app/dashboard/books/__temp__/edit/page.tsx /Users/regalstand/turna/app/dashboard/books/\[slug\]/edit/page.tsx

# Cleanup
rm -rf /Users/regalstand/turna/app/dashboard/books/__temp__
rm -rf /Users/regalstand/turna/app/dashboard/books/\[id\]

# Update API routes
mkdir -p /Users/regalstand/turna/app/api/books/\[slug\]/chapters/\[chapterSlug\]
mv /Users/regalstand/turna/app/api/books/\[id\]/* /Users/regalstand/turna/app/api/books/\[slug\]/
mv /Users/regalstand/turna/app/api/books/\[id\]/chapters/* /Users/regalstand/turna/app/api/books/\[slug\]/chapters/
mv /Users/regalstand/turna/app/api/books/\[id\]/chapters/\[chapterid\]/* /Users/regalstand/turna/app/api/books/\[slug\]/chapters/\[chapterSlug\]/
rm -rf /Users/regalstand/turna/app/api/books/\[id\]

echo "Migration complete. Please update the following files to use 'slug' instead of 'id':"
find /Users/regalstand/turna/app -type f -exec grep -l "params\.id" {} \;
find /Users/regalstand/turna/app -type f -exec grep -l "params\.chapterid" {} \;
