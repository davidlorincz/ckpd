"use client";

/**
 * Sledování postupu ve videu.
 *
 * Klient si drží souvislý přehraný úsek v paměti a posílá ho po dávkách —
 * ne při každém `timeupdate`, který chodí čtyřikrát za sekundu. Odesílá se
 * každých 15 sekund, při pauze, přetočení, konci a při odchodu ze stránky.
 *
 * Měří se **media-time**, ne reálný čas: při dvojnásobné rychlosti se za
 * 15 sekund přehraje 30 sekund stopáže a započítat se musí těch 30.
 */

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const FLUSH_INTERVAL_MS = 15_000;

/**
 * Skok větší než tohle bereme jako přetočení, ne jako plynulé přehrávání —
 * úsek se uzavře a začne nový. Musí být větší než největší přirozený krok
 * mezi dvěma `timeupdate` i při dvojnásobné rychlosti.
 */
const SEEK_THRESHOLD_SECONDS = 3;

type Segment = { from: number; to: number };

export function useLessonProgress(lessonId: Id<"lessons"> | undefined) {
  const heartbeat = useMutation(api.progress.heartbeat);
  const setCompleted = useMutation(api.progress.setCompleted);
  const progress = useQuery(
    api.progress.forLesson,
    lessonId ? { lessonId } : "skip",
  );
  const { getToken } = useAuth();

  const pending = useRef<Segment | null>(null);
  const lastTime = useRef<number | null>(null);
  const lessonRef = useRef(lessonId);
  lessonRef.current = lessonId;

  const flush = useCallback(async () => {
    const segment = pending.current;
    const id = lessonRef.current;
    pending.current = null;
    if (!segment || !id || segment.to <= segment.from) return;
    try {
      await heartbeat({ lessonId: id, from: segment.from, to: segment.to });
    } catch {
      // Ztráta jednoho heartbeatu není chyba, kterou má divák řešit —
      // další ho stejně přepíše, protože sjednocení úseků je idempotentní.
    }
  }, [heartbeat]);

  /**
   * Odchod ze stránky. `fetch` s `keepalive` zavření karty přežije a na rozdíl
   * od `sendBeacon` umí poslat hlavičku s tokenem. `beforeunload` se záměrně
   * nepoužívá — prohlížeče ho od Chrome 80 při zavírání nespolehlivě přeruší.
   */
  const flushOnLeave = useCallback(async () => {
    const segment = pending.current;
    const id = lessonRef.current;
    pending.current = null;
    if (!segment || !id || segment.to <= segment.from) return;

    const site = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    if (!site) return;
    try {
      const token = await getToken({ template: "convex" });
      if (!token) return;
      await fetch(`${site}/api/progress/beacon`, {
        method: "POST",
        keepalive: true,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId: id, from: segment.from, to: segment.to }),
      });
    } catch {
      // stránka už odchází, není komu chybu hlásit
    }
  }, [getToken]);

  /** Volá se z `onTimeUpdate` přehrávače. */
  const track = useCallback((seconds: number) => {
    const prev = lastTime.current;
    lastTime.current = seconds;
    if (prev === null) return;

    const delta = seconds - prev;
    if (delta <= 0 || delta > SEEK_THRESHOLD_SECONDS) {
      // přetočení nebo skok — uzavři, co bylo, a začni nanovo
      void flush();
      return;
    }
    pending.current = pending.current
      ? { from: pending.current.from, to: seconds }
      : { from: prev, to: seconds };
  }, [flush]);

  /** Ruční zavření úseku — pauza, konec, přetočení. */
  const commit = useCallback(() => {
    void flush();
  }, [flush]);

  useEffect(() => {
    const timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flushOnLeave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      void flush();
    };
  }, [flush, flushOnLeave]);

  /** Reset při přechodu na jinou lekci, ať se úsek nepřenese jinam. */
  useEffect(() => {
    pending.current = null;
    lastTime.current = null;
  }, [lessonId]);

  return {
    progress,
    track,
    commit,
    markCompleted: useCallback(
      (completed: boolean) =>
        lessonRef.current
          ? setCompleted({ lessonId: lessonRef.current, completed })
          : Promise.resolve(null),
      [setCompleted],
    ),
  };
}
