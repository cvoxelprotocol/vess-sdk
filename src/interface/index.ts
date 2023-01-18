import { ModelTypeAliases } from "@glazed/types";
import { CreatedMemberships } from "../__generated__/types/CreatedMemberships";
import { CreatedMembershipSubjects } from "../__generated__/types/CreatedMembershipSubjects";
import { CreatedOrganizations } from "../__generated__/types/CreatedOrganizations";
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from "./eip712";
import { Event } from "../__generated__/types/Event";
import { HeldEventAttendanceVerifiableCredentials } from "../__generated__/types/HeldEventAttendanceVerifiableCredentials";
import { HeldVerifiableMembershipSubjects } from "../__generated__/types/HeldVerifiableMembershipSubjects";
import { HeldVerifiableWorkCredentials } from "../__generated__/types/HeldVerifiableWorkCredentials";
import { HeldWorkCredentials } from "../__generated__/types/HeldWorkCredentials";
import { IssuedEventAttendanceVerifiableCredentials } from "../__generated__/types/IssuedEventAttendanceVerifiableCredentials";
import { IssuedEvents } from "../__generated__/types/IssuedEvents";
import { IssuedVerifiableMembershipSubjects } from "../__generated__/types/IssuedVerifiableMembershipSubjects";
import { Membership } from "../__generated__/types/MemberShip";
import { MembershipSubject } from "../__generated__/types/MembershipSubject";
import { OldOrganization } from "../__generated__/types/OldOrganization";
import { Organization } from "../__generated__/types/Organization";
import {
  DeliverableItem,
  VerifiableWorkCredential,
} from "../__generated__/types/VerifiableWorkCredential";
import { WorkCredential } from "../__generated__/types/WorkCredential";
import { CreatedOldOrganizations } from "../__generated__/types/CreatedOldOrganizations";

export type OldWorkCredential = {
  to: string; // payee address. maybe contract address
  from: string; // payer address. maybe contract address
  isPayer: boolean; // whether owner is payer or not
  summary: string; // work summary
  detail?: string; // work detail
  deliverables?: DeliverableItem[]; // deliberable link
  value: string; // reward value
  tokenSymbol: string; // eth, usdc, etc
  tokenDecimal: number; // token decimals
  fiatValue?: string; //reward value as USD
  fiatSymbol?: string; // currently only USD supported
  networkId: number; // eth mainnet = 1 | polygon mainnet = 137
  issuedTimestamp: string; //block timestamp
  txHash?: string; // transfer tx hash
  jobType?: "FullTime" | "PartTime" | "OneTime"; // default=OneTime
  genre?: string; // main genre
  tags?: string[]; //tags
  toSig?: string; // sig of payee
  fromSig?: string; // sig of payer
  toSigner?: string; // who signed this cvoxel as payee actually. Only EOA supported
  fromSigner?: string; // who signed this cvoxel as payer actually. Only EOA supported
  startTimestamp?: string; //timestamp to start work
  endTimestamp?: string; //timestamp to end work
  relatedAddresses: string[]; // all addresses related to this cvoxel. may contain both EOA and contract address
  relatedTxHashes?: string[]; //tx releated work
  deliverableHash?: string; // hash value of all work descriptions(summary, detail, deliverables)
  platform?: string; // a transaction platform if exists e.g, gitcoin
  createdAt?: string; //timestamp to be created
  updatedAt?: string; //timestamp to be updated
};
export type OldWorkCredentialItem = {
  id: string;
  txHash?: string; // transfer tx hash
  isPayer: boolean;
  summary: string;
  deliverables?: DeliverableItem[]; // deliberable link
  fiatValue?: string;
  genre?: string; // main genre
  deliverableHash?: string; // hash value of all work descriptions(summary, detail, deliverables)
  platform?: string; // a transaction platform if exists e.g, gitcoin
  isVerified?: boolean;
  issuedTimestamp: string;
};

export type OldWorkCredentials = {
  WorkCredentials: OldWorkCredentialItem[];
};

export type WorkCredentialWithId = WorkCredential & {
  ceramicId?: string;
  holderDid?: string;
  potentialSigners?: string[];
};

export type WithCeramicId<T> = T & {
  ceramicId: string;
};

export type BaseIDXType = {
  created?: string[];
  issued?: string[];
  held?: string[];
  [k: string]: unknown;
};

export type OrganizationWIthId = WithCeramicId<Organization>;

export type OldOrganizationWIthId = WithCeramicId<OldOrganization>;

export type MembershipWithId = WithCeramicId<Membership>;

export type VerifiableWorkCredentialWithId =
  WithCeramicId<VerifiableWorkCredential>;
export type MembershipSubjectWithId =
  WithCeramicId<VerifiableMembershipSubjectCredential>;

export type EventAttendanceWithId =
  WithCeramicId<EventAttendanceVerifiableCredential>;

