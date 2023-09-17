import { AsnArray, AsnProp, AsnPropTypes, AsnType, AsnTypeTypes } from '@peculiar/asn1-schema';

/**
 * ```
 * -- Document Type as contained in MRZ, e.g. “P” or “ID” where a
 * -- single letter denotes all document types starting with that letter
 * DocumentType ::= PrintableString(SIZE(1..2))
 * ```
 */
export type DocumentType = AsnPropTypes.PrintableString;

/**
 * ```
 * docTypeList ::= SET OF DocumentType
 * ```
 */
@AsnType({ type: AsnTypeTypes.Set, itemType: AsnPropTypes.PrintableString })
export class DocTypeList extends AsnArray<DocumentType> {
  constructor(items?: DocumentType[]) {
    super(items);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DocTypeList.prototype);
  }
}

/**
 * ```
 * DocumentTypeList ::= SEQUENCE {
 *     version DocumentTypeListVersion,
 *     docTypeList SET OF DocumentType }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class DocumentTypeList {
  @AsnProp({ type: AsnPropTypes.Integer, defaultValue: 0 })
  public version = 0;

  @AsnProp({ type: DocTypeList })
  public docTypeList = new DocTypeList();
}
