// Adapted from Tupaia

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Divider as BaseDivider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import BaseDeleteOutlinedIcon from '@material-ui/icons/DeleteOutlined';
import {
  ArrayField,
  DefaultIconButton,
  Field,
  OuterLabelFieldWrapper,
  TextField,
  SelectField,
  CheckField,
} from '../../../../../components';
import {
  FIELD_TYPES_TO_SUGGESTER_OPTIONS,
  FIELD_TYPES_WITH_PREDEFINED_OPTIONS,
  FIELD_TYPES_WITH_SUGGESTERS,
  PARAMETER_FIELD_COMPONENTS,
} from '../../../../reports/ParameterField';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../../../contexts/Translation';

const Divider = styled(BaseDivider)`
  margin-top: 20px;
  margin-bottom: 20px;
`;

const IconButton = styled(DefaultIconButton)`
  top: 35px;
  width: 30%;
  height: 20px;
`;
const DeleteOutlinedIcon = styled(BaseDeleteOutlinedIcon)`
  font-size: 25px;
`;

const DeleteContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 35px;
  button {
    padding: 0;
  }
`;

export const ParameterItem = props => {
  const { getTranslation } = useTranslation();
  const { id, parameterIndex, parameterField, setFieldValue, onDelete, options } = props;
  const baseName = `parameters.${parameterIndex}`;

  const onOptionDelete = index => {
    const optionsWithRemovedKey = options.filter((_, i) => i !== index);
    setFieldValue(`${baseName}.options`, optionsWithRemovedKey);
  };

  return (
    <Grid container spacing={2} key={id}>
      <Grid item xs={6}>
        <Field
          name={`${baseName}.name`}
          component={TextField}
          placeholder={getTranslation('general.placeholder.text', 'Text')}
          label={<TranslatedText
            stringId="general.name.label"
            fallback="Name"
            data-testid='translatedtext-kalt' />}
          data-testid='field-upul' />
      </Grid>
      <Grid item xs={5}>
        <Field
          name={`${baseName}.label`}
          component={TextField}
          placeholder={getTranslation('general.placeholder.text', 'Text')}
          label={<TranslatedText
            stringId="report.editor.label.label"
            fallback="Label"
            data-testid='translatedtext-a84w' />}
          data-testid='field-j5ff' />
      </Grid>
      <Grid item xs={1}>
        <IconButton variant="text" onClick={() => onDelete(id)} data-testid='iconbutton-h4w1'>
          <DeleteOutlinedIcon />
        </IconButton>
      </Grid>
      <Grid item xs={11}>
        <Field
          name={`${baseName}.parameterField`}
          component={SelectField}
          onChange={event => {
            const { value } = event.target;
            setFieldValue(`${baseName}.suggesterEndpoint`, undefined);
            setFieldValue(
              `${baseName}.options`,
              FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(value) ? [] : undefined,
            );
          }}
          placeholder={getTranslation('general.placeholder.text', 'Text')}
          label={<TranslatedText
            stringId="report.editor.fieldType.label"
            fallback="Field type"
            data-testid='translatedtext-6zpb' />}
          options={Object.keys(PARAMETER_FIELD_COMPONENTS).map(key => ({
            label: key,
            value: key,
          }))}
          data-testid='field-wfsd' />
      </Grid>
      {FIELD_TYPES_WITH_SUGGESTERS.includes(parameterField) && (
        <Grid item xs={11}>
          <Field
            name={`${baseName}.suggesterEndpoint`}
            component={SelectField}
            placeholder={getTranslation('general.placeholder.text', 'Text')}
            label={
              <TranslatedText
                stringId="report.editor.suggesterEndpoint.label"
                fallback="Suggester endpoint"
                data-testid='translatedtext-apxf' />
            }
            options={FIELD_TYPES_TO_SUGGESTER_OPTIONS[parameterField]
              .sort((a, b) => a.localeCompare(b))
              .map(key => ({
                label: key,
                value: key,
              }))}
            data-testid='field-2qel' />
        </Grid>
      )}
      {FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(parameterField) && (
        <>
          <Grid item xs={12}>
            <OuterLabelFieldWrapper
              label={<TranslatedText
                stringId="report.editor.options.label"
                fallback="Options"
                data-testid='translatedtext-bvmc' />}
            />
          </Grid>
          <Field
            name={`${baseName}.options`}
            component={ArrayField}
            initialFieldNumber={options.length}
            renderField={(index, DeleteButton) => (
              <>
                <Grid item xs={6}>
                  <Field
                    name={`${baseName}.options.${index}.label`}
                    label={<TranslatedText
                      stringId="general.label.label"
                      fallback="Label"
                      data-testid='translatedtext-5l93' />}
                    component={TextField}
                    data-testid='field-vhpk' />
                </Grid>
                <Grid item xs={5}>
                  <Field
                    name={`${baseName}.options.${index}.value`}
                    label={<TranslatedText
                      stringId="general.value.label"
                      fallback="Value"
                      data-testid='translatedtext-qmbn' />}
                    component={TextField}
                    data-testid='field-ee8j' />
                </Grid>
                <Grid item xs={1}>
                  <DeleteContainer onClick={() => onOptionDelete(index)}>
                    {index > 0 && DeleteButton}
                  </DeleteContainer>
                </Grid>
              </>
            )}
            data-testid='field-qjlf' />
        </>
      )}
      {parameterField === 'FacilityField' && (
        <Grid item xs={12}>
          <Field
            name={`${baseName}.filterBySelectedFacility`}
            label={
              <TranslatedText
                stringId="report.editor.filterOtherSuggestionsSelectedFacility.label"
                fallback="Filter other suggestions by selected facility"
                data-testid='translatedtext-va0s' />
            }
            component={CheckField}
            data-testid='field-h8m9' />
        </Grid>
      )}
      <Grid item xs={12}>
        <Divider />
      </Grid>
    </Grid>
  );
};

ParameterItem.propTypes = {
  id: PropTypes.string.isRequired,
  parameterField: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
};

ParameterItem.defaultProps = {
  parameterField: '',
};
