import React from "react";
import { AutocompleteField, TextField } from "../../../../../components";
import { ConfiguredMandatoryPatientFields } from "../../../../../components/ConfiguredMandatoryPatientFields";

export const CambodiaLocationFields = ({
  filterByMandatory,
  subdivisionSuggester,
  divisionSuggester,
  villageSuggester,
  settlementSuggester,
}) => {
  const LOCATION_FIELDS = {
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
    },
    villageId: {
      component: AutocompleteField,
      suggester: villageSuggester,
    },
    streetVillage: {
      component: TextField,
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
