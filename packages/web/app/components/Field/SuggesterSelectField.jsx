import React from 'react';
import PropTypes from 'prop-types';

import { SelectInput } from '@tamanu/ui-components';
import { MultiselectInput } from './MultiselectField';
import { useSuggesterOptions } from '../../hooks';

export const SuggesterSelectField = React.memo(
  ({
    field,
    endpoint,
    baseQueryParameters,
    filterByFacility,
    baseOptions = [],
    isMulti = false,
    ...props
  }) => {
    const options = useSuggesterOptions({
      field,
      endpoint,
      baseQueryParameters,
      filterByFacility,
      baseOptions,
      isMulti,
    });

    const baseProps = {
      name: field.name,
      onChange: field.onChange,
      value: field.value,
      options,
    };

    return isMulti ? (
      <MultiselectInput {...baseProps} {...props} data-testid="multiselectinput-vf2i" />
    ) : (
      <SelectInput {...baseProps} {...props} data-testid="selectinput-phtg" />
    );
  },
);

SuggesterSelectField.propTypes = {
  endpoint: PropTypes.string.isRequired,
  field: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
};
