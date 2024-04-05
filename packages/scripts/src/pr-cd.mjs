/* eslint-disable no-console */

const RX_DEPLOY_LINE = /^\s*-\s+\[(?<enabled>[\sx])\]\s+.+<!--\s*#deploy(?:=(?<name>[\w-]+))?\s*(?:%(?<options>.+))?-->/;
const RX_BRANCH_LINE = /<!--\s*#branch=(?<ref>[^\s]+)\s*-->/;

// It's important this remains stable or doesn't change: doing so will create
// new deploys for everything that uses the default deploy name, and we may lose
// track of the old deploys.
export function stackName(head_ref, ref_name = null) {
  return (head_ref || ref_name)
    .toLowerCase()
    .replace(/^refs\/(heads|tags)\//, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseDeployConfig({ body, ref }) {
  const deployName = stackName(ref);

  const deploys = [];
  for (const line of body.split(/\r?\n/)) {
    let deployLine = RX_DEPLOY_LINE.exec(line);
    if (deployLine) {
      deploys.push({
        enabled: deployLine.groups.enabled === 'x',
        name: [deployName, deployLine.groups.name].filter(Boolean).join('-'),
        options: parseOptions(deployLine.groups.options ?? ''),
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
  { key: 'facilities', defaultValue: 2, parse: input => intBounds(input, [0, 5]) },
  { key: 'config', defaultValue: (options, context) => 'pr' }, // TODO: vary by context
  { key: 'timezone', defaultValue: 'Pacific/Auckland' },
  { key: 'ip', defaultValue: null, parse: input => input.split(',').map(s => s.trim()) },
  { key: 'dbstorage', defaultValue: 5, parse: input => intBounds(input, [1, 100]) },
  { key: 'arch', defaultValue: 'arm64' },
  { key: 'opsref', defaultValue: 'main' },
  { key: 'opsstack', defaultValue: 'tamanu/on-k8s' },
  { key: 'k8score', defaultValue: 'tamanu-internal-main' },
  { key: 'pause', defaultValue: false, presence: true },

  { key: 'apis', defaultValue: 2, parse: input => intBounds(input, [0, 5]) },
  {
    key: 'centralapis',
    defaultValue: options => intBounds(options.apis, [0, 5]),
    parse: input => intBounds(input, [0, 5]),
  },
  {
    key: 'facilityapis',
    defaultValue: options => intBounds(options.apis, [0, 1]),
    parse: input => intBounds(input, [0, 1]), // max:5 when split
  },

  { key: 'tasks', defaultValue: 1, parse: input => intBounds(input, [0, 1]) },
  {
    key: 'centraltasks',
    defaultValue: options => intBounds(options.tasks, [0, 1]),
    parse: input => intBounds(input, [0, 1]),
  },
  {
    key: 'facilitytasks',
    defaultValue: 0, // until facility is split
    parse: input => intBounds(input, [0, 0]), // max:1 when split
  },

  { key: 'webs', defaultValue: 2, parse: input => intBounds(input, [0, 5]) },
  {
    key: 'centralwebs',
    defaultValue: options => intBounds(options.webs, [0, 5]),
    parse: input => intBounds(input, [0, 5]),
  },
  {
    key: 'facilitywebs',
    defaultValue: options => intBounds(options.webs, [0, 5]),
    parse: input => intBounds(input, [0, 5]),
  },

  { key: 'dbs', defaultValue: 2, parse: input => intBounds(input, [2, 3]) },
  {
    key: 'centraldbs',
    defaultValue: options => intBounds(options.dbs, [2, 3]),
    parse: input => intBounds(input, [2, 3]),
  },
  {
    key: 'facilitydbs',
    defaultValue: options => intBounds(options.dbs, [2, 3]),
    parse: input => intBounds(input, [2, 3]),
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
      .map(opt => opt.trim().split('='))
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
      timezone: options.timezone,

      apiReplicas: options.apis,
      dbReplicas: options.dbs,
      tasksReplicas: options.tasks,
      webReplicas: options.webs,

      centralApiReplicas: options.centralapis,
      centralDbReplicas: options.centraldbs,
      centralTaskReplicas: options.centraltasks,
      centralWebReplicas: options.centraldbs,

      facilityApiReplicas: options.facilityapis,
      facilityDbReplicas: options.facilitydbs,
      facilityTaskReplicas: options.facilitytasks,
      facilityWebReplicas: options.facilitydbs,
    }).map(([key, value]) => [`tamanu-on-k8s:${key}`, { value, secret: false }]),
  );
}

function extractBranchDirective(issue) {
  const directive = RX_BRANCH_LINE.exec(issue.body);
  if (directive) {
    return directive.groups.ref;
  }
}

export function parseBranchConfig(context) {
  if (['pull_request', 'push'].includes(context.eventName)) {
    console.log('Using PR/push context');
    return context.ref;
  }

  if (
    context.eventName === 'issues' &&
    context.payload.issue?.labels?.some(label => label.name === 'auto-deploy') &&
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
    return context.payload.pull_request.body;
  }

  // for edits to control issues, use the issue body from payload
  if (context.eventName === 'issues') {
    console.log('Issue context: using issue body');
    return context.payload.issue.body;
  }

  if (context.eventName === 'push') {
    if (context.ref.startsWith('refs/tags/')) {
      console.log('Push context: ignoring tag push');
      return '';
    }

    const branch = context.ref.replace(/^refs\/heads\//, '');
    console.log('Push context: on branch', branch);

    // for pushes to branches, first check if there's an open PR for the branch
    const prs = await github.rest.pulls.list({
      owner: context.payload.repository.organization,
      repo: context.payload.repository.name,
      state: 'open',
      head: `${context.payload.repository.organization}:${branch}`,
    });
    console.log(
      'PRs for branch:',
      prs.data.length,
      prs.data.map(pr => pr.number),
    );
    // ...and ignore if that's the case (as the PR event will take care of it)
    if (prs.data.length) {
      console.log('Ignoring push to branch with open PR');
      return '';
    }

    // then check if there's an open control issue with the branch name
    const issues = await github.rest.issues.listForRepo({
      owner: context.payload.repository.organization,
      repo: context.payload.repository.name,
      state: 'open',
      labels: 'auto-deploy',
    });
    console.log(
      'Control issues:',
      issues.data.length,
      issues.data.map(issue => issue.title),
    );
    const issue = issues.data.find(issue => issue.title === `Auto-deploy: ${branch}`);
    if (issue) {
      console.log('Found control issue matching branch:', issue.number);

      const directive = extractBranchDirective(issue);
      if (directive !== branch) {
        console.log('Ignoring control issue as title does not match directive', {
          title: issue.title,
          directive,
        });
        return '';
      }

      return issue.body;
    }
  }

  // if nothing is available, no control text == no deploys
  return '';
}
