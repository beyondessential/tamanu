import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { Accordion, AccordionDetails, AccordionSummary, Grid } from '@material-ui/core';
import {
  TextField,
  TranslatedMultiSelectField,
  TranslatedSelectField,
  Form,
  ButtonRow,
  Button,
} from '@tamanu/ui-components';
import {
  REPORT_DATA_SOURCE_VALUES,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DEFAULT_DATE_RANGES_LABELS,
  REPORT_DB_CONNECTION_LABELS,
  REPORT_DB_CONNECTION_VALUES,
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_STATUSES_VALUES,
  REPORT_STATUS_LABELS,
} from '@tamanu/constants/reports';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Field } from '../../../components';
import { ParameterItem, ParameterList, SQLQueryEditor } from './components/editing';
import {
  FIELD_TYPES_WITH_PREDEFINED_OPTIONS,
  FIELD_TYPES_WITH_SUGGESTERS,
} from '../../reports/ParameterField';
import { useAuth } from '../../../contexts/Auth';
import { useApi } from '../../../api';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';

const StyledField = styled(Field)`
  flex-grow: 1;
`;

const StatusField = styled(Field)`
  width: 130px;
`;

const generateDefaultParameter = () => ({
  id: Math.random(),
});

const ReportEditorForm = ({ isSubmitting, values, setValues, dirty, isEdit, setFieldValue }) => {
  const { ability } = useAuth();
  const api = useApi();
  const setQuery = query => setValues({ ...values, query });
  const params =
    values.parameters.map(param => ({ ...generateDefaultParameter(), ...param })) || [];
  const setParams = newParams => setValues({ ...values, parameters: newParams });
  const onParamsAdd = () => setParams([...params, generateDefaultParameter()]);

  const onParamsDelete = paramId => setParams(params.filter(p => p.id !== paramId));

  const canWriteRawReportUser = Boolean(ability?.can('write', 'ReportDbSchema'));

  const { data: schemaOptions = [] } = useQuery(['dbSchemaOptions'], () =>
    api.get(`admin/reports/dbSchemaOptions`),
  );

  return (
    <>
      <Grid container spacing={2} data-testid="grid-lerl">
        <Grid item xs={4} data-testid="grid-7dai">
          <StyledField
            disabled={isEdit}
            required
            label={
              <TranslatedText
                stringId="admin.report.reportName.label"
                fallback="Report name"
                data-testid="translatedtext-lo0h"
              />
            }
            name="name"
            component={TextField}
            data-testid="styledfield-pb9c"
          />
        </Grid>
        <Grid item xs={4} data-testid="grid-hqoa">
          <StyledField
            label={
              <TranslatedText
                stringId="admin.report.defaultDateRange.label"
                fallback="Default date range"
                data-testid="translatedtext-jzvk"
              />
            }
            name="defaultDateRange"
            component={TranslatedSelectField}
            isClearable={false}
            enumValues={REPORT_DEFAULT_DATE_RANGES_LABELS}
            data-testid="styledfield-5d7v"
          />
        </Grid>
        {canWriteRawReportUser && schemaOptions?.length > 0 && (
          <Grid item xs={4} data-testid="grid-rmq1">
            <StyledField
              label={
                <TranslatedText
                  stringId="admin.report.dbSchema.label"
                  fallback="DB Schema"
                  data-testid="translatedtext-5sqa"
                />
              }
              name="dbSchema"
              component={TranslatedSelectField}
              enumValues={REPORT_DB_CONNECTION_LABELS}
              disabled={isEdit}
              isClearable={false}
              data-testid="styledfield-36lu"
            />
          </Grid>
        )}
        <Grid item xs={4} data-testid="grid-q96h">
          <StyledField
            label={
              <TranslatedText
                stringId="admin.report.canBeRunOn.label"
                fallback="Can be run on"
                data-testid="translatedtext-75m8"
              />
            }
            name="dataSources"
            component={TranslatedMultiSelectField}
            enumValues={REPORT_DATA_SOURCE_LABELS}
            data-testid="styledfield-3liy"
          />
        </Grid>
        <Grid item xs={12} data-testid="grid-0hxf">
          <StyledField
            label={
              <TranslatedText
                stringId="general.notes.label"
                fallback="Notes"
                data-testid="translatedtext-jsqk"
              />
            }
            name="notes"
            multiline
            data-testid="styledfield-0gna"
          />
        </Grid>
      </Grid>
      <Accordion defaultExpanded data-testid="accordion-5sik">
        <AccordionSummary data-testid="accordionsummary-peqh">
          <Grid container spacing={1} data-testid="grid-t6ch">
            <Grid item xs={8} data-testid="grid-a375">
              <TranslatedText
                stringId="admin.report.query.label"
                fallback="Query"
                data-testid="translatedtext-uq96"
              />
            </Grid>
            <Grid item xs={4} data-testid="grid-fet6">
              <TranslatedText
                stringId="admin.report.parameters.label"
                fallback="Parameters"
                data-testid="translatedtext-5qlc"
              />
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails data-testid="accordiondetails-uvr4">
          <Grid container spacing={2} data-testid="grid-z7ao">
            <Grid item xs={8} data-testid="grid-52vl">
              <SQLQueryEditor
                customKeywords={params.map(p => p.name)}
                onChange={setQuery}
                value={values.query}
                data-testid="sqlqueryeditor-8lhz"
              />
            </Grid>
            <Grid item xs={4} data-testid="grid-qg28">
              <ParameterList onAdd={onParamsAdd} data-testid="parameterlist-8wdf">
                {params.map(({ id, ...rest }, parameterIndex) => {
                  return (
                    <ParameterItem
                      key={id}
                      id={id}
                      parameterIndex={parameterIndex}
                      onDelete={onParamsDelete}
                      setFieldValue={setFieldValue}
                      {...rest}
                      data-testid={`parameteritem-j7u4-${parameterIndex}`}
                    />
                  );
                })}
              </ParameterList>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <ButtonRow data-testid="buttonrow-on12">
        <StatusField
          name="status"
          component={TranslatedSelectField}
          isClearable={false}
          enumValues={REPORT_STATUS_LABELS}
          data-testid="statusfield-xhku"
        />
        <Button
          disabled={!dirty}
          variant="contained"
          color="primary"
          type="submit"
          isSubmitting={isSubmitting}
          data-testid="button-dbqt"
        >
          {isEdit ? (
            <TranslatedText
              stringId="admin.report.action.createNewVersion"
              fallback="Create new version"
              data-testid="translatedtext-mzte"
            />
          ) : (
            <TranslatedText
              stringId="general.action.create"
              fallback="Create"
              data-testid="translatedtext-ykjq"
            />
          )}
        </Button>
      </ButtonRow>
    </>
  );
};

