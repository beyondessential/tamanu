import React from 'react';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';
import { DateDisplay } from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../../components/Translation';

export const LabRequestSampleDetailsCard = ({ labRequest }) => (
  <InfoCard>
    <InfoCardItem
      label={<TranslatedText
        stringId="general.dateAndTime.label"
        fallback="Date & time"
        data-test-id='translatedtext-jkdg' />}
      value={<DateDisplay date={labRequest.sampleTime} showTime data-test-id='datedisplay-i9i8' />}
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.sampleDetail.table.column.collectedBy"
          fallback="Collected by"
          data-test-id='translatedtext-eq57' />
      }
      value={labRequest.collectedBy?.displayName || '-'}
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.sampleDetail.table.column.specimenType"
          fallback="Specimen type"
          data-test-id='translatedtext-ktsb' />
      }
      value={(labRequest.specimenType?.name && <TranslatedReferenceData
        fallback={labRequest.specimenType.name}
        value={labRequest.specimenType.id}
        category="specimenType"
        data-test-id='translatedreferencedata-bogq' />) || '-'}
    />
    <InfoCardItem
      label={<TranslatedText
        stringId="lab.site.label"
        fallback="Site"
        data-test-id='translatedtext-3rha' />}
      value={(labRequest.site?.name && <TranslatedReferenceData
        fallback={labRequest.site.name}
        value={labRequest.site.id}
        category="labSampleSite"
        data-test-id='translatedreferencedata-vdod' />) || '-'}
    />
  </InfoCard>
);
