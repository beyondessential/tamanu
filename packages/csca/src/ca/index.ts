import { createWriteStream, promises as fs } from 'fs';
import { basename, join } from 'path';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Pkcs10CertificateRequest } from '@peculiar/x509';
import archiver from 'archiver';
import prompts from 'prompts';

import crypto from '../crypto';
import { fsExists, keyPairFromPrivate } from '../utils';
import Certificate from './Certificate';
import Config, { ConfigFile, period } from './Config';
import Crl from './Crl';
import Log from './Log';
import State, { CertificateIndexEntry } from './State';
import { ComputedExtension, ExtensionName } from './certificateExtensions';
import { EKU_HEALTH_CSCA } from './constants';
import {
  deriveSymmetricKey,
  makeKeyPair,
  readPrivateKey,
  readPublicKey,
  writePrivateKey,
  writePublicKey,
} from './keys';

const MASTER_KEY_DERIVATION_ROUNDS = 10_000;
const MASTER_KEY_DERIVATION_SALT = Buffer.from(
  '80cbc05e08253326ca714c66b2a290186072d4a4c996e90d21bde6fcc4c412cb',
  'hex',
);

export default class CA {
  private path: string;
  private masterKey: CryptoKey | undefined;

  constructor(path: string) {
    this.path = path;
  }

  private async askPassphrase(confirm = false): Promise<CryptoKey> {
    if (this.masterKey) return this.masterKey;

    const { value }: { value: string } = await prompts({
      type: 'password',
      name: 'value',
      message: `Enter CSCA passphrase${confirm ? ' (min 30 characters)' : ''}`,
      validate: (value: string) =>
        value.length < 30 ? 'Passphrase must be at least 30 characters long' : true,
    });

    if (confirm) {
      const { confirm }: { confirm: string } = await prompts({
        type: 'password',
        name: 'confirm',
        message: 'Confirm CSCA passphrase',
      });

      if (value !== confirm) {
        throw new Error('Passphrase mismatch');
      }
    }

    if (!value) throw new Error('Passphrase is required');

    this.masterKey = await deriveSymmetricKey(
      value,
      MASTER_KEY_DERIVATION_SALT,
      MASTER_KEY_DERIVATION_ROUNDS,
    );

    return this.masterKey;
  }

  private join(...paths: string[]): string {
    return join(this.path, ...paths);
  }

  public async exists(): Promise<boolean> {
    return fsExists(this.path);
  }

  public async create(config: ConfigFile, serial: Buffer): Promise<void> {
    const masterKey = await this.askPassphrase(true);

    for (const dir of ['.', 'certs']) {
      const path = this.join(dir);
      console.debug('mkdir', path);
      await fs.mkdir(path, { recursive: true });
    }

    console.debug('generate keypair');
    const keyPair = await makeKeyPair();

    console.debug('init config.json');
    await this.config(keyPair.privateKey, true).create(config);

    console.debug('init state.json');
    await this.state(keyPair.privateKey, true).create();

    console.debug('init log.ndjson');
    await this.log(keyPair.privateKey, true).create(config);

    console.debug('write private key');
    await writePrivateKey(this.join('ca.key'), keyPair.privateKey, masterKey);

    console.debug('write public key');
    await writePublicKey(this.join('ca.pub'), keyPair.publicKey);

    const root = await Certificate.createRoot(
      {
        subject: config.subject,
        serial,
        validityPeriod: config.validityPeriod,
        workingPeriod: config.workingPeriod,
        extensions: [
          {
            name: ExtensionName.AuthorityKeyIdentifier,
            critical: false,
            value: ComputedExtension,
          },
          {
            name: ExtensionName.SubjectKeyIdentifier,
            critical: false,
            value: ComputedExtension,
          },
          {
            name: ExtensionName.KeyUsage,
            critical: true,
            value: ['cRLSign', 'keyCertSign'],
          },
          {
            name: ExtensionName.PrivateKeyUsagePeriod,
            critical: false,
            value: ComputedExtension,
          },
          {
            name: ExtensionName.SubjectAltName,
            critical: false,
            value: [{ L: config.country.alpha3 }],
          },
          {
            name: ExtensionName.IssuerAltName,
            critical: false,
            value: [{ L: config.country.alpha3 }],
          },
          {
            name: ExtensionName.BasicConstraints,
            critical: true,
            value: [true, 0],
          },
          {
            name: ExtensionName.ExtendedKeyUsage,
            critical: true,
            value: [EKU_HEALTH_CSCA],
          },
          {
            name: ExtensionName.CrlDistributionPoints,
            critical: false,
            value: config.crl.distribution,
          },
        ],
      },
      keyPair,
    );

    console.debug('write root certificate');
    await root.write(this.join('ca.crt'));

    console.debug('add root to index');
    await this.state(keyPair.privateKey).indexNewCertificate(root);

    console.debug('add root to log');
    await this.log(keyPair.privateKey).issue(root);

    console.debug('generate first crl');
    await this.generateCrl();
  }

