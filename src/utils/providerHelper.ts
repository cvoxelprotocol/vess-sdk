import { Web3Provider } from "@ethersproject/providers";
import { utils } from "ethers";
import {
  SignTypedDataVersion,
  recoverTypedSignature,
} from "@metamask/eth-sig-util";

import { EventAttendanceWithId } from "../interface/index.js";
import {
  CLIENT_EIP712_TYPE,
  CREDENTIAL_SCHEMA_W3C_TYPE,
  DELIVERABLES_EIP712_TYPE,
  DOMAIN_TYPE,
  EIP712DomainTypedData,
  EIP712MessageTypes,
  EIP712TypedData,
  VerifiableMembershipSubjectCredential,
  EIP712WorkCredentialSubjectTypedData,
  ISSUER_EIP712_TYPE,
  MEMBERSHIP_SUBJECT_EIP712_TYPE,
  PRIMARY_SUBJECT_TYPE,
  Proof,
  SignTypedData,
  TX_EIP712_TYPE,
  VerifiableCredential,
  VERIFIABLE_CREDENTIAL_PRIMARY_TYPE,
  VERIFIABLE_CREDENTIAL_W3C_TYPE,
  VerifyTypedData,
  W3CCredential,
  W3CCredentialTypedData,
  WORK_EIP712_TYPE,
  WORK_SUBJECT_EIP712_TYPE,
  EVENT_ATTENDANCE_EIP712_TYPE,
  EventAttendanceVerifiableCredential,
} from "../interface/eip712.js";

import { getPkhDIDFromAddress } from "./ceramicHelper.js";
import {
  Signatures,
  WorkCredential,
  WorkSubject,
} from "../__generated__/types/WorkCredential";
import { VerifiableMembershipSubject } from "../__generated__/types/VerifiableMembershipSubjectCredential";
import { EventAttendance } from "../__generated__/types/EventAttendanceVerifiableCredential";
import { convertDateToTimestampStr } from "./common.js";

const DEFAULT_CONTEXT = "https://www.w3.org/2018/credentials/v1";
const EIP712_CONTEXT =
  "https://raw.githubusercontent.com/w3c-ccg/ethereum-eip712-signature-2021-spec/main/contexts/v1/index.json";
const MEMBERSHIP_SUBJECT_SCHEMA =
  "https://app.vess.id/schemas/VerifiableMembershipSubject.json";
const EVENT_ATTENDANCE_SCHEMA =
  "https://app.vess.id/schemas/EventAttendance.json";
const DEFAULT_VC_TYPE = "VerifiableCredential";
const MEMBERSHIP_VC_TYPE = "MembershipCredential";
const EVENT_ATTENDANCE_VC_TYPE = "EventAttendanceCredential";

const EVENT_DOMAIN_NAME = "Verifiable Event Attendance";
const WORK_DOMAIN_NAME = "Work Credential";
const MEMBERSHIP_DOMAIN_NAME = "Verifiable Member Subject";

export const createEIP712WorkCredential = async (
  id: string,
  subject: WorkSubject,
  provider?: Web3Provider
): Promise<WorkCredential> => {
  if (!provider) throw new Error("Missing provider for getSignature");
  const nowTimestamp = convertDateToTimestampStr(new Date());
  const holderSig = await _getEIP712WorkCredentialSubjectSignature(
    subject,
    provider
  );
  const signature: Signatures = {
    holderSig: holderSig,
  };
  return {
    id: id,
    subject: subject,
    signature: signature,
    createdAt: nowTimestamp,
    updatedAt: nowTimestamp,
  };
};

export const _getEIP712WorkCredentialSubjectSignature = async (
  subject: WorkSubject,
  provider?: Web3Provider
): Promise<string> => {
  if (!provider) throw new Error("Missing provider for getSignature");
  const domain = getDefaultDomainTypedData(WORK_DOMAIN_NAME);

  const credentialTypedData = getEIP712WorkSubjectTypedData(domain, subject);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  return await provider.send("eth_signTypedData_v4", [
    address,
    JSON.stringify(credentialTypedData),
  ]);
};

const getEIP712WorkSubjectTypedData = (
  domain: EIP712DomainTypedData,
  subject: WorkSubject
): EIP712WorkCredentialSubjectTypedData => {
  return {
    domain: domain,
    primaryType: PRIMARY_SUBJECT_TYPE,
    message: subject,
    types: {
      EIP712Domain: DOMAIN_TYPE,
      WorkCredentialSubject: WORK_SUBJECT_EIP712_TYPE,
      Work: WORK_EIP712_TYPE,
      DeliverableItem: DELIVERABLES_EIP712_TYPE,
      TX: TX_EIP712_TYPE,
      Client: CLIENT_EIP712_TYPE,
    },
  };
};

