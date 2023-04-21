import {
  BaseResponse,
  CustomResponse,
  WithCeramicId,
} from './interface/index.js';
import {
  createTileDoc,
  getDataModel,
  removeSession,
  setIDX,
  updateTileDoc,
} from './utils/ceramicHelper.js';
import { _getEIP712WorkCredentialSubjectSignature } from './utils/providerHelper.js';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';
import {
  CertificationVerifiableCredential,
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from './interface/eip712.js';
import {
  AuthResponse,
  BaseVESS,
  PROD_CERAMIC_URL,
  TESTNET_CERAMIC_URL,
} from './baseVess.js';
import { DIDSession } from 'did-session';
import {
  IssuedCertificationSubjects,
  IssuedEventAttendanceVerifiableCredentials,
  IssuedVerifiableMembershipSubjects,
} from './__generated__/index.js';

export class VessForKMS extends BaseVESS {
  account = undefined as string | undefined;

  constructor(
    env: 'mainnet' | 'testnet-clay' = 'mainnet',
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }

  connect = async (
    sessionStr: string,
    account: string,
    env: 'mainnet' | 'testnet-clay' = 'mainnet'
  ): Promise<AuthResponse> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
    this.account = account;

    try {
      const session = await DIDSession.fromSession(sessionStr);
      localStorage.setItem('ceramic-session', session.serialize());
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
      console.error(e);
      throw new Error(`Error authorizing DID session: ${JSON.stringify(e)}`);
    }
  };

  disconnect = () => {
    removeSession();
    this.session = undefined;
    this.dataStore = undefined;
    this.ceramic = undefined;
  };

  // ============================== Issue ==============================

  issueMembershipSubjectWithKMS = async (
    vcs: VerifiableMembershipSubjectCredential[]
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
      let tileDocPromises: Promise<
        WithCeramicId<VerifiableMembershipSubjectCredential>
      >[] = [];
      let uploadBackupPromises: Promise<{ [x: string]: string }>[] = [];
      for (const vc of vcs) {
        const tileDocPromise =
          createTileDoc<VerifiableMembershipSubjectCredential>(
            vc,
            this.ceramic,
            this.dataModel,
            'VerifiableMembershipSubjectCredential',
            ['vess', 'membershipCredential']
          );
        tileDocPromises.push(tileDocPromise);
      }
      const vals = await Promise.all(tileDocPromises);
      const streamIds = vals.map((v) => v.ceramicId);
      const storeIDX = setIDX<
        IssuedVerifiableMembershipSubjects,
        'IssuedVerifiableMembershipSubjects'
      >(
        streamIds,
        this.ceramic,
        this.dataStore,
        'IssuedVerifiableMembershipSubjects',
        'issued'
      );
      for (const val of vals) {
        const uploadBackup = this.backupDataStore.uploadMembershipSubject(val);
        uploadBackupPromises.push(uploadBackup);
      }
      await Promise.all([storeIDX, uploadBackupPromises]);
      return {
        status: 200,
        streamIds: streamIds,
      };
    } catch (error) {
      throw new Error(`Failed to Issue Credential:${error}`);
    }
  };

  updateMembershipSubjectWithKMS = async (
    vcs: WithCeramicId<VerifiableMembershipSubjectCredential>[]
  ): Promise<BaseResponse> => {
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
      let tileDocPromises: Promise<void>[] = [];
      for (const vc of vcs) {
        const { ceramicId, ...content } = vc;
        const promise = updateTileDoc<VerifiableMembershipSubjectCredential>(
          this.ceramic,
          ceramicId,
          content
        );
        tileDocPromises.push(promise);
      }
      await Promise.all(tileDocPromises);
      return {
        status: 200,
      };
    } catch (error) {
      throw new Error(`Failed to Issue Credential:${error}`);
    }
  };

  issueEventAttendanceCredentialWithKMS = async (
    vcs: EventAttendanceVerifiableCredential[]
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
      let tileDocPromises: Promise<
        WithCeramicId<EventAttendanceVerifiableCredential>
      >[] = [];
      let uploadBackupPromises: Promise<{ [x: string]: string }>[] = [];
      for (const vc of vcs) {
        const tileDocPromise =
          createTileDoc<EventAttendanceVerifiableCredential>(
            vc,
            this.ceramic,
            this.dataModel,
            'EventAttendanceVerifiableCredential',
            ['vess', 'eventAttendanceCredential']
          );
        tileDocPromises.push(tileDocPromise);
      }
      const vals = await Promise.all(tileDocPromises);
      const streamIds = vals.map((v) => v.ceramicId);

      const storeIDX = setIDX<
        IssuedEventAttendanceVerifiableCredentials,
        'IssuedEventAttendanceVerifiableCredentials'
      >(
        streamIds,
        this.ceramic,
        this.dataStore,
        'IssuedEventAttendanceVerifiableCredentials',
        'issued'
      );
      for (const val of vals) {
        const uploadBackup = this.backupDataStore.uploadEventAttendance(val);
        uploadBackupPromises.push(uploadBackup);
      }
      await Promise.all([storeIDX, uploadBackupPromises]);
      return {
        status: 200,
        streamIds: streamIds,
      };
    } catch (error) {
      throw new Error(`Failed to Issue Credential:${error}`);
    }
  };

  issueCertificationSubjectWithKMS = async (
    vcs: CertificationVerifiableCredential[]
  ): Promise<CustomResponse<{ streamIds: string[] }>> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }
    try {
      let tileDocPromises: Promise<
        WithCeramicId<CertificationVerifiableCredential>
      >[] = [];
      for (const vc of vcs) {
        const tileDocPromise = createTileDoc<CertificationVerifiableCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          'CertificationSubject',
          ['vess', 'CertificationSubject']
        );
        tileDocPromises.push(tileDocPromise);
      }
      const vals = await Promise.all(tileDocPromises);
      const streamIds = vals.map((v) => v.ceramicId);

      const storeIDX = setIDX<
        IssuedCertificationSubjects,
        'IssuedCertificationSubjects'
      >(
        streamIds,
        this.ceramic,
        this.dataStore,
        'IssuedCertificationSubjects',
        'issued'
      );
      await Promise.all([storeIDX]);
      return {
        status: 200,
        streamIds: streamIds,
      };
    } catch (error) {
      throw new Error(`Failed to Issue Credential:${error}`);
    }
  };
}

let vessForKMS: VessForKMS;

export const getVESSForKMS = (dev: boolean = false): VessForKMS => {
  if (vessForKMS) {
    return vessForKMS;
  }
  const env = !dev ? 'mainnet' : 'testnet-clay';
  vessForKMS = new VessForKMS(env);
  return vessForKMS;
};
