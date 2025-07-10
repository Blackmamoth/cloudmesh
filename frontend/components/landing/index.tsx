"use client";

import { FeaturesSection } from "./feature-section";
import { FinalCTA } from "./final-cta";
import { Footer } from "./footer";
import { HeroSection } from "./hero-section";
import { Navbar } from "./navbar";
import { ProblemSolutionSection } from "./problem-solution";
import { SecuritySection } from "./security-section";
import { WhoItsForSection } from "./who-is-it-for";

export default function LandingPage() {
  return (
    <>
      <div className="gradient-bg">
        <Navbar />
        <HeroSection />
      </div>
      <ProblemSolutionSection />
      <FeaturesSection />
      <SecuritySection />
      <WhoItsForSection />
      <FinalCTA />
      <Footer />
    </>
  );
}
