# 兑换码功能设计文档

## 1. 功能概述

用户通过外部支付平台（链动小铺）购买兑换码，回到网页端输入兑换码后获得游戏额度。每个兑换码可获得 **5 额度**，一次性使用，永久有效直到核销。

### 用户流程

1. 用户在 `payAsYouGo` tab 看到购买引导（二维码 + 链接）
2. 跳转到链动小铺完成支付，获得兑换码
3. 回到网页，在同一 tab 的兑换码输入框中粘贴兑换码
4. 点击兑换，系统校验并发放 5 额度，展示成功/失败提示

### 管理员流程

1. 运行 CLI 脚本批量生成兑换码，写入 Supabase
2. 复制生成结果，上架到链动小铺

---

## 2. 数据库设计

### 2.1 新增表：`redemption_codes`

存储所有兑换码及其状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` (PK, default gen) | 主键 |
| `code` | `text` (UNIQUE, NOT NULL) | 兑换码，如 `wolf-A1B2-C3D4` |
| `credits_amount` | `integer` (NOT NULL, default 5) | 该码可兑换的额度数量 |
| `is_redeemed` | `boolean` (NOT NULL, default false) | 是否已被核销 |
| `redeemed_by` | `uuid` (nullable, FK → auth.users.id) | 核销用户 ID |
| `redeemed_at` | `timestamptz` (nullable) | 核销时间 |
| `created_at` | `timestamptz` (default now()) | 创建时间 |

**索引：**
- `UNIQUE INDEX` on `code`（用于快速查找）
- `INDEX` on `is_redeemed`（用于查询未使用码）

**RLS 策略：**
- 该表仅通过 `supabaseAdmin`（service_role）访问，不开放客户端直接读写

### 2.2 新增表：`redemption_records`

存储每次兑换的核销记录（审计日志）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` (PK, default gen) | 主键 |
| `user_id` | `uuid` (NOT NULL, FK → auth.users.id) | 兑换用户 |
| `code` | `text` (NOT NULL) | 使用的兑换码 |
| `credits_granted` | `integer` (NOT NULL) | 实际发放额度 |
| `created_at` | `timestamptz` (default now()) | 兑换时间 |

### 2.3 SQL 建表语句

```sql
-- 兑换码表
CREATE TABLE public.redemption_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  credits_amount integer NOT NULL DEFAULT 5,
  is_redeemed boolean NOT NULL DEFAULT false,
  redeemed_by uuid REFERENCES auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 核销记录表
CREATE TABLE public.redemption_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  code text NOT NULL,
  credits_granted integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 索引
CREATE INDEX idx_redemption_codes_is_redeemed ON public.redemption_codes(is_redeemed);

-- RLS（仅 service_role 可操作）
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_records ENABLE ROW LEVEL SECURITY;
```

---

## 3. TypeScript 类型更新

在 `src/types/database.ts` 的 `Tables` 中新增两个类型定义：

```typescript
redemption_codes: {
  Row: {
    id: string;
    code: string;
    credits_amount: number;
    is_redeemed: boolean;
    redeemed_by: string | null;
    redeemed_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    code: string;
    credits_amount?: number;
    is_redeemed?: boolean;
    redeemed_by?: string | null;
    redeemed_at?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    code?: string;
    credits_amount?: number;
    is_redeemed?: boolean;
    redeemed_by?: string | null;
    redeemed_at?: string | null;
    created_at?: string;
  };
  Relationships: [];
};

redemption_records: {
  Row: {
    id: string;
    user_id: string;
    code: string;
    credits_granted: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    code: string;
    credits_granted: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    code?: string;
    credits_granted?: number;
    created_at?: string;
  };
  Relationships: [];
};
```

---

## 4. 功能开关

在 `src/lib/welfare-config.ts` 新增：

```typescript
export const REDEMPTION_CODE_ENABLED = true;
```

---

## 5. API 设计

### `POST /api/credits/redeem`

**路径：** `src/app/api/credits/redeem/route.ts`

**请求：**
- Header: `Authorization: Bearer <access_token>`
- Body: `{ "code": "wolf-XXXX-XXXX" }`

**核心逻辑（顺序执行）：**