export type EventWithId = WithCeramicId<Event>;

export type ModelTypes = ModelTypeAliases<
  {
    WorkCredential: WorkCredential;
    VerifiableWorkCredential: VerifiableWorkCredential;
    HeldWorkCredentials: HeldWorkCredentials;
    OldWorkCredential: OldWorkCredential;
    OldWorkCredentials: OldWorkCredentials;
    HeldVerifiableWorkCredentials: HeldVerifiableWorkCredentials;
    Organization: Organization;
    MemberShip: Membership;
    Event: Event;
    IssuedEvents: IssuedEvents;
    MembershipSubject: MembershipSubject;
    EventAttendanceVerifiableCredential: EventAttendanceVerifiableCredential;
    IssuedEventAttendanceVerifiableCredentials: IssuedEventAttendanceVerifiableCredentials;
    HeldEventAttendanceVerifiableCredentials: HeldEventAttendanceVerifiableCredentials;
    CreatedOrganizations: CreatedOrganizations;
    CreatedMemberships: CreatedMemberships;
    CreatedMembershipSubjects: CreatedMembershipSubjects;
    VerifiableMembershipSubjectCredential: VerifiableMembershipSubjectCredential;
    HeldVerifiableMembershipSubjects: HeldVerifiableMembershipSubjects;
    IssuedVerifiableMembershipSubjects: IssuedVerifiableMembershipSubjects;
    OldOrganization: OldOrganization;
    CreatedOldOrganizations: CreatedOldOrganizations;
  },
  {
    workCredential: "WorkCredential";
    verifiableWorkCredential: "VerifiableWorkCredential";
    heldWorkCredentials: "HeldWorkCredentials";
    OldWorkCredential: "OldWorkCredential";
    OldWorkCredentials: "OldWorkCredentials";
    heldVerifiableWorkCredentials: "HeldVerifiableWorkCredentials";
    Organization: "Organization";
    MemberShip: "MemberShip";
    Event: "Event";
    IssuedEvents: "IssuedEvents";
    MembershipSubject: "MembershipSubject";
    EventAttendanceVerifiableCredential: "EventAttendanceVerifiableCredential";
    IssuedEventAttendanceVerifiableCredentials: "IssuedEventAttendanceVerifiableCredentials";
    HeldEventAttendanceVerifiableCredentials: "HeldEventAttendanceVerifiableCredentials";
    CreatedOrganizations: "CreatedOrganizations";
    CreatedMemberships: "CreatedMemberships";
    CreatedMembershipSubjects: "CreatedMembershipSubjects";
    VerifiableMembershipSubjectCredential: "VerifiableMembershipSubjectCredential";
    HeldVerifiableMembershipSubjects: "HeldVerifiableMembershipSubjects";
    IssuedVerifiableMembershipSubjects: "IssuedVerifiableMembershipSubjects";
    OldOrganization: "OldOrganization";
    CreatedOldOrganizations: "CreatedOldOrganizations";
  }
>;

const AliasType = {
  workCredential: "WorkCredential",
  verifiableWorkCredential: "VerifiableWorkCredential",
  heldWorkCredentials: "HeldWorkCredentials",
  OldWorkCredential: "OldWorkCredential",
  OldWorkCredentials: "OldWorkCredentials",
  HeldVerifiableWorkCredentials: "HeldVerifiableWorkCredentials",
  Organization: "Organization",
  MemberShip: "MemberShip",
  Event: "Event",
  IssuedEvents: "IssuedEvents",
  MembershipSubject: "MembershipSubject",
  EventAttendanceVerifiableCredential: "EventAttendanceVerifiableCredential",
  IssuedEventAttendanceVerifiableCredentials:
    "IssuedEventAttendanceVerifiableCredentials",
  HeldEventAttendanceVerifiableCredentials:
    "HeldEventAttendanceVerifiableCredentials",
  CreatedOrganizations: "CreatedOrganizations",
  CreatedMemberships: "CreatedMemberships",
  CreatedMembershipSubjects: "CreatedMembershipSubjects",
  VerifiableMembershipSubjectCredential:
    "VerifiableMembershipSubjectCredential",
  HeldVerifiableMembershipSubjects: "HeldVerifiableMembershipSubjects",
  IssuedVerifiableMembershipSubjects: "IssuedVerifiableMembershipSubjects",
  OldOrganization: "OldOrganization",
  CreatedOldOrganizations: "CreatedOldOrganizations",
} as const;
export type AliasTypes = typeof AliasType[keyof typeof AliasType];
export type Alias = keyof ModelTypes["definitions"];

export type BaseResponse = {
  status: 200 | 300;
  result?: string;
  error?: any;
};

export type AuthReposnse = BaseResponse & {
  did: string;
};

export type CustomResponse<T> = BaseResponse & T;
