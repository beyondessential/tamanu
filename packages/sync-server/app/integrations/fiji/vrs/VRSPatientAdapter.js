import { REFERENCE_TYPES } from 'shared/constants';

export class VRSPatientAdapter {
  store = null;

  constructor(store) {
    this.store = store;
  }

  async toTamanu(vrsPatient) {
    const {
      // TODO: capture these and put them somewhere
      individual_refno: refNo,
      id_type: idType,

      identifier: displayId,
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
      if (!village) {
        // TODO: how do we handle missing villages?
        throw new Error(`TODO: unknown village name ${villageName}`);
      }
      villageId = village.id;
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
    };
  }
}
