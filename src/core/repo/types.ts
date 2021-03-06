import { AccountParams } from "core/types";

export enum RepoTable {
  Networks = "networks",
  Accounts = "accounts",
}

export interface INetwork {
  chainId: number;
  type: INetworkType;
  rpcUrls: string[];
  chainTag: string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  ensRegistry?: string;
  explorerUrls?: string[];
  iconUrls?: string[];
  faucetUrls?: string[];
  infoUrl?: string;
}

export type IAccount = AccountParams & {
  address: string;
  name: string;
  usdValues: Record<number, string>;
};

export type INetworkType = "mainnet" | "testnet" | "manually-added";
