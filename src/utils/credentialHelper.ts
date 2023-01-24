import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import { utils } from 'ethers';
import {
  DEFAULT_CONTEXT,
  DEFAULT_VC_TYPE,
  EIP712_CONTEXT,
  VerifiableCredentialSchemaType,
} from '../constants/verifiableCredentials.js';
import {
  CredentialSubject,
  CREDENTIAL_SCHEMA_W3C_TYPE,
  DOMAIN_TYPE,
  EIP712DomainTypedData,
  EIP712MessageTypes,
  EIP712TypedData,
  ISSUER_EIP712_TYPE,
  Proof,
  SignTypedData,
  VerifiableCredential,
  VERIFIABLE_CREDENTIAL_PRIMARY_TYPE,
  VERIFIABLE_CREDENTIAL_W3C_TYPE,
  VerifyTypedData,
  W3CCredential,
  W3CCredentialTypedData,
} from '../interface/eip712.js';
import { getPkhDIDFromAddress } from './ceramicHelper.js';

export const createVerifiableCredential = async <
  T extends VerifiableCredential
>(
  address: string,
  id: string,
  vcType: VerifiableCredentialSchemaType,
  subject: CredentialSubject,
  signTypedData: SignTypedData<EIP712MessageTypes>,
  customContext?: string[],
  expiration?: string
): Promise<T> => {
  let issuanceDate = Date.now();
  let expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 100);

  const issuerDID = getPkhDIDFromAddress(address);
  const baseContexts = [DEFAULT_CONTEXT, EIP712_CONTEXT];

  let credential: W3CCredential = {
    '@context': customContext
      ? baseContexts.concat(customContext)
      : baseContexts,
    type: [DEFAULT_VC_TYPE, vcType.vcType],
    id: id,
    issuer: {
      id: issuerDID,
      ethereumAddress: address,
    },
    credentialSubject: subject,
    credentialSchema: {
      id: vcType.schema,
      type: 'Eip712SchemaValidator2021',
    },
    issuanceDate: new Date(issuanceDate).toISOString(),
    expirationDate: new Date(expiration || expirationDate).toISOString(),
  };

  const domain = getDefaultDomainTypedData(vcType.domain);

  const vc: VerifiableCredential = await createEIP712VerifiableCredential(
    domain,
    credential,
    { CredentialSubject: vcType.typedData },
    signTypedData
  );
  return vc as T;
};

export const verifyVerifiableCredential = async <
  T extends VerifiableCredential
>(
  vcType: VerifiableCredentialSchemaType,
  credential: T
): Promise<boolean> => {
  const domain = getDefaultDomainTypedData(vcType.domain);
  return await verifyEIP712Credential(
    domain,
    credential.issuer.ethereumAddress,
    credential,
    { CredentialSubject: vcType.typedData },
    credential.proof.proofValue,
    async (data: EIP712TypedData<EIP712MessageTypes>, proofValue: string) => {
      // Replace this fuction with your own signing code
      return recoverTypedSignature({
        data: data,
        signature: proofValue,
        version: SignTypedDataVersion.V4,
      });
    }
  );
};

export const verifyEIP712Credential = async (
  domain: EIP712DomainTypedData,
  issuer: string,
  credential: W3CCredential,
  credentialSubjectTypes: any,
  proofValue: string,
  verifyTypedData: VerifyTypedData<EIP712MessageTypes>
): Promise<boolean> => {
  let data: W3CCredentialTypedData = getW3CCredentialTypedData(
    domain,
    credential,
    credentialSubjectTypes
  );
  const recoveredAddress = await verifyTypedData(data, proofValue);
  return (
    utils.getAddress(issuer.toLowerCase()) ===
    utils.getAddress(recoveredAddress.toLowerCase())
  );
};

const createEIP712VerifiableCredential = async (
  domain: EIP712DomainTypedData,
  credential: W3CCredential,
  credentialSubjectTypes: any,
  signTypedData: SignTypedData<EIP712MessageTypes>
): Promise<VerifiableCredential> => {
  const credentialTypedData = getW3CCredentialTypedData(
    domain,
    credential,
    credentialSubjectTypes
  );

  let signature = await signTypedData(credentialTypedData);

  let proof: Proof = {
    verificationMethod:
      credentialTypedData.message.issuer.id + '#ethereumAddress',
    ethereumAddress: credentialTypedData.message.issuer.ethereumAddress,
    created: new Date(Date.now()).toISOString(),
    proofPurpose: 'assertionMethod',
    type: 'EthereumEip712Signature2021',
    ...credentialTypedData.message.proof,
    proofValue: signature,
    eip712: {
      domain: { ...credentialTypedData.domain },
      types: { ...credentialTypedData.types },
      primaryType: credentialTypedData.primaryType,
    },
  };

  let verifiableCredential = {
    ...credential,
    proof,
  };

  return verifiableCredential;
};

export const getDefaultDomainTypedData = (
  name: string
): EIP712DomainTypedData => {
  return {
    name: name,
    version: '1',
    chainId: 1,
    verifyingContract: '0x00000000000000000000000000000000000000000000', // WIP
  };
};

const getW3CCredentialTypedData = (
  domain: EIP712DomainTypedData,
  credential: W3CCredential,
  credentialSubjectTypes: any
): W3CCredentialTypedData => {
  return {
    domain: formatDomainTypedData(domain),
    primaryType: VERIFIABLE_CREDENTIAL_PRIMARY_TYPE,
    message: credential,
    types: {
      EIP712Domain: DOMAIN_TYPE,
      VerifiableCredential: VERIFIABLE_CREDENTIAL_W3C_TYPE,
      CredentialSchema: CREDENTIAL_SCHEMA_W3C_TYPE,
      Issuer: ISSUER_EIP712_TYPE,
      ...credentialSubjectTypes,
    },
  };
};

const formatDomainTypedData = (
  domain: EIP712DomainTypedData
): EIP712DomainTypedData => {
  return {
    name: domain.name,
    version: domain.version,
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract,
  };
};
