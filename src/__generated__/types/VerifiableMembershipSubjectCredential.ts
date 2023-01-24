/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface VerifiableMembershipSubjectCredential {
  '@context': string[];
  type: string[];
  id: string;
  issuer: {
    id: string;
    ethereumAddress?: string;
    [k: string]: unknown;
  };
  credentialSubject: VerifiableMembershipSubject;
  credentialSchema: {
    id: string;
    type: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  proof?: {
    type: string;
    verificationMethod?: string;
    ethereumAddress?: string;
    created?: string;
    proofPurpose?: string;
    proofValue?: string;
    eip712?: {
      domain: {
        chainId: number;
        name: string;
        version: string;
        verifyingContract?: string;
      };
      types: {
        [k: string]: unknown;
      };
      primaryType: string;
    };
    [k: string]: unknown;
  };
  evidence?: BasicEvidence[];
  credentialStatus?: {
    id: string;
    type: string;
  };
  updatedAt?: string;
}
export interface VerifiableMembershipSubject {
  id: string;
  organizationName: string;
  organizationIcon?: string;
  membershipName: string;
  membershipIcon?: string;
  organizationId?: string;
  membershipId?: string;
  [k: string]: unknown;
}
export interface BasicEvidence {
  id: string;
  type: string[];
  verifier?: string;
  evidenceDocument?: string;
  subjectPresence?: string;
  documentPresence?: string;
  item?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
