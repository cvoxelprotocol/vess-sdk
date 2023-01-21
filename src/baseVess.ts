import {
  BaseResponse,
  CustomResponse,
  EventAttendanceWithId,
  EventWithId,
  MembershipSubjectWithId,
  MembershipWithId,
  ModelTypes,
  OldOrganizationWIthId,
  OrganizationWIthId,
  VerifiableWorkCredentialWithId,
  WorkCredentialWithId,
} from "./interface/index.js";
import {
  createTileDoc,
  getDataModel,
  getIDXDocs,
  getTileDoc,
  setIDX,
  updateTileDoc,
} from "./utils/ceramicHelper.js";
import {
  convertDateToTimestampStr,
  removeUndefinedFromArray,
} from "./utils/common.js";

import { TileDocument } from "@ceramicnetwork/stream-tile";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { DIDDataStore } from "@glazed/did-datastore";
import { WorkCredential } from "./__generated__/types/WorkCredential";
import { ModelTypesToAliases } from "@glazed/types";
import { HeldWorkCredentials } from "./__generated__/types/HeldWorkCredentials";
import { CreatedOrganizations } from "./__generated__/types/CreatedOrganizations";
import { CreatedMemberships } from "./__generated__/types/CreatedMemberships";
import { IssuedVerifiableMembershipSubjects } from "./__generated__/types/IssuedVerifiableMembershipSubjects";
import { HeldVerifiableMembershipSubjects } from "./__generated__/types/HeldVerifiableMembershipSubjects";
import { IssuedEvents } from "./__generated__/types/IssuedEvents";
import { IssuedEventAttendanceVerifiableCredentials } from "./__generated__/types/IssuedEventAttendanceVerifiableCredentials.js";
import { HeldEventAttendanceVerifiableCredentials } from "./__generated__/types/HeldEventAttendanceVerifiableCredentials";
import { OldOrganization } from "./__generated__/types/OldOrganization";
import { Organization } from "./__generated__/types/Organization";
import { Membership } from "./__generated__/types/MemberShip";
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from "./interface/eip712.js";
import { BackupDataStore } from "./utils/backupDataStoreHelper.js";
import { DIDSession } from "did-session";
import { VerifiableWorkCredential } from "./__generated__/types/VerifiableWorkCredential";
import { HeldVerifiableWorkCredentials } from "./__generated__/types/HeldVerifiableWorkCredentials";
import { Event } from "./__generated__/types/Event";
import { CreatedOldOrganizations } from "./__generated__/types/CreatedOldOrganizations.js";

export const PROD_CERAMIC_URL = "https://prod.cvoxelceramic.com/";
export const TESTNET_CERAMIC_URL = "https://ceramic-clay.3boxlabs.com";
export const TESTNET_LOCAL_URL = "http://localhost:7007/";

export type AuthResponse = {
  session: DIDSession;
  ceramic: CeramicClient;
  env: "mainnet" | "testnet-clay";
};

export class BaseVESS {
  ceramic = undefined as CeramicClient | undefined;
  dataModel = getDataModel() as ModelTypesToAliases<ModelTypes>;
  dataStore = undefined as DIDDataStore<ModelTypes> | undefined;
  session = undefined as DIDSession | undefined;
  env = "mainnet" as "mainnet" | "testnet-clay";
  ceramicUrl = PROD_CERAMIC_URL as string;
  backupDataStore = undefined as BackupDataStore | undefined;

