import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ScanFace, ShieldCheck, PartyPopper, Loader2, Check, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = 1 | 2 | 3 | 4;

const steps = [
  { num: 1, label: "Shield", icon: Wallet },
  { num: 2, label: "Prove", icon: ScanFace },
  { num: 3, label: "Pay", icon: ShieldCheck },
  { num: 4, label: "Operate", icon: PartyPopper },
];

const RelayerFlow = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [walletBConnected, setWalletBConnected] = useState(false);

  const handleGenerateProof = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(3);
    }, 2000);
  };

  const reset = () => {
    setCurrentStep(1);
    setWalletBConnected(false);
  };

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
              {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
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

      {/* Step content */}
      <div className="glass rounded-xl p-8 min-h-[320px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <StepContent key="step1" title="Connect Legacy Wallet" icon={Wallet}>
              <p className="text-muted-foreground mb-6">
                Connect your old funded wallet (Wallet A). This wallet holds the funds you want to use privately.
              </p>
              <Button onClick={() => setCurrentStep(2)} className="glow-primary">
                Connect Wallet A
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </StepContent>
          )}

          {currentStep === 2 && (
            <StepContent key="step2" title="Generate ZK Proof" icon={ScanFace}>
              <div className="glass-subtle rounded-lg p-4 mb-6 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  On-Chain Reputation Signals
                </p>
                {["BNB holding duration", "Transaction history", "Dev activity", "Academic credentials"].map((signal) => (
                  <div key={signal} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {signal}
                  </div>
                ))}
              </div>
              <Button onClick={handleGenerateProof} disabled={loading} className="glow-primary">
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

          {currentStep === 3 && (
            <StepContent key="step3" title="Pay Privately" icon={ShieldCheck}>
              <div className="glass-subtle rounded-lg p-4 mb-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proof ID</span>
                  <span className="font-mono text-foreground text-xs">0x7f3a…e91b</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nullifier</span>
                  <span className="font-mono text-foreground text-xs">••••••••••••</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Shielded transfer from Railgun pool → Paymaster. Your funding source remains completely private.
              </p>
              {!walletBConnected ? (
                <Button onClick={() => setWalletBConnected(true)} variant="outline" className="border-primary/30 hover:bg-primary/10">
                  Connect Fresh Wallet (Wallet B)
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Check className="h-4 w-4" />
                    Wallet B Connected
                  </div>
                  <Button onClick={() => setCurrentStep(4)} className="glow-primary">
                    Activate Paymaster
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </StepContent>
          )}

          {currentStep === 4 && (
            <StepContent key="step4" title="Operation Successful" icon={PartyPopper}>
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center glow-success">
                  <Check className="h-8 w-8 text-success" />
                </div>
              </div>
              <p className="text-foreground font-medium text-center mb-2">
                Paymaster verifies, marks nullifier spent, sponsors gas.
              </p>
              <p className="text-muted-foreground text-sm text-center mb-8">
                Fully private. No on-chain link to Wallet A exists anywhere.
              </p>
              <div className="flex justify-center">
                <Button onClick={reset} variant="outline" className="border-primary/30 hover:bg-primary/10">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start New Session
                </Button>
              </div>
            </StepContent>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

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
