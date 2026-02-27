import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-14 overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Live on BNB Chain Testnet
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-5">
            <span className="text-foreground">Compliant Privacy</span>
            <br />
            <span className="text-foreground">for </span>
            <span className="gradient-text">Every Wallet</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
            Prove your wallet is reputable with zero-knowledge proofs.
            Get gas sponsored for a fresh wallet — no identity exposed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/app">
              <Button size="lg" className="text-sm px-6 h-11 font-medium glow-primary">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/app/docs">
              <Button variant="outline" size="lg" className="text-sm px-6 h-11 font-medium">
                Read the Docs
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-20 flex items-center justify-center gap-8 text-xs text-muted-foreground"
        >
          {[
            { icon: Shield, label: "ZK Verified" },
            { icon: Lock, label: "No Data On-Chain" },
            { icon: Zap, label: "ERC-4337 Native" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
