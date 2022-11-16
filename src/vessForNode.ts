import {
  CustomResponse,
  EventAttendanceWithId,
  MembershipSubjectWithId,
  WorkCredentialWithId,
} from "./interface/index.js";
import {
  createTileDocument,
  getDataModel,
  getSchema,
} from "./utils/ceramicHelper.js";

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

export class VessForNode extends BaseVESS {
  signer = undefined as ethers.Wallet | undefined;

  constructor(
    env: "mainnet" | "testnet-clay" = "mainnet",
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }

  connect = async (
    signer: ethers.Wallet,
    env: "mainnet" | "testnet-clay" = "mainnet"
  ): Promise<DIDSession> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === "mainnet" ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;
    const account = (await signer.getAddress()).toLowerCase();

    try {
      const authMethod = await getTempAuthMethod(
        account.toLowerCase(),
        "app.vess.id",
        signer
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
      const doc = await this.createWorkCredential(credential);
      const docUrl = doc.id.toUrl();
      const crdl: WorkCredentialWithId = { ...credential, backupId: docUrl };
      const setHeldWC = this.setHeldWorkCredentials([docUrl]);
      const uploadBackup = this.backupDataStore.uploadCRDL(crdl);
      await Promise.all([setHeldWC, uploadBackup]);
      return {
        status: 200,
        streamId: docUrl,
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
      const doc =
        await createTileDocument<VerifiableMembershipSubjectCredential>(
          this.ceramic,
          this.ceramic?.did?.parent,
          vc,
          getSchema(this.dataModel, "VerifiableMembershipSubjectCredential"),
          ["vess", "membershipCredential"]
        );
      const docUrl = doc.id.toUrl();
      const val: MembershipSubjectWithId = { ...vc, ceramicId: docUrl };
      const setOrgs = this.setIssuedMembershipSubjects(docUrl);
      const uploadBackup = this.backupDataStore.uploadMembershipSubject(val);
      await Promise.all([setOrgs, uploadBackup]);
      return {
        status: 200,
        streamId: docUrl,
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
        const docPromise = this.storeEventAttendanceOnCeramic(vc);
        docsPromises.push(docPromise);
      }
      const docs = await Promise.all(docsPromises);
      const docUrls = docs.map((doc) => doc.ceramicId);
      const setIssued =
        this.setIssuedEventAttendanceVerifiableCredentials(docUrls);
      await Promise.all([setIssued]);
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

  storeEventAttendanceOnCeramic = async (
    vc: EventAttendanceVerifiableCredential
  ): Promise<EventAttendanceWithId> => {
    if (!this.ceramic || !this.ceramic.did?.parent)
      throw new Error("You need to call connect first");
    const doc = await createTileDocument<EventAttendanceVerifiableCredential>(
      this.ceramic,
      this.ceramic?.did?.parent,
      vc,
      getSchema(this.dataModel, "EventAttendanceVerifiableCredential"),
      ["vess", "eventAttendanceCredential"]
    );
    const id = doc.id.toUrl();
    return { ...doc.content, ceramicId: id };
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
