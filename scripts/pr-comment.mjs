import { promises as fs } from 'fs';

import { request } from '@octokit/request';

const { CI_COMMIT_ID, CI_PR_NUMBER, GITHUB_TOKEN } = process.env;

const headers = {
  authorization: `token ${GITHUB_TOKEN}`,
};

async function findPrFromCommit() {
  console.log('Fetching PR number from commit ID:', CI_COMMIT_ID);

  const prs = await request('GET /search/issues?q={query}', {
    headers,
    query: `type:pr is:open repo:beyondessential/tamanu ${CI_COMMIT_ID}`,
  });

  if (prs.data.total_count < 1) throw new Error('No PR found for commit ID');
  if (prs.data.total_count > 1)
    console.warn(`${prs.data.total_count} PRs found for commit ID, using the first one`);

  return prs.data.items[0].number;
}

async function findExistingComment(prNumber, header) {
  console.log('Fetching existing comment with header:', header);

  const comments = await request(
    'GET /repos/{owner}/{repo}/issues/{number}/comments?per_page=100',
    {
      headers,
      owner: 'beyondessential',
      repo: 'tamanu',
      number: prNumber,
    },
  );

  const myself = await request('GET /user', { headers });

  return comments.data.find(
    c => c.user.id === myself.data.id && c.body.startsWith(`### ${header}`),
  );
}

async function updateComment(id, markdown) {
  console.log('Updating comment ID:', id);

  await request('PATCH /repos/{owner}/{repo}/issues/comments/{id}', {
    headers,
    owner: 'beyondessential',
    repo: 'tamanu',
    id,
    body: markdown,
  });
}

async function postComment(prNumber, markdown) {
  console.log('Posting new comment');

  await request('POST /repos/{owner}/{repo}/issues/{number}/comments', {
    headers,
    owner: 'beyondessential',
    repo: 'tamanu',
    number: prNumber,
    body: markdown,
  });
}

(async function(markdownFile, editIntoCommentWithHeader = false) {
  if (!markdownFile) throw new Error('No markdown file specified');
  if (!GITHUB_TOKEN) throw new Error('No GITHUB_TOKEN');

  const prNumber = CI_PR_NUMBER && CI_PR_NUMBER !== '0' ? CI_PR_NUMBER : await findPrFromCommit();

  console.log({ prNumber, markdownFile, editIntoCommentWithHeader });

  const markdownContent = await fs.readFile(markdownFile, 'utf8');
  const markdown =
    (editIntoCommentWithHeader ? `### ${editIntoCommentWithHeader}\n` : '') +
    (CI_COMMIT_ID ? `_From CI at ${new Date().toISOString()} — commit ${CI_COMMIT_ID}_\n` : '') +
    '\n\n' +
    markdownContent;

  const existingComment = editIntoCommentWithHeader
    ? await findExistingComment(prNumber, editIntoCommentWithHeader)
    : null;

  if (existingComment) {
    await updateComment(existingComment.id, markdown);
  } else {
    await postComment(prNumber, markdown);
  }

  console.log('Done.');
})(...process.argv.slice(2)).catch(e => {
  console.error(e);
  process.exit(e.status || e.code || 1);
});
