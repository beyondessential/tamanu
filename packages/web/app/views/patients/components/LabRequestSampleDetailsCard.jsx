import React from 'react';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';
import { DateDisplay } from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../../components/Translation';

export const LabRequestSampleDetailsCard = ({ labRequest }) => (
  <InfoCard>
    <InfoCardItem
      label={<TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />}
      value={<DateDisplay date={labRequest.sampleTime} showTime />}
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.sampleDetail.table.column.collectedBy"
          fallback="Collected by"
        />
      }
      value={labRequest.collectedBy?.displayName || '-'}
    />
    <InfoCardItem
      label={
        <TranslatedText
          stringId="lab.sampleDetail.table.column.specimenType"
          fallback="Specimen type"
        />
      }
      value={(labRequest.specimenType?.name && <TranslatedReferenceData 
        fallback={labRequest.specimenType.name}
        value={labRequest.specimenType.id}
        category="specimenType"
      />) || '-'} 
    />
    <InfoCardItem
      label={<TranslatedText stringId="lab.site.label" fallback="Site" />}
      value={(labRequest.site?.name && <TranslatedReferenceData 
        fallback={labRequest.site.name}
        value={labRequest.site.id}
        category="labSampleSite"
      />) || '-'} 
    />
  </InfoCard>
);
