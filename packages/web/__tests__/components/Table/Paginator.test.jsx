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
import { afterEach, describe, it, expect, vi } from 'vitest';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';

import { renderElementWithTranslatedText } from '../../helpers';

const { language } = vi.hoisted(() => ({ language: { code: 'en' } }));
vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return { ...actual, getCurrentLanguageCode: () => language.code };
});

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

const renderFooter = ({ page = 0, count, rowsPerPage = 10 }) =>
  renderElementWithTranslatedText(
    <table>
      <tbody>
        <tr>
          <Paginator
            page={page}
            colSpan={1}
            count={count}
            rowsPerPage={rowsPerPage}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </tr>
      </tbody>
    </table>,
    undefined,
    { getTranslation: (...args) => translationFactory({})(...args).value },
  );

const recordCountText = () => screen.getByTestId('pagerecordcount-m8ne').textContent;

describe('Paginator record count', () => {
  afterEach(() => {
    language.code = 'en';
  });

  it.each([
    ['a range of the page and the total', { count: 547 }, 'Showing 1–10 of 547 records'],
    ['the range when every record fits on one page', { count: 3 }, 'Showing 1–3 of 3 records'],
    ['the last page up to the total', { page: 54, count: 547 }, 'Showing 541–547 of 547 records'],
    [
      'one number when the page holds a single record',
      { page: 1, count: 11 },
      'Showing 11 of 11 records',
    ],
    ['a single record when the table holds exactly one', { count: 1 }, 'Showing 1 of 1 record'],
    ['thousands separators', { count: 1204 }, 'Showing 1–10 of 1,204 records'],
  ])('shows %s', (_, props, expectedText) => {
    renderFooter(props);
    expect(recordCountText()).toBe(expectedText);
  });

  it("formats the numbers for the user's language", () => {
    language.code = 'de';
    renderFooter({ count: 1204 });
    expect(recordCountText()).toBe('Showing 1–10 of 1.204 records');
  });

  it('labels the rows per page dropdown with the visible label', () => {
    renderFooter({ count: 547 });
    const dropdown = screen.getByRole('button', { name: 'Rows per page' });
    expect(dropdown.getAttribute('aria-labelledby')).toBe(screen.getByText('Rows per page').id);
    expect(dropdown.textContent).toBe('10');
  });
});
