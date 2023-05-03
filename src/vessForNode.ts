import {
  CustomResponse,
  EventAttendanceWithId,
  EventWithId,
  MembershipSubjectWithId,
  MembershipWithId,
  OrganizationWIthId,
  WithCeramicId,
  WorkCredentialWithId,
} from './interface/index.js';
import { createTileDoc, getDataModel, setIDX } from './utils/ceramicHelper.js';

import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';
import {
  CertificationVerifiableCredential,
  EIP712MessageTypes,
  EventAttendance,
  EventAttendanceVerifiableCredential,
  SignTypedData,
  SignTypedDataForNode,
  VerifiableMembershipSubject,
  VerifiableMembershipSubjectCredential,
} from './interface/eip712.js';
import { DIDSession } from 'did-session';
import { getTempAuthMethod } from './utils/nodeHelper.js';
import { PROD_CERAMIC_URL, TESTNET_CERAMIC_URL, BaseVESS } from './baseVess.js';
import {
  Certification,
  CertificationSubject,
  HeldWorkCredentials,
  IssuedCertificationSubjects,
  IssuedEventAttendanceVerifiableCredentialsV2,
  IssuedVerifiableMembershipSubjects,
  WorkCredential,
} from './__generated__/index.js';
import { SignSIWE } from './interface/kms.js';
import {
  createVerifiableCredential,
  createVerifiableCredentialForNode,
} from './utils/credentialHelper.js';
import { VESS_CREDENTIALS } from './constants/verifiableCredentials.js';

export class VessForNode extends BaseVESS {
  constructor(
    env: 'mainnet' | 'testnet-clay' = 'mainnet',
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }
  connect = async (
    account: string,
    signSIWE: SignSIWE,
    env: 'mainnet' | 'testnet-clay' = 'mainnet',
    expirationTime?: number
  ): Promise<DIDSession> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;

