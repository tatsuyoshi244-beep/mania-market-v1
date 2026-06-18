export function BillingPortalButton() {
  return (
    <form action="/api/stripe/portal" method="POST">
      <button
        type="submit"
        className="rounded-md border border-lagoon/30 bg-lagoon/10 px-5 py-3 text-sm font-bold text-lagoon hover:border-lagoon hover:bg-lagoon/15"
      >
        請求管理（解約・プラン変更・支払い方法）
      </button>
    </form>
  );
}