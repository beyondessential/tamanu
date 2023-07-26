/* eslint-disable camelcase, @typescript-eslint/camelcase */

import { promises as fs } from 'fs';

import { AsnConvert } from '@peculiar/asn1-schema';
import { PrivateKeyUsagePeriod, id_ce_privateKeyUsagePeriod } from '@peculiar/asn1-x509';
import {
  JsonAttributeAndValue,
  JsonName,
  Pkcs10CertificateRequest,
  X509Certificate,
  X509CertificateGenerator,
} from '@peculiar/x509';

import CA from '.';
import crypto from '../crypto';
import { keyPairFromPrivate } from '../utils';
import { Period, Subject } from './Config';
import { CertificateIndexEntry } from './State';
import { Extension, forgeExtensions } from './certificateExtensions';

export interface CertificateCreateParams {
  subject: Subject;
  serial: Buffer;
  validityPeriod: Period;
  workingPeriod: Period;
  extensions: Extension[];
}

function getSubjectName(dn: JsonName, key: string): string | undefined {
  return dn.find((item) => !!item[key])?.[key]?.[0];
}

function requireSubjectName(dn: JsonName, key: string): string {
  const field = getSubjectName(dn, key);
  if (!field) throw new Error(`CSR subject has no field ${key}`);
  return field;
}

function subjectFromDn(dn: JsonName): Subject {
  return {
    country: requireSubjectName(dn, 'C'),
    commonName: requireSubjectName(dn, 'CN'),
    organisation: getSubjectName(dn, 'O'),
    organisationUnit: getSubjectName(dn, 'OU'),
  };
}

function dnFromSubject(subject: Subject): JsonName {
  const distinguishedName: JsonAttributeAndValue = {
    C: [subject.country],
    CN: [subject.commonName],
  };

  if (subject.organisation) distinguishedName.O = [subject.organisation];
  if (subject.organisationUnit) distinguishedName.OU = [subject.organisationUnit];

  return [distinguishedName];
}

export default class Certificate {
  private cert: X509Certificate;

  constructor(cert: X509Certificate) {
    this.cert = cert;
  }

  public static async createRoot(
    params: CertificateCreateParams,
    keyPair: CryptoKeyPair,
  ): Promise<Certificate> {
    const { validityPeriod, serial, subject } = params;

    const cert = await X509CertificateGenerator.createSelfSigned(
      {
        name: dnFromSubject(subject),
        extensions: await forgeExtensions(params, keyPair.publicKey),
        notBefore: validityPeriod.start,
        notAfter: validityPeriod.end,
        serialNumber: serial.toString('hex'),
        signingAlgorithm: {
          name: 'SHA256withECDSA',
          hash: 'SHA-256',
        },
        keys: keyPair,
      },
      crypto as Crypto,
    );

    return new Certificate(cert);
  }

  public static async createIssued(
    params: CertificateCreateParams,
    issuer: Certificate,
    issuerPrivateKey: CryptoKey,
    subjectPublicKey: CryptoKey,
  ): Promise<Certificate> {
    const { validityPeriod, serial, subject } = params;

    const cert = await X509CertificateGenerator.create(
      {
        subject: dnFromSubject(subject),
        issuer: issuer.cert.subject,
        extensions: await forgeExtensions(params, subjectPublicKey, issuer),
        notBefore: validityPeriod.start,
        notAfter: validityPeriod.end,
        serialNumber: serial.toString('hex'),
        signingAlgorithm: {
          name: 'SHA256withECDSA',
          hash: 'SHA-256',
        },
        signingKey: issuerPrivateKey,
        publicKey: subjectPublicKey,
      },
      crypto as Crypto,
    );
    return new Certificate(cert);
  }

  public static async createFromRequest(
    params: CertificateCreateParams,
    request: Pkcs10CertificateRequest,
    issuer: Certificate,
    issuerPrivateKey: CryptoKey,
  ): Promise<Certificate> {
    const subject = request.subjectName.toJSON();

    return Certificate.createIssued(
      {
        ...params,
        subject: subjectFromDn(subject),
      },
      issuer,
      issuerPrivateKey,
      await request.publicKey.export(crypto as Crypto),
    );
  }

  public get x509(): X509Certificate {
    return this.cert;
  }

  public get serial(): Buffer {
    return Buffer.from(this.cert.serialNumber, 'hex');
  }

  public get certId(): string {
    return this.cert.serialNumber;
  }

  private pkup(): PrivateKeyUsagePeriod | undefined {
    const ext = this.cert.extensions.find((ext) => ext.type === id_ce_privateKeyUsagePeriod);
    if (!ext) return undefined;

    return AsnConvert.parse(ext.value, PrivateKeyUsagePeriod);
  }

  /**
   * Returns the certificate as if it was an entry in the index. Note that the
   * `revocationDate` will always be `undefined` as that's not tracked here.
   */
  public asIndexEntry(): CertificateIndexEntry {
    const dn = this.cert.subjectName.toJSON();
    return new CertificateIndexEntry(this.serial, {
      subject: subjectFromDn(dn),
      issuanceDate: this.cert.notBefore,
      validityPeriodEnd: this.cert.notAfter,
      workingPeriodEnd: this.pkup()?.notAfter ?? this.cert.notAfter,
    });
  }

  public async write(file: string): Promise<void> {
    await fs.writeFile(file, this.cert.toString('pem'));
  }

  public static async read(file: string): Promise<Certificate> {
    const certFile = await fs.readFile(file);
    const crt = new X509Certificate(certFile);
    return new Certificate(crt);
  }

  public async check(ca: CA): Promise<void>;
  public async check(key: CryptoKey): Promise<void>;
  public async check(arg: CryptoKey | CA): Promise<void> {
    let key: CryptoKey;
    if (arg instanceof CA) {
      key = await arg.publicKey();
    } else {
      key = arg;
    }

    if (key.type === 'private') {
      key = (await keyPairFromPrivate(key)).publicKey;
    }

    const sigCheck = await this.cert.verify(
      {
        publicKey: key,
        signatureOnly: true,
      },
      crypto as Crypto,
    );

    if (!sigCheck) {
      throw new Error('Certificate has been tampered with: signature is invalid');
    }
  }
}