  private config(key: CryptoKey, newfile?: boolean): Config {
    return new Config(this.path, key, newfile);
  }

  private state(key: CryptoKey, newfile?: boolean): State {
    return new State(this.path, key, newfile);
  }

  private log(key: CryptoKey, newfile?: boolean): Log {
    return new Log(this.path, key, newfile);
  }

  private async root(): Promise<Certificate> {
    return Certificate.read(this.join('ca.crt'));
  }

  private async checkIntegrity(key: CryptoKey): Promise<void> {
    if (key.type === 'private') {
      const { publicKey } = await keyPairFromPrivate(key);
      const pkE = await crypto.subtle.exportKey('jwk', publicKey);

      const publicKeyFromFile = await readPublicKey(this.join('ca.pub'));
      const pkF = await crypto.subtle.exportKey('jwk', publicKeyFromFile);

      if (pkE.kty !== pkF.kty || pkE.crv !== pkF.crv || pkE.x !== pkF.x || pkE.y !== pkF.y) {
        throw new Error("Public key on disk doesn't match private key");
      }
    }

    await this.config(key).check();
    await this.state(key).check();
    await this.log(key).check();

    await this.root().then((cert) => cert.check(key));
    await this.crl().then((crl) => crl.check());

    // console.debug('check integrity: OK'); // re-enable when switching to configurable logging
  }

  /**
   * @internal Only for use within the CA code, prefer not to call externally (from commands).
   */
  public async publicKey(): Promise<CryptoKey> {
    return readPublicKey(this.join('ca.pub'));
  }

  private async privateKey(): Promise<CryptoKey> {
    if (!this.masterKey) {
      throw new Error('CA was not opened read-write');
    } else {
      return readPrivateKey(this.join('ca.key'), this.masterKey);
    }
  }

  public async openReadOnly(): Promise<void> {
    const key = await this.publicKey();
    await this.checkIntegrity(key);
  }

  public async openReadWrite(): Promise<void> {
    await this.askPassphrase();
    const key = await this.privateKey();
    await this.checkIntegrity(key);

    const root = await this.root();
    if (!root.asIndexEntry().isUsable) {
      throw new Error('CA is not usable: out of working period');
    }
  }

  public async crl(): Promise<Crl> {
    const key = await this.publicKey();
    const filename = await this.config(key).getCrlFilename();
    return new Crl(this.join(filename), key);
  }

  public async generateCrl(): Promise<Crl> {
    const key = await this.privateKey();
    const root = await this.root();
    const filename = await this.config(key).getCrlFilename();
    const state = this.state(key);

    console.debug('generate crl');
    const crl = await Crl.fromState(this.join(filename), key, root, state);

    console.debug('add to log');
    await this.log(key).generateCrl(crl);

    return crl;
  }

