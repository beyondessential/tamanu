import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class VdsNcSignature extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        dateIssued: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        algorithm: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        signature: {
          type: Sequelize.BLOB,
          allowNull: false,
        },
      },
      {
        ...options,
        validate: {
          mustHaveFacility() {
            if (!this.facilityId) {
              throw new Error('A VDS-NC signature must be attached to a facility.');
            }
          },
          mustHavePatient() {
            if (!this.patientId) {
              throw new Error('A VDS-NC signature must be attached to a patient.');
            }
          },
          mustHaveSigner() {
            if (!this.signerId) {
              throw new Error('A VDS-NC signature must be attached to a VDS-NC signer.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });
    this.belongsTo(models.VdsNcSigner, {
      foreignKey: 'signerId',
    });
  }

  static buildPoT({
    keySecret, // secret key from config (icao.keySecret)
    countryCode, // alpha-3 country code
    facility, // Facility instance
    msg, // VDS-NC msg object in the PoT format
  }) {
    const data = {
      hdr: {
        t: 'icao.test',
        v: 1,
        is: countryCode,
      },
      msg,
    };

    return VdsNcSignature.buildFromData(data, { keySecret, facility });
  }

  static buildPoV({
    keySecret, // secret key from config (icao.keySecret)
    countryCode, // alpha-3 country code
    facility, // Facility instance
    msg, // VDS-NC msg object in the PoV format
  }) {
    const data = {
      hdr: {
        t: 'icao.vacc',
        v: 1,
        is: countryCode,
      },
      msg,
    };

    return VdsNcSignature.buildFromData(data, { keySecret, facility });
  }

  // internal use, prefer buildPoT and buildPoV
  static async buildFromData(data, { keySecret, facility }) {
    // => lookup latest valid+ready signer for facility
    const signed = signer.issueSignature(data, { keySecret });
    const sig = VdsNcSignature.build({
      algorithm: signed.sig.alg,
      signature: Buffer.from(signed.sig.sig, 'base64'),
    });
    sig.setFacility(facility);
    sig.setVdsNcSigner(signer);

    const pack = JSON.stringify(signed);
    return { pack, sig };
  }
}
