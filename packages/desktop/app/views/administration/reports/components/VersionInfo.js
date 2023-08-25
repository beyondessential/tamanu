import React from 'react';
import { formatShort, formatTime } from '../../../../components';
import { InfoCard, InfoCardItem } from '../../../../components/InfoCard';

export const VersionInfo = ({ version }) => (
  <InfoCard inlineValues>
    <InfoCardItem label="Name" value={version.reportDefinition.name} />
    <InfoCardItem label="Version" value={version.versionNumber} />
    <InfoCardItem label="Report ID" value={version.reportDefinition.id} />
    <InfoCardItem
      label="Created"
      value={`${formatShort(version.createdAt)} ${formatTime(version.createdAt)}`}
    />
    <InfoCardItem label="Created by" value={version.createdBy?.displayName} />
    <InfoCardItem label="DB Role" value={version.reportDefinition.dbRole} />
  </InfoCard>
);
