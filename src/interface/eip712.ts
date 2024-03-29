import { Certification, CertificationSubject } from '../__generated__';
import {
  WorkCredential,
  WorkSubject,
} from '../__generated__/types/WorkCredential';

type Extensible<T> = T & { [x: string]: any };
export type IssuerType = Extensible<{ id: string }>;
export type DateType = string | Date;

export interface EIP712Config {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface TypedData {
  name: string;
  type:
    | 'bool'
    | 'uint8'
    | 'uint16'
    | 'uint32'
    | 'uint64'
    | 'uint128'
    | 'uint256'
    | 'address'
    | 'string'
    | 'string[]'
    | 'bytes'
    | 'bytes32'
    | 'Issuer'
    | 'CredentialSubject'
    | 'CredentialSchema'
    | 'WorkCredentialSubject'
    | 'Subtask[]'
    | 'DeliverableItem[]'
    | 'Signatures'
    | 'Work'
    | 'Client'
    | 'TX'
    | 'Proof'
    | 'VerifiableMembershipSubject'
    | 'Eip712';
}

export const DOMAIN_TYPE: TypedData[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export interface EIP712DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface EIP712MessageTypes {
  EIP712Domain: TypedData[];
  [additionalProperties: string]: TypedData[];
}

export interface EIP712TypedData<T extends EIP712MessageTypes> {
  types: T;
  primaryType: keyof T;
  domain: EIP712DomainTypedData;
  message: any;
}

export interface CredentialSchema {
  id: string;
  _type: string;
}

export type EIP712CredentialPayload = {
  _context: string;
  _type: string;
  id: string;
  issuer: IssuerType;
  credentialSubject: Extensible<{
    id?: string;
  }>;
  credentialSchema?: CredentialSchema;
  issuanceDate: DateType;
  expirationDate?: DateType;
};

export type EIP712Credential = Extensible<EIP712CredentialPayload>;

export interface EIP712CredentialTypedData
  extends EIP712TypedData<EIP712CredentialMessageTypes> {
  message: EIP712Credential;
}

export interface EIP712WorkCredentialTypedData
  extends EIP712TypedData<EIP712WorkCredentialMessageTypes> {
  message: WorkCredential;
}

export interface EIP712WorkCredentialSubjectTypedData
  extends EIP712TypedData<EIP712WorkCredentialSubjectMessageTypes> {
  message: WorkSubject;
}

export interface EIP712WorkCredentialMessageTypes extends EIP712MessageTypes {
  WorkCredential: typeof WORK_CREDENTIAL_EIP712_TYPE;
  WorkCredentialSubject: typeof WORK_SUBJECT_EIP712_TYPE;
  DeliverableItem: typeof DELIVERABLES_EIP712_TYPE;
  TX: typeof TX_EIP712_TYPE;
  Client: typeof CLIENT_EIP712_TYPE;
}

export interface EIP712WorkCredentialSubjectMessageTypes
  extends EIP712MessageTypes {
  WorkCredentialSubject: typeof WORK_SUBJECT_EIP712_TYPE;
  Work: typeof WORK_EIP712_TYPE;
  DeliverableItem: typeof DELIVERABLES_EIP712_TYPE;
  TX: typeof TX_EIP712_TYPE;
  Client: typeof CLIENT_EIP712_TYPE;
}

export const WORK_CREDENTIAL_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'subject', type: 'WorkCredentialSubject' },
  { name: 'signature', type: 'Signatures' },
  { name: 'createdAt', type: 'string' },
  { name: 'updatedAt', type: 'string' },
];

export const SIGNATURES_EIP712_TYPE: TypedData[] = [
  { name: 'holderSig', type: 'string' },
  { name: 'partnerSigner', type: 'string' },
  { name: 'partnerSig', type: 'string' },
  { name: 'agentSigner', type: 'string' },
  { name: 'agentSig', type: 'string' },
];

export const WORK_SUBJECT_EIP712_TYPE: TypedData[] = [
  { name: 'work', type: 'Work' },
  { name: 'tx', type: 'TX' },
  { name: 'deliverables', type: 'DeliverableItem[]' },
  { name: 'client', type: 'Client' },
];

export const WORK_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'value', type: 'string' },
  { name: 'tax', type: 'string' },
  { name: 'summary', type: 'string' },
  { name: 'detail', type: 'string' },
  { name: 'jobType', type: 'string' },
  { name: 'genre', type: 'string' },
  { name: 'tags', type: 'string[]' },
  { name: 'startTimestamp', type: 'string' },
  { name: 'endTimestamp', type: 'string' },
  { name: 'platform', type: 'string' },
  { name: 'deliverableHash', type: 'string' },
  { name: 'organization', type: 'string' },
  { name: 'issuedAt', type: 'string' },
];

