import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ExternalLink, Check, X, CircleDashed, Lock, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useReviewer } from "@/hooks/useReviewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { LuatChoi } from "@/components/LuatChoi";
import {
  ReviewComment,
  ReviewPending,
  ReviewLoading,
  ReviewError,
  AdminReviewSlot,
} from "@/components/ReviewComment";
import { toast } from "sonner";
import { POINTS_PER_SUBMISSION, dayLabel, submitLockState } from "@/lib/lessons";
import { useCourse } from "@/hooks/useCourse";
import { GRADING_DELAY_MS, type GradeOutcome } from "@/lib/grading";
import { gradeSubmission } from "@/fn/gradeSubmission";

interface Submission {
  lesson_key: string;
  doc_url: string;
  created_at: string;
  updated_at: string;
  ai_score: number | null;
  ai_feedback: string | null;
  graded_at: string | null;
  grade_error: string | null;
  admin_score: number | null;
  admin_feedback: string | null;
}

/** Ngày theo lịch Việt Nam, dạng "2026-08-31" — dùng để đếm khiên. */
function ngayVN(t: string | number | Date): string {
  return new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function SubmissionsPage() {
  const { days: DAYS } = useCourse();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const reviewerProfile = useReviewer();

  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [grading, setGrading] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [watched, setWatched] = useState<Set<string>>(new Set());

  // Hộp thoại Admin chấm trực tiếp
  const [editing, setEditing] = useState<Submission | null>(null);
  const [adminScore, setAdminScore] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: w } = await supabase
      .from("watched_videos")
      .select("video_key")
      .eq("user_id", user.id);
    setWatched(new Set((w ?? []).map((r) => r.video_key)));

    const { data } = await supabase
      .from("submissions")
      .select(
        "lesson_key, doc_url, created_at, updated_at, ai_score, ai_feedback, graded_at, grade_error, admin_score, admin_feedback",
      )
      .eq("user_id", user.id);

    const map: Record<string, Submission> = {};
    const d: Record<string, string> = {};
    for (const row of data ?? []) {
      map[row.lesson_key] = row as Submission;
      d[row.lesson_key] = row.doc_url;
    }
    setSubs(map);
    setDrafts((prev) => ({ ...d, ...prev }));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Gọi chấm bài — gửi kèm token của chính học viên. */
  const runGrading = useCallback(async (dayKey: string): Promise<GradeOutcome | null> => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return null;
    // Lớp RPC của TanStack không suy ra được kiểu trả về, nên khai báo tường minh
    return (await gradeSubmission({
      data: { lessonKey: dayKey, accessToken: token },
    })) as unknown as GradeOutcome;
  }, []);

  // Nhịp 20 giây để đếm ngược tới lúc Phong phản hồi
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(id);
  }, []);

  // Bài nộp quá 5 phút mà chưa chấm thì gọi chấm
  useEffect(() => {
    const due = Object.values(subs).filter(
      (r) =>
        !r.graded_at &&
        !grading.has(r.lesson_key) &&
        now - new Date(r.updated_at).getTime() >= GRADING_DELAY_MS,
    );
    if (due.length === 0) return;

    for (const row of due) {
      setGrading((prev) => new Set(prev).add(row.lesson_key));
      runGrading(row.lesson_key)
        .then(() => load())
        .catch(() => {
          /* lỗi mạng — lần tải trang sau sẽ thử lại */
        })
        .finally(() =>
          setGrading((prev) => {
            const n = new Set(prev);
            n.delete(row.lesson_key);
            return n;
          }),
        );
    }
  }, [subs, now, grading, load, runGrading]);

  const save = async (dayKey: string) => {
    if (!user) return;
    const url = (drafts[dayKey] ?? "").trim();

    if (!url) {
      toast.error("Chưa có link");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Link không hợp lệ", { description: "Phải bắt đầu bằng https://" });
      return;
    }

    setBusy(dayKey);
    const { error } = await supabase.from("submissions").upsert(
      {
        user_id: user.id,
        lesson_key: dayKey,
        doc_url: url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_key" },
    );
    setBusy(null);

    if (error) {
      toast.error("Nộp bài thất bại", { description: error.message });
      return;
    }

    if (subs[dayKey]) {
      toast.success("Đã cập nhật link");
    } else {
      // Khiên đếm theo NGÀY nộp, không phải số bài. Nộp bài thứ hai trong cùng
      // một ngày thì khiên không tăng — phải nói rõ ngay lúc này.
      const homNay = ngayVN(Date.now());
      const daNopHomNay = Object.values(subs).some((r) => ngayVN(r.created_at) === homNay);

      if (daNopHomNay) {
        toast.success("Nộp bài thành công! +" + POINTS_PER_SUBMISSION + " điểm", {
          description:
            "Hôm nay bạn đã nộp một bài rồi nên khiên vàng không cộng thêm — mỗi ngày chỉ tính một khiên. Điểm chấm của bài này vẫn được cộng đủ vào tổng điểm và thứ hạng.",
          duration: 14000,
        });
      } else {
        toast.success("Nộp bài thành công! +" + POINTS_PER_SUBMISSION + " điểm và 1 khiên vàng");
      }
    }
    load();

    // Chấm ngay tại chỗ. Nhận xét vẫn chỉ hiện sau 5 phút,
    // nhưng không phụ thuộc học viên có mở lại trang hay không.
    setGrading((prev) => new Set(prev).add(dayKey));
    runGrading(dayKey)
      .then((res) => {
        if (res && "error" in res && res.error) {
          toast.error("Chưa đọc được bài của bạn", {
            description: res.error,
            duration: 12000,
          });
        }
      })
      .catch(() => {
        /* lỗi mạng — vòng lặp nền sẽ thử lại */
      })
      .finally(() => {
        setGrading((prev) => {
          const n = new Set(prev);
          n.delete(dayKey);
          return n;
        });
        load();
      });
  };

  /**
   * Chấm lại sau khi học viên đã sửa quyền tài liệu.
   * Chỉ áp dụng cho bài BỊ LỖI QUYỀN. Bài đã có điểm thì giữ nguyên vĩnh viễn —
   * không ai chấm lại được, kể cả học viên tự bấm.
   */
  const retryGrading = async (dayKey: string) => {
    if (!user) return;

    // Còn cờ lỗi nghĩa là Phong chưa đọc được bài thật — điểm 7 chỉ là mức tạm ghi nhận,
    // nên vẫn cho chấm lại. Chỉ khoá khi đã chấm thành công (không còn lỗi).
    const current = subs[dayKey];
    if (!current || !current.grade_error) {
      toast.info("Bài này đã được chấm", {
        description: "Điểm và nhận xét được giữ nguyên, không chấm lại.",
      });
      return;
    }

    setGrading((prev) => new Set(prev).add(dayKey));
    // Xoá dấu đã chấm để hàm chấm chạy lại từ đầu
    await supabase
      .from("submissions")
      .update({ graded_at: null, grade_error: null })
      .eq("user_id", user.id)
      .eq("lesson_key", dayKey);

    const res = await runGrading(dayKey).catch(() => null);
    setGrading((prev) => {
      const n = new Set(prev);
      n.delete(dayKey);
      return n;
    });

    if (res && "error" in res && res.error) {
      toast.error("Vẫn chưa đọc được", { description: res.error, duration: 12000 });
    } else if (res && "score" in res) {
      toast.success("Đã chấm xong!");
    }
    load();
  };

  const remove = async (dayKey: string) => {
    if (!user) return;
    setBusy(dayKey);
    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_key", dayKey);
    setBusy(null);

    if (error) {
      toast.error("Không xoá được", { description: error.message });
      return;
    }
    setDrafts((prev) => ({ ...prev, [dayKey]: "" }));
    toast.success("Đã xoá bài nộp");
    load();
  };

  const openAdminEditor = (sub: Submission) => {
    setEditing(sub);
    setAdminScore(sub.admin_score !== null ? String(sub.admin_score) : "");
    setAdminNote(sub.admin_feedback ?? "");
  };

  const saveAdminReview = async () => {
    if (!editing || !user) return;
    const note = adminNote.trim();
    if (!note) {
      toast.error("Chưa có nhận xét");
      return;
    }
    const num = adminScore.trim() === "" ? null : Number(adminScore);
    if (num !== null && (Number.isNaN(num) || num < 0 || num > 10)) {
      toast.error("Điểm phải từ 0 đến 10");
      return;
    }

    setSavingAdmin(true);
    const { error } = await supabase
      .from("submissions")
      .update({ admin_score: num, admin_feedback: note, admin_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("lesson_key", editing.lesson_key);
    setSavingAdmin(false);

    if (error) {
      toast.error("Không lưu được", { description: error.message });
      return;
    }
    toast.success("Đã lưu đánh giá");
    setEditing(null);
    load();
  };

  const submittedKeys = new Set(Object.keys(subs));
  // Nộp bài là có khiên ngay. Chấm xong chỉ đóng thêm dấu "hợp lệ".
  const submitted = DAYS.filter((d) => subs[d.key]).length;
  const done = submitted;

  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeader
        eyebrow="Bài tập"
        title="Nộp"
        accent="bài tập"
        description="Mỗi ngày một bài tập. Dán link Google Docs, nộp rồi vẫn sửa được."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">
                {submitted}
                <span className="font-medium text-muted-foreground">/{DAYS.length} đã nộp</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span className="text-sm font-bold text-gold">
                {done}
                <span className="font-medium text-gold/60">/{DAYS.length} khiên</span>
              </span>
            </div>
          </div>
        }
      />

      <LuatChoi />

      <div className="space-y-3">
        {DAYS.map((day) => {
          const existing = subs[day.key];
          const draft = drafts[day.key] ?? "";
          const dirty = draft.trim() !== (existing?.doc_url ?? "");
          const working = busy === day.key;
          const lock = submitLockState(day, submittedKeys, watched, new Date(), DAYS);
          const open = !lock.locked;
          const watchedInDay = day.lessons.filter((l) => watched.has(l.key)).length;
          const missingVideo = watchedInDay < day.lessons.length;

          // Mỗi ngày chỉ một khiên. Khiên thuộc về bài nộp SỚM NHẤT trong ngày hôm đó,
          // các bài nộp sau trong cùng ngày vẫn tính điểm nhưng không thêm khiên.
          const khongTinhKhien =
            !!existing &&
            Object.values(subs).some(
              (r) =>
                r.lesson_key !== day.key &&
                ngayVN(r.created_at) === ngayVN(existing.created_at) &&
                new Date(r.created_at) < new Date(existing.created_at),
            );

          return (
            <Card
              key={day.key}
              id={day.key}
              className={
                "scroll-mt-20 p-4 transition-colors " +
                (!open
                  ? "border-border/60 bg-card/40"
                  : existing
                    ? "border-gold/25 bg-gold/[0.05]"
                    : "border-border/70 bg-card/50")
              }
            >
              {/* Đầu thẻ — Ngày N + trạng thái */}
              <div className="flex items-center gap-2">
                <span
                  className={
                    "shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-black " +
                    (existing ? "bg-gold/20 text-gold" : "bg-primary/15 text-primary")
                  }
                >
                  {dayLabel(day.day)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {day.assignment}
                </span>
                {existing ? (
                  <a
                    href={existing.doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở bài đã nộp"
                    className="shrink-0 text-gold transition hover:opacity-70"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>

              {/* Yêu cầu của bài */}
              <ul className="mt-2.5 space-y-1">
                {day.deliverables.map((d, i) => (
                  <li key={d} className="flex gap-2 text-[14px] leading-relaxed text-foreground">
                    <span className="mt-px shrink-0 font-bold text-muted-foreground">{i + 1}.</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>

              {/* Ô nộp — hoặc khoá nếu chưa tới ngày */}
              {lock.locked ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-background/30 px-3 py-2 text-[14px] text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {lock.kind === "date"
                    ? `Mở vào ngày ${lock.openDate}`
                    : lock.kind === "prev"
                      ? `Nộp bài ${dayLabel(lock.needDay)} trước đã`
                      : `Xem hết video đã — mới xong ${lock.done}/${lock.total} bài`}
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://docs.google.com/..."
                    value={draft}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [day.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && dirty && save(day.key)}
                    className="h-9 flex-1 bg-background/60 text-sm"
                  />

                  <Button
                    size="sm"
                    onClick={() => save(day.key)}
                    disabled={working || !dirty}
                    className="h-9 shrink-0 bg-gradient-primary px-3 hover:opacity-90"
                  >
                    <Check className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">{existing ? "Cập nhật" : "Nộp"}</span>
                  </Button>

                  {existing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(day.key)}
                      disabled={working}
                      title="Xoá bài nộp"
                      className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Nộp bài thứ hai trong cùng một ngày — nói rõ vì sao khiên không tăng */}
              {khongTinhKhien && (
                <div className="mt-3 flex gap-2.5 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-muted-foreground">
                    Bài này nộp cùng ngày với một bài khác nên <b>không cộng thêm khiên</b> — mỗi ngày
                    chỉ tính một khiên. Điểm chấm vẫn được cộng đủ vào tổng điểm và thứ hạng của bạn.
                  </p>
                </div>
              )}

              {/* Đã nộp nhưng chưa xem hết video — nhắc nhẹ, không xoá bài */}
              {existing && missingVideo && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-gold/30 bg-gold/[0.07] px-3 py-2.5">
                  <PlayCircle className="h-4 w-4 shrink-0 text-gold" />
                  <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-foreground">
                    Bạn mới xem{" "}
                    <b className="text-gold">
                      {watchedInDay}/{day.lessons.length}
                    </b>{" "}
                    video của ngày này. Xem hết để nắm chắc bài nhé.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="h-8 shrink-0 border-gold/40 text-gold hover:bg-gold/15"
                  >
                    <Link to="/bai-giang">Xem bài giảng</Link>
                  </Button>
                </div>
              )}

              {existing && (
                <ReviewBlock
                  sub={existing}
                  isGrading={grading.has(day.key)}
                  now={now}
                  isAdmin={isAdmin}
                  onRetry={() => retryGrading(day.key)}
                  onAdminEdit={() => openAdminEditor(existing)}
                  reviewer={
                    reviewerProfile
                      ? { name: reviewerProfile.name, avatarUrl: reviewerProfile.avatarUrl }
                      : undefined
                  }
                />
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chấm trực tiếp</DialogTitle>
            <DialogDescription>
              Đánh giá này hiện riêng một khối, không đè lên nhận xét tự động.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="admin-score" className="text-[14px] font-medium">
                Điểm{" "}
                <span className="text-muted-foreground">(0–10, bỏ trống nếu chỉ nhận xét)</span>
              </Label>
              <Input
                id="admin-score"
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={adminScore}
                onChange={(e) => setAdminScore(e.target.value)}
                className="mt-1.5 bg-background/60"
              />
            </div>
            <div>
              <Label htmlFor="admin-note" className="text-[14px] font-medium">
                Nhận xét
              </Label>
              <Textarea
                id="admin-note"
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Phong thấy bạn..."
                className="mt-1.5 resize-none bg-background/60"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Huỷ
            </Button>
            <Button
              onClick={saveAdminReview}
              disabled={savingAdmin}
              className="bg-gradient-gold text-gold-foreground hover:opacity-90"
            >
              {savingAdmin ? "Đang lưu..." : "Lưu đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-5 text-center text-[13px] leading-relaxed text-muted-foreground">
        Nhớ mở quyền <strong className="text-foreground">“Bất kỳ ai có đường liên kết”</strong>{" "}
        trong Google Docs.
      </p>
    </div>
  );
}

/** Chọn đúng trạng thái nhận xét để hiện dưới mỗi bài nộp. */
function ReviewBlock({
  sub,
  isGrading,
  now,
  isAdmin,
  onRetry,
  onAdminEdit,
  reviewer,
}: {
  sub: Submission;
  isGrading: boolean;
  now: number;
  isAdmin?: boolean;
  onRetry?: () => void;
  onAdminEdit?: () => void;
  reviewer?: { name: string; avatarUrl: string | null };
}) {
  const elapsed = now - new Date(sub.updated_at).getTime();
  const minutesLeft = Math.max(0, Math.ceil((GRADING_DELAY_MS - elapsed) / 60_000));

  return (
    <>
      {/* Khối 1 — nhận xét tự động */}
      {sub.grade_error ? (
        <ReviewError message={sub.grade_error} onRetry={onRetry} />
      ) : sub.ai_feedback ? (
        <ReviewComment score={sub.ai_score} feedback={sub.ai_feedback} reviewer={reviewer} />
      ) : isGrading ? (
        <ReviewLoading reviewer={reviewer} />
      ) : (
        <ReviewPending minutesLeft={minutesLeft} reviewer={reviewer} />
      )}

      {/* Khối 2 — chỗ dành riêng cho Admin chấm trực tiếp */}
      <AdminReviewSlot
        score={sub.admin_score}
        feedback={sub.admin_feedback}
        reviewer={reviewer}
        isAdmin={isAdmin}
        onEdit={onAdminEdit}
      />
    </>
  );
}
