import { useCallback, useEffect, useState } from "react";
import { Crown, ShieldCheck, Flame, PlayCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminMemberDialog, type MemberBrief } from "@/components/AdminMemberDialog";
import { gradeBatch } from "@/fn/gradeBatch";
import { Loader2, Sparkles } from "lucide-react";
import { DAYS, courseFor } from "@/lib/lessons";
import leaderboardHero from "@/assets/leaderboard-hero.jpg";

interface LeaderRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  grade_sum: number;
  submission_count: number;
  watched_count: number;
  /** Điểm riêng của từng ngày, ví dụ { "ngay-1": 9.5 } */
  day_scores: Record<string, number> | null;
  /** Ngày hoàn tất đăng ký — quyết định học khoá Skill hay Subagent */
  onboarded_at?: string | null;
}

/** Điểm của từng ngày — chỉ hiện ngày đã có điểm. */
export function DayScores({ scores }: { scores: Record<string, number> | null }) {
  const items = DAYS.map((d) => [d.day, scores?.[d.key]] as const).filter(
    (x): x is readonly [number, number] => typeof x[1] === "number",
  );
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map(([day, score]) => (
        <span
          key={day}
          title={`Ngày ${day}: ${score}/10`}
          className="inline-flex items-center gap-1 rounded-md border border-gold/25 bg-gold/[0.07] px-1.5 py-px text-[12px] font-bold tabular-nums text-gold/90"
        >
          <span className="text-gold/55">N{day}</span>
          {score}
        </span>
      ))}
    </div>
  );
}

/** Dãy khiên vàng — mỗi khiên là một bài tập đã nộp. */
function Shields({ count, size = "sm" }: { count: number; size?: "sm" | "md" }) {
  if (count === 0) {
    return <span className="text-[12px] text-muted-foreground">Chưa có khiên</span>;
  }
  const MAX = size === "md" ? 5 : 8;
  const shown = Math.min(count, MAX);
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className="flex flex-wrap items-center justify-center gap-0.5">
      {Array.from({ length: shown }).map((_, i) => (
        <ShieldCheck
          key={i}
          className={`${cls} text-gold drop-shadow-[0_0_6px_oklch(0.78_0.16_75/0.6)]`}
        />
      ))}
      {count > MAX && (
        <span className="ml-0.5 text-[12px] font-bold text-gold">+{count - MAX}</span>
      )}
    </div>
  );
}

