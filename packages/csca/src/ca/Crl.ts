// import { CertificateList, TBSCertList, AlgorithmIdentifier } from '@peculiar/asn1-x509';

export default class Crl {
  private file: string;

  constructor(file: string) {
    this.file = file;

    /*
    tbs cert list
      version = 1 (v2)
      signature = algo id
      issuer = issuer name
      this update = now
      next update = now + 90 days
      revoked certs = []
        (only present if not empty)
        user cert = cert serial number
        revocation date = date of revocation
        entry extensions = none
      extensions = []
        aki (nc)
        auth cert serial (nc)
        crl number (nc) minimal padding, 160-bit max
    fill in algo id
    sign file:///home/code/js/asn1-schema/packages/x509/docs/classes/CertificateList.html
    */
  }
}
