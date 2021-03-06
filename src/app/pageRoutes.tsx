import { match, when, not } from "ts-pattern";
import { Redirect } from "lib/navigation";

import { WalletStatus } from "core/types";

import { Page } from "app/defaults";

import Profiles from "./components/pages/Profiles";
import Unlock from "./components/pages/Unlock";
import Welcome from "./components/pages/Welcome";
import Main from "./components/pages/Main";
import Setup from "./components/pages/Setup";

export type MatchPageParams = {
  page: Page;
  walletStatus: WalletStatus;
  profileCount: number;
};

export function matchPage(params: MatchPageParams) {
  return (
    match(params)
      .with({ walletStatus: WalletStatus.Idle }, () => null)
      .with(
        {
          page: Page.Profiles,
          walletStatus: when((s) =>
            [WalletStatus.Welcome, WalletStatus.Locked].includes(s)
          ),
        },
        () => <Profiles />
      )
      // Unlcok when wallet locked
      .with({ walletStatus: WalletStatus.Locked }, () => <Unlock />)
      .with(
        {
          page: Page.Default,
          walletStatus: WalletStatus.Welcome,
          profileCount: 1,
        },
        () => <Welcome />
      )
      .with(
        {
          page: when((p) => [Page.Default, Page.Setup].includes(p)),
          walletStatus: WalletStatus.Welcome,
        },
        () => <Setup />
      )
      // Only ready below
      .with({ walletStatus: not(WalletStatus.Unlocked) }, () => (
        <Redirect to={{ page: Page.Default }} />
      ))
      .with({ page: Page.Default }, () => <Main />)
      // Redirect to default
      .otherwise(() => <Redirect to={{ page: Page.Default }} />)
  );
}
