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
  Lock,
  Coins,
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
import { useRailgun } from "@/hooks/use-railgun";
import {
  SHIELD_STEP_LABELS,
  type ShieldResult,
  SUPPORTED_TOKENS,
} from "@/lib/railgun";

type Step = 1 | 2 | 3 | 4 | 5;

const steps = [
  { num: 1, label: "Connect", icon: Wallet },
  { num: 2, label: "Shield", icon: Lock },
  { num: 3, label: "Prove", icon: ScanFace },
  { num: 4, label: "Pay", icon: ShieldCheck },
  { num: 5, label: "Operate", icon: PartyPopper },
];

const RelayerFlow = () => {
  const { address: walletA, isConnected: isWalletAConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const railgun = useRailgun();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [fetchingReputation, setFetchingReputation] = useState(false);

  // Step 2 data (Railgun shield)
  const [selectedToken, setSelectedToken] = useState<string>("USDT");
  const [shieldAmount, setShieldAmount] = useState<string>("5");
  const [shieldResult, setShieldResult] = useState<ShieldResult | null>(null);

  // Step 3 data
  const [zkProof, setZkProof] = useState<ZKProofResult | null>(null);

  // Step 4 data
  const [walletB, setWalletB] = useState<string>("");
  const [walletBInput, setWalletBInput] = useState("");

  // Step 5 data
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

  const proceedToShield = useCallback(() => {
    if (reputationData?.isReputable) {
      setCurrentStep(2);
      setError(null);
    }
  }, [reputationData]);

  // === Step 2: Shield Tokens via Railgun ===
  const handleShieldTokens = useCallback(async () => {
    setError(null);
    try {
      // Use mock flow for demo (no real tokens needed)
      const result = await railgun.shieldMock(selectedToken, shieldAmount);
      if (result.success) {
        setShieldResult(result);
        setCurrentStep(3);
      } else {
        setError(result.error || "Shield flow failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to shield tokens");
    }
  }, [railgun, selectedToken, shieldAmount]);

  const handleShieldTokensReal = useCallback(async () => {
    setError(null);
    try {
      const result = await railgun.shield(selectedToken, shieldAmount);
      if (result.success) {
        setShieldResult(result);
        setCurrentStep(3);
      } else {
        setError(result.error || "Shield flow failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to shield tokens");
    }
  }, [railgun, selectedToken, shieldAmount]);

  // === Step 3: Generate ZK Proof ===
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
      setCurrentStep(4);
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
      setCurrentStep(5);
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
    setShieldResult(null);
    setZkProof(null);
    setWalletB("");
    setWalletBInput("");
    setActivationResult(null);
    setError(null);
    setLoading(false);
    railgun.reset();
    disconnect();
  }, [disconnect, railgun]);

  return (
    <div className="space-y-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                  currentStep > step.num
                    ? "bg-success/10 text-success"
                    : currentStep === step.num
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.num ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <step.icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                currentStep >= step.num ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`hidden sm:block w-12 md:w-20 h-px mx-2 mb-5 transition-colors duration-200 ${
                  currentStep > step.num ? "bg-success/30" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/15"
        >
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive/90">{error}</p>
        </motion.div>
      )}

      {/* Step content */}
      <div className="glass rounded-xl p-6 md:p-8 min-h-[340px]">
        <AnimatePresence mode="wait">
          {/* ====== STEP 1: Connect Wallet A ====== */}
          {currentStep === 1 && (
            <StepContent key="step1" title="Connect Legacy Wallet" icon={Wallet}>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Connect your existing wallet (Wallet A). We'll read its on-chain
                reputation signals without posting anything.
              </p>

              {!isWalletAConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button onClick={openConnectModal} size="sm" className="glow-primary">
                      Connect Wallet A
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
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
                      size="sm"
                    >
                      {fetchingReputation ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Reading on-chain data…
                        </>
                      ) : (
                        <>
                          Analyze Reputation
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
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
                        <Button onClick={proceedToShield} size="sm">
                          Continue to Shield
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </StepContent>
          )}

          {/* ====== STEP 2: Shield via Railgun ====== */}
          {currentStep === 2 && (
            <StepContent key="step2" title="Shield Payment via Railgun" icon={Lock}>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Deposit tokens into Railgun's shielded pool. The payment will exit to
                the Paymaster with <span className="text-foreground font-medium">no traceable link</span> to
                your wallet.
              </p>

              {!shieldResult ? (
                <div className="space-y-4">
                  {/* Token selector */}
                  <div className="glass-subtle rounded-lg p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Payment Configuration
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted-foreground w-16">Token</label>
                      <div className="flex gap-2">
                        {Object.keys(SUPPORTED_TOKENS).map((sym) => (
                          <button
                            key={sym}
                            onClick={() => setSelectedToken(sym)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              selectedToken === sym
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
                            }`}
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted-foreground w-16">Amount</label>
                      <input
                        type="text"
                        value={shieldAmount}
                        onChange={(e) => setShieldAmount(e.target.value)}
                        placeholder="5.00"
                        className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-[120px]"
                      />
                      <span className="text-xs text-muted-foreground">
                        ({selectedToken})
                      </span>
                    </div>

                    <div className="border-t border-border/50 pt-2 mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Relay fee (5%)</span>
                        <span className="text-muted-foreground">
                          {(parseFloat(shieldAmount || "0") * 0.05).toFixed(2)} {selectedToken}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Net to Paymaster</span>
                        <span className="text-foreground font-medium">
                          {(parseFloat(shieldAmount || "0") * 0.95).toFixed(2)} {selectedToken}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shield progress */}
                  {railgun.isShielding && (
                    <div className="glass-subtle rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-foreground">{railgun.stepLabel}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${railgun.progress}%` }}
                        />
                      </div>
                      {railgun.shieldState.txHash && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Tx: {railgun.shieldState.txHash.slice(0, 14)}…
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleShieldTokens}
                      disabled={railgun.isShielding || !shieldAmount || parseFloat(shieldAmount) <= 0}
                      size="sm"
                    >
                      {railgun.isShielding ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Shielding…
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-3.5 w-3.5" />
                          Shield & Pay
                        </>
                      )}
                    </Button>

                    {railgun.isAvailable && (
                      <Button
                        onClick={handleShieldTokensReal}
                        disabled={railgun.isShielding}
                        variant="outline"
                        size="sm"
                        className="border-primary/30"
                      >
                        <Coins className="mr-2 h-3.5 w-3.5" />
                        Use Real Tokens
                      </Button>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground/70">
                    Demo mode uses simulated shielding. On mainnet, tokens are routed
                    through Railgun's encrypted UTXO pool.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Shield result */}
                  <div className="glass-subtle rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-success mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Payment shielded successfully</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposited</span>
                      <span className="text-foreground">{shieldAmount} {selectedToken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Relay Fee</span>
                      <span className="text-muted-foreground">{shieldResult.feeAmount} {selectedToken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Net to Paymaster</span>
                      <span className="text-success font-medium">{shieldResult.netAmount} {selectedToken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">On-chain link to Wallet A</span>
                      <span className="text-destructive text-xs font-medium">None ✓</span>
                    </div>
                  </div>

                  <Button onClick={() => { setCurrentStep(3); setError(null); }} size="sm">
                    Continue to Proof Generation
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </StepContent>
          )}

          {/* ====== STEP 3: Generate ZK Proof ====== */}
          {currentStep === 3 && (
            <StepContent key="step3" title="Generate ZK Proof" icon={ScanFace}>
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
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Generates a zero-knowledge proof that your wallet meets
                reputation criteria — without revealing your wallet address.
              </p>
              <Button
                onClick={handleGenerateProof}
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Generating Groth16 Proof…
                  </>
                ) : (
                  <>
                    Generate ZK Proof
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </StepContent>
          )}

          {/* ====== STEP 4: Pay Privately + Connect Wallet B ====== */}
          {currentStep === 4 && zkProof && (
            <StepContent key="step4" title="Pay Privately & Activate" icon={ShieldCheck}>
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

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
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
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Submitting UserOp…
                      </>
                    ) : (
                      <>
                        Activate Paymaster
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </StepContent>
          )}

          {/* ====== STEP 5: Success ====== */}
          {currentStep === 5 && (
            <StepContent key="step5" title="Activation Successful" icon={PartyPopper}>
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-success" />
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

              <p className="text-sm font-medium text-foreground text-center mb-1">
                Paymaster verified, nullifier spent, gas sponsored.
              </p>
              <p className="text-xs text-muted-foreground text-center mb-8">
                Fully private. No on-chain link to Wallet A exists anywhere.
              </p>

              <div className="flex justify-center gap-2">
                <Button
                  onClick={reset}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  New Session
                </Button>
                {activationResult && (
                  <a
                    href={`https://testnet.bscscan.com/tx/${activationResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      BSCScan
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
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -12 }}
    transition={{ duration: 0.25 }}
  >
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
    {children}
  </motion.div>
);

export default RelayerFlow;
