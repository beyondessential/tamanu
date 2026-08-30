import React from 'react';
import { LAB_REQUEST_STATUS_CONFIG, LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants';
import { DateDisplay } from '../components';
import { PatientNameDisplay } from '../components/PatientNameDisplay';
import { TableCellTag } from '../components/Tag';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../components/Translation';

export const StatusDisplay = React.memo(({ status }) => {
  const { background, color } = LAB_REQUEST_STATUS_CONFIG[status];
  return (
    <TableCellTag $background={background} $color={color} noWrap>
      <TranslatedEnum enumValues={LAB_REQUEST_STATUS_LABELS} value={status}/>
    </TableCellTag>
  );
});

export const getRequestId = ({ displayId }) => displayId;

export const getLaboratory = ({ laboratoryName, laboratory }) =>
  laboratoryName ||
  (laboratory && (
    <TranslatedReferenceData
      fallback={laboratory.name}
      value={laboratory.id}
      category={laboratory.type}
    />
  )) ||
  'Unknown';

export const getCompletedDate = ({ completedDate }) => <DateDisplay date={completedDate} />;
export const getPublishedDate = ({ publishedDate }) => (
  <DateDisplay date={publishedDate} timeOnlyTooltip />
);
export const getMethod = ({ labTestMethod }) =>
  (labTestMethod && (
    <TranslatedReferenceData
      fallback={labTestMethod.name}
      value={labTestMethod.id}
      category={labTestMethod.type}
    />
  )) ||
  'Unknown';

export const getRequestedBy = ({ requestedBy }) =>
  (requestedBy || {})?.displayName || requestedBy || 'Unknown';
export const getPatientName = row => <PatientNameDisplay patient={row} />;
export const getPatientDisplayId = ({ patientDisplayId }) => patientDisplayId || 'Unknown';
export const getStatus = ({ status }) => <StatusDisplay status={status} />;
export const getPanelType = ({ labTestPanelId, labTestPanelName }) => {
  // A request spanning several panels has no single panel id, so render the aggregated panel
  // names directly — TranslatedReferenceData only emits its fallback when a reference id is present.
  if (!labTestPanelId) return labTestPanelName ?? '';
  return (
    <TranslatedReferenceData
      value={labTestPanelId}
      fallback={labTestPanelName}
      category="labTestPanel"
    />
  );
};
const INDIVIDUAL_TESTS_GROUP_KEY = 'individual';

// A lab result row belongs to its panel (keyed by the panel request's panel id) or to the
// individual-tests group when it carries no panel — reflex and individually-ordered tests both
// land here.
export const getLabResultGroupKey = ({ labTestPanel }) =>
  labTestPanel?.id ?? INDIVIDUAL_TESTS_GROUP_KEY;

// A group header shows above the first row of a group, and above the first row of a page (where
// there is no previous row within the page) so a panel's header repeats and grouping stays legible
// across pagination.
export const shouldShowLabResultGroupHeader = (row, previousRow) =>
  !previousRow || getLabResultGroupKey(previousRow) !== getLabResultGroupKey(row);

// Panels lead, each under its name; the loose/reflex tests follow under one "Individual tests"
// heading. Returns null when the row continues its group, so the header shows only above the
// first row of each group. Shared by the lab request view results table and the results entry
// modal so both surfaces group identically.
export const renderLabResultGroupHeader = (row, previousRow) => {
  if (!shouldShowLabResultGroupHeader(row, previousRow)) return null;
  return row.labTestPanel ? (
    <TranslatedReferenceData
      value={row.labTestPanel.id}
      fallback={row.labTestPanel.name}
      category="labTestPanel"
      data-testid="labresult-group-header-panel"
    />
  ) : (
    <TranslatedText
      stringId="lab.results.individualTests.label"
      fallback="Individual tests"
      data-testid="labresult-group-header-individual"
    />
  );
};

export const getRequestType = ({ categoryName, categoryId, category }) => {
  if (category) {
    return (
      <TranslatedReferenceData
        fallback={category.name}
        value={category.id}
        category={category.type}
      />
    );
  }
  if (categoryId) {
    return (
      <TranslatedReferenceData
        fallback={categoryName}
        value={categoryId}
        category="labTestCategory"
      />
    );
  }
  return <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />;
};
export const getPriority = ({ priorityName, priorityId, priority }) =>
  priorityName || priority ? (
    <TranslatedReferenceData
      fallback={priorityName || priority.name}
      value={priorityId || priority.id}
      category="labTestPriority"
    />
  ) : (
    <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />
  );

export const getDateWithTimeTooltip = ({ requestedDate }) => (
  <DateDisplay date={requestedDate} timeOnlyTooltip />
);
