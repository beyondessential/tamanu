/* eslint-disable no-console */

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
    query($owner: String!, $name: String!, $cursor: String) {) {
      repository(owner: $owner, name: $name, before: $cursor) {
        releases(last: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
          nodes {
            databaseId,
            name,
            tagName
          }
          edges {
            cursor
          }
        }
      }
    }
    `,
    {
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

async function findRelease(github, context, fn) {
  let nextCursor = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await getReleases(github, context, nextCursor);
    if (!data) break;

    const { cursor, releases } = data;
    nextCursor = cursor;

    for (const release of releases) {
      if (fn(release.tagName) || fn(release.name)) {
        return release.databaseId;
      }
    }
  }

  return false;
}

export async function publishRelease(github, context, version) {
  console.log(`Find release matching ${version}...`);
  const releaseId = await findRelease(
    github,
    context,
    name => name === `v${version}` || name === version,
  );

  if (!releaseId) {
    console.log(`::error title=Not found::Release ${version} not found!`);
    throw new Error(`Release ${version} not found!`);
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

  let markLatest = true;
  // Lookup published releases for the *next* release branch(es):
  // if there are any, we won't mark this release as latest.
  // To deal with skipped release branches, we'll look up to 3 forward.
  const [major, minor] = version.split('.', 3);
  if (
    await findRelease(
      github,
      context,
      name =>
        name.startsWith(`v${major + 1}.`) ||
        name.startsWith(`v${major}.${minor + 1}`) ||
        name.startsWith(`v${major}.${minor + 2}`) ||
        name.startsWith(`v${major}.${minor + 3}`),
    )
  ) {
    console.log('Not marking release as latest');
    console.log(`::notice title=Hotfix::Release ${version} not marked latest`);
    markLatest = false;
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
