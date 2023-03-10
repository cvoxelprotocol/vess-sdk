/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface TaskCredential {
  id: string;
  /**
   * paid value
   */
  value?: string;
  /**
   * paid value
   */
  tax?: string;
  /**
   * work summary
   */
  summary: string;
  /**
   * work detail
   */
  detail?: string;
  /**
   * work genre e.g, Dev, Design etc
   */
  genre?: string;
  /**
   * work tags
   */
  tags?: string[];
  /**
   * currently support fulltime, parttime, and onetime
   */
  workType?: string;
  /**
   * Time stamp of work started
   */
  startDate?: string;
  /**
   * Time stamp of work ended
   */
  endDate?: string;
  /**
   * work deliverables
   */
  deliverables?: DeliverableItem[];
  client?: Client;
  /**
   * a transaction platform if exists e.g, gitcoin
   */
  platform?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}
export interface DeliverableItem {
  /**
   * current formats are url, tx, cid
   */
  format?: string;
  /**
   * work deliverable value(url/cid)
   */
  value?: string;
  [k: string]: unknown;
}
export interface Client {
  /**
   * name or DID
   */
  format?: string;
  /**
   * Client Info
   */
  value?: string;
  [k: string]: unknown;
}
