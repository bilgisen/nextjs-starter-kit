#!/bin/bash

# This script sets up the test environment variables
# Usage: source setup-test-env.sh

export NODE_ENV=test

# GitHub Configuration
export GITHUB_OWNER=your_github_username_or_org
export GITHUB_REPO=your_repository_name
export GITHUB_TOKEN=your_github_personal_access_token
export GITHUB_WORKFLOW_ID=epub-generation.yml
export GITHUB_BRANCH=main
export GITHUB_ACTIONS_TOKEN=your_github_actions_webhook_secret

# Application Configuration
export NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database Configuration (if needed for tests)
export DATABASE_URL=your_test_database_url

# Authentication
export NEXTAUTH_SECRET=test_secret_key
export NEXTAUTH_URL=http://localhost:3001

echo "Test environment variables have been set."
echo "Make sure to replace the placeholder values with your actual configuration."
