import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <div className="grain" aria-hidden="true" />
      <Link className="brand" href="/" aria-label="CwFitness 首页">
        <span className="brand-mark" aria-hidden="true" />
        CwFitness
      </Link>
      <section className="split-layout" id="main-content">
        <div className="story">
          <p className="eyebrow">下一组，由你定义</p>
          <h1>每一次完成，<br />都有迹可循。</h1>
          <p>围绕你的训练计划记录每一组，在恰当的时间看见真正的进步。</p>
        </div>
        <div className="content-side">{children}</div>
      </section>
    </main>
  );
}
