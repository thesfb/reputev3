import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingNav from "@/components/LandingNav";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";

const steps = [
  {
    num: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description: "Connect your existing wallet with on-chain history — BNB balance, transactions, and age.",
  },
  {
    num: "02",
    icon: ScanFace,
    title: "Generate ZK Proof",
    description: "A Groth16 proof is generated in your browser. No data leaves your device.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Get Gas Sponsored",
    description: "The Paymaster verifies your proof on-chain and sponsors gas for your fresh wallet.",
  },
  {
    num: "04",
    icon: Sparkles,
    title: "Operate Privately",
    description: "Use your new wallet with no on-chain link to your source. Fully private, fully compliant.",
  },
];

const Index = () => {
  return (
    <div className="gradient-bg min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />

      {/* Step-by-step flow — vertical timeline */}
      <section className="py-28 border-t border-border/30">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-4">
              Step by step
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              From wallet to privacy in four steps
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />

            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-5"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1.5 shrink-0">
                    <div className="w-[10px] h-[10px] rounded-full bg-primary ring-4 ring-background" />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-[10px] font-mono text-primary/50 uppercase tracking-widest">{step.num}</span>
                      <h3 className="font-display text-sm font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-lg mx-auto"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to go private?
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
              No sign-up required. Connect your wallet, generate a proof, and start
              operating with compliant privacy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/app">
                <Button size="lg" className="text-sm px-7 h-12 font-medium glow-primary rounded-xl">
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-sm px-7 h-12 font-medium rounded-xl border-border/60">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-6">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 Repute. Compliant privacy on BNB Chain.</span>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/app/docs" className="hover:text-foreground transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
