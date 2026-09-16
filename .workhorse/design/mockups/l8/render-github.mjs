/**
 * Throwaway: converts the committed manual markdown to a GitHub-faithful HTML mockup,
 * so the review shows what the files actually produce rather than hand-written markup.
 * Not part of the manual tooling; delete with the rest of this card's scratch.
 */
import { readFileSync, writeFileSync } from 'fs';

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Order matters: escape, neutralise the escaped asterisk to an entity so it cannot be
// read as emphasis, then bold, then links.
const inline = s =>
  escapeHtml(s)
    .replace(/\\\*/g, '&#42;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#">$1</a>');

function render(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^# /.test(line)) { out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue; }
    if (/^## /.test(line)) { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (line === '') { i++; continue; }

    // Ordered list: each item may carry indented continuation paragraphs.
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length) {
        if (/^\d+\. /.test(lines[i])) {
          const paragraphs = [inline(lines[i].replace(/^\d+\. /, ''))];
          i++;
          while (i < lines.length) {
            if (lines[i] === '' && /^ {3}\S/.test(lines[i + 1] ?? '')) {
              i++;
              const buffer = [];
              while (i < lines.length && /^ {3}\S/.test(lines[i])) { buffer.push(lines[i].trim()); i++; }
              paragraphs.push(inline(buffer.join(' ')));
            } else if (/^ {3}\S/.test(lines[i])) {
              const buffer = [];
              while (i < lines.length && /^ {3}\S/.test(lines[i])) { buffer.push(lines[i].trim()); i++; }
              paragraphs[paragraphs.length - 1] += ` ${inline(buffer.join(' '))}`;
            } else break;
          }
          items.push(`<li>${paragraphs.map(p => `<p>${p}</p>`).join('')}</li>`);
        } else if (lines[i] === '' && /^\d+\. /.test(lines[i + 1] ?? '')) {
          i++;
        } else break;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Bullet list. Blank lines between items make it loose, which wraps each item in <p>.
    if (/^- /.test(line)) {
      const items = [];
      let loose = false;
      while (i < lines.length) {
        if (/^- /.test(lines[i])) {
          const buffer = [lines[i].slice(2)];
          i++;
          while (i < lines.length && /^ {2}\S/.test(lines[i])) { buffer.push(lines[i].trim()); i++; }
          items.push(buffer.join(' '));
        } else if (lines[i] === '' && /^- /.test(lines[i + 1] ?? '')) {
          loose = true;
          i++;
        } else break;
      }
      const body = items.map(t => `<li>${loose ? `<p>${inline(t)}</p>` : inline(t)}</li>`).join('');
      out.push(`<ul>${body}</ul>`);
      continue;
    }

    const buffer = [];
    while (i < lines.length && lines[i] !== '' && !/^(#|-\s)/.test(lines[i]) && !/^\d+\. /.test(lines[i])) {
      buffer.push(lines[i]);
      i++;
    }
    if (buffer.length) out.push(`<p>${inline(buffer.join(' '))}</p>`);
  }

  return out.join('\n');
}

const files = [
  ['docs/user-manuals/desktop/index.md', 'docs / user-manuals / desktop / index.md',
    'The platform index: 22 numbered modules, each linking down to its own page.'],
  ['docs/user-manuals/desktop/vitals/index.md', 'docs / user-manuals / desktop / vitals / index.md',
    'The module index: its guides, numbered within the module.'],
  ['docs/user-manuals/desktop/vitals/record-vitals.md', 'docs / user-manuals / desktop / vitals / record-vitals.md',
    'The guide itself, with the link back to the module above the title.'],
];

const blocks = files.map(([path, label, note]) => `
  <p class="filenote">${note}</p>
  <div class="filebar"><span class="path">${label.replace(/([^/]+)$/, '<b>$1</b>')}</span></div>
  <div class="file"><div class="md">
${render(readFileSync(path, 'utf8'))}
  </div></div>`).join('\n');

writeFileSync('.workhorse/design/mockups/l8/github-render.html', `<!-- spec: documentation/user-manuals.md -->
<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>User manuals as GitHub renders them</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#f6f8fa; color:#1f2328; font-size:16px; line-height:1.5;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif; }
  .wrap { max-width:920px; margin:0 auto; padding:32px 16px 64px; }
  .page-title { font-size:20px; margin:0 0 4px; }
  .intro { color:#59636e; font-size:14px; margin:0 0 8px; }
  .filenote { color:#59636e; font-size:13px; margin:28px 0 6px; }
  .filebar { display:flex; align-items:center; padding:12px 16px; background:#f6f8fa;
    border:1px solid #d1d9e0; border-bottom:0; border-radius:6px 6px 0 0; font-size:14px; }
  .path { color:#59636e; } .path b { color:#1f2328; font-weight:600; }
  .file { background:#fff; border:1px solid #d1d9e0; border-radius:0 0 6px 6px; padding:24px 40px 32px; }
  .md h1 { font-size:2em; font-weight:600; margin:0 0 16px; padding-bottom:.3em; border-bottom:1px solid #d1d9e0; }
  .md h2 { font-size:1.5em; font-weight:600; margin:24px 0 16px; padding-bottom:.3em; border-bottom:1px solid #d1d9e0; }
  .md p { margin:0 0 16px; }
  .md ol, .md ul { padding-left:2em; margin:0 0 16px; }
  .md ol > li { margin-bottom:4px; }
  .md ol > li > p { margin:8px 0; }
  .md ul > li { margin-bottom:4px; }
  .md ul > li > p { margin:0 0 16px; }
  .md strong { font-weight:600; }
  .md a { color:#0969da; text-decoration:none; }
  .note { margin-top:32px; padding:16px 18px; background:#fff; border:1px solid #d1d9e0;
    border-left:4px solid #bf8700; border-radius:6px; font-size:14px; color:#59636e; }
  .note b { color:#1f2328; }
</style>
</head>
<body>
<div class="wrap">
  <h2 class="page-title">The manual as GitHub renders it</h2>
  <p class="intro">The three pages a reader passes through, converted from the committed
  markdown rather than hand-written, so this shows what the files actually produce.</p>
${blocks}
  <div class="note">
    <b>For review.</b> Worth checking: that the numbering reads correctly at both levels, that
    each step keeps its supporting detail as an indented paragraph beneath it, that every error
    bullet still opens with the product's own wording in bold, and that the screenshot
    placeholders stand out as gaps to fill. The guide carries no previous/next footer because
    Vitals holds only one guide so far.
  </div>
</div>
</body>
</html>
`);
console.log('written');
