import test from 'tape';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findMobileRelease, gitHistory, mobilePackagePaths } from '../src/mobileRelease.mjs';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

/** A release line where `changedMobile` lists the releases whose diff from the one before touched mobile. */
function fakeHistory({ tags, changedMobile }) {
  const versionOf = ref => (ref === 'HEAD' ? 'HEAD' : ref.replace(/^v/, ''));
  return {
    releaseTagsBefore(ref) {
      const ancestors = ref === 'HEAD' ? tags : tags.slice(tags.indexOf(ref) + 1);
      return ancestors;
    },
    hasChanged(_fromRef, toRef) {
      return changedMobile.includes(versionOf(toRef));
    },
  };
}

const tags = ['v2.68.3', 'v2.68.2', 'v2.68.1', 'v2.68.0'];

test('the first release of a minor line is its own mobile release', t => {
  t.plan(1);
  const history = fakeHistory({ tags: [], changedMobile: [] });
  t.equal(findMobileRelease({ version: '2.69.0', history, paths: [] }), '2.69.0');
});

test('a release that changes mobile is its own mobile release', t => {
  t.plan(1);
  const history = fakeHistory({ tags, changedMobile: ['HEAD'] });
  t.equal(findMobileRelease({ version: '2.68.4', history, paths: [] }), '2.68.4');
});

test('a server-only release points at the latest release that changed mobile', t => {
  t.plan(1);
  const history = fakeHistory({ tags, changedMobile: ['2.68.2'] });
  t.equal(findMobileRelease({ version: '2.68.4', history, paths: [] }), '2.68.2');
});

test('a run of server-only releases falls back to the start of the line', t => {
  t.plan(1);
  const history = fakeHistory({ tags, changedMobile: [] });
  t.equal(findMobileRelease({ version: '2.68.4', history, paths: [] }), '2.68.0');
});

test('a release whose own tag already exists is not compared with itself', t => {
  t.plan(1);
  const history = fakeHistory({ tags, changedMobile: ['2.68.3'] });
  t.equal(findMobileRelease({ version: '2.68.3', ref: 'v2.68.3', history, paths: [] }), '2.68.3');
});

test('a release with no earlier tags to compare with is its own mobile release', t => {
  t.plan(1);
  const history = fakeHistory({ tags: [], changedMobile: [] });
  t.equal(findMobileRelease({ version: '2.68.4', history, paths: [] }), '2.68.4');
});

test('mobile package paths follow the workspace packages the app depends on', t => {
  t.plan(3);
  const paths = mobilePackagePaths(repoRoot);
  t.ok(paths.includes('packages/mobile'), 'the app itself');
  t.ok(paths.includes('packages/constants'), 'a workspace package it depends on');
  t.notOk(paths.includes('packages/central-server'), 'not a server it never depends on');
});

/** A throwaway repo with a root and a mobile package.json, tagged v2.68.0. */
function makeRepo() {
  const cwd = mkdtempSync(join(tmpdir(), 'mobile-release-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
  const write = (path, content) => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), content);
  };
  const writeVersion = version => {
    write('package.json', JSON.stringify({ version }, null, 2));
    write('packages/mobile/package.json', JSON.stringify({ version }, null, 2));
  };
  const release = version => {
    git('add', '-A');
    git('commit', '-q', '--allow-empty', '-m', version);
    git('tag', `v${version}`);
  };

  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  writeVersion('2.68.0');
  write('packages/mobile/App/index.ts', 'export const screen = 1;\n');
  write('packages/central-server/index.js', 'export const route = 1;\n');
  release('2.68.0');

  return { history: gitHistory(cwd), write, writeVersion, release };
}

const paths = ['packages/mobile', 'package.json'];

test('a release that only bumps the version is not a mobile change', t => {
  t.plan(1);
  const { history, writeVersion, release } = makeRepo();
  writeVersion('2.68.1');
  release('2.68.1');
  t.equal(history.hasChanged('v2.68.0', 'v2.68.1', paths), false);
});

test('a release that edits mobile is a mobile change', t => {
  t.plan(1);
  const { history, write, writeVersion, release } = makeRepo();
  writeVersion('2.68.1');
  write('packages/mobile/App/index.ts', 'export const screen = 2;\n');
  release('2.68.1');
  t.equal(history.hasChanged('v2.68.0', 'v2.68.1', paths), true);
});

test('a release that adds a mobile file is a mobile change', t => {
  t.plan(1);
  const { history, write, writeVersion, release } = makeRepo();
  writeVersion('2.68.1');
  write('packages/mobile/App/newScreen.ts', 'export const screen = 3;\n');
  release('2.68.1');
  t.equal(history.hasChanged('v2.68.0', 'v2.68.1', paths), true);
});

test('a release that only edits the servers is not a mobile change', t => {
  t.plan(1);
  const { history, write, writeVersion, release } = makeRepo();
  writeVersion('2.68.1');
  write('packages/central-server/index.js', 'export const route = 2;\n');
  release('2.68.1');
  t.equal(history.hasChanged('v2.68.0', 'v2.68.1', paths), false);
});

test('a comparison that cannot be made counts as a mobile change', t => {
  t.plan(1);
  const { history } = makeRepo();
  t.equal(history.hasChanged('v2.68.0', 'v9.9.9', paths), true);
});

test('the mobile release is found through real history', t => {
  t.plan(2);
  const { history, write, writeVersion, release } = makeRepo();
  writeVersion('2.68.1');
  write('packages/mobile/App/index.ts', 'export const screen = 2;\n');
  release('2.68.1');
  writeVersion('2.68.2');
  write('packages/central-server/index.js', 'export const route = 2;\n');
  release('2.68.2');

  t.equal(findMobileRelease({ version: '2.68.2', ref: 'v2.68.2', history, paths }), '2.68.1');
  t.equal(findMobileRelease({ version: '2.68.1', ref: 'v2.68.1', history, paths }), '2.68.1');
});
