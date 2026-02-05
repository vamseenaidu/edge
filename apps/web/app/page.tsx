import Link from "next/link";

export default function HomePage() {
  return (
    <div className="card">
      <h1>Workbench</h1>
      <p>Minimal static shell. Navigate to Runs to continue.</p>
      <Link className="link" href="/runs">
        Go to Runs
      </Link>
    </div>
  );
}