export const createVerifiableMembershipSubjectCredential = async (
  membershipSubject: VerifiableMembershipSubject,
  provider?: Web3Provider
): Promise<VerifiableMembershipSubjectCredential> => {
  if (!provider) throw new Error("Missing provider for getSignature");

  let issuanceDate = Date.now();
  let expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 100);

  const credentialId = `${membershipSubject.organizationId}-${membershipSubject.membershipId}-${membershipSubject.id}`;
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  const issuerDID = getPkhDIDFromAddress(address);

  let credential: W3CCredential = {
    "@context": [DEFAULT_CONTEXT, EIP712_CONTEXT],
    type: [DEFAULT_VC_TYPE, MEMBERSHIP_VC_TYPE],
    id: credentialId,
    issuer: {
      id: issuerDID,
      ethereumAddress: address,
    },
    credentialSubject: membershipSubject,
    credentialSchema: {
      id: EVENT_ATTENDANCE_SCHEMA,
      type: "Eip712SchemaValidator2021",
    },
    issuanceDate: new Date(issuanceDate).toISOString(),
    expirationDate: new Date(expirationDate).toISOString(),
  };

  const domain = getDefaultDomainTypedData(MEMBERSHIP_DOMAIN_NAME);

  const vc: VerifiableCredential = await createEIP712VerifiableCredential(
    domain,
    credential,
    { CredentialSubject: MEMBERSHIP_SUBJECT_EIP712_TYPE },
    async (data: EIP712TypedData<EIP712MessageTypes>) => {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const sig: string = await provider.send("eth_signTypedData_v4", [
        address,
        JSON.stringify(data),
      ]);
      return sig;
    }
  );
  return vc as VerifiableMembershipSubjectCredential;
};

export const createEventAttendanceCredential = async (
  eventAttendance: EventAttendance,
  provider?: Web3Provider
): Promise<EventAttendanceVerifiableCredential> => {
  if (!provider) throw new Error("Missing provider for getSignature");

  let issuanceDate = Date.now();
  let expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 100);

  const credentialId = `${eventAttendance.eventId}-${eventAttendance.id}`;
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  const issuerDID = getPkhDIDFromAddress(address);

  let credential: W3CCredential = {
    "@context": [DEFAULT_CONTEXT, EIP712_CONTEXT],
    type: [DEFAULT_VC_TYPE, EVENT_ATTENDANCE_VC_TYPE],
    id: credentialId,
    issuer: {
      id: issuerDID,
      ethereumAddress: address,
    },
    credentialSubject: eventAttendance,
    credentialSchema: {
      id: MEMBERSHIP_SUBJECT_SCHEMA,
      type: "Eip712SchemaValidator2021",
    },
    issuanceDate: new Date(issuanceDate).toISOString(),
    expirationDate: new Date(expirationDate).toISOString(),
  };

  const domain = getDefaultDomainTypedData(EVENT_DOMAIN_NAME);

  const vc: VerifiableCredential = await createEIP712VerifiableCredential(
    domain,
    credential,
    { CredentialSubject: EVENT_ATTENDANCE_EIP712_TYPE },
    async (data: EIP712TypedData<EIP712MessageTypes>) => {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const sig: string = await provider.send("eth_signTypedData_v4", [
        address,
        JSON.stringify(data),
      ]);
      return sig;
    }
  );
  return vc as EventAttendanceVerifiableCredential;
};

export const verifyEventAttendanceCredential = async (
  eventAttendance: EventAttendanceWithId
): Promise<boolean> => {
  const domain = getDefaultDomainTypedData(EVENT_DOMAIN_NAME);
  return await verifyEIP712Credential(
    domain,
    eventAttendance.issuer.ethereumAddress,
    eventAttendance,
    { CredentialSubject: EVENT_ATTENDANCE_EIP712_TYPE },
    eventAttendance.proof.proofValue,
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
      credentialTypedData.message.issuer.id + "#ethereumAddress",
    ethereumAddress: credentialTypedData.message.issuer.ethereumAddress,
    created: new Date(Date.now()).toISOString(),
    proofPurpose: "assertionMethod",
    type: "EthereumEip712Signature2021",
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
  return utils.getAddress(issuer) === utils.getAddress(recoveredAddress);
};

const getDefaultDomainTypedData = (name: string): EIP712DomainTypedData => {
  return {
    name: name,
    version: "1",
    chainId: 1,
    verifyingContract: "0x00000000000000000000000000000000000000000000", // WIP
  };
};
