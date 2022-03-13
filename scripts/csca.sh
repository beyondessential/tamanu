#!/usr/bin/env bash

set -euo pipefail

# Working time (PKUP) of issued signer certificates.
# MUST be 92 to 96 days for VDS (3 months, with a bit of margin if needed),
# OR 365 for EUDCC (exactly one year).
sign_pkup=96
#sign_pkup=365

# Validity (including PKUP) of issued signer certificates.
# This is document (signature) validity of 10 years = 365 days * 10 plus 2 leap days.
# Plus the PKUP time. Up to a maximum of 11 years as the CSCA is configured, see below:
((sign_valid=sign_pkup+365*10+2))

# Working time (PKUP) of CSCA.
# Recommendation is between 3 and 5 years. We use 4 years (365 * 4 plus 1 leap day),
# such that we set the validity to a nice round 15 years and
# it gives us a maximum BSC validity of 11 years.
((csca_pkup=365*4+1))

# Validity (including PKUP) of CSCA.
# Simply PKUP + 11 years (365 * 11 + 3 leap days).
((csca_valid=csca_pkup+11*365+3))


# === Date calculations, not editable variables: ===

# it's not possible to manually set the cert expiry dates with openssl,
# so we set the pkup to begin at midnight, which will always be less or
# equal to the notBefore of the cert validity.
now="$(date --date=00:00 +%s)"

((csca_later=now+csca_pkup*24*60*60))
csca_pkup_before="$(date --date "@$now" '+%Y%m%d%H%M%SZ')"
csca_pkup_after="$(date --date "@$csca_later" '+%Y%m%d%H%M%SZ')"

((sign_later=now+sign_pkup*24*60*60))
sign_pkup_before="$(date --date "@$now" '+%Y%m%d%H%M%SZ')"
sign_pkup_after="$(date --date "@$sign_later" '+%Y%m%d%H%M%SZ')"

# =/= End date calculations =/=


good () {
  echo -e "\e[0;32m$(date '+[%Y-%m-%d %T]') \e[1;32m$*\e[0m" >&2
}

info () {
  echo -e "\e[0;34m$(date '+[%Y-%m-%d %T]') $*\e[0m" >&2
}

ohno () {
  echo -e "\e[0;31m$(date '+[%Y-%m-%d %T]') \e[1;31m$*\e[0m" >&2
}

if [[ "${BASH_VERSION%%.*}" -lt 4 ]]; then
  ohno "Bash version 4.0 or higher is required. You have ${BASH_VERSION}."
  exit 64
fi

if [[ "$(openssl version | cut -d\  -f2)" != 1.1.* && "$(openssl version | cut -d\  -f2)" != 3.* ]]; then
  ohno "OpenSSL 1.1.x or ^3.0.0 is required"
  exit 64
fi

prompt() {
  query="$1"
  shift

  echo -e -n "\e[1;33m$(date '+[%Y-%m-%d %T]') \e[0m" >&2
  read -r -p "$query" $* out
  echo >&2
  echo -n "$out"
}

keypair() {
  keydst="$1"
  pubdst="$2"
  passphrase="${3:-}"

  genopt=""
  pubopt=""
  if [[ ! -z "${passphrase}" ]]; then
    genopt="-aes-256-cbc -pass stdin"
    pubopt="-passin stdin"
  fi

  info "generate EC256 private key"
  openssl genpkey \
    -outform PEM \
    -out "$keydst" \
    -algorithm EC \
    -pkeyopt "ec_paramgen_curve:P-256" \
    -pkeyopt "ec_param_enc:named_curve" \
    $genopt <<< "$passphrase"

  info "output public key"
  openssl pkey \
    -inform PEM \
    -outform PEM \
    -in "$keydst" \
    -out "$pubdst" \
    -pubout \
    $pubopt <<< "$passphrase"

  # key info
  openssl pkey \
    -inform PEM \
    -in "$keydst" \
    -text_pub -noout \
    $pubopt <<< "$passphrase"
}

