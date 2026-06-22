"use client";

import { useRouter } from "next/navigation";
import { Bot, LogIn } from "lucide-react";
import { Button, Panel, TextInput } from "@/components/ui";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <section className={styles.login}>
        <div className={styles.brand}>
          <Bot size={28} />
          <div>
            <h1>AI QA Platform</h1>
            <p>Requirement analysis workspace</p>
          </div>
        </div>
        <Panel>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              router.push("/dashboard");
            }}
          >
            <label>
              Email
              <TextInput defaultValue="qa@example.com" type="email" />
            </label>
            <label>
              Password
              <TextInput defaultValue="demo-password" type="password" />
            </label>
            <Button type="submit">
              <LogIn size={16} />
              Sign in
            </Button>
          </form>
        </Panel>
      </section>
    </main>
  );
}
