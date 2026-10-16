"use client";

import { useState } from "react";
import type { Concern } from "@/content/services";

// 6가지 상황 중 하나를 고르면 오른쪽에 세부 내용이 열린다 (목록을 길게 펼치지 않는다)
export default function ConcernsExplorer({ concerns }: { concerns: Concern[] }) {
  const [active, setActive] = useState(0);
  const current = concerns[active];

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (active + d + concerns.length) % concerns.length;
    setActive(next);
    document.getElementById(`cx-tab-${next}`)?.focus();
  }

  return (
    <div className="cx">
      <div className="cx__tabs" role="tablist" aria-label="조직의 상황 선택" aria-orientation="vertical">
        {concerns.map((c, i) => (
          <button
            key={c.title}
            id={`cx-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="cx-panel"
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
          >
            {c.title}
          </button>
        ))}
      </div>
      <div id="cx-panel" role="tabpanel" aria-labelledby={`cx-tab-${active}`} className="cx__panel" key={active}>
        <h2 className="cx__title">{current.title}</h2>
        <div className="cx__items">
          {current.items.map(([head, body]) => (
            <div key={head} className="cx__item">
              <h3>{head}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
