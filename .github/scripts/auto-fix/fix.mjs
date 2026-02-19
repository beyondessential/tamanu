/**
 * Review Hero Auto-Fix
 *
 * Fetches unresolved review comments from a PR, pipes them to Claude CLI
 * to apply fixes, then commits and pushes the result.
 *
 * Environment variables:
 *   GITHUB_TOKEN        — GitHub token (with contents:write and pull-requests:write)
 *   GITHUB_REPOSITORY   — owner/repo
 *   PR_NUMBER           — Pull request number
 *   ANTHROPIC_API_KEY   — API key for Claude CLI
 *   REVIEW_HERO_APP_ID  — App ID for git commit identity
 *   AI_FIX_MODEL        — Model to use (default: claude-sonnet-4-5-20250929)
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
const appId = process.env.REVIEW_HERO_APP_ID ?? '';
const model = process.env.AI_FIX_MODEL ?? 'claude-sonnet-4-5-20250929';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function githubApi(endpoint, options = {}) {
  const baseUrl = `https://api.github.com/repos/${repo}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
    } catch (err) {
      if (attempt < 2) {
        console.warn(`GitHub API attempt ${attempt + 1} failed, retrying: ${err.message}`);
        await sleep(1000 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
}

async function githubGraphQL(query, variables) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
    } catch (err) {
      if (attempt < 2) {
        console.warn(`GraphQL attempt ${attempt + 1} failed, retrying: ${err.message}`);
        await sleep(1000 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
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
  if (threads.length === 0) {
    throw new Error('No review threads found — PR or repository may not exist');
  }
  const comments = [];

  for (const thread of threads) {
    if (thread.isResolved || thread.isOutdated) continue;

    const firstComment = thread.comments?.nodes?.[0];
    if (!firstComment?.path || !firstComment?.line) continue;

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

function buildPrompt(comments) {
  const promptMd = readFileSync('.github/scripts/auto-fix/prompt.md', 'utf-8');

  const commentsList = comments
    .map((c, i) => `### Comment ${i + 1}: \`${c.file}:${c.line}\`\n\n${c.comment}`)
    .join('\n\n---\n\n');

  return `${promptMd}\n\n## Review Comments to Fix (${comments.length})\n\n${commentsList}`;
}

function runClaude(prompt) {
  // Validate model to prevent command injection
  if (!/^[a-z0-9.-]+$/.test(model)) {
    throw new Error(`Invalid model name: ${model}`);
  }

  writeFileSync('/tmp/auto-fix-prompt.md', prompt);

  const result = execSync(
    `cat /tmp/auto-fix-prompt.md | claude -p ` +
    `--output-format json ` +
    `--model "${model}" ` +
    `--max-turns 30 ` +
    `--allowedTools "Read,Edit,Glob,Grep"`,
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

  // Try to parse as JSON first to extract .result field
  try {
    const parsed = JSON.parse(raw);
    text = parsed.result ?? raw;
  } catch {
    // If top-level parse fails, use raw text directly for extraction
  }

  // Extract JSON array regardless of whether top-level parse succeeded
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

function commitAndPush(commentCount) {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
  if (!status) {
    console.log('No file changes after auto-fix — Claude may have skipped all comments');
    return false;
  }

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
  execSync(
    `git commit -m "fix: no-issue: auto-fix ${commentCount} review suggestion${commentCount === 1 ? '' : 's'}\n\nCo-Authored-By: Review Hero <contact@bes.au>"`,
  );

  execSync('git push');
  console.log('Pushed auto-fix commit');
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

async function postComment(body) {
  await githubApi(`/issues/${prNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

async function uncheckAutoFix() {
  try {
    const pr = await githubApi(`/pulls/${prNumber}`);
    if (!pr.body) return;

    const updated = pr.body.replace(
      /\[x\]\s+\*\*Auto-fix review suggestions\*\* <!-- #auto-fix -->/,
      '[ ] **Auto-fix review suggestions** <!-- #auto-fix -->',
    );

    if (updated === pr.body) return;

    await githubApi(`/pulls/${prNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ body: updated }),
    });
    console.log('Unchecked auto-fix checkbox');
  } catch (err) {
    console.warn(`Failed to uncheck checkbox: ${err.message}`);
  }
}

async function main() {
  console.log(`Auto-fixing review comments for PR #${prNumber}`);

  const comments = await fetchUnresolvedComments();
  console.log(`Found ${comments.length} unresolved review comment${comments.length === 1 ? '' : 's'}`);

  if (comments.length === 0) {
    await postComment('🦸 **Review Hero Auto-Fix** — No unresolved review comments to fix.');
    await uncheckAutoFix();
    return;
  }

  const prompt = buildPrompt(comments);
  console.log('Running Claude to apply fixes...');
  const raw = runClaude(prompt);

  const results = parseClaudeResult(raw);
  const fixed = results.filter(r => r.status === 'fixed');
  const skipped = results.filter(r => r.status === 'skipped');

  const pushed = commitAndPush(fixed.length || comments.length);

  // Resolve threads for fixed comments
  const fixedFiles = new Set(fixed.map(r => `${r.file}:${r.line}`));
  for (const comment of comments) {
    const key = `${comment.file}:${comment.line}`;
    if (fixedFiles.has(key)) {
      await resolveThread(comment.threadId);
    }
  }
  // If Claude didn't return structured results but did push changes, resolve all
  if (pushed && fixed.length === 0 && results.length === 0) {
    for (const comment of comments) {
      await resolveThread(comment.threadId);
    }
  }

  const summaryParts = ['🦸 **Review Hero Auto-Fix**\n'];

  if (pushed) {
    summaryParts.push(`Applied fixes for ${fixed.length || comments.length} review comment${(fixed.length || comments.length) === 1 ? '' : 's'}.`);
  } else {
    summaryParts.push('No file changes were needed.');
  }

  if (skipped.length > 0) {
    const skippedList = skipped
      .map(s => `| \`${s.file}:${s.line}\` | ${s.reason ?? 'Unknown'} |`)
      .join('\n');
    summaryParts.push(`\n\n### Skipped\n\n| Location | Reason |\n|----------|--------|\n${skippedList}`);
  }

  await postComment(summaryParts.join(''));
  await uncheckAutoFix();
  console.log('Done');
}

main().catch(async err => {
  console.error(err);
  try {
    await postComment(
      `🦸 **Review Hero Auto-Fix** failed — check the [workflow logs](https://github.com/${repo}/actions) for details.`,
    );
    await uncheckAutoFix();
  } catch {
    // best effort
  }
  process.exit(1);
});
