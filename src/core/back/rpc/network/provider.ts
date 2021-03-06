import { JsonRpcProvider } from "@ethersproject/providers";
import { providers as multicallProviders } from "@0xsequence/multicall";
import memoizeOne from "memoize-one";
import memoize from "mem";

import { RpcResponse } from "core/types";

export async function sendRpc(
  chainId: number,
  url: string,
  method: string,
  params: any[]
): Promise<RpcResponse> {
  console.info("Perform RPC request", { chainId, url, method, params });

  const { plainProvider, multicallProvider } = await getProvider(url, chainId);

  const getResult = async () => {
    switch (method) {
      /**
       * Cached
       */
      case "eth_chainId":
      case "net_version":
        return plainProvider.getChainId();

      case "eth_blockNumber":
        return plainProvider._getFastBlockNumber();

      case "eth_getBlockByHash":
      case "eth_getBlockByNumber":
        return plainProvider._getBlock(params[0], params[1]);

      /**
       * Multicall
       */
      case "eth_getBalance":
        return multicallProvider.getBalance(params[0], params[1]);

      case "eth_getCode":
        return multicallProvider.getCode(params[0], params[1]);

      case "eth_call":
        return multicallProvider.call(params[0], params[1]);

      /**
       * Rest
       */
      default:
        return plainProvider.send(method, params);
    }
  };

  try {
    return { result: await getResult() };
  } catch (err: any) {
    return {
      error: {
        message: err?.message,
        code: err?.code,
        data: err?.data,
      },
    };
  }
}

const getProvider = memoize((url: string, chainId: number) => {
  const plainProvider = new RpcProvider(url, chainId);
  const multicallProvider = new multicallProviders.MulticallProvider(
    plainProvider
  );

  return { plainProvider, multicallProvider };
});

class RpcProvider extends JsonRpcProvider {
  getNetwork = memoizeOne(super.getNetwork.bind(this));

  getChainId = () => this.getNetwork().then(({ chainId }) => chainId);
}
