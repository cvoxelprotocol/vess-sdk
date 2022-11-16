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
  loadSession,
  removeSession,
} from "./utils/ceramicHelper.js";
import { convertDateToTimestampStr, isMobileOrTablet } from "./utils/common.js";
import {
  createEIP712WorkCredential,
  createEventAttendanceCredential,
  createVerifiableMembershipSubjectCredential,
  safeSend,
  _getEIP712WorkCredentialSubjectSignature,
} from "./utils/providerHelper.js";

import { Web3Provider, ExternalProvider } from "@ethersproject/providers";
import { EthereumWebAuth, getAccountId } from "@didtools/pkh-ethereum";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { DIDDataStore } from "@glazed/did-datastore";
import {
  WorkCredential,
  WorkSubject,
} from "./__generated__/types/WorkCredential";
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from "./interface/eip712.js";
import { VerifiableMembershipSubject } from "./__generated__/types/VerifiableMembershipSubjectCredential";
import { EventAttendance } from "./__generated__/types/EventAttendanceVerifiableCredential";
import { ethers } from "ethers";
import {
  AuthResponse,
  BaseVESS,
  PROD_CERAMIC_URL,
  TESTNET_CERAMIC_URL,
} from "./baseVess.js";
import { issueEventAttendancesParam } from "./utils/backupDataStoreHelper.js";

export class VESS extends BaseVESS {
  provider = undefined as Web3Provider | undefined;

  constructor(
    env: "mainnet" | "testnet-clay" = "mainnet",
    ceramic?: CeramicClient
  ) {
    super(env, ceramic);
  }

  connect = async (
    provider?: ExternalProvider,
    env: "mainnet" | "testnet-clay" = "mainnet"
  ): Promise<AuthResponse> => {
    this.dataModel = getDataModel(env);
    this.env = env;
    this.ceramicUrl =
      this.env === "mainnet" ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL;

    if (!provider) {
      if ((window as any).ethereum) {
        console.log(
          "VESS SDK: You need to pass the provider as an argument in the `connect()` function. We will be using window.ethereum by default."
        );
        provider = (window as any).ethereum;
      }
    }
    if (!provider) {
      throw new Error(
        "An ethereum provider is required to proceed with the connection to Ceramic."
      );
    }

    this.provider = new ethers.providers.Web3Provider(provider, 1);
    try {
      if (!isMobileOrTablet()) {
        await safeSend(this.provider, "eth_requestAccounts", []);
      }
    } catch (e) {
      console.log(e);
      throw new Error(
        `Error enabling Ethereum provider. Message: ${JSON.stringify(e)}`
      );
    }
    const signer = this.provider.getSigner();
    const account = (await signer.getAddress()).toLowerCase();

    try {
      const accountId = await getAccountId(
        this.provider.provider,
        account.toLowerCase()
      );
      const authMethod = await EthereumWebAuth.getAuthMethod(
        this.provider.provider,
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
      throw new Error("Error authorizing DID session.");
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
        result: "You need to call connect first",
        streamId: undefined,
      };
    }
    try {
      const credential = await createEIP712WorkCredential(
        this.ceramic?.did?.parent,
        content,
        this.provider
      );
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
    content: VerifiableMembershipSubject
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
      // TODO: sign and create verifiable credential before save data
      const vc = await createVerifiableMembershipSubjectCredential(
        content,
        this.provider
      );
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

  issueEventAttendanceCredential = async (
    content: EventAttendance
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
      // TODO: sign and create verifiable credential before save data
      const vc = await createEventAttendanceCredential(content, this.provider);

      const doc = await createTileDocument<EventAttendanceVerifiableCredential>(
        this.ceramic,
        this.ceramic?.did?.parent,
        vc,
        getSchema(this.dataModel, "EventAttendanceVerifiableCredential"),
        ["vess", "eventAttendanceCredential"]
      );
      const docUrl = doc.id.toUrl();
      const val: EventAttendanceWithId = { ...vc, ceramicId: docUrl };
      const setIssued = this.setIssuedEventAttendanceVerifiableCredentials([
        docUrl,
      ]);
      const uploadBackup = this.backupDataStore.uploadEventAttendance(val);
      await Promise.all([setIssued, uploadBackup]);
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

  issueEventAttendancesFromProxy = async (
    param: issueEventAttendancesParam
  ): Promise<{ [x: string]: string | string[] }> => {
    if (!this.backupDataStore) throw new Error("you need to initialize first");
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
    await this.backupDataStore.uploadCRDL({ ...crdl, backupId: id });
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
  const env = !dev ? "mainnet" : "testnet-clay";
  vess = new VESS(env);
  return vess;
};
