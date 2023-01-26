import {
  CustomResponse,
  EventAttendanceWithId,
  MembershipSubjectWithId,
  WorkCredentialWithId,
} from './interface/index.js';
import {
  createTileDoc,
  getDataModel,
  setIDX,
  loadSession,
  removeSession,
} from './utils/ceramicHelper.js';
import { convertDateToTimestampStr } from './utils/common.js';
import {
  createEIP712WorkCredential,
  createEventAttendanceCredential,
  createVerifiableMembershipSubjectCredential,
  safeSend,
  _getEIP712WorkCredentialSubjectSignature,
} from './utils/providerHelper.js';

import { EthereumWebAuth, getAccountId } from '@didtools/pkh-ethereum';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';

import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from './interface/eip712.js';
import { VerifiableMembershipSubject } from './__generated__/types/VerifiableMembershipSubjectCredential';
import { EventAttendance } from './__generated__/types/EventAttendanceVerifiableCredential';
import {
  AuthResponse,
  BaseVESS,
  PROD_CERAMIC_URL,
  TESTNET_CERAMIC_URL,
} from './baseVess.js';
import { issueEventAttendancesParam } from './utils/backupDataStoreHelper.js';
import {
  HeldWorkCredentials,
  WorkCredential,
  WorkSubject,
  IssuedEventAttendanceVerifiableCredentials,
  IssuedVerifiableMembershipSubjects,
} from './__generated__/index.js';
import { CredentialParam } from './interface/kms.js';

export class VESS extends BaseVESS {
  provider = undefined as any | undefined;
  account = undefined as string | undefined;

  constructor(
    env: 'mainnet' | 'testnet-clay' = 'mainnet',
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }

  connect = async (
    provider?: any,
    env: 'mainnet' | 'testnet-clay' = 'mainnet'
  ): Promise<AuthResponse> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;

    if (!provider) {
      if ((window as any).ethereum) {
        console.log(
          'VESS SDK: You need to pass the provider as an argument in the `connect()` function. We will be using window.ethereum by default.'
        );
        provider = (window as any).ethereum;
      }
    }
    if (!provider) {
      throw new Error(
        'An ethereum provider is required to proceed with the connection to Ceramic.'
      );
    }

    this.provider = provider;
    let accounts: string[] = [];
    try {
      accounts = await safeSend(this.provider, 'eth_accounts', []);
    } catch (e) {
      console.log(e);
      throw new Error(
        `Error enabling Ethereum provider. Message: ${JSON.stringify(e)}`
      );
    }
    this.account = accounts[0];

