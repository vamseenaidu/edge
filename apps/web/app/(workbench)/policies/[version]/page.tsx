import { PolicyDetailClient } from "../../../../components/InlineStatus";
import { getPolicy, listPolicies } from "../../../../lib/mockPolicies";

export function generateStaticParams() {
  return listPolicies().map((policy) => ({ version: policy.version }));
}

export default function PolicyDetailPage({ params }: { params: { version: string } }) {
  const initialPolicy = getPolicy(params.version);

  return <PolicyDetailClient version={params.version} initialPolicy={initialPolicy} />;
}
