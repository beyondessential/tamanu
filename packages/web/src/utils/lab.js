import React from 'react';
import styled from 'styled-components';

import { LAB_REQUEST_STATUS_LABELS } from 'shared/constants';
import { LAB_REQUEST_COLORS } from '../constants';

import { DateDisplay } from '../components';
import { PatientNameDisplay } from '../components/PatientNameDisplay';

const StatusLabel = styled.div`
  background: ${p => p.color};
  border-radius: 0.3rem;
  padding: 0.3rem;
  width: fit-content;
`;

export const StatusDisplay = React.memo(({ status }) => (
  <StatusLabel color={LAB_REQUEST_COLORS[status] || LAB_REQUEST_COLORS.unknown}>
    {LAB_REQUEST_STATUS_LABELS[status] || 'Unknown'}
  </StatusLabel>
));

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
export const getRequestType = ({ categoryName, category }) =>
  categoryName || (category || {}).name || 'Unknown';
export const getPriority = ({ priorityName, priority }) =>
  priorityName || (priority || {}).name || 'Unknown';
export const getDate = ({ requestedDate }) => <DateDisplay date={requestedDate} />;
