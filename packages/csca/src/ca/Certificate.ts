import { promises as fs } from 'fs';

import {
  X509Certificate,
  X509CertificateGenerator,
  Pkcs10CertificateRequest,
  JsonName,
  JsonAttributeAndValue,
  PemConverter,
} from '@peculiar/x509';

import { Period, Subject } from './Config';
import { Extension, forgeExtensions } from './certificateExtensions';
import crypto from '../crypto';
import { keyPairFromPrivate } from '../utils';

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
      crypto,
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
      crypto,
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
        subject: {
          country: getSubjectName(subject, 'C', true)!,
          commonName: getSubjectName(subject, 'CN', true)!,
          organisation: getSubjectName(subject, 'O'),
          organisationUnit: getSubjectName(subject, 'OU'),
        },
      },
      issuer,
      issuerPrivateKey,
      await request.publicKey.export(crypto),
    );
  }

  public get x509(): X509Certificate {
    return this.cert;
  }

  public async write(file: string) {
    await fs.writeFile(file, this.cert.toString('pem'));
  }

  public static async read(file: string): Promise<Certificate> {
    const certFile = await fs.readFile(file);

    let crt: X509Certificate;
    if (certFile.slice(0, 5).toString('utf-8') === '-----') {
      const raws = PemConverter.decode(certFile.toString('utf-8'));
      if (raws.length !== 1)
        throw new Error(`Invalid certificate file ${file}: exactly one PEM block expected`);

      crt = new X509Certificate(raws[0]);
    } else {
      crt = new X509Certificate(certFile);
    }

    return new Certificate(crt);
  }

  public async check(key: CryptoKey) {
    if (key.type === 'private') {
      key = (await keyPairFromPrivate(key)).publicKey;
    }

    if (!(await this.cert.verify({
      date: new Date(),
      publicKey: key,
    }, crypto))) {
      throw new Error('Certificate has been tampered with: signature is invalid');
    }
  }
}

export interface CertificateCreateParams {
  subject: Subject;
  serial: Buffer;
  validityPeriod: Period;
  workingPeriod: Period;
  extensions: Extension[];
}

function getSubjectName(
  subject: JsonName,
  key: string,
  require: boolean = false,
): string | undefined {
  const field = subject.find(item => item[key] !== undefined)?.[key]?.[0];
  if (field) return field;
  else if (require) throw new Error(`CSR subject has no field ${key}`);
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
