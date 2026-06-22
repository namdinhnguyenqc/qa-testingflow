import Link from "next/link";
import { Bot, ClipboardCheck, LayoutDashboard, Settings } from "lucide-react";
import styles from "./shell.module.css";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.brand}>
          <Bot size={22} />
          <span>AI QA</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link href="/projects">
            <ClipboardCheck size={18} />
            Projects
          </Link>
          <Link href="/config">
            <Settings size={18} />
            Config
          </Link>
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