export const TX_EIP712_TYPE: TypedData[] = [
  { name: 'txHash', type: 'string' },
  { name: 'to', type: 'string' },
  { name: 'from', type: 'string' },
  { name: 'isPayer', type: 'bool' },
  { name: 'value', type: 'string' },
  { name: 'tokenSymbol', type: 'string' },
  { name: 'tokenDecimal', type: 'uint256' },
  { name: 'fiatValue', type: 'string' },
  { name: 'fiatSymbol', type: 'string' },
  { name: 'networkId', type: 'uint256' },
  { name: 'issuedTimestamp', type: 'string' },
  { name: 'relatedAddresses', type: 'string[]' },
  { name: 'relatedTxHashes', type: 'string[]' },
];

export const MEMBERSHIP_SUBJECT_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'organizationName', type: 'string' },
  { name: 'membershipName', type: 'string' },
  { name: 'organizationId', type: 'string' },
  { name: 'membershipId', type: 'string' },
];

export const EVENT_ATTENDANCE_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'eventName', type: 'string' },
  { name: 'eventIcon', type: 'string' },
  { name: 'eventId', type: 'string' },
];

export const CERTIFICATION_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'certificationId', type: 'string' },
  { name: 'certificationName', type: 'string' },
  { name: 'image', type: 'string' },
];

export const CLIENT_EIP712_TYPE: TypedData[] = [
  { name: 'format', type: 'string' },
  { name: 'value', type: 'string' },
];
export const DELIVERABLES_EIP712_TYPE: TypedData[] = [
  { name: 'format', type: 'string' },
  { name: 'value', type: 'string' },
];

export const ISSUER_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'ethereumAddress', type: 'string' },
];

export interface EIP712MembershipSubjectCredentialMessageTypes
  extends EIP712CredentialMessageTypes {
  VerifiableCredential: typeof VERIFIABLE_CREDENTIAL_EIP712_TYPE;
  Issuer: any;
  CredentialSubject: typeof MEMBERSHIP_SUBJECT_EIP712_TYPE;
  CredentialSchema: typeof CREDENTIAL_SCHEMA_EIP712_TYPE;
  Proof: typeof PROOF_EIP712_TYPE;
}
export interface EIP712CredentialMessageTypes extends EIP712MessageTypes {
  VerifiableCredential: typeof VERIFIABLE_CREDENTIAL_EIP712_TYPE;
  Issuer: any;
  CredentialSubject: any;
  CredentialSchema: typeof CREDENTIAL_SCHEMA_EIP712_TYPE;
  Proof: typeof PROOF_EIP712_TYPE;
}

export const CREDENTIAL_SCHEMA_EIP712_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: '_type', type: 'string' },
];

export const VERIFIABLE_CREDENTIAL_EIP712_TYPE: TypedData[] = [
  { name: '_context', type: 'string' },
  { name: '_type', type: 'string' },
  { name: 'id', type: 'string' },
  { name: 'issuer', type: 'Issuer' },
  { name: 'credentialSubject', type: 'CredentialSubject' },
  { name: 'credentialSchema', type: 'CredentialSchema' },
  { name: 'issuanceDate', type: 'string' },
  { name: 'expirationDate', type: 'string' },
];

export const PROOF_EIP712_TYPE: TypedData[] = [
  { name: 'verificationMethod', type: 'string' },
  { name: 'ethereumAddress', type: 'address' },
  { name: 'created', type: 'string' },
  { name: 'proofPurpose', type: 'string' },
  { name: '_type', type: 'string' },
];

export const PRIMARY_TYPE = 'WorkCredential';
export const PRIMARY_SUBJECT_TYPE = 'WorkCredentialSubject';

export const MEMBERSHIP_SUBJECT_PRIMARY_TYPE = 'WorkCredential';
export const MEMBERSHIP_SUBJECT_PRIMARY_SUBJECT_TYPE = 'WorkCredentialSubject';

export const VERIFIABLE_CREDENTIAL_PRIMARY_TYPE = 'VerifiableCredential';

