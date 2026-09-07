"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Video v dialogu, načtené až na druhé kliknutí (facade).
 *
 * PRD § 9 zakazuje požadavky na třetí domény — proto se `<iframe>` mountuje
 * teprve tehdy, když návštěvník klikne na přehrání. Do té doby se ukazuje
 * vlastní náhled v brandu komory a na youtube.com neodejde ani jeden
 * požadavek. Base UI dialog zavřený obsah odmountuje, takže se přehrávač
 * po zavření zase odpojí.
 */
export function VideoDialog({
  youtubeId,
  title,
  children,
  triggerClassName,
}: {
  youtubeId: string;
  title: string;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setPlaying(false);
      }}
    >
      <DialogTrigger render={<button type="button" className={triggerClassName} />}>
        {children}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,1040px,calc((88vh-3.5rem)*16/9))] max-w-none gap-0 rounded-none border border-hairline bg-deep p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="relative aspect-video w-full">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&hl=cs`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Přehrát video: ${title}`}
              className="paper-grid-dark group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 bg-deep"
            >
              {/* znak přímo, ne <Seal> — ten má pevná SVG id a v heru už jeden je */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/znak-inverse.svg"
                alt=""
                aria-hidden
                className="h-20 w-20 opacity-40"
              />
              <span className="font-serif text-[20px] font-bold uppercase text-paper sm:text-[26px]">
                {title}
              </span>
              <span className="inline-flex items-center gap-2.5 rounded-[2px] bg-action px-5 py-2.5 text-[15px] font-medium text-white transition-colors group-hover:bg-action-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Přehrát video
              </span>
            </button>
          )}
        </div>

        <p className="border-t border-hairline bg-paper px-4 py-2.5 text-[13px] leading-relaxed text-ink-2">
          Přehráním se video načte ze služby YouTube (youtube-nocookie.com). Do
          té doby web s žádnou třetí stranou nekomunikuje.
        </p>

        <DialogClose
          aria-label="Zavřít"
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-[2px] bg-paper/90 text-deep transition-colors hover:bg-paper"
        >
          <XIcon className="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
