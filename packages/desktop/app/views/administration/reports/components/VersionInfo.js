import React from 'react';
import { capitalize } from 'lodash';
import { DateDisplay, formatShortest, formatTime } from '../../../../components';
import { InfoCard, InfoCardItem } from '../../../../components/InfoCard';

export const VersionInfo = ({ version }) => (
  <InfoCard inlineValues>
    <InfoCardItem label="Name" value={version.reportDefinition.name} />
    <InfoCardItem label="Version" value={version.versionNumber} />
    <InfoCardItem label="Report ID" value={version.reportDefinition.id} />
    <InfoCardItem
      label="Created"
      value={`${DateDisplay.stringFormat(version.createdAt, formatShortest)} ${formatTime(
        version.createdAt,
      )}`}
    />
    <InfoCardItem label="Created by" value={version.createdBy?.displayName} />
    <InfoCardItem label="DB Schema" value={capitalize(version.reportDefinition?.dbSchema)} />
  </InfoCard>
);
