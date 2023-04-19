/* eslint-disable no-console */

export async function run({ readFileSync }, github, context) {
  console.log('Reading current version...');
  const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

  const [major, minor] = version.split('.', 3);
  const branch = `release/${major}.${minor}`;
  console.log('Release branch:', branch);

  const {
    sha,
    repo: { owner, repo },
  } = context;

  console.log('Checking if branch exists...');
  const ref = `refs/heads/${branch}`;
  const exists = await github.rest.git.getRef({ owner, repo, ref });
  if (exists.status === 200) {
    throw new Error(`Branch ${branch} already exists`);
  }

  console.log("It doesn't, creating branch...");
  await github.rest.git.createRef({ owner, repo, ref, sha });
  console.log('Done.');
}
