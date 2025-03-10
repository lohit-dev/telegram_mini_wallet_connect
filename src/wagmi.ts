import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
} from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    metaMask({
      checkInstallationImmediately: true,
      openDeeplink(arg) {
        console.log("openDeeplink", arg);
      },
    }),
    injected(),
    coinbaseWallet(),
    walletConnect({
      projectId: import.meta.env.VITE_WC_PROJECT_ID,
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