1. 校验 `REDEMPTION_CODE_ENABLED` 开关
2. 从 Bearer token 解析用户身份（`supabaseAdmin.auth.getUser`）
3. 校验请求体中 `code` 是否存在且非空
4. 查询 `redemption_codes` 表，根据 `code` 查找记录
   - 不存在 → 返回 `400 { error: "invalid_code" }`
   - 已核销 (`is_redeemed = true`) → 返回 `400 { error: "already_redeemed" }`
5. 更新 `redemption_codes` 表：`is_redeemed = true, redeemed_by = user.id, redeemed_at = now()`
6. 读取 `user_credits` 表当前额度，计算新额度（**不设上限**）
7. 更新 `user_credits.credits` 为 `currentCredits + credits_amount`
8. 插入 `redemption_records` 核销记录
9. 返回 `200 { success: true, credits: newCredits, creditsGranted: 5 }`

**并发安全：** 步骤 5 使用条件更新 `.eq("is_redeemed", false)` 防止同一码被并发核销。如果 update 影响行数为 0，说明已被其他请求抢先核销，返回 `400 { error: "already_redeemed" }`。

**错误码映射（供前端 i18n）：**

| error 值 | 含义 |
|----------|------|
| `invalid_code` | 兑换码不存在 |
| `already_redeemed` | 兑换码已被使用 |
| `disabled` | 功能已关闭 |

---

## 6. 前端 Hook 扩展

在 `src/hooks/useCredits.ts` 中新增 `redeemCode` 方法：

```typescript
const redeemCode = useCallback(async (code: string): Promise<{
  success: boolean;
  credits?: number;
  creditsGranted?: number;
  error?: string;
}> => {
  if (!session) return { success: false, error: "unauthorized" };

  const res = await fetch("/api/credits/redeem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code: code.trim() }),
  });

  const payload = await res.json();

  if (!res.ok) {
    return { success: false, error: payload.error };
  }

  setCredits(payload.credits);
  return {
    success: true,
    credits: payload.credits,
    creditsGranted: payload.creditsGranted,
  };
}, [session]);
```

并在返回值中暴露 `redeemCode`。

---

## 7. UI 变更

### 7.1 `payAsYouGo` Tab 重新设计

**替换内容：** 移除现有的微信二维码弹窗（`isWechatQrOpen` 相关逻辑）及联系开发者入口，替换为以下布局：

