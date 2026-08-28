import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { hashKey } from "./lib/code";

/**
 * Veřejné HTTP rozhraní. Ven se vystavuje pod `https://ckpd.cz/api/v1/*`
 * přes rewrite v next.config.ts — partnerům se dokumentuje ta adresa.
 *
 * Logika běží tady, a ne v Next route handleru, protože rate limit, vyhledání
 * a zápis do auditu tak proběhnou atomicky v jedné Convex mutaci.
 */
const http = httpRouter();

/** Záměrně BEZ CORS hlaviček — je to server-to-server rozhraní. */
function json(
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Stav členství se mění a odvolaný souhlas se musí projevit hned.
      "cache-control": "no-store",
      ...extra,
    },
  });
}

const verifyHandler = httpAction(async (ctx, request) => {
  const auth = request.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();

  if (!bearer) {
    return json(
      {
        error: "unauthorized",
        message: "Chybí hlavička Authorization: Bearer <klíč>.",
      },
      401,
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return json(
      { error: "missing_code", message: "Chybí parametr `code`." },
      400,
    );
  }

  // Hash se počítá tady, do mutace jde jen otisk — plaintext klíče se nikam
  // neukládá ani neloguje.
  const result = await ctx.runMutation(internal.verification.verify, {
    keyHash: await hashKey(bearer),
    code,
  });

  const headers: Record<string, string> = {};
  if (result.rateLimit) {
    headers["x-ratelimit-limit"] = String(result.rateLimit.limit);
    headers["x-ratelimit-remaining"] = String(result.rateLimit.remaining);
    headers["x-ratelimit-reset"] = String(
      Math.floor(result.rateLimit.resetAt / 1000),
    );
  }
  if (result.status === 429) headers["retry-after"] = "60";

  return json(result.body, result.status, headers);
});

http.route({ path: "/api/v1/verify", method: "GET", handler: verifyHandler });

export default http;
