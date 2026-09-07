import { VideoDialog } from "@/components/ui/VideoDialog";
import { IconPlayBadge } from "@/components/ui/icons";
import { explainerVideos } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

/**
 * Tři vysvětlující videa pod projekty. Dokud `youtubeId` chybí, je dlaždice
 * záměrně neklikatelná a označená „Připravujeme" — nesmí vypadat jako rozbitý
 * odkaz. Doplnění videa je pak jednořádková změna v `lib/site.ts`.
 */
export function ExplainerVideos() {
  return (
    <div className="mt-14">
      <h3 className="text-[19px]">
        <E k="home.projects.videosTitle">Jak to funguje ve třech videích</E>
      </h3>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {explainerVideos.map((v) => (
          <div key={v.key}>
            {v.youtubeId ? (
              <VideoDialog
                youtubeId={v.youtubeId}
                title={v.title}
                triggerClassName="group block w-full cursor-pointer text-left"
              >
                <span className="flex aspect-video w-full items-center justify-center border border-hairline bg-paper transition-colors group-hover:border-brass">
                  <IconPlayBadge className="h-10 w-10 text-brass" />
                </span>
              </VideoDialog>
            ) : (
              <div className="paper-grid relative flex aspect-video w-full items-end border border-hairline bg-paper">
                <IconPlayBadge
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-brass-2"
                />
                <span className="relative w-full border-t border-hairline px-4 py-2 text-[12px] uppercase tracking-wider text-ink-2">
                  <E k="home.projects.videoSoon" editable={false}>
                    Připravujeme
                  </E>
                </span>
              </div>
            )}
            <h4 className="mt-4 text-[17px]">
              <E k={`home.projects.video.${v.key}.title`}>{v.title}</E>
            </h4>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              <E k={`home.projects.video.${v.key}.text`}>{v.text}</E>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
