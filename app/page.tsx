import { Hero } from "@/components/sections/Hero";
import { StatBand } from "@/components/sections/StatBand";
import { Pillars } from "@/components/sections/Pillars";
import { Audiences } from "@/components/sections/Audiences";
import { Bodies } from "@/components/sections/Bodies";
import { Transparency } from "@/components/sections/Transparency";
import { Positions } from "@/components/sections/Positions";
import { CtaBlock } from "@/components/sections/CtaBlock";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatBand />
      <Pillars />
      <Audiences />
      <Bodies />
      <Transparency />
      <Positions />
      <CtaBlock />
    </>
  );
}
