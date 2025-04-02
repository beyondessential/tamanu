import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Divider, Popper, Paper, ClickAwayListener, Fade } from '@material-ui/core';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { Button } from '../Button';
import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import { useMarMutation } from '../../api/mutations/useMarMutation';
import { useEncounter } from '../../contexts/Encounter';
import { useSuggestionsQuery } from '../../api/queries/useSuggestionsQuery';

const StyledPaper = styled(Paper)`
  box-shadow: 0px 8px 32px 0px #00000026;
  border-radius: 5px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 8px solid white;
    z-index: 2;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-left: 9px solid rgba(0, 0, 0, 0.1);
    z-index: 1;
    margin-left: 1px;
  }
`;

const PopperContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 11px 14px;
`;

const StyledButton = styled(Button)`
  color: ${p => p.$color};
  border-color: ${p => p.$color} !important;
`;

export const StatusPopper = ({
  marId,
  open,
  anchorEl,
  onClose,
  administeredAt,
  prescriptionId,
}) => {
  const [showReasonScreen, setShowReasonScreen] = useState(false);
  const { mutateAsync: updateMar } = useMarMutation(marId);
  const queryClient = useQueryClient();
  const handleNotGivenClick = () => {
    setShowReasonScreen(true);
  };
  const { encounter } = useEncounter();

  const handleClose = () => {
    setShowReasonScreen(false);
    onClose();
  };

  const handleReasonSelect = async reasonNotGivenId => {
    await updateMar({
      status: ADMINISTRATION_STATUS.NOT_GIVEN,
      reasonNotGivenId,
      administeredAt,
      prescriptionId,
    });

    queryClient.invalidateQueries(['encounterMedication', encounter?.id]);

    setShowReasonScreen(false);
    handleClose();
  };

  const handleGivenClick = () => {
    handleClose();
  };

  const reasonsNotGiven = useSuggestionsQuery('reasonNotGiven');

  const renderMainScreen = () => {
    return (
      <PopperContent>
        <StyledButton onClick={handleGivenClick} variant="outlined" $color={Colors.green}>
          <TranslatedText stringId="medication.status.given" fallback="Given" />
        </StyledButton>
        <Divider color={Colors.outline} />
        <StyledButton onClick={handleNotGivenClick} variant="outlined" $color={Colors.alert}>
          <TranslatedText stringId="medication.status.notGiven" fallback="Not given" />
        </StyledButton>
      </PopperContent>
    );
  };

  const renderReasonScreen = () => {
    return (
      <PopperContent>
        {reasonsNotGiven?.data?.map(reason => (
          <Button key={reason.id} variant="outlined" onClick={() => handleReasonSelect(reason.id)}>
            <TranslatedText stringId={reason.name} fallback={reason.name} />
          </Button>
        ))}
      </PopperContent>
    );
  };

  const getContent = () => {
    if (showReasonScreen) {
      return renderReasonScreen();
    }
    return renderMainScreen();
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="left"
      transition
      modifiers={{
        offset: {
          enabled: true,
          offset: '0, 10',
        },
      }}
      style={{ zIndex: 1300 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={250}>
          <div>
            <ClickAwayListener onClickAway={handleClose}>
              <StyledPaper>{getContent()}</StyledPaper>
            </ClickAwayListener>
          </div>
        </Fade>
      )}
    </Popper>
  );
};
