import React from "react";
import { AutocompleteField, TextField } from "../../../../../components";
import { ConfiguredMandatoryPatientFields } from "../../../../../components/ConfiguredMandatoryPatientFields";
import { useSuggester } from "../../../../../api";

export const CambodiaLocationFields = ({
  filterByMandatory,
}) => {
  const subdivisionSuggester = useSuggester("subdivision");
  const divisionSuggester = useSuggester("division");
  const settlementSuggester = useSuggester("settlement");
  const villageSuggester = useSuggester("village");

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