/** Các bậc thứ hạng — mỗi bậc gom các hạng tới mốc `max`. */
const TIERS = [
  { max: 10, label: "TOP 10", tone: "border-gold/40 bg-gold/10 text-gold" },
  { max: 20, label: "TOP 20", tone: "border-primary/40 bg-primary/10 text-primary-glow" },
  { max: 50, label: "TOP 50", tone: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { max: 100, label: "TOP 100", tone: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { max: 200, label: "TOP 200", tone: "border-border bg-muted/40 text-muted-foreground" },
] as const;

export function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useIsAdmin();
  const [viewing, setViewing] = useState<MemberBrief | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchInfo, setBatchInfo] = useState("");

  /** Chấm dồn các bài đang chờ. Gọi nhiều lượt nhỏ để không quá hạn giờ máy chủ. */
  const runBatch = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;

    setBatchRunning(true);
    let ok = 0;
    let bad = 0;
    try {
      for (let i = 0; i < 60; i++) {
        const r = (await gradeBatch({ data: { accessToken: token } })) as unknown as {
          graded: number;
          failed: number;
          remaining: number;
        };
        ok += r.graded;
        bad += r.failed;
        setBatchInfo(`Đã chấm ${ok} bài · còn ${r.remaining} bài`);
        if (r.remaining === 0 || r.graded + r.failed === 0) break;
      }
      toast.success(`Chấm xong ${ok} bài`, {
        description: bad > 0 ? `${bad} bài không mở được tài liệu` : undefined,
      });
    } catch (e) {
      toast.error("Chấm bị gián đoạn", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
    setBatchRunning(false);
    setBatchInfo("");
    load();
  };

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, total_points, grade_sum, submission_count, watched_count, day_scores, onboarded_at",
      )
      // Thứ hạng tính theo điểm chấm. Bằng điểm thì ai nộp nhiều ngày hơn
      // đứng trên; vẫn bằng thì ai nộp sớm hơn đứng trên.
      .order("grade_sum", { ascending: false })
      .order("submission_count", { ascending: false })
      .order("first_submit_at", { ascending: true, nullsFirst: false })
      .limit(200);
    // Ép kiểu qua unknown: cột day_scores mới thêm, file kiểu Supabase chưa cập nhật
    setRows((data ?? []) as unknown as LeaderRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myRank = user ? rows.findIndex((r) => r.id === user.id) + 1 : 0;

  const share = () => {
    const me = rows.find((r) => r.id === user?.id);
    if (!me) return;
    const text = `🛡️ Tôi đang xếp #${myRank} trên KOL AI SYSTEM với ${me.submission_count} khiên vàng! #KOLAISystem`;
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép xếp hạng!");
  };

  return (
    <div className="mx-auto max-w-[880px] space-y-4">
      {/* Ảnh bìa mỏng, tiêu đề đè lên để nhường chỗ cho bục vinh danh */}
      <div className="leaderboard-hero leaderboard-hero--slim h-[88px] md:h-[112px]">
        <img src={leaderboardHero} alt="" className="leaderboard-hero__img" loading="eager" />
        <div className="relative z-[2] flex h-full items-center justify-between gap-3 px-4 md:px-6">
          <div className="min-w-0">
            <div className="eyebrow">Bảng xếp hạng</div>
            <h1 className="mt-0.5 text-[22px] font-black leading-none md:text-[28px]">
              <span className="text-foreground">Vinh</span>
              <span className="text-gradient-primary"> danh</span>
            </h1>
            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              Xếp hạng theo điểm chấm bài
            </p>
          </div>

          {myRank > 0 && (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[13px] font-bold">
                Hạng <span className="text-gradient-primary">#{myRank}</span>
              </div>
              <Button onClick={share} variant="outline" size="sm" className="h-7 px-2 text-[13px]">
                <Share2 className="mr-1 h-3.5 w-3.5" /> Chia sẻ
              </Button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-gold/25 bg-gold/[0.06] px-3 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-gold" />
          <span className="min-w-0 flex-1 text-[14px] text-foreground">
            {batchInfo || "Chấm dồn toàn bộ bài đang chờ nhận xét"}
          </span>
          <Button
            size="sm"
            onClick={runBatch}
            disabled={batchRunning}
            className="h-8 shrink-0 bg-gradient-gold text-gold-foreground hover:opacity-90"
          >
            {batchRunning ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang chấm...
              </>
            ) : (
              "Chấm tất cả"
            )}
          </Button>
        </div>
      )}

      {/* Bục vinh danh — luôn hiện đủ 3 ô để thấy rõ cấu trúc 1-2-3 */}
      <div className="grid grid-cols-3 items-end gap-2 pt-1 sm:gap-3 md:gap-4">
        <PodiumCard
          row={top3[1]}
          rank={2}
          variant="purple"
          onOpen={isAdmin ? setViewing : undefined}
        />
        <PodiumCard
          row={top3[0]}
          rank={1}
          variant="gold"
          featured
          onOpen={isAdmin ? setViewing : undefined}
        />
        <PodiumCard
          row={top3[2]}
          rank={3}
          variant="ruby"
          onOpen={isAdmin ? setViewing : undefined}
        />
      </div>

      {loading && rows.length === 0 && (
        <Card className="border-border bg-card/60 p-10 text-center text-[16px] text-muted-foreground">
          Đang tải bảng xếp hạng...
        </Card>
      )}

      {!loading && rows.length === 0 && (
        <Card className="border-border bg-card/60 p-10 text-center">
          <div className="mb-3 text-4xl">🛡️</div>
          <div className="text-[16px] text-muted-foreground">
            Chưa có ai trên bảng — hãy là người đầu tiên nộp bài!
          </div>
        </Card>
      )}

      {/* Từ hạng 4 trở đi — chia theo bậc TOP 10 / 20 / 50 / 100 / 200 */}
      <div className="space-y-5">
        {TIERS.map((tier, ti) => {
          const from = ti === 0 ? 4 : TIERS[ti - 1].max + 1;
          const inTier = rest.filter((_, i) => {
            const rankNo = i + 4;
            return rankNo >= from && rankNo <= tier.max;
          });
          if (inTier.length === 0) return null;

          return (
            <section key={tier.label}>
              <div className="mb-2 flex items-center gap-2.5">
                <span
                  className={
                    "rounded-full border px-2.5 py-0.5 text-[12px] font-black tracking-[0.14em] " +
                    tier.tone
                  }
                >
                  {tier.label}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  hạng {from}–{tier.max}
                </span>
                <div className="h-px flex-1 bg-border/70" />
              </div>

              <div className="space-y-2">
                {inTier.map((r) => {
                  const rankNo = rest.indexOf(r) + 4;
                  return (
                    <Card
                      key={r.id}
                      onClick={() => isAdmin && setViewing(r)}
                      className={`member-row flex items-center gap-3 rounded-xl p-3 ${
                        r.id === user?.id ? "member-row-self" : ""
                      } ${isAdmin ? "cursor-pointer transition hover:border-gold/40" : ""}`}
                    >
                      <div className="w-8 bg-gradient-to-b from-foreground/80 to-foreground/40 bg-clip-text text-center text-sm font-black text-transparent">
                        #{rankNo}
                      </div>
                      <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                        <AvatarImage src={r.avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-[13px] font-bold text-primary">
                          {r.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[16px] font-bold text-foreground">
                          {r.display_name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <div className="flex items-center gap-0.5">
                            <Shields count={r.submission_count} />
                          </div>
                          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                            <PlayCircle className="h-2.5 w-2.5" />
                            {r.watched_count}/{courseFor(r.onboarded_at).lessons.length}
                          </span>
                        </div>
                        <div className="mt-1">
                          <DayScores scores={r.day_scores} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1 bg-gradient-to-r from-gold to-amber-300 bg-clip-text text-base font-black tabular-nums text-transparent drop-shadow-[0_0_8px_oklch(0.78_0.16_75/0.4)]">
                          {r.grade_sum}
                          <Flame className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                          Tổng điểm
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <AdminMemberDialog member={viewing} onClose={() => setViewing(null)} onSaved={load} />
    </div>
  );
}

function PodiumCard({
  row,
  rank,
  variant,
  featured,
  onOpen,
}: {
  row?: LeaderRow;
  rank: number;
  variant: "gold" | "purple" | "ruby";
  featured?: boolean;
  onOpen?: (row: LeaderRow) => void;
}) {
  if (!row) {
    return (
      <div className={featured ? "-mt-3 md:-mt-6" : ""}>
        <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/25 px-2">
          <div
            className={
              "flex aspect-square items-center justify-center rounded-full border border-dashed border-border text-muted-foreground " +
              (featured ? "w-[62%]" : "w-[56%]")
            }
          >
            <Crown className="h-5 w-5" />
          </div>
          <div className="mt-2 rounded-full bg-muted/60 px-2 py-0.5 text-[12px] font-black tracking-[0.14em] text-muted-foreground sm:text-[13px]">
            TOP {rank}
          </div>
          <div className="mt-1.5 text-[12px] text-muted-foreground sm:text-[13px]">Còn trống</div>
        </div>
      </div>
    );
  }

  const cfg = {
    gold: {
      frame: "legend-gold",
      bg: "podium-bg-gold",
      fire: "fire-gold",
      tag: "bg-gradient-to-r from-gold to-amber-500",
      ring: "ring-gold",
      accent: "oklch(0.85 0.18 80)",
      text: "text-gold",
      romanCol: "text-gold",
    },
    purple: {
      frame: "legend-purple",
      bg: "podium-bg-purple",
      fire: "fire-purple",
      tag: "bg-gradient-to-r from-primary to-primary-glow",
      ring: "ring-primary",
      accent: "oklch(0.7 0.25 295)",
      text: "text-primary-glow",
      romanCol: "text-primary-glow",
    },
    ruby: {
      frame: "legend-ruby",
      bg: "podium-bg-ruby",
      fire: "fire-ruby",
      tag: "bg-gradient-to-r from-red-500 to-rose-600",
      ring: "ring-red-400",
      accent: "oklch(0.72 0.24 25)",
      text: "text-red-600 dark:text-red-400",
      romanCol: "text-red-600 dark:text-red-400",
    },
  }[variant];

  const orbitId = `orbit-${variant}-${rank}`;
  const romanText = " ✦ I ✦ II ✦ III ✦ IV ✦ V ✦ VI ✦ VII ✦ VIII ✦ IX ✦ X ✦ XI ✦ XII ✦ ";

  return (
    <div
      className={`relative ${featured ? "-mt-3 md:-mt-8" : ""} ${onOpen ? "cursor-pointer" : ""}`}
      onClick={() => onOpen?.(row)}
    >
      <div className={`legend-frame aspect-[3/4] ${cfg.frame} ${cfg.bg} backdrop-blur-sm`}>
        <div className="legend-shine" />

        {featured && (
          <Crown
            className="absolute -top-3 left-1/2 z-10 h-6 w-6 -translate-x-1/2 text-gold drop-shadow-[0_0_14px_oklch(0.78_0.16_75/0.95)] sm:-top-4 sm:h-8 sm:w-8"
            fill="currentColor"
          />
        )}

        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <div
            className={`relative flex aspect-square items-center justify-center ${
              featured ? "w-[58%] sm:w-[68%] md:w-[74%]" : "w-[52%] sm:w-[62%] md:w-[68%]"
            }`}
          >
            <div className={`fire-ring ${cfg.fire}`} />

            <svg
              viewBox="0 0 100 100"
              className="halo-rotate-rev absolute inset-0 h-full w-full opacity-80"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke={cfg.accent}
                strokeWidth="0.8"
                strokeDasharray="2 4"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={cfg.accent}
                strokeWidth="0.4"
                strokeDasharray="1 3"
                opacity="0.6"
              />
            </svg>

            <svg
              viewBox="0 0 120 120"
              className={`halo-rotate absolute inset-0 h-full w-full ${cfg.romanCol}`}
              aria-hidden
            >
              <defs>
                <path id={orbitId} d="M 60,60 m -52,0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0" />
              </defs>
              <text
                fontSize="6.5"
                fontWeight="700"
                fill="currentColor"
                letterSpacing="2"
                style={{ fontFamily: "Cinzel, Cormorant Garamond, serif" }}
              >
                <textPath href={`#${orbitId}`} startOffset="0">
                  {romanText.repeat(3)}
                </textPath>
              </text>
            </svg>

            <svg
              viewBox="0 0 100 100"
              className="halo-rotate absolute inset-0 h-full w-full opacity-40"
              aria-hidden
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="4"
                  x2="50"
                  y2="14"
                  stroke={cfg.accent}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}
            </svg>

            <Avatar
              className={`relative z-[1] h-[62%] w-[62%] ring-4 ${cfg.ring} shadow-[0_0_30px_-4px_currentColor]`}
              style={{ color: cfg.accent }}
            >
              <AvatarImage src={row.avatar_url ?? undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-black text-foreground md:text-2xl">
                {row.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div
            className={`mt-1.5 rounded-full px-2 py-0.5 text-[12px] font-black tracking-[0.14em] text-background shadow-lg sm:mt-2.5 sm:px-2.5 sm:text-[13px] md:px-3 md:text-[14px] ${cfg.tag}`}
          >
            TOP {rank}
          </div>

          <div className="mt-1 w-full truncate px-0.5 text-center text-[12px] font-black text-foreground drop-shadow sm:mt-1.5 sm:text-[14px] md:text-[16px]">
            {row.display_name}
          </div>

          <div
            className={`mt-0.5 flex items-center gap-0.5 text-[14px] font-black tabular-nums sm:mt-1 sm:gap-1 sm:text-sm md:text-base ${cfg.text}`}
          >
            {row.grade_sum}
            <Flame className="h-3 w-3 text-orange-600 dark:text-orange-400 sm:h-3.5 sm:w-3.5" />
          </div>

          <div className="mt-1 hidden justify-center sm:flex">
            <DayScores scores={row.day_scores} />
          </div>

          <div className="mt-1.5 hidden sm:block">
            <Shields count={row.submission_count} />
          </div>
        </div>
      </div>
    </div>
  );
}
