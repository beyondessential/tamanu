import React from 'react';
import { Grid } from '@material-ui/core';
import moment from 'moment';
import { capitalize } from 'lodash';
import styled from 'styled-components';
import TopRow from '../Patients/components/TopRow';
import {
  TopBar,
  PatientAutocomplete,
  PatientRelationSelect,
  InputGroup,
  TextareaGroup,
  AddButton,
  CancelButton,
  DiagnosisAutocomplete,
} from '../../components';
import { dateFormat } from '../../constants';

const isPatientSelected = false;
const isFormValid = false;
const ButtonsContainer = styled.div`
  padding: 8px 8px 32px 8px;
  text-align: right;
  > button {
    margin-right: 8px
  }
`;

export default () => (
  <div className="create-content">
    <TopBar title="New Imaging Request" />
    <form
      className="create-container"
    >
      <div className="form with-padding">
        <Grid container spacing={8}>
          {isPatientSelected ?
            <Grid item container xs={12}>
              <TopRow patient={patient} />
            </Grid> :
            <Grid item xs={6}>
              <PatientAutocomplete
                label="Patient"
                name="patient"
                onChange={() => {}}
                required
              />
            </Grid>
          }
          <Grid item xs={6}>
            <PatientRelationSelect
              className=""
              relation="visits"
              template={visit => `${moment(visit.startDate).format(dateFormat)} (${capitalize(visit.visitType)})`}
              label="Visit"
              name="visit"
              onChange={() => {}}
            />
          </Grid>
        </Grid>
        <Grid container>
          <DiagnosisAutocomplete
            label="Diagnosis"
            name="diagnosis"
            onChange={() => {}}
          />
          <InputGroup
            label="Location"
            name="location"
            onChange={() => {}}
          />
        </Grid>
        <Grid container>
          <TextareaGroup
            label="Detail"
            name="detail"
            onChange={() => {}}
            required
          />
          <TextareaGroup
            label="Notes"
            name="notes"
            onChange={() => {}}
          />
        </Grid>
        <ButtonsContainer>
          <CancelButton to="/imaging" />
          <AddButton
            type="submit"
            disabled={!isFormValid}
          />
        </ButtonsContainer>
      </div>
    </form>
  </div>
);

