import firebase, { initializeApp, getApps } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore/lite';
import { Functions, getFunctions, httpsCallable } from 'firebase/functions';
import {
  EventAttendanceWithId,
  EventWithId,
  MembershipSubjectWithId,
  MembershipWithId,
  OldOrganizationWIthId,
  OrganizationWIthId,
  VerifiableWorkCredentialWithId,
  WorkCredentialWithId,
} from '../interface/index.js';
import { removeCeramicPrefix } from './ceramicHelper.js';

const devConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

const prodConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

export type issueEventAttendancesParam = {
  event: EventWithId;
  dids: string[];
};

export class BackupDataStore {
  app = undefined as firebase.FirebaseApp | undefined;
  firestore = undefined as Firestore | undefined;
  functions = undefined as Functions | undefined;

  constructor(env: 'mainnet' | 'testnet-clay' = 'mainnet') {
    const config = env === 'mainnet' ? prodConfig : devConfig;
    const apps = getApps();
    if (!apps.length) {
      this.app = initializeApp(config);
    } else {
      this.app = apps[0];
    }
    this.firestore = getFirestore(this.app);
    this.functions = getFunctions();
    this.functions.region = 'us-central1';
    // for dev use only
    // connectFunctionsEmulator(this.functions, "localhost", 5111);
    // connectFirestoreEmulator(this.firestore, "localhost", 8081);
  }

  uploadCRDL = (crdl: WorkCredentialWithId): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadDraftFunc = httpsCallable<
        { [x: string]: WorkCredentialWithId },
        { [x: string]: string }
      >(this.functions, 'uploadCRDL');
      uploadDraftFunc({
        crdl: {
          ...crdl,
          ceramicId: removeCeramicPrefix(crdl.ceramicId),
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
      >(this.functions, 'uploadVerifiableWorkCredential');
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
      >(this.functions, 'uploadOrg');
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

  uploadOldOrg = (
    param: OldOrganizationWIthId
  ): Promise<{ [x: string]: string }> =>
    new Promise((resolve, reject) => {
      if (!this.functions) return;
      const uploadFunc = httpsCallable<
        { [x: string]: OldOrganizationWIthId },
        { [x: string]: string }
      >(this.functions, 'uploadOldOrg');
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
      >(this.functions, 'uploadMembership');
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
      >(this.functions, 'uploadMembershipSubject');
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
      >(this.functions, 'uploadEvent');
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
      >(this.functions, 'uploadEventAttendance');
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
      >(this.functions, 'issueEventAttendances');
      uploadFunc(param)
        .then((result) => {
          const status = result.data.status as string;
          const vcs = result.data.vcs.split(',');
          resolve({ status: status, vcs: vcs });
        })
        .catch((error) => {
          console.log({ error });
          reject(error);
        });
    });
}
