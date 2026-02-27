import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LandingNav from "@/components/LandingNav";
import {
  Check,
  ArrowRight,
  Shield,
  Zap,
  Building2,
  Users,
  CreditCard,
  Sparkles,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Community",
    price: "Free",
    priceSub: "forever",
    description: "For individual users who want compliant privacy for personal wallets.",
    highlight: false,
    icon: Users,
    features: [
      "3 paymaster activations / month",
      "Browser-side ZK proof generation",
      "BSC Testnet access",
      "Standard gas sponsorship limits",
      "Community support",
    ],
    cta: "Get Started",
    ctaLink: "/app",
  },
  {
    name: "Pro",
    price: "$49",
    priceSub: "/ month",
    description: "For power users and teams needing higher throughput and mainnet access.",
    highlight: true,
    icon: Zap,
    features: [
      "Unlimited paymaster activations",
      "BSC Mainnet + Testnet access",
      "Priority gas sponsorship",
      "API access for automation",
      "Custom reputation thresholds",
      "Email & chat support",
    ],
    cta: "Start Free Trial",
    ctaLink: "/app",
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceSub: "tailored",
    description: "For protocols and organizations needing white-label privacy infrastructure.",
    highlight: false,
    icon: Building2,
    features: [
      "Everything in Pro",
      "White-label relayer deployment",
      "Custom ZK circuits & criteria",
      "Dedicated paymaster contracts",
      "Multi-chain deployment",
      "SLA & dedicated support",
      "Compliance reporting dashboard",
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:hello@repute.xyz",
  },
];

const businessModelPoints = [
  {
    icon: CreditCard,
    title: "Gas Margin",
    description:
      "Small protocol fee (2-5%) on each sponsored UserOperation. Volume users save vs. direct gas payments.",
  },
  {
    icon: Shield,
    title: "Compliance-as-a-Service",
    description:
      "ZK-gated access ensures only reputable wallets use the service. No sanctions screening headaches.",
  },
  {
    icon: Sparkles,
    title: "Premium API",
    description:
      "Programmatic access to proof generation, reputation scoring, and paymaster activation.",
  },
  {
    icon: Infinity,
    title: "White-Label Licensing",
    description:
      "Deploy your own branded privacy relayer with custom criteria, powered by Repute infrastructure.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
};

const Pricing = () => {
  return (
    <div className="gradient-bg min-h-screen noise">
      <LandingNav />

      {/* Hero */}
      <section className="pt-28 pb-14">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-5 text-xs">
              Transparent pricing
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Privacy shouldn't be{" "}
              <span className="gradient-text">expensive</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start free. Scale as your privacy infrastructure needs grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            {tiers.map((tier) => (
              <motion.div
                key={tier.name}
                variants={item}
                className={`rounded-xl p-5 flex flex-col relative ${
                  tier.highlight
                    ? "glass border-primary/30 glow-primary"
                    : "glass"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-medium px-2.5 py-0.5">
                      Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <tier.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-xs text-muted-foreground">{tier.priceSub}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.ctaLink.startsWith("mailto") ? (
                  <Button
                    variant={tier.highlight ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs font-medium"
                    asChild
                  >
                    <a href={tier.ctaLink}>
                      {tier.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                ) : (
                  <Link to={tier.ctaLink}>
                    <Button
                      variant={tier.highlight ? "default" : "outline"}
                      size="sm"
                      className="w-full text-xs font-medium"
                    >
                      {tier.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Business Model */}
      <section className="pb-20 border-t border-border/50 pt-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
              Business model
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              How we make money
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Sustainable revenue aligned with user privacy. We never monetize your data.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {businessModelPoints.map((point) => (
              <motion.div
                key={point.title}
                variants={item}
                className="glass rounded-xl p-5 card-hover"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <point.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-0.5">
                      {point.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl p-10 text-center max-w-2xl mx-auto"
          >
            <h2 className="text-xl font-bold text-foreground mb-2">
              Ready for compliant privacy?
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Start free — no credit card needed. Generate your first ZK proof in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/app">
                <Button size="default" className="text-sm font-medium glow-primary px-6">
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:hello@repute.xyz">
                <Button variant="outline" size="default" className="text-sm font-medium px-6">
                  Talk to Sales
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 Repute. Compliant privacy on BNB Chain.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/app/docs" className="hover:text-foreground transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
