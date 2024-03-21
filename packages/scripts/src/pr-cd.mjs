/* eslint-disable no-console */

const RX_DEPLOY_LINE = /^\s*-\s+\[(?<enabled>[\sx])\]\s+.+<!--\s*#deploy(?:=(?<name>[\w-]+))?\s*(?:%(?<options>.+))?-->/;

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

export function parseDeployConfig({ body, head }) {
  const deployName = stackName(head.ref);

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
  const value = parseInt(input, 10);
  if (value < low) throw new Error(`value is too low: expected [${low}, ${high}], got ${value}`);
  if (value > high) throw new Error(`value is too high: expected [${low}, ${high}], got ${value}`);
  return value;
}

const OPTIONS = [
  { key: 'facilities', defaultValue: 2, parse: input => intBounds(input, [0, 5]) },
  { key: 'config', defaultValue: (options, context) => 'pr' },
  { key: 'timezone', defaultValue: 'Pacific/Auckland' },
  { key: 'ip', defaultValue: null, parse: input => input.split(',').map(s => s.trim()) },
  { key: 'dbstorage', defaultValue: 5, parse: input => intBounds(input, [1, 500]) },
  { key: 'arch', defaultValue: 'arm64' },
  { key: 'opsref', defaultValue: 'main' },
  { key: 'opsstack', defaultValue: 'tamanu/on-k8s' },
  { key: 'k8score', defaultValue: 'tamanu-internal-main' },
  { key: 'pause', defaultValue: false, presence: true },

  { key: 'apis', defaultValue: 2, parse: input => intBounds(input, [0, 8]) },
  {
    key: 'centralapis',
    defaultValue: options => options.apis,
    parse: input => intBounds(input, [0, 8]),
  },
  {
    key: 'facilityapis',
    defaultValue: options => options.apis,
    parse: input => intBounds(input, [0, 8]),
  },

  { key: 'tasks', defaultValue: 1, parse: input => intBounds(input, [0, 1]) },
  {
    key: 'centraltasks',
    defaultValue: options => options.tasks,
    parse: input => intBounds(input, [0, 1]),
  },
  {
    key: 'facilitytasks',
    defaultValue: options => options.tasks,
    parse: input => intBounds(input, [0, 1]),
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
