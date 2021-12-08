import React, { useMemo } from 'react';

import { CustomisablePatientSearchBar } from './PatientSearchBar';
import { useApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';
import { AutocompleteField } from '../../../components';

export const ImmunisationSearchBar = props => {
  const api = useApi();
  const villageSuggester = useMemo(() => new Suggester(api, 'village'), [api]);

  return (
    <CustomisablePatientSearchBar
      title="Search for patients"
      fields={[
        ['displayId'],
        ['firstName'],
        ['lastName'],
        ['villageId', { suggester: villageSuggester, component: AutocompleteField }],
        ['vaccinationStatus'],
      ]}
      {...props}
    />
  );
};
