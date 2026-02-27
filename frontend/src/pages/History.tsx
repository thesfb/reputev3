import { motion } from "framer-motion";
import AppSidebar from "@/components/AppSidebar";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface HistoryEntry {
  id: string;
  type: "activation" | "proof";
  status: "success" | "failed" | "pending";
  walletB: string;
  nullifierHash: string;
  txHash: string | null;
  gasSponsored: string;
  timestamp: Date;
}

const demoHistory: HistoryEntry[] = [
  {
    id: "1",
    type: "activation",
    status: "success",
    walletB: "0x9a3f...e7b2",
    nullifierHash: "0x1c4d...8f3a",
    txHash: "0xabc123...def456",
    gasSponsored: "0.0042 BNB",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    type: "activation",
    status: "success",
    walletB: "0x7e1b...3c9d",
    nullifierHash: "0x5f2e...a1b4",
    txHash: "0x789abc...123def",
    gasSponsored: "0.0038 BNB",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    type: "proof",
    status: "failed",
    walletB: "0x4d2a...f8e1",
    nullifierHash: "0x9e7c...2d5f",
    txHash: null,
    gasSponsored: "—",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "4",
    type: "activation",
    status: "success",
    walletB: "0x2f8c...1a4b",
    nullifierHash: "0x3b6a...c9e2",
    txHash: "0xfed987...654cba",
    gasSponsored: "0.0051 BNB",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

const statusConfig = {
  success: { icon: CheckCircle2, label: "Success", color: "text-emerald-400" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-400" },
  pending: { icon: Clock, label: "Pending", color: "text-amber-400" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "pending">("all");

  const filtered = demoHistory.filter((entry) => {
    if (filterStatus !== "all" && entry.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.walletB.toLowerCase().includes(q) ||
        entry.nullifierHash.toLowerCase().includes(q) ||
        (entry.txHash && entry.txHash.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="gradient-bg min-h-screen flex noise">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-lg font-semibold text-foreground mb-1">
                Transaction History
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your paymaster activations and proof submissions.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet, nullifier, or tx hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-card border-border"
                />
              </div>
              <div className="flex gap-1.5">
                {(["all", "success", "failed", "pending"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize text-xs h-9 px-3"
                  >
                    {status === "all" && <Filter className="h-3 w-3 mr-1" />}
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Transaction list */}
            {filtered.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No transactions found.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your filters."
                    : "Use the relayer to create your first private transaction."}
                </p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {filtered.map((entry) => {
                  const cfg = statusConfig[entry.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={entry.id}
                      variants={item}
                      className="glass rounded-lg p-4 card-hover"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-foreground">
                                {entry.type === "activation"
                                  ? "Paymaster Activation"
                                  : "ZK Proof Submission"}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${cfg.color} border-current/20`}
                              >
                                {cfg.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              <span>
                                <span className="font-mono text-foreground/60">{entry.walletB}</span>
                              </span>
                              <span>{entry.gasSponsored}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground hidden sm:block">
                            {timeAgo(entry.timestamp)}
                          </span>
                          {entry.txHash && (
                            <a
                              href={`https://testnet.bscscan.com/tx/${entry.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[
                { label: "Successful", value: demoHistory.filter((e) => e.status === "success").length.toString() },
                { label: "Gas Sponsored", value: "0.0131 BNB" },
                { label: "Wallets Activated", value: new Set(demoHistory.map((e) => e.walletB)).size.toString() },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default History;
