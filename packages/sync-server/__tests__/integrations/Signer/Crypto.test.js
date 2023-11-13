/* eslint-disable no-unused-expressions */

import { createTestContext } from 'sync-server/__tests__/utilities';
import { fakeABtoRealAB, newKeypairAndCsr } from 'sync-server/app/integrations/Signer';
import { Crypto } from '@peculiar/webcrypto';
import {
  BitString,
  fromBER,
  Integer,
  Null,
  ObjectIdentifier,
  OctetString,
  Sequence,
  Set as Asn1Set,
} from 'asn1js';
import { setEngine, CryptoEngine } from 'pkijs';
import { X502_OIDS } from '@tamanu/constants';
import { depem } from '@tamanu/shared/utils';
import { expect } from 'chai';
import crypto from 'crypto';
import config from 'config';

const webcrypto = new Crypto();
setEngine(
  'webcrypto',
  webcrypto,
  new CryptoEngine({ name: 'webcrypto', crypto: webcrypto, subtle: webcrypto.subtle }),
);

// essential tool: https://lapo.it/asn1js/
describe('VDS-NC: Signer cryptography', () => {
  let ctx;
  let settings;
  beforeAll(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
  });
  afterAll(() => ctx.close());

  it('creates a well-formed keypair', async () => {
    const { publicKey, privateKey } = await newKeypairAndCsr({ settings });

    // publicKey: Walk through the expected ASN.1 structure
    //
    // SEQUENCE
    //   SEQUENCE
    //     OBJECT IDENTIFIER (key type)
    //     OBJECT IDENTIFIER (curve name)
    //   BIT STRING (public key)
    //
    const pubasn = fromBER(publicKey);
    expect(pubasn.result.error).to.be.empty;
    expect(pubasn.result).to.be.instanceOf(Sequence);
    expect(pubasn.result.valueBlock.value).to.have.lengthOf(2);
    const [pubtype, pubstring] = pubasn.result.valueBlock.value;
    expect(pubtype).to.be.instanceOf(Sequence);
    expect(pubstring).to.be.instanceOf(BitString);
    expect(pubtype.valueBlock.value).to.have.lengthOf(2);
    const [pubname, pubcurve] = pubtype.valueBlock.value;
    expect(pubname).to.be.instanceOf(ObjectIdentifier);
    expect(pubcurve).to.be.instanceOf(ObjectIdentifier);

    // publicKey: Check that it's the right type
    expect(pubname.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.2.1'); // ecPublicKey
    expect(pubcurve.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.3.1.7'); // prime256v1

    // privateKey: Walk through the expected ASN.1 structure
    //
    // SEQUENCE
    //   SEQUENCE
    //     OBJECT IDENTIFIER (envelope type)
    //     SEQUENCE
    //       SEQUENCE
    //         OBJECT IDENTIFIER (kdf type)
    //         SEQUENCE
    //           OCTET STRING (salt)
    //           INTEGER (rounds)
    //           SEQUENCE
    //             OBJECT IDENTIFIER (hash algorithm)
    //             NULL (hash params)
    //       SEQUENCE
    //           OBJECT IDENTIFIER (encryption algorithm)
    //           OCTET STRING (encryption IV)
    //   OCTET STRING (encrypted private key)
    //
    const privasn = fromBER(privateKey);
    expect(privasn.result.error).to.be.empty;
    expect(privasn.result).to.be.instanceOf(Sequence);
    expect(privasn.result.valueBlock.value).to.have.lengthOf(2);
    const [privhdr, privkey] = privasn.result.valueBlock.value;
    expect(privhdr).to.be.instanceOf(Sequence);
    expect(privkey).to.be.instanceOf(OctetString);
    expect(privhdr.valueBlock.value).to.have.lengthOf(2);
    const [privobj, privdet] = privhdr.valueBlock.value;
    expect(privobj).to.be.instanceOf(ObjectIdentifier);
    expect(privdet).to.be.instanceOf(Sequence);
    expect(privdet.valueBlock.value).to.have.lengthOf(2);
    const [privhash, privencr] = privdet.valueBlock.value;
    expect(privhash).to.be.instanceOf(Sequence);
    expect(privencr).to.be.instanceOf(Sequence);
    expect(privhash.valueBlock.value).to.have.lengthOf(2);
    expect(privencr.valueBlock.value).to.have.lengthOf(2);
    const [privkdf, privini] = privhash.valueBlock.value;
    expect(privkdf).to.be.instanceOf(ObjectIdentifier);
    expect(privini).to.be.instanceOf(Sequence);
    expect(privini.valueBlock.value).to.have.lengthOf(3);
    const [privkdfsalt, privkdfitr, privkdfalgseq] = privini.valueBlock.value;
    expect(privkdfsalt).to.be.instanceOf(OctetString);
    expect(privkdfitr).to.be.instanceOf(Integer);
    expect(privkdfalgseq).to.be.instanceOf(Sequence);
    expect(privkdfalgseq.valueBlock.value).to.have.lengthOf(2);
    const [privkdfalg, privkdfalgparams] = privkdfalgseq.valueBlock.value;
    expect(privkdfalg).to.be.instanceOf(ObjectIdentifier);
    expect(privkdfalgparams).to.be.instanceOf(Null);
    const [privencralgo, privencriv] = privencr.valueBlock.value;
    expect(privencralgo).to.be.instanceOf(ObjectIdentifier);
    expect(privencriv).to.be.instanceOf(OctetString);

    // privateKey: Check envelope values
    expect(privobj.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.113549.1.5.13'); // PKCS#5 Envelope v2.0
    expect(privkdf.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.113549.1.5.12'); // PBKDF2
    expect(privkdfalg.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.113549.2.9'); // hmacWithSHA256
    expect(privencralgo.toString()).to.equal('OBJECT IDENTIFIER : 2.16.840.1.101.3.4.1.42'); // aes256-CBC
    expect(privencriv.valueBlock.blockLength).to.equal(16); // 16 bytes IV

    // Decrypt the private key
    const realKey = crypto.createPrivateKey({
      key: Buffer.from(privateKey),
      format: 'der',
      type: 'pkcs8',
      passphrase: Buffer.from(config.integrations.signer.keySecret, 'base64'),
    });

    // realKey: Walk through the expected ASN.1 structure
    //
    // SEQUENCE
    //   INTEGER (version)
    //   SEQUENCE
    //     OBJECT IDENTIFIER (key type)
    //     OBJECT IDENTIFIER (curve name)
    //   OCTET STRING
    //
    const realasn = fromBER(
      fakeABtoRealAB(realKey.export({ type: 'pkcs8', format: 'der' }).buffer),
    );
    expect(realasn.result.error).to.be.empty;
    expect(realasn.result).to.be.instanceOf(Sequence);
    expect(realasn.result.valueBlock.value).to.have.lengthOf(3);
    const [realver, realtype, realstring] = realasn.result.valueBlock.value;
    expect(realver).to.be.instanceOf(Integer);
    expect(realtype).to.be.instanceOf(Sequence);
    expect(realstring).to.be.instanceOf(OctetString);
    expect(realtype.valueBlock.value).to.have.lengthOf(2);
    const [realname, realcurve] = realtype.valueBlock.value;
    expect(realname).to.be.instanceOf(ObjectIdentifier);
    expect(realcurve).to.be.instanceOf(ObjectIdentifier);

    // realKey: Check that it's the right type
    expect(realver.toString()).to.equal('INTEGER : 0');
    expect(realname.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.2.1'); // ecKey
    expect(realcurve.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.3.1.7'); // prime256v1
  });

  it('creates a well-formed CSR', async () => {
    const { publicKey, request } = await newKeypairAndCsr({ settings });

    // Check the PEM has the borders
    expect(request)
      .to.be.a('string')
      .and.satisfy(pem => !!depem(pem, 'CERTIFICATE REQUEST'));

    // Walk through the expected ASN.1 structure
    //
    // SEQUENCE
    //   SEQUENCE (body)
    //     INTEGER (version)
    //     SEQUENCE (subject)
    //       SET
    //         SEQUENCE
    //           OBJECT IDENTIFIER (countryName)
    //           PrintableString (field value, 2 chars, country alpha2)
    //         SEQUENCE
    //           OBJECT IDENTIFIER (commonName)
    //           PrintableString (field value, 2 chars, signer identifier)
    //     SEQUENCE (public key info)
    //       SEQUENCE
    //         OBJECT IDENTIFIER (public key type)
    //         OBJECT IDENTIFIER (public key curve)
    //       BIT STRING (public key)
    //     [0] ATTRIBUTES (empty)
    //   SEQUENCE
    //     OBJECT IDENTIFIER (signature algorithm)
    //   BIT STRING (signature)
    //
    const reqasn = fromBER(fakeABtoRealAB(depem(request, 'CERTIFICATE REQUEST')));
    expect(reqasn.result.error).to.be.empty;
    expect(reqasn.result).to.be.instanceOf(Sequence);
    expect(reqasn.result.valueBlock.value).to.have.lengthOf(3);
    const [reqbody, reqsignalg, reqsigndat] = reqasn.result.valueBlock.value;
    expect(reqbody).to.be.instanceOf(Sequence);
    expect(reqsignalg).to.be.instanceOf(Sequence);
    expect(reqsigndat).to.be.instanceOf(BitString);
    expect(reqbody.valueBlock.value).to.have.lengthOf(4);
    expect(reqsignalg.valueBlock.value).to.have.lengthOf(1);
    const [reqver, reqsubj, reqkey] = reqbody.valueBlock.value;
    expect(reqver).to.be.instanceOf(Integer);
    expect(reqsubj).to.be.instanceOf(Sequence);
    expect(reqkey).to.be.instanceOf(Sequence);
    expect(reqsubj.valueBlock.value).to.have.lengthOf(1);
    expect(reqkey.valueBlock.value).to.have.lengthOf(2);
    const [reqsubjset] = reqsubj.valueBlock.value;
    expect(reqsubjset).to.be.instanceOf(Asn1Set);
    const [reqkeytype, reqkeydat] = reqkey.valueBlock.value;
    expect(reqkeytype).to.be.instanceOf(Sequence);
    expect(reqkeydat).to.be.instanceOf(BitString);
    expect(reqkeytype.valueBlock.value).to.have.lengthOf(2);
    const [reqkeyname, reqkeycurve] = reqkeytype.valueBlock.value;
    expect(reqkeyname).to.be.instanceOf(ObjectIdentifier);
    expect(reqkeycurve).to.be.instanceOf(ObjectIdentifier);
    const [reqsignalgoid] = reqsignalg.valueBlock.value;
    expect(reqsignalgoid).to.be.instanceOf(ObjectIdentifier);

    // Check types
    expect(reqver.toString()).to.equal('INTEGER : 0');
    expect(reqkeyname.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.2.1'); // ecKey
    expect(reqkeycurve.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.3.1.7'); // prime256v1
    expect(reqsignalgoid.toString()).to.equal('OBJECT IDENTIFIER : 1.2.840.10045.4.3.2'); // ecdsaWithSHA256

    // Check that the embedded public key is the same as the one generated
    const pubasn = fromBER(publicKey);
    expect([...new Uint8Array(reqkeydat.valueBlock.valueHex)]).to.deep.equal([
      ...new Uint8Array(pubasn.result.valueBlock.value[1].valueBlock.valueHex),
    ]);

    // Check that the subject's C is correct
    const subjc = reqsubjset.valueBlock.value.find(
      seq => seq.valueBlock.value[0].toString() === `OBJECT IDENTIFIER : ${X502_OIDS.COUNTRY_NAME}`,
    );
    expect(subjc).to.exist;
    expect(subjc).to.be.instanceOf(Sequence);
    expect(subjc.valueBlock.value[1].toString()).to.equal('PrintableString : UT');

    // Check that the subject's CN is correct
    const subjcn = reqsubjset.valueBlock.value.find(
      seq => seq.valueBlock.value[0].toString() === `OBJECT IDENTIFIER : ${X502_OIDS.COMMON_NAME}`,
    );
    expect(subjcn).to.exist;
    expect(subjcn).to.be.instanceOf(Sequence);
    expect(subjcn.valueBlock.value[1].toString()).to.equal('PrintableString : TA');
  });

  it('saves a new signer in the db correctly', async () => {
    // Arrange
    const { Signer } = ctx.store.models;

    const { publicKey, privateKey, request } = await newKeypairAndCsr({ settings });

    // Act
    const newSigner = await Signer.create({
      publicKey: Buffer.from(publicKey),
      privateKey: Buffer.from(privateKey),
      request,
      countryCode: 'UTO',
    });

    // Assert
    const signer = await Signer.findByPk(newSigner.id);
    expect(signer).to.exist;
    expect(signer.publicKey).to.deep.equal(Buffer.from(publicKey));
    expect(signer.privateKey).to.deep.equal(Buffer.from(privateKey));

    // Check we can decrypt the key
    crypto.createPrivateKey({
      key: signer.privateKey,
      format: 'der',
      type: 'pkcs8',
      cipher: 'aes-256-cbc',
      passphrase: Buffer.from(config.integrations.signer.keySecret, 'base64'),
    });
  });
});
