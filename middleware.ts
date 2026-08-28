import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk session middleware. Nic nevynucuje — veřejný web je pro všechny,
 * editace se gatuje client-side a v Convex mutacích (role admin z JWT),
 * členská sekce v `app/muj-ucet/layout.tsx` přes `auth()` (resource-based;
 * `createRouteMatcher` je v Clerku 7 deprecated).
 * Bez Clerk klíčů v env (deploy bez backendu) jen propouští requesty —
 * clerkMiddleware by bez publishable key padal za běhu.
 */
const middleware = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware()
  : () => NextResponse.next();

export default middleware;

export const config = {
  matcher: [
    // Vše kromě Next internals, statických souborů a partnerského API.
    // `/api/v1/*` musí stát mimo Clerk: nese vlastní hlavičku
    // `Authorization: Bearer ckpd_live_…`, kterou by Clerk 7 zkusil přečíst
    // jako machine token a request odmítl dřív, než dojde na rewrite do Convexu.
    "/((?!_next|api/v1|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(trpc)(.*)",
  ],
};
