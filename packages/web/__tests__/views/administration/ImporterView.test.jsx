import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { renderElementWithTranslatedText } from '../../helpers';
import { ImporterView } from '../../../app/views/administration/components/ImporterView';

const { mockSubmitForm } = vi.hoisted(() => ({ mockSubmitForm: vi.fn() }));

vi.mock('../../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useApi: () => ({}),
}));

vi.mock('../../../app/components/Field', async importOriginal => ({
  ...(await importOriginal()),
  Field: () => null,
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    Form: ({ render }) => (
      <Formik initialValues={{ file: 'patients.xlsx' }} onSubmit={() => {}}>
        {() => render({ submitForm: mockSubmitForm })}
      </Formik>
    ),
  };
});

const importWarning = { title: 'Warning title', subText: 'Warning text' };

const renderImporter = props =>
  renderElementWithTranslatedText(
    <ImporterView endpoint="referenceData" setIsLoading={() => {}} {...props} />,
  );

describe('ImporterView import warning', () => {
  beforeEach(() => {
    mockSubmitForm.mockReset();
  });

  it('asks for confirmation before a real import', () => {
    renderImporter({ importWarning });

    fireEvent.click(screen.getByTestId('importbutton-o5nh'));
    expect(screen.getByText('Warning text')).toBeTruthy();
    expect(mockSubmitForm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('confirmbutton-y3tb'));
    expect(mockSubmitForm).toHaveBeenCalledTimes(1);
    expect(mockSubmitForm.mock.calls[0][1]).toBeUndefined();
  });

  it('does not import when the warning is cancelled', () => {
    renderImporter({ importWarning });

    fireEvent.click(screen.getByTestId('importbutton-o5nh'));
    fireEvent.click(screen.getByTestId('outlinedbutton-p957'));
    expect(mockSubmitForm).not.toHaveBeenCalled();
  });

  it('runs a test import without the warning', () => {
    renderImporter({ importWarning });

    fireEvent.click(screen.getByTestId('importbutton-52k1'));
    expect(screen.queryByText('Warning text')).toBeNull();
    expect(mockSubmitForm).toHaveBeenCalledWith(expect.anything(), { dryRun: true });
  });

  it('imports straight away when no warning is configured', () => {
    renderImporter();

    fireEvent.click(screen.getByTestId('importbutton-o5nh'));
    expect(mockSubmitForm).toHaveBeenCalledTimes(1);
  });
});
