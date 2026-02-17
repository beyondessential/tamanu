/**
 * AI Review Orchestrator
 *
 * Reads structured JSON findings from all 5 review agent artifacts,
 * deduplicates them, and posts a consolidated PR review via GitHub API.
 *
 * Environment variables:
 *   GITHUB_TOKEN        — GitHub token for API calls
 *   GITHUB_REPOSITORY   — owner/repo
 *   PR_NUMBER           — Pull request number
 *   ARTIFACTS_DIR       — Directory containing agent result files
 */

import { readFileSync, existsSync } from 'node:fs';

const AGENT_NAMES = {
  bugs: 'Bugs & Correctness',
  performance: 'Performance',
  design: 'Design & Architecture',
  bes: 'BES Requirements',
  security: 'Security',
};

const SEVERITY_ORDER = { critical: 0, suggestion: 1, nitpick: 2 };

function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseAgentResult(filePath, agentKey) {
  try {
    const raw = readFileSync(filePath, 'utf-8');

    // Claude CLI --output-format json wraps the response in a JSON object
    // with a "result" field containing the text output
    let text = raw;
    try {
      const parsed = JSON.parse(raw);
      // Handle Claude CLI JSON output format
      if (parsed.result) {
        text = parsed.result;
      } else if (Array.isArray(parsed)) {
        // Already a parsed array
        return parsed.map(f => ({ ...f, agent: agentKey }));
      }
    } catch {
      // Not valid JSON at top level — might be raw text with JSON embedded
    }

    // Extract JSON array from text (agent might output explanation around it)
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.warn(`No JSON array found in ${filePath}`);
      return [];
    }

    const findings = JSON.parse(match[0]);
    if (!Array.isArray(findings)) return [];

    return findings
      .filter(f => f.file && f.severity && f.comment && typeof f.line === 'number' && f.line > 0)
      .map(f => ({
        file: f.file,
        line: f.line,
        severity: f.severity,
        comment: f.comment,
        agent: agentKey,
      }));
  } catch (err) {
    console.warn(`Failed to parse ${filePath}: ${err.message}`);
    return [];
  }
}

function deduplicateFindings(findings) {
  // Sort for deterministic grouping across runs
  const sortedFindings = [...findings].sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  // Group findings by (file, approximate line) and merge overlapping ones
  const groups = new Map();

  for (const finding of sortedFindings) {
    // Create a bucket key: same file, lines within ±3 of each other
    let merged = false;
    for (const group of groups.values()) {
      if (
        group[0].file === finding.file &&
        Math.abs(group[0].line - finding.line) <= 3
      ) {
        // Check for similar content (basic dedup — same agent shouldn't double-report)
        const isDuplicate = group.some(
          g => g.agent === finding.agent && g.comment === finding.comment,
        );
        if (!isDuplicate) {
          group.push(finding);
        }
        merged = true;
        break;
      }
    }
    if (!merged) {
      const key = `${finding.file}:${finding.line}`;
      groups.set(key, [finding]);
    }
  }

  return groups;
}

function buildInlineComment(group) {
  // Merge multiple agent findings at the same location into one comment
  return group
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .map(f => {
      const agentName = AGENT_NAMES[f.agent] ?? f.agent;
      return `**[${agentName}]** \`${f.severity}\`\n\n${f.comment}`;
    })
    .join('\n\n---\n\n');
}

async function githubApi(endpoint, options = {}) {
  const token = getEnvOrThrow('GITHUB_TOKEN');
  const repo = getEnvOrThrow('GITHUB_REPOSITORY');
  const baseUrl = `https://api.github.com/repos/${repo}`;

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
}

async function getLatestCommit(prNumber) {
  const pr = await githubApi(`/pulls/${prNumber}`);
  return pr.head.sha;
}

