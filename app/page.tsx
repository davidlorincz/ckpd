import { Hero } from "@/components/sections/Hero";
import { StatBand } from "@/components/sections/StatBand";
import { Projects } from "@/components/sections/Projects";
import { Pillars } from "@/components/sections/Pillars";
import { Certification } from "@/components/sections/Certification";
import { Courses } from "@/components/sections/Courses";
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
      {/* Projekty hned pod herem: návštěvník musí vidět, co za komorou stojí,
          dřív než se dostane k tomu, co komora dělá. */}
      <Projects />
      <Pillars />
      <Certification />
      <Courses />
      <Audiences />
      <Bodies />
      <Transparency />
      <Positions />
      <CtaBlock />
    </>
  );
}
