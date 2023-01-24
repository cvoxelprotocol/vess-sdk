import { DeliverableItem, Transaction } from './__generated__';
import { Client, Work } from './__generated__/types/WorkCredential';

export const formatTransaction = (
  txHash: string,
  from: string,
  to: string,
  isPayer: boolean,
  value: string,
  fiatValue: string,
  fiatSymbol: string,
  tokenSymbol: string,
  tokenDecimal: number,
  networkId: number,
  issuedTimestamp: string,
  relatedTxHashes: string[],
  relatedAddresses: string[]
): Transaction => {
  return {
    txHash,
    from,
    to,
    isPayer,
    value,
    fiatValue,
    fiatSymbol,
    tokenSymbol,
    tokenDecimal,
    networkId,
    issuedTimestamp,
    relatedTxHashes,
    relatedAddresses,
  };
};

export const formatClient = (format: string, value: string): Client => {
  return {
    format,
    value,
  };
};

export const formatDeliverable = (
  format: string,
  value: string
): DeliverableItem => {
  return {
    format,
    value,
  };
};

export const formatWork = (
  id: string,
  summary: string,
  value: string,
  tax: string,
  detail: string,
  genre: string,
  tags: string[],
  jobType: string,
  startTimestamp: string,
  endTimestamp: string,
  platform: string,
  deliverableHash: string,
  issuedAt: string,
  organization: string
): Work => {
  return {
    id,
    summary,
    value,
    tax,
    detail,
    genre,
    tags,
    jobType,
    startTimestamp,
    endTimestamp,
    platform,
    deliverableHash,
    issuedAt,
    organization,
  };
};
