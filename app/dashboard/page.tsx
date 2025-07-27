import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSubscriptionDetails } from "@/lib/subscription";
import PricingTable from "@/app/pricing/_component/pricing-table";
import CreateBooks from "@/app/dashboard/_components/create-books";

export default async function Dashboard() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  const subscriptionDetails = await getSubscriptionDetails();

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <CreateBooks />
        </div>
        
        {/* Right column - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <PricingTable subscriptionDetails={subscriptionDetails} />
        </div>
      </div>
    </div>
  );
}