"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Record" },
  { href: "/history", label: "History" },
  { href: "/monthly", label: "Report" },
];

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">
          Emodiary
        </Link>
        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <NavLink href={item.href} key={item.href} label={item.label} />
          ))}
        </div>
      </nav>

      {children}
    </main>
  );
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link className={isActive ? "nav-link is-active" : "nav-link"} href={href}>
      {label}
    </Link>
  );
}
