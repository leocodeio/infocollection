import React from "react";
import { Header } from "./Header";

export function Layout({
  children,
  padTop = true,
}: {
  children: React.ReactNode;
  padTop?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className={padTop ? "pt-20" : undefined}>{children}</main>
    </div>
  );
}
