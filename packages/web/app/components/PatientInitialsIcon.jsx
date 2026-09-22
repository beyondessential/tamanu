import React, { memo } from 'react';
import styled from 'styled-components';
import Avatar from '@material-ui/core/Avatar';
import { Colors } from '../constants';

const StyledAvatar = styled(Avatar)`
  background: ${Colors.primary};
  color: ${Colors.white};
  text-transform: uppercase;
  width: 46px;
  height: 46px;
`;

// A photo is stored as uploaded, so it's centre-cropped here to fit the avatar
const PhotoAvatar = styled(StyledAvatar)`
  background: ${Colors.softOutline};

  .MuiAvatar-img {
    object-fit: cover;
    object-position: center;
  }
`;

export const PatientInitialsIcon = memo(({ patient, photo, className }) => {
  const first = patient.firstName ? patient.firstName.substring(0, 1) : '';
  const last = patient.lastName ? patient.lastName.substring(0, 1) : '';

  if (photo?.data) {
    return (
      <PhotoAvatar
        className={className}
        src={`data:${photo.mimeType};base64,${photo.data}`}
        alt=""
        data-testid="patientphotoavatar"
      />
    );
  }

  return (
    <StyledAvatar
      color="primary"
      className={className}
      data-testid="styledavatar-lm84"
    >{`${first}${last}`}</StyledAvatar>
  );
}); // TODO add sync status symbol
