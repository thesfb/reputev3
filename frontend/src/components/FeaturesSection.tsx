import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Scale, Terminal } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Identity-Gated",
    description: "Prove your wallet is reputable with a Zero-Knowledge Proof. No personal data is ever revealed on-chain.",
  },
  {
    icon: ShieldCheck,
    title: "Private Gas Sponsorship",
    description: "An ERC-4337 Paymaster sponsors gas for your fresh wallet. No on-chain link between your two wallets.",
  },
  {
    icon: Scale,
    title: "Compliant by Design",
    description: "Only wallets with verifiable reputation can access the relayer. Keeps illicit money out with cryptographic guarantees.",
  },
  {
    icon: Terminal,
    title: "CLI & SDK",
    description: "Programmatic access for AI agents and developers. Check reputation, generate proofs, and activate wallets from the command line with --json output.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const FeaturesSection = () => {
  return (
    <section className="relative py-28 border-t border-border/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-4">How it works</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Three pillars of compliant privacy
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Built on zero-knowledge proofs, account abstraction, and on-chain verification.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative rounded-xl border border-border/50 bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-card/80"
            >
              {/* Left accent line */}
              <div className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-primary/40 via-primary/15 to-transparent" />
              <div className="pl-4">
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-base font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
