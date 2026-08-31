"use client";

/**
 * Brandovaný přehrávač lekce.
 *
 * Vidstack, ne Mux Player — ze dvou důvodů. Za prvé je provider-agnostický,
 * takže bere obyčejnou HLS adresu a výměna hostingu se ho netýká. Za druhé
 * Mux Player neumí obnovit podepsaný token uprostřed přehrávání
 * (github.com/videojs/v10/issues/1432); u nás to zatím nevadí, protože
 * token platí dvě hodiny a nejdelší lekce má osm minut, ale až přibydou
 * delší formáty, řeší se to v hls.js přes `xhrSetup` — a to Mux Player nedovolí.
 */

import { forwardRef } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

/**
 * 60 % diváků kouká na 1,5×, 23 % na 2× a porozumění podle výzkumu klesá
 * až kolem 2,5×. Bez volby rychlosti bychom trestali většinu publika.
 */
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export type LessonPlayerProps = {
  src: string;
  title: string;
  posterUrl: string | null;
  /** VTT s náhledy pro přetahování časové osy. */
  storyboardUrl: string | null;
  /** WebVTT s titulky (blob URL vyrobené z transkriptu). */
  subtitlesUrl?: string | null;
  onTimeUpdate?: (seconds: number) => void;
  /** Uzavření sledovaného úseku — pauza, konec, přetočení. */
  onCommit?: () => void;
  /** Chyba přehrávání — typicky vypršelý podpis. */
  onPlaybackError?: () => void;
};

export const LessonPlayer = forwardRef<MediaPlayerInstance, LessonPlayerProps>(
  function LessonPlayer(
    {
      src,
      title,
      posterUrl,
      storyboardUrl,
      subtitlesUrl,
      onTimeUpdate,
      onCommit,
      onPlaybackError,
    },
    ref,
  ) {
    return (
      <MediaPlayer
        ref={ref}
        title={title}
        src={{ src, type: "application/x-mpegurl" }}
        className="w-full overflow-hidden border border-hairline bg-deep"
        style={{ aspectRatio: "16 / 9" }}
        /**
         * Zkratky jen když je focus uvnitř přehrávače. WCAG 2.1.4: jednoznakové
         * zkratky musí jít vypnout, přemapovat, nebo být vázané na focus —
         * jinak kolidují se čtečkami a s psaním do poznámky pod videem.
         */
        keyTarget="player"
        /** Účtuje se doručená minuta, ne přehraná. Nenačítáme, dokud nechce divák. */
        preload="metadata"
        playsInline
        crossOrigin
        onTimeUpdate={(detail) => onTimeUpdate?.(detail.currentTime)}
        onPause={() => onCommit?.()}
        onEnded={() => onCommit?.()}
        onSeeked={() => onCommit?.()}
        onError={() => onPlaybackError?.()}
      >
        <MediaProvider>
          {posterUrl && (
            <Poster className="vds-poster" src={posterUrl} alt={title} />
          )}
          {subtitlesUrl && (
            <Track
              src={subtitlesUrl}
              kind="subtitles"
              label="Čeština"
              lang="cs-CZ"
              type="vtt"
              default
            />
          )}
        </MediaProvider>
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          playbackRates={PLAYBACK_RATES}
          thumbnails={storyboardUrl ?? undefined}
          /** Nikdy nezamykat převíjení — sledovanost měříme na pozadí. */
          noScrubGesture={false}
        />
      </MediaPlayer>
    );
  },
);