async function postReview(prNumber, commitSha, inlineComments) {
  // Post a PR review with inline comments
  const body = {
    commit_id: commitSha,
    event: 'COMMENT',
    comments: inlineComments.map(c => ({
      path: c.path,
      line: c.line || 1,
      body: c.body,
    })),
  };

  await githubApi(`/pulls/${prNumber}/reviews`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function postComment(prNumber, body) {
  await githubApi(`/issues/${prNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

function buildSummaryTable(nitpicks) {
  if (nitpicks.length === 0) return '';

  const rows = nitpicks
    .map(f => {
      const agentName = AGENT_NAMES[f.agent] ?? f.agent;
      const shortComment =
        f.comment.length > 120 ? `${f.comment.slice(0, 117)}...` : f.comment;
      return `| \`${f.file}\` | ${f.line} | ${agentName} | ${shortComment} |`;
    })
    .join('\n');

  return `### Nitpicks\n\n| File | Line | Agent | Comment |\n|------|------|-------|---------|\n${rows}`;
}

async function main() {
  const prNumber = getEnvOrThrow('PR_NUMBER');
  const artifactsDir = getEnvOrThrow('ARTIFACTS_DIR');

  console.log(`Orchestrating AI review for PR #${prNumber}`);

  // Collect findings from all agents
  const allFindings = [];
  let agentsCompleted = 0;
  let agentsFailed = 0;

  for (const agentKey of Object.keys(AGENT_NAMES)) {
    const filePath = `${artifactsDir}/review-${agentKey}/result.json`;
    if (!existsSync(filePath)) {
      console.warn(`Missing artifact: ${filePath}`);
      agentsFailed++;
      continue;
    }

    const findings = parseAgentResult(filePath, agentKey);
    console.log(`${AGENT_NAMES[agentKey]}: ${findings.length} findings`);
    allFindings.push(...findings);
    agentsCompleted++;
  }

  if (agentsCompleted === 0) {
    await postComment(
      prNumber,
      '🤖 **AI Review** was requested but could not complete — all agents failed. Check the workflow logs for details.',
    );
    return;
  }

  // Deduplicate
  const groups = deduplicateFindings(allFindings);

  // Split by severity
  const inlineComments = [];
  const nitpicks = [];

  for (const [, group] of groups) {
    const highestSeverity = group.reduce(
      (min, f) =>
        SEVERITY_ORDER[f.severity] < SEVERITY_ORDER[min]
          ? f.severity
          : min,
      'nitpick',
    );

    if (highestSeverity === 'nitpick') {
      // All findings in this group are nitpicks — add to summary table
      nitpicks.push(...group);
    } else {
      // At least one critical or suggestion — make inline comment
      inlineComments.push({
        path: group[0].file,
        line: group[0].line,
        body: buildInlineComment(group),
      });
    }
  }

  // Count by severity
  const counts = { critical: 0, suggestion: 0, nitpick: 0 };
  for (const f of allFindings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }

  // Post inline review comments
  if (inlineComments.length > 0) {
    const commitSha = await getLatestCommit(prNumber);
    try {
      await postReview(prNumber, commitSha, inlineComments);
      console.log(`Posted ${inlineComments.length} inline review comments`);
    } catch (err) {
      console.error(`Failed to post inline review: ${err.message}`);
      // Fall back to posting inline comments in the summary
      const fallbackLines = inlineComments
        .map(c => `**\`${c.path}:${c.line}\`**\n\n${c.body}`)
        .join('\n\n---\n\n');
      await postComment(
        prNumber,
        `🤖 **AI Review** (could not post inline comments — showing here instead)\n\n${fallbackLines}`,
      );
    }
  }

  // Build and post summary
  const summaryParts = [
    `🤖 **AI Review Summary**\n`,
    `**${agentsCompleted} agent${agentsCompleted === 1 ? '' : 's'}** reviewed this PR`,
    agentsFailed > 0 ? ` | ${agentsFailed} failed` : '',
    ` | ${counts.critical} critical | ${counts.suggestion} suggestion${counts.suggestion === 1 ? '' : 's'} | ${counts.nitpick} nitpick${counts.nitpick === 1 ? '' : 's'}`,
  ];

  if (allFindings.length === 0) {
    summaryParts.push('\n\nNo issues found. Looks good! ✅');
  }

  const nitpickTable = buildSummaryTable(nitpicks);
  if (nitpickTable) {
    summaryParts.push(`\n\n${nitpickTable}`);
  }

  await postComment(prNumber, summaryParts.join(''));
  console.log('Posted summary comment');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
