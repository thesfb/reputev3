import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Scale } from "lucide-react";

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
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
};

const FeaturesSection = () => {
  return (
    <section className="relative py-24 border-t border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Three pillars of compliant privacy
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Built on zero-knowledge proofs, account abstraction, and on-chain verification.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="glass rounded-xl p-6 card-hover group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