openssl_config() {
cat <<CONFIG
[ req ]
distinguished_name = req_distinguished_name
attributes = req_attributes
x509_extensions = csca_ext

[ req_distinguished_name ]
countryName = Country Code (ISO 3166-1 alpha-2)
countryName_min = 2
countryName_max = 2
commonName = Descriptive name of the certificate
organizationName = Country Full Name
organizationUnitName = Department or Ministry

[ req_attributes ]

[ csca_ext ]
basicConstraints=critical,CA:true,pathlen:0
subjectAltName=dirName:csca_dir_sect
issuerAltName=dirName:csca_dir_sect
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid,issuer
keyUsage=critical,cRLSign,keyCertSign
extendedKeyUsage=2.23.136.1.1.14.1
crlDistributionPoints=URI:${3:-}
2.5.29.16=ASN1:SEQUENCE:csca_pkup

[ csca_dir_sect ]
L=${2:-}

[ csca_pkup ]
notBefore=IMPLICIT:0,GENTIME:${csca_pkup_before}
notAfter=IMPLICIT:1,GENTIME:${csca_pkup_after}

[ ca ]
default_ca      = CA_default

[ CA_default ]
dir             = ${1:?Missing csca folder (internal error)}
certs           = \$dir/certs
crl_dir         = \$dir/crl
database        = \$dir/index.txt
unique_subject = no

new_certs_dir   = \$dir/newcerts

certificate     = \$dir/csca.crt
serial          = \$dir/serial
crlnumber       = \$dir/crlnumber

crl             = \$dir/crl.pem
private_key     = \$dir/private/csca.key

x509_extensions = bsc_exts

name_opt        = ca_default
cert_opt        = ca_default

default_days = 96
default_crl_days = 90
default_md = default
policy = ca_policy

[ ca_policy ]
countryName = match
commonName = supplied

[ bsc_exts ]
authorityKeyIdentifier=critical,keyid,issuer
extendedKeyUsage=2.23.136.1.1.14.2
2.23.136.1.1.6.2=ASN1:SEQUENCE:bsc_seq

[ bsc_seq ]
version=INT:0
doctypes=SET:bsc_doctypes

[ bsc_doctypes ]
pot=PRINTABLESTRING:NT
pov=PRINTABLESTRING:NV
CONFIG
}

csca_certificate() {
  cscafolder="$1"
  passphrase="$2"
  pkupyrs="$3"
  crlurl="$4"
  alpha2="$5"
  alpha3="$6"
  fullname="$7"
  orgname="$8"
  orgunit="$9"

  keyfile="$cscafolder/private/csca.key"
  crtdst="$cscafolder/csca.crt"

  subject="/C=$alpha2/CN=$fullname"
  if [[ ! -z "$orgname" ]]; then
    subject="$subject/O=$orgname"
  fi
  if [[ ! -z "$orgunit" ]]; then
    subject="$subject/OU=$orgunit"
  fi

  info "generate CSCA certificate"
  openssl req \
    -keyform PEM \
    -outform PEM \
    -key "$keyfile" \
    -out "$crtdst" \
    -config <(openssl_config "$cscafolder" "$alpha3" "$crlurl") \
    -new \
    -x509 \
    -sha256 \
    -subj "$subject" \
    -days "$validity" \
    -passin stdin <<< "$passphrase"

  # cert info
  openssl x509 \
    -inform PEM \
    -in "$crtdst" \
    -text -noout
}

csca_structure() {
  folder="$1"

  info "create required folders"
  mkdir -p "$folder/"{certs,crl,newcerts,private}

  info "initialise serial"
  echo "00000000000000000000000000000001" > "$folder/serial"

  info "initialise CRL"
  echo "00000000000000000000000000000001" > "$folder/crlnumber"

  info "initialise index.txt"
  touch "$folder/index.txt"
}

csr_print() {
  csrfile="$1"

  info "CSR info"
  openssl req \
    -inform PEM \
    -in "$csrfile" \
    -noout -text
}

csr_sign() {
  cscafolder="$1"
  passphrase="$2"
  csrfile="$3"
  crtfile="$4"

  info "sign CSR"
  openssl ca \
    -config <(openssl_config "$cscafolder") \
    -in "$csrfile" \
    -out "$crtfile" \
    -days "$sign_valid" \
    -cert "$cscafolder/csca.crt" \
    -keyfile "$cscafolder/private/csca.key" \
    -keyform PEM \
    -md "sha256" \
    -batch -notext \
    -passin stdin <<< "$passphrase"

  info "certificate signed: $crtfile"
  openssl x509 \
    -inform PEM \
    -in "$crtfile" \
    -text -noout
}

