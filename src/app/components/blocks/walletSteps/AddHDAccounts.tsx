import {
  FC,
  memo,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import classNames from "clsx";
import useForceUpdate from "use-force-update";
import { ethers } from "ethers";
import { useSteps } from "lib/use-steps";
import { useMaybeAtomValue } from "lib/atom-utils";

import { INITIAL_NETWORK } from "fixtures/networks";
import {
  AddHDAccountParams,
  SeedPharse,
  AccountType,
  AccountSource,
} from "core/types";
import {
  toDerivedNeuterExtendedKey,
  generatePreviewHDNodes,
} from "core/common";
import { addAccounts, ClientProvider } from "core/client";
import { INetwork } from "core/repo";

import { hasSeedPhraseAtom, getNeuterExtendedKeyAtom } from "app/atoms";
import { WalletStep } from "app/defaults";
import AccountPreview from "app/components/elements/AccountPreview";

import ContinueButton from "../ContinueButton";

type AddHDAccountsProps = {
  initialSetup?: boolean;
};

const rootDerivationPath = "m/44'/60'/0'/0";
const rootNeuterExtendedKeyAtom = getNeuterExtendedKeyAtom(rootDerivationPath);

const AddHDAccounts: FC<AddHDAccountsProps> = ({ initialSetup }) => {
  const hasSeedPhrase = useMaybeAtomValue(!initialSetup && hasSeedPhraseAtom);
  const existingNeuterExtendedKey = useMaybeAtomValue(
    hasSeedPhrase && rootNeuterExtendedKeyAtom
  );

  const { stateRef, fallbackStep, navigateToStep } = useSteps();
  const seedPhrase: SeedPharse | undefined = stateRef.current.seedPhrase;

  const neuterExtendedKey = useMemo(
    () =>
      existingNeuterExtendedKey ??
      (initialSetup && seedPhrase
        ? toDerivedNeuterExtendedKey(seedPhrase, rootDerivationPath)
        : null),
    [existingNeuterExtendedKey, initialSetup, seedPhrase]
  );

  useEffect(() => {
    if (!neuterExtendedKey) {
      navigateToStep(fallbackStep);
    }
  }, [neuterExtendedKey, navigateToStep, fallbackStep]);

  const [network] = useState(INITIAL_NETWORK);
  const provider = useMemo(
    () => new ClientProvider(network.chainId),
    [network]
  );

  const addresses = useMemo(
    () =>
      neuterExtendedKey
        ? generatePreviewHDNodes(neuterExtendedKey).map(
            ({ address }) => address
          )
        : null,
    [neuterExtendedKey]
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
      const addAccountsParams: AddHDAccountParams[] = addressesToAdd.map(
        (address, i) => {
          const hdIndex = addresses!.findIndex((a) => a === address);
          return {
            type: AccountType.HD,
            source: AccountSource.SeedPhrase,
            name: `{{wallet}} ${i + 1}`,
            derivationPath: `${rootDerivationPath}/${hdIndex}`,
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
  }, [canContinue, addresses, initialSetup, navigateToStep, stateRef]);

  if (!addresses) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-wrap">
        {addresses.map((address) => {
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

      <ContinueButton disabled={!canContinue} onClick={handleContinue} />
    </div>
  );
};

export default AddHDAccounts;

type AccountProps = {
  address: string;
  provider: ethers.providers.Provider;
  network: INetwork;
};

const Account = memo<AccountProps>(({ address, provider, network }) => {
  const [balance, setBalance] = useState<ethers.BigNumber | null>(null);

  useEffect(() => {
    let mounted = true;

    provider
      .getBalance(address)
      .then((b) => mounted && setBalance(b))
      .catch(console.error);

    return () => {
      mounted = false;
    };
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
