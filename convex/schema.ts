import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Varianta členství. `cestne` uděluje Rada osobnostem oboru, bez příspěvku. */
export const tierValidator = v.union(
  v.literal("zakladni"),
  v.literal("pro"),
  v.literal("cestne"),
);

/**
 * Stav členství.
 *  none      — zaregistrovaný účet bez tarifu (registrace je zdarma)
 *  pending   — rozjetá platba, čeká se na potvrzení od brány
 *  active    — platné členství
 *  past_due  — platba selhala, členství ještě neskončilo
 *  canceled  — členství skončilo
 */
export const statusValidator = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
);

/**
 * Publikační stav obsahu DIGI univerzity. `draft` je vidět jen v dev režimu
 * a v adminu — stejné pravidlo jako u stanovisek (lib/stanoviska.ts).
 */
export const publishStateValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

/** Druh lekce. Zatím se vyrábí jen `video`, zbytek je připravený tvar. */
export const lessonKindValidator = v.union(
  v.literal("video"),
  v.literal("text"),
  v.literal("quiz"),
);

/**
 * Kdo hostuje video. Záměrně v datech, ne v konfiguraci — díky tomu jde
 * providera porovnávat lekci po lekci a přepnout bez migrace (convex/video.ts).
 */
export const videoProviderValidator = v.union(
  v.literal("mux"),
  v.literal("bunny"),
);

