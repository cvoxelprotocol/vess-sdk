import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { aliases as devModelAliases } from "../model/aliases_dev";
import { aliases as prodModelAliases } from "../model/aliases";
import { AliasTypes, ModelTypes } from "../types";
import { ModelTypesToAliases } from "@glazed/types";
import type { AuthMethod } from "@didtools/cacao";
import { DIDSession } from "did-session";

export const ETH_CHAIN_ID = `eip155:1:`;

export const getDataModel = (
  env?: "mainnet" | "testnet-clay"
): ModelTypesToAliases<ModelTypes> => {
  if (!env) return prodModelAliases;
  return env === "mainnet" ? prodModelAliases : devModelAliases;
};

export const getSchema = (
  dataModel: ModelTypesToAliases<ModelTypes>,
  alias: AliasTypes
): string => {
  return dataModel.schemas[alias];
};

export const createTileDocument = async <T>(
  client: CeramicClient,
  did: string,
  content: T,
  schema: string,
  tags: string[] = ["vess", "workCredential"],
  family = "VESS"
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
    console.log("Error creating TileDocument: ", e);
    throw new Error("Error creating TileDocument");
  }
};

export const updateTileDocument = async <T>(
  client: CeramicClient,
  did: string,
  streamId: string,
  content: T,
  schema: string,
  tags: string[] = ["vess", "workCredential"],
  family = "VESS"
) => {
  let doc;
  try {
    doc = await TileDocument.load(client, streamId);
    await doc.update(content, {
      family: family,
      controllers: [did],
      tags: tags,
      schema: schema,
    });

    return doc.id.toUrl();
  } catch (e) {
    return null;
  }
};

export const getPkhDIDFromAddress = (address: string): string => {
  if (isEthereumAddress(address)) {
    return `did:pkh:${ETH_CHAIN_ID}${address}`;
  } else {
    return address;
  }
};
export function isEthereumAddress(address: string): boolean {
  return /^0x[0-9a-f]{40}$/i.test(address);
}

export const removeCeramicPrefix = (docUrl?: string) => {
  if (!docUrl) return "";
  return docUrl.replace(`ceramic://`, "");
};
export const addCeramicPrefix = (backupId: string) => {
  return `ceramic://${backupId}`;
};

export const loadSession = async (
  authMethod: AuthMethod
): Promise<DIDSession> => {
  const sessionStr = localStorage.getItem("didsession");
  let session;

  if (sessionStr) {
    session = await DIDSession.fromSession(sessionStr);
  }

  if (!session || (session.hasSession && session.isExpired)) {
    session = await DIDSession.authorize(authMethod, {
      resources: ["ceramic://*"],
    });
    localStorage.setItem("didsession", session.serialize());
  }
  return session;
};

export const removeSession = () => {
  localStorage.removeItem("didsession");
};
