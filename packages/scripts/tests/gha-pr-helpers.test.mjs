import test from 'tape';
import { parseDeployConfig } from '../src/gha-pr-helpers.mjs';

function withoutOptions({ ...deploy }) {
  delete deploy.options;
  return deploy;
}

test('parse a full PR body', t => {
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

  const parsed = parseDeployConfig({ body, ref: 'refs/heads/ci/k8s-deploy' });
  t.equal(parsed.length, 3);
  t.deepEqual(parsed.map(withoutOptions), [
    {
      enabled: true,
      name: 'ci-k8s-deploy',
    },
    {
      enabled: false,
      name: 'ci-k8s-deploy-klaus',
    },
    {
      enabled: false,
      name: 'ci-k8s-deploy-sima',
    },
  ]);
  t.equal(parsed.find(d => d.name === 'ci-k8s-deploy-klaus').options.facilities, 0);
  t.equal(parsed.find(d => d.name === 'ci-k8s-deploy-sima').options.facilities, 3);
  t.equal(parsed.find(d => d.name === 'ci-k8s-deploy-klaus').options.arch, 'amd64');
  t.equal(parsed.find(d => d.name === 'ci-k8s-deploy').options.facilities, 2, 'option should default');
});

test('parse a short ref name', t => {
  t.plan(3);

  const body = '- [x] **Deploy to Tamanu Internal** <!-- #deploy -->';
  const parsed = parseDeployConfig({ body, ref: 'main' });
  t.equal(parsed.length, 1);
  t.deepEqual(parsed.map(withoutOptions), [
    {
      enabled: true,
      name: 'main',
    },
  ]);
  t.equal(parsed.find(d => d.name === 'main').options.facilities, 2, 'option should default');
});
