import {
  FC,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import classNames from "clsx";
import { useSteps } from "lib/use-steps";
import useForceUpdate from "use-force-update";
import { ethers } from "ethers";
import Transport from "@ledgerhq/hw-transport";
import LedgerEth from "@ledgerhq/hw-app-eth";
import { LedgerTransport, getExtendedKey } from "lib/ledger";
import retry from "async-retry";

import { INITIAL_NETWORK } from "fixtures/networks";
import { AccountType, AccountSource, AddLedgerAccountParams } from "core/types";
import { generatePreviewHDNodes } from "core/common";
import { addAccounts, ClientProvider } from "core/client";
import { INetwork } from "core/repo";

import { WalletStep } from "app/defaults";
import AccountPreview from "app/components/elements/AccountPreview";

import ContinueButton from "../ContinueButton";

const rootDerivationPath = "m/44'/60'/0'/0";

type AddLedgerAccountsProps = {
  initialSetup?: boolean;
};

const AddLedgerAccounts: FC<AddLedgerAccountsProps> = ({ initialSetup }) => {
  const { stateRef, navigateToStep } = useSteps();

  const [extendedKey, setExtendedKey] = useState<string | null>(null);

  const transportRef = useRef<Transport>();

  const handleConnect = useCallback(async () => {
    try {
      await retry(
        async () => {
          await transportRef.current?.close();
          transportRef.current = await LedgerTransport.create();

          const ledgerEth = new LedgerEth(transportRef.current);
          const { publicKey, chainCode } = await ledgerEth.getAddress(
            rootDerivationPath,
            false,
            true
          );

          const extendedKey = getExtendedKey(publicKey, chainCode!);
          setExtendedKey(extendedKey);
        },
        { retries: 5, maxTimeout: 2_000 }
      );
    } catch (err) {
      console.error(err);
    }
  }, [setExtendedKey]);

  useEffect(
    () => () => {
      transportRef.current?.close();
    },
    []
  );

  const [network] = useState(INITIAL_NETWORK);
  const provider = useMemo(
    () => new ClientProvider(network.chainId),
    [network]
  );

  const accounts = useMemo(
    () => (extendedKey ? generatePreviewHDNodes(extendedKey) : null),
    [extendedKey]
  );

  const addressesToAddRef = useRef(new Set<string>());
  const forceUpdate = useForceUpdate();

  const toggleAddress = useCallback(
    (address: string) => {
      const addressesToAdd = addressesToAddRef.current;
      if (addressesToAdd.has(address)) {
        addressesToAdd.delete(address);
      } else {
        addressesToAdd.add(address);
      }
      forceUpdate();
    },
    [forceUpdate]
  );

  const canContinue = addressesToAddRef.current.size > 0;

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;

    try {
      const addressesToAdd = Array.from(addressesToAddRef.current);
      const addAccountsParams: AddLedgerAccountParams[] = addressesToAdd.map(
        (address, i) => {
          const hdIndex = accounts!.findIndex((n) => n.address === address);
          return {
            type: AccountType.External,
            source: AccountSource.Ledger,
            name: `{{wallet}} ${i + 1}`,
            derivationPath: `${rootDerivationPath}/${hdIndex}`,
            publicKey: accounts![hdIndex].publicKey,
          };
        }
      );

      if (initialSetup) {
        Object.assign(stateRef.current, { addAccountsParams });
        navigateToStep(WalletStep.SetupPassword);
      } else {
        await addAccounts(addAccountsParams);
      }
    } catch (err) {
      console.error(err);
    }
  }, [canContinue, accounts, initialSetup, navigateToStep, stateRef]);

  return (
    <div className="flex flex-col items-center justify-center">
      {accounts ? (
        <div className="flex flex-wrap">
          {accounts.map(({ address }) => {
            const toAdd = addressesToAddRef.current.has(address);

            return (
              <button
                key={address}
                type="button"
                className={classNames(
                  "w-1/3 p-4",
                  "text-left",
                  toAdd && "bg-white bg-opacity-10",
                  "transition ease-in-out duration-200"
                )}
                onClick={() => toggleAddress(address)}
              >
                <Account
                  address={address}
                  provider={provider}
                  network={network}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          className="mt-8 text-white text-xl font-semibold"
          onClick={handleConnect}
        >
          Connect
        </button>
      )}

      <ContinueButton disabled={!canContinue} onClick={handleContinue} />
    </div>
  );
};

export default AddLedgerAccounts;

type AccountProps = {
  address: string;
  provider: ethers.providers.Provider;
  network: INetwork;
};

const Account = memo<AccountProps>(({ address, provider, network }) => {
  const [balance, setBalance] = useState<ethers.BigNumber | null>(null);

  useEffect(() => {
    provider
      .getBalance(address)
      .then((b) => setBalance(b))
      .catch(console.error);
  }, [provider, address, setBalance]);

  const baseAsset = useMemo(
    () =>
      balance
        ? {
            symbol: network.nativeCurrency.symbol,
            name: network.nativeCurrency.name,
            balance,
          }
        : undefined,
    [network, balance]
  );

  return <AccountPreview address={address} baseAsset={baseAsset} />;
});
