import { CeramicClient } from '@ceramicnetwork/http-client';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { aliases as devModelAliases } from '../__generated__/aliases_dev.js';
import { aliases as prodModelAliases } from '../__generated__/aliases.js';
import {
  Alias,
  AliasTypes,
  BaseIDXType,
  ModelTypes,
  WithCeramicId,
} from '../interface/index.js';
import { ModelTypesToAliases } from '@glazed/types';
import type { AuthMethod } from '@didtools/cacao';
import { DIDSession } from 'did-session';
import { DIDDataStore } from '@glazed/did-datastore';
import { removeUndefinedFromArray } from './common.js';

export const ETH_CHAIN_ID = `eip155:1:`;

export const getDataModel = (
  env?: 'mainnet' | 'testnet-clay'
): ModelTypesToAliases<ModelTypes> => {
  if (!env) return prodModelAliases;
  return env === 'mainnet' ? prodModelAliases : devModelAliases;
};

export const getSchema = (
  dataModel: ModelTypesToAliases<ModelTypes>,
  alias: AliasTypes
): string => {
  return dataModel.schemas[alias];
};

export const createTileDoc = async <T>(
  content: T,
  ceramic: CeramicClient | undefined,
  dataModel: ModelTypesToAliases<ModelTypes>,
  modelName: AliasTypes,
  tags: string[],
  family?: string
): Promise<WithCeramicId<T>> => {
  if (!ceramic || !ceramic?.did?.parent) {
    throw new Error('You need to call connect first');
  }
  try {
    const doc = await createTileDocument<T>(
      ceramic,
      ceramic?.did?.parent,
      content,
      getSchema(dataModel, modelName),
      tags,
      family
    );
    const docUrl = doc.id.toUrl();
    return { ...content, ceramicId: docUrl };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to Create Tile Doc');
  }
};

export const setIDX = async <T extends BaseIDXType, K extends Alias>(
  contentId: string[],
  ceramic: CeramicClient | undefined,
  dataStore: DIDDataStore<ModelTypes> | undefined,
  modelName: K,
  defautParamName: 'issued' | 'created' | 'held'
): Promise<void> => {
  if (!dataStore || !ceramic?.did?.parent) {
    throw new Error('You need to call connect first');
  }
  const val = await dataStore.get<K, T>(modelName, ceramic?.did?.parent);
  const currentVals = val?.issued ?? val?.created ?? val?.held ?? [];
  const updatedVals = [...currentVals, ...contentId];
  if (defautParamName === 'created') {
    await dataStore.set(modelName, {
      created: updatedVals,
    });
    return;
  }
  if (defautParamName === 'issued') {
    await dataStore.set(modelName, {
      issued: updatedVals,
    });
    return;
  }
  if (defautParamName === 'held') {
    await dataStore.set(modelName, {
      held: updatedVals,
    });
    return;
  }
};

export const setUniqueIDX = async <T, K extends Alias>(
  content: T,
  ceramic: CeramicClient | undefined,
  dataStore: DIDDataStore<ModelTypes> | undefined,
  modelName: K
): Promise<void> => {
  if (!dataStore || !ceramic?.did?.parent) {
    throw new Error('You need to call connect first');
  }
  await dataStore.set(modelName, content);
};

export const getTileDoc = async <T>(
  streamId: string,
  ceramic: CeramicClient
): Promise<WithCeramicId<T>> => {
  try {
    const doc = await TileDocument.load<T>(ceramic, streamId);
    return {
      ...doc.content,
      ceramicId: doc.id.toString(),
    };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to Get Tile Doc');
  }
};

export const getIDXDocs = async <T extends BaseIDXType, K extends Alias, U>(
  ceramic: CeramicClient,
  dataStore: DIDDataStore<ModelTypes>,
  modelName: K,
  did?: string
): Promise<WithCeramicId<U>[]> => {
  try {
    if (!did) {
      throw new Error('You need to call connect first');
    }
    const val = await dataStore.get<K, T>(modelName, did);
    const idxs = val?.issued ?? val?.created ?? val?.held ?? [];
    if (idxs.length === 0) return [];
    const arr: Promise<WithCeramicId<U> | undefined>[] = [];
    for (const streamId of idxs) {
      const o = getTileDoc<U>(streamId, ceramic);
      arr.push(o);
    }
    const res = await Promise.all(arr);
    return removeUndefinedFromArray<WithCeramicId<U>>(res);
  } catch (error) {
    console.error(error);
    return [];
    // throw new Error("Failed to Get IDX");
  }
};

