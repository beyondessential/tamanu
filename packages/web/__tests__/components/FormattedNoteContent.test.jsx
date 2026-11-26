import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { FormattedNoteContent } from '../../app/components/FormattedNoteContent';

describe('FormattedNoteContent', () => {
  it('styles the note markup and shows anything else as text', () => {
    const { container } = render(
      <FormattedNoteContent
        content={'<b>BP</b> <i>low</i> <u>today</u>\n<img src=x onerror=alert(1)>'}
      />,
    );
    const spanWithText = text =>
      [...container.querySelectorAll('span')].find(span => span.textContent === text);

    expect(spanWithText('BP').style.fontWeight).toBe('bold');
    expect(spanWithText('low').style.fontStyle).toBe('italic');
    expect(spanWithText('today').style.textDecoration).toBe('underline');
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('BP low today\n<img src=x onerror=alert(1)>');
  });
});
