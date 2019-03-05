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
  UpdateButton,
  BackButton,
  DiagnosisAutocomplete,
} from '../../components';
import { dateFormat } from '../../constants';

const ButtonsContainer = styled.div`
  padding: 8px 8px 32px 8px;
  text-align: right;
  > button {
    margin-right: 8px
  }
`;

export default ({ match: { params: { patientId, id } = {} } }) => {
  const action = id ? 'edit' : 'new';
  const isPatientSelected = !!patientId;
  const isFormValid = false;
  const patient = null;

  return (
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
            {action !== 'new' &&
              <Grid item xs={6}>
                <DiagnosisAutocomplete
                  label="Diagnosis"
                  name="diagnosis"
                  onChange={() => {}}
                />
              </Grid>
            }
            <Grid item xs={6}>
              <InputGroup
                label="Location"
                name="location"
                onChange={() => {}}
              />
            </Grid>
          </Grid>
          <Grid container>
            {action !== 'new' &&
              <TextareaGroup
                label="Detail"
                name="detail"
                onChange={() => {}}
                required
              />
            }
            <TextareaGroup
              label="Notes"
              name="notes"
              onChange={() => {}}
            />
          </Grid>
          <ButtonsContainer>
            <BackButton />
            {action === 'new' ?
              <AddButton
                type="submit"
                disabled={!isFormValid}
                can={{ do: 'create', on: 'imaging' }}
              /> :
              <UpdateButton
                type="submit"
                disabled={!isFormValid}
                can={{ do: 'update', on: 'imaging' }}
              />
            }
          </ButtonsContainer>
        </div>
      </form>
    </div>
  );
};