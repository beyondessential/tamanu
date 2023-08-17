/* eslint-disable no-console */

// Set by github
const MAX_GITHUB_RELEASES_BATCH_SIZE = 100;

export async function createReleaseBranch({ readFileSync }, github, context, cwd, nextVersionSpec) {
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

  console.log('Creating release cutoff commit...');
  await github.graphql(
    `
    mutation ($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit { url }
      }
    }
    `,
    {
      input: {
        branch: {
          repositoryNameWithOwner: `${owner}/${repo}`,
          branchName: branch,
        },
        message: {
          headline: `Cut-off for release branch ${major}.${minor}`,
        },
        expectedHeadOid: sha,
      },
    },
  );

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

async function getReleases(github, context, cursor = null) {
  const {
    data: {
      repository: { releases },
    },
  } = await github.graphql(
    `
    query($owner: String!, $name: String!, $cursor: String, $batchSize: Int) {
      repository(owner: $owner, name: $name) {
        releases(last: $batchSize, before: $cursor, orderBy: { field: CREATED_AT, direction: DESC }) {
          nodes {
            databaseId,
            name,
            tagName,
            isDraft
          }
          edges {
            cursor
          }
        }
      }
    }
    `,
    {
      batchSize: MAX_GITHUB_RELEASES_BATCH_SIZE,
      owner: context.repo.owner,
      name: context.repo.repo,
      cursor,
    },
  );

  return releases.nodes.length
    ? {
        cursor: releases.edges[releases.edges.length - 1].cursor,
        releases: releases.nodes,
      }
    : null;
}

async function findRelease(github, context, testForMatch) {
  let nextCursor = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await getReleases(github, context, nextCursor);
    if (!data) break;

    const { cursor, releases } = data;
    nextCursor = cursor;

    for (const release of releases) {
      if (testForMatch(release.tagName, release) || testForMatch(release.name, release)) {
        return release;
      }
    }
  }

  return null;
}

export async function publishRelease(github, context, version) {
  console.log(`Find draft release matching ${version}...`);
  const releaseId = await findRelease(
    github,
    context,
    (name, { isDraft }) => isDraft && (name === `v${version}` || name === version),
  )?.databaseId;

  if (!releaseId) {
    console.log(`::error title=Draft not found::Draft release ${version} not found!`);
    throw new Error(`Draft release ${version} not found!`);
  }

  console.log(`Get release #${releaseId}...`);
  const release = (
    await github.rest.repos.getRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      releaseId,
    })
  )?.data;

  if (!release?.draft) {
    console.log(`Release ${version} is not a draft, skipping`);
    console.log(
      `::warning title=Not a draft::Release ${version} is not a draft, skipped publishing`,
    );
    return;
  }

  console.log('Fetching latest published release...');
  let markLatest = true;
  const latestPublished = await findRelease(github, context, (_, { isDraft }) => !isDraft);
  if (!latestPublished) {
    console.log('No published releases found');
  } else {
    console.log(
      `Latest published release is ${latestPublished.name} (tag: ${latestPublished.tagName})`,
    );
    const [thisMajor, thisMinor] = version.split('.', 3);
    const [, latestMajor, latestMinor] = (latestPublished.name ?? latestPublished.tagName).match(
      /^v?(\d+)[.](\d+)/,
    );

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
