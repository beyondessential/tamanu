import { createTestContext } from 'sync-server/__tests__/utilities';
import { fakeABtoRealAB, newKeypairAndCsr } from 'sync-server/app/utils/vdsCrypto';
import { Crypto } from 'node-webcrypto-ossl';
import { BitString, fromBER, Integer, Null, ObjectIdentifier, OctetString, Sequence, Utf8String } from 'asn1js';
import { setEngine, CryptoEngine, Certificate, CertificationRequest, AttributeTypeAndValue } from 'pkijs';
import { X502_OIDS } from 'shared/constants';
import { expect } from 'chai';
import crypto from 'crypto';

const webcrypto = new Crypto;
setEngine('webcrypto', webcrypto, new CryptoEngine({ name: 'webcrypto', crypto: webcrypto, subtle: webcrypto.subtle }));

// essential tool: https://lapo.it/asn1js/
describe('VDS-NC: Signer cryptography', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(() => ctx.close());

  it('creates a well-formed keypair', async () => {
    const {
      countryCode,
      publicKey,
      privateKey,
    } = await newKeypairAndCsr({
      keySecret: 'secret',
      countryCode: 'UT',
      commonName: 'Test Signer',
    });

    expect(countryCode).to.equal('UT');

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
      passphrase: Buffer.from('secret', 'base64'),
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
    const realasn = fromBER(fakeABtoRealAB(realKey.export({ type: 'pkcs8', format: 'der' }).buffer));
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
});
