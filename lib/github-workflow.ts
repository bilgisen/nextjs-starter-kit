import { Octokit } from '@octokit/rest';

interface WorkflowDispatchResponse {
  id: number;
  html_url: string;
  status: string;
}

/**
 * Triggers a GitHub Actions workflow for EPUB generation
 */
export async function triggerGitHubWorkflow(bookSlug: string): Promise<WorkflowDispatchResponse> {
  // Validate required environment variables
  const requiredVars = [
    'GITHUB_OWNER',
    'GITHUB_REPO',
    'GITHUB_TOKEN',
    'GITHUB_WORKFLOW_ID'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  try {
    // Trigger the workflow
    await octokit.actions.createWorkflowDispatch({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      workflow_id: process.env.GITHUB_WORKFLOW_ID!,
      ref: process.env.GITHUB_BRANCH || 'main',
      inputs: {
        book_slug: bookSlug,
        timestamp: new Date().toISOString()
      }
    });

    // The API doesn't return the workflow run details in the response,
    // so we need to fetch it separately
    const workflowRuns = await octokit.actions.listWorkflowRuns({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      workflow_id: process.env.GITHUB_WORKFLOW_ID!,
      event: 'workflow_dispatch',
      per_page: 1
    });

    const latestRun = workflowRuns.data.workflow_runs[0];
    
    if (!latestRun) {
      throw new Error('Failed to find the triggered workflow run');
    }

    return {
      id: latestRun.id,
      html_url: latestRun.html_url,
      status: latestRun.status
    };
  } catch (error) {
    console.error('Error triggering GitHub Workflow:', error);
    throw new Error(`Failed to trigger workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the status of a GitHub Actions workflow run
 */
export async function getWorkflowStatus(runId: number): Promise<WorkflowDispatchResponse> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  try {
    const { data: run } = await octokit.actions.getWorkflowRun({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      run_id: runId
    });

    return {
      id: run.id,
      html_url: run.html_url,
      status: run.status
    };
  } catch (error) {
    console.error('Error getting workflow status:', error);
    throw new Error(`Failed to get workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
