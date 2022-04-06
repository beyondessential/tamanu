import { promises as fs } from 'fs';

import { request } from '@octokit/request';

const { CI_COMMIT_ID, CI_COMMIT_DESCRIPTION, CI_PR_NUMBER, GITHUB_TOKEN } = process.env;

const headers = {
  authorization: `token ${GITHUB_TOKEN}`,
};

async function findExistingComment(header) {
  console.log('Fetching existing comment with header:', header);

  const comments = await request(
    'GET /repos/{owner}/{repo}/issues/{number}/comments?per_page=100',
    {
      headers,
      owner: 'beyondessential',
      repo: 'tamanu',
      number: CI_PR_NUMBER,
    },
  );

  return comments.data.find(c => c.body.startsWith(`### ${header}`));
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

async function postComment(markdown) {
  console.log('Posting new comment');

  await request('POST /repos/{owner}/{repo}/issues/{number}/comments', {
    headers,
    owner: 'beyondessential',
    repo: 'tamanu',
    number: CI_PR_NUMBER,
    body: markdown,
  });
}

(async function(markdownFile, editIntoCommentWithHeader = false) {
  if (!markdownFile) throw new Error('No markdown file specified');
  if (!CI_PR_NUMBER)
    throw new Error('No CI_PR_NUMBER environment variable: are we running in CI in a PR context?');
  if (!GITHUB_TOKEN) throw new Error('No GITHUB_TOKEN');

  console.log({ CI_PR_NUMBER, markdownFile, editIntoCommentWithHeader });

  const markdownContent = await fs.readFile(markdownFile, 'utf8');
  const markdown =
    (editIntoCommentWithHeader ? `### ${editIntoCommentWithHeader}\n` : '') +
    (CI_COMMIT_ID && CI_COMMIT_DESCRIPTION
      ? `_From CI at ${new Date().toISOString()} — commit ${CI_COMMIT_ID}: "${CI_COMMIT_DESCRIPTION}"_\n`
      : '') +
    '\n\n' +
    markdownContent;

  const existingComment = editIntoCommentWithHeader
    ? await findExistingComment(editIntoCommentWithHeader)
    : null;

  if (existingComment) {
    await updateComment(existingComment.id, markdown);
  } else {
    await postComment(markdown);
  }

  console.log('Done.');
})(...process.argv.slice(2)).catch(e => {
  console.error(e);
  process.exit(e.status || e.code || 1);
});
