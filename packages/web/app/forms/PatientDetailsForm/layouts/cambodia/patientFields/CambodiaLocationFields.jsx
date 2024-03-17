import React from 'react';
import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { LinkedField } from '../../../../../components/Field/LinkedField';

export const CambodiaLocationFields = ({ filterByMandatory }) => {
  const subdivisionSuggester = useSuggester('subdivision');
  const divisionSuggester = useSuggester('division');
  const settlementSuggester = useSuggester('settlement');
  const villageSuggester = useSuggester('village');

  const LOCATION_FIELDS = {
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
      label: (
        <TranslatedText stringId="cambodiaPatientDetails.province.label" fallback="Province" />
      ),
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
      label: (
        <TranslatedText stringId="cambodiaPatientDetails.district.label" fallback="District" />
      ),
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
      label: <TranslatedText stringId="cambodiaPatientDetails.commune.label" fallback="Commune" />,
    },
    villageId: {
      component: LinkedField,
      linkedFieldName: 'nursingZoneId',
      endpoint: 'linkedField/healthCenter',
      suggester: villageSuggester,
      label: (
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
      ),
    },
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.streetNoAndName.label"
          fallback="Street No. & Name"
        />
      ),
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
