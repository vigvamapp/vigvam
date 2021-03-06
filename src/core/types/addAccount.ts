import { AccountType } from "./base";
import {
  HDAccountParams,
  ByPrivateKeyAccountParams,
  LedgerAccountParams,
  OpenLoginAccountParams,
  WatchOnlyAccountParams,
} from "./account";

export type AddAccountParams =
  | AddHDAccountParams
  | AddByPrivateKeyAccountParams
  | AddLedgerAccountParams
  | AddOpenLoginAccountParams
  | AddWatchOnlyAccountParams;

export interface AddAccountParamsBase {
  type: AccountType;
  name: string;
}

/**
 * By `AccountSource`
 */

export interface AddHDAccountParams
  extends HDAccountParams,
    AddAccountParamsBase {
  type: AccountType.HD;
}

export interface AddByPrivateKeyAccountParams
  extends ByPrivateKeyAccountParams,
    AddImportedAccountParams {}

export interface AddLedgerAccountParams
  extends LedgerAccountParams,
    AddExternalAccountParams {}

export interface AddOpenLoginAccountParams
  extends OpenLoginAccountParams,
    AddImportedAccountParams {}

export interface AddWatchOnlyAccountParams
  extends WatchOnlyAccountParams,
    AddVoidAccountParams {}

/**
 * By `AccountType`
 */

export interface AddImportedAccountParams extends AddAccountParamsBase {
  type: AccountType.Imported;
  privateKey: string;
}

export interface AddExternalAccountParams extends AddAccountParamsBase {
  type: AccountType.External;
  publicKey: string;
}

export interface AddVoidAccountParams extends AddAccountParamsBase {
  type: AccountType.Void;
  address: string;
}
