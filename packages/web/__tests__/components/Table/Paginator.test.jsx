/*
 * Regression test for Paginator.
 *
 * The MUI Pagination must be controlled by the `page` prop. Previously it was
 * rendered without a page prop and tracked the current page in its own internal
 * state, so when the parent reset the page (filter/sort/rows-per-page change or
 * refresh) the control kept showing the stale page and its number buttons were
 * computed around the wrong page.
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';
import { Paginator } from '../../../app/components/Table/Paginator';

const renderPaginator = pageIndex =>
  renderElementWithTranslatedText(
    <table>
      <tbody>
        <tr>
          <Paginator
            page={pageIndex}
            colSpan={1}
            count={100}
            rowsPerPage={10}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </tr>
      </tbody>
    </table>,
  );

const selectedPageLabel = () => document.querySelector('.Mui-selected')?.textContent;

describe('Paginator', () => {
  it('reflects the controlled page prop as the active page', () => {
    // pageIndex 5 → human page 6, which is far from the uncontrolled default (page 1).
    renderPaginator(5);

    // The button for page 6 must be rendered and marked as the selected page. Without the
    // controlled `page` prop the MUI control stays on its internal page 1 and never renders a
    // page-6 button in its item window.
    expect(screen.queryByText('6')).not.toBeNull();
    expect(selectedPageLabel()).toBe('6');
  });

  it('updates the active page when the page prop changes', () => {
    const { rerender } = renderPaginator(0);
    expect(selectedPageLabel()).toBe('1');

    rerender(
      <table>
        <tbody>
          <tr>
            <Paginator
              page={4}
              colSpan={1}
              count={100}
              rowsPerPage={10}
              onPageChange={() => {}}
              onRowsPerPageChange={() => {}}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.queryByText('5')).not.toBeNull();
    expect(selectedPageLabel()).toBe('5');
  });
});
