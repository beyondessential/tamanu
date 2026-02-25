/**
 * Review Hero Triage
 *
 * Calls Claude Haiku to decide which review agents are relevant for this PR,
 * then calculates max-turns based on diff size.
 *
 * Environment variables:
 *   DIFF_PATH          — Path to the PR diff file
 *   ANTHROPIC_API_KEY  — API key for Claude
 */

import { readFileSync, appendFileSync } from 'node:fs';

const ALL_AGENTS = [
  { key: 'bugs', prompt: 'bugs.md', description: 'Logic errors, edge cases, null/undefined, race conditions, async/await, type mismatches' },
  { key: 'performance', prompt: 'performance.md', description: 'N+1 queries, unbounded findAll, expensive loops, re-renders, missing indexes, memory leaks' },
  { key: 'design', prompt: 'design.md', description: 'Architecture, separation of concerns, wrong abstractions, DRY violations' },
  { key: 'bes', prompt: 'bes-requirements.md', description: 'Tamanu conventions, migrations, FHIR, sync, Australian English, TranslatedText, permissions' },
  { key: 'security', prompt: 'security.md', description: 'SQL injection, XSS, auth bypass, sensitive data exposure, input validation' },
];

const diffPath = process.env.DIFF_PATH;
if (!diffPath) {
  console.error('Missing DIFF_PATH');
  process.exit(1);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const diff = readFileSync(diffPath, 'utf-8');

// Extract changed file paths from diff headers
const changedFiles = [...diff.matchAll(/^diff --git a\/.+ b\/(.+)$/gm)]
  .map(m => m[1]);

const diffLines = diff.split('\n')
  .filter(l => l.startsWith('+') || l.startsWith('-')).length;

// Scale max-turns with diff size
let maxTurns;
if (diffLines < 100) {
  maxTurns = 3;
} else if (diffLines < 500) {
  maxTurns = 5;
} else {
  maxTurns = 10;
}

// Ask Haiku which agents are relevant
const agentList = ALL_AGENTS
  .map(a => `- ${a.key}: ${a.description}`)
  .join('\n');

const prompt = `You are triaging a PR for code review. Given the changed files below, decide which review agents are relevant. Only include agents that are likely to find issues for these specific changes.

## Available agents
${agentList}

## Changed files (${changedFiles.length} files, ~${diffLines} changed lines)
${changedFiles.join('\n')}

Output ONLY a JSON array of agent keys, e.g. ["bugs", "security"]. Always include "bugs". No explanation.`;

let selectedKeys;
try {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  const text = result.content[0].text.trim();
  selectedKeys = JSON.parse(text);

  if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
    throw new Error(`Unexpected triage output: ${text}`);
  }
} catch (err) {
  // Fall back to all agents if triage fails
  console.warn(`Triage failed, running all agents: ${err.message}`);
  selectedKeys = ALL_AGENTS.map(a => a.key);
}

// Ensure bugs is always included
if (!selectedKeys.includes('bugs')) {
  selectedKeys.unshift('bugs');
}

const agents = ALL_AGENTS.filter(a => selectedKeys.includes(a.key))
  .map(({ key, prompt: p }) => ({ key, prompt: p }));

console.log(`Diff: ${diffLines} changed lines across ${changedFiles.length} files`);
console.log(`Agents: ${agents.map(a => a.key).join(', ')} (${agents.length}/${ALL_AGENTS.length})`);
console.log(`Max turns: ${maxTurns}`);

// Output for GHA
const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  const matrix = JSON.stringify({ agents });
  appendFileSync(outputFile, `matrix=${matrix}\n`);
  appendFileSync(outputFile, `max_turns=${maxTurns}\n`);
}