  constructor(
    env: "mainnet" | "testnet-clay" = "mainnet",
    ceramic?: CeramicClient
  ) {
    this.ceramic = ceramic;
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === "mainnet" ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
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

  /**
   * Get {streamId}'s tile doc
   * @param streamId
   * @returns WorkCredentialWithId | null
   */
  getWorkCredential = async (
    streamId?: string
  ): Promise<WorkCredentialWithId | null> => {
    if (!streamId) return null;
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const doc = await TileDocument.load<WorkCredential>(ceramic, streamId);
    const crdl: WorkCredentialWithId = {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
    return crdl;
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
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const doc = await TileDocument.load<VerifiableWorkCredential>(
      ceramic,
      streamId
    );
    const crdl: VerifiableWorkCredentialWithId = {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
    return crdl;
  };

  /**
   * Get {did}'s held work CRDLs
   * @param did
   * @returns WorkCredentialWithId[]
   */
  getHeldWorkCredentials = async (
    did?: string
  ): Promise<WorkCredentialWithId[]> => {
    if (!did || !this.dataModel) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    const HeldWorkCredentials = await dataStore.get<
      "heldWorkCredentials",
      HeldWorkCredentials
    >("heldWorkCredentials", did);
    if (!HeldWorkCredentials?.held) return [];
    const promiseArr = [];
    for (const id of HeldWorkCredentials.held) {
      const loadPromise = TileDocument.load<WorkCredential>(ceramic, id);
      promiseArr.push(loadPromise);
    }
    const res = await Promise.all(promiseArr);
    return res.map((r) => {
      const crdl: WorkCredentialWithId = {
        ...r.content,
        ceramicId: r.id.toString(),
      };
      return crdl;
    });
  };

  /**
   * Get {did}'s held verifiable work CRDLs
   * @param did
   * @returns WorkCredentialWithId[]
   */
  getHeldVerifiableWorkCredentials = async (
    did?: string
  ): Promise<VerifiableWorkCredentialWithId[]> => {
    if (!did || !this.dataModel) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    const HeldVerifiableWorkCredentials = await dataStore.get<
      "heldVerifiableWorkCredentials",
      HeldVerifiableWorkCredentials
    >("heldVerifiableWorkCredentials", did);
    if (!HeldVerifiableWorkCredentials?.held) return [];
    const promiseArr = [];
    for (const id of HeldVerifiableWorkCredentials.held) {
      const loadPromise = TileDocument.load<VerifiableWorkCredential>(
        ceramic,
        id
      );
      promiseArr.push(loadPromise);
    }
    const res = await Promise.all(promiseArr);
    return res.map((r) => {
      const crdl: VerifiableWorkCredentialWithId = {
        ...r.content,
        ceramicId: r.id.toString(),
      };
      return crdl;
    });
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
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    return await getIDXDocs<
      CreatedOrganizations,
      "CreatedOrganizations",
      Organization
    >(ceramic, dataStore, "CreatedOrganizations", did);
  };

  /**
   * Get {did}'s created orgs
   * @param did
   * @returns OrganizationWIthId[]
   */
  getCreatedOldOrganization = async (
    did?: string
  ): Promise<OldOrganizationWIthId[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    return await getIDXDocs<
      CreatedOldOrganizations,
      "CreatedOldOrganizations",
      OldOrganization
    >(ceramic, dataStore, "CreatedOldOrganizations", did);
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
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const doc = await TileDocument.load<Membership>(ceramic, streamId);
    const crdl: MembershipWithId = {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
    return crdl;
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
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const doc = await TileDocument.load<VerifiableMembershipSubjectCredential>(
      ceramic,
      streamId
    );
    const crdl: MembershipSubjectWithId = {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
    return crdl;
  };

  /**
   * Get {did}'s created memberships
   * @param did
   * @returns MembershipWithId[]
   */
  getCreatedMemberships = async (did?: string): Promise<MembershipWithId[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore ||
      new DIDDataStore({
        ceramic: ceramic,
        model: this.dataModel,
        id: did,
      });
    const CreatedMemberships = await dataStore.get<
      "CreatedMemberships",
      CreatedMemberships
    >("CreatedMemberships", did);
    const created = CreatedMemberships?.created ?? [];
    if (created.length === 0) return [];
    const arr: Promise<MembershipWithId | undefined>[] = [];
    for (const id of created) {
      const o = this.getMembership(id);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<MembershipWithId>(res);
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getIssuedMembershipSubjects = async (
    did?: string
  ): Promise<MembershipSubjectWithId[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore ||
      new DIDDataStore({
        ceramic: ceramic,
        model: this.dataModel,
        id: did,
      });
    const IssuedVerifiableMembershipSubjects = await dataStore.get<
      "IssuedVerifiableMembershipSubjects",
      IssuedVerifiableMembershipSubjects
    >("IssuedVerifiableMembershipSubjects", did);
    const issued = IssuedVerifiableMembershipSubjects?.issued ?? [];
    if (issued.length === 0) return [];
    const arr: Promise<MembershipSubjectWithId | undefined>[] = [];
    for (const id of issued) {
      const o = this.getVerifiableMembershipSubjectCredential(id);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<MembershipSubjectWithId>(res);
  };

  /**
   *
   * @param did
   * @returns MembershipSubjectWithId[]
   */
  getHeldMembershipSubjects = async (
    did?: string
  ): Promise<MembershipSubjectWithId[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore ||
      new DIDDataStore({
        ceramic: ceramic,
        model: this.dataModel,
        id: did,
      });
    const HeldMembershipSubjects = await dataStore.get<
      "HeldVerifiableMembershipSubjects",
      HeldVerifiableMembershipSubjects
    >("HeldVerifiableMembershipSubjects", did);
    const created = HeldMembershipSubjects?.held ?? [];
    if (created.length === 0) return [];
    const arr: Promise<MembershipSubjectWithId | undefined>[] = [];
    for (const id of created) {
      const o = this.getVerifiableMembershipSubjectCredential(id);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<MembershipSubjectWithId>(res);
  };

  /**
   * Get {streamId}'s Event
   * @param streamId
   * @returns EventWithId | undefined
   */
  getEvent = async (streamId?: string): Promise<EventWithId | undefined> => {
    if (!streamId) return undefined;
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const doc = await TileDocument.load<Event>(ceramic, streamId);
    const crdl: EventWithId = {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
    return crdl;
  };

  /**
   *
   * @param did
   * @returns EventWithId[]
   */
  getIssuedEvents = async (did?: string): Promise<EventWithId[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore ||
      new DIDDataStore({
        ceramic: ceramic,
        model: this.dataModel,
        id: did,
      });
    const IssuedEvents = await dataStore.get<"IssuedEvents", IssuedEvents>(
      "IssuedEvents",
      did
    );
    const issued = IssuedEvents?.issued ?? [];
    if (issued.length === 0) return [];
    const arr: Promise<EventWithId | undefined>[] = [];
    for (const id of issued) {
      const o = this.getEvent(id);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<EventWithId>(res);
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
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const doc = await TileDocument.load<EventAttendanceVerifiableCredential>(
      ceramic,
      streamId
    );
    const crdl: EventAttendanceWithId = {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
    return crdl;
  };

  /**
   *
   * @param did
   * @returns EventAttendanceWithId[]
   */
  getIssuedEventAttendanceVerifiableCredentials = async (
    did?: string
  ): Promise<EventAttendanceWithId[]> => {
    if (!did) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore ||
      new DIDDataStore({
        ceramic: ceramic,
        model: this.dataModel,
        id: did,
      });
    const IssuedEventAttendanceVerifiableCredentials = await dataStore.get<
      "IssuedEventAttendanceVerifiableCredentials",
      IssuedEventAttendanceVerifiableCredentials
    >("IssuedEventAttendanceVerifiableCredentials", did);
    const issued = IssuedEventAttendanceVerifiableCredentials?.issued ?? [];
    if (issued.length === 0) return [];
    const arr: Promise<EventAttendanceWithId | undefined>[] = [];
    for (const id of issued) {
      const o = this.getEventAttendance(id);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<EventAttendanceWithId>(res);
  };

  /**
   *
   * @param did
   * @returns EventAttendanceWithId[]
   */
  getHeldEventAttendanceVerifiableCredentials = async (
    did?: string
  ): Promise<EventAttendanceWithId[]> => {
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
      "HeldEventAttendanceVerifiableCredentials",
      HeldEventAttendanceVerifiableCredentials
    >("HeldEventAttendanceVerifiableCredentials", did);
    const created = HeldEventAttendanceVerifiableCredentials?.held ?? [];
    if (created.length === 0) return [];
    const arr: Promise<EventAttendanceWithId | undefined>[] = [];
    for (const id of created) {
      const o = this.getEventAttendance(id);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<EventAttendanceWithId>(res);
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
        result: "You need to call connect first",
        streamId: undefined,
      };
    }
    try {
      const val: VerifiableWorkCredentialWithId =
        await createTileDoc<VerifiableWorkCredential>(
          content,
          this.ceramic,
          this.dataModel,
          "VerifiableWorkCredential",
          ["vess", "VerifiableWorkCredential"]
        );
      const storeIDX = setIDX<
        HeldVerifiableWorkCredentials,
        "heldVerifiableWorkCredentials"
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "heldVerifiableWorkCredentials",
        "held"
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
        result: "Failed to Issue Work Credential",
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
        result: "You need to call connect first",
        streamId: undefined,
      };
    }
    try {
      const val: OrganizationWIthId = await createTileDoc<Organization>(
        content,
        this.ceramic,
        this.dataModel,
        "Organization",
        ["vess", "organization"]
      );
      const storeIDX = setIDX<CreatedOrganizations, "CreatedOrganizations">(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "CreatedOrganizations",
        "created"
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
        result: "Failed to Create Work space",
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
        result: "You need to call connect first",
        streamId: undefined,
      };
    }
    try {
      const val: MembershipWithId = await createTileDoc<Membership>(
        content,
        this.ceramic,
        this.dataModel,
        "MemberShip",
        ["vess", "membership"]
      );
      const storeIDX = setIDX<CreatedMemberships, "CreatedMemberships">(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "CreatedMemberships",
        "created"
      );
      const uploadBackup = this.backupDataStore.uploadMembership(val);
      await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: "Failed to Issue membership",
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
        result: "You need to call connect first",
        streamId: undefined,
      };
    }
    try {
      const val: EventWithId = await createTileDoc<Event>(
        content,
        this.ceramic,
        this.dataModel,
        "Event",
        ["vess", "event"]
      );
      const storeIDX = setIDX<IssuedEvents, "IssuedEvents">(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "IssuedEvents",
        "issued"
      );
      const uploadBackup = this.backupDataStore.uploadEvent(val);
      await Promise.all([storeIDX, uploadBackup]);
      return {
        status: 200,
        streamId: val.ceramicId,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: "Failed to Issue event",
        streamId: undefined,
      };
    }
  };

  setHeldMembershipSubjects = async (contentIds: string[]): Promise<void> => {
    if (!this.dataStore || !this.ceramic?.did?.parent) return;
    try {
      await setIDX<
        HeldVerifiableMembershipSubjects,
        "HeldVerifiableMembershipSubjects"
      >(
        contentIds,
        this.ceramic,
        this.dataStore,
        "HeldVerifiableMembershipSubjects",
        "held"
      );
    } catch (error) {
      console.error(error);
      throw new Error("Error setHeldMembershipSubjects");
    }
  };

  setHeldEventAttendanceVerifiableCredentials = async (
    contentIds: string[]
  ): Promise<void> => {
    if (!this.dataStore || !this.ceramic?.did?.parent) return;
    try {
      await setIDX<
        HeldEventAttendanceVerifiableCredentials,
        "HeldEventAttendanceVerifiableCredentials"
      >(
        contentIds,
        this.ceramic,
        this.dataStore,
        "HeldEventAttendanceVerifiableCredentials",
        "held"
      );
    } catch (error) {
      console.error(error);
      throw new Error("Error setHeldEventAttendanceVerifiableCredentials");
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
        result: "You need to call connect first",
      };
    }
    try {
      const nowTimestamp = convertDateToTimestampStr(new Date());
      const doc = await TileDocument.load<WorkCredential>(this.ceramic, id);
      await doc.update({ ...newItem, updatedAt: nowTimestamp });
      await this.backupDataStore.uploadCRDL({ ...newItem, ceramicId: id });
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: "Failed to Update Work Credential",
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
        result: "You need to call connect first",
      };
    }
    try {
      const doc = await TileDocument.load<Event>(this.ceramic, id);
      if (!doc.content) throw new Error(`No Item Found: ${id}`);
      await doc.update(newItem);
      await this.backupDataStore.uploadEvent({ ...newItem, ceramicId: id });
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: "Failed to Update Event",
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
        result: "You need to call connect first",
      };
    }
    try {
      await updateTileDoc<Organization>(this.ceramic, newItem);
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
        result: "Failed to Update Event",
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
        result: "You need to call connect first",
      };
    try {
      const heldWorkCredentials = await this.dataStore.get<
        "heldWorkCredentials",
        HeldWorkCredentials
      >("heldWorkCredentials", this.ceramic?.did?.parent);
      const workCRDLs = heldWorkCredentials?.held ?? [];
      const updatedCredentails = workCRDLs.filter(
        (c) => !contentIds.includes(c)
      );
      await this.dataStore.set("heldWorkCredentials", {
        held: updatedCredentails,
      });
      return {
        status: 200,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: "Failed to Delete Work Credential",
      };
    }
  };

  // ============================== For internal use ==============================

  getHeldWorkCredentialStreamIds = async (did?: string): Promise<string[]> => {
    if (!did || !this.dataModel) return [];
    const ceramic = this.ceramic || new CeramicClient(this.ceramicUrl);
    const dataStore =
      this.dataStore || new DIDDataStore({ ceramic, model: this.dataModel });
    const HeldWorkCredentials = await dataStore.get<
      "heldWorkCredentials",
      HeldWorkCredentials
    >("heldWorkCredentials", did);
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
      "HeldEventAttendanceVerifiableCredentials",
      HeldEventAttendanceVerifiableCredentials
    >("HeldEventAttendanceVerifiableCredentials", did);
    return !HeldEventAttendanceVerifiableCredentials?.held
      ? []
      : HeldEventAttendanceVerifiableCredentials?.held;
  };
}
