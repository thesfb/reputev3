import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ScanFace,
  ShieldCheck,
  PartyPopper,
  Loader2,
  Check,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";
import { type Address } from "viem";
import {
  fetchReputationData,
  getMockReputationData,
  type ReputationData,
  DEFAULT_CRITERIA,
} from "@/lib/reputation";
import {
  generateReputationProof,
  formatNullifier,
  formatProofId,
  type ZKProofResult,
} from "@/lib/zkproof";
import {
  buildActivationUserOp,
  submitUserOp,
  formatTxHash,
} from "@/lib/paymaster";

type Step = 1 | 2 | 3 | 4;

const steps = [
  { num: 1, label: "Shield", icon: Wallet },
  { num: 2, label: "Prove", icon: ScanFace },
  { num: 3, label: "Pay", icon: ShieldCheck },
  { num: 4, label: "Operate", icon: PartyPopper },
];

const RelayerFlow = () => {
  const { address: walletA, isConnected: isWalletAConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [fetchingReputation, setFetchingReputation] = useState(false);

  // Step 2 data
  const [zkProof, setZkProof] = useState<ZKProofResult | null>(null);

  // Step 3 data
  const [walletB, setWalletB] = useState<string>("");
  const [walletBInput, setWalletBInput] = useState("");

  // Step 4 data
  const [activationResult, setActivationResult] = useState<{
    userOpHash: string;
    txHash: string;
  } | null>(null);

  // Clipboard helper
  const [copied, setCopied] = useState<string | null>(null);
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // === Step 1: Connect Wallet A & Fetch Reputation ===
  const handleFetchReputation = useCallback(async () => {
    if (!walletA) return;
    setFetchingReputation(true);
    setError(null);
    try {
      const data = await fetchReputationData(walletA);
      setReputationData(data);
      if (!data.isReputable) {
        setError(
          `Wallet does not meet minimum criteria. Need: ≥${DEFAULT_CRITERIA.minTxCount} txs, ≥${DEFAULT_CRITERIA.minWalletAge} days age, ≥0.01 BNB`
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch reputation data");
    } finally {
      setFetchingReputation(false);
    }
  }, [walletA]);

  const proceedToProve = useCallback(() => {
    if (reputationData?.isReputable) {
      setCurrentStep(2);
      setError(null);
    }
  }, [reputationData]);

  // === Step 2: Generate ZK Proof ===
  const handleGenerateProof = useCallback(async () => {
    if (!reputationData) return;
    setLoading(true);
    setError(null);
    try {
      const proof = await generateReputationProof(reputationData, {
        minBalance: DEFAULT_CRITERIA.minBalance,
        minTxCount: DEFAULT_CRITERIA.minTxCount,
        minWalletAge: DEFAULT_CRITERIA.minWalletAge,
      });
      setZkProof(proof);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to generate ZK proof");
    } finally {
      setLoading(false);
    }
  }, [reputationData]);

  // === Step 3: Connect Wallet B & Activate ===
  const handleSetWalletB = useCallback(() => {
    const addr = walletBInput.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      if (addr.toLowerCase() === walletA?.toLowerCase()) {
        setError("Wallet B cannot be the same as Wallet A");
        return;
      }
      setWalletB(addr);
      setError(null);
    } else {
      setError("Invalid address format. Must be 0x followed by 40 hex characters.");
    }
  }, [walletBInput, walletA]);

  const handleActivatePaymaster = useCallback(async () => {
    if (!zkProof || !walletB) return;
    setLoading(true);
    setError(null);
    try {
      const userOp = buildActivationUserOp(walletB as Address, zkProof);
      const result = await submitUserOp(userOp);
      setActivationResult(result);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to activate paymaster");
    } finally {
      setLoading(false);
    }
  }, [zkProof, walletB]);

  // === Reset ===
  const reset = useCallback(() => {
    setCurrentStep(1);
    setReputationData(null);
    setZkProof(null);
    setWalletB("");
    setWalletBInput("");
    setActivationResult(null);
    setError(null);
    setLoading(false);
    disconnect();
  }, [disconnect]);

  return (
    <div className="space-y-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                currentStep > step.num
                  ? "bg-success text-success-foreground"
                  : currentStep === step.num
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.num ? (
                <Check className="h-4 w-4" />
              ) : (
                step.num
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`hidden sm:block w-16 md:w-24 h-px mx-2 transition-colors duration-300 ${
                  currentStep > step.num ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Step content */}
      <div className="glass rounded-xl p-8 min-h-[360px]">
        <AnimatePresence mode="wait">
          {/* ====== STEP 1: Connect Wallet A ====== */}
          {currentStep === 1 && (
            <StepContent key="step1" title="Connect Legacy Wallet" icon={Wallet}>
              <p className="text-muted-foreground mb-6">
                Connect your old funded wallet (Wallet A). We'll read its
                on-chain reputation signals without posting anything.
              </p>

              {!isWalletAConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button onClick={openConnectModal} className="glow-primary">
                      Connect Wallet A
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-mono">{walletA}</span>
                  </div>

                  {!reputationData ? (
                    <Button
                      onClick={handleFetchReputation}
                      disabled={fetchingReputation}
                      className="glow-primary"
                    >
                      {fetchingReputation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Reading on-chain data…
                        </>
                      ) : (
                        <>
                          Analyze Reputation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {/* Reputation signals */}
                      <div className="glass-subtle rounded-lg p-4 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Reputation Signals
                        </p>
                        <ReputationSignal
                          label="BNB Balance"
                          value={`${reputationData.bnbBalanceFormatted} BNB`}
                          met={reputationData.meetsMinBalance}
                        />
                        <ReputationSignal
                          label="Transaction Count"
                          value={`${reputationData.txCount} txs`}
                          met={reputationData.meetsMinTxCount}
                        />
                        <ReputationSignal
                          label="Wallet Age"
                          value={`${reputationData.walletAge} days`}
                          met={reputationData.meetsMinAge}
                        />
                      </div>

                      {reputationData.isReputable && (
                        <Button onClick={proceedToProve} className="glow-primary">
                          Continue to Proof Generation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </StepContent>
          )}

          {/* ====== STEP 2: Generate ZK Proof ====== */}
          {currentStep === 2 && (
            <StepContent key="step2" title="Generate ZK Proof" icon={ScanFace}>
              <div className="glass-subtle rounded-lg p-4 mb-6 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Proof Parameters
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proving System</span>
                    <span className="text-foreground font-mono">Groth16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Balance</span>
                    <span className="text-foreground">0.01 BNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Tx Count</span>
                    <span className="text-foreground">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Wallet Age</span>
                    <span className="text-foreground">30 days</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Generates a zero-knowledge proof that your wallet meets
                reputation criteria — without revealing your wallet address.
              </p>
              <Button
                onClick={handleGenerateProof}
                disabled={loading}
                className="glow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Groth16 Proof…
                  </>
                ) : (
                  <>
                    Generate ZK Proof of Reputation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </StepContent>
          )}

          {/* ====== STEP 3: Pay Privately + Connect Wallet B ====== */}
          {currentStep === 3 && zkProof && (
            <StepContent key="step3" title="Pay Privately & Activate" icon={ShieldCheck}>
              <div className="glass-subtle rounded-lg p-4 mb-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Proof ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground text-xs">
                      {formatProofId(zkProof)}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(zkProof.proof.a[0], "proof")
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copied === "proof" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Nullifier</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground text-xs">
                      {formatNullifier(zkProof.nullifierHash)}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(zkProof.nullifierHash, "nullifier")
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copied === "nullifier" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-success text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Valid proof generated
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-4">
                Enter your fresh wallet address (Wallet B). The Paymaster will
                sponsor gas for this wallet — with no on-chain link to Wallet A.
              </p>

              {!walletB ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={walletBInput}
                      onChange={(e) => setWalletBInput(e.target.value)}
                      placeholder="0x... (fresh wallet address)"
                      className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button onClick={handleSetWalletB} variant="outline" className="border-primary/30">
                      Set
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-mono text-xs">{walletB}</span>
                  </div>
                  <Button
                    onClick={handleActivatePaymaster}
                    disabled={loading}
                    className="glow-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting UserOp to Bundler…
                      </>
                    ) : (
                      <>
                        Activate Paymaster
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </StepContent>
          )}

          {/* ====== STEP 4: Success ====== */}
          {currentStep === 4 && (
            <StepContent key="step4" title="Activation Successful" icon={PartyPopper}>
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center glow-success">
                  <Check className="h-8 w-8 text-success" />
                </div>
              </div>

              <div className="glass-subtle rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet B</span>
                  <span className="font-mono text-foreground text-xs">
                    {walletB.slice(0, 10)}…{walletB.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sponsored Ops</span>
                  <span className="text-foreground">10 transactions</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nullifier</span>
                  <span className="text-foreground font-mono text-xs">Spent ✓</span>
                </div>
                {activationResult && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tx Hash</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-foreground text-xs">
                        {formatTxHash(activationResult.txHash)}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(activationResult.txHash, "txhash")
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied === "txhash" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-foreground font-medium text-center mb-2">
                Paymaster verified, nullifier spent, gas sponsored.
              </p>
              <p className="text-muted-foreground text-sm text-center mb-8">
                Fully private. No on-chain link to Wallet A exists anywhere.
              </p>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={reset}
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start New Session
                </Button>
                {activationResult && (
                  <a
                    href={`https://testnet.bscscan.com/tx/${activationResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on BSCScan
                    </Button>
                  </a>
                )}
              </div>
            </StepContent>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// === Sub-components ===

const ReputationSignal = ({
  label,
  value,
  met,
}: {
  label: string;
  value: string;
  met: boolean;
}) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span className="text-foreground">{label}</span>
    </div>
    <span className={`font-mono text-xs ${met ? "text-success" : "text-destructive"}`}>
      {value}
    </span>
  </div>
);

const StepContent = ({
  children,
  title,
  icon: Icon,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
    {children}
  </motion.div>
);

export default RelayerFlow;
