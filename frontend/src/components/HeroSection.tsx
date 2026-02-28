import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-14 overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-50" />

      {/* Ambient teal glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto"
        >
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.06] text-xs text-primary mb-10 font-medium tracking-wide"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live on BNB Chain Testnet
          </motion.div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
            <span className="text-foreground">Private Gas,</span>
            <br />
            <span className="gradient-text">Proven Identity</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-12 leading-relaxed font-light">
            Prove your wallet's reputation with zero-knowledge proofs.
            Get gas sponsored for a fresh wallet — no identity exposed.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/app">
              <Button size="lg" className="text-sm px-7 h-12 font-medium glow-primary rounded-xl">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/app/docs">
              <Button variant="outline" size="lg" className="text-sm px-7 h-12 font-medium rounded-xl border-border/60 hover:bg-card hover:border-primary/25 transition-all">
                Documentation
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-24 flex items-center justify-center gap-10 text-xs text-muted-foreground"
        >
          {[
            { icon: Shield, label: "Groth16 ZK Proofs" },
            { icon: Lock, label: "Railgun Shielded" },
            { icon: Zap, label: "ERC-4337 Native" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
              <item.icon className="h-3.5 w-3.5 text-primary/70" />
              <span className="font-medium tracking-wide">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
