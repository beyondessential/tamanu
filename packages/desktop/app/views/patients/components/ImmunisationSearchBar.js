import React, { useMemo } from 'react';

import { CustomisableSearchBar } from '../../../components/CustomisableSearchBar';
import { useApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';
import { AutocompleteField } from '../../../components';

export const ImmunisationSearchBar = props => {
  const api = useApi();
  const villageSuggester = useMemo(() => new Suggester(api, 'village'), [api]);

  return (
    <CustomisableSearchBar
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
