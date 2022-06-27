import { Breadcrumbs, Link } from '@material-ui/core';
import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

export const PatientBreadcrumbs = () => {
  const params = useParams();
  const patient = useSelector(state => state.patient)
  return (
    <Breadcrumbs component='div'>
      {params.patientId && (
        <Link underline="hover" color="inherit" href="/">
          {patient.name}
        </Link>
      )}
    </Breadcrumbs>
  )
}
