import React from "react";
import { AutocompleteField, TextField } from "../../../../../components";
import { ConfiguredMandatoryPatientFields } from "../../../../../components/ConfiguredMandatoryPatientFields/ConfiguredMandatoryPatientFields";

export const GenericLocationFields = ({
  showMandatory,
  subdivisionSuggester,
  divisionSuggester,
  countrySuggester,
  settlementSuggester,
  medicalAreaSuggester,
  nursingZoneSuggester,
}) => {
  const LOCATION_FIELDS = {
    cityTown: {
      component: TextField,
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
    },
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
    },
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
    },
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
    },
    streetVillage: {
      component: TextField,
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
