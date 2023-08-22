import React from 'react';
import { formatShort, formatTime } from '../../../../components';
import { InfoCard, InfoCardItem } from '../../../../components/InfoCard';

export const VersionInfo = ({ name, reportDefinitionId, version }) => (
  <InfoCard inlineValues>
    <InfoCardItem label="Name" value={name} />
    <InfoCardItem label="Version" value={version.versionNumber} />
    <InfoCardItem label="Report ID" value={reportDefinitionId} />
    <InfoCardItem
      label="Created"
      value={`${formatShort(version.createdAt)} ${formatTime(version.createdAt)}`}
    />
    <InfoCardItem label="Created by" value={version.createdBy?.displayName} />
  </InfoCard>
);
