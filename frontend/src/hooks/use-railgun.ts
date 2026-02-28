/**
 * useRailgun — React hook for the Railgun shield flow.
 *
 * Manages the full lifecycle of shielding tokens:
 *   Shield → Private Transfer → Unshield → Forward to Paymaster
 *
 * Provides reactive state for UI progress indicators.
 */

import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  executeShieldFlow,
  executeMockShieldFlow,
  type ShieldState,
  type ShieldResult,
  type ShieldStep,
  SUPPORTED_TOKENS,
  SHIELD_STEP_LABELS,
  isActiveStep,
  getStepProgress,
} from "@/lib/railgun";
import { RAILGUN_RELAY_ADDRESS } from "@/config/contracts";
import type { Address } from "viem";

export interface UseRailgunReturn {
  /** Current shield flow state */
  shieldState: ShieldState;
  /** Whether the flow is in progress */
  isShielding: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Human-readable label for current step */
  stepLabel: string;
  /** The result after completion */
  result: ShieldResult | null;
  /** Start the shield flow */
  shield: (tokenSymbol: string, amount: string) => Promise<ShieldResult>;
  /** Start a mock shield flow (demo mode) */
  shieldMock: (tokenSymbol: string, amount: string) => Promise<ShieldResult>;
  /** Reset state to idle */
  reset: () => void;
  /** Whether Railgun is available on the current chain */
  isAvailable: boolean;
  /** List of supported tokens */
  supportedTokens: typeof SUPPORTED_TOKENS;
}

export function useRailgun(): UseRailgunReturn {
  const { address } = useAccount();
  const chainId = useChainId();

  const [shieldState, setShieldState] = useState<ShieldState>({ step: "idle" });
  const [result, setResult] = useState<ShieldResult | null>(null);

  const isShielding = isActiveStep(shieldState.step);
  const progress = getStepProgress(shieldState.step);
  const stepLabel = SHIELD_STEP_LABELS[shieldState.step];

  // Railgun is available if the relay address is configured
  const isAvailable = RAILGUN_RELAY_ADDRESS !== "0x0000000000000000000000000000000000000000";

  /**
   * Execute the real shield flow (uses on-chain transactions)
   */
  const shield = useCallback(
    async (tokenSymbol: string, amount: string): Promise<ShieldResult> => {
      if (!address) {
        const errorResult: ShieldResult = {
          success: false,
          netAmount: "0",
          feeAmount: "0",
          tokenSymbol,
          error: "Wallet not connected",
        };
        setResult(errorResult);
        return errorResult;
      }

      setResult(null);
      setShieldState({ step: "idle" });

      try {
        const shieldResult = await executeShieldFlow(
          {
            tokenSymbol,
            amount,
            fromAddress: address as Address,
            relayContractAddress: RAILGUN_RELAY_ADDRESS as Address,
            chainId,
          },
          setShieldState
        );

        setResult(shieldResult);
        return shieldResult;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const errorResult: ShieldResult = {
          success: false,
          netAmount: "0",
          feeAmount: "0",
          tokenSymbol,
          error: message,
        };
        setShieldState({ step: "error", error: message });
        setResult(errorResult);
        return errorResult;
      }
    },
    [address, chainId]
  );

  /**
   * Execute a mock shield flow (no real transactions, for demo)
   */
  const shieldMock = useCallback(
    async (tokenSymbol: string, amount: string): Promise<ShieldResult> => {
      setResult(null);
      setShieldState({ step: "idle" });

      const mockResult = await executeMockShieldFlow(
        tokenSymbol,
        amount,
        setShieldState
      );

      setResult(mockResult);
      return mockResult;
    },
    []
  );

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    setShieldState({ step: "idle" });
    setResult(null);
  }, []);

  return {
    shieldState,
    isShielding,
    progress,
    stepLabel,
    result,
    shield,
    shieldMock,
    reset,
    isAvailable,
    supportedTokens: SUPPORTED_TOKENS,
  };
}
