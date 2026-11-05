import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Flame, ArrowRight, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { currentDeadline, dayLabel } from "@/lib/lessons";
import { useCourse } from "@/hooks/useCourse";
import { PlayCircle } from "lucide-react";
import { CoGiMoi } from "@/components/CoGiMoi";

/** Huy hiệu tính thẳng từ tiến độ — không cần bảng riêng, không bao giờ lệch số liệu. */
interface BadgeDef {
  key: string;
  icon: string;
  name: string;
  earned: (c: { subs: number; watched: number; rank: number; total: number }) => boolean;
}

const BADGES: BadgeDef[] = [
  { key: "first", icon: "🛡️", name: "Khiên đầu tiên", earned: (c) => c.subs >= 1 },
  {
    key: "watch",
    icon: "🎬",
    name: "Chăm chỉ",
    earned: (c) => c.watched >= 1 && c.watched >= c.total,
  },
  {
    key: "part",
    icon: "📚",
    name: "Xong một phần",
    earned: (c) => c.subs >= 1,
  },
  { key: "podium", icon: "⭐", name: "Top 3", earned: (c) => c.rank >= 1 && c.rank <= 3 },
  { key: "all", icon: "👑", name: "Trọn vẹn", earned: (c) => c.total > 0 && c.subs >= c.total },
];

export function HomePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { days: DAYS, lessons: ALL_LESSONS, intro: COURSE_INTRO } = useCourse();
  const [rank, setRank] = useState(0);

  const loadRank = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      // Cùng tiêu chí với bảng Vinh danh: điểm chấm trước, rồi số bài, rồi nộp sớm
      .order("grade_sum", { ascending: false })
      .order("submission_count", { ascending: false })
      .order("first_submit_at", { ascending: true, nullsFirst: false })
      .limit(100);
    const i = (data ?? []).findIndex((r) => r.id === user.id);
    setRank(i >= 0 ? i + 1 : 0);
  }, [user]);

  useEffect(() => {
    loadRank();
  }, [loadRank]);

  const subs = profile?.submission_count ?? 0;
  const watched = profile?.watched_count ?? 0;
  const points = profile?.grade_sum ?? 0;
  const total = DAYS.length;
  const totalVideos = ALL_LESSONS.length;
  const percent =
    total === 0 ? 0 : Math.round(((watched / Math.max(1, totalVideos) + subs / total) / 2) * 100);
  const started = watched + subs > 0;

  const ctx = { subs, watched, rank, total };
  const next = currentDeadline(new Date(), DAYS);

  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      {/* ══ 1. LỜI CHÀO GỌN ══ */}
      <div className="greet-bar">
        <div className="min-w-0">
          <h1 className="text-[19px] font-black leading-tight md:text-[23px]">
            Chào, <span className="text-gradient-gold">{profile?.display_name ?? "bạn"}</span>
          </h1>
          {next && (
            <p className="mt-1 truncate text-[14px] text-muted-foreground">
              Sắp tới hạn: <b className="text-gold">{dayLabel(next.day.day)}</b> —{" "}
              {next.day.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[13px] font-bold text-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> {subs}/{total}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[13px] font-bold text-primary-glow">
            <Flame className="h-3.5 w-3.5" /> {points} điểm
          </span>
          {rank > 0 && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[13px] font-bold text-primary-glow">
              Hạng #{rank}
            </span>
          )}
          <div className="flex w-24 items-center gap-1.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-amber-300 transition-[width] duration-700"
                style={{ width: percent + "%" }}
              />
            </div>
            <span className="shrink-0 text-[12px] font-bold text-gold">{percent}%</span>
          </div>
        </div>
      </div>

      {/* Đã nộp bài nhưng chưa xem hết video — nhắc nhẹ */}
      {subs > 0 && watched < totalVideos && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-gold/30 bg-gold/[0.07] px-4 py-3">
          <PlayCircle className="h-4 w-4 shrink-0 text-gold" />
          <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-foreground">
            Bạn đã nộp bài nhưng mới xem{" "}
            <b className="text-gold">
              {watched}/{totalVideos}
            </b>{" "}
            video. Xem hết để nắm chắc kiến thức nhé.
          </p>
          <Link
            to="/bai-giang"
            className="shrink-0 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-[13px] font-bold text-gold transition hover:bg-gold/20"
          >
            Xem bài giảng
          </Link>
        </div>
      )}

      {/* ══ 2. VIDEO TỔNG QUAN + LỜI KÊU GỌI ══ */}
      <section className="intro-panel">
        <div className="mb-4 text-center">
          <div className="eyebrow">{COURSE_INTRO.eyebrow}</div>
          <h2 className="mt-2 text-[22px] font-black md:text-[30px]">
            <span className="text-gradient-gold">{COURSE_INTRO.title}</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
            {COURSE_INTRO.description}
          </p>
        </div>

        <div className="overflow-hidden video-frame rounded-2xl border border-gold/25 shadow-[0_24px_70px_-30px_oklch(0.78_0.16_75/0.55)]">
          <div className="relative aspect-video w-full">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={
                "https://www.youtube-nocookie.com/embed/" +
                COURSE_INTRO.youtubeId +
                "?rel=0&modestbranding=1"
              }
              title={COURSE_INTRO.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <Link to="/bai-giang" className="cta-start group">
            <Sparkles className="h-[18px] w-[18px]" />
            {started ? "Tiếp tục hành trình" : "Bắt Đầu Hành Trình"}
            <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="text-[13px] text-muted-foreground">
            {totalVideos} bài giảng · {total} bài tập · leo bảng Vinh danh
          </p>
          <Link
            to="/bai-tap"
            className="text-[13px] font-bold text-gold underline-offset-4 transition hover:underline"
          >
            Xem luật tính khiên và điểm
          </Link>
        </div>
      </section>

      <CoGiMoi />

      {/* ══ 3. HUY HIỆU ══ */}
      <section>
        <h2 className="eyebrow mb-2.5">Huy hiệu</h2>
        <div className="grid grid-cols-5 gap-2">
          {BADGES.map((b) => {
            const got = b.earned(ctx);
            return (
              <Card
                key={b.key}
                title={b.name}
                className={
                  "flex flex-col items-center px-1 py-2.5 text-center transition " +
                  (got ? "border-gold/35 bg-gold/[0.07]" : "border-border/60 bg-card/40 opacity-80")
                }
              >
                <div className="relative text-xl sm:text-2xl">
                  <span className={got ? "" : "grayscale"}>{b.icon}</span>
                  {!got && (
                    <Lock className="absolute -bottom-0.5 -right-1.5 h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={
                    "mt-1 text-[12px] font-bold leading-tight sm:text-[13px] " +
                    (got ? "text-gold" : "text-muted-foreground")
                  }
                >
                  {b.name}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
