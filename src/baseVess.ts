import {
  Alias,
  BaseIDXType,
  BaseResponse,
  CustomResponse,
  EventAttendanceWithId,
  EventWithId,
  MembershipSubjectWithId,
  MembershipSubjectWithOrg,
  MembershipWithId,
  ModelTypes,
  OldOrganizationWIthId,
  OrganizationWIthId,
  VerifiableWorkCredentialWithId,
  WithCeramicId,
  WorkCredentialWithId,
} from './interface/index.js';
import {
  createTileDoc,
  deleteFromIDX,
  getDataModel,
  getIDXDocs,
  getTileDoc,
  getUniqueIDX,
  setIDX,
  setIDXWithBreaking,
  setUniqueIDX,
  updateTileDoc,
} from './utils/ceramicHelper.js';
import { convertDateToTimestampStr } from './utils/common.js';

import { TileDocument } from '@ceramicnetwork/stream-tile';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';
import { ModelTypesToAliases } from '@glazed/types';
import {
  Membership,
  CreatedMemberships,
  CreatedOrganizations,
  HeldWorkCredentials,
  WorkCredential,
  Organization,
  OldOrganization,
  HeldEventAttendanceVerifiableCredentials,
  IssuedEventAttendanceVerifiableCredentials,
  IssuedEvents,
  HeldVerifiableMembershipSubjects,
  IssuedVerifiableMembershipSubjects,
  BusinessProfile,
  CreatedOldOrganizations,
  SocialLinks,
  HighlightedCredentials,
  HeldSelfClaimedMembershipSubjects,
  SelfClaimedMembershipSubject,
  HeldVerifiableWorkCredentials,
  VerifiableWorkCredential,
  Event,
  TaskCredential,
  HeldTaskCredentials,
} from './__generated__/index.js';
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from './interface/eip712.js';
import { BackupDataStore } from './utils/backupDataStoreHelper.js';
import { DIDSession } from 'did-session';

export const PROD_CERAMIC_URL = 'https://prod.cvoxelceramic.com/';
export const TESTNET_CERAMIC_URL = 'https://ceramic-clay.3boxlabs.com';
export const TESTNET_LOCAL_URL = 'http://localhost:7007/';

export type AuthResponse = {
  session: DIDSession;
  ceramic: CeramicClient;
  env: 'mainnet' | 'testnet-clay';
};

export class BaseVESS {
  ceramic = undefined as CeramicClient | undefined;
  dataModel = getDataModel() as ModelTypesToAliases<ModelTypes>;
  dataStore = undefined as DIDDataStore<ModelTypes> | undefined;
  session = undefined as DIDSession | undefined;
  env = 'mainnet' as 'mainnet' | 'testnet-clay';
  ceramicUrl = PROD_CERAMIC_URL as string;
  backupDataStore = undefined as BackupDataStore | undefined;

  constructor(
    env: 'mainnet' | 'testnet-clay' = 'mainnet',
    ceramic?: CeramicClient
  ) {
    this.ceramic = ceramic;
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
    if (ceramic) {
      if (this.ceramic?.did?.parent) {
        this.dataStore = new DIDDataStore({
          ceramic: ceramic,
          model: this.dataModel,
          id: this.ceramic?.did?.parent,
        });
      }
    } else {
      this.ceramic = new CeramicClient(this.ceramicUrl);
    }
    this.backupDataStore = new BackupDataStore(this.env);
  }

  isAuthenticated = (): boolean => {
    return (
      !!this.session &&
      !!this.ceramic?.did?.parent &&
      this.session.hasSession &&
      !this.session.isExpired
    );
  };

  // ============================== Read ==============================

  private getIDX = async <T extends BaseIDXType, K extends Alias, U>(
    modelName: K,
    did?: string
  ): Promise<WithCeramicId<U>[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    return await getIDXDocs<T, K, U>(ceramic, dataStore, modelName, did);
  };

