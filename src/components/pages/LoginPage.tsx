import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) {
        // Provider bật nhưng chưa dán Client ID / Secret vào Supabase
        const missingCreds = /missing oauth secret|unsupported provider/i.test(error.message);
        toast.error("Đăng nhập Google thất bại", {
          description: missingCreds
            ? "Google chưa được cấu hình trong Supabase. Vào Authentication → Providers → Google và dán Client ID + Client Secret."
            : error.message,
        });
        setLoading(false);
      }
      // Thành công thì trình duyệt tự chuyển sang Google, không cần tắt loading.
    } catch (e) {
      toast.error("Lỗi đăng nhập Google");
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-6 lg:p-10"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.3 0.18 295 / 0.4), transparent 60%), linear-gradient(180deg, #0A0A0F 0%, #1A0A2E 100%)",
      }}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] rounded-3xl overflow-hidden border border-border/60 shadow-[0_40px_120px_-30px_oklch(0.55_0.24_295/0.5)] bg-card/40 backdrop-blur-2xl">
        {/* LEFT — Hero image (hidden on small mobile, shows from sm+) */}
        <div className="relative hidden sm:block min-h-[280px] lg:min-h-[680px] overflow-hidden">
          {/* Ảnh bìa = logo bộ não, đặt giữa trên nền tím đậm */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 45%, oklch(0.42 0.22 300 / 0.55), transparent 62%), linear-gradient(160deg, #12081F 0%, #1A0A2E 55%, #0A0A0F 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="relative w-[78%] max-w-[460px]">
              <div className="absolute inset-[12%] rounded-full bg-primary/35 blur-[80px]" />
              <img
                src={logo}
                alt="KOL AI System — Hệ thống huấn luyện cấp tốc của những chiến thần"
                className="relative w-full h-auto drop-shadow-[0_0_40px_oklch(0.65_0.25_310/0.7)]"
              />
            </div>
          </div>

          {/* Bottom caption */}
          <div className="absolute inset-x-0 bottom-0 p-6 lg:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-primary/30 mb-4">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[13px] font-semibold tracking-widest text-orange-700 dark:text-orange-300 uppercase"></span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-black leading-tight">
              <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,146,60,0.5)]">
                
              </span>
              <br />
              <span className="text-foreground"></span>
            </h2>
            <p className="mt-3 text-sm lg:text-base text-foreground max-w-md">
              
            </p>
          </div>
        </div>

        {/* RIGHT — Auth (Google only) */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-card/60 backdrop-blur-2xl">
          <div className="text-center mb-6">
            <div className="inline-block relative mb-4">
              <div className="absolute inset-0 bg-primary/40 blur-3xl rounded-full" />
              <img src={logo} alt="KOL AI SYSTEM" width={72} height={72} className="relative drop-shadow-[0_0_30px_oklch(0.6_0.24_295/0.8)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
              <span className="text-foreground">KOL AI </span>
              <span className="text-gradient-primary">SYSTEM</span>
            </h1>
            <p className="text-[13px] md:text-sm font-medium text-foreground">Hệ thống huấn luyện cấp tốc của những chiến thần</p>
          </div>

          <Button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 rounded-xl h-12 font-medium shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Đang chuyển hướng..." : "Đăng nhập bằng Google"}
          </Button>

          <p className="text-center mt-5 text-[13px] text-muted-foreground leading-relaxed">
            Chỉ cần tài khoản Google — không cần mật khẩu, không cần đăng ký.
            <br />
            Lần đầu đăng nhập, hệ thống tự tạo hồ sơ cho bạn.
          </p>

          <p className="text-center mt-6 text-[12px] text-muted-foreground leading-relaxed">
            Khi đăng nhập, bạn đồng ý với{" "}
            <Link to="/terms" className="text-primary/90 hover:text-primary hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link to="/privacy" className="text-primary/90 hover:text-primary hover:underline">
              Chính sách bảo mật
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
