import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { tierValidator } from "./schema";
import { requireIdentity, subjectOf } from "./lib/auth";
import { issueVerificationCode, nextMemberNumber } from "./members";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Platební vrstva.
 *
 * PRAVIDLO: aktivní členství vzniká výhradně v `activateSubscription`.
 * Mock brána i budoucí Stripe webhook volají tu samou funkci — díky tomu
 * napojení Stripe nezmění ani UI, ani datový tok, ani ověřovací API.
 */

/** Mock brána smí aktivovat členství jen mimo ostrý provoz. */
function assertMockAllowed() {
  if (process.env.BILLING_PROVIDER === "stripe") {
    throw new Error(
      "Mock platba je vypnutá — nasazena ostrá platební brána.",
    );
  }
}

async function memberOf(ctx: MutationCtx, clerkUserId: string) {
  const member = await ctx.db
    .query("members")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
  if (!member) throw new Error("Členský záznam nenalezen.");
  return member;
}

/** Členství se prodlužuje po měsících. */
function addMonth(from: number): number {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

/* ------------------------------------------------------ zápis stavu členství */

type ActivateArgs = {
  clerkUserId: string;
  tier: "zakladni" | "pro" | "cestne";
  periodEnd?: number;
  provider: "mock" | "stripe";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

/**
 * JEDINÉ místo, kde vzniká aktivní členství. Prochází tudy mock brána
 * i (později) Stripe webhook. Zároveň tu členovi poprvé vznikne ověřovací kód.
 *
 * Je to obyčejná funkce, ne mutace: mutace v Convexu nemůže volat jinou
 * mutaci, a `mockConfirm` ji potřebuje zavolat přímo.
 */
export async function applyActivation(ctx: MutationCtx, args: ActivateArgs) {
  const member = await memberOf(ctx, args.clerkUserId);
  const now = Date.now();

  const patch: Partial<Doc<"members">> = {
    tier: args.tier,
    status: "active",
    currentPeriodEnd: args.periodEnd ?? addMonth(now),
    cancelAtPeriodEnd: false,
    billingProvider: args.provider,
    updatedAt: now,
  };

  // memberSince se nastavuje jen poprvé — obnovené členství ho nepřepíše.
  if (!member.memberSince) patch.memberSince = now;

  if (args.stripeCustomerId) patch.stripeCustomerId = args.stripeCustomerId;
  if (args.stripeSubscriptionId) {
    patch.stripeSubscriptionId = args.stripeSubscriptionId;
  }

  // Členské číslo se přiděluje jednou, při prvním zaplacení, a už se nemění.
  // Ověřovací kód se od něj odvozuje a jde přegenerovat, kdyby členovi unikl.
  const year = member.memberNumberYear;
  const seq = member.memberNumberSeq;
  let number = member.memberNumber;

  if (!number || year === undefined || seq === undefined) {
    const assigned = await nextMemberNumber(ctx);
    number = assigned.memberNumber;
    patch.memberNumber = assigned.memberNumber;
    patch.memberNumberYear = assigned.year;
    patch.memberNumberSeq = assigned.seq;

    const issued = issueVerificationCode(
      assigned.memberNumber,
      assigned.year,
      assigned.seq,
    );
    patch.verificationCode = issued.code;
    patch.verificationCodeLookup = issued.lookup;
    patch.verificationCodeIssuedAt = now;
  } else if (!member.verificationCodeLookup) {
    const issued = issueVerificationCode(number, year, seq);
    patch.verificationCode = issued.code;
    patch.verificationCodeLookup = issued.lookup;
    patch.verificationCodeIssuedAt = now;
  }

  await ctx.db.patch(member._id, patch);
  return member._id;
}

/** Mutační obal nad `applyActivation` — vstupní bod pro platební webhook. */
export const activateSubscription = internalMutation({
  args: {
    clerkUserId: v.string(),
    tier: tierValidator,
    periodEnd: v.optional(v.number()),
    provider: v.union(v.literal("mock"), v.literal("stripe")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => await applyActivation(ctx, args),
});

/** Platba selhala. Členství ještě běží do konce období. */
export const markPastDue = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const member = await memberOf(ctx, args.clerkUserId);
    await ctx.db.patch(member._id, {
      status: "past_due",
      updatedAt: Date.now(),
    });
  },
});

/** Členství skončilo (uplynulo období po zrušení, nebo Stripe zrušil). */
export const markCanceled = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const member = await memberOf(ctx, args.clerkUserId);
    await ctx.db.patch(member._id, {
      status: "canceled",
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });
  },
});

/* --------------------------------------------------------------- checkout */

/**
 * Zahájení platby. Členství přejde do `pending` a čeká na potvrzení od brány
 * — stejně jako u Stripe, kde mezi redirectem a webhookem taky chvíli visí.
 */
export const startCheckout = mutation({
  args: { tier: tierValidator },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const member = await memberOf(ctx, subjectOf(identity));

    if (args.tier === "cestne") {
      throw new Error("Čestné členství uděluje Rada, nedá se koupit.");
    }

    await ctx.db.patch(member._id, {
      status: "pending",
      tier: args.tier,
      updatedAt: Date.now(),
    });

    // Ve Stripe verzi tohle nahradí id Checkout Session.
    return { sessionId: `mock_${member._id}_${Date.now()}`, tier: args.tier };
  },
});

/**
 * Potvrzení mock platby. Ostrá obdoba je `checkout.session.completed`
 * webhook — proto volá stejnou `activateSubscription`.
 */
export const mockConfirm = mutation({
  args: { tier: tierValidator },
  handler: async (ctx, args): Promise<Id<"members">> => {
    assertMockAllowed();
    const identity = await requireIdentity(ctx);

    if (args.tier === "cestne") {
      throw new Error("Čestné členství uděluje Rada, nedá se koupit.");
    }

    return await applyActivation(ctx, {
      clerkUserId: subjectOf(identity),
      tier: args.tier,
      provider: "mock",
    });
  },
});

/** Zrušení mock platby — vrátí členství do stavu před checkoutem. */
export const abandonCheckout = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const member = await memberOf(ctx, subjectOf(identity));
    if (member.status !== "pending") return;

    await ctx.db.patch(member._id, {
      status: member.memberSince ? "canceled" : "none",
      updatedAt: Date.now(),
    });
  },
});

/* ----------------------------------------------------------- správa členství */

/** Zrušení k datu konce období — členství běží do `currentPeriodEnd`. */
export const cancelAtPeriodEnd = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const member = await memberOf(ctx, subjectOf(identity));

    await ctx.db.patch(member._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });
  },
});

/** Vzetí zrušení zpět, dokud členství ještě běží. */
export const resumeSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const member = await memberOf(ctx, subjectOf(identity));

    await ctx.db.patch(member._id, {
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });
  },
});
