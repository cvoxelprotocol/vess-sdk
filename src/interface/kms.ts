export type SignSIWE = (message: string) => Promise<string>;

export type CredentialParam<T> = {
  content: T;
  address?: string;
  credentialId?: string;
  sig?: string;
};
