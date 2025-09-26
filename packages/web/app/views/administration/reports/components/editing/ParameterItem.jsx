// Adapted from Tupaia

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Divider as BaseDivider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import BaseDeleteOutlinedIcon from '@material-ui/icons/DeleteOutlined';
import {
  ArrayField,
  Field,
  OuterLabelFieldWrapper,
  CheckField,
} from '../../../../../components';
import { TextField, SelectField, DefaultIconButton } from '@tamanu/ui-components';
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

export const ParameterItem = (props) => {
  const { getTranslation } = useTranslation();
  const { id, parameterIndex, parameterField, setFieldValue, onDelete, options } = props;
  const baseName = `parameters.${parameterIndex}`;

  const onOptionDelete = (index) => {
    const optionsWithRemovedKey = options.filter((_, i) => i !== index);
    setFieldValue(`${baseName}.options`, optionsWithRemovedKey);
  };

  return (
    <Grid container spacing={2} key={id} data-testid="grid-6dll">
      <Grid item xs={6} data-testid="grid-fjjs">
        <Field
          name={`${baseName}.name`}
          component={TextField}
          placeholder={getTranslation('general.placeholder.text', 'Text')}
          label={
            <TranslatedText
              stringId="general.name.label"
              fallback="Name"
              data-testid="translatedtext-fxep"
            />
          }
          data-testid="field-4eel"
        />
      </Grid>
      <Grid item xs={5} data-testid="grid-wk38">
        <Field
          name={`${baseName}.label`}
          component={TextField}
          placeholder={getTranslation('general.placeholder.text', 'Text')}
          label={
            <TranslatedText
              stringId="report.editor.label.label"
              fallback="Label"
              data-testid="translatedtext-cjwr"
            />
          }
          data-testid="field-vuew"
        />
      </Grid>
      <Grid item xs={1} data-testid="grid-3jx1">
        <IconButton variant="text" onClick={() => onDelete(id)} data-testid="iconbutton-lbtf">
          <DeleteOutlinedIcon data-testid="deleteoutlinedicon-njop" />
        </IconButton>
      </Grid>
      <Grid item xs={11} data-testid="grid-pg0i">
        <Field
          name={`${baseName}.parameterField`}
          component={SelectField}
          onChange={(event) => {
            const { value } = event.target;
            setFieldValue(`${baseName}.suggesterEndpoint`, undefined);
            setFieldValue(
              `${baseName}.options`,
              FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(value) ? [] : undefined,
            );
          }}
          placeholder={getTranslation('general.placeholder.text', 'Text')}
          label={
            <TranslatedText
              stringId="report.editor.fieldType.label"
              fallback="Field type"
              data-testid="translatedtext-6dpc"
            />
          }
          options={Object.keys(PARAMETER_FIELD_COMPONENTS).map((key) => ({
            label: key,
            value: key,
          }))}
          data-testid="field-jfys"
        />
      </Grid>
      {FIELD_TYPES_WITH_SUGGESTERS.includes(parameterField) && (
        <Grid item xs={11} data-testid="grid-zzen">
          <Field
            name={`${baseName}.suggesterEndpoint`}
            component={SelectField}
            placeholder={getTranslation('general.placeholder.text', 'Text')}
            label={
              <TranslatedText
                stringId="report.editor.suggesterEndpoint.label"
                fallback="Suggester endpoint"
                data-testid="translatedtext-xidg"
              />
            }
            options={FIELD_TYPES_TO_SUGGESTER_OPTIONS[parameterField]
              .sort((a, b) => a.localeCompare(b))
              .map((key) => ({
                label: key,
                value: key,
              }))}
            data-testid="field-q27z"
          />
        </Grid>
      )}
      {FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(parameterField) && (
        <>
          <Grid item xs={12} data-testid="grid-469q">
            <OuterLabelFieldWrapper
              label={
                <TranslatedText
                  stringId="report.editor.options.label"
                  fallback="Options"
                  data-testid="translatedtext-rzt5"
                />
              }
              data-testid="outerlabelfieldwrapper-7wz9"
            />
          </Grid>
          <Field
            name={`${baseName}.options`}
            component={ArrayField}
            initialFieldNumber={options.length}
            renderField={(index, DeleteButton) => (
              <>
                <Grid item xs={6} data-testid="grid-rtdo">
                  <Field
                    name={`${baseName}.options.${index}.label`}
                    label={
                      <TranslatedText
                        stringId="general.label.label"
                        fallback="Label"
                        data-testid="translatedtext-q4qt"
                      />
                    }
                    component={TextField}
                    data-testid="field-lsw4"
                  />
                </Grid>
                <Grid item xs={5} data-testid="grid-4c3v">
                  <Field
                    name={`${baseName}.options.${index}.value`}
                    label={
                      <TranslatedText
                        stringId="general.value.label"
                        fallback="Value"
                        data-testid="translatedtext-hvrk"
                      />
                    }
                    component={TextField}
                    data-testid="field-wa7u"
                  />
                </Grid>
                <Grid item xs={1} data-testid="grid-g2ka">
                  <DeleteContainer
                    onClick={() => onOptionDelete(index)}
                    data-testid="deletecontainer-tmx9"
                  >
                    {index > 0 && DeleteButton}
                  </DeleteContainer>
                </Grid>
              </>
            )}
            data-testid="field-dzmr"
          />
        </>
      )}
      {parameterField === 'FacilityField' && (
        <Grid item xs={12} data-testid="grid-p9v0">
          <Field
            name={`${baseName}.filterBySelectedFacility`}
            label={
              <TranslatedText
                stringId="report.editor.filterOtherSuggestionsSelectedFacility.label"
                fallback="Filter other suggestions by selected facility"
                data-testid="translatedtext-u1on"
              />
            }
            component={CheckField}
            data-testid="field-ujc4"
          />
        </Grid>
      )}
      <Grid item xs={12} data-testid="grid-qia9">
        <Divider data-testid="divider-jdjg" />
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
