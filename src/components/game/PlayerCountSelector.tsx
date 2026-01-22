"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PlayerCountSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: number;
  onChange: (value: number) => void;
}

const PLAYER_COUNT_OPTIONS: Array<{
  count: number;
  title: string;
  subtitle: string;
  description: string;
  roles: string;
}> = [
  {
    count: 8,
    title: "8人局",
    subtitle: "紧凑对局",
    description: "3狼 3神 2民",
    roles: "神职：预言家、女巫、猎人",
  },
  {
    count: 9,
    title: "9人局",
    subtitle: "经典入门",
    description: "3狼 3神 3民",
    roles: "神职：预言家、女巫、猎人",
  },
  {
    count: 10,
    title: "10人局",
    subtitle: "标准配置",
    description: "3狼 4神 3民",
    roles: "神职：预言家、女巫、猎人、守卫",
  },
  {
    count: 11,
    title: "11人局",
    subtitle: "加速博弈",
    description: "4狼 4神 3民",
    roles: "神职：预言家、女巫、猎人、守卫",
  },
  {
    count: 12,
    title: "12人局",
    subtitle: "经典满配",
    description: "4狼 4神 4民",
    roles: "神职：预言家、女巫、猎人、守卫",
  },
];

export function PlayerCountSelector({
  open,
  onOpenChange,
  value,
  onChange,
}: PlayerCountSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wc-difficulty-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif text-[var(--text-primary)]">玩家数量</DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            选择对局人数与标准职位配置
          </DialogDescription>
        </DialogHeader>

        <div className="wc-difficulty-grid">
          {PLAYER_COUNT_OPTIONS.map((option) => {
            const active = option.count === value;
            return (
              <button
                key={option.count}
                type="button"
                className="wc-difficulty-card"
                data-active={active ? "true" : "false"}
                aria-pressed={active}
                onClick={() => onChange(option.count)}
              >
                <div className="wc-difficulty-card-head">
                  <div>
                    <div className="wc-difficulty-title">{option.title}</div>
                    <div className="wc-difficulty-subtitle">{option.subtitle}</div>
                  </div>
                  <div className="wc-difficulty-pill">
                    <span>{option.count}人</span>
                    {active ? <CheckCircle size={16} weight="fill" /> : null}
                  </div>
                </div>
                <div className="wc-difficulty-desc">{option.description}</div>
                <div className="wc-difficulty-desc text-[var(--text-muted)]">{option.roles}</div>
              </button>
            );
          })}
        </div>

        <div className="wc-difficulty-footer">
          仅调整人数与职位配置，玩法流程保持一致。
        </div>
      </DialogContent>
    </Dialog>
  );
}
