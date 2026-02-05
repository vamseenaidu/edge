import { PolicyDetailClient } from "../../../../components/InlineStatus";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ version: "edge-clinical.v1.0.0" }];
}

export default function PolicyDetailPage({ params }: { params: { version: string } }) {
  return <PolicyDetailClient version={params.version} initialPolicy={null} />;
}
