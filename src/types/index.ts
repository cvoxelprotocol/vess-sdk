import { ModelTypeAliases } from "@glazed/types";
import { CreatedMemberships } from "./CreatedMemberships";
import { CreatedMembershipSubjects } from "./CreatedMembershipSubjects";
import { CreatedOrganizations } from "./CreatedOrganizations";
import {
  EventAttendanceVerifiableCredential,
  VerifiableMembershipSubjectCredential,
} from "./eip712";
import { Event } from "./Event";
import { HeldEventAttendanceVerifiableCredentials } from "./HeldEventAttendanceVerifiableCredentials";
import { HeldVerifiableMembershipSubjects } from "./HeldVerifiableMembershipSubjects";
import { HeldVerifiableWorkCredentials } from "./HeldVerifiableWorkCredentials";
import { HeldWorkCredentials } from "./HeldWorkCredentials";
import { IssuedEventAttendanceVerifiableCredentials } from "./IssuedEventAttendanceVerifiableCredentials";
import { IssuedEvents } from "./IssuedEvents";
import { IssuedVerifiableMembershipSubjects } from "./IssuedVerifiableMembershipSubjects";
import { Membership } from "./MemberShip";
import { MembershipSubject } from "./MembershipSubject";
import { Organization } from "./Organization";
import { VerifiableWorkCredential } from "./VerifiableWorkCredential";
import { DeliverableItem, WorkCredential } from "./WorkCredential";

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
  backupId?: string;
  holderDid?: string;
  potentialSigners?: string[];
};

export type OrganizationWIthId = Organization & {
  ceramicId: string;
};

export type MembershipWithId = Membership & {
  ceramicId: string;
};

export type VerifiableWorkCredentialWithId = VerifiableWorkCredential & {
  ceramicId: string;
};
export type MembershipSubjectWithId = VerifiableMembershipSubjectCredential & {
  ceramicId: string;
};

export type EventAttendanceWithId = EventAttendanceVerifiableCredential & {
  ceramicId: string;
};

export type EventWithId = Event & {
  ceramicId: string;
};

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
} as const;
export type AliasTypes = typeof AliasType[keyof typeof AliasType];
