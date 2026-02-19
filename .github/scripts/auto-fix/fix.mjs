/**
 * Review Hero Auto-Fix
 *
 * Fetches unresolved review comments and/or CI failures from a PR,
 * pipes them to Claude CLI to apply fixes, then commits and pushes the result.
 *
 * Environment variables:
 *   GITHUB_TOKEN        — GitHub token (with contents:write, pull-requests:write, actions:read)
 *   GITHUB_REPOSITORY   — owner/repo
 *   PR_NUMBER           — Pull request number
 *   ANTHROPIC_API_KEY   — API key for Claude CLI
 *   REVIEW_HERO_APP_ID  — App ID for git commit identity
 *   AI_FIX_MODEL        — Model to use (default: claude-sonnet-4-5-20250929)
 *   FIX_REVIEWS         — 'true' to fix unresolved review comments
 *   FIX_CI              — 'true' to fix CI failures
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const token = getEnvOrThrow('GITHUB_TOKEN');
const repo = getEnvOrThrow('GITHUB_REPOSITORY');
const prNumber = getEnvOrThrow('PR_NUMBER');

// Validate PR_NUMBER to prevent path traversal attacks
if (!/^\d+$/.test(prNumber)) {
  throw new Error('Invalid PR number - must be numeric');
}
const appId = process.env.REVIEW_HERO_APP_ID ?? '';
const model = process.env.AI_FIX_MODEL ?? 'claude-sonnet-4-5-20250929';
const fixReviews = process.env.FIX_REVIEWS === 'true';
const fixCI = process.env.FIX_CI === 'true';

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function withRetry(fn, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < attempts - 1) {
        console.warn(`Attempt ${attempt + 1} failed, retrying: ${err.message}`);
        await sleep(1000 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
}

async function githubApi(endpoint, options = {}) {
  const baseUrl = `https://api.github.com/repos/${repo}`;

  return withRetry(async () => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${response.status}: ${body}`);
    }

    return response.json();
  });
}

async function githubGraphQL(query, variables) {
  return withRetry(async () => {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub GraphQL ${response.status}: ${body}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    return result.data;
  });
}

async function fetchUnresolvedComments() {
  const [owner, name] = repo.split('/');

  const data = await githubGraphQL(
    `query($owner: String!, $repo: String!, $pr: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pr) {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              isOutdated
              comments(first: 10) {
                nodes {
                  body
                  path
                  line
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { owner, repo: name, pr: parseInt(prNumber) },
  );

  const threads = data?.repository?.pullRequest?.reviewThreads?.nodes ?? [];
  const comments = [];

  for (const thread of threads) {
    if (thread.isResolved) continue;
    // Note: We intentionally don't skip outdated threads (thread.isOutdated).
    // Threads can be marked outdated by later commits even when the line itself
    // hasn't changed, so we still want to attempt fixes on them.
    if (!thread.id) continue;

    const firstComment = thread.comments?.nodes?.[0];
    if (!firstComment?.path) continue;

    // Collect all comment bodies in the thread for full context
    const bodies = (thread.comments?.nodes ?? [])
      .map(c => `${c.author?.login ?? 'unknown'}: ${c.body ?? ''}`)
      .join('\n\n');

    comments.push({
      file: firstComment.path,
      line: firstComment.line,
      comment: bodies,
      threadId: thread.id,
    });
  }

  return comments;
}

const LOG_LINES_PER_JOB = 500;
const MAX_CI_LOG_CHARS = 50_000;
const SELF_WORKFLOW = 'Review Hero Auto-Fix';

function stripAnsiAndTimestamps(log) {
  return log
    .replace(/\u001b\[[0-9;]*m/g, '') // ANSI codes
    .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z /gm, ''); // timestamp prefixes
}

function truncateLog(log, maxLines) {
  const lines = log.split('\n');
  if (lines.length <= maxLines) return log;
  return `... (${lines.length - maxLines} lines truncated)\n` + lines.slice(-maxLines).join('\n');
}

async function fetchJobLog(jobId) {
  const response = await fetch(`https://api.github.com/repos/${repo}/actions/jobs/${jobId}/logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    console.warn(`Failed to fetch log for job ${jobId}: ${response.status}`);
    return null;
  }

  return response.text();
}

async function fetchCIFailures() {
  const pr = await githubApi(`/pulls/${prNumber}`);
  const headSha = pr.head.sha;

  console.log(`Fetching CI failures for commit ${headSha.slice(0, 7)}`);

  // Don't filter by run status — a run can be in progress while some jobs have already failed
  const runsData = await githubApi(`/actions/runs?head_sha=${headSha}&per_page=100`);
  const runs = (runsData.workflow_runs ?? []).filter(r => r.name !== SELF_WORKFLOW);

  if (runs.length === 0) return [];

  console.log(`Checking ${runs.length} workflow run${runs.length === 1 ? '' : 's'} for failed jobs`);

  const failures = [];
  let totalChars = 0;

  for (const run of runs) {
    const jobsData = await githubApi(`/actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
    const failedJobs = (jobsData.jobs ?? []).filter(j => j.conclusion === 'failure');

    for (const job of failedJobs) {
      if (totalChars >= MAX_CI_LOG_CHARS) break;

      const rawLog = await fetchJobLog(job.id);
      if (!rawLog) continue;

      const cleaned = stripAnsiAndTimestamps(rawLog);
      const truncated = truncateLog(cleaned, LOG_LINES_PER_JOB);
      const capped = truncated.slice(-(MAX_CI_LOG_CHARS - totalChars));
      totalChars += capped.length;

      failures.push({
        workflow: run.name,
        job: job.name,
        log: capped,
      });
    }
  }

  return failures;
}

function buildPrompt(comments, ciFailures) {
  const promptMd = readFileSync('.github/scripts/auto-fix/prompt.md', 'utf-8');
  const sections = [promptMd];

  if (comments.length > 0) {
    const commentsList = comments
      .map((c, i) => `### Comment #${i + 1}: \`${c.file}${c.line ? `:${c.line}` : ''}\`\n\n${c.comment}`)
      .join('\n\n---\n\n');
    sections.push(`## Review Comments to Fix (${comments.length})\n\n${commentsList}`);
  }

  if (ciFailures.length > 0) {
    const failuresList = ciFailures
      .map((f, i) => `### CI Failure #${comments.length + i + 1}: ${f.workflow} / ${f.job}\n\n\`\`\`\n${f.log}\n\`\`\``)
      .join('\n\n---\n\n');
    sections.push(`## CI Failures to Fix (${ciFailures.length})\n\n${failuresList}`);
  }

  return sections.join('\n\n');
}

function runClaude(prompt) {
  // Validate model to prevent command injection
  if (!/^[a-z0-9.-]+$/.test(model)) {
    throw new Error(`Invalid model name: ${model}`);
  }

  const promptPath = `/tmp/auto-fix-prompt-${prNumber}-${Date.now()}.md`;
  writeFileSync(promptPath, prompt);

  const tools = fixCI
    ? 'Read,Edit,Glob,Grep,Bash'
    : 'Read,Edit,Glob,Grep';

  const result = execSync(
    `cat "${promptPath}" | claude -p ` +
    `--output-format json ` +
    `--model "${model}" ` +
    `--max-turns 30 ` +
    `--allowedTools "${tools}"`,
    {
      encoding: 'utf-8',
      timeout: 10 * 60 * 1000, // 10 minutes
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    },
  );

  return result;
}

function parseClaudeResult(raw) {
  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.result)) {
      return parsed.result;
    } else if (parsed.result) {
      text = parsed.result;
    } else if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not valid JSON at top level — search for embedded array below
  }

  let searchFrom = 0;
  while (searchFrom < text.length) {
    const start = text.indexOf('[', searchFrom);
    if (start === -1) break;
    let searchEnd = text.length;
    while (searchEnd > start) {
      const end = text.lastIndexOf(']', searchEnd - 1);
      if (end <= start) break;
      try {
        const arr = JSON.parse(text.slice(start, end + 1));
        if (Array.isArray(arr)) return arr;
      } catch {
        // try shorter span
      }
      searchEnd = end;
    }
    searchFrom = start + 1;
  }

  return [];
}

function hasChanges() {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
  return Boolean(status);
}

function createCommit(commitMessage) {
  // Validate appId to prevent command injection
  if (appId && !/^\d+$/.test(appId)) {
    throw new Error('Invalid app ID');
  }

  const botName = 'review-hero[bot]';
  const botEmail = appId
    ? `${appId}+review-hero[bot]@users.noreply.github.com`
    : 'review-hero[bot]@users.noreply.github.com';

  execSync(`git config user.name "${botName}"`);
  execSync(`git config user.email "${botEmail}"`);

  execSync('git add -A');

  // Use heredoc to avoid shell interpolation of commit message
  execSync(
    `git commit -m "$(cat <<'EOF'\n${commitMessage}\n\nCo-Authored-By: Review Hero <contact@bes.au>\nEOF\n)"`,
  );
}

function pushChanges() {
  execSync('git push');
  console.log('Pushed auto-fix commit');
}

function commitAndPush(commitMessage) {
  if (!hasChanges()) {
    console.log('No file changes after auto-fix');
    return false;
  }

  createCommit(commitMessage);
  pushChanges();
  return true;
}

async function resolveThread(threadId) {
  try {
    await githubGraphQL(
      `mutation($threadId: ID!) {
        resolveReviewThread(input: { threadId: $threadId }) {
          thread { id }
        }
      }`,
      { threadId },
    );
  } catch (err) {
    console.warn(`Failed to resolve thread ${threadId}: ${err.message}`);
  }
}

async function replyToThread(threadId, body) {
  try {
    await githubGraphQL(
      `mutation($threadId: ID!, $body: String!) {
        addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $threadId, body: $body }) {
          comment { id }
        }
      }`,
      { threadId, body },
    );
  } catch (err) {
    console.warn(`Failed to reply to thread ${threadId}: ${err.message}`);
  }
}

async function postComment(body) {
  await githubApi(`/issues/${prNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

async function uncheckCheckboxes() {
  try {
    const pr = await githubApi(`/pulls/${prNumber}`);
    if (!pr.body) return;

    let updated = pr.body;
    if (fixReviews) {
      updated = updated.replace(
        /\[x\]\s+\*\*Auto-fix review suggestions\*\* <!-- #auto-fix -->/,
        '[ ] **Auto-fix review suggestions** <!-- #auto-fix -->',
      );
    }
    if (fixCI) {
      updated = updated.replace(
        /\[x\]\s+\*\*Auto-fix CI failures\*\* <!-- #auto-fix-ci -->/,
        '[ ] **Auto-fix CI failures** <!-- #auto-fix-ci -->',
      );
    }

    if (updated === pr.body) return;

    await githubApi(`/pulls/${prNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ body: updated }),
    });
    console.log('Unchecked auto-fix checkbox(es)');
  } catch (err) {
    console.warn(`Failed to uncheck checkbox: ${err.message}`);
  }
}

async function main() {
  console.log(`Auto-fixing PR #${prNumber} (reviews: ${fixReviews}, ci: ${fixCI})`);

  const comments = fixReviews ? await fetchUnresolvedComments() : [];
  const ciFailures = fixCI ? await fetchCIFailures() : [];

  if (fixReviews) {
    console.log(`Found ${comments.length} unresolved review comment${comments.length === 1 ? '' : 's'}`);
  }
  if (fixCI) {
    console.log(`Found ${ciFailures.length} CI failure${ciFailures.length === 1 ? '' : 's'}`);
  }

  if (comments.length === 0 && ciFailures.length === 0) {
    await postComment('🦸 **Review Hero Auto-Fix** — Nothing to fix.');
    await uncheckCheckboxes();
    return;
  }

  const prompt = buildPrompt(comments, ciFailures);
  console.log('Running Claude to apply fixes...');
  const raw = runClaude(prompt);

  const results = parseClaudeResult(raw);

  // Build a lookup from Claude's result IDs
  const resultById = new Map(results.map(r => [r.id, r]));

  // Determine which comments were fixed vs skipped
  const fixedComments = [];
  const skippedComments = [];
  for (let i = 0; i < comments.length; i++) {
    const id = i + 1;
    const result = resultById.get(id);
    if (result?.status === 'fixed') {
      fixedComments.push(comments[i]);
    } else if (result?.status === 'skipped') {
      skippedComments.push({ ...comments[i], reason: result.reason ?? 'Unknown' });
    } else {
      // No response from Claude for this comment
      skippedComments.push({ ...comments[i], reason: 'No response from Claude' });
    }
  }

  // Count CI fixes (IDs after review comments)
  const fixedCICount = ciFailures.filter((_, i) => {
    const result = resultById.get(comments.length + i + 1);
    return result?.status !== 'skipped';
  }).length;

  // Build commit message from actual fix counts
  const msgParts = [];
  if (fixedComments.length > 0) msgParts.push(`${fixedComments.length} review suggestion${fixedComments.length === 1 ? '' : 's'}`);
  if (fixedCICount > 0) msgParts.push(`${fixedCICount} CI failure${fixedCICount === 1 ? '' : 's'}`);
  const commitMessage = msgParts.length > 0
    ? `fix: no-issue: auto-fix ${msgParts.join(' and ')}`
    : 'fix: no-issue: auto-fix review suggestions';

  const pushed = commitAndPush(commitMessage);

  // Resolve fixed threads and reply on skipped threads
  if (pushed) {
    let resolved = 0;
    for (const comment of fixedComments) {
      await resolveThread(comment.threadId);
      resolved++;
    }
    console.log(`Resolved ${resolved} review thread${resolved === 1 ? '' : 's'}`);
  }

  for (const comment of skippedComments) {
    await replyToThread(
      comment.threadId,
      `🦸 **Review Hero Auto-Fix** skipped this comment: ${comment.reason}`,
    );
  }

  // Post summary
  const summaryParts = ['🦸 **Review Hero Auto-Fix**\n'];

  if (pushed) {
    const fixedParts = [];
    if (fixedComments.length > 0) fixedParts.push(`${fixedComments.length} review comment${fixedComments.length === 1 ? '' : 's'}`);
    if (fixedCICount > 0) fixedParts.push(`${fixedCICount} CI failure${fixedCICount === 1 ? '' : 's'}`);
    summaryParts.push(`Applied fixes for ${fixedParts.join(' and ')}.`);
  } else {
    summaryParts.push('No file changes were needed.');
  }

  if (skippedComments.length > 0) {
    summaryParts.push(`\n\nSkipped ${skippedComments.length} comment${skippedComments.length === 1 ? '' : 's'} (replied on each thread).`);
  }

  await postComment(summaryParts.join(''));
  await uncheckCheckboxes();
  console.log('Done');
}

main().catch(async err => {
  console.error(err);
  try {
    await postComment(
      `🦸 **Review Hero Auto-Fix** failed — check the [workflow logs](https://github.com/${repo}/actions) for details.`,
    );
    await uncheckCheckboxes();
  } catch {
    // best effort
  }
  process.exit(1);
});
