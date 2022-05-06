import React, { useMemo, useState, useCallback } from 'react';
import InputAdornment from '@material-ui/core/InputAdornment';
import Tooltip from '@material-ui/core/Tooltip';
import SpellcheckIcon from '@material-ui/icons/Spellcheck';
import moment from 'moment';

import { CustomisableSearchBar } from '../../../components/CustomisableSearchBar';
import { DateField, AutocompleteField, CheckField, Field } from '../../../components';
import { useApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';

const DEFAULT_FIELDS = [
  'firstName',
  'lastName',
  'culturalName',
  'villageId',
  'displayId',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
];

export const PatientSearchBar = ({
  onSearch,
  fields = DEFAULT_FIELDS,
  showDeceasedPatientsCheckbox = true,
  ...props
}) => {
  const [displayIdExact, setDisplayIdExact] = useState(true);
  const toggleSearchIdExact = useCallback(() => {
    setDisplayIdExact(v => !v);
  }, [setDisplayIdExact]);
  const api = useApi();
  const commonFields = useMemo(
    () => ({
      firstName: ['firstName'],
      lastName: ['lastName'],
      culturalName: ['culturalName'],
      villageId: [
        'villageId',
        { suggester: new Suggester(api, 'village'), component: AutocompleteField },
      ],
      displayId: [
        'displayId',
        {
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Exact term search">
                  <SpellcheckIcon
                    style={{ cursor: 'pointer' }}
                    aria-label="Exact term search"
                    onClick={toggleSearchIdExact}
                    color={displayIdExact ? '' : 'disabled'}
                  />
                </Tooltip>
              </InputAdornment>
            ),
          },
        },
      ],
      dateOfBirthFrom: [
        'dateOfBirthFrom',
        { localisationLabel: 'shortLabel', component: DateField },
      ],
      dateOfBirthTo: ['dateOfBirthTo', { localisationLabel: 'shortLabel', component: DateField }],
      dateOfBirthExact: [
        'dateOfBirthExact',
        { localisationLabel: 'shortLabel', placeholder: 'DOB exact', component: DateField },
      ],
    }),
    [api, toggleSearchIdExact, displayIdExact],
  );

  const searchFields = fields.map(field =>
    typeof field === 'string' ? commonFields[field] : field,
  );

  const handleSearch = values => {
    const params = {
      ...values,
      displayIdExact,
    };
    // if filtering by date of birth exact, send the formatted date
    // to the server instead of the date object
    if (params.dateOfBirthExact) {
      params.dateOfBirthExact = moment(values.dateOfBirthExact)
        .utc()
        .format('YYYY-MM-DD');
    }
    onSearch(params);
  };
  return (
    <CustomisableSearchBar
      title="Search for patients"
      fields={searchFields}
      renderCheckField={
        showDeceasedPatientsCheckbox ? (
          <Field name="deceased" label="Include deceased patients" component={CheckField} />
        ) : null
      }
      onSearch={handleSearch}
      {...props}
    />
  );
};
