/* eslint-disable no-console */

// Set by github
const MAX_GITHUB_RELEASES_BATCH_SIZE = 100;

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

  // console.log('It does not, creating release cutoff commit...');
  // const currentTree = await github.rest.git.getCommit({
  //   owner,
  //   repo,
  //   commit_sha: sha,
  // });
  // const tree = await github.rest.git.createTree({
  //   owner,
  //   repo,
  //   tree: [], // empty commit
  //   base_tree: currentTree.data.tree.sha,
  // });
  // const tip = await github.rest.git.createCommit({
  //   owner,
  //   repo,
  //   message: `Cut-off for release branch ${major}.${minor}`,
  //   tree: tree.data.sha,
  //   parents: [sha],
  // });

  // console.log('Creating branch...');
  // await github.rest.git.createRef({ owner, repo, ref: `refs/${ref}`, sha: tip.data.sha });

export async function createNextDraft({ readFileSync }, github, context, cwd, nextVersionSpec) {
  const { major, minor } = currentVersion({ readFileSync }, cwd);

  let nextVersion;
  switch (nextVersionSpec) {
    case 'patch':
      throw new Error('Patch version bump is not supported');
    case 'minor':
      nextVersion = `${major}.${Number(minor) + 1}.0`;
      break;
    case 'major':
      nextVersion = `${Number(major) + 1}.0.0`;
      break;
    default:
      nextVersion = nextVersionSpec;
  }
  console.log(`Creating draft release for next ${nextVersionSpec} (${nextVersion})...`);
  await createDraftRelease({ readFileSync }, github, context, cwd, nextVersion);

  console.log('Done.');
}

export async function createDraftRelease({ readFileSync }, github, context, cwd, version) {
  const template = readFileSync(
    `${cwd}/.github/PULL_REQUEST_TEMPLATE/release_candidate.md`,
    'utf8',
  );

  await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: `v${version}`,
    name: `v${version}`,
    draft: true,
    prerelease: false,
    make_latest: false,
    body: template.replace(/%VERSION%/g, version),
  });
}

async function getPublishedReleases(github, context, cursor = null) {
  // GraphQL is more efficient than API but doesn't contain draft releases
  const {
    repository: { releases },
  } = await github.graphql(
    `
    query($owner: String!, $repo: String!, $cursor: String, $batchSize: Int) {
      repository(owner: $owner, name: $repo) {
        releases(last: $batchSize, before: $cursor, orderBy: { field: CREATED_AT, direction: DESC }) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            databaseId
            name
            tagName
            description
            isDraft
          }
        }
      }
    }
    `,
    {
      batchSize: MAX_GITHUB_RELEASES_BATCH_SIZE,
      owner: context.repo.owner,
      repo: context.repo.repo,
      cursor,
    },
  );

  // isDraft filtering there just in case they start adding them to GraphQL
  return releases.nodes.length
    ? {
        cursor: releases.pageInfo.hasNextPage && releases.pageInfo.endCursor,
        releases: releases.nodes.filter(release => !release.isDraft),
      }
    : null;
}

async function findDraftRelease(github, context, testForMatch) {
  // Less efficient than above GraphQL (30 per page), but includes drafts
  for await (const response of github.paginate.iterator(github.rest.issues.listReleases, {
    owner: context.repo.owner,
    repo: context.repo.repo,
  })) {
    for (const release of response.data) {
      if (!release.draft) continue;
      console.log(`::debug:: Draft release ${JSON.stringify(release)}`);
      if (testForMatch(release.tagName, release) || testForMatch(release.name, release)) {
        return release;
      }
    }
  }

  return null;
}

async function findPublishedRelease(github, context, testForMatch) {
  let nextCursor = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await getPublishedReleases(github, context, nextCursor);
    if (!data) break;

    const { cursor, releases } = data;
    if (!cursor) break;
    nextCursor = cursor;

    for (const release of releases) {
      console.log(`::debug:: Published release ${JSON.stringify(release)}`);
      if (testForMatch(release.tagName, release) || testForMatch(release.name, release)) {
        return release;
      }
    }
  }

  return null;
}

export async function publishRelease(github, context, version) {
  console.log(`Find draft release matching ${version}...`);
  const release = await findDraftRelease(
    github,
    context,
    name => name === `v${version}` || name === version,
  );

  if (!release) {
    console.log(`::error title=Draft not found::Draft release ${version} not found!`);
    throw new Error(`Draft release ${version} not found!`);
  }

  console.log('Fetching latest published release...');
  let markLatest = true;
  const latestPublished = await findPublishedRelease(github, context, () => true);
  if (!latestPublished) {
    console.log('No published releases found');
  } else {
    console.log(
      `Latest published release is tag=${latestPublished.tagName} name=${latestPublished.name}`,
    );
    const [thisMajor, thisMinor] = version.split('.', 3);
    const [, latestMajor, latestMinor] = latestPublished.tagName.match(/^v?(\d+)[.](\d+)/);

    if (
      parseInt(thisMajor) < parseInt(latestMajor) ||
      parseInt(thisMinor) < parseInt(latestMinor)
    ) {
      console.log('Not marking release as latest as there is a higher published version');
      console.log(`::notice title=Hotfix::Release ${version} not marked latest`);
      markLatest = false;
    }
  }

  console.log('Publishing release...');
  await github.rest.repos.updateRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: release.id,
    draft: false,
    make_latest: markLatest,
  });
  console.log('Done.');
}

export async function uploadToRelease({ fs, github, context, artifactsDir, version, section }) {
  // Presumption is that there are less drafts than published releases, so first check if this
  // version is in draft, just in case this workflow happens to run before the release is published.
  console.log(`Find draft release matching ${version}...`);
  let release = await findDraftRelease(
    github,
    context,
    name => name === `v${version}` || name === version,
  );

  if (!release) {
    console.log(`Find published release matching ${version}...`);
    release = await findPublishedRelease(
      github,
      context,
      name => name === `v${version}` || name === version,
    );
  }

  if (!release) {
    throw new Error('Cannot find a matching release!');
  }

  // GraphQL and API have different names for the same fields
  const releaseId = release.databaseId ?? release.id;
  const body = release.description ?? release.body;

  console.log('Updating release description');
  await github.rest.repos.updateRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    release_id: releaseId,
    body: `${body}\n\n${section}`,
  });

  const fileList = await fs.readdir(artifactsDir);
  for (const file of fileList) {
    console.log('Uploading', file, 'to release', releaseId);
    await github.rest.repos.uploadReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
      name: file,
      data: await fs.readFile(`${artifactsDir}/${file}`),
    });
  }

  console.log('Done.');
}
