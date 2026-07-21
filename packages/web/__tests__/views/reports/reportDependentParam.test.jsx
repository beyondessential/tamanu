/*
 * Regression tests for the report generator's dependent parameter fields
 * (LabTestTypeField, VaccineField).
 *
 * These fields depend on a paired "category" parameter. When the category
 * changes, the previously selected value must be cleared from Formik state so a
 * report is never generated with a value from one category and a different
 * category. The clearing must NOT wipe a value that was restored on mount (e.g.
 * from saved report parameters); that is guarded with a ref that remembers the
 * initial category.
 */

import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

// Both fields fetch their options through `useApi`. Stub it so the fields can
// render without a real backend; the clearing behaviour under test does not
// depend on the fetched options. Other `app/api` exports are preserved.
vi.mock('../../../app/api', async () => {
  const actual = await vi.importActual('../../../app/api');
  return {
    ...actual,
    useApi: () => ({
      get: vi.fn(async url => {
        if (typeof url === 'string' && url.startsWith('labTestType')) {
          return { data: [] };
        }
        return [];
      }),
    }),
  };
});

import { LabTestTypeField } from '../../../app/views/reports/LabTestTypeField';
import { VaccineField } from '../../../app/views/reports/VaccineField';

const renderInFormik = (element, initialValues) =>
  renderElementWithTranslatedText(
    <Formik initialValues={initialValues} initialStatus={{}} onSubmit={() => {}}>
      {({ values }) => (
        <>
          {element}
          <div data-testid="formik-values">{JSON.stringify(values)}</div>
        </>
      )}
    </Formik>,
  );

const readValues = () => JSON.parse(screen.getByTestId('formik-values').textContent);

describe('LabTestTypeField dependent parameter clearing', () => {
  it('does not clear a preset value on initial mount', async () => {
    renderInFormik(<LabTestTypeField parameterValues={{ labTestCategoryId: 'category-1' }} />, {
      labTestTypeIds: ['test-a', 'test-b'],
    });

    // Give any mount effects a chance to run before asserting the value survived.
    await waitFor(() => expect(readValues().labTestTypeIds).toEqual(['test-a', 'test-b']));
  });

  it('clears the selection when the category changes', async () => {
    const { rerender } = renderInFormik(
      <LabTestTypeField parameterValues={{ labTestCategoryId: 'category-1' }} />,
      { labTestTypeIds: ['test-a', 'test-b'] },
    );

    expect(readValues().labTestTypeIds).toEqual(['test-a', 'test-b']);

    rerender(
      <Formik
        initialValues={{ labTestTypeIds: ['test-a', 'test-b'] }}
        initialStatus={{}}
        onSubmit={() => {}}
      >
        {({ values }) => (
          <>
            <LabTestTypeField parameterValues={{ labTestCategoryId: 'category-2' }} />
            <div data-testid="formik-values">{JSON.stringify(values)}</div>
          </>
        )}
      </Formik>,
    );

    await waitFor(() => expect(readValues().labTestTypeIds).toEqual([]));
  });
});

describe('VaccineField dependent parameter clearing', () => {
  it('does not clear a preset value on initial mount', async () => {
    renderInFormik(<VaccineField parameterValues={{ category: 'category-1' }} />, {
      vaccine: 'vaccine-a',
    });

    await waitFor(() => expect(readValues().vaccine).toBe('vaccine-a'));
  });

  it('clears the selection when the category changes', async () => {
    const { rerender } = renderInFormik(<VaccineField parameterValues={{ category: 'category-1' }} />, {
      vaccine: 'vaccine-a',
    });

    expect(readValues().vaccine).toBe('vaccine-a');

    rerender(
      <Formik initialValues={{ vaccine: 'vaccine-a' }} onSubmit={() => {}}>
        {({ values }) => (
          <>
            <VaccineField parameterValues={{ category: 'category-2' }} />
            <div data-testid="formik-values">{JSON.stringify(values)}</div>
          </>
        )}
      </Formik>,
    );

    await waitFor(() => expect(readValues().vaccine).toBeUndefined());
  });
});
