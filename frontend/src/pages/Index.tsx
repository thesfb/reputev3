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
    <div className="gradient-bg min-h-screen noise">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />

      {/* Step-by-step flow */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
              Step by step
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              From wallet to privacy in four steps
            </h2>
          </motion.div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass rounded-xl p-5 flex items-start gap-4 card-hover"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{step.num}</span>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-10 md:p-14 text-center max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Ready to go private?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              No sign-up required. Connect your wallet, generate a proof, and start
              operating with compliant privacy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/app">
                <Button size="lg" className="text-sm px-6 h-11 font-medium glow-primary">
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="text-sm px-6 h-11 font-medium">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-6">
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