  public async uploadCrl(credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  }): Promise<void> {
    const key = await this.publicKey();
    const config = this.config(key);
    const { name: bucket, region } = await config.getCrlS3Bucket();
    const filename = await config.getCrlFilename();

    const client = new S3Client({
      region,
      credentials,
    });

    const crl = await this.crl();
    const body = await crl.asBuffer();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: body,
    });

    console.debug('upload crl', { bucket, filename });
    const response = await client.send(command);
    console.debug('upload crl: done', { etag: response.ETag, version: response.VersionId });
  }

  public async revokedCertificates(): Promise<CertificateIndexEntry[]> {
    const key = await this.publicKey();
    const state = this.state(key);
    return state.revokedCertificates();
  }

  public async issueFromRequest(request: Pkcs10CertificateRequest): Promise<Certificate> {
    const privateKey = await this.privateKey();
    const issuer = await this.root();

    const config = this.config(privateKey);
    const issuanceConfig = await config.getIssuance();
    const countryConfig = await config.getCountry();

    const state = this.state(privateKey);
    const serial = await state.nextIssuanceSerial();

    const now = new Date();

    console.debug('issue certificate');
    const validityPeriod = period(now, issuanceConfig.validityPeriodDays);
    const workingPeriod = period(now, issuanceConfig.workingPeriodDays);
    const cert = await Certificate.createFromRequest(
      {
        subject: {
          country: countryConfig.alpha2,
          commonName: 'TA',
        },
        serial,
        validityPeriod,
        workingPeriod,
        extensions: issuanceConfig.extensions,
      },
      request,
      issuer,
      privateKey,
    );

    console.debug(`mkdir certs/${cert.certId}`);
    await fs.mkdir(this.join('certs', cert.certId), { recursive: true });

    console.debug('write certificate');
    await cert.write(this.join('certs', cert.certId, 'certificate.crt'));

    console.debug('write request');
    await fs.writeFile(this.join('certs', cert.certId, 'request.csr'), request.toString('pem'));

    console.debug('add to index');
    await this.state(privateKey).indexNewCertificate(cert, {
      workingPeriodEnd: workingPeriod.end,
    });

    console.debug('add to log');
    await this.log(privateKey).issue(cert);

    return cert;
  }

  public async readIndex(serial: Buffer): Promise<CertificateIndexEntry> {
    const key = await this.publicKey();
    const state = this.state(key);
    const entry = await state.fromSerialNumber(serial);
    if (!entry) throw new Error(`No such serial: 0x${serial.toString('hex')}`);
    return entry;
  }

  public async revokeCertificate(serial: Buffer, date: Date): Promise<void> {
    const key = await this.privateKey();
    await this.state(key).indexRevocation(serial, date);
    await this.log(key).revoke(serial, date);
  }

  public async exportConfig(pretty = true): Promise<string> {
    const key = await this.publicKey();
    const config = await this.config(key).export();
    return JSON.stringify(config, null, pretty ? '\t' : undefined);
  }

  public async validateAndImportConfig(newConfig: object): Promise<void> {
    const key = await this.privateKey();
    const config = this.config(key);

    console.debug('write config');
    await config.validateAndImport(newConfig);

    console.debug('add to log');
    await this.log(key).reconfig(await config.export());
  }

  public async archive(): Promise<string> {
    const dir = basename(this.path);
    const target = `${dir}_${
      new Date().toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0]
    }.zip`;

    return new Promise((resolve, reject) => {
      const zip = createWriteStream(target);
      const arc = archiver('zip', {
        zlib: { level: 9 },
        comment: `${dir} Health CSCA - Managed by BES`,
      });

      arc.on('error', reject);
      arc.on('warning', (err) => {
        console.warn(err);
      });

      zip.on('error', reject);
      zip.on('close', () => {
        console.debug('saved state to archive', { target });
        resolve(target);
      });

      arc.directory(this.path, dir);
      arc.pipe(zip);
      arc.finalize();
    });
  }
}
