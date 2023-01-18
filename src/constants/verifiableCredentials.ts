import {
  EVENT_ATTENDANCE_EIP712_TYPE,
  MEMBERSHIP_SUBJECT_EIP712_TYPE,
  TypedData,
} from "../interface/eip712";

export const DEFAULT_CONTEXT = "https://www.w3.org/2018/credentials/v1";
export const EIP712_CONTEXT =
  "https://raw.githubusercontent.com/w3c-ccg/ethereum-eip712-signature-2021-spec/main/contexts/v1/index.json";
export const MEMBERSHIP_SUBJECT_SCHEMA =
  "https://app.vess.id/schemas/VerifiableMembershipSubject.json";
export const EVENT_ATTENDANCE_SCHEMA =
  "https://app.vess.id/schemas/EventAttendance.json";

export const DEFAULT_VC_TYPE = "VerifiableCredential";
export const WORK_VC_TYPE = "WorkCredential";
export const MEMBERSHIP_VC_TYPE = "MembershipCredential";
export const EVENT_ATTENDANCE_VC_TYPE = "EventAttendanceCredential";

export const EVENT_DOMAIN_NAME = "Verifiable Event Attendance";
export const WORK_DOMAIN_NAME = "Verifiable Work Credential";
export const MEMBERSHIP_DOMAIN_NAME = "Verifiable Membership Subject";

export const VESS_CREDENTIALS_NAME = {
  MEMBERSHIP: "Membership",
  EVENT_ATTENDANCE: "EventAttendance",
  WORK_CREDENTIAL: "WorkCredential",
} as const;

export type VessCredentialNames = keyof typeof VESS_CREDENTIALS_NAME;

export type VerifiableCredentialSchemaType = {
  vcType: string;
  domain: string;
  schema: string;
  typedData: TypedData[];
};

export type VessCredentialSchema = {
  [key in VessCredentialNames]: VerifiableCredentialSchemaType;
};

export const VESS_CREDENTIALS: VessCredentialSchema = {
  MEMBERSHIP: {
    vcType: MEMBERSHIP_VC_TYPE,
    domain: MEMBERSHIP_DOMAIN_NAME,
    schema: MEMBERSHIP_SUBJECT_SCHEMA,
    typedData: MEMBERSHIP_SUBJECT_EIP712_TYPE,
  },
  EVENT_ATTENDANCE: {
    vcType: EVENT_ATTENDANCE_VC_TYPE,
    domain: EVENT_DOMAIN_NAME,
    schema: EVENT_ATTENDANCE_SCHEMA,
    typedData: EVENT_ATTENDANCE_EIP712_TYPE,
  },
  WORK_CREDENTIAL: {
    vcType: WORK_VC_TYPE,
    domain: WORK_DOMAIN_NAME,
    schema: "",
    typedData: MEMBERSHIP_SUBJECT_EIP712_TYPE,
  },
};
