"use client";

import { VideoDialog } from "@/components/ui/VideoDialog";
import { ctaClass } from "@/components/ui/Cta";
import { IconPlayBadge } from "@/components/ui/icons";
import { videos } from "@/lib/site";

/**
 * Sekundární CTA v heru. Tenký klientský obal, aby `Hero` mohl zůstat
 * server komponentou — dialog potřebuje stav, odkaz na video ne.
 *
 * `bg-paper` je tu schválně: `secondary` je jinak průhledné a přes rastr
 * i animaci dronů by tlačítko nebylo čisté.
 */
export function HeroVideoCta() {
  return (
    <VideoDialog
      youtubeId={videos.jakToFunguje.youtubeId}
      title={videos.jakToFunguje.title}
      triggerClassName={ctaClass(
        "secondary",
        "inline-flex items-center gap-2.5 bg-paper",
      )}
    >
      <IconPlayBadge className="h-5 w-5" />
      Jak to funguje
    </VideoDialog>
  );
}
