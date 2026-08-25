"use client";

import { useEffect, useRef } from "react";

/**
 * Dekorativní canvas animace v heru: „z chaosu do řádu".
 * Vlevo od rámečku s titulkem létá znak komory (/brand/znak.svg) chaoticky —
 * různé rychlosti, srážky a exploze — a vlétává do rámečku; vpravo z něj
 * drony vylétávají v rovných, rovnoměrně rozestoupených drahách. Jen na lg+,
 * respektuje prefers-reduced-motion, pauzuje mimo viewport.
 */

const CFG = {
  chaosCount: 8,
  laneCount: 4,
  sizeMin: 30, // šířka glyfu v px
  sizeMax: 48,
  chaosSpeedMin: 16, // px/s — schválně velký rozptyl (chaos)
  chaosSpeedMax: 75,
  laneSpeed: 34, // px/s, konstantní — řád
  laneSize: 38,
  laneGap: 170, // rozestup dronů v dráze, px
  slewRate: Math.PI / 1.6, // max změna kurzu rad/s
  explosionMs: 700,
  explosionShards: 9,
  fadeMs: 300,
  respawnMinMs: 600,
  respawnMaxMs: 2400,
  maxDPR: 2,
  glyphRatio: 520 / 1060, // výška/šířka znak.svg
  blue: "#2626FF",
  orange: "#FF3200",
};

type ChaosDrone = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  size: number;
  f1: number;
  p1: number;
  f2: number;
  p2: number;
  targetY: number; // y bodu „vstřebání" na levé hraně boxu (0–1 v rámci boxu)
  alpha: number;
  state: "flying" | "fading" | "waiting";
  waitMs: number;
};

type LaneDrone = { x: number; lane: number; alpha: number };

type Shard = { angle: number; speed: number; len: number; orange: boolean };

type Explosion = { x: number; y: number; t: number; shards: Shard[] };

