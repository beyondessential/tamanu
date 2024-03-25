import React from 'react';
import { LAB_REQUEST_STATUS_CONFIG } from '@tamanu/constants';
import { DateDisplay } from '../components';
import { PatientNameDisplay } from '../components/PatientNameDisplay';
import { TableCellTag } from '../components/Tag';
import { TranslatedReferenceData } from '../components/Translation';

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
  laboratoryName || (laboratory && <TranslatedReferenceData fallback={laboratory.name} value={laboratory.id} category={laboratory.type}/>) || 'Unknown';

export const getCompletedDate = ({ completedDate }) => <DateDisplay date={completedDate} />;
export const getPublishedDate = ({ publishedDate }) => (
  <DateDisplay date={publishedDate} timeOnlyTooltip />
);
export const getMethod = ({ labTestMethod }) => (labTestMethod && <TranslatedReferenceData fallback={labTestMethod.name} value={labTestMethod.id} category={labTestMethod.type}/>) || 'Unknown';

export const getRequestedBy = ({ requestedBy }) =>
  (requestedBy || {})?.displayName || requestedBy || 'Unknown';
export const getPatientName = row => <PatientNameDisplay patient={row} />;
export const getPatientDisplayId = ({ patientDisplayId }) => patientDisplayId || 'Unknown';
export const getStatus = ({ status }) => <StatusDisplay status={status} />;
export const getRequestType = ({ categoryName, category }) =>
  categoryName || (category && <TranslatedReferenceData fallback={category.name} value={category.id} category={category.type}/>) || 'Unknown';
export const getPriority = ({ priorityName, priority }) =>
  priorityName || (priority && <TranslatedReferenceData fallback={priority.name} value={priority.id} category={priority.type}/>) || 'Unknown';
export const getDateWithTimeTooltip = ({ requestedDate }) => (
  <DateDisplay date={requestedDate} timeOnlyTooltip />
);
