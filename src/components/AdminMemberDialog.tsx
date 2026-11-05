import { useCallback, useEffect, useState } from "react";
import { ExternalLink, ShieldCheck, PlayCircle, Loader2, CircleDashed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { COURSES, courseFor, dayLabel, type Day } from "@/lib/lessons";

export interface MemberBrief {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  submission_count: number;
  watched_count: number;
}

interface Row {
  lesson_key: string;
  doc_url: string;
  updated_at: string;
  ai_score: number | null;
  ai_feedback: string | null;
  grade_error: string | null;
  admin_score: number | null;
  admin_feedback: string | null;
}

/** Bảng xem bài của một học viên — chỉ Admin mở được. */
export function AdminMemberDialog({
  member,
  onClose,
  onSaved,
}: {
  member: MemberBrief | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [zaloName, setZaloName] = useState<string | null>(null);
  // Khoá của thành viên này: Skill hay Subagent
  const [DAYS, setDays] = useState<Day[]>(COURSES.skill.days);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!member) return;
    setLoading(true);

    const [subRes, profRes] = await Promise.all([
      supabase
        .from("submissions")
        .select(
          "lesson_key, doc_url, updated_at, ai_score, ai_feedback, grade_error, admin_score, admin_feedback",
        )
        .eq("user_id", member.id),
      supabase.from("profiles").select("zalo_name, onboarded_at").eq("id", member.id).maybeSingle(),
    ]);

    const map: Record<string, Row> = {};
    const s: Record<string, string> = {};
    const n: Record<string, string> = {};
    for (const r of subRes.data ?? []) {
      map[r.lesson_key] = r as Row;
      s[r.lesson_key] = r.admin_score !== null ? String(r.admin_score) : "";
      n[r.lesson_key] = r.admin_feedback ?? "";
    }
    setRows(map);
    setScores(s);
    setNotes(n);
    setZaloName(profRes.data?.zalo_name ?? null);
    setDays(courseFor(profRes.data?.onboarded_at).days);
    setLoading(false);
  }, [member]);

  useEffect(() => {
    if (member) load();
  }, [member, load]);

  const saveReview = async (dayKey: string) => {
    if (!member) return;
    const note = (notes[dayKey] ?? "").trim();
    if (!note) {
      toast.error("Chưa có nhận xét");
      return;
    }
    const raw = (scores[dayKey] ?? "").trim();
    const num = raw === "" ? null : Number(raw);
    if (num !== null && (Number.isNaN(num) || num < 0 || num > 10)) {
      toast.error("Điểm phải từ 0 đến 10");
      return;
    }

    setSavingKey(dayKey);
    const { error } = await supabase
      .from("submissions")
      .update({ admin_score: num, admin_feedback: note, admin_at: new Date().toISOString() })
      .eq("user_id", member.id)
      .eq("lesson_key", dayKey);
    setSavingKey(null);

    if (error) {
      toast.error("Không lưu được", { description: error.message });
      return;
    }
    toast.success("Đã lưu đánh giá");
    load();
    onSaved?.();
  };

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {member && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/30">
                  <AvatarImage src={member.avatar_url ?? undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary">
                    {member.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-left">{member.display_name}</DialogTitle>
                  <DialogDescription className="text-left">
                    {zaloName && <>Zalo: {zaloName} · </>}
                    <ShieldCheck className="inline h-3.5 w-3.5 text-gold" />{" "}
                    {member.submission_count} khiên · <PlayCircle className="inline h-3.5 w-3.5" />{" "}
                    {member.watched_count} video ·{" "}
                    <b className="text-gold">{member.total_points} điểm</b>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bài nộp...
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS.map((day) => {
                  const row = rows[day.key];
                  const d = day;

                  if (!row) {
                    return (
                      <div
                        key={day.key}
                        className="flex items-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/30 p-3 text-[14px] text-muted-foreground"
                      >
                        <CircleDashed className="h-4 w-4 shrink-0" />
                        <b className="text-foreground">{dayLabel(day.day)}</b> — chưa nộp bài
                      </div>
                    );
                  }

                  return (
                    <div key={day.key} className="rounded-xl border border-border bg-card/50 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[13px] font-black text-gold">
                          {dayLabel(day.day)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] text-muted-foreground">
                          {d?.assignment}
                        </span>
                        <a
                          href={row.doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gold/35 bg-gold/10 px-2.5 py-1 text-[13px] font-bold text-gold transition hover:bg-gold/20"
                        >
                          Mở bài <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      {/* Chatbot đã chấm gì */}
                      <div className="mt-2.5 rounded-lg border border-border/60 bg-background/40 p-2.5">
                        <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                          Nhận xét tự động
                        </div>
                        {row.grade_error ? (
                          <p className="mt-1 text-[14px] leading-relaxed text-red-700 dark:text-red-300">
                            Không chấm được: {row.grade_error}
                          </p>
                        ) : row.ai_feedback ? (
                          <p className="mt-1 text-[14px] leading-relaxed text-foreground">
                            <b className="text-gold">{row.ai_score}/10</b> — {row.ai_feedback}
                          </p>
                        ) : (
                          <p className="mt-1 text-[14px] text-muted-foreground">Chưa chấm.</p>
                        )}
                      </div>

                      {/* Admin sửa tay */}
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-[90px_1fr]">
                        <div>
                          <Label className="text-[12px] text-muted-foreground">Điểm</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={scores[day.key] ?? ""}
                            onChange={(e) =>
                              setScores((p) => ({ ...p, [day.key]: e.target.value }))
                            }
                            className="mt-1 h-9 bg-background/60"
                          />
                        </div>
                        <div>
                          <Label className="text-[12px] text-muted-foreground">
                            Đánh giá của bạn
                          </Label>
                          <Textarea
                            rows={2}
                            value={notes[day.key] ?? ""}
                            onChange={(e) => setNotes((p) => ({ ...p, [day.key]: e.target.value }))}
                            placeholder="Phong thấy bạn..."
                            className="mt-1 resize-none bg-background/60 text-[14px]"
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => saveReview(day.key)}
                          disabled={savingKey === day.key}
                          className="bg-gradient-gold text-gold-foreground hover:opacity-90"
                        >
                          {savingKey === day.key ? "Đang lưu..." : "Lưu đánh giá"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
