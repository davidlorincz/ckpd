import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { tierValidator } from "./schema";
import { isMembershipActive } from "./lib/membershipState";
import { requireAdmin, requireIdentity, subjectOf } from "./lib/auth";
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

/**
 * Mock brána smí aktivovat členství jen mimo ostrý provoz.
 *
 * Zavřeno napevno: povolí to jedině explicitní `BILLING_PROVIDER=mock`
 * v prostředí Convexu. Dřív to bylo obráceně — blokovala jen hodnota
 * `"stripe"`, takže překlep nebo chybějící proměnná otevřely komukoli
 * přihlášenému cestu k členství zdarma (a tím i k členskému číslu
 * a ověřovacímu kódu v partnerském API).
 */
function assertMockAllowed() {
  if (process.env.BILLING_PROVIDER !== "mock") {
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

/**
 * Ručně udělené členství si člen nesmí přepsat sám.
 *
 * Bez téhle kontroly stačí v účtu kliknout na druhou variantu — `startCheckout`
 * přepíše `tier` i `status` na `pending` a grant je pryč. Ptáme se na aktivní
 * stav, ne jen na původ: po odebrání grantu si má jít varianta normálně koupit.
 */
function assertNotGranted(member: Doc<"members">) {
  if (
    member.billingProvider === "manual" &&
    isMembershipActive(member, Date.now())
  ) {
    throw new Error(
      "Členství ti udělila komora — variantu nelze změnit platbou. Napiš nám, pokud ji chceš změnit.",
    );
  }
}

/** Členství se prodlužuje po měsících. */
function addMonth(from: number): number {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

/* ------------------------------------------------------ zápis stavu členství */

type ActivateCore = {
  tier: "zakladni" | "pro" | "cestne";
  /**
   * Konec období. Chybí = dopočítá se měsíc dopředu (platba),
   * `null` = bez časového omezení (ruční udělení).
   */
  periodEnd?: number | null;
  provider: "mock" | "stripe" | "manual";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

type ActivateArgs = ActivateCore & { clerkUserId: string };

/**
 * JEDINÉ místo, kde vzniká aktivní členství — a kde se razí členské číslo.
 * Prochází tudy mock brána, (později) Stripe webhook i ruční udělení
 * adminem. Kdyby si grant psal do evidence po svém, vyráběla by se čísla
 * a ověřovací kódy dvěma způsoby.
 *
 * Je to obyčejná funkce, ne mutace: mutace v Convexu nemůže volat jinou
 * mutaci, a `mockConfirm` ji potřebuje zavolat přímo. Autorizace je proto
 * na volajícím — stejný vzor jako `credentials.issueCredential`.
 */
async function activate(
  ctx: MutationCtx,
  member: Doc<"members">,
  args: ActivateCore,
) {
  const now = Date.now();

  const patch: Partial<Doc<"members">> = {
    tier: args.tier,
    // `undefined` v patchi pole odstraní — a prázdné `currentPeriodEnd`
    // znamená ve všech čtecích pravidlech „platí navždy".
    currentPeriodEnd:
      args.periodEnd === null ? undefined : (args.periodEnd ?? addMonth(now)),
    status: "active",
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

/** Vstup pro platební cestu — dohledá člena podle Clerk identity. */
export async function applyActivation(ctx: MutationCtx, args: ActivateArgs) {
  const member = await memberOf(ctx, args.clerkUserId);
  return await activate(ctx, member, args);
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
    assertNotGranted(member);

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
    assertNotGranted(await memberOf(ctx, subjectOf(identity)));

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

/* ------------------------------------------------------ ruční správa členství */

/**
 * Udělení členství adminem — bez platby.
 *
 * Prochází stejným jádrem jako platba, takže se členovi přidělí skutečné
 * členské číslo z čítače i ověřovací kód platný v partnerském API. To je
 * záměr: udělený člen je opravdový člen. Neodemyká to ale jen DIGI
 * univerzitu — taky veřejný seznam, vydávání certifikací a odpověď partnerům.
 *
 * `periodEnd` bez hodnoty znamená bez časového omezení. Nic v systému
 * členství neexpiruje (žádný cron se evidence nedotýká), platnost se
 * dopočítává při čtení — a prázdné datum tam znamená „platí navždy".
 */
export const adminGrantMembership = mutation({
  args: {
    memberId: v.id("members"),
    tier: tierValidator,
    periodEnd: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Členský záznam nenalezen.");

    const memberId = await activate(ctx, member, {
      tier: args.tier,
      periodEnd: args.periodEnd ?? null,
      provider: "manual",
    });

    // Stopa se přidává až po aktivaci, aby v ní byl stav PŘED zásahem.
    const fresh = await ctx.db.get(memberId);
    await ctx.db.patch(memberId, {
      membershipGrants: [
        ...(fresh?.membershipGrants ?? []),
        {
          at: Date.now(),
          by: subjectOf(identity),
          action: "grant" as const,
          tier: args.tier,
          previousTier: member.tier,
          previousStatus: member.status,
          periodEnd: args.periodEnd,
          note: args.note?.trim() || undefined,
        },
      ],
    });

    return memberId;
  },
});

/**
 * Odebrání členství adminem.
 *
 * Variantu ani členské číslo nemaže — číslo je podle návrhu neměnné a
 * ukončené členství je jiná odpověď než žádné. Ověřovací API i veřejný
 * seznam přestanou člena uznávat okamžitě, protože obojí čte `status`.
 */
export const adminRevokeMembership = mutation({
  args: { memberId: v.id("members"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Členský záznam nenalezen.");

    await ctx.db.patch(member._id, {
      status: "canceled",
      cancelAtPeriodEnd: false,
      membershipGrants: [
        ...(member.membershipGrants ?? []),
        {
          at: Date.now(),
          by: subjectOf(identity),
          action: "revoke" as const,
          previousTier: member.tier,
          previousStatus: member.status,
          note: args.note?.trim() || undefined,
        },
      ],
      updatedAt: Date.now(),
    });
  },
});