  /**
   * Get {streamId}'s tile doc
   * @param streamId
   * @returns WorkCredentialWithId | null
   */
  getWorkCredential = async (
    streamId?: string
  ): Promise<WorkCredentialWithId | null> => {
    if (!streamId) return null;
    return await getTileDoc<WorkCredentialWithId>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   * Get {streamId}'s tile doc
   * @param streamId
   * @returns WorkCredentialWithId | null
   */
  getTaskCredential = async (
    streamId?: string
  ): Promise<WithCeramicId<TaskCredential> | null> => {
    if (!streamId) return null;
    return await getTileDoc<TaskCredential>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   * Get {streamId}'s tile doc
   * @param streamId
   * @returns VerifiableWorkCredentialWithId | null
   */
  getVerifiableWorkCredential = async (
    streamId?: string
  ): Promise<VerifiableWorkCredentialWithId | null> => {
    if (!streamId) return null;
    return await getTileDoc<VerifiableWorkCredential>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   * Get {did}'s held work CRDLs
   * @param did
   * @returns WorkCredentialWithId[]
   */
  getHeldWorkCredentials = async (
    did?: string
  ): Promise<WorkCredentialWithId[]> => {
    return await this.getIDX<
      HeldWorkCredentials,
      'heldWorkCredentials',
      WorkCredential
    >('heldWorkCredentials', did);
  };

  /**
   * Get {did}'s held verifiable work CRDLs
   * @param did
   * @returns WorkCredentialWithId[]
   */
  getHeldVerifiableWorkCredentials = async (
    did?: string
  ): Promise<VerifiableWorkCredentialWithId[]> => {
    return await this.getIDX<
      HeldVerifiableWorkCredentials,
      'heldVerifiableWorkCredentials',
      VerifiableWorkCredential
    >('heldVerifiableWorkCredentials', did);
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getHeldTaskCredentials = async (
    did?: string
  ): Promise<WithCeramicId<TaskCredential>[]> => {
    if (!did) return [];
    return await this.getIDX<
      HeldTaskCredentials,
      'HeldTaskCredentials',
      TaskCredential
    >('HeldTaskCredentials', did);
  };

  /**
   * Get {did}'s business profile
   * @param did
   * @returns BusinessProfile
   */
  getBusinessProfile = async (
    did?: string
  ): Promise<BusinessProfile | null> => {
    if (!did) return null;
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    return await getUniqueIDX<BusinessProfile, 'BusinessProfile'>(
      dataStore,
      'BusinessProfile',
      did
    );
  };

  /**
   * Get {did}'s business profile
   * @param did
   * @returns BusinessProfile
   */
  getSocialLinks = async (did?: string): Promise<SocialLinks | null> => {
    if (!did) return null;
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    return await getUniqueIDX<SocialLinks, 'SocialLinks'>(
      dataStore,
      'SocialLinks',
      did
    );
  };
  /**
   * Get {did}'s business profile
   * @param did
   * @returns BusinessProfile
   */
  getHighlightedCredentials = async (
    did?: string
  ): Promise<HighlightedCredentials | null> => {
    if (!did) return null;
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    return await getUniqueIDX<HighlightedCredentials, 'HighlightedCredentials'>(
      dataStore,
      'HighlightedCredentials',
      did
    );
  };

  /**
   * Get {streamId}'s orgs
   * @param streamId
   * @returns OrganizationWIthId | undefined
   */
  getOrganization = async (
    streamId?: string
  ): Promise<OrganizationWIthId | undefined> => {
    if (!streamId) return undefined;
    return await getTileDoc<Organization>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   * Get {streamId}'s orgs
   * @param streamId
   * @returns OrganizationWIthId | undefined
   */
  getOldOrganization = async (
    streamId?: string
  ): Promise<OldOrganizationWIthId | undefined> => {
    if (!streamId) return undefined;
    return await getTileDoc<OldOrganization>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   * Get {did}'s created orgs
   * @param did
   * @returns OrganizationWIthId[]
   */
  getCreatedOrganization = async (
    did?: string
  ): Promise<OrganizationWIthId[]> => {
    return await this.getIDX<
      CreatedOrganizations,
      'CreatedOrganizations',
      Organization
    >('CreatedOrganizations', did);
  };

  /**
   * Get {did}'s created orgs
   * @param did
   * @returns OrganizationWIthId[]
   */
  getCreatedOldOrganization = async (
    did?: string
  ): Promise<OldOrganizationWIthId[]> => {
    return await this.getIDX<
      CreatedOldOrganizations,
      'CreatedOldOrganizations',
      OldOrganization
    >('CreatedOldOrganizations', did);
  };

  /**
   * Get {streamId}'s Membership
   * @param streamId
   * @returns MembershipWithId | undefined
   */
  getMembership = async (
    streamId?: string
  ): Promise<MembershipWithId | undefined> => {
    if (!streamId) return undefined;
    return await getTileDoc<Membership>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   * Get {did}'s created memberships
   * @param did
   * @returns MembershipWithId[]
   */
  getCreatedMemberships = async (did?: string): Promise<MembershipWithId[]> => {
    return await this.getIDX<
      CreatedMemberships,
      'CreatedMemberships',
      Membership
    >('CreatedMemberships', did);
  };

  /**
   * Get {streamId}'s VerifiableMembershipSubjectCredential
   * @param streamId
   * @returns MembershipSubjectWithId | undefined
   */
  getVerifiableMembershipSubjectCredential = async (
    streamId?: string
  ): Promise<MembershipSubjectWithId | undefined> => {
    if (!streamId) return undefined;
    return await getTileDoc<VerifiableMembershipSubjectCredential>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getIssuedMembershipSubjects = async (
    did?: string
  ): Promise<MembershipSubjectWithId[]> => {
    return await this.getIDX<
      IssuedVerifiableMembershipSubjects,
      'IssuedVerifiableMembershipSubjects',
      VerifiableMembershipSubjectCredential
    >('IssuedVerifiableMembershipSubjects', did);
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getHeldMembershipSubjects = async (
    did?: string
  ): Promise<MembershipSubjectWithOrg[]> => {
    const res = await this.getIDX<
      HeldVerifiableMembershipSubjects,
      'HeldVerifiableMembershipSubjects',
      VerifiableMembershipSubjectCredential
    >('HeldVerifiableMembershipSubjects', did);
    let membershipSubjectWithOrgsPromises: Promise<MembershipSubjectWithOrg>[] =
      [];
    for (const m of res) {
      const promise = this.getMembershipSubjectWithOrg(m);
      membershipSubjectWithOrgsPromises.push(promise);
    }
    return await Promise.all(membershipSubjectWithOrgsPromises);
  };

  getMembershipSubjectWithOrg = async (
    m: MembershipSubjectWithId
  ): Promise<MembershipSubjectWithOrg> => {
    const org = await this.getOrganization(m.credentialSubject.organizationId);
    return { ...m, workspace: org };
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getHeldMembershipSubjectsFromBackup = async (
    did?: string
  ): Promise<MembershipSubjectWithId[]> => {
    if (!this.backupDataStore) {
      console.log('you have to initialize backupDataStore');
      return [];
    }
    return await this.backupDataStore.getHeldMembershipSubjectsFromDB(did);
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getHeldSelfClaimedMembershipSubjects = async (
    did?: string
  ): Promise<WithCeramicId<SelfClaimedMembershipSubject>[]> => {
    if (!did) return [];
    return await this.getIDX<
      HeldSelfClaimedMembershipSubjects,
      'HeldSelfClaimedMembershipSubjects',
      SelfClaimedMembershipSubject
    >('HeldSelfClaimedMembershipSubjects', did);
  };

  /**
   * Get {streamId}'s Event
   * @param streamId
   * @returns EventWithId | undefined
   */
  getEvent = async (streamId?: string): Promise<EventWithId | undefined> => {
    if (!streamId) return undefined;
    return await getTileDoc<Event>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   *
   * @param did
   * @returns EventWithId[]
   */
  getIssuedEvents = async (did?: string): Promise<EventWithId[]> => {
    if (!did) return [];
    return await this.getIDX<IssuedEvents, 'IssuedEvents', Event>(
      'IssuedEvents',
      did
    );
  };

  /**
   * Get {streamId}'s Event Attendance
   * @param streamId
   * @returns EventAttendanceWithId | undefined
   */
  getEventAttendance = async (
    streamId?: string
  ): Promise<EventAttendanceWithId | undefined> => {
    if (!streamId) return undefined;
    return await getTileDoc<EventAttendanceVerifiableCredential>(
      streamId,
      this.ceramic || new CeramicClient(this.ceramicUrl)
    );
  };

  /**
   *
   * @param did
   * @returns EventAttendanceWithId[]
   */
  getIssuedEventAttendanceVerifiableCredentials = async (
    did?: string
  ): Promise<EventAttendanceWithId[]> => {
    return await this.getIDX<
      IssuedEventAttendanceVerifiableCredentials,
      'IssuedEventAttendanceVerifiableCredentials',
      EventAttendanceVerifiableCredential
    >('IssuedEventAttendanceVerifiableCredentials', did);
  };

  /**
   *
   * @param did
   * @returns EventAttendanceWithId[]
   */
  getHeldEventAttendanceVerifiableCredentials = async (
    did?: string
  ): Promise<EventAttendanceWithId[]> => {
    return await this.getIDX<
      HeldEventAttendanceVerifiableCredentials,
      'HeldEventAttendanceVerifiableCredentials',
      EventAttendanceVerifiableCredential
    >('HeldEventAttendanceVerifiableCredentials', did);
  };

  /**
   *
   * @param did
   * @returns EventAttendanceWithId[]
   */
  getHeldEventAttendanceVerifiableCredentialsFromBackup = async (
    did?: string
  ): Promise<EventAttendanceWithId[]> => {
    if (!this.backupDataStore) {
      console.log('you have to initialize backupDataStore');
      return [];
    }
    return await this.backupDataStore.getHeldEventAttendanceFromDB(did);
  };

  // ============================== Issue ==============================

  /**
   * issue verifiable work credential to Ceramic
   * @param content
   * @returns streamid
   */
  issueVerifiableWorkCredential = async (
    content: VerifiableWorkCredential
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
      const val: VerifiableWorkCredentialWithId =
        await createTileDoc<VerifiableWorkCredential>(
          content,
          this.ceramic,
          this.dataModel,
          'VerifiableWorkCredential',
          ['vess', 'VerifiableWorkCredential']
        );
      const storeIDX = setIDX<
        HeldVerifiableWorkCredentials,
        'heldVerifiableWorkCredentials'
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'heldVerifiableWorkCredentials',
        'held'
      );
      const uploadBackup =
        this.backupDataStore.uploadVerifiableWorkCredential(val);
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

  /**
   * create Organization to Ceramic
   * @param content
   * @returns streamid
   */
  createOrganization = async (
    content: Organization,
    saveBackup: boolean = true
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const val: OrganizationWIthId = await createTileDoc<Organization>(
        content,
        this.ceramic,
        this.dataModel,
        'Organization',
        ['vess', 'organization']
      );
      const storeIDX = setIDX<CreatedOrganizations, 'CreatedOrganizations'>(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'CreatedOrganizations',
        'created'
      );
      if (saveBackup) {
        const uploadBackup = this.backupDataStore.uploadOrg(val);
        await Promise.all([storeIDX, uploadBackup]);
      }
      await Promise.all([storeIDX]);
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Create Work space',
        streamId: undefined,
      };
    }
  };

  createMembership = async (
    content: Membership
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const val: MembershipWithId = await createTileDoc<Membership>(
        content,
        this.ceramic,
        this.dataModel,
        'MemberShip',
        ['vess', 'membership']
      );
      await setIDX<CreatedMemberships, 'CreatedMemberships'>(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'CreatedMemberships',
        'created'
      );
      // const uploadBackup = this.backupDataStore.uploadMembership(val);
      // await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue membership',
        streamId: undefined,
      };
    }
  };

  createEvent = async (
    content: Event
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const val: EventWithId = await createTileDoc<Event>(
        content,
        this.ceramic,
        this.dataModel,
        'Event',
        ['vess', 'event']
      );
      await setIDX<IssuedEvents, 'IssuedEvents'>(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'IssuedEvents',
        'issued'
      );
      // const uploadBackup = this.backupDataStore.uploadEvent(val);
      // await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue event',
        streamId: undefined,
      };
    }
  };

  setHeldMembershipSubjects = async (contentIds: string[]): Promise<void> => {
    if (!this.dataStore || !this.ceramic?.did?.parent) return;
    try {
      await setIDX<
        HeldVerifiableMembershipSubjects,
        'HeldVerifiableMembershipSubjects'
      >(
        contentIds,
        this.ceramic,
        this.dataStore,
        'HeldVerifiableMembershipSubjects',
        'held'
      );
    } catch (error) {
      console.error(error);
      throw new Error('Error setHeldMembershipSubjects');
    }
  };
  setHeldMembershipSubjectsWithBreaking = async (
    contentIds: string[]
  ): Promise<void> => {
    if (!this.dataStore || !this.ceramic?.did?.parent) return;
    try {
      await setIDXWithBreaking<'HeldVerifiableMembershipSubjects'>(
        contentIds,
        this.ceramic,
        this.dataStore,
        'HeldVerifiableMembershipSubjects',
        'held'
      );
    } catch (error) {
      console.error(error);
      throw new Error('Error setHeldMembershipSubjects');
    }
  };

  setHeldEventAttendanceVerifiableCredentials = async (
    contentIds: string[]
  ): Promise<void> => {
    if (!this.dataStore || !this.ceramic?.did?.parent) return;
    try {
      await setIDX<
        HeldEventAttendanceVerifiableCredentials,
        'HeldEventAttendanceVerifiableCredentials'
      >(
        contentIds,
        this.ceramic,
        this.dataStore,
        'HeldEventAttendanceVerifiableCredentials',
        'held'
      );
    } catch (error) {
      console.error(error);
      throw new Error('Error setHeldEventAttendanceVerifiableCredentials');
    }
  };

  createTask = async (
    content: TaskCredential
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const val = await createTileDoc<TaskCredential>(
        content,
        this.ceramic,
        this.dataModel,
        'TaskCredential',
        ['vess', 'task']
      );
      await setIDX<HeldTaskCredentials, 'HeldTaskCredentials'>(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'HeldTaskCredentials',
        'held'
      );
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to create Task',
        streamId: undefined,
      };
    }
  };

  createBusinessProfile = async (
    content: BusinessProfile
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const setTile = createTileDoc<BusinessProfile>(
        content,
        this.ceramic,
        this.dataModel,
        'BusinessProfile',
        ['vess', 'businessProfile']
      );
      const storeIDX = setUniqueIDX<BusinessProfile, 'BusinessProfile'>(
        content,
        this.ceramic,
        this.dataStore,
        'BusinessProfile'
      );
      const res = await Promise.all([setTile, storeIDX]);
      return {
        status: 200,
        streamId: res[0].ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue event',
        streamId: undefined,
      };
    }
  };

  storeSocialLinks = async (
    content: SocialLinks
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const setTile = createTileDoc<SocialLinks>(
        content,
        this.ceramic,
        this.dataModel,
        'SocialLinks',
        ['vess', 'SocialLinks']
      );
      const storeIDX = setUniqueIDX<SocialLinks, 'SocialLinks'>(
        content,
        this.ceramic,
        this.dataStore,
        'SocialLinks'
      );
      const res = await Promise.all([setTile, storeIDX]);
      return {
        status: 200,
        streamId: res[0].ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue event',
        streamId: undefined,
      };
    }
  };

  storeHighlightedCredentials = async (
    content: HighlightedCredentials
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const setTile = createTileDoc<HighlightedCredentials>(
        content,
        this.ceramic,
        this.dataModel,
        'HighlightedCredentials',
        ['vess', 'HighlightedCredentials']
      );
      const storeIDX = setUniqueIDX<
        HighlightedCredentials,
        'HighlightedCredentials'
      >(content, this.ceramic, this.dataStore, 'HighlightedCredentials');
      const res = await Promise.all([setTile, storeIDX]);
      return {
        status: 200,
        streamId: res[0].ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue event',
        streamId: undefined,
      };
    }
  };

  createSelfClaimedMembershipSubject = async (
    content: SelfClaimedMembershipSubject
  ): Promise<CustomResponse<{ streamId: string | undefined }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: 'You need to call connect first',
        streamId: undefined,
      };
    }
    try {
      const val: WithCeramicId<SelfClaimedMembershipSubject> =
        await createTileDoc<SelfClaimedMembershipSubject>(
          content,
          this.ceramic,
          this.dataModel,
          'SelfClaimedMembershipSubject',
          ['vess', 'membership', 'self-claimed']
        );
      await setIDX<
        HeldSelfClaimedMembershipSubjects,
        'HeldSelfClaimedMembershipSubjects'
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        'HeldSelfClaimedMembershipSubjects',
        'held'
      );
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Issue Credentials',
        streamId: undefined,
      };
    }
  };

  // ============================== Update ==============================

  /**
   * Update Work Credential
   * @param id
   * @param newItem
   * @returns
   */
  updateWorkCredential = async (
    id: string,
    newItem: WorkCredential
  ): Promise<BaseResponse> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.backupDataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
      };
    }
    try {
      const nowTimestamp = convertDateToTimestampStr(new Date());
      const doc = await TileDocument.load<WorkCredential>(this.ceramic, id, {
        sync: 1,
      });
      await doc.update({ ...newItem, updatedAt: nowTimestamp });
      await this.backupDataStore.uploadCRDL({ ...newItem, ceramicId: id });
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Update Work Credential',
      };
    }
  };

  /**
   * Update Event
   * @param id
   * @param newItem
   * @returns
   */
  updateEvent = async (id: string, newItem: Event): Promise<BaseResponse> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.backupDataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
      };
    }
    try {
      const doc = await TileDocument.load<Event>(this.ceramic, id, { sync: 1 });
      if (!doc.content) throw new Error(`No Item Found: ${id}`);
      await doc.update(newItem);
      // await this.backupDataStore.uploadEvent({ ...newItem, ceramicId: id });
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Update Event',
      };
    }
  };

  /**
   * Update Org
   * @param id
   * @param newItem
   * @returns
   */
  updateOrganization = async (
    newItem: OrganizationWIthId,
    saveBackup: boolean = true
  ): Promise<BaseResponse> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.backupDataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
      };
    }
    try {
      const { ceramicId, ...content } = newItem;
      await updateTileDoc<Organization>(this.ceramic, ceramicId, content);
      if (saveBackup) {
        await this.backupDataStore.uploadOrg({ ...newItem });
      }
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Update Event',
      };
    }
  };

  updateTask = async (
    newItem: WithCeramicId<TaskCredential>
  ): Promise<BaseResponse> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.backupDataStore) {
      return {
        status: 300,
        result: 'You need to call connect first',
      };
    }
    try {
      const { ceramicId, ...content } = newItem;
      await updateTileDoc<TaskCredential>(this.ceramic, ceramicId, content);
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Update Task',
      };
    }
  };

  // ============================== Delete ==============================

  /**
   * Delete work credential
   * @param contentIds
   * @returns
   */
  deleteWorkCredential = async (
    contentIds: string[]
  ): Promise<BaseResponse> => {
    if (!this.dataStore || !this.ceramic?.did?.parent)
      return {
        status: 300,
        result: 'You need to call connect first',
      };
    try {
      const heldWorkCredentials = await this.dataStore.get<
        'heldWorkCredentials',
        HeldWorkCredentials
      >('heldWorkCredentials', this.ceramic?.did?.parent);
      const workCRDLs = heldWorkCredentials?.held ?? [];
      const updatedCredentails = workCRDLs.filter(
        (c) => !contentIds.includes(c)
      );
      await this.dataStore.set('heldWorkCredentials', {
        held: updatedCredentails,
      });
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: 'Failed to Delete Work Credential',
      };
    }
  };

  deleteHeldMembershipSubjectsFromIDX = async (
    streamId: string
  ): Promise<BaseResponse> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }
    try {
      await deleteFromIDX<
        HeldVerifiableMembershipSubjects,
        'HeldVerifiableMembershipSubjects'
      >(
        streamId,
        this.ceramic,
        this.dataStore,
        'HeldVerifiableMembershipSubjects',
        'held'
      );
      return {
        status: 200,
      };
    } catch (error) {
      throw new Error(`Failed to Issue Credential:${error}`);
    }
  };
  deleteHeldEventAttendanceFromIDX = async (
    streamId: string
  ): Promise<BaseResponse> => {
    if (!this.ceramic || !this.ceramic?.did?.parent || !this.dataStore) {
      throw new Error(
        `You need to call connect first: ${this.ceramic} | ${this.dataStore}`
      );
    }
    try {
      await deleteFromIDX<
        HeldEventAttendanceVerifiableCredentials,
        'HeldEventAttendanceVerifiableCredentials'
      >(
        streamId,
        this.ceramic,
        this.dataStore,
        'HeldEventAttendanceVerifiableCredentials',
        'held'
      );
      return {
        status: 200,
      };
    } catch (error) {
      throw new Error(`Failed to Issue Credential:${error}`);
    }
  };

  // ============================== For internal use ==============================

  getHeldWorkCredentialStreamIds = async (did?: string): Promise<string[]> => {
    if (!did || !this.dataModel) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    const HeldWorkCredentials = await dataStore.get<
      'heldWorkCredentials',
      HeldWorkCredentials
    >('heldWorkCredentials', did);
    return !HeldWorkCredentials?.held ? [] : HeldWorkCredentials?.held;
  };

  getHeldEventAttendanceVerifiableCredentialStreamIds = async (
    did?: string
  ): Promise<string[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore ||
      new DIDDataStore({
        ceramic: ceramic,
        model: this.dataModel,
        id: did,
      });
    const HeldEventAttendanceVerifiableCredentials = await dataStore.get<
      'HeldEventAttendanceVerifiableCredentials',
      HeldEventAttendanceVerifiableCredentials
    >('HeldEventAttendanceVerifiableCredentials', did);
    return !HeldEventAttendanceVerifiableCredentials?.held
      ? []
      : HeldEventAttendanceVerifiableCredentials?.held;
  };
}