    try {
      const accountId = await getAccountId(
        this.provider,
        this.account.toLowerCase()
      );
      const authMethod = await EthereumWebAuth.getAuthMethod(
        this.provider,
        accountId
      );
      const session = await loadSession(authMethod);
      this.session = session;
      this.ceramic = new CeramicClient(this.ceramicUrl);
      this.ceramic.did = this.session.did;
      this.dataStore = new DIDDataStore({
        ceramic: this.ceramic,
        model: this.dataModel,
        id: this.ceramic?.did?.parent,
      });
      console.log(`ceramic authorized! env: ${this.env}`);
      return { session: this.session, ceramic: this.ceramic, env: this.env };
    } catch (e) {
      console.log(e);
      throw new Error('Error authorizing DID session.');
    }
  };

  disconnect = () => {
    removeSession();
    this.session = undefined;
    this.dataStore = undefined;
    this.ceramic = undefined;
  };

  // ============================== Issue ==============================

  /**
   * issue work credential to Ceramic
   * @param content
   * @returns streamid
   */
  issueWorkCredential = async (
    content: WorkSubject
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataModel ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const credential = await createEIP712WorkCredential(
        this.ceramic?.did?.parent,
        content,
        this.provider
      );
      const val: WorkCredentialWithId = await createTileDoc<WorkCredential>(
        credential,
        this.ceramic,
        this.dataModel,
        'WorkCredential',
        ['vess', 'workCredential']
      );
      if (!val.ceramicId) throw new Error('falild to create credentail');
      const storeIDX = setIDX<HeldWorkCredentials, 'heldWorkCredentials'>(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'heldWorkCredentials',
        'held'
      );
      const uploadBackup = this.backupDataStore.uploadCRDL(val);
      await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Work Credential',
        streamId: undefined,
      };
    }
  };

  issueMembershipSubject = async (
    params: CredentialParam<VerifiableMembershipSubject>
  ): Promise<CustomResponse<{ streamIds: string[] }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }

    try {
      // TODO: sign and create verifiable credential before save data
      const vc = await createVerifiableMembershipSubjectCredential(
        params.content,
        this.provider
      );
      const val: MembershipSubjectWithId =
        await createTileDoc<VerifiableMembershipSubjectCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          'VerifiableMembershipSubjectCredential',
          ['vess', 'membershipCredential']
        );
      const storeIDX = setIDX<
        IssuedVerifiableMembershipSubjects,
        'IssuedVerifiableMembershipSubjects'
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'IssuedVerifiableMembershipSubjects',
        'issued'
      );

      const uploadBackup = this.backupDataStore.uploadMembershipSubject(val);
      await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamIds: [val.ceramicId],
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Work Credential',
        streamIds: [],
      };
    }
  };

  issueEventAttendanceCredential = async (
    params: CredentialParam<EventAttendance>
  ): Promise<CustomResponse<{ streamIds: string[] }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }
    try {
      const vc = await createEventAttendanceCredential(
        params.content,
        this.provider
      );

      const val: EventAttendanceWithId =
        await createTileDoc<EventAttendanceVerifiableCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          'EventAttendanceVerifiableCredential',
          ['vess', 'eventAttendanceCredential']
        );
      const storeIDX = setIDX<
        IssuedEventAttendanceVerifiableCredentials,
        'IssuedEventAttendanceVerifiableCredentials'
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'IssuedEventAttendanceVerifiableCredentials',
        'issued'
      );
      const uploadBackup = this.backupDataStore.uploadEventAttendance(val);
      await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamIds: [val.ceramicId],
      };
    } catch (error) {
      return {
        status: 500,
        error: error,
        result: 'Failed to Issue Work Credential',
        streamIds: [],
      };
    }
  };

  issueEventAttendancesFromProxy = async (
    param: issueEventAttendancesParam
  ): Promise<{ [x: string]: string | string[] }> => {
    if (!this.backupDataStore) throw new Error('you need to initialize first');
    return await this.backupDataStore.issueEventAttendancesFromProxy(param);
  };

  // ============================== Other ==============================

  // Only update backup DB
  signWorkCredential = async (
    id: string,
    credential: WorkCredential,
    signer: string
  ): Promise<WorkCredentialWithId | undefined> => {
    if (!this.backupDataStore) return undefined;
    const nowTimestamp = convertDateToTimestampStr(new Date());
    const signature = await _getEIP712WorkCredentialSubjectSignature(
      credential.subject,
      this.provider
    );
    const crdl: WorkCredentialWithId = {
      ...credential,
      signature: {
        ...credential.signature,
        partnerSig: signature,
        partnerSigner: signer,
      },
      updatedAt: nowTimestamp,
    };
    await this.backupDataStore.uploadCRDL({ ...crdl, ceramicId: id });
    return crdl;
  };

  getEIP712WorkCredentialSubjectSignature = async (
    subject: WorkSubject
  ): Promise<string> => {
    return await _getEIP712WorkCredentialSubjectSignature(
      subject,
      this.provider
    );
  };
}

let vess: VESS;

export const getVESS = (dev: boolean = false): VESS => {
  if (vess) {
    return vess;
  }
  const env = !dev ? 'mainnet' : 'testnet-clay';
  vess = new VESS(env);
  return vess;
};
