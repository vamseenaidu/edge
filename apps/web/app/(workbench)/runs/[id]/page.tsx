import { RunDetailClient } from "../../../../lib/runsClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "run-placeholder" }];
}

export default function RunDetailPage({ params }: { params: { id: string } }) {
  return <RunDetailClient runId={params.id} />;
}