```
┌─────────────────────────────────────┐
│  购买兑换码                          │
│  ┌───────────────────────────────┐  │
│  │  [pay.png 二维码]              │  │
│  │  扫码或点击链接前往链动小铺购买  │  │
│  │  [打开购买链接 →]              │  │
│  └───────────────────────────────┘  │
│                                     │
│  兑换码兑换                          │
│  ┌───────────────────────────────┐  │
│  │  [输入兑换码] [兑换按钮]        │  │
│  │  每个兑换码可获得 5 局游戏额度   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**交互细节：**
- 输入框 placeholder: `wolf-XXXX-XXXX`
- 兑换按钮点击后 loading 状态
- 成功: `toast.success` 提示 "兑换成功！获得 5 额度"
- 失败:
  - `invalid_code` → "兑换码无效，请检查后重试"
  - `already_redeemed` → "该兑换码已被使用"
  - 其他 → "兑换失败，请稍后重试"
- 成功后清空输入框并刷新额度显示

### 7.2 需要移除的代码

- `isWechatQrOpen` 状态及微信二维码弹窗 Dialog（`UserProfileModal.tsx` 底部）
- 微信支付入口按钮（payAsYouGo tab 顶部的 `button` 元素）
- Stripe 支付相关内容保持不变

### 7.3 Tab 名称

保持 `payAsYouGo` 不变或根据 i18n 调整显示文案为"充值兑换"。

---

## 8. i18n 文案

### zh.json 新增/修改

```json
{
  "customKey": {
    "tabs": {
      "payAsYouGo": "充值兑换"
    },
    "payAsYouGo": {
      "purchaseTitle": "购买兑换码",
      "purchaseDesc": "扫码或点击下方链接前往链动小铺购买兑换码",
      "openPurchaseLink": "打开购买链接",
      "redeemTitle": "兑换码兑换",
      "redeemPlaceholder": "wolf-XXXX-XXXX",
      "redeemButton": "兑换",
      "redeemHint": "每个兑换码可获得 5 局游戏额度",
      "redeeming": "兑换中...",
      "redeemSuccess": "兑换成功！获得 {count} 局游戏额度",
      "redeemError": {
        "invalid_code": "兑换码无效，请检查后重试",
        "already_redeemed": "该兑换码已被使用",
        "disabled": "兑换功能暂未开放",
        "default": "兑换失败，请稍后重试"
      }
    }
  }
}
```

### en.json 新增/修改

```json
{
  "customKey": {
    "tabs": {
      "payAsYouGo": "Top Up"
    },
    "payAsYouGo": {
      "purchaseTitle": "Purchase Redemption Code",
      "purchaseDesc": "Scan or click the link below to purchase a redemption code",
      "openPurchaseLink": "Open Purchase Link",
      "redeemTitle": "Redeem Code",
      "redeemPlaceholder": "wolf-XXXX-XXXX",
      "redeemButton": "Redeem",
      "redeemHint": "Each code grants 5 game credits",
      "redeeming": "Redeeming...",
      "redeemSuccess": "Redeemed! You received {count} game credits",
      "redeemError": {
        "invalid_code": "Invalid code, please check and try again",
        "already_redeemed": "This code has already been used",
        "disabled": "Redemption is currently unavailable",
        "default": "Redemption failed, please try again later"
      }
    }
  }
}
```

---

## 9. 兑换码批量生成脚本

### 路径：`scripts/generate-redemption-codes.ts`

### 使用方式

```bash
pnpm tsx scripts/generate-redemption-codes.ts --count 50
```

### 兑换码格式

`wolf-XXXX-XXXX`，其中 `X` 为大写字母 + 数字（排除易混淆字符 `0O1IL`），共 8 位随机字符。

**字符集：** `ABCDEFGHJKMNPQRSTUVWXYZ23456789`（30 个字符，8 位 → 约 6.56 亿种组合）

### 核心逻辑

1. 接收 `--count` 参数，默认 10
2. 批量生成 N 个唯一兑换码
3. 使用 `supabaseAdmin` 批量插入 `redemption_codes` 表
4. 输出结果为纯文本列表（每行一个码），方便复制粘贴

### 输出示例

```
=== 生成完成：50 个兑换码 ===

wolf-A3B7-K9M2
wolf-P4R8-N5T6
wolf-H2J9-V3W7
...（共 50 行）

复制以上内容即可上架到链动小铺。
```

---

## 10. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/database.ts` | 修改 | 新增 `redemption_codes` 和 `redemption_records` 类型 |
| `src/lib/welfare-config.ts` | 修改 | 新增 `REDEMPTION_CODE_ENABLED` |
| `src/app/api/credits/redeem/route.ts` | **新建** | 兑换 API |
| `src/hooks/useCredits.ts` | 修改 | 新增 `redeemCode` 方法并暴露 |
| `src/components/game/UserProfileModal.tsx` | 修改 | 重构 `payAsYouGo` tab，移除微信弹窗 |
| `src/i18n/messages/zh.json` | 修改 | 新增/修改兑换相关文案 |
| `src/i18n/messages/en.json` | 修改 | 新增/修改兑换相关文案 |
| `scripts/generate-redemption-codes.ts` | **新建** | 批量生成脚本 |
| Supabase Dashboard | 手动 | 执行建表 SQL |

---

## 11. 安全考虑

- **仅服务端校验**：兑换逻辑全部在 API route 中通过 `supabaseAdmin` 执行，客户端无法直接操作兑换码表
- **并发防护**：更新时使用 `.eq("is_redeemed", false)` 条件，确保同一码不会被重复核销
- **认证必需**：所有兑换请求必须携带有效的 Bearer token
- **RLS 兜底**：两张新表启用 RLS 但不添加任何 policy，确保即使 anon key 泄露也无法直接读写
- **无暴力枚举风险**：8 位随机字符（30 字符集）提供约 6.56 亿种组合，且可添加 rate limiting
