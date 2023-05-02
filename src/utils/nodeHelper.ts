import { AccountId } from 'caip';
import { createDIDKey } from 'did-session';
import { randomBytes } from '@ethersproject/random';
import {
  Cacao,
  SiweMessage,
  AuthMethodOpts,
  AuthMethod,
} from '@didtools/cacao';
import { randomString } from '@stablelib/random';
import { SignSIWE } from '../interface/kms.js';

// temporary solution for using in backend
export const getTempAuthMethod = async (
  address: string,
  appName: string,
  signSIWE: SignSIWE
): Promise<AuthMethod> => {
  return async (opts: AuthMethodOpts): Promise<Cacao> => {
    opts.domain = appName;
    return createTempCACAO(opts, address, signSIWE);
  };
};

const createTempCACAO = async (
  opts: AuthMethodOpts,
  address: string,
  signSIWE: SignSIWE
): Promise<Cacao> => {
  const accountId = new AccountId({
    chainId: 'eip155:1',
    address: address.toLowerCase(),
  });
  const VERSION = '1';
  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const keySeed = randomBytes(32);
  const didKey = await createDIDKey(keySeed);

  const siweMessage = new SiweMessage({
    domain: opts.domain,
    address: accountId.address,
    statement:
      opts.statement ??
      'Give this application access to some of your data on Ceramic',
    uri: opts.uri || didKey.id,
    version: VERSION,
    nonce: opts.nonce ?? randomString(10),
    issuedAt: now.toISOString(),
    expirationTime: opts.expirationTime ?? oneDayLater.toISOString(),
    chainId: accountId.chainId.reference,
    resources: opts.resources,
  });
  const signature = await signSIWE(siweMessage.signMessage());
  siweMessage.signature = signature;
  return Cacao.fromSiweMessage(siweMessage);
};
