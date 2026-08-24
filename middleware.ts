import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk session middleware. Nic nevynucuje — veřejný web je pro všechny,
 * editace se gatuje client-side a v Convex mutacích (role admin z JWT).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Vše kromě Next internals a statických souborů
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
