import test from 'tape';
import { configMap, parseDeployConfig, stackName } from '../src/ghaCdHelpers.mjs';

function withoutOptions({ ...deploy }) {
  delete deploy.options;
  return deploy;
}

test('parse a full PR body', (t) => {
  t.plan(6);

  const body = `
### Changes

_Add a brief description of the changes in this PR to help give the reviewer context._

### Checklist

- [x] Code is finished

### Deploy

- [x] **Deploy to Tamanu Internal** <!-- #deploy -->
  🤖 Deploying \`ci-k8s-deploy\`... <!-- #status -->

- [ ] **Deploy (Klaus)** <!-- #deploy=klaus %facilities=0 arch=amd64 -->
- [ ] **Deploy (Sima)** <!-- #deploy=sima %facilities=3 -->
`;

  const parsed = parseDeployConfig({ body, ref: 'refs/heads/ci/k8s-deploy', control: 'pr=1' });
  t.equal(parsed.length, 3);
  t.deepEqual(parsed.map(withoutOptions), [
    {
      enabled: true,
      name: 'ci-k8s-deploy',
      control: 'pr=1',
    },
    {
      enabled: false,
      name: 'ci-k8s-deploy-klaus',
      control: 'pr=1',
    },
    {
      enabled: false,
      name: 'ci-k8s-deploy-sima',
      control: 'pr=1',
    },
  ]);
  t.equal(parsed.find((d) => d.name === 'ci-k8s-deploy-klaus').options.facilities, 0);
  t.equal(parsed.find((d) => d.name === 'ci-k8s-deploy-sima').options.facilities, 3);
  t.equal(parsed.find((d) => d.name === 'ci-k8s-deploy-klaus').options.arch, 'amd64');
  t.equal(
    parsed.find((d) => d.name === 'ci-k8s-deploy').options.facilities,
    2,
    'option should default',
  );
});

test('parse a short ref name', (t) => {
  t.plan(3);

  const body = '- [x] **Deploy to Tamanu Internal** <!-- #deploy -->';
  const parsed = parseDeployConfig({ body, ref: 'main', control: 'issue=2' });
  t.equal(parsed.length, 1);
  t.deepEqual(parsed.map(withoutOptions), [
    {
      enabled: true,
      name: 'main',
      control: 'issue=2',
    },
  ]);
  t.equal(parsed.find((d) => d.name === 'main').options.facilities, 2, 'option should default');
});

test('normalise a branch name', (t) => {
  t.plan(1);
  t.equal(
    stackName('refs/heads/feat/ticket-123-invent-microwaves'),
    'feat-ticket-123-invent-microwaves',
  );
});

test('normalise a long branch name', (t) => {
  t.plan(1);
  t.equal(
    stackName(
      'refs/heads/refactor/ticket-456-make-it-possible-for-microwaves-to-operate-without-a-rotating-base-plate',
    ),
    'refactor-ticket-456-make-it-possible-for-microwaves-to-o',
  );
});

test('normalise a complex branch name', (t) => {
  t.plan(1);
  t.equal(
    stackName('refs/heads/fix/refs/heads/§ING interpretèd 🌌'),
    'fix-refs-heads-ing-interpret-d',
  );
});

test('configMap reads web replica counts from web options, not db options', (t) => {
  t.plan(2);

  const options = {
    centralwebs: 4,
    centraldbs: 2,
    facilitywebs: 5,
    facilitydbs: 3,
  };

  const config = configMap('ci-k8s-deploy', 'latest', options);

  t.equal(
    config['tamanu-on-k8s:centralWebReplicas'].value,
    options.centralwebs,
    'centralWebReplicas should come from centralwebs, not centraldbs',
  );
  t.equal(
    config['tamanu-on-k8s:facilityWebReplicas'].value,
    options.facilitywebs,
    'facilityWebReplicas should come from facilitywebs, not facilitydbs',
  );
});

test('infra options default to the main branch and the on-k8s stack', (t) => {
  t.plan(2);

  const [deploy] = parseDeployConfig({
    body: '- [x] Deploy <!-- #deploy -->',
    control: 'pr=1',
    ref: 'some-branch',
  });

  t.equal(deploy.options.infraref, 'main');
  t.equal(deploy.options.infrastack, 'tamanu/on-k8s');
});

test('the old opsref and opsstack names set the infra options', (t) => {
  t.plan(3);

  const [deploy] = parseDeployConfig({
    body: '- [x] Deploy <!-- #deploy --> %opsref=my-branch %opsstack=tamanu/other',
    control: 'pr=1',
    ref: 'some-branch',
  });

  t.equal(deploy.options.infraref, 'my-branch');
  t.equal(deploy.options.infrastack, 'tamanu/other');
  t.notOk('opsref' in deploy.options, 'the old name is not carried through');
});

test('the new infraref name wins over the old opsref name', (t) => {
  t.plan(1);

  const [deploy] = parseDeployConfig({
    body: '- [x] Deploy <!-- #deploy --> %opsref=old %infraref=new',
    control: 'pr=1',
    ref: 'some-branch',
  });

  t.equal(deploy.options.infraref, 'new');
});

test('a deployopt line sets infraref via the old name', (t) => {
  t.plan(1);

  const [deploy] = parseDeployConfig({
    body: [
      '- [x] Deploy <!-- #deploy -->',
      '- [x] Use other infra <!-- #deployopt %opsref=my-branch -->',
    ].join('\n'),
    control: 'pr=1',
    ref: 'some-branch',
  });

  t.equal(deploy.options.infraref, 'my-branch');
});

test('the channel option defaults to stable and can be set to canary', (t) => {
  t.plan(2);

  const [stable] = parseDeployConfig({
    body: '- [x] Deploy <!-- #deploy -->',
    control: 'pr=1',
    ref: 'some-branch',
  });
  const [canary] = parseDeployConfig({
    body: '- [x] Deploy <!-- #deploy --> %channel=canary',
    control: 'pr=1',
    ref: 'some-branch',
  });

  t.equal(stable.options.channel, 'stable');
  t.equal(canary.options.channel, 'canary');
});

test('configMap passes the channel as rendererChannel', (t) => {
  t.plan(2);

  const config = configMap('ci-k8s-deploy', 'latest', { channel: 'canary' });
  t.equal(config['tamanu-on-k8s:rendererChannel'].value, 'canary');
  t.equal(config['tamanu-on-k8s:rendererChannel'].secret, false);
});
