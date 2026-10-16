"use client";

import { useRef, useState } from "react";
import type { Company } from "@/content/careers";

type Group = { key: string; title: string; summary: string[]; items: Company[] };

// 대기업 / 스타트업을 나란히 두고, 회사 박스를 누르면 팝업으로 상세 이력을 보여준다.
export default function CareerBoard({ groups }: { groups: Group[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<Company | null>(null);

  function open(c: Company) {
    setCurrent(c);
    // 상태 반영 뒤에 연다
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }
  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <div className="cb">
        {groups.map((g) => (
          <section key={g.key} className={`cb__col cb__col--${g.key}`} aria-labelledby={`cb-${g.key}`}>
            <h3 id={`cb-${g.key}`} className="cb__title">{g.title}</h3>
            {g.summary.map((t) => (
              <p key={t} className="cb__sum">{t}</p>
            ))}
            <ul className="cb__list">
              {g.items.map((c) => (
                <li key={c.name}>
                  <button type="button" className="cb__box" onClick={() => open(c)} aria-haspopup="dialog">
                    <span className="cb__name">{c.name}</span>
                    <span className="cb__role">{c.role}</span>
                    <span className="cb__plus" aria-hidden="true">+</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="cm"
        aria-labelledby="cm-title"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        onClose={() => setCurrent(null)}
      >
        {current && (
          <div className="cm__inner">
            <button type="button" className="cm__close" onClick={close} aria-label="닫기">
              ×
            </button>
            <p className="cm__tags">{current.industry} · {current.stage}</p>
            <h2 id="cm-title" className="cm__title">
              {current.name}
              <small>{current.en}</small>
            </h2>
            <p className="cm__role">{current.role}</p>
            <ul className="cm__lines">
              {current.lines.map(([head, ...subs]) => (
                <li key={head}>
                  {head}
                  {subs.length > 0 && (
                    <ul>
                      {subs.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </>
  );
}
