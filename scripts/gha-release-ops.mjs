/* eslint-disable no-console */

export async function createReleaseBranch({ readFileSync }, github, context, cwd) {
  console.log('Reading current version...');
  const { version } = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf-8'));

  const [major, minor] = version.split('.', 3);
  const branch = `release/${major}.${minor}`;
  console.log('Release branch:', branch);

  const {
    sha,
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

  console.log("It doesn't, creating branch...");
  await github.rest.git.createRef({ owner, repo, ref: `refs/${ref}`, sha });
  console.log('Creating draft release...');
  await createDraftRelease({ readFileSync }, github, context, cwd, version);
  console.log('Done.');
}

export async function createDraftRelease({ readFileSync }, github, context, cwd, version) {
  const template = readFileSync(
    `${cwd}/.github/PULL_REQUEST_TEMPLATE/release_candidate.md`,
    'utf8',
  );

  await github.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: `v${version}`,
    name: `v${version}`,
    draft: true,
    prerelease: false,
    body: template.replace(/%VERSION%/g, version),
  });
}

export async function publishRelease(github, context, version) {
  let release;
  try {
    console.log(`Fetch release ${version}...`);
    release = (
      (await github.repos.getReleaseByTag({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag: `v${version}`,
      })) || {}
    ).data;
  } catch (err) {
    if (err.toString().includes('Not Found')) {
      console.log('Release not found, skipping');
      return;
    }

    throw err;
  }

  if (!release || !release.draft) {
    console.log(`Release ${version} is not a draft, skipping`);
    return;
  }

  console.log('Publishing release...');
  await github.repos.updateRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: release.id,
    draft: false,
  });
  console.log('Done.');
}
