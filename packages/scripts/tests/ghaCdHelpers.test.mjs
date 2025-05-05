import test from 'tape';
import { parseDeployConfig, stackName } from '../src/ghaCdHelpers.mjs';

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
