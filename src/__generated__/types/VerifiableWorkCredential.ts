/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface VerifiableWorkCredential {
  "@context": string[];
  type: string[];
  id: string;
  issuer: {
    id: string;
    ethereumAddress?: string;
    [k: string]: unknown;
  };
  credentialSubject: {
    id: string;
    [k: string]: unknown;
  };
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
  evidence?: Evidence[];
  credentialStatus?: {
    id: string;
    type: string;
  };
  updatedAt?: string;
}
export interface Evidence {
  id: string;
  type: string[];
  verifier?: string;
  evidenceDocument?: string;
  subjectPresence?: string;
  documentPresence?: string;
  item?: Transaction | DeliverableItem[] | Signatures;
  [k: string]: unknown;
}
export interface Transaction {
  /**
   * hash of the transaction
   */
  txHash: string;
  /**
   * payee address
   */
  to?: string;
  /**
   * payer address
   */
  from?: string;
  /**
   * whether or not DID is payer
   */
  isPayer?: boolean;
  /**
   * paid value
   */
  value?: string;
  /**
   * paid token symbol
   */
  tokenSymbol?: string;
  /**
   * paid token decimal
   */
  tokenDecimal?: number;
  /**
   * fiat price at the time of the transaction
   */
  fiatValue?: string;
  /**
   * currently only support USD
   */
  fiatSymbol?: string;
  /**
   * network id of the transaction
   */
  networkId?: number;
  /**
   * Time stamp of transaction occurrence
   */
  issuedTimestamp?: string;
  relatedAddresses?: string[];
  relatedTxHashes?: string[];
}
export interface DeliverableItem {
  /**
   * current formats are url or cid
   */
  format?: string;
  /**
   * work deliverable value(url/cid)
   */
  value?: string;
}
export interface Signatures {
  /**
   * signature of holder
   */
  holderSig?: string;
  /**
   * DID of agent
   */
  partnerSigner?: string;
  /**
   * signature of partner
   */
  partnerSig?: string;
  /**
   * DID of agent
   */
  agentSigner?: string;
  /**
   * signature of agent
   */
  agentSig?: string;
}