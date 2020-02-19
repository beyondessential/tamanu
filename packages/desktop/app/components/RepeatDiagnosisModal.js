import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';

export const RepeatDiagnosisModal = React.memo(({ open, onClose }) => (
  <Modal title="Repeat diagnosis" open={open} onClose={onClose}>
    repeat diagnosis
  </Modal>
));