export const ReportEditor = ({ initialValues, onSubmit, isEdit }) => {
  const { getTranslation } = useTranslation();
  return (
    <Form
      onSubmit={onSubmit}
      enableReinitialize
      validationSchema={yup.object().shape({
        name: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="admin.report.reportName.label"
              fallback="Report name"
              data-testid="translatedtext-xqg4"
            />,
          ),
        dataSources: yup
          .array()
          .test(
            'test-data-sources',
            getTranslation(
              'admin.report.validation.rule.atLeast1DataSource',
              'Select at least one data source',
            ),
            val => {
              const values = val || [];
              return values.length && values.every(v => REPORT_DATA_SOURCE_VALUES.includes(v));
            },
          )
          .required(),
        defaultDateRange: yup
          .string()
          .oneOf(REPORT_DEFAULT_DATE_RANGES_VALUES)
          .required(),
        dbSchema: yup
          .string()
          .nullable()
          .oneOf([...REPORT_DB_CONNECTION_VALUES, null]),
        parameters: yup.array().of(
          yup.object().shape({
            name: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.validation.name.path"
                  fallback="Parameter name"
                  data-testid="translatedtext-74wm"
                />,
              ),
            label: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.validation.label.path"
                  fallback="Parameter label"
                  data-testid="translatedtext-tnzq"
                />,
              ),
            parameterField: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.fieldType.label"
                  fallback="Field type"
                  data-testid="translatedtext-utoj"
                />,
              ),
            suggesterEndpoint: yup.string().when('parameterField', {
              is: parameterField => FIELD_TYPES_WITH_SUGGESTERS.includes(parameterField),
              then: yup
                .string()
                .required()
                .translatedLabel(
                  <TranslatedText
                    stringId="admin.report.suggesterEndpoint.label"
                    fallback="Parameter label"
                    data-testid="translatedtext-nkst"
                  />,
                ),
              otherwise: yup.string(),
            }),
            options: yup.array().when('parameterField', {
              is: parameterField => FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(parameterField),
              then: yup
                .array()
                .test(
                  'test-options',
                  getTranslation(
                    'admin.report.validation.rule.optionMustContainLabelAndValue',
                    'Each option must contain a label and value',
                  ),
                  val => val.every(o => o.label && o.value),
                ),
              otherwise: yup.array(),
            }),
          }),
        ),
        query: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="admin.report.query.label"
              fallback="Query"
              data-testid="translatedtext-8nfi"
            />,
          ),
        status: yup
          .string()
          .oneOf(REPORT_STATUSES_VALUES)
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.status.label"
              fallback="Status"
              data-testid="translatedtext-gj6l"
            />,
          ),
      })}
      formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      initialValues={initialValues}
      render={formikContext => (
        <ReportEditorForm {...formikContext} isEdit={isEdit} data-testid="reporteditorform-5mmm" />
      )}
      data-testid="form-v39s"
    />
  );
};
