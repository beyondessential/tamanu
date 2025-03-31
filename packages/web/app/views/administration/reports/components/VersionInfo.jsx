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
        data-test-id='translatedtext-1g94' />}
      value={version.reportDefinition.name}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.version.label"
        fallback="Version"
        data-test-id='translatedtext-qdhv' />}
      value={version.versionNumber}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.reportId.label"
        fallback="Report ID"
        data-test-id='translatedtext-uorq' />}
      value={version.reportDefinition.id}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.created.label"
        fallback="Created"
        data-test-id='translatedtext-5pps' />}
      value={`${DateDisplay.stringFormat(version.createdAt, formatShortest)} ${formatTime(
        version.createdAt,
      )}`}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="admin.report.createdBy.label"
        fallback="Created by"
        data-test-id='translatedtext-2jah' />}
      value={version.createdBy?.displayName}
    />
  </InfoCard>
);
