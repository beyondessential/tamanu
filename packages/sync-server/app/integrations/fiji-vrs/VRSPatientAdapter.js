import { REFERENCE_TYPES } from '@tamanu/constants';
import { log } from 'shared/services/logging';

export class VRSPatientAdapter {
  store = null;

  constructor(store) {
    this.store = store;
  }

  async toTamanu(vrsPatient) {
    const {
      id_type: idType,
      identifier,

      individual_refno: displayId,
      fname: firstName,
      lname: lastName,
      dob: dateOfBirth,
      sex,
      sub_division: villageName,
      phone: primaryContactNumber,
      email,
    } = vrsPatient;

    // look up village by name
    const { ReferenceData } = this.store.models;
    let villageId;
    if (villageName) {
      const village = await ReferenceData.findOne({
        where: {
          name: villageName,
          type: REFERENCE_TYPES.VILLAGE,
        },
      });
      if (village) {
        villageId = village.id;
      } else {
        // villageName will be persisted in a PatientVRSData record
        log.warn(
          `VRSPatientAdapter.toTamanu: received sub_division with no village mapping (${villageName})`,
        );
      }
    }
    return {
      patient: {
        displayId,
        firstName,
        lastName,
        dateOfBirth,
        sex,
        villageId,
        email,
      },
      patientAdditionalData: {
        primaryContactNumber,
      },
      patientVRSData: {
        idType,
        identifier,
        unmatchedVillageName: villageId ? null : villageName,
      },
    };
  }
}
