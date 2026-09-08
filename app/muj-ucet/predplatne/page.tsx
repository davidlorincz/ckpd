import { SubscriptionPanel } from "@/components/member/SubscriptionPanel";

/**
 * Zámek DIGI univerzity sem posílá nezaplacené s `?od=digiuniverzita`.
 * Bez vysvětlení by to vypadalo jako chyba — proto ta hláška nahoře.
 */
export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ od?: string }>;
}) {
  const { od } = await searchParams;

  return (
    <>
      {od === "digiuniverzita" && (
        <p className="mb-8 border border-hairline border-l-2 border-l-brass bg-paper-2 p-5 text-[15px] leading-relaxed text-ink">
          DIGI univerzita je součástí členství. Vyber si variantu a kurzy se ti
          odemknou.
        </p>
      )}
      <SubscriptionPanel />
    </>
  );
}
