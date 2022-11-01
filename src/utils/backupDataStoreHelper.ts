import firebase, { initializeApp, getApps } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore/lite";
import { Functions, getFunctions, httpsCallable } from "firebase/functions";
import {
  EventAttendanceWithId,
  EventWithId,
  MembershipSubjectWithId,
  MembershipWithId,
  OrganizationWIthId,
  VerifiableWorkCredentialWithId,
  WorkCredentialWithId,
} from "../interface";
import { removeCeramicPrefix } from "./ceramicHelper";

const devConfig = {
  apiKey: "AIzaSyDM6_03vyBSTw1tqVEo8c-6aFOMJGIedeE",
  authDomain: "cvoxel-dev.firebaseapp.com",
  projectId: "cvoxel-dev",
  storageBucket: "cvoxel-dev.appspot.com",
  messagingSenderId: "1003461766870",
  appId: "1:1003461766870:web:143f659c21fd299edda377",
  measurementId: "G-R09FCF4DDB",
};

const prodConfig = {
  apiKey: "AIzaSyAb0_9chcdQlW11OsPLhsMKui9EcOKk9JI",
  authDomain: "cvoxel-testnet.firebaseapp.com",
  projectId: "cvoxel-testnet",
  storageBucket: "cvoxel-testnet.appspot.com",
  messagingSenderId: "242627370440",
  appId: "1:242627370440:web:ae1ec7095f1b93e91534fd",
  measurementId: "G-LX7P8TK3WR",
};

type issueEventAttendancesParam = {
  event: EventWithId;
  dids: string[];
};

export class BackupDataStore {
  app = undefined as firebase.FirebaseApp | undefined;
  firestore = undefined as Firestore | undefined;
  functions = undefined as Functions | undefined;

  constructor(env: "mainnet" | "testnet-clay" = "mainnet") {
    const config = env === "mainnet" ? prodConfig : devConfig;
    const apps = getApps();
    if (!apps.length) {
      this.app = initializeApp(config);
    } else {
      this.app = apps[0];
    }
    this.firestore = getFirestore(this.app);
    this.functions = getFunctions();
    this.functions.region = "us-central1";
  }

  uploadCRDL = (crdl: WorkCredentialWithId): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadDraftFunc = httpsCallable<
        { [x: string]: WorkCredentialWithId },
        { [x: string]: string }
      >(this.functions, "uploadCRDL");
      uploadDraftFunc({
        crdl: {
          ...crdl,
          backupId: removeCeramicPrefix(crdl.backupId),
          holderDid: crdl.subject.work?.id,
          potentialSigners: crdl.subject.tx?.relatedAddresses,
        },
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  uploadVerifiableWorkCredential = (
    crdl: VerifiableWorkCredentialWithId
  ): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadDraftFunc = httpsCallable<
        { [x: string]: VerifiableWorkCredentialWithId },
        { [x: string]: string }
      >(this.functions, "uploadVerifiableWorkCredential");
      uploadDraftFunc({
        crdl: {
          ...crdl,
          ceramicId: removeCeramicPrefix(crdl.ceramicId),
        },
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  uploadOrg = (param: OrganizationWIthId): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        { [x: string]: OrganizationWIthId },
        { [x: string]: string }
      >(this.functions, "uploadOrg");
      uploadFunc({
        org: param,
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  uploadMembership = (
    param: MembershipWithId
  ): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        { [x: string]: MembershipWithId },
        { [x: string]: string }
      >(this.functions, "uploadMembership");
      uploadFunc({
        membership: param,
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  uploadMembershipSubject = (
    param: MembershipSubjectWithId
  ): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        { [x: string]: MembershipSubjectWithId },
        { [x: string]: string }
      >(this.functions, "uploadMembershipSubject");
      uploadFunc({
        subject: param,
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  uploadEvent = (param: EventWithId): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        { [x: string]: EventWithId },
        { [x: string]: string }
      >(this.functions, "uploadEvent");
      uploadFunc({
        event: param,
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  uploadEventAttendance = (
    param: EventAttendanceWithId
  ): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        { [x: string]: EventAttendanceWithId },
        { [x: string]: string }
      >(this.functions, "uploadEventAttendance");
      uploadFunc({
        event: param,
      })
        .then((result) => {
          const { status } = result.data;
          resolve({ status: status });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });

  issueEventAttendancesFromProxy = (
    param: issueEventAttendancesParam
  ): Promise<{ [x: string]: string | string[] }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        issueEventAttendancesParam,
        { [x: string]: string }
      >(this.functions, "issueEventAttendances");
      uploadFunc(param)
        .then((result) => {
          const status = result.data.status as string;
          const vcs = result.data.vcs.split(",");
          resolve({ status: status, vcs: vcs });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });
}
