import {
  CustomResponse,
  EventAttendanceWithId,
  MembershipSubjectWithId,
  WorkCredentialWithId,
} from "./interface/index.js";
import { createTileDoc, getDataModel, setIDX } from "./utils/ceramicHelper.js";

import { CeramicClient } from "@ceramicnetwork/http-client";
import { DIDDataStore } from "@glazed/did-datastore";
import { WorkCredential } from "./__generated__/types/WorkCredential";
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from "./interface/eip712.js";
import { ethers } from "ethers";
import { DIDSession } from "did-session";
import { getTempAuthMethod } from "./utils/nodeHelper.js";
import { PROD_CERAMIC_URL, TESTNET_CERAMIC_URL, BaseVESS } from "./baseVess.js";
import {
  HeldWorkCredentials,
  IssuedEventAttendanceVerifiableCredentials,
  IssuedVerifiableMembershipSubjects,
} from "./__generated__/index.js";
import { SignSIWE } from "./interface/kms.js";

export class VessForNode extends BaseVESS {
  constructor(
    env: "mainnet" | "testnet-clay" = "mainnet",
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }

  connect = async (
    signer: ethers.Signer,
    env: "mainnet" | "testnet-clay" = "mainnet"
  ): Promise<DIDSession> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === "mainnet" ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
    const account = (await signer.getAddress()).toLowerCase();

    try {
      const authMethod = await getTempAuthMethod(
        account,
        "app.vess.id",
        async (message: string) => {
          return await signer.signMessage(message);
        }
      );

      const session = await DIDSession.authorize(authMethod, {
        resources: ["ceramic://*"],
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
      console.log(e);
      throw new Error("Error authorizing DID session.");
    }
  };
  connectWithKMS = async (
    account: string,
    signSIWE: SignSIWE,
    env: "mainnet" | "testnet-clay" = "mainnet"
  ): Promise<DIDSession> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === "mainnet" ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;

    try {
      const authMethod = await getTempAuthMethod(
        account.toLowerCase(),
        "app.vess.id",
        signSIWE
      );

      const session = await DIDSession.authorize(authMethod, {
        resources: ["ceramic://*"],
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
      console.log(e);
      throw new Error("Error authorizing DID session.");
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
        result: "You need to call connect first",
        streamId: undefined,
      };
    }
    try {
      const val: WorkCredentialWithId = await createTileDoc<WorkCredential>(
        credential,
        this.ceramic,
        this.dataModel,
        "WorkCredential",
        ["vess", "workCredential"]
      );
      if (!val.ceramicId) throw new Error("falild to create credentail");
      const storeIDX = setIDX<HeldWorkCredentials, "heldWorkCredentials">(
        [val.ceramicId],
        this.ceramic,
        this.dataStore,
        "heldWorkCredentials",
        "held"
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
        result: "Failed to Issue Work Credential",
        streamId: undefined,
      };
    }
  };

  issueMembershipSubject = async (
    vc: VerifiableMembershipSubjectCredential
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

  issueEventAttendanceCredentials = async (
    vcs: EventAttendanceVerifiableCredential[]
  ): Promise<CustomResponse<{ docs: EventAttendanceWithId[] }>> => {
    if (
      !this.ceramic ||
      !this.ceramic?.did?.parent ||
      !this.dataStore ||
      !this.backupDataStore
    ) {
      return {
        status: 300,
        result: "You need to call connect first",
        docs: [],
      };
    }
    try {
      const docsPromises: Promise<EventAttendanceWithId>[] = [];
      for (const vc of vcs) {
        const docPromise = createTileDoc<EventAttendanceVerifiableCredential>(
          vc,
          this.ceramic,
          this.dataModel,
          "EventAttendanceVerifiableCredential",
          ["vess", "eventAttendanceCredential"]
        );
        docsPromises.push(docPromise);
      }
      const docs = await Promise.all(docsPromises);
      const docUrls = docs.map((doc) => doc.ceramicId);
      await setIDX<
        IssuedEventAttendanceVerifiableCredentials,
        "IssuedEventAttendanceVerifiableCredentials"
      >(
        docUrls,
        this.ceramic,
        this.dataStore,
        "IssuedEventAttendanceVerifiableCredentials",
        "issued"
      );
      return {
        status: 200,
        docs,
      };
    } catch (error) {
      return {
        status: 300,
        error: error,
        result: "Failed to Issue Work Credential",
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
  console.log("vessForNode Initialized!", dev);
  const env = !dev ? "mainnet" : "testnet-clay";
  vessForNode = new VessForNode(env);
  return vessForNode;
};
