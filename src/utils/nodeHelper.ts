import { ethers } from "ethers";
import { AccountId } from "caip";
import { createDIDKey } from "did-session";
import { randomBytes } from "ethers/lib/utils.js";
import {
  Cacao,
  SiweMessage,
  AuthMethodOpts,
  AuthMethod,
} from "@didtools/cacao";
import { randomString } from "@stablelib/random";

// temporary solution for using in backend
export const getTempAuthMethod = async (
  address: string,
  appName: string,
  signer: ethers.Wallet
): Promise<AuthMethod> => {
  return async (opts: AuthMethodOpts): Promise<Cacao> => {
    opts.domain = appName;
    return createTempCACAO(opts, address, signer);
  };
};

const createTempCACAO = async (
  opts: AuthMethodOpts,
  address: string,
  signer: ethers.Wallet
): Promise<Cacao> => {
  const accountId = new AccountId({
    chainId: "eip155:1",
    address: address,
  });
  const VERSION = "1";
  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const keySeed = randomBytes(32);
  const didKey = await createDIDKey(keySeed);

  const siweMessage = new SiweMessage({
    domain: opts.domain,
    address: accountId.address,
    statement:
      opts.statement ??
      "Give this application access to some of your data on Ceramic",
    uri: opts.uri || didKey.id,
    version: VERSION,
    nonce: opts.nonce ?? randomString(10),
    issuedAt: now.toISOString(),
    expirationTime: opts.expirationTime ?? oneDayLater.toISOString(),
    chainId: accountId.chainId.reference,
    resources: opts.resources,
  });

  const signature = await signer.signMessage(siweMessage.signMessage());
  siweMessage.signature = signature;
  return Cacao.fromSiweMessage(siweMessage);
};
