/* eslint-disable no-console */

export function currentVersion({ readFileSync }, cwd) {
  console.log('Reading current version...');
  const { version } = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf-8'));

  const [major, minor] = version.split('.', 3);
  const branch = `release/${major}.${minor}`;
  console.log('Release branch:', branch);

  return { version, major, minor, branch };
}

export async function checkBranchDoesNotExist(github, context, branch) {
  const {
    repo: { owner, repo },
  } = context;

  console.log('Checking if branch exists...');
  const ref = `heads/${branch}`;
  try {
    const exists = await github.rest.git.getRef({ owner, repo, ref });
    if (exists.status === 200) {
      throw new Error(`Branch ${branch} already exists`);
    }
  } catch (err) {
    if (!err.toString().includes('Not Found')) {
      throw err;
    } // else it's what we expect
  }
}
