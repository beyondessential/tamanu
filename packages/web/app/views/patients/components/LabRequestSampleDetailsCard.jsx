import React from 'react';
import { InfoCard, InfoCardItem } from '../../../components/InfoCard';
import { DateDisplay } from '../../../components';
import { TranslatedReferenceData } from '../../../components/Translation';

export const LabRequestSampleDetailsCard = ({ labRequest }) => (
  <InfoCard>
    <InfoCardItem
      label="Date & time"
      value={<DateDisplay date={labRequest.sampleTime} showTime />}
    />
    <InfoCardItem label="Collected by" value={labRequest.collectedBy?.displayName || '-'} />
    <InfoCardItem 
      label="Specimen type" 
      value={(labRequest.specimenType?.name && <TranslatedReferenceData 
        fallback={labRequest.specimenType.name}
        value={labRequest.specimenType.id}
        category="specimenType"
      />) || '-'} 
    />
    <InfoCardItem 
      label="Site" 
      value={(labRequest.site?.name && <TranslatedReferenceData 
        fallback={labRequest.site.name}
        value={labRequest.site.id}
        category="labSampleSite"
      />) || '-'} 
    />
  </InfoCard>
);
