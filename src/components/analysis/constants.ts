import type { Role } from "@/types/game";

export const ROLE_ICONS: Record<Role, string> = {
  Werewolf: "/roles/werewolf.png",
  Seer: "/roles/seer.png",
  Witch: "/roles/witch.png",
  Hunter: "/roles/hunter.png",
  Guard: "/roles/guard.png",
  Villager: "/roles/guard.png",
};

export const ROLE_NAMES: Record<Role, string> = {
  Werewolf: "狼人",
  Seer: "预言家",
  Witch: "女巫",
  Hunter: "猎人",
  Guard: "守卫",
  Villager: "平民",
};

export const ROLE_SHORT: Record<Role, string> = {
  Werewolf: "狼",
  Seer: "预",
  Witch: "巫",
  Hunter: "猎",
  Guard: "守",
  Villager: "民",
};

export const NIGHT_EVENT_LABELS: Record<string, string> = {
  kill: "击杀",
  save: "解药",
  poison: "毒药",
  check: "查验",
  guard: "守护",
};

export const NIGHT_EVENT_COLORS: Record<string, { text: string; border: string }> = {
  kill: { text: "text-[#c53030]", border: "border-[#c53030]/30" },
  save: { text: "text-[#2f855a]", border: "border-[#2f855a]/30" },
  poison: { text: "text-[#6b46c1]", border: "border-[#6b46c1]/30" },
  check: { text: "text-[#2c5282]", border: "border-[#2c5282]/30" },
  guard: { text: "text-[#276749]", border: "border-[#276749]/30" },
};

export const DAY_EVENT_LABELS: Record<string, string> = {
  exile: "放逐",
  badge: "警长竞选",
  hunter_shot: "猎人开枪",
};