export default defineSchema({
  /**
   * Editovatelné texty webu. Klíč = dot-notation adresa místa na webu
   * (např. "home.hero.title", "clenstvi.benefits.3.label").
   * Výchozí hodnoty zůstávají v kódu — řádek tu vzniká až první editací
   * (auto-upsert v content.update).
   */
  content: defineTable({
    key: v.string(),
    value: v.string(),
    category: v.string(), // první segment klíče, pro filtrování v dashboardu
    lastEditedBy: v.string(), // Clerk user id
    lastEditedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  /** Historie změn — kdo, kdy, co přepsal. */
  contentHistory: defineTable({
    contentId: v.id("content"),
    key: v.string(),
    oldValue: v.string(),
    newValue: v.string(),
    editedBy: v.string(),
    editedAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_date", ["editedAt"]),

  /**
   * Evidence členů. Zdroj pravdy pro stav členství v aplikaci — záměrně NENÍ
   * v Clerk metadatech, protože zápis řídí platební brána a musí být
   * auditovatelný. Clerk drží jen identitu (`clerkUserId`, `email`).
   * Řádek vzniká lazy při prvním otevření členské sekce (members.ensureSelf).
   */
  members: defineTable({
    clerkUserId: v.string(),
    email: v.string(),

    // Profil — zrcadlí pole přihlášky (components/member/ProfileForm.tsx)
    name: v.string(),
    ico: v.optional(v.string()),
    phone: v.optional(v.string()),
    uclOperator: v.optional(v.string()),
    region: v.optional(v.string()),
    focus: v.array(v.string()),
    profile: v.optional(v.string()), // jednořádkový popis do veřejného seznamu

    // Členství
    tier: v.optional(tierValidator),
    status: statusValidator,
    memberSince: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),

    // Identita a ověření členství partnery
    /** Členské číslo „CKPD-2026-0142". Neměnné, není tajné. */
    memberNumber: v.optional(v.string()),
    memberNumberYear: v.optional(v.number()),
    memberNumberSeq: v.optional(v.number()),
    /** Ověřovací kód „CKPD-2026-0142-K7M9XQ2T" — členské číslo + tajemství. */
    verificationCode: v.optional(v.string()),
    /** Normalizovaný tvar „2026:0142:K7M9XQ2T" — klíč pro lookup. */
    verificationCodeLookup: v.optional(v.string()),
    verificationCodeIssuedAt: v.optional(v.number()),

    // Souhlasy
    /** Souhlas se zveřejněním ve veřejném seznamu i v odpovědi ověřovacího API. */
    publicListing: v.boolean(),
    agreeStatutesAt: v.optional(v.number()),
    agreeGdprAt: v.optional(v.number()),

    // Platby — mock i Stripe sdílí stejný tvar, aby přechod nic neměnil
    billingProvider: v.union(v.literal("mock"), v.literal("stripe")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_code", ["verificationCodeLookup"])
    .index("by_number", ["memberNumber"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  /**
   * Klíče partnerů pro ověřovací API (slevové programy). Každý partner má
   * vlastní klíč — revokace jednoho neshodí ostatní. V DB je jen SHA-256 hash;
   * plaintext se ukáže jednou při vydání a už nikdy.
   */
  partnerKeys: defineTable({
    partnerName: v.string(),
    contactEmail: v.string(),
    keyHash: v.string(),
    /** Prvních pár znaků klíče, aby šel v adminu poznat. Není tajný. */
    keyPrefix: v.string(),
    scopes: v.array(v.string()),
    active: v.boolean(),
    rateLimitPerMin: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_hash", ["keyHash"])
    .index("by_active", ["active"]),

  /**
   * Audit dotazů na ověřovací API. Zaznamenává i neúspěšné pokusy — jinak by
   * nešlo poznat, že se někdo pokouší kódy hádat. Retence 90 dní (crons.ts).
   */
  verificationLog: defineTable({
    partnerKeyId: v.optional(v.id("partnerKeys")),
    codeLookup: v.string(),
    memberId: v.optional(v.id("members")),
    result: v.union(
      v.literal("valid"),
      v.literal("not_found"),
      v.literal("inactive"),
      v.literal("bad_format"),
      v.literal("rate_limited"),
      v.literal("unauthorized"),
    ),
    at: v.number(),
  })
    .index("by_partner_at", ["partnerKeyId", "at"])
    .index("by_at", ["at"]),

  /**
   * Pořadová čísla. Convex mutace jsou transakční, takže čtení a zvýšení
   * čítače v jedné mutaci nemůže vydat dvě stejná členská čísla.
   * Klíč = `memberNumber:2026`.
   */
  counters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  /** Fixed-window čítač requestů. Drží se v DB, aby odpadla závislost na KV. */
  rateLimits: defineTable({
    /** `${partnerKeyId}:${minuta}` */
    bucket: v.string(),
    count: v.number(),
    expiresAt: v.number(),
  }).index("by_bucket", ["bucket"]),

  /* ═══════════════════════════════════ DIGI univerzita ═══════════════════ */

  /**
   * Kurz. Obsah se seeduje z `content/digiuniverzita/*.json`
   * (generuje `scripts/build-digiuniverzita-seed.mjs` z produkčních podkladů
   * v repu `dronpro-videos`), dál se edituje v adminu.
   *
   * `requiredTier` nevyplněný = kurz pro každého aktivního člena, tedy
   * „hobby část“ ze strategie. `pro` = plný rozsah jen pro PRO.
   */
  courses: defineTable({
    slug: v.string(),
    title: v.string(),
    perex: v.string(),
    coverImageUrl: v.optional(v.string()),
    requiredTier: v.optional(tierValidator),
    state: publishStateValidator,
    position: v.number(),
    /** Souhrny přes lekce. Přepočítává je mutace, která lekce mění. */
    lessonCount: v.number(),
    totalDurationSeconds: v.number(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_state", ["state", "position"]),

  /** Modul kurzu. Jen seskupení lekcí v osnově, nic víc. */
  courseSections: defineTable({
    courseId: v.id("courses"),
    key: v.string(),
    title: v.string(),
    position: v.number(),
  }).index("by_course", ["courseId", "position"]),

  /**
   * Lekce. `durationSeconds` je zdroj pravdy pro vážená procenta kurzu
   * i pro ořez heartbeatu — proto se u videa vyplňuje z webhooku providera,
   * ne z klienta.
   */
  lessons: defineTable({
    courseId: v.id("courses"),
    sectionId: v.optional(v.id("courseSections")),
    slug: v.string(),
    title: v.string(),
    perex: v.string(),
    position: v.number(),
    kind: lessonKindValidator,

    videoProvider: v.optional(videoProviderValidator),
    /** Mux asset/playback id, u Bunny GUID videa. */
    videoAssetId: v.optional(v.string()),
    durationSeconds: v.number(),
    posterUrl: v.optional(v.string()),

    bodyMd: v.optional(v.string()),
    attachments: v.array(
      v.object({ label: v.string(), url: v.string(), sizeBytes: v.optional(v.number()) }),
    ),

    /** Veřejná ukázka — hraje i nepřihlášenému. */
    isPreview: v.boolean(),
    /** Počítá se do procent kurzu. Bonusová lekce dostane false. */
    isRequired: v.boolean(),
    /** Zpřísnění oproti kurzu; nikdy ne zmírnění. */
    requiredTier: v.optional(tierValidator),
    state: publishStateValidator,
    /** Proč je lekce draft — ať to admin nemusí dohledávat v Obsidianu. */
    stateNote: v.optional(v.string()),

    /** Odkud se obsah vzal. Evidence, přehrávač to nepoužívá. */
    sourceMaster: v.optional(v.string()),
    sourceYoutubeId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId", "position"])
    .index("by_course_slug", ["courseId", "slug"])
    .index("by_section", ["sectionId", "position"]),

  /**
   * Transkript zvlášť od lekce: je to 117–206 vět, které se načítají jen
   * na stránce lekce. V dokumentu lekce by zbytečně tekly do každého výpisu
   * katalogu.
   */
  lessonTranscripts: defineTable({
    lessonId: v.id("lessons"),
    segments: v.array(
      v.object({ start: v.number(), end: v.number(), text: v.string() }),
    ),
    updatedAt: v.number(),
  }).index("by_lesson", ["lessonId"]),

  /**
   * Postup člena v lekci. Jeden řádek na (člen, lekce), upsertovaný
   * heartbeatem — viz `convex/lib/ranges.ts`, kde je vysvětlené,
   * proč se drží pokrytí a ne jen poslední pozice.
   */
  lessonProgress: defineTable({
    memberId: v.id("members"),
    lessonId: v.id("lessons"),
    /** Denormalizované, aby šel postup v kurzu číst jedním indexem. */
    courseId: v.id("courses"),

    /** 0–1. Necháváme podíl, ne boolean — kvíz i video pak sdílí tvar. */
    completion: v.number(),
    completedAt: v.optional(v.number()),
    completionTrigger: v.optional(
      v.union(v.literal("auto"), v.literal("manual"), v.literal("admin")),
    ),

    /** Kam se vrátit. */
    lastPositionSeconds: v.number(),
    /** Nejdál dosažený bod — druhá podmínka dokončení. */
    maxPositionSeconds: v.number(),
    /** Unikátní pokrytí v sekundách (odvozené z watchedRanges). */
    watchedSeconds: v.number(),
    watchedRanges: v.array(v.object({ s: v.number(), e: v.number() })),
    playCount: v.number(),

    firstViewedAt: v.number(),
    lastViewedAt: v.number(),
  })
    .index("by_member_lesson", ["memberId", "lessonId"])
    .index("by_member_course", ["memberId", "courseId"])
    .index("by_member_recent", ["memberId", "lastViewedAt"])
    // pro admina: „sleduje tuhle lekci/kurz vůbec někdo?" před smazáním
    .index("by_lesson", ["lessonId"])
    .index("by_course", ["courseId"]),

  /**
   * Souhrn za kurz. Denormalizovaný záměrně: dashboard vypisuje všechny
   * kurzy člena a počítat procenta za běhu by znamenalo načíst všechny lekce
   * a všechen postup. Přepočítává se v téže mutaci jako heartbeat.
   */
  courseProgress: defineTable({
    memberId: v.id("members"),
    courseId: v.id("courses"),
    lessonsTotal: v.number(),
    lessonsCompleted: v.number(),
    /** 0–1, vážené délkou lekce — ne podílem počtu lekcí. */
    percent: v.number(),
    watchedSeconds: v.number(),
    /** Kam míří „Pokračovat“. */
    lastLessonId: v.optional(v.id("lessons")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_member", ["memberId", "updatedAt"])
    .index("by_member_course", ["memberId", "courseId"]),

  /** Poznámka člena k místu ve videu. */
  lessonNotes: defineTable({
    memberId: v.id("members"),
    lessonId: v.id("lessons"),
    atSeconds: v.number(),
    text: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_member_lesson", ["memberId", "lessonId", "atSeconds"])
    .index("by_lesson", ["lessonId"]),

  /**
   * Kvíz na konci modulu nebo kurzu.
   *
   * Otázky se losují při každém pokusu — pool je záměrně mnohem větší než
   * jeden test, takže opakování není memorování pořadí.
   */
  quizzes: defineTable({
    courseId: v.id("courses"),
    /** Kvíz může viset na konkrétní lekci, nebo na celém kurzu. */
    lessonId: v.optional(v.id("lessons")),
    slug: v.string(),
    title: v.string(),
    perex: v.string(),
    /** Kolik otázek se vylosuje na jeden pokus. */
    questionsPerAttempt: v.number(),
    /** Kolik z nich musí být správně. */
    passingScore: v.number(),
    state: publishStateValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_slug", ["slug"]),

  /**
   * Otázka v poolu.
   *
   * `verified` je zásadní: pool k A1/A3 vznikl jako best-guess podle EU a ÚCL
   * pravidel a **dokud ho neprojde lektor, nesmí se nasadit**. Komora nemůže
   * zkoušet piloty z klíčů, které sama neověřila.
   */
  quizQuestions: defineTable({
    quizId: v.id("quizzes"),
    /** Sekce poolu — losuje se rovnoměrně napříč nimi. */
    section: v.string(),
    position: v.number(),
    question: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.string(),
    verified: v.boolean(),
    state: publishStateValidator,
  })
    .index("by_quiz", ["quizId", "position"])
    .index("by_quiz_section", ["quizId", "section"]),

  /** Jeden pokus člena. Historie se nemaže — je podkladem pro potvrzení. */
  quizAttempts: defineTable({
    memberId: v.id("members"),
    quizId: v.id("quizzes"),
    questionIds: v.array(v.id("quizQuestions")),
    answers: v.array(
      v.object({ questionId: v.id("quizQuestions"), chosenIndex: v.number() }),
    ),
    score: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index("by_member_quiz", ["memberId", "quizId", "startedAt"])
    .index("by_member", ["memberId", "startedAt"]),

  /**
   * Potvrzení o absolvování kurzu.
   *
   * Záměrně NENÍ „certifikát“ — komora nevydává doklady státního typu
   * (viz scripts/content-lint.mjs). Je to potvrzení, že člen kurz prošel.
   *
   * `snapshot` drží data k okamžiku vydání: kurzy se přejmenovávají a lidé
   * mění příjmení, ale potvrzení z roku 2026 musí i za pět let vypadat stejně.
   * Řádek se nikdy nemaže — odebrané potvrzení je jiná odpověď než neexistující.
   */
  courseCompletions: defineTable({
    memberId: v.id("members"),
    courseId: v.id("courses"),
    /** `CKPD-DU-2026-7F3K9Q`, Crockford base32 (convex/lib/code.ts). */
    code: v.string(),
    codeLookup: v.string(),
    issuedAt: v.number(),
    snapshot: v.object({
      holderName: v.string(),
      memberNumber: v.optional(v.string()),
      courseTitle: v.string(),
      issuerName: v.string(),
      lessonsCompleted: v.number(),
      totalDurationSeconds: v.number(),
    }),
    /** SHA-256 nad kanonickým JSONem snapshotu. */
    contentHash: v.string(),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),
  })
    .index("by_code", ["codeLookup"])
    .index("by_member_course", ["memberId", "courseId"])
    .index("by_course", ["courseId"]),
});
