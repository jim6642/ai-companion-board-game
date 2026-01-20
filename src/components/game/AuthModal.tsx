"use client";

import { useState, useMemo } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "magic_link" | "password";

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("magic_link");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return window.location.origin;
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("请输入邮箱");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    setLoading(false);
    if (error) {
      toast.error("发送失败", { description: error.message });
    } else {
      toast.success("登录链接已发送", { description: "请检查邮箱，点击链接即可登录" });
    }
  };

  const appearance = useMemo(
    () => ({
      theme: ThemeSupa,
      variables: {
        default: {
          colors: {
            brand: "var(--color-gold)",
            brandAccent: "var(--color-gold-dark)",
            inputBorder: "var(--border-color)",
            inputBorderHover: "var(--color-accent)",
            inputBorderFocus: "var(--color-accent)",
            inputText: "var(--text-primary)",
            inputPlaceholder: "var(--text-muted)",
            messageText: "var(--text-secondary)",
            messageTextDanger: "var(--color-danger)",
            anchorTextColor: "var(--color-gold-dark)",
            defaultButtonBackground: "var(--color-gold)",
            defaultButtonBackgroundHover: "var(--color-gold-dark)",
            defaultButtonBorder: "var(--color-gold)",
            defaultButtonText: "#1a1614",
          },
        },
      },
      className: {
        container: "wc-auth",
        button: "wc-auth-button",
        input: "wc-auth-input",
        label: "wc-auth-label",
        message: "wc-auth-message",
      },
    }),
    []
  );

  const localization = useMemo(
    () => ({
      variables: {
        sign_in: {
          email_label: "邮箱",
          password_label: "密码",
          email_input_placeholder: "请输入邮箱",
          password_input_placeholder: "请输入密码",
          button_label: "登录",
          loading_button_label: "登录中...",
          social_provider_text: "使用 {{provider}} 登录",
          link_text: "已有账号？去登录",
        },
        sign_up: {
          email_label: "邮箱",
          password_label: "密码",
          email_input_placeholder: "请输入邮箱",
          password_input_placeholder: "请输入密码",
          button_label: "注册",
          loading_button_label: "注册中...",
          social_provider_text: "使用 {{provider}} 注册",
          link_text: "还没有账号？去注册",
          confirmation_text: "注册成功，请检查邮箱完成验证。",
        },
        forgotten_password: {
          email_label: "邮箱",
          password_label: "密码",
          email_input_placeholder: "请输入邮箱",
          button_label: "发送重置邮件",
          loading_button_label: "发送中...",
          link_text: "忘记密码？",
          confirmation_text: "重置邮件已发送，请检查邮箱。",
        },
        update_password: {
          password_label: "新密码",
          password_input_placeholder: "请输入新密码",
          button_label: "更新密码",
          loading_button_label: "更新中...",
          confirmation_text: "密码已更新。",
        },
      },
    }),
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl wc-auth-modal">
        <DialogHeader>
          <DialogTitle>登录或注册</DialogTitle>
          <DialogDescription>登录后可获得额度并使用分享奖励。</DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as AuthMode)}
        >
          <TabsList>
            <TabsTrigger value="magic_link">邮箱登录</TabsTrigger>
            <TabsTrigger value="password">密码登录</TabsTrigger>
          </TabsList>
          <TabsContent value="magic_link">
            <form
              onSubmit={handleMagicLink}
              className="wc-auth wc-magic-link-form"
            >
              <p className="wc-auth-hint">
                输入邮箱，我们将发送一个登录链接。新用户会自动注册。
              </p>
              <div className="wc-auth-field">
                <label className="wc-auth-label" htmlFor="magic-email">
                  邮箱
                </label>
                <input
                  id="magic-email"
                  type="email"
                  className="wc-auth-input"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="wc-auth-button wc-auth-submit"
                disabled={loading}
              >
                {loading ? "发送中..." : "发送登录链接"}
              </button>
            </form>
          </TabsContent>
          <TabsContent value="password">
            <Auth
              supabaseClient={supabase}
              appearance={appearance}
              localization={localization}
              providers={[]}
              view="sign_in"
              showLinks={true}
              redirectTo={redirectTo}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
