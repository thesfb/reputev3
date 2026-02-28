import { motion } from "framer-motion";
import AppSidebar from "@/components/AppSidebar";
import {
  FileText,
  Shield,
  Lock,
  Code,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Terminal,
  Layers,
  Fingerprint,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    id: "overview",
    icon: BookOpen,
    title: "Overview",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          <span className="text-foreground font-medium">Repute</span> is an identity-gated gas
          relayer on BNB Chain. It solves the{" "}
          <span className="text-foreground">"doxxing-at-funding"</span> problem — when a user
          funds a fresh wallet, their source wallet and identity is exposed on-chain.
        </p>
        <p>
          Users prove their wallet has good reputation using a{" "}
          <span className="text-primary">Zero-Knowledge Proof</span> without revealing
          their address. If valid, an ERC-4337 Paymaster sponsors gas for a fresh wallet.
        </p>
        <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-xs text-foreground/60">
          Wallet A (reputable) → ZK Proof → Paymaster verifies → Wallet B gets gas
        </div>
      </div>
    ),
  },
  {
    id: "how-it-works",
    icon: Layers,
    title: "How It Works",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        {[
          {
            step: "1",
            title: "Connect Reputable Wallet",
            desc: "Connect your existing wallet with on-chain history — minimum BNB balance, transaction count, and wallet age.",
          },
          {
            step: "2",
            title: "Generate ZK Proof",
            desc: "A Groth16 proof is generated in your browser via snarkjs. It proves your wallet meets criteria without revealing your address.",
          },
          {
            step: "3",
            title: "Enter Fresh Wallet",
            desc: "Provide a new, unfunded wallet address that you want to activate with sponsored gas.",
          },
          {
            step: "4",
            title: "Paymaster Sponsors Gas",
            desc: "The ERC-4337 Paymaster verifies your ZK proof on-chain and sponsors gas for your fresh wallet via a UserOperation.",
          },
        ].map((s) => (
          <div key={s.step} className="flex gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-semibold mt-0.5">
              {s.step}
            </div>
            <div>
              <p className="text-foreground font-medium text-sm mb-0.5">{s.title}</p>
              <p className="text-xs leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "architecture",
    icon: Code,
    title: "Architecture",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>Three core layers:</p>
        <div className="grid gap-2">
          {[
            {
              label: "Smart Contracts",
              tech: "Solidity 0.8.23",
              desc: "Groth16Verifier for on-chain proof verification. ReputePaymaster (ERC-4337) for gas sponsorship.",
            },
            {
              label: "ZK Circuit",
              tech: "Circom 2.1.6",
              desc: "Proves wallet meets reputation criteria. Poseidon hashes for nullifier and commitment binding.",
            },
            {
              label: "Frontend",
              tech: "React + Vite",
              desc: "4-step wizard UI. Browser-side proof generation via snarkjs. RainbowKit wallet connection.",
            },
            {
              label: "CLI Tool",
              tech: "Node.js",
              desc: "Command-line interface for AI agents & devs. Check reputation, generate proofs, build UserOps. Supports --json output for scripting.",
            },
          ].map((layer) => (
            <div key={layer.label} className="rounded-lg bg-muted/40 border border-border p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-foreground font-medium text-sm">{layer.label}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {layer.tech}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{layer.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "zk-proofs",
    icon: Fingerprint,
    title: "ZK Proof System",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          The circuit has{" "}
          <span className="text-foreground font-medium">5 public signals</span> and{" "}
          <span className="text-foreground font-medium">5 private inputs</span>:
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/40 border border-border p-3">
            <p className="text-xs font-medium text-primary mb-1.5">Public Signals</p>
            <ul className="space-y-0.5 text-xs font-mono text-foreground/60">
              <li>nullifierHash</li>
              <li>minBalance</li>
              <li>minTxCount</li>
              <li>minWalletAge</li>
              <li>commitmentHash</li>
            </ul>
          </div>
          <div className="rounded-lg bg-muted/40 border border-border p-3">
            <p className="text-xs font-medium text-primary mb-1.5">Private Inputs</p>
            <ul className="space-y-0.5 text-xs font-mono text-foreground/60">
              <li>walletAddress</li>
              <li>secret</li>
              <li>bnbBalance</li>
              <li>txCount</li>
              <li>walletAge</li>
            </ul>
          </div>
        </div>
        <p className="text-xs">
          Verification uses bn128 precompiles (EC add, scalar mul, pairing check). Nullifiers prevent double-use.
        </p>
      </div>
    ),
  },
  {
    id: "security",
    icon: Lock,
    title: "Security & Compliance",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <ul className="space-y-2">
          {[
            "Only wallets with proven reputation can access the relayer.",
            "ZK nullifiers prevent double-spending per epoch.",
            "No personal data stored or exposed on-chain.",
            "Owner-controlled criteria for minimum balance, tx count, and age.",
            "Capped sponsored operations per wallet to prevent abuse.",
          ].map((point, i) => (
            <li key={i} className="flex gap-2 text-xs">
              <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
];

const faqItems = [
  {
    q: "What reputation criteria does my wallet need?",
    a: "Default: ≥0.01 BNB balance, ≥5 transactions, ≥30 days wallet age. Configurable by the contract owner.",
  },
  {
    q: "Is my source wallet address exposed?",
    a: "No. Only the nullifier hash and commitment hash are stored on-chain — neither traces back to your address.",
  },
  {
    q: "Can I use the relayer multiple times?",
    a: "Each nullifier is single-use. After the epoch resets, you can generate a new proof.",
  },
  {
    q: "Which wallets are supported?",
    a: "Any EVM-compatible wallet — MetaMask, WalletConnect, Coinbase Wallet, and more.",
  },
  {
    q: "Is this on mainnet?",
    a: "Currently on BSC Testnet. Mainnet deployment planned after audits.",
  },
  {
    q: "Can I use Repute from the command line?",
    a: "Yes — the CLI tool supports all core actions: reputation check, ZK proof generation, wallet activation, and Paymaster queries. Use --json for machine-readable output, ideal for AI agents and automation.",
  },
];

const Docs = () => {
  return (
    <div className="gradient-bg min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-display text-lg font-semibold text-foreground mb-1">Documentation</h1>
              <p className="text-sm text-muted-foreground">
                How Repute works and how to use it.
              </p>
            </div>

            {/* Quick links */}
            <div className="grid sm:grid-cols-3 gap-2 mb-8">
              {[
                { icon: BookOpen, label: "Overview", href: "#overview" },
                { icon: Layers, label: "How It Works", href: "#how-it-works" },
                { icon: Terminal, label: "Architecture", href: "#architecture" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="glass rounded-lg p-3 flex items-center gap-2.5 card-hover group"
                >
                  <link.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </a>
              ))}
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {sections.map((section, i) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <section.icon className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                  </div>
                  {section.content}
                </motion.div>
              ))}
            </div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4 }}
              className="mt-8"
            >
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                FAQ
              </h2>
              <Accordion type="single" collapsible className="space-y-1.5">
                {faqItems.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="glass rounded-lg border-0 px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary hover:no-underline py-3">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>

            {/* External links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex gap-2"
            >
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Code className="h-3 w-3 mr-1.5" />
                  Source Code
                  <ExternalLink className="h-2.5 w-2.5 ml-1.5" />
                </a>
              </Button>
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <a href="https://testnet.bscscan.com" target="_blank" rel="noopener noreferrer">
                  <Shield className="h-3 w-3 mr-1.5" />
                  BSCScan
                  <ExternalLink className="h-2.5 w-2.5 ml-1.5" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Docs;