type Box = { left: number; right: number; top: number; bottom: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function HeroDrones() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const section = canvas.closest("section");
    const titleEl = section?.querySelector("[data-hero-title]");
    if (!section || !titleEl) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // sprite = znak komory (modré rotory + oranžové [•])
    const glyph = new Image();
    glyph.src = "/brand/znak.svg";
    let spriteReady = false;
    glyph.onload = () => {
      spriteReady = true;
    };

    // celá inicializace v setup(), aby šla znovu spustit při změně šířky
    // viewportu přes lg breakpoint (canvas je do té doby display:none)
    const setup = (): (() => void) => {
      let dpr = 1;
      let w = 0;
      let h = 0;
      let box: Box = { left: 0, right: 0, top: 0, bottom: 0 };

      const measure = () => {
        const s = section.getBoundingClientRect();
        const t = titleEl.getBoundingClientRect();
        w = s.width;
        h = s.height;
        box = {
          left: t.left - s.left,
          right: t.right - s.left,
          top: t.top - s.top,
          bottom: t.bottom - s.top,
        };
        dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDPR);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      measure();

      // — chaos vlevo —
      const spawnChaos = (d: ChaosDrone, offscreen: boolean) => {
        d.x = offscreen
          ? rand(-160, -40)
          : rand(0, Math.max(40, box.left - 80));
        d.y = rand(Math.max(0, box.top - 90), Math.min(h, box.bottom + 90));
        d.heading = rand(-0.4, 0.4);
        d.speed = rand(CFG.chaosSpeedMin, CFG.chaosSpeedMax);
        d.size = rand(CFG.sizeMin, CFG.sizeMax);
        d.f1 = rand(0.1, 0.45) * Math.PI * 2;
        d.p1 = rand(0, Math.PI * 2);
        d.f2 = rand(0.1, 0.45) * Math.PI * 2;
        d.p2 = rand(0, Math.PI * 2);
        d.targetY = rand(0.15, 0.85);
        d.alpha = 0;
        d.state = "flying";
        d.waitMs = 0;
      };
      const chaos: ChaosDrone[] = Array.from({ length: CFG.chaosCount }, () => {
        const d = {} as ChaosDrone;
        spawnChaos(d, false);
        d.alpha = 1;
        return d;
      });

      const explosions: Explosion[] = [];
      const explode = (x: number, y: number) => {
        explosions.push({
          x,
          y,
          t: 0,
          shards: Array.from({ length: CFG.explosionShards }, (_, i) => ({
            angle:
              (i / CFG.explosionShards) * Math.PI * 2 + rand(-0.25, 0.25),
            speed: rand(40, 110),
            len: rand(3, 9),
            orange: i % 3 === 0,
          })),
        });
      };
      const crash = (d: ChaosDrone, other?: ChaosDrone) => {
        explode(
          other ? (d.x + other.x) / 2 : d.x,
          other ? (d.y + other.y) / 2 : d.y,
        );
        for (const c of other ? [d, other] : [d]) {
          c.state = "waiting";
          c.alpha = 0;
          c.waitMs = rand(CFG.respawnMinMs, CFG.respawnMaxMs);
        }
      };

      // — řád vpravo: dráhy uvnitř výšky boxu, rovnoměrný rozestup —
      const lanes: LaneDrone[] = [];
      const laneY = (lane: number) => {
        const inner = box.bottom - box.top;
        return box.top + (inner * (lane + 1)) / (CFG.laneCount + 1);
      };
      // předvyplnit dráhy, ať animace nezačíná prázdnou pravou stranou
      for (let lane = 0; lane < CFG.laneCount; lane++) {
        const offset = (lane * CFG.laneGap) / CFG.laneCount; // fázový posun drah
        for (let x = box.right + 20 + offset; x < w + 50; x += CFG.laneGap) {
          lanes.push({ x, lane, alpha: 1 });
        }
      }

      const drawDrone = (
        x: number,
        y: number,
        heading: number,
        size: number,
        alpha: number,
      ) => {
        if (alpha <= 0) return;
        const gh = size * CFG.glyphRatio;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        // znak má „příď" nahoře — +90°, aby dron letěl čelem ve směru letu
        ctx.rotate(heading + Math.PI / 2);
        ctx.drawImage(glyph, -size / 2, -gh / 2, size, gh);
        ctx.restore();
      };

      const drawExplosions = () => {
        for (const e of explosions) {
          const p = e.t / (CFG.explosionMs / 1000); // 0..1
          ctx.save();
          ctx.globalAlpha = 1 - p;
          ctx.lineWidth = 1.5;
          for (const s of e.shards) {
            const r = s.speed * e.t;
            const x1 = e.x + Math.cos(s.angle) * r;
            const y1 = e.y + Math.sin(s.angle) * r;
            ctx.strokeStyle = s.orange ? CFG.orange : CFG.blue;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(
              x1 + Math.cos(s.angle) * s.len,
              y1 + Math.sin(s.angle) * s.len,
            );
            ctx.stroke();
          }
          ctx.restore();
        }
      };

      let elapsed = 0;

      const step = (dt: number) => {
        elapsed += dt;

        // chaos: kurz k cíli + wander, se slew limitem; srážky → exploze
        for (const d of chaos) {
          if (d.state === "waiting") {
            d.waitMs -= dt * 1000;
            if (d.waitMs <= 0) spawnChaos(d, true);
            continue;
          }
          const tx = box.left;
          const ty = box.top + (box.bottom - box.top) * d.targetY;
          let desired = Math.atan2(ty - d.y, tx - d.x);
          desired +=
            0.7 * Math.sin(elapsed * d.f1 + d.p1) +
            0.45 * Math.sin(elapsed * d.f2 + d.p2);
          let diff = desired - d.heading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const maxTurn = CFG.slewRate * dt;
          d.heading += Math.max(-maxTurn, Math.min(maxTurn, diff));
          d.x += Math.cos(d.heading) * d.speed * dt;
          d.y += Math.sin(d.heading) * d.speed * dt;

          if (d.state === "flying") {
            d.alpha = Math.min(1, d.alpha + (dt * 1000) / CFG.fadeMs);
            if (d.x >= box.left - d.size / 2) d.state = "fading";
          } else {
            d.alpha -= (dt * 1000) / CFG.fadeMs;
            if (d.alpha <= 0) {
              d.state = "waiting";
              d.waitMs = rand(CFG.respawnMinMs, CFG.respawnMaxMs);
            }
          }
        }

        // srážky dvojic (jen plně viditelné drony mimo box)
        for (let i = 0; i < chaos.length; i++) {
          const a = chaos[i];
          if (a.state !== "flying" || a.alpha < 1) continue;
          for (let j = i + 1; j < chaos.length; j++) {
            const b = chaos[j];
            if (b.state !== "flying" || b.alpha < 1) continue;
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < (a.size + b.size) * 0.28) {
              crash(a, b);
              break;
            }
          }
        }

        for (let i = explosions.length - 1; i >= 0; i--) {
          explosions[i].t += dt;
          if (explosions[i].t * 1000 > CFG.explosionMs) {
            explosions.splice(i, 1);
          }
        }

        // řád: konstantní rychlost doprava, recyklace za okrajem
        for (const d of lanes) {
          d.x += CFG.laneSpeed * dt;
          d.alpha = Math.min(1, d.alpha + (dt * 1000) / CFG.fadeMs);
          if (d.x > w + 40) {
            d.x = box.right + 20;
            d.alpha = 0;
          }
        }
      };

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        if (!spriteReady) return;
        for (const d of chaos) {
          if (d.state === "waiting") continue;
          drawDrone(d.x, d.y, d.heading, d.size, d.alpha);
        }
        drawExplosions();
        for (const d of lanes) {
          drawDrone(d.x, laneY(d.lane), 0, CFG.laneSize, d.alpha);
        }
      };

      // reduced motion: jeden statický snímek (jen uspořádané dráhy)
      if (reducedMotion.matches) {
        const staticDraw = () => {
          if (!spriteReady) {
            requestAnimationFrame(staticDraw);
            return;
          }
          ctx.clearRect(0, 0, w, h);
          for (const d of lanes) {
            drawDrone(d.x, laneY(d.lane), 0, CFG.laneSize, 1);
          }
        };
        requestAnimationFrame(staticDraw);
        const ro = new ResizeObserver(() => {
          measure();
          staticDraw();
        });
        ro.observe(section);
        return () => ro.disconnect();
      }

      // — živá smyčka s pauzou mimo viewport; na skryté kartě rAF netiká
      // sám od sebe a clamp dt řeší resume, netřeba hlídat document.hidden —
      let raf = 0;
      let last = 0;
      let running = false;
      let visible = true;

      const frame = (t: number) => {
        if (!running) return;
        const dt = Math.min((t - last) / 1000, 0.05); // clamp po resume
        last = t;
        step(dt);
        draw();
        raf = requestAnimationFrame(frame);
      };
      const start = () => {
        if (running || !visible) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      });
      io.observe(section);

      const ro = new ResizeObserver(measure);
      ro.observe(section);

      start();

      return () => {
        stop();
        io.disconnect();
        ro.disconnect();
      };
    };

    let cleanup: (() => void) | null = null;
    const apply = () => {
      cleanup?.();
      cleanup = desktop.matches ? setup() : null;
    };
    apply();
    desktop.addEventListener("change", apply);

    return () => {
      desktop.removeEventListener("change", apply);
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full select-none lg:block"
    />
  );
}
