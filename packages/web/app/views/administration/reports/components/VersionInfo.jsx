import React from 'react';
import { formatShortest, formatTime } from '@tamanu/utils/dateTime';
import { DateDisplay } from '../../../../components';
import { InfoCard, InfoCardItem } from '../../../../components/InfoCard';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';

export const VersionInfo = ({ version }) => (
  <InfoCard inlineValues data-testid="infocard-czs2">
    <InfoCardItem
      label={
        <TranslatedText
          stringId="general.name.label"
          fallback="Name"
          data-testid="translatedtext-rwrc"
        />
      }
      value={version.reportDefinition.name}
      data-testid="infocarditem-gfxm"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="admin.report.version.label"
          fallback="Version"
          data-testid="translatedtext-sqq7"
        />
      }
      value={version.versionNumber}
      data-testid="infocarditem-jxam"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="admin.report.reportId.label"
          fallback="Report ID"
          data-testid="translatedtext-6g42"
        />
      }
      value={version.reportDefinition.id}
      data-testid="infocarditem-kccz"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="admin.report.created.label"
          fallback="Created"
          data-testid="translatedtext-zhty"
        />
      }
      value={`${DateDisplay.stringFormat(version.createdAt, formatShortest)} ${formatTime(
        version.createdAt,
      )}`}
      data-testid="infocarditem-fr79"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="admin.report.createdBy.label"
          fallback="Created by"
          data-testid="translatedtext-qqav"
        />
      }
      value={version.createdBy?.displayName}
      data-testid="infocarditem-4r8f"
    />
  </InfoCard>
);
