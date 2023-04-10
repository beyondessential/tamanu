import React from 'react';
import { LAB_REQUEST_STATUS_CONFIG } from 'shared/constants';
import { DateDisplay } from '../components';
import { PatientNameDisplay } from '../components/PatientNameDisplay';
import { TableCellTag } from '../components/Tag';

const StatusDisplay = React.memo(({ status }) => {
  const { background, color, label } = LAB_REQUEST_STATUS_CONFIG[status];
  return (
    <TableCellTag $background={background} $color={color}>
      {label}
    </TableCellTag>
  );
});

export const getRequestId = ({ displayId }) => displayId;

export const getLaboratory = ({ laboratoryName, laboratory }) =>
  laboratoryName || laboratory?.name || 'Unknown';

export const getCompletedDate = ({ completedDate }) => <DateDisplay date={completedDate} />;
export const getMethod = ({ labTestMethod }) => labTestMethod?.name || 'Unknown';

export const getRequestedBy = ({ requestedBy }) =>
  (requestedBy || {})?.displayName || requestedBy || 'Unknown';
export const getPatientName = row => <PatientNameDisplay patient={row} />;
export const getPatientDisplayId = ({ patientDisplayId }) => patientDisplayId || 'Unknown';
export const getStatus = ({ status }) => <StatusDisplay status={status} />;
export const getPanel = ({ labRequestPanel }) => labRequestPanel?.name;
export const getRequestType = ({ categoryName, category }) =>
  categoryName || (category || {}).name || 'Unknown';
export const getPriority = ({ priorityName, priority }) =>
  priorityName || (priority || {}).name || 'Unknown';
export const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;
export const getDateTime = ({ requestedDate }) => <DateDisplay date={requestedDate} showTime />;
