import test from 'tape';
import { parseDeployConfig } from '../src/pr-cd.mjs';

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

  const parsed = parseDeployConfig({ body, head: { ref: 'refs/heads/ci/k8s-deploy' } });
  t.equal(parsed.length, 3);
  t.deepEqual(parsed.map(withoutOptions), [
    {
      enabled: true,
      name: 'ci-k8s-deploy',
    },
    {
      enabled: false,
      name: 'klaus',
    },
    {
      enabled: false,
      name: 'sima',
    },
  ]);
  t.equal(parsed.find(d => d.name === 'klaus').options.facilities, 0);
  t.equal(parsed.find(d => d.name === 'sima').options.facilities, 3);
  t.equal(parsed.find(d => d.name === 'klaus').options.arch, 'amd64');
  t.equal(parsed.find(d => d.name === 'ci-k8s-deploy').options.facilities, 2, 'option should default');
});