    try {
      const authMethod = await getTempAuthMethod(
        account.toLowerCase(),
        'app.vess.id',
        signSIWE
      );

      const session = await DIDSession.authorize(authMethod, {
        resources: ['ceramic://*'],
        expiresInSecs: expirationTime || 60 * 60 * 24 * 90,
      });
      this.session = session;
      this.ceramic = new CeramicClient(this.ceramicUrl);
      this.ceramic.did = this.session.did;
      this.dataStore = new DIDDataStore({
        ceramic: this.ceramic,
        model: this.dataModel,
        id: this.ceramic?.did?.parent,
      });
      console.log(`ceramic authorized! env: ${this.env}`);
      return session;
    } catch (e) {
      console.error(e);
      throw new Error('Error authorizing DID session.');
    }
  };

  disconnect = () => {
    this.session = undefined;
    this.dataStore = undefined;
    this.ceramic = undefined;
  };

  // ============================== Issue ==============================

  /**
   * issue work credential to Ceramic
   * @param content WorkCredential
   * @returns streamid
   */
  issueWorkCredential = async (
    credential: WorkCredential
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
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Work Credential',
        streamId: undefined,
      };
    }
  };

  issueMembershipSubject = async (
    org: OrganizationWIthId,
    membership: MembershipWithId,
    issuerAddress: string,
    holderDids: string[],
    signTypedData: SignTypedData<EIP712MessageTypes>
  ): Promise<CustomResponse<{ docs: MembershipSubjectWithId[] }>> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
        docs: [],
      };
    }

    try {
      const issuePromises: Promise<VerifiableMembershipSubjectCredential>[] =
        [];
      for (const did of holderDids) {
        const content: VerifiableMembershipSubject = {
          id: did,
          organizationName: org.name,
          organizationId: org.ceramicId,
          organizationIcon: org.icon || '',
          membershipName: membership.name,
          membershipIcon: membership.icon || '',
          membershipId: membership.ceramicId,
        };
        const credentialId = `${content.organizationId}-${content.membershipId}-${content.id}`;
        const issuePromise =
          createVerifiableCredential<VerifiableMembershipSubjectCredential>(
            issuerAddress,
            credentialId,
            VESS_CREDENTIALS.EVENT_ATTENDANCE,
            content,
            signTypedData
          );
        issuePromises.push(issuePromise);
      }
      const vcs = await Promise.all(issuePromises);
      const docsPromises: Promise<MembershipSubjectWithId>[] = [];
      for (const vc of vcs) {
        const docPromise = createTileDoc<VerifiableMembershipSubjectCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          'VerifiableMembershipSubjectCredential',
          ['vess', 'membershipCredential']
        );
        docsPromises.push(docPromise);
      }
      const docs = await Promise.all(docsPromises);
      const docUrls = docs.map((doc) => doc.ceramicId);
      await setIDX<
        IssuedVerifiableMembershipSubjects,
        'IssuedVerifiableMembershipSubjects'
      >(
        docUrls,
        this.ceramic,
        this.dataStore,
        'IssuedVerifiableMembershipSubjects',
        'issued'
      );
      return {
        status: 200,
        docs: docs,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Work Credential',
        docs: [],
      };
    }
  };

  issueEventAttendanceCredentials = async (
    content: EventWithId,
    issuerAddress: string,
    holderDids: string[],
    signTypedData: SignTypedDataForNode
  ): Promise<CustomResponse<{ docs: string[] }>> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
        docs: [],
      };
    }
    try {
      const issuePromises: Promise<EventAttendanceVerifiableCredential>[] = [];
      for (const did of holderDids) {
        const eventAttendance: EventAttendance = {
          id: did,
          eventId: content.ceramicId,
          eventName: content.name,
          eventIcon: content.icon,
        };
        const credentialId = `${content.ceramicId}-${did}`;
        const issuePromise =
          createVerifiableCredentialForNode<EventAttendanceVerifiableCredential>(
            issuerAddress,
            credentialId,
            VESS_CREDENTIALS.EVENT_ATTENDANCE,
            eventAttendance,
            signTypedData
          );
        issuePromises.push(issuePromise);
      }
      const vcs = await Promise.all(issuePromises);
      const docsPromises: Promise<EventAttendanceWithId>[] = [];
      for (const vc of vcs) {
        const docPromise = createTileDoc<EventAttendanceVerifiableCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          'EventAttendanceVerifiableCredential',
          ['vess', 'eventAttendanceCredential']
        );
        docsPromises.push(docPromise);
      }
      const docs = await Promise.all(docsPromises);
      const docUrls = docs.map((doc) => doc.ceramicId);
      await setIDX<
        IssuedEventAttendanceVerifiableCredentialsV2,
        'IssuedEventAttendanceVerifiableCredentialsV2'
      >(
        docUrls,
        this.ceramic,
        this.dataStore,
        'IssuedEventAttendanceVerifiableCredentialsV2',
        'issued'
      );
      return {
        status: 200,
        docs: docUrls,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Work Credential',
        docs: [],
      };
    }
  };

  issueCertificationSubject = async (
    content: WithCeramicId<Certification>,
    issuerAddress: string,
    holderDids: string[],
    signTypedData: SignTypedDataForNode
  ): Promise<CustomResponse<{ docs: string[] }>> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
        docs: [],
      };
    }
    try {
      const issuePromises: Promise<CertificationVerifiableCredential>[] = [];
      for (const did of holderDids) {
        const subject: CertificationSubject = {
          id: did,
          certificationId: content.ceramicId,
          certificationName: content.name || '',
          image: content.image,
        };
        const credentialId = `${content.ceramicId}-${did}`;
        const issuePromise =
          createVerifiableCredentialForNode<CertificationVerifiableCredential>(
            issuerAddress,
            credentialId,
            VESS_CREDENTIALS.CERTIFICATION,
            subject,
            signTypedData
          );
        issuePromises.push(issuePromise);
      }
      const vcs = await Promise.all(issuePromises);
      const docsPromises: Promise<
        WithCeramicId<CertificationVerifiableCredential>
      >[] = [];
      for (const vc of vcs) {
        const docPromise = createTileDoc<CertificationVerifiableCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          'CertificationSubject',
          ['vess', 'CertificationSubject']
        );
        docsPromises.push(docPromise);
      }
      const docs = await Promise.all(docsPromises);
      const docUrls = docs.map((doc) => doc.ceramicId);
      await setIDX<IssuedCertificationSubjects, 'IssuedCertificationSubjects'>(
        docUrls,
        this.ceramic,
        this.dataStore,
        'IssuedCertificationSubjects',
        'issued'
      );
      return {
        status: 200,
        docs: docUrls,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Work Credential',
        docs: [],
      };
    }
  };
}

let vessForNode: VessForNode;

export const getVESSForNode = (dev: boolean = false): VessForNode => {
  if (vessForNode) {
    return vessForNode;
  }
  console.log('vessForNode Initialized!', dev);
  const env = !dev ? 'mainnet' : 'testnet-clay';
  vessForNode = new VessForNode(env);
  return vessForNode;
};
