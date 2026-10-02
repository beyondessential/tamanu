/**
 * Generates the navigation for the end user manuals from docs/user-manuals/manifest.json.
 *
 * The manifest is the authoritative list of platforms, modules, and the order of the
 * guides inside each module. This script writes every index.md, numbers each module and
 * guide, and maintains the back-link and the previous/next footer inside each guide.
 * Guide prose is never touched.
 *
 * Usage:
 *   node scripts/build-user-manuals.mjs           write the generated files
 *   node scripts/build-user-manuals.mjs --check   report drift without writing
 *
 * Conventions are specified in specs/documentation/user-manuals.md.
 */
import { promises as fs } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

// Anchored to the script's own location so the result does not depend on the directory
// it was invoked from.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(REPO_ROOT, 'docs', 'user-manuals');
const display = path => relative(REPO_ROOT, path);
const MANIFEST = join(ROOT, 'manifest.json');
const NAV_MARKER = '<!-- nav -->';
const checkOnly = process.argv.includes('--check');

const problems = [];
const drifted = [];

async function readIfExists(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** Writes only when the content differs, so an unchanged run touches nothing. */
async function writeFile(path, content) {
  const existing = await readIfExists(path);
  if (existing === content) return;
  drifted.push(path);
  if (checkOnly) return;
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, content);
}

/** The H1 text of a guide, with any number the generator previously stamped removed. */
function guideTitle(source, path) {
  const heading = source.match(/^# (.+)$/m);
  if (!heading) {
    problems.push(`${display(path)} has no H1 heading`);
    return null;
  }
  return heading[1].replace(/^\d+\.\d+ /, '');
}

/**
 * Rewrites the generated regions of a guide: the back-link above the title, the number
 * in the H1, and the previous/next footer. Everything between is left alone.
 */
function renderGuide(source, { number, title, moduleTitle, previous, next }) {
  let body = source.slice(0, source.indexOf(NAV_MARKER) === -1 ? undefined : source.indexOf(NAV_MARKER));
  // Tolerant of leading whitespace, CRLF, and a single newline: a near-miss here would
  // leave the old link in place while a fresh one is prepended below, giving two.
  body = body.replace(/^\s*\[←[^\]]*\]\(index\.md\)[ \t]*(\r?\n)+/, '');
  body = body.replace(/^# .+$/m, `# ${number} ${title}`);
  body = `[← ${moduleTitle}](index.md)\n\n${body.trimEnd()}\n`;

  const links = [];
  if (previous) links.push(`Previous: [${previous.number} ${previous.title}](${previous.file})`);
  if (next) links.push(`Next: [${next.number} ${next.title}](${next.file})`);
  if (!links.length) return body;

  return `${body}\n${NAV_MARKER}\n\n---\n\n${links.join(' · ')}\n`;
}

const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));

// Root index: the platforms.
await writeFile(
  join(ROOT, 'index.md'),
  [
    `# ${manifest.title}`,
    '',
    manifest.intro,
    '',
    '## Platforms',
    '',
    ...manifest.platforms.map(p => `- [${p.title}](${p.slug}/index.md): ${p.description}`),
    '',
  ].join('\n'),
);

/**
 * Reports directories that exist on disk but are absent from the manifest. A renamed or
 * removed slug otherwise leaves its old folder behind, still holding guides, linked from
 * nothing and reported by nobody.
 */
async function reportUnlistedDirectories(parent, listedSlugs, kind) {
  const entries = await fs.readdir(parent, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory() || listedSlugs.has(entry.name)) continue;
    problems.push(`${display(join(parent, entry.name))} is a ${kind} directory the manifest does not list`);
  }
}

await reportUnlistedDirectories(ROOT, new Set(manifest.platforms.map(p => p.slug)), 'platform');

for (const platform of manifest.platforms) {
  await reportUnlistedDirectories(
    join(ROOT, platform.slug),
    new Set(platform.modules.map(m => m.slug)),
    'module',
  );

  // Platform index: the numbered modules.
  await writeFile(
    join(ROOT, platform.slug, 'index.md'),
    [
      `# ${platform.title}`,
      '',
      platform.description,
      '',
      '## Modules',
      '',
      ...platform.modules.map(
        (m, i) => `- [${i + 1}. ${m.title}](${m.slug}/index.md): ${m.description}`,
      ),
      '',
    ].join('\n'),
  );

  for (const [moduleIndex, module] of platform.modules.entries()) {
    const moduleNumber = moduleIndex + 1;
    const moduleDir = join(ROOT, platform.slug, module.slug);
    const guideFiles = module.guides ?? [];

    // A guide file on disk that the manifest does not list has no place in the order,
    // so say so rather than quietly leaving it unreachable.
    // Only guides are listed in the manifest; the images folder beside them is not.
    const onDisk = await fs.readdir(moduleDir, { withFileTypes: true }).catch(() => []);
    for (const entry of onDisk) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.name !== 'index.md' && !guideFiles.includes(entry.name)) {
        problems.push(`${display(join(moduleDir, entry.name))} is not listed in the manifest`);
      }
    }

    // Read each guide to get its title, so the index and the page cannot disagree.
    const guides = [];
    for (const [guideIndex, file] of guideFiles.entries()) {
      const path = join(moduleDir, file);
      const source = await readIfExists(path);
      if (source === null) {
        problems.push(`${display(path)} is listed in the manifest but does not exist`);
        continue;
      }
      const title = guideTitle(source, path);
      if (title === null) continue;

      // An image reference that points at nothing renders as a broken picture, which is
      // worse than the placeholder it replaced. Catch it here rather than in review.
      for (const [, alt, rawTarget] of source.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
        // Markdown allows an optional title after the path — ![alt](x.png "Title") — and
        // angle brackets around it. Neither is part of the filename.
        const target = rawTarget.trim().replace(/^<(.*)>$/, '$1').split(/\s+/)[0];
        if (/^https?:/.test(target)) continue;
        try {
          await fs.access(join(moduleDir, target));
        } catch {
          problems.push(`${display(path)} refers to a missing image: ${target}`);
        }
        if (!alt.trim()) problems.push(`${display(path)} has an image with no alt text: ${target}`);
      }

      guides.push({ file, path, source, title, number: `${moduleNumber}.${guideIndex + 1}` });
    }

    await writeFile(
      join(moduleDir, 'index.md'),
      [
        `# ${moduleNumber}. ${module.title}`,
        '',
        module.description,
        '',
        '## Guides',
        '',
        ...(guides.length
          ? guides.map(g => `- [${g.number} ${g.title}](${g.file})`)
          : ['No guides yet.']),
        '',
      ].join('\n'),
    );

    for (const [i, guide] of guides.entries()) {
      await writeFile(
        guide.path,
        renderGuide(guide.source, {
          number: guide.number,
          title: guide.title,
          moduleTitle: module.title,
          previous: guides[i - 1],
          next: guides[i + 1],
        }),
      );
    }
  }
}

if (problems.length) {
  console.error('Problems:');
  for (const p of problems) console.error(`  ${p}`);
}

if (checkOnly) {
  if (drifted.length) {
    console.error(`${drifted.length} file(s) differ from the manifest:`);
    for (const f of drifted) console.error(`  ${display(f)}`);
  } else {
    console.log('User manuals are up to date.');
  }
  process.exit(drifted.length || problems.length ? 1 : 0);
}

console.log(
  drifted.length ? `Wrote ${drifted.length} file(s).` : 'User manuals already up to date.',
);
process.exit(problems.length ? 1 : 0);
