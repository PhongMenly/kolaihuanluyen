import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Circle,
  ClipboardList,
  FileText,
  CalendarClock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { SoDoBaiHoc } from "@/components/SoDoBaiHoc";
import { toast } from "sonner";
import { useCourse } from "@/hooks/useCourse";
import {
  POINTS_PER_VIDEO,
  POINTS_PER_SUBMISSION,
  getDayDeadline,
  dayLabel,
  dayLockState as dayLockStateTheoKhoa,
  dayOfLesson as dayOfLessonTheoKhoa,
  type Day,
  type Lesson,
  type LockReason,
  loiChucNgauNhien,
} from "@/lib/lessons";

export function VideosPage() {
  const { user } = useAuth();
  // Khoá của người đang học: Skill (vào trước 05/11/2026) hay Subagent
  const { days: DAYS, lessons: ALL_LESSONS } = useCourse();
  const dayOfLesson = (key: string) => dayOfLessonTheoKhoa(key, DAYS);
  const dayLockState = (day: number, subs: Set<string>) =>
    dayLockStateTheoKhoa(day, subs, new Date(), DAYS);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(ALL_LESSONS[0]?.key ?? "");

  // Hồ sơ nạp xong mới biết khoá — bài đang chọn không thuộc khoá thì về bài đầu
  useEffect(() => {
    if (!ALL_LESSONS.some((l) => l.key === selected)) setSelected(ALL_LESSONS[0]?.key ?? "");
  }, [ALL_LESSONS, selected]);

  const load = useCallback(async () => {
    if (!user) return;
    const [w, s] = await Promise.all([
      supabase.from("watched_videos").select("video_key").eq("user_id", user.id),
      supabase.from("submissions").select("lesson_key").eq("user_id", user.id),
    ]);
    setWatched(new Set((w.data ?? []).map((r) => r.video_key)));
    setSubmitted(new Set((s.data ?? []).map((r) => r.lesson_key)));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Đánh dấu đã xem (không bỏ đánh dấu). Trả về true nếu ghi nhận thành công. */
  const markWatched = async (lesson: Lesson) => {
    if (!user) return false;
    if (watched.has(lesson.key)) return true;
    setBusy(lesson.key);
    const { error } = await supabase
      .from("watched_videos")
      .insert({ user_id: user.id, video_key: lesson.key });
    setBusy(null);
    if (error) {
      toast.error("Không ghi nhận được", { description: error.message });
      return false;
    }
    setWatched((prev) => new Set(prev).add(lesson.key));
    toast.success("+" + POINTS_PER_VIDEO + " điểm", { description: lesson.title });
    return true;
  };

  /** Hoàn thành bài hiện tại rồi sang bài kế tiếp. */
  /** Nhảy tới bài đầu tiên của ngày kế tiếp. */
  const sangNgayKe = (day: Day) => {
    const sau = DAYS.find((d) => d.day === day.day + 1);
    if (!sau) return;
    setSelected(sau.lessons[0].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completeAndNext = async (lesson: Lesson) => {
    const ok = await markWatched(lesson);
    if (!ok) return;

    const day = dayOfLesson(lesson.key);
    if (day) toast.success(loiChucNgauNhien(day), { duration: 6000 });

    // Bài cuối của ngày thì DỪNG LẠI tại chỗ để hiện dấu hoàn tất,
    // không nhảy sang ngày sau. Khối bài tập ngay dưới đã có nút nộp.
    const laBaiCuoiNgay = day ? day.lessons[day.lessons.length - 1].key === lesson.key : false;
    if (laBaiCuoiNgay) return;

    const i = ALL_LESSONS.findIndex((l) => l.key === lesson.key);
    const nextLesson = ALL_LESSONS[i + 1];
    if (nextLesson) {
      setSelected(nextLesson.key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const total = ALL_LESSONS.length;
  const doneVideos = ALL_LESSONS.filter((l) => watched.has(l.key)).length;
  const doneSubs = ALL_LESSONS.filter((l) => submitted.has(l.key)).length;
  const percent = total === 0 ? 0 : Math.round(((doneVideos + doneSubs) / (total * 2)) * 100);

  const current = useMemo(
    () => ALL_LESSONS.find((l) => l.key === selected) ?? null,
    [ALL_LESSONS, selected],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
      {/* ══ CỘT TRÁI — MỤC LỤC BÀI HỌC ══ */}
      <aside className="lg:self-stretch">
        <div className="flex flex-col rounded-2xl border border-border/70 bg-card/45 p-2.5 lg:h-full lg:overflow-y-auto">
          <div className="px-2 pb-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Nội dung</span>
              <span className="text-[12px] font-bold text-primary">{percent}%</span>
            </div>
            <Progress value={percent} className="mt-1.5 h-1" />
          </div>

          {/* Điện thoại: cuộn ngang · Máy tính: xếp dọc */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0">
            {DAYS.map((day) => {
              const open = !dayLockState(day.day, submitted).locked;
              return (
                <div key={day.key} className="contents lg:block">
                  <div className="hidden items-center gap-1.5 px-2 pb-1.5 pt-3.5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground lg:flex">
                    {dayLabel(day.day)}
                    {!open && <Lock className="h-3 w-3" />}
                    {submitted.has(day.key) && <ShieldCheck className="h-3 w-3 text-gold" />}
                  </div>
                  {day.lessons.map((lesson) => (
                    <RailItem
                      key={lesson.key}
                      active={selected === lesson.key}
                      onClick={() => {
                        setSelected(lesson.key);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      icon={
                        !open ? (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : watched.has(lesson.key) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 opacity-40" />
                        )
                      }
                      label={lesson.code}
                      sub={lesson.title}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ══ CỘT PHẢI — NỘI DUNG ══ */}
      <div className="min-w-0">
        {current && (
          <LessonView
            lesson={current}
            day={dayOfLesson(current.key)}
            lock={dayLockState(dayOfLesson(current.key)?.day ?? 1, submitted)}
            nextLesson={ALL_LESSONS[ALL_LESSONS.findIndex((l) => l.key === current.key) + 1]}
            isWatched={watched.has(current.key)}
            isSubmitted={submitted.has(current.key)}
            busy={busy === current.key}
            onCompleteNext={() => completeAndNext(current)}
            watchedKeys={watched}
            ngaySau={DAYS.find((d) => d.day === (dayOfLesson(current.key)?.day ?? 0) + 1)}
            ngaySauBiKhoa={(() => {
              const sau = DAYS.find((d) => d.day === (dayOfLesson(current.key)?.day ?? 0) + 1);
              return sau ? dayLockState(sau.day, submitted).locked : true;
            })()}
            onSangNgayKe={() => {
              const d = dayOfLesson(current.key);
              if (d) sangNgayKe(d);
            }}
          />
        )}
      </div>
    </div>
  );
}

function RailItem({
  active,
  onClick,
  icon,
  label,
  sub,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  badge?: boolean;
}) {
  const base =
    "group flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all lg:w-full lg:shrink";
  const tone = active
    ? "bg-gradient-primary text-primary-foreground shadow-[0_2px_14px_-4px_oklch(0.55_0.24_295/0.8)]"
    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground";

  return (
    <button onClick={onClick} className={base + " " + tone}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-bold leading-none">{label}</span>
          {badge && <ShieldCheck className="h-3 w-3 shrink-0 text-gold" />}
        </span>
        {sub && (
          <span
            className={
              "mt-1 hidden truncate text-[13px] leading-tight lg:block " +
              (active ? "" : "text-muted-foreground")
            }
          >
            {sub}
          </span>
        )}
      </span>
      {active && <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 lg:block" />}
    </button>
  );
}

function LessonView({
  lesson,
  day,
  lock,
  nextLesson,
  isWatched,
  isSubmitted,
  busy,
  onCompleteNext,
  watchedKeys,
  ngaySau,
  ngaySauBiKhoa,
  onSangNgayKe,
}: {
  lesson: Lesson;
  day?: Day;
  lock: LockReason;
  nextLesson?: Lesson;
  isWatched: boolean;
  isSubmitted: boolean;
  busy: boolean;
  onCompleteNext: () => void;
  watchedKeys: Set<string>;
  ngaySau?: Day;
  ngaySauBiKhoa: boolean;
  onSangNgayKe: () => void;
}) {
  const isOpen = !lock.locked;
  const hasVideo = lesson.youtubeId.trim() !== "" && isOpen;
  const deadline = day ? getDayDeadline(day.day) : new Date();

  // Bài tập chỉ hiện ở video CUỐI CÙNG của ngày. Nếu hiện ở mọi video,
  // học viên dễ tưởng xem xong một video là nộp bài được rồi.
  const soVideoDay = day ? day.lessons.length : 0;
  const xongHetVideo = day ? day.lessons.every((l) => watchedKeys.has(l.key)) : false;
  const viTri = day ? day.lessons.findIndex((l) => l.key === lesson.key) : -1;
  const laBaiCuoiNgay = day ? viTri === day.lessons.length - 1 : false;
  const conLai = day ? day.lessons.length - 1 - viTri : 0;

  return (
    <div className="mx-auto max-w-[980px] space-y-5">
      {/* VIDEO LỚN — trung tâm */}
      <div className="overflow-hidden video-frame rounded-2xl border border-border shadow-[0_20px_60px_-25px_rgba(0,0,0,0.9)]">
        <div className="relative aspect-video w-full">
          {hasVideo ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={
                "https://www.youtube-nocookie.com/embed/" +
                lesson.youtubeId +
                "?rel=0&modestbranding=1"
              }
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/40 text-muted-foreground">
              <Lock className="h-10 w-10" />
              <span className="text-sm font-semibold">
                {isOpen
                  ? "Sắp ra mắt"
                  : lock.kind === "date"
                    ? "Mở vào " + lock.openDate
                    : lock.kind === "prev"
                      ? "Nộp bài " + dayLabel(lock.needDay) + " trước đã"
                      : "Xem hết video của ngày trước đã"}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {isOpen
                  ? "Bài giảng này đang được quay"
                  : lock.kind === "date"
                    ? "Quay lại đúng ngày để học nhé"
                    : "Hoàn thành ngày trước để mở ngày này"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin bài */}
      <div>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span className="rounded-md bg-primary/15 px-2 py-0.5 font-bold text-primary">
            {day ? dayLabel(day.day) : ""} · Bài {lesson.code}
          </span>
          {lesson.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lesson.duration}
            </span>
          )}
          {isWatched && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Đã xem
            </span>
          )}
          {isSubmitted && (
            <span className="inline-flex items-center gap-1 font-semibold text-gold">
              <ShieldCheck className="h-3 w-3" /> Đã nộp bài
            </span>
          )}
        </div>

        <h1 className="mt-2.5 text-[20px] font-black md:text-[26px]">{lesson.title}</h1>
        <p className="mt-2.5 max-w-3xl text-[16px] leading-relaxed text-muted-foreground">
          {lesson.description}
        </p>
      </div>

      {/* Hoàn thành bài rồi sang bài kế — không phải tự mò lên mục lục */}
      <div className="flex flex-wrap items-center gap-2">
        {laBaiCuoiNgay ? (
          /* Bài cuối của ngày: đánh dấu hoàn tất tại chỗ, rồi mới cho sang ngày sau.
             Không điều hướng sang nộp bài vì khối bài tập ngay dưới đã có nút. */
          xongHetVideo ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <p className="min-w-0 flex-1 text-[14px] font-bold text-emerald-700 dark:text-emerald-300">
                  Đã hoàn tất {day ? dayLabel(day.day).toLowerCase() : "ngày này"} · xem đủ{" "}
                  {soVideoDay}/{soVideoDay} video
                </p>
              </div>

              {ngaySau ? (
                <Button
                  size="lg"
                  disabled={ngaySauBiKhoa}
                  onClick={onSangNgayKe}
                  title={ngaySauBiKhoa ? "Nộp bài của ngày này trước đã" : undefined}
                  className="w-full bg-gradient-primary hover:opacity-90 sm:w-auto"
                >
                  {ngaySauBiKhoa ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Nộp bài bên dưới để mở {dayLabel(ngaySau.day)}
                    </>
                  ) : (
                    <>
                      Sang {dayLabel(ngaySau.day)}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-[14px] text-muted-foreground">
                  Bạn đã học hết toàn bộ bài giảng. Nộp nốt bài bên dưới là trọn vẹn.
                </p>
              )}
            </div>
          ) : (
            <Button
              size="lg"
              disabled={!hasVideo || busy}
              onClick={onCompleteNext}
              className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90 sm:w-auto"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Hoàn thành {day ? dayLabel(day.day).toLowerCase() : "bài này"}
            </Button>
          )
        ) : nextLesson ? (
          <Button
            size="lg"
            disabled={!hasVideo || busy}
            onClick={onCompleteNext}
            className="w-full bg-gradient-primary hover:opacity-90 sm:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isWatched ? "Sang bài " + nextLesson.code : "Hoàn thành · Sang bài " + nextLesson.code}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={!hasVideo || busy}
            onClick={onCompleteNext}
            className="w-full bg-gradient-primary hover:opacity-90 sm:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isWatched ? "Đã học hết bài giảng" : "Hoàn thành bài cuối"}
          </Button>
        )}
      </div>

      {/* Chưa tới video cuối — chỉ nhắc, chưa cho thấy đề bài */}
      {!laBaiCuoiNgay && conLai > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/40 p-3">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Còn <b className="text-foreground">{conLai} video</b> nữa của{" "}
            {day ? dayLabel(day.day).toLowerCase() : "ngày này"}. Học hết rồi Phong mới đưa bài tập —
            mỗi ngày chỉ nộp <b className="text-foreground">một bài duy nhất</b>, không phải nộp
            sau từng video.
          </p>
        </div>
      )}

      {/* Sơ đồ tóm tắt — nhìn là biết phải làm gì trước khi bắt tay vào bài */}
      {laBaiCuoiNgay && day && <SoDoBaiHoc day={day} />}

      {/* ══ BÀI TẬP — chỉ hiện ở video cuối của ngày ══ */}
      {laBaiCuoiNgay && (
      <section className="assignment-box">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
            <ClipboardList className="h-4 w-4" />
          </span>
          <h2 className="text-[16px] font-black uppercase tracking-[0.1em] text-gold">
            Bài tập cần nộp
          </h2>
          {isSubmitted && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Đã nộp
            </span>
          )}
        </div>

        {/* Mục tiêu */}
        <div className="mt-3">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Mục tiêu
          </div>
          <p className="mt-1 text-[16px] font-semibold leading-relaxed text-foreground">
            {day?.assignment}
          </p>
        </div>

        {/* Bản nộp phải có gì */}
        {day && day.deliverables.length > 0 && (
          <div className="mt-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Bản nộp phải có
            </div>
            <ul className="mt-2 space-y-1.5">
              {day.deliverables.map((d) => (
                <li key={d} className="flex gap-2 text-[16px] leading-relaxed text-foreground">
                  <CheckCircle2 className="mt-[3px] h-4 w-4 shrink-0 text-gold" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cách nộp + hạn nộp */}
        <div className="mt-4 grid gap-2 rounded-xl border border-border/60 bg-background/40 p-3 text-[14px] sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              Làm trên <b className="text-foreground">Google Docs</b>, mở quyền “Bất kỳ ai có
              đường liên kết”, rồi dán link vào tab Nộp bài tập.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              Hạn nộp:{" "}
              <b className="text-gold">
                {deadline.toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </b>
              {" · "}nộp được {POINTS_PER_SUBMISSION} điểm và 1 khiên vàng.
            </span>
          </div>
        </div>

        <div className="mt-4">
          <Button asChild className="bg-gradient-gold text-gold-foreground hover:opacity-90">
            <Link to="/bai-tap" hash={day?.key ?? ""}>
              {isSubmitted ? "Sửa bài nộp" : "Nộp bài tập"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      )}
    </div>
  );
}
