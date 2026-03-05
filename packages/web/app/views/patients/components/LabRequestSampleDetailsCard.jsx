import React from 'react';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';
import { DateDisplay } from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../../components/Translation';

export const LabRequestSampleDetailsCard = ({ labRequest }) => (
  <InfoCard data-testid="infocard-4hfd">
    <InfoCardItem
      label={
        <TranslatedText
          stringId="general.dateAndTime.label"
          fallback="Date & time"
          data-testid="translatedtext-cmmd"
        />
      }
      value={<DateDisplay date={labRequest.sampleTime} timeFormat="default" data-testid="datedisplay-bx65" />}
      data-testid="infocarditem-cdrs"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.sampleDetail.table.column.collectedBy"
          fallback="Collected by"
          data-testid="translatedtext-69l2"
        />
      }
      value={labRequest.collectedBy?.displayName || '-'}
      data-testid="infocarditem-3igq"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.sampleDetail.table.column.specimenType"
          fallback="Specimen type"
          data-testid="translatedtext-egt7"
        />
      }
      value={
        (labRequest.specimenType?.name && (
          <TranslatedReferenceData
            fallback={labRequest.specimenType.name}
            value={labRequest.specimenType.id}
            category="specimenType"
            data-testid="translatedreferencedata-7d4v"
          />
        )) ||
        '-'
      }
      data-testid="infocarditem-vcqu"
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.site.label"
          fallback="Site"
          data-testid="translatedtext-ol61"
        />
      }
      value={
        (labRequest.site?.name && (
          <TranslatedReferenceData
            fallback={labRequest.site.name}
            value={labRequest.site.id}
            category="labSampleSite"
            data-testid="translatedreferencedata-mrnm"
          />
        )) ||
        '-'
      }
      data-testid="infocarditem-l6ww"
    />
  </InfoCard>
);
