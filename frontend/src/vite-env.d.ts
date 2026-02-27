/// <reference types="vite/client" />

// snarkjs doesn't ship types
declare module "snarkjs" {
  export const groth16: {
    fullProve(
      input: Record<string, bigint | string | number>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
      };
      publicSignals: string[];
    }>;
    verify(
      verificationKey: unknown,
      publicSignals: string[],
      proof: unknown
    ): Promise<boolean>;
  };
}

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_PAYMASTER_ADDRESS: string;
  readonly VITE_VERIFIER_ADDRESS: string;
  readonly VITE_BSC_TESTNET_RPC: string;
  readonly VITE_BSC_MAINNET_RPC: string;
  readonly VITE_BSCSCAN_API_KEY: string;
  readonly VITE_BUNDLER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
