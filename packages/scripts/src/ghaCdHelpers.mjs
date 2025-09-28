/* eslint-disable no-console */

const RX_DEPLOY_LINE =
  /^\s*-\s+\[(?<enabled>[\sx])\]\s+.+(?:<!--)?\s*#deploy(?:=(?<name>[\w-]+))?\s*(?:-->)?\s*(?:%(?<options>.+))?(?:-->)?/;
const RX_BRANCH_LINE = /(?:<!--)?\s*#branch=(?<ref>[^\s]+)\s*(?:-->)?/;

// It's important this remains stable or doesn't change: doing so will create
// new deploys for everything that uses the default deploy name, and we may lose
// track of the old deploys.
export function stackName(head_ref, ref_name = null) {
  return (head_ref || ref_name)
    .toLowerCase()
    .replace(/^refs\/(heads|tags)\//, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 63 - 'tamanu-'.length) // max length of namespace, excl prefix
    .replace(/^-|-$/g, '');
}

export function parseDeployConfig({ body, control, ref }, context) {
  const deployName = stackName(ref);

  const deploys = [];
  for (const line of body?.split(/\r?\n/) ?? []) {
    let deployLine = RX_DEPLOY_LINE.exec(line);
    if (deployLine) {
      deploys.push({
        enabled: deployLine.groups.enabled === 'x',
        name: [deployName, deployLine.groups.name].filter(Boolean).join('-'),
        options: parseOptions(deployLine.groups.options ?? '', { ...context, ref }),
        control,
      });
    }
  }

  return deploys;
}

function intBounds(input, [low, high]) {
  const value = typeof input === 'number' ? input : parseInt(input, 10);
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

const OPTIONS = [
  { key: 'facilities', defaultValue: 2, parse: (input) => intBounds(input, [0, 5]) },
  {
    key: 'config',
    defaultValue: (_options, { ref, eventName }) => {
      if (eventName === 'pull_request') return 'pr';
      if (ref.startsWith('release/')) return 'rc';
      return 'basic';
    },
  },
  { key: 'env', defaultValue: 'staging' },
  { key: 'timezone', defaultValue: 'Pacific/Auckland' },
  { key: 'ip', defaultValue: null, parse: (input) => input.split(',').map((s) => s.trim()) },
  { key: 'dbstorage', defaultValue: 10, parse: (input) => intBounds(input, [10, 100]) },
  { key: 'arch', defaultValue: 'arm64' },
  { key: 'opsref', defaultValue: 'main' },
  { key: 'opsstack', defaultValue: 'tamanu/on-k8s' },
  { key: 'k8score', defaultValue: 'tamanu-internal-main' },
  { key: 'pause', defaultValue: false, presence: true },
  { key: 'imagesonly', defaultValue: false, presence: true },

  { key: 'apis', defaultValue: 2, parse: (input) => intBounds(input, [0, 5]) },
  {
    key: 'centralapis',
    defaultValue: (options) => intBounds(options.apis, [0, 5]),
    parse: (input) => intBounds(input, [0, 5]),
  },
  {
    key: 'facilityapis',
    defaultValue: (options) => intBounds(options.apis, [0, 5]),
    parse: (input) => intBounds(input, [0, 5]),
  },

  { key: 'tasks', defaultValue: 1, parse: (input) => intBounds(input, [0, 1]) },
  {
    key: 'centraltasks',
    defaultValue: (options) => intBounds(options.tasks, [0, 1]),
    parse: (input) => intBounds(input, [0, 1]),
  },
  {
    key: 'facilitytasks',
    defaultValue: (options) => intBounds(options.tasks, [0, 1]),
    parse: (input) => intBounds(input, [0, 1]),
  },

  { key: 'webs', defaultValue: 2, parse: (input) => intBounds(input, [0, 5]) },
  {
    key: 'centralwebs',
    defaultValue: (options) => intBounds(options.webs, [0, 5]),
    parse: (input) => intBounds(input, [0, 5]),
  },
  {
    key: 'facilitywebs',
    defaultValue: (options) => intBounds(options.webs, [0, 5]),
    parse: (input) => intBounds(input, [0, 5]),
  },

  { key: 'patientportals', defaultValue: 1, parse: (input) => intBounds(input, [0, 5]) },

  { key: 'dbs', defaultValue: 2, parse: (input) => intBounds(input, [2, 3]) },
  {
    key: 'centraldbs',
    defaultValue: (options) => intBounds(options.dbs, [2, 3]),
    parse: (input) => intBounds(input, [2, 3]),
  },
  {
    key: 'facilitydbs',
    defaultValue: (options) => intBounds(options.dbs, [2, 3]),
    parse: (input) => intBounds(input, [2, 3]),
  },
  {
    /*
     * Specifies the behavior for building mobile assets.
     * Options:
     *   - 'normal' (default): Build mobile assets according to deployment settings.
     *   - 'always': Build mobile assets regardless of deployment settings.
     *   - 'never': Do not build mobile assets.
     */
    key: 'mobile',
    defaultValue: 'normal',
    parse: (input) => (['normal', 'always', 'never'].includes(input) ? input : 'normal'),
  },
  {
    /*
     * Specifies the branding to use in the mobile build.
     * Options:
     *  - 'tamanu' (default): Use the Tamanu branding.
     */
    key: 'branding',
    defaultValue: 'tamanu',
    parse: (input) => (['tamanu'].includes(input) ? input : 'tamanu'),
  },
  {
    key: 'serviceaccountarn',
    defaultValue: 'arn:aws:iam::143295493206:role/ips-bucket-role-de7b385',
  },
  {
    /*
     * Specifies the subdomain names of the Facility servers.
     * Comma-separated.
     */
    key: 'facilitynames',
    defaultValue: null,
    parse: (input) => input.split(','),
  },
  {
    /*
     * How many rounds of fake data to generate.
     */
    key: 'fakedata',
    defaultValue: 0,
    parse: (input) => intBounds(input, [0, 100]),
  },
];

function stripPercent(str) {
  if (str.startsWith('%')) return str.slice(1);
  return str;
}

function parseOptions(str, context) {
  const inputs = new Map(
    str
      .split(/\s+/)
      .map((opt) => opt.trim().split('='))
      .map(([key, value]) => [stripPercent(key.toLowerCase()), value])
      .filter(([key]) => !!key),
  );

  const options = {};
  for (const { key, defaultValue, parse = null, presence = false } of OPTIONS) {
    if (!inputs.has(key)) {
      if (typeof defaultValue === 'function') {
        options[key] = defaultValue(options, context);
      } else {
        options[key] = defaultValue;
      }
      continue;
    }

    if (presence) {
      options[key] = true;
      continue;
    }

    let value = inputs.get(key);
    if (parse) {
      value = parse(value);
    }
    options[key] = value;
  }

  return options;
}

export function configMap(deployName, imageTag, options) {
  return Object.fromEntries(
    Object.entries({
      'k8s-core': `bes/k8s-core/${options.k8score}`,
      namespace: `tamanu-${deployName}`,
      imageTag,

      architecture: options.arch,
      configTemplate: options.config,
      dbStorage: `${options.dbstorage}Gi`,
      facilities: options.facilities,
      facilityNames: options.facilitynames && JSON.stringify(options.facilitynames),
      timezone: options.timezone,
      ipAllowList: options.ip,
      nodeEnv: options.env,
      serviceAccount: options.serviceaccountarn,

      apiReplicas: options.apis,
      dbReplicas: options.dbs,
      tasksReplicas: options.tasks,
      webReplicas: options.webs,

      centralApiReplicas: options.centralapis,
      centralDbReplicas: options.centraldbs,
      centralTasksReplicas: options.centraltasks,
      centralWebReplicas: options.centraldbs,

      facilityApiReplicas: options.facilityapis,
      facilityDbReplicas: options.facilitydbs,
      facilityTasksReplicas: options.facilitytasks,
      facilityWebReplicas: options.facilitydbs,

      patientPortalReplicas: options.patientportals,
    }).map(([key, value]) => [`tamanu-on-k8s:${key}`, { value: value ?? null, secret: false }]),
  );
}

function extractBranchDirective(issue) {
  const directive = RX_BRANCH_LINE.exec(issue.body);
  if (directive) {
    return directive.groups.ref;
  }
}

export function parseBranchConfig(context) {
  if (context.eventName === 'pull_request') {
    console.log('Using PR context');
    return (process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? context.ref).replace(
      /^\/refs\/(heads|pull)\//,
      '',
    );
  }

  if (context.eventName === 'push') {
    console.log('Using push context');
    return (process.env.GITHUB_REF_NAME ?? context.ref).replace(/^\/refs\/heads\//, '');
  }

  if (
    context.eventName === 'issues' &&
    context.payload.issue?.labels?.some((label) => label.name === 'auto-deploy') &&
    context.payload.issue?.title.startsWith('Auto-deploy:')
  ) {
    console.log('Using auto-deploy issue body');
    const directive = extractBranchDirective(context.payload.issue);
    if (directive) {
      if (context.payload.issue.title.startsWith(`Auto-deploy: ${directive}`)) {
        return directive;
      } else {
        console.log(`Ignoring branch config for ${directive} as title doesn't match`);
      }
    }
  }

  return '';
}

export async function findControlText(context, github) {
  console.log(context);

  // for pushes to pull requests, use the PR body
  if (context.eventName === 'pull_request') {
    console.log('PR context: using PR body');
    return {
      control: `pr=${context.payload.pull_request.number}`,
      body: context.payload.pull_request.body,
    };
  }

  // for edits to control issues, use the issue body from payload
  if (context.eventName === 'issues') {
    console.log('Issue context: using issue body');
    return {
      control: `issue=${context.payload.issue.number}`,
      body: context.payload.issue.body,
    };
  }

  if (context.eventName === 'push') {
    if (context.ref.startsWith('refs/tags/')) {
      console.log('Push context: ignoring tag push');
      return;
    }

    const branch = context.ref.replace(/^refs\/heads\//, '');
    console.log('Push context: on branch', branch);

    // for pushes to branches, first check if there's an open PR for the branch
    const prs = await github.rest.pulls.list({
      owner: process.env.GITHUB_REPOSITORY_OWNER,
      repo: context.payload.repository.name,
      state: 'open',
      head: `${process.env.GITHUB_REPOSITORY_OWNER}:${branch}`,
    });
    console.log(
      'PRs for branch:',
      prs.data.length,
      prs.data.map((pr) => pr.number),
    );
    // ...and ignore if that's the case (as the PR event will take care of it)
    if (prs.data.length) {
      console.log('Ignoring push to branch with open PR');
      return;
    }

    // then check if there's an open control issue with the branch name
    const issues = await github.rest.issues.listForRepo({
      owner: process.env.GITHUB_REPOSITORY_OWNER,
      repo: context.payload.repository.name,
      state: 'open',
      labels: 'auto-deploy',
    });
    console.log(
      'Control issues:',
      issues.data.length,
      issues.data.map((issue) => issue.title),
    );
    const issue = issues.data.find((issue) => issue.title === `Auto-deploy: ${branch}`);
    if (issue) {
      console.log('Found control issue matching branch:', issue.number);

      const directive = extractBranchDirective(issue);
      if (directive !== branch) {
        console.log('Ignoring control issue as title does not match directive', {
          title: issue.title,
          directive,
        });
        return;
      }

      return {
        body: issue.body,
        control: `issue=${issue.number}`,
      };
    }
  }

  // if nothing is available, no control text == no deploys
  return;
}

export async function findDeploysToCleanUp(controlList, ttl = 24, context, github) {
  const now = new Date();
  const ttlAgo = new Date(now - ttl * 60 * 60 * 1000);
  const controls = controlList
    .split(/\s+/)
    .filter(Boolean)
    .map((control) => control.split('='))
    .map(([core, ns, type, number]) => ({ core, ns, type, number }));

  const todo = [];

  for (const { core, ns, type, number } of controls) {
    console.log('Checking control:', { core, ns, type, number });

    try {
      if (type === 'pr') {
        const pr = (
          await github.rest.pulls.get({
            owner: process.env.GITHUB_REPOSITORY_OWNER,
            repo: context.payload.repository.name,
            pull_number: number,
          })
        )?.data;
        if (!pr) continue;

        if (pr.state !== 'closed') {
          console.log('PR is still open');
          continue;
        }

        const closedAt = new Date(pr.closed_at);
        if (closedAt > ttlAgo) {
          console.log('PR is too recent; closed at:', closedAt);
          continue;
        }

        todo.push({ core, ns });
      } else if (type === 'issue') {
        const issue = (
          await github.rest.issues.get({
            owner: process.env.GITHUB_REPOSITORY_OWNER,
            repo: context.payload.repository.name,
            issue_number: number,
          })
        )?.data;
        if (!issue) continue;

        if (issue.state !== 'closed') {
          console.log('Issue is still open');
          continue;
        }

        const closedAt = new Date(issue.closed_at);
        if (closedAt > ttlAgo) {
          console.log('Issue is too recent; closed at:', closedAt);
          continue;
        }

        todo.push({ core, ns });
      }
    } catch (err) {
      console.error('Error while handling control:', err);
    }
  }

  return todo.map(({ core, ns }) => ({
    name: ns.replace(/^tamanu-/, ''),
    options: JSON.stringify({
      k8score: core.replace(/^k8s-operator-/, ''),
      opsstack: OPTIONS.find(({ key }) => key === 'opsstack').defaultValue,
    }),
  }));
}