export const getUniqueIDX = async <T, K extends Alias>(
  dataStore: DIDDataStore<ModelTypes>,
  modelName: K,
  did?: string
): Promise<T | null> => {
  try {
    if (!did) {
      throw new Error('You need to call connect first');
    }
    return await dataStore.get<K, T>(modelName, did);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to Get IDX');
  }
};

export const updateTileDoc = async <T>(
  ceramic: CeramicClient | undefined,
  content: WithCeramicId<T>
): Promise<void> => {
  if (!ceramic || !ceramic?.did?.parent) {
    throw new Error('You need to call connect first');
  }
  try {
    const doc = await TileDocument.load<T>(ceramic, content.ceramicId);
    if (!doc.content) throw new Error(`No Item Found: ${content.ceramicId}`);
    await doc.update(content);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to Create Tile Doc');
  }
};

export const createTileDocument = async <T>(
  client: CeramicClient,
  did: string,
  content: T,
  schema: string,
  tags: string[] = ['vess', 'workCredential'],
  family = 'VESS'
): Promise<TileDocument<T>> => {
  try {
    let doc = await TileDocument.create(client, content, {
      family: family,
      controllers: [did],
      tags: tags,
      schema: schema,
    });
    return doc;
  } catch (e) {
    console.log('Error creating TileDocument: ', e);
    throw new Error('Error creating TileDocument');
  }
};

export const getPkhDIDFromAddress = (address: string): string => {
  if (isEthereumAddress(address)) {
    return `did:pkh:${ETH_CHAIN_ID}${address.toLowerCase()}`;
  } else {
    return address.toLowerCase();
  }
};
export const getAddressFromPkh = (did: string): string => {
  if (isDIDstring(did)) {
    return did.replace(`did:pkh:${ETH_CHAIN_ID}`, '');
  } else {
    return did;
  }
};

export function isEthereumAddress(address: string): boolean {
  return /^0x[0-9a-f]{40}$/i.test(address);
}

export const removeCeramicPrefix = (docUrl?: string) => {
  if (!docUrl) return '';
  return docUrl.replace(`ceramic://`, '');
};
export const addCeramicPrefix = (backupId: string) => {
  return backupId.startsWith('ceramic://') ? backupId : `ceramic://${backupId}`;
};

export const isDIDstring = (did: string): boolean => {
  const didRegex = /^did:([A-Za-z0-9]+):([A-Za-z0-9.\-:_]+)$/;
  return didRegex.test(did);
};

export function formatDID(did: string, maxLength = 20): string {
  if (maxLength < 12) {
    maxLength = 12;
  }
  const half = Math.floor(maxLength / 2);
  const remaining = half - 3 - maxLength;
  return did.length <= maxLength
    ? did
    : `${did.slice(0, half)}...${did.slice(remaining)}`;
}

export const loadSession = async (
  authMethod: AuthMethod
): Promise<DIDSession> => {
  const sessionStr = localStorage.getItem('ceramic-session');
  let session;

  if (sessionStr) {
    session = await DIDSession.fromSession(sessionStr);
    // console.log("session from sessionStr", session);
  }

  if (!session || (session.hasSession && session.isExpired)) {
    session = await DIDSession.authorize(authMethod, {
      resources: ['ceramic://*'],
      expiresInSecs: 60 * 60 * 24 * 90,
    });
    localStorage.setItem('ceramic-session', session.serialize());
  }
  return session;
};

export const removeSession = () => {
  localStorage.removeItem('ceramic-session');
};

export const getAuthorizedSession = async (): Promise<string | null> => {
  const sessionStr = localStorage.getItem('ceramic-session');
  if (sessionStr) {
    const session = await DIDSession.fromSession(sessionStr);
    if (session.isAuthorized() && !session.isExpired) {
      return sessionStr;
    }
  }
  return null;
};
