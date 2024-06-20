import React from 'react';
import { DateDisplay, formatShortest, formatTime } from '../../../../components';
import { InfoCard, InfoCardItem } from '../../../../components/InfoCard';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';

export const VersionInfo = ({ version }) => (
  <InfoCard inlineValues>
    <InfoCardItem
      label={<TranslatedText stringId="general.name.label" fallback="Name" />}
      value={version.reportDefinition.name}
    />
    <InfoCardItem
      label={<TranslatedText stringId="admin.report.version.label" fallback="Version" />}
      value={version.versionNumber}
    />
    <InfoCardItem
      label={<TranslatedText stringId="admin.report.reportId.label" fallback="Report ID" />}
      value={version.reportDefinition.id}
    />
    <InfoCardItem
      label={<TranslatedText stringId="admin.report.created.label" fallback="Created" />}
      value={`${DateDisplay.stringFormat(version.createdAt, formatShortest)} ${formatTime(
        version.createdAt,
      )}`}
    />
    <InfoCardItem
      label={<TranslatedText stringId="admin.report.createdBy.label" fallback="Created by" />}
      value={version.createdBy?.displayName}
    />
  </InfoCard>
);
