import { triggerGitHubWorkflow, getWorkflowStatus } from '@/lib/github-workflow';

async function testGitHubWorkflow() {
  console.log('=== Testing GitHub Workflow Integration ===\n');
  
  // Test with a sample book slug
  const testSlug = 'test-book';
  
  try {
    console.log(`1. Triggering GitHub Workflow for book: ${testSlug}`);
    const workflow = await triggerGitHubWorkflow(testSlug);
    
    console.log('✅ Workflow triggered successfully!');
    console.log('Workflow Details:', {
      id: workflow.id,
      status: workflow.status,
      url: workflow.html_url
    });
    
    console.log('\n2. Checking workflow status...');
    const status = await getWorkflowStatus(workflow.id);
    
    console.log('✅ Workflow status retrieved successfully!');
    console.log('Current Status:', {
      id: status.id,
      status: status.status,
      url: status.html_url
    });
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Unknown error occurred:', error);
    }
    process.exit(1);
  }
}

// Run the test
testGitHubWorkflow()
  .then(() => console.log('\n✅ Test completed successfully!'))
  .catch(() => process.exit(1));
