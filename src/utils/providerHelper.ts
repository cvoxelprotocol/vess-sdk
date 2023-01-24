import { utils } from 'ethers';
import {
  SignTypedDataVersion,
  recoverTypedSignature,
} from '@metamask/eth-sig-util';

import {
  EventAttendanceWithId,
  MembershipSubjectWithId,
} from '../interface/index.js';
import {
  CLIENT_EIP712_TYPE,
  DELIVERABLES_EIP712_TYPE,
  DOMAIN_TYPE,
  EIP712DomainTypedData,
  EIP712MessageTypes,
  EIP712TypedData,
  VerifiableMembershipSubjectCredential,
  EIP712WorkCredentialSubjectTypedData,
  PRIMARY_SUBJECT_TYPE,
  TX_EIP712_TYPE,
  WORK_EIP712_TYPE,
  WORK_SUBJECT_EIP712_TYPE,
  EventAttendanceVerifiableCredential,
} from '../interface/eip712.js';

import {
  WorkCredential,
  WorkSubject,
} from '../__generated__/types/WorkCredential';
import { VerifiableMembershipSubject } from '../__generated__/types/VerifiableMembershipSubjectCredential';
import { EventAttendance } from '../__generated__/types/EventAttendanceVerifiableCredential';
import { convertDateToTimestampStr } from './common.js';
import { Signatures } from '../__generated__/index.js';
import {
  createVerifiableCredential,
  getDefaultDomainTypedData,
  verifyVerifiableCredential,
} from './credentialHelper.js';
import { VESS_CREDENTIALS } from '../constants/verifiableCredentials.js';

export const createVerifiableMembershipSubjectCredential = async (
  membershipSubject: VerifiableMembershipSubject,
  provider?: any
): Promise<VerifiableMembershipSubjectCredential> => {
  if (!provider) throw new Error('Missing provider for getSignature');

  const credentialId = `${membershipSubject.organizationId}-${membershipSubject.membershipId}-${membershipSubject.id}`;
  const accounts = await safeSend(provider, 'eth_accounts', []);
  const address = accounts[0].toLowerCase();

  return await createVerifiableCredential<VerifiableMembershipSubjectCredential>(
    address,
    credentialId,
    VESS_CREDENTIALS.MEMBERSHIP,
    membershipSubject,
    async (data: EIP712TypedData<EIP712MessageTypes>) => {
      const accounts = await safeSend(provider, 'eth_accounts', []);
      const address = accounts[0].toLowerCase();
      const sig: string = await safeSend(provider, 'eth_signTypedData_v4', [
        address,
        JSON.stringify(data),
      ]);
      return sig;
    }
  );
};

export const createEventAttendanceCredential = async (
  eventAttendance: EventAttendance,
  provider?: any
): Promise<EventAttendanceVerifiableCredential> => {
  if (!provider) throw new Error('Missing provider for getSignature');

  const credentialId = `${eventAttendance.eventId}-${eventAttendance.id}`;
  const accounts = await safeSend(provider, 'eth_accounts', []);
  const address = accounts[0].toLowerCase();
  return await createVerifiableCredential<EventAttendanceVerifiableCredential>(
    address,
    credentialId,
    VESS_CREDENTIALS.EVENT_ATTENDANCE,
    eventAttendance,
    async (data: EIP712TypedData<EIP712MessageTypes>) => {
      const accounts = await safeSend(provider, 'eth_accounts', []);
      const address = accounts[0].toLowerCase();
      const sig: string = await safeSend(provider, 'eth_signTypedData_v4', [
        address,
        JSON.stringify(data),
      ]);
      return sig;
    }
  );
};

export const verifyEventAttendanceCredential = async (
  eventAttendance: EventAttendanceWithId
): Promise<boolean> => {
  return await verifyVerifiableCredential<EventAttendanceWithId>(
    VESS_CREDENTIALS.EVENT_ATTENDANCE,
    eventAttendance
  );
};

export const verifyMembershipCredential = async (
  credential: MembershipSubjectWithId
): Promise<boolean> => {
  return await verifyVerifiableCredential<MembershipSubjectWithId>(
    VESS_CREDENTIALS.MEMBERSHIP,
    credential
  );
};

export function safeSend(
  provider: any,
  method: string,
  params: any[]
): Promise<any> {
  if (!provider)
    throw new Error(
      `Unsupported provider; provider must implement one of the following methods: send, sendAsync, request`
    );
  if (params == null) {
    params = [];
  }
  if (provider.request) {
    return provider
      .request({
        method,
        params,
      })
      .then(
        (response: any) => response,
        (error: any) => {
          throw error;
        }
      );
  } else if (provider.sendAsync || provider.send) {
    const sendFunc = (
      provider.sendAsync ? provider.sendAsync : provider.send!
    ).bind(provider);
    const request = encodeRpcMessage(method, params);
    return new Promise((resolve, reject) => {
      sendFunc(request, (error: any, response: any) => {
        if (error) reject(error);
        if (response.error) {
          const error1 = new Error(response.error.message);
          console.log(response.error.code);
          console.log(response.error.data);
          reject(error1);
        }
        resolve(response.result);
      });
    });
  } else {
    throw new Error(
      `Unsupported provider; provider must implement one of the following methods: send, sendAsync, request`
    );
  }
}
export function encodeRpcMessage(method: string, params: any[]) {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  };
}

// ==== Old Credential ====
export const createEIP712WorkCredential = async (
  id: string,
  subject: WorkSubject,
  provider?: any
): Promise<WorkCredential> => {
  if (!provider) throw new Error('Missing provider for getSignature');
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
  provider?: any
): Promise<string> => {
  if (!provider) throw new Error('Missing provider for getSignature');
  const domain = getDefaultDomainTypedData(
    VESS_CREDENTIALS.WORK_CREDENTIAL.domain
  );

  const credentialTypedData = getEIP712WorkSubjectTypedData(domain, subject);
  const accounts = await safeSend(provider, 'eth_accounts', []);
  return await safeSend(provider, 'eth_signTypedData_v4', [
    accounts[0].toLowerCase(),
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

export const verifyWorkCredential = async (
  work: WorkCredential,
  signer: string,
  proofValue: string
): Promise<boolean> => {
  const domain = getDefaultDomainTypedData(
    VESS_CREDENTIALS.WORK_CREDENTIAL.domain
  );
  const credentialTypedData = getEIP712WorkSubjectTypedData(
    domain,
    work.subject
  );
  const recoveredAddress = recoverTypedSignature({
    data: credentialTypedData,
    signature: proofValue,
    version: SignTypedDataVersion.V4,
  });
  return (
    utils.getAddress(signer.toLowerCase()) ===
    utils.getAddress(recoveredAddress.toLowerCase())
  );
};
// ==== Old Credential ====