export interface W3CCredentialMessageTypes extends EIP712MessageTypes {
  VerifiableCredential: typeof VERIFIABLE_CREDENTIAL_W3C_TYPE;
  Issuer: any;
  CredentialSubject: any;
  CredentialSchema: typeof CREDENTIAL_SCHEMA_W3C_TYPE;
  Proof: typeof PROOF_W3C_TYPE;
}
interface NarrowCredentialDefinitions {
  '@context': string[];
  type: string[];
  issuer: Exclude<IssuerType, string>;
  issuanceDate: string;
  expirationDate?: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
}

export type CredentialSubject = Extensible<{ id?: string }>;

interface FixedCredentialPayload {
  '@context': string | string[];
  id: string;
  type: string | string[];
  issuer: IssuerType;
  issuanceDate: DateType;
  expirationDate?: DateType;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  evidence?: any;
  termsOfUse?: any;
}

type Replace<T, U> = Omit<T, keyof U> & U;
export type W3CCredential = Extensible<
  Replace<FixedCredentialPayload, NarrowCredentialDefinitions>
>;

export interface W3CCredentialTypedData
  extends EIP712TypedData<W3CCredentialMessageTypes> {
  message: W3CCredential;
}

export const CREDENTIAL_SCHEMA_W3C_TYPE: TypedData[] = [
  { name: 'id', type: 'string' },
  { name: 'type', type: 'string' },
];

export const VERIFIABLE_CREDENTIAL_W3C_TYPE: TypedData[] = [
  { name: '@context', type: 'string[]' },
  { name: 'type', type: 'string[]' },
  { name: 'id', type: 'string' },
  { name: 'issuer', type: 'Issuer' },
  { name: 'credentialSubject', type: 'CredentialSubject' },
  { name: 'credentialSchema', type: 'CredentialSchema' },
  { name: 'issuanceDate', type: 'string' },
  { name: 'expirationDate', type: 'string' },
  //{ name: 'proof', type: 'Proof' },
];

export const PROOF_W3C_TYPE: TypedData[] = [
  { name: 'verificationMethod', type: 'string' },
  { name: 'created', type: 'string' },
  { name: 'proofPurpose', type: 'string' },
  { name: 'type', type: 'string' },
  { name: 'eip712', type: 'Eip712' },
];

export const EIP712_TYPE: TypedData[] = [
  { name: 'primaryType', type: 'string' },
  { name: 'types', type: 'string' },
];

export interface Proof {
  type?: string;
  [x: string]: any;
}

export type SignTypedData<T extends EIP712MessageTypes> = (
  data: EIP712TypedData<T>
) => Promise<string>;
export type SignTypedDataForNode = (data: string) => Promise<string>;
export type VerifyTypedData<T extends EIP712MessageTypes> = (
  data: EIP712TypedData<T>,
  proofValue: string
) => Promise<string>;

export type Verifiable<T> = Readonly<T> & { readonly proof: Proof };

export type EIP712VerifiableCredential = Verifiable<EIP712Credential>;

export type VerifiableCredential = Verifiable<W3CCredential>;

export type VerifiableMembershipSubjectCredential = VerifiableCredential & {
  credentialSubject: VerifiableMembershipSubject;
};
export type EventAttendanceVerifiableCredential = VerifiableCredential & {
  credentialSubject: EventAttendance;
};

export type CertificationVerifiableCredential = VerifiableCredential & {
  credentialSubject: CertificationSubject;
};

export type CertVCWithParent = CertificationVerifiableCredential & {
  certification: Certification;
};

export interface EIP712CredentialMessageTypes extends EIP712MessageTypes {
  VerifiableCredential: typeof VERIFIABLE_CREDENTIAL_EIP712_TYPE;
  Issuer: any;
  CredentialSubject: any;
  CredentialSchema: typeof CREDENTIAL_SCHEMA_EIP712_TYPE;
  Proof: typeof PROOF_EIP712_TYPE;
}

export interface EIP712CredentialTypedData
  extends EIP712TypedData<EIP712CredentialMessageTypes> {
  message: EIP712Credential;
}

export interface EIP712MembershipSubjectCredentialTypedData
  extends EIP712TypedData<EIP712MembershipSubjectCredentialMessageTypes> {
  message: EIP712Credential;
}

export interface EventAttendance {
  id: string;
  eventName: string;
  eventIcon?: string;
  eventId: string;
  [k: string]: unknown;
}
export interface VerifiableMembershipSubject {
  id: string;
  organizationName: string;
  organizationIcon?: string;
  membershipName: string;
  membershipIcon?: string;
  organizationId?: string;
  membershipId?: string;
  startDate?: string;
  endDate?: string;
  [k: string]: unknown;
}
