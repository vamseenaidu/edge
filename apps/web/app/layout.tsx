import "./globals.css";

export const metadata = {
  title: "EDGE Workbench",
  description: "Minimal EDGE workbench scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">EDGE</div>
            <div className="env">Workbench</div>
          </header>
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
