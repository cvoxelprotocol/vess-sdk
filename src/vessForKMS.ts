import {
  CustomResponse,
  EventAttendanceWithId,
  MembershipSubjectWithId,
} from "./interface/index.js";
import {
  createTileDoc,
  getDataModel,
  removeSession,
  setIDX,
} from "./utils/ceramicHelper.js";
import { _getEIP712WorkCredentialSubjectSignature } from "./utils/providerHelper.js";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { DIDDataStore } from "@glazed/did-datastore";
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from "./interface/eip712.js";
import { VerifiableMembershipSubject } from "./__generated__/types/VerifiableMembershipSubjectCredential";
import { EventAttendance } from "./__generated__/types/EventAttendanceVerifiableCredential";
import {
  AuthResponse,
  BaseVESS,
  PROD_CERAMIC_URL,
  TESTNET_CERAMIC_URL,
} from "./baseVess.js";
import { DIDSession } from "did-session";
import {
  IssuedEventAttendanceVerifiableCredentials,
  IssuedVerifiableMembershipSubjects,
} from "./__generated__/index.js";
import { createVerifiableCredential } from "./utils/credentialHelper.js";
import { VESS_CREDENTIALS } from "./constants/verifiableCredentials.js";

export type IsAuthentificatedProps = {
  isAuthentificated: boolean;
  session?: DIDSession;
  did?: string;
};

export class VessForKMS extends BaseVESS {
  account = undefined as string | undefined;

  constructor(
    env: "mainnet" | "testnet-clay" = "mainnet",
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }

  connect = async (
    sessionStr: string,
    account: string,
    env: "mainnet" | "testnet-clay" = "mainnet"
  ): Promise<AuthResponse> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === "mainnet" ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
    this.account = account;

    try {
      const session = await DIDSession.fromSession(sessionStr);
      console.log({ session });
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

  isAuthenticated = (): IsAuthentificatedProps => {
    return {
      isAuthentificated: !!this.session,
      session: this.session,
      did: this.ceramic?.did?.parent,
    };
  };

  // ============================== Issue ==============================

  issueMembershipSubject = async (
    address: string,
    credentialId: string,
    content: VerifiableMembershipSubject,
    sig: string
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
      const vc =
        await createVerifiableCredential<VerifiableMembershipSubjectCredential>(
          address,
          credentialId,
          VESS_CREDENTIALS.MEMBERSHIP,
          content,
          async () => {
            return sig;
          }
        );
      const val: MembershipSubjectWithId =
        await createTileDoc<VerifiableMembershipSubjectCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          "VerifiableMembershipSubjectCredential",
          ["vess", "membershipCredential"]
        );
      const storeIDX = setIDX<
        IssuedVerifiableMembershipSubjects,
        "IssuedVerifiableMembershipSubjects"
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "IssuedVerifiableMembershipSubjects",
        "issued"
      );
      const uploadBackup = this.backupDataStore.uploadMembershipSubject(val);
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

  issueEventAttendanceCredential = async (
    address: string,
    credentialId: string,
    content: EventAttendance,
    sig: string
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
      const vc =
        await createVerifiableCredential<EventAttendanceVerifiableCredential>(
          address,
          credentialId,
          VESS_CREDENTIALS.EVENT_ATTENDANCE,
          content,
          async () => {
            return sig;
          }
        );

      const val: EventAttendanceWithId =
        await createTileDoc<EventAttendanceVerifiableCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          "EventAttendanceVerifiableCredential",
          ["vess", "eventAttendanceCredential"]
        );
      const storeIDX = setIDX<
        IssuedEventAttendanceVerifiableCredentials,
        "IssuedEventAttendanceVerifiableCredentials"
      >(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "IssuedEventAttendanceVerifiableCredentials",
        "issued"
      );
      const uploadBackup = this.backupDataStore.uploadEventAttendance(val);
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
}

let vessForKMS: VessForKMS;

export const getVESSForKMS = (dev: boolean = false): VessForKMS => {
  if (vessForKMS) {
    return vessForKMS;
  }
  const env = !dev ? "mainnet" : "testnet-clay";
  vessForKMS = new VessForKMS(env);
  return vessForKMS;
};