rezip() {
  folder="$1"

  info "Zipping CSCA state folder"
  zipname="${folder}_$(date +%Y-%m-%d_%H-%M-%S).zip"
  zip -r "$zipname" "$folder"

  good "Please upload to LastPass: $zipname"
}

case "${1:-help}" in
  csca)
    folder="${2:?Missing csca\/folder path}"
    crlurl="${3:?Missing CRL URL}"
    alpha2="${4:?Missing alpha2 country code}"
    alpha3="${5:?Missing alpha3 country code}"
    fullname="${6:?Missing full name (CN)}"
    orgname="${7:-}"
    orgunit="${8:-}"

    if [[ -d "$folder" ]]; then
      ohno "Folder $folder already exists"
      exit 2
    fi

    if [[ "$crlurl" != https://* ]]; then
      ohno "CRL URL must be HTTPS"
      exit 2
    fi

    passphrase="$(prompt "Enter new passphrase (30 chars minimum): " -s)"
    confirm="$(prompt "Confirm new passphrase: " -s)"
    if [[ -z "$passphrase" ]]; then
      ohno "Non-empty passphrase is required"
      exit 3
    fi

    if [[ "${#passphrase}" -lt 30 ]]; then
      ohno "Passphrase should be 30 characters or more"
      exit 3
    fi

    if [[ "$passphrase" != "$confirm" ]]; then
      ohno "Passphrases do not match"
      exit 3
    fi

    csca_structure "$folder"
    keypair "$folder/private/csca.key" "$folder/csca.pub" "$passphrase"
    csca_certificate "$folder" "$passphrase" \
      "$crlurl" "$alpha2" "$alpha3" "$fullname" "$orgname" "$orgunit"

    rezip "$folder"

    good "Done."
    ;;
  sign)
    cscafolder="${2:?Missing csca\/folder path}"
    csrfile="${3:?Missing CSR file}"
    crtfile="${4:-${csrfile%.*}.crt}"

    if [[ -f "$crtfile" ]]; then
      ohno "Output file $crtfile already exists, not clobbering"
      exit 2
    fi

    csr_print "$csrfile"
    confirm=$(prompt "Issue certificate? [y/N] " -n 1)
    if [[ "$confirm" != y* && "$confirm" != Y* ]]; then
      exit 0
    fi

    passphrase="$(prompt "Enter CSCA private key passphrase: " -s)"
    if [[ -z "$passphrase" ]]; then
      ohno "Passphrase is required"
      exit 3
    fi

    csr_sign "$cscafolder" "$passphrase" \
      "$csrfile" "$crtfile"

    rezip "$cscafolder"

    good "Done."
    ;;
  *)
    info "Usage: $0 COMMAND [ARGUMENTS]"
    info
    info "\e[1mcsca <folder> <crl url> <alpha2> <alpha3> <fullname> [country] [dept-org]"
    info "       where:"
    info "       folder   = where to store new CSCA files"
    info "       crl url  = full URL to CRL (e.g. http://crl.tamanu.io/CountrynameHealthCSCA.crl)"
    info "       alpha2   = 2-letter country code"
    info "       alpha3   = 3-letter country code"
    info "       fullname = full name of CSCA cert e.g. 'Tamanu Government Health CSCA'"
    info "       country  = full country name e.g. 'Kingdom of Tamanu' (optional)"
    info "       dept-org = responsible dept/org e.g. 'Ministry of Health' (optional)"
    info
    info "The CSCA validity will be set to 15 years, and its PKUP to 4 years."
    info "The CSCA will be marked as a Health CSCA as per VDS-NC EKU."
    info
    info "\e[1msign <csca folder> <csr>"
    info "       where:"
    info "       csca folder = path to CSCA folder"
    info "       csr         = path to signing request from Tamanu"
    info
    info "The certificate validity will be set to 10 years, plus its PKUP of $sign_pkup days."
    info "To make EU DCC certificates, change the sign_pkup var at the top of this script to 365."
    info
    exit 1
    ;;
esac
