import LandingNav from "@/components/LandingNav";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";

const Index = () => {
  return (
    <div className="gradient-bg min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Repute. Compliant privacy infrastructure on BNB Chain.
        </div>
      </footer>
    </div>
  );
};

export default Index;
