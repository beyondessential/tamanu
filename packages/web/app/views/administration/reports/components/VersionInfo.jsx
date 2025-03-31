import React from 'react';
import { formatShortest, formatTime } from '@tamanu/utils/dateTime';
import { DateDisplay } from '../../../../components';
import { InfoCard, InfoCardItem } from '../../../../components/InfoCard';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';

export const VersionInfo = ({ version }) => (
  <InfoCard inlineValues>
    <InfoCardItem
      label={<TranslatedText
        stringId="general.name.label"
        fallback="Name"
        data-testid='translatedtext-1g94' />}
      value={version.reportDefinition.name}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.version.label"
        fallback="Version"
        data-testid='translatedtext-qdhv' />}
      value={version.versionNumber}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.reportId.label"
        fallback="Report ID"
        data-testid='translatedtext-uorq' />}
      value={version.reportDefinition.id}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.created.label"
        fallback="Created"
        data-testid='translatedtext-5pps' />}
      value={`${DateDisplay.stringFormat(version.createdAt, formatShortest)} ${formatTime(
        version.createdAt,
      )}`}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.createdBy.label"
        fallback="Created by"
        data-testid='translatedtext-2jah' />}
      value={version.createdBy?.displayName}
    />
  </InfoCard>
);
