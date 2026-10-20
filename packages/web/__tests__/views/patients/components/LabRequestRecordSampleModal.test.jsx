/*
 * Tests for LabRequestRecordSampleModal's specimen-type defaulting.
 *
 * The category's default specimen type should pre-fill only when recording a sample for the first
 * time ("Record sample details"). When editing an already-collected sample ("Edit sample date and
 * time"), the modal must keep the recorded specimen type as-is — including a blank value that the
 * user deliberately cleared on the request form — rather than re-applying the default.
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../../helpers';

// The real autocompletes/date picker are heavy widgets; stub them so we can read the specimen-type
// field's initial value straight from Formik. The autocomplete stub renders its current value.
vi.mock('../../../../app/components/Field', async () => {
  const actual = await vi.importActual('../../../../app/components/Field');
  return {
    ...actual,
    DateTimeField: () => null,
    AutocompleteField: props => (
      <span data-testid={`value-${props.field?.name}`}>{props.field?.value ?? ''}</span>
    ),
  };
});

// useDateTime supplies the fallback sample time; useSuggester backs the autocompletes. Both come
// from @tamanu/ui-components, so stub them here while keeping Form/TranslatedText real.
vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDateTime: () => '2023-06-12 10:00' }),
    useSuggester: () => ({
      fetchSuggestions: async () => [],
      fetchCurrentOption: async () => undefined,
    }),
  };
});

vi.mock('../../../../app/contexts/Settings', async () => {
  const actual = await vi.importActual('../../../../app/contexts/Settings');
  return {
    ...actual,
    useSettings: () => ({ getSetting: () => false }),
  };
});

vi.mock('../../../../app/contexts/Auth', async () => {
  const actual = await vi.importActual('../../../../app/contexts/Auth');
  return {
    ...actual,
    useAuth: () => ({ currentUser: { id: 'current-user-1' } }),
  };
});

import { LabRequestRecordSampleModal } from '../../../../app/views/patients/components/LabRequestRecordSampleModal';

const DEFAULT_SPECIMEN_TYPE_ID = 'specimen-type-default';

const renderModal = labRequest =>
  renderElementWithTranslatedText(
    <LabRequestRecordSampleModal
      open
      labRequest={labRequest}
      updateLabReq={async () => {}}
      onClose={() => {}}
      onSampleRecorded={() => {}}
    />,
  );

const specimenTypeValue = () => screen.getByTestId('value-specimenTypeId').textContent;

describe('LabRequestRecordSampleModal specimen type default', () => {
  it("pre-fills the category default when first recording a sample", () => {
    renderModal({
      status: LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
      category: { id: 'category-1', defaultSpecimenTypeId: DEFAULT_SPECIMEN_TYPE_ID },
    });

    expect(specimenTypeValue()).toBe(DEFAULT_SPECIMEN_TYPE_ID);
  });

  it("does not re-apply the default when editing a collected sample whose specimen type was cleared", () => {
    renderModal({
      status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      sampleTime: '2023-06-12 10:00',
      specimenTypeId: null,
      category: { id: 'category-1', defaultSpecimenTypeId: DEFAULT_SPECIMEN_TYPE_ID },
    });

    expect(specimenTypeValue()).toBe('');
  });

  it('keeps the recorded specimen type when editing a collected sample', () => {
    renderModal({
      status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      sampleTime: '2023-06-12 10:00',
      specimenTypeId: 'specimen-type-recorded',
      category: { id: 'category-1', defaultSpecimenTypeId: DEFAULT_SPECIMEN_TYPE_ID },
    });

    expect(specimenTypeValue()).toBe('specimen-type-recorded');
  });
});
