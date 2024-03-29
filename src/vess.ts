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
  createEventAttendanceVCTileDoc,
  createMembershipVCTileDoc,
  _getEIP712WorkCredentialSubjectSignature,
} from './utils/providerHelper.js';
import { AccountId } from 'caip';
import { EthereumWebAuth } from '@didtools/pkh-ethereum';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';
import { VerifiableMembershipSubject } from './__generated__/types/VerifiableMembershipSubjectCredential';
import { EventAttendance } from './__generated__/types/EventAttendanceVerifiableCredential';
import {
  AuthResponse,
  BaseVESS,
  PROD_CERAMIC_URL,
  TESTNET_CERAMIC_URL,
} from './baseVess.js';
import {
  HeldWorkCredentials,
  WorkCredential,
  WorkSubject,
  IssuedVerifiableMembershipSubjects,
  IssuedEventAttendanceVerifiableCredentialsV2,
} from './__generated__/index.js';
import { DIDSession } from 'did-session';

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
    address: string,
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
    this.account = address;

    try {
      const accountId: AccountId = new AccountId({
        address: this.account.toLowerCase(),
        chainId: `eip155:1`,
      });
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

  autoConnect = async (
    env: 'mainnet' | 'testnet-clay' = 'mainnet'
  ): Promise<AuthResponse | null> => {
    const sessionStr = localStorage.getItem('ceramic-session');
    if (sessionStr) {
      const session = await DIDSession.fromSession(sessionStr);
      this.dataModel = getDataModel(env);
      this.env = env;
      this.ceramicUrl =
        this.env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
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
    }
    return null;
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
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataModel) {
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
      await Promise.all([storeIDX]);
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
    contents: VerifiableMembershipSubject[]
  ): Promise<CustomResponse<{ streamIds: string[] }>> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }

    try {
      let promises: Promise<MembershipSubjectWithId>[] = [];
      for (const content of contents) {
        const val = createMembershipVCTileDoc(
          content,
          this.ceramic,
          this.dataModel,
          this.provider
        );
        promises.push(val);
      }
      const vals = await Promise.all(promises);
      const ids = vals.map((v) => v.ceramicId);
      const storeIDX = setIDX<
        IssuedVerifiableMembershipSubjects,
        'IssuedVerifiableMembershipSubjects'
      >(
        ids,
        this.ceramic,
        this.dataStore,
        'IssuedVerifiableMembershipSubjects',
        'issued'
      );
      await Promise.all([storeIDX]);
      return {
        status: 200,
        streamIds: ids,
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
    contents: EventAttendance[]
  ): Promise<CustomResponse<{ streamIds: string[] }>> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }
    try {
      let promises: Promise<EventAttendanceWithId>[] = [];
      for (const content of contents) {
        const val = createEventAttendanceVCTileDoc(
          content,
          this.ceramic,
          this.dataModel,
          this.provider
        );
        promises.push(val);
      }
      const vals = await Promise.all(promises);
      const ids = vals.map((v) => v.ceramicId);

      const storeIDX = setIDX<
        IssuedEventAttendanceVerifiableCredentialsV2,
        'IssuedEventAttendanceVerifiableCredentialsV2'
      >(
        ids,
        this.ceramic,
        this.dataStore,
        'IssuedEventAttendanceVerifiableCredentialsV2',
        'issued'
      );
      await Promise.all([storeIDX]);
      return {
        status: 200,
        streamIds: ids,
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

  // ============================== Other ==============================

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
