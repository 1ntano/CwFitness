"use client";

import { useState } from "react";

type Settings = { timeZone: string; weightUnit: "kg" | "lb" };

export function SettingsPanel({ settings, busy, onSave, onDelete }: { settings: Settings; busy: boolean; onSave: (settings: Settings) => Promise<void>; onDelete: () => Promise<void> }) {
  const [timeZone, setTimeZone] = useState(settings.timeZone);
  const [weightUnit, setWeightUnit] = useState(settings.weightUnit);
  return <section className="workspace-section" aria-labelledby="settings-title"><header className="section-heading"><div><p className="section-kicker">设置</p><h1 id="settings-title">让训练适合你。</h1></div><p>默认时区用于开始新训练；单位只改变显示与输入方式，不改变已存储的数据。</p></header><form className="inline-create-form" onSubmit={(event) => { event.preventDefault(); void onSave({ timeZone, weightUnit }); }}><label><span>时区</span><input value={timeZone} onChange={(event) => setTimeZone(event.target.value)} required /></label><label><span>重量单位</span><select value={weightUnit} onChange={(event) => setWeightUnit(event.target.value as "kg" | "lb")}><option value="kg">kg</option><option value="lb">lb</option></select></label><button className="action-button primary" type="submit" disabled={busy}>保存设置</button></form><section className="danger-zone"><h2>删除用户</h2><p>这会永久删除你的计划、动作和训练记录，且无法恢复。</p><button className="action-button danger" type="button" disabled={busy} onClick={() => { if (window.confirm("永久删除用户及所有训练数据？此操作无法恢复。")) void onDelete(); }}>永久删除用户</button></section></section>;
}
