"use client";

import { useState } from "react";
import { EXERCISE_PRESETS } from "../lib/exercise-presets";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type MuscleGroup } from "../lib/exercise-taxonomy";
import { BmrCalculator } from "./bmr-calculator";

function bilibiliSearchUrl(name: string) {
  return `https://search.bilibili.com/all?keyword=${encodeURIComponent(`${name} 动作教学`)}`;
}

function resistanceLabel(value: "WEIGHTED" | "BODYWEIGHT") {
  return value === "WEIGHTED" ? "负重" : "自重";
}

function targetLabel(value: "REPETITIONS" | "DURATION") {
  return value === "REPETITIONS" ? "次数训练" : "时长训练";
}

export function ToolsPanel() {
  const [activeGroup, setActiveGroup] = useState<MuscleGroup>("CHEST");
  const visiblePresets = EXERCISE_PRESETS.filter((preset) => preset.muscleGroup === activeGroup);

  return (
    <section className="workspace-section tools-section" aria-label="训练工具">
      <header className="section-heading tools-heading">
        <div>
          <p className="section-kicker">训练工具</p>
          
        </div>
        <p>按训练部位筛选推荐动作，点击卡片即可打开 B 站搜索演示视频。</p>
      </header>

      <BmrCalculator />

      <div className="tools-layout">
        <nav className="tools-tabs" aria-label="训练部位筛选">
          {MUSCLE_GROUPS.map((group) => (
            <button
              className={`tools-tab${group === activeGroup ? " is-current" : ""}`}
              type="button"
              aria-current={group === activeGroup ? "page" : undefined}
              key={group}
              onClick={() => setActiveGroup(group)}
            >
              <span>{MUSCLE_GROUP_LABELS[group]}</span>
              <small>{EXERCISE_PRESETS.filter((preset) => preset.muscleGroup === group).length}</small>
            </button>
          ))}
        </nav>

        <div className="tools-content">
          <div className="tools-content-header">
            <div>
              <p className="section-kicker">当前分类</p>
              <h2>{MUSCLE_GROUP_LABELS[activeGroup]}</h2>
            </div>
            <span>{visiblePresets.length} 个推荐动作</span>
          </div>

          <div className="tools-video-grid">
            {visiblePresets.map((preset) => (
              <a
                className="tools-video-card"
                href={bilibiliSearchUrl(preset.name)}
                target="_blank"
                rel="noreferrer noopener"
                key={preset.name}
              >
                <div className="tools-video-card-top">
                  <span className="tools-play" aria-hidden="true">▶</span>
                  <span className="tools-video-label">B 站演示</span>
                </div>
                <h3>{preset.name}</h3>
                <p>{resistanceLabel(preset.resistanceType)} · {targetLabel(preset.targetType)}</p>
                <span className="tools-video-action">打开演示视频 <b aria-hidden="true">↗</b></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
