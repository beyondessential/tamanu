import React from 'react';
import styled from 'styled-components';
import { Form, FormSubmitButton, TextButton, FormGrid } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import Typography from '@material-ui/core/Typography';
import { DynamicSelectField, Field, SearchField } from './Field';
import { TranslatedText } from './Translation/TranslatedText';

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpeg', label: 'JPEG' },
];

const Container = styled.div`
  padding: 2rem;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
  border-bottom: 1px solid ${Colors.outline};
`;

const HeaderBar = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    font-size: 1rem;
    font-weight: 500;
    color: ${(props) => props.theme.palette.text.primary};
  }
`;

const CustomFormGrid = styled(FormGrid)`
  grid-template-columns: repeat(3, 1fr) auto auto;
  align-items: end;
`;

const ClearButton = styled(TextButton)`
  text-decoration: underline;
  width: auto;
  margin-bottom: 10px;
`;

const SubmitButton = styled(FormSubmitButton)`
  width: auto;
`;

export const DocumentsSearchBar = ({ setSearchParameters }) => {
  const handleSubmit = async (values) => {
    setSearchParameters(values);
  };

  return (
    <Container data-testid="container-4eoo">
      <HeaderBar data-testid="headerbar-53or">
        <Typography variant="h3" data-testid="typography-yb47">
          <TranslatedText
            stringId="patient.document.search.title"
            fallback="Documents search"
            data-testid="translatedtext-mra0"
          />
        </Typography>
      </HeaderBar>
      <Form
        onSubmit={handleSubmit}
        render={({ clearForm, values }) => (
          <CustomFormGrid columns={5} data-testid="customformgrid-mdsr">
            <Field
              name="type"
              label={
                <TranslatedText
                  stringId="document.type.label"
                  fallback="Type"
                  data-testid="translatedtext-nwvc"
                />
              }
              component={DynamicSelectField}
              options={DOCUMENT_TYPE_OPTIONS}
              size="small"
              data-testid="field-3mst"
            />
            <Field
              name="documentOwner"
              label={
                <TranslatedText
                  stringId="document.owner.label"
                  fallback="Owner"
                  data-testid="translatedtext-527k"
                />
              }
              component={SearchField}
              size="small"
              data-testid="field-keq3"
            />
            <Field
              name="departmentName"
              label={
                <TranslatedText
                  stringId="general.department.label"
                  fallback="Department"
                  data-testid="translatedtext-3z2r"
                />
              }
              component={SearchField}
              size="small"
              data-testid="field-l56i"
            />
            <SubmitButton type="submit" size="small" data-testid="submitbutton-fljj">
              <TranslatedText
                stringId="general.action.search"
                fallback="Search"
                data-testid="translatedtext-wdts"
              />
            </SubmitButton>
            <ClearButton
              onClick={() => {
                if (Object.keys(values).length === 0) return;
                setSearchParameters({});
                clearForm();
              }}
              size="small"
              data-testid="clearbutton-esac"
            >
              <TranslatedText
                stringId="general.action.clearSearch"
                fallback="Clear"
                data-testid="translatedtext-ie7q"
              />
            </ClearButton>
          </CustomFormGrid>
        )}
        data-testid="form-p5qy"
      />
    </Container>
  );
};
