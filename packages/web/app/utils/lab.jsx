import React from 'react';
import { LAB_REQUEST_STATUS_CONFIG } from '@tamanu/constants';
import { DateDisplay } from '../components';
import { PatientNameDisplay } from '../components/PatientNameDisplay';
import { TableCellTag } from '../components/Tag';
import { TranslatedReferenceData, TranslatedText } from '../components/Translation';

export const StatusDisplay = React.memo(({ status }) => {
  const { background, color, label } = LAB_REQUEST_STATUS_CONFIG[status];
  return (
    <TableCellTag $background={background} $color={color} noWrap>
      {label}
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
export const getPanelType = ({ labTestPanelId, labTestPanelName }) => (
  <TranslatedReferenceData
    value={labTestPanelId}
    fallback={labTestPanelName}
    category="labTestPanel"
  />
);
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
