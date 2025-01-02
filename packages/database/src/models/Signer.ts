import crypto from 'crypto';
import { Op, DataTypes, Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

export class Signer extends Model {
  id!: string;
  countryCode!: string;
  privateKey?: Buffer;
  publicKey!: Buffer;
  request!: string;
  requestSentAt?: Date;
  certificate?: string;
  workingPeriodStart?: Date;
  workingPeriodEnd?: Date;
  validityPeriodStart?: Date;
  validityPeriodEnd?: Date;
  signaturesIssued!: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,

        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        countryCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        privateKey: {
          // encrypted with integrations.signer.keySecret
          type: DataTypes.BLOB, // PKCS8 DER in PKCS5 DER
          allowNull: true,
        },
        publicKey: {
          type: DataTypes.BLOB, // SPKI DER
          allowNull: false,
        },

        request: {
          // certificate request
          type: DataTypes.TEXT, // PKCS10 PEM
          allowNull: false,
        },
        requestSentAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        certificate: {
          // issued by CSCA
          type: DataTypes.TEXT, // X.509 PEM
          allowNull: true,
        },

        workingPeriodStart: {
          // start of the working period of this certificate
          // extracted/cached from certificate PKUP (Private Key Usage Period)
          type: DataTypes.DATE,
          allowNull: true,
        },
        workingPeriodEnd: {
          // end of the working period of this certificate
          // extracted/cached from certificate PKUP (Private Key Usage Period)
          type: DataTypes.DATE,
          allowNull: true,
        },
        validityPeriodStart: {
          // start of the validity period of this certificate
          // extracted/cached from certificate Not Before field
          type: DataTypes.DATE,
          allowNull: true,
        },
        validityPeriodEnd: {
          // end of the validity period of this certificate
          // extracted/cached from certificate Not After field
          type: DataTypes.DATE,
          allowNull: true,
        },

        signaturesIssued: {
          // bumped on each signature issuance
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        paranoid: true,
        indexes: [
          { fields: ['validity_period_start'] },
          { fields: ['validity_period_end'] },
          { fields: ['working_period_start'] },
          { fields: ['working_period_end'] },
        ],
      },
    );
  }

  static findActive() {
    return Signer.findOne({
      where: {
        validityPeriodStart: { [Op.lte]: Sequelize.literal('CURRENT_TIMESTAMP') },
        workingPeriodStart: { [Op.lte]: Sequelize.literal('CURRENT_TIMESTAMP') },
        workingPeriodEnd: { [Op.gt]: Sequelize.literal('CURRENT_TIMESTAMP') },
        validityPeriodEnd: { [Op.gt]: Sequelize.literal('CURRENT_TIMESTAMP') },
        certificate: { [Op.not]: null },
        privateKey: { [Op.not]: null },
      },
    });
  }

  /**
   * Fetches pending signer, those without certificates
   * Errors if multiple pending signers are found
   * return {Signer} The pending signer, or null if there's none
   */
  static async findPending() {
    const pending = await Signer.findAll({
      where: {
        certificate: { [Op.is]: null },
        privateKey: { [Op.not]: null },
      },
    });
    if (pending.length > 1) {
      throw new Error('More than one pending signer, you need to fix this manually');
    }
    return pending[0] ?? null;
  }

  /**
   * @return {boolean} True if the signer is active (can be used).
   */
  isActive() {
    const now = new Date();
    return !!(
      this.validityPeriodStart! <= now &&
      this.workingPeriodStart! <= now &&
      this.workingPeriodEnd! > now &&
      this.validityPeriodEnd! > now &&
      this.certificate &&
      this.privateKey
    );
  }

  decryptPrivateKey(keySecret: string) {
    return crypto.createPrivateKey({
      key: Buffer.from(this.privateKey!),
      format: 'der',
      type: 'pkcs8',
      passphrase: Buffer.from(keySecret, 'base64'),
    });
  }
}
