import { CeramicClient } from '@ceramicnetwork/http-client';
import {
  createTileDoc,
  getDataModel,
  setIDX,
  updateTileDoc,
} from './ceramicHelper.js';
import { DIDDataStore } from '@glazed/did-datastore';
import {
  IssuedCertificationSubjects,
  IssuedEventAttendanceVerifiableCredentialsV2,
  IssuedVerifiableMembershipSubjects,
} from '../__generated__';
import { PROD_CERAMIC_URL, TESTNET_CERAMIC_URL } from '../baseVess.js';
import { DID } from 'dids';
import { BaseResponse } from '../interface/index.js';

export const updateCredential = async (
  ceramicId: string,
  vc: any,
  env: 'mainnet' | 'testnet-clay' = 'mainnet',
  did: DID
): Promise<BaseResponse> => {
  const ceramic = new CeramicClient(
    env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL
  );
  ceramic.did = did;
  await updateTileDoc<any>(ceramic, ceramicId, vc);
  return {
    status: 200,
  };
};

export const storeEventAttendances = async (
  vcs: any[],
  env: 'mainnet' | 'testnet-clay' = 'mainnet',
  did: DID,
  saveIDX = false
): Promise<any[]> => {
  const ceramic = new CeramicClient(
    env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL
  );
  const dataModel = getDataModel(env);
  ceramic.did = did;
  const dataStore = new DIDDataStore({
    ceramic: ceramic,
    model: dataModel,
    id: ceramic?.did?.parent,
  });

  const docsPromises: Promise<any>[] = [];
  for (const vc of vcs) {
    const docPromise = createTileDoc<any>(
      vc,
      ceramic,
      dataModel,
      'EventAttendanceVerifiableCredential',
      ['vess', 'eventAttendanceCredential']
    );
    docsPromises.push(docPromise);
  }
  const docs = await Promise.all(docsPromises);
  if (saveIDX) {
    const docUrls = docs.map((doc) => doc.ceramicId);
    await setIDX<
      IssuedEventAttendanceVerifiableCredentialsV2,
      'IssuedEventAttendanceVerifiableCredentialsV2'
    >(
      docUrls,
      ceramic,
      dataStore,
      'IssuedEventAttendanceVerifiableCredentialsV2',
      'issued'
    );
  }
  return [...docs];
};

export const storeMemberships = async (
  vcs: any[],
  env: 'mainnet' | 'testnet-clay' = 'mainnet',
  did: DID,
  saveIDX = false
): Promise<any[]> => {
  const ceramic = new CeramicClient(
    env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL
  );
  const dataModel = getDataModel(env);
  ceramic.did = did;
  const dataStore = new DIDDataStore({
    ceramic: ceramic,
    model: dataModel,
    id: ceramic?.did?.parent,
  });

  const docsPromises: Promise<any>[] = [];
  for (const vc of vcs) {
    const docPromise = createTileDoc<any>(
      vc,
      ceramic,
      dataModel,
      'VerifiableMembershipSubjectCredential',
      ['vess', 'membershipCredential']
    );
    docsPromises.push(docPromise);
  }
  const docs = await Promise.all(docsPromises);
  if (saveIDX) {
    const docUrls = docs.map((doc) => doc.ceramicId);
    await setIDX<
      IssuedVerifiableMembershipSubjects,
      'IssuedVerifiableMembershipSubjects'
    >(
      docUrls,
      ceramic,
      dataStore,
      'IssuedVerifiableMembershipSubjects',
      'issued'
    );
  }
  return [...docs];
};

export const storeCertificate = async (
  vcs: any[],
  env: 'mainnet' | 'testnet-clay' = 'mainnet',
  did: DID,
  saveIDX = false
): Promise<any[]> => {
  const ceramic = new CeramicClient(
    env === 'mainnet' ? PROD_CERAMIC_URL : TESTNET_CERAMIC_URL
  );
  const dataModel = getDataModel(env);
  ceramic.did = did;
  const dataStore = new DIDDataStore({
    ceramic: ceramic,
    model: dataModel,
    id: ceramic?.did?.parent,
  });

  const docsPromises: Promise<any>[] = [];
  for (const vc of vcs) {
    const docPromise = createTileDoc<any>(
      vc,
      ceramic,
      dataModel,
      'CertificationSubject',
      ['vess', 'CertificationSubject']
    );
    docsPromises.push(docPromise);
  }
  const docs = await Promise.all(docsPromises);
  if (saveIDX) {
    const docUrls = docs.map((doc) => doc.ceramicId);
    await setIDX<IssuedCertificationSubjects, 'IssuedCertificationSubjects'>(
      docUrls,
      ceramic,
      dataStore,
      'IssuedCertificationSubjects',
      'issued'
    );
  }

  return [...docs];
};
