import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk session middleware. Nic nevynucuje — veřejný web je pro všechny,
 * editace se gatuje client-side a v Convex mutacích (role admin z JWT).
 * Bez Clerk klíčů v env (deploy bez backendu) jen propouští requesty —
 * clerkMiddleware by bez publishable key padal za běhu.
 */
const middleware = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware()
  : () => NextResponse.next();

export default middleware;

export const config = {
  matcher: [
    // Vše kromě Next internals a statických souborů
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
