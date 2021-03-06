import { JsonRpcProvider } from "@ethersproject/providers";
import memoizeOne from "memoize-one";
import memoize from "mem";
import { assert } from "lib/system/assert";

import { MessageType, RpcResponse } from "core/types";

import { porter } from "./base";

export const getClientProvider = memoize(
  (chainId: number) => new ClientProvider(chainId)
);

export class ClientProvider extends JsonRpcProvider {
  constructor(chainId: number) {
    super("", chainId);
  }

  getNetwork = memoizeOne(super.getNetwork.bind(this));

  getSigner = memoize(super.getSigner.bind(this));

  async send(method: string, params: Array<any>): Promise<any> {
    const type = MessageType.SendRpc;
    const { chainId } = this.network;

    const res = await porter.request({ type, chainId, method, params });
    assert(res?.type === type);

    return getResult(res.response);
  }
}

function getResult(response: RpcResponse): any {
  if ("error" in response) {
    const error = new Error(response.error.message);
    (error as any).code = response.error.code;
    (error as any).data = response.error.data;

    throw error;
  }

  return response.result;
}
