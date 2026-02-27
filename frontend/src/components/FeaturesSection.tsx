import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Scale } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Identity-Gated",
    description: "Users prove they are reputable via a Zero-Knowledge Proof. No personal data is ever exposed on-chain.",
  },
  {
    icon: ShieldCheck,
    title: "Shield-First Payments",
    description: "Uses Railgun's shielded pool to break the payment link natively. Your funding source stays private.",
  },
  {
    icon: Scale,
    title: "Fully Compliant",
    description: "Keeps poisoned money out by design. Only verified, reputable users can access the relayer.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const FeaturesSection = () => {
  return (
    <section className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three pillars of compliant privacy infrastructure.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="glass rounded-xl p-8 hover:border-primary/20 transition-colors duration-300 group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
