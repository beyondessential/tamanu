import { describe, expect, it } from 'vitest';

import {
  readEditorContent,
  writeEditorContent,
} from '../../app/components/NoteContentEditor/editorContent';

const editorWithHtml = html => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
};

describe('readEditorContent', () => {
  it.each([
    ['plain text', 'plain', 'plain'],
    [
      'style tags',
      'a <b>bold</b> <strong>strong</strong> <i>it</i> <em>em</em> <u>u</u>',
      'a <b>bold</b> <b>strong</b> <i>it</i> <i>em</i> <u>u</u>',
    ],
    ['nested styles', '<b>x<i>y</i></b>', '<b>x<i>y</i></b>'],
    ['line breaks', 'a<br>b', 'a\nb'],
    ['the caret placeholder after a final break', 'a<br><br>', 'a\n'],
    ['a lone placeholder', '<br>', ''],
    ['paragraph divs', 'a<div>b</div><div>c</div>', 'a\nb\nc'],
    ['an empty paragraph', 'a<div><br></div><div>c</div>', 'a\n\nc'],
    ['a trailing empty paragraph', 'a<div><br></div>', 'a\n'],
    [
      'styled spans',
      '<span style="font-weight: 700">x</span><b><span style="font-weight: normal">y</span></b>',
      '<b>x</b>y',
    ],
    ['non-breaking spaces', 'a&nbsp;&nbsp;b', 'a  b'],
    ['other markup as its text', '<a href="#">link</a><span>BP &lt;120</span>', 'linkBP <120'],
  ])('reads %s', (_, html, expected) => {
    expect(readEditorContent(editorWithHtml(html))).toBe(expected);
  });
});

describe('writeEditorContent', () => {
  it('renders styles as elements and keeps other text literal', () => {
    const root = document.createElement('div');
    writeEditorContent(root, '<b>BP</b> <120 <script>x</script>\nnext');
    expect(root.innerHTML).toBe('<b>BP</b> &lt;120 &lt;script&gt;x&lt;/script&gt;<br>next');
  });

  it.each([
    'plain',
    'a <b>bold <i>both</i></b>\n<u>under</u>',
    'ends with a newline\n',
    '<b>styled newline\n</b>',
    'blank\n\nline',
    '',
  ])('round-trips %j', content => {
    const root = document.createElement('div');
    writeEditorContent(root, content);
    expect(readEditorContent(root)).toBe(content);
  });
});
