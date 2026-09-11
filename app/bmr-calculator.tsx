"use client";

import { type FormEvent, useState } from "react";

type Sex = "male" | "female";

export function BmrCalculator() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("70");
  const [bmr, setBmr] = useState<number | null>(null);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ageValue = Number(age);
    const heightValue = Number(heightCm);
    const weightValue = Number(weightKg);
    if (![ageValue, heightValue, weightValue].every(Number.isFinite) || ageValue <= 0 || heightValue <= 0 || weightValue <= 0) return;
    const value = 10 * weightValue + 6.25 * heightValue - 5 * ageValue + (sex === "male" ? 5 : -161);
    setBmr(Math.round(value));
  }

  return (
    <section className="bmr-panel" aria-labelledby="bmr-title">
      <div className="bmr-header">
        <div>
          <p className="section-kicker">健康计算</p>
          <h2 id="bmr-title">基础代谢计算器</h2>
          <p>使用 Mifflin-St Jeor 公式估算静息状态下每天消耗的基础热量。</p>
        </div>
        {bmr !== null && (
          <div className="bmr-result" aria-live="polite">
            <span>基础代谢</span>
            <strong>{bmr}</strong>
            <small>千卡 / 天</small>
          </div>
        )}
      </div>

      <form className="bmr-form" onSubmit={calculate}>
        <fieldset className="bmr-segmented">
          <legend>性别</legend>
          <label className={sex === "male" ? "is-selected" : ""}>
            <input type="radio" name="sex" value="male" checked={sex === "male"} onChange={() => setSex("male")} />
            男
          </label>
          <label className={sex === "female" ? "is-selected" : ""}>
            <input type="radio" name="sex" value="female" checked={sex === "female"} onChange={() => setSex("female")} />
            女
          </label>
        </fieldset>
        <label className="bmr-field"><span>年龄</span><input type="number" min={1} max={120} value={age} onChange={(event) => setAge(event.target.value)} required /><small>岁</small></label>
        <label className="bmr-field"><span>身高</span><input type="number" min={50} max={260} value={heightCm} onChange={(event) => setHeightCm(event.target.value)} required /><small>厘米</small></label>
        <label className="bmr-field"><span>体重</span><input type="number" min={20} max={400} step={0.1} value={weightKg} onChange={(event) => setWeightKg(event.target.value)} required /><small>公斤</small></label>
        <button className="action-button primary" type="submit">计算基础代谢</button>
      </form>
      <p className="bmr-note">计算结果仅供参考，实际消耗会受体成分、激素、疾病和活动量影响。</p>
    </section>
  );
}
