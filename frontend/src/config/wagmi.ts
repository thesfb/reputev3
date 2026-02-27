import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { bscTestnet, bsc } from "wagmi/chains";

// Use BSC Testnet for development, BSC Mainnet for production
export const config = getDefaultConfig({
  appName: "Repute Privacy Relayer",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [bscTestnet, bsc],
  transports: {
    [bscTestnet.id]: http(
      import.meta.env.VITE_BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/"
    ),
    [bsc.id]: http(
      import.meta.env.VITE_BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org/"
    ),
  },
});

// Default chain for the app
export const defaultChain = bscTestnet;
