import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock3, Check, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCourse } from "@/hooks/useCourse";
import { currentDeadline, dayLabel, type DeadlineInfo } from "@/lib/lessons";

function remainingUntil(deadline: Date, now: Date) {
  const totalMs = Math.max(0, deadline.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalMs,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Đồng hồ đếm ngược hạn nộp bài — viên nhỏ, bám giữa màn hình.
 * Tự nhảy sang bài kế tiếp khi qua ngày.
 */
export function CountdownBar() {
  const { user } = useAuth();
  const { days } = useCourse();
  const [now, setNow] = useState(() => new Date());
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("submissions").select("lesson_key").eq("user_id", user.id);
    setSubmitted(new Set((data ?? []).map((r) => r.lesson_key)));
  }, [user]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("countdown-submissions-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `user_id=eq.${user.id}` },
        () => loadSubmissions(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadSubmissions]);

  const info: DeadlineInfo | null = currentDeadline(now, days);

  if (!info) {
    return (
      <Pill tone="done">
        <Flag className="h-3 w-3 shrink-0" />
        <span>Đã hết hạn nộp bài</span>
      </Pill>
    );
  }

  const left = remainingUntil(info.deadline, now);
  const isSubmitted = submitted.has(info.day.key);
  const urgent = left.totalMs < 24 * 3600 * 1000;

  const clock =
    (left.days > 0 ? left.days + "n " : "") +
    pad(left.hours) +
    ":" +
    pad(left.minutes) +
    ":" +
    pad(left.seconds);

  if (isSubmitted) {
    return (
      <Pill tone="done">
        <Check className="h-3 w-3 shrink-0" />
        <span>Đã nộp {dayLabel(info.day.day)}</span>
        <span className="opacity-40">·</span>
        <span className="font-mono tabular-nums opacity-80">{clock}</span>
      </Pill>
    );
  }

  return (
    <Link to="/bai-tap" hash={info.day.key}>
      <Pill tone={urgent ? "urgent" : "normal"} interactive>
        <Clock3 className="h-3 w-3 shrink-0" />
        <span>Hạn {dayLabel(info.day.day)}</span>
        <span className="opacity-40">·</span>
        <span className="font-mono font-semibold tabular-nums">{clock}</span>
      </Pill>
    </Link>
  );
}

function Pill({
  tone,
  interactive,
  children,
}: {
  tone: "normal" | "urgent" | "done";
  interactive?: boolean;
  children: React.ReactNode;
}) {
  const styles = {
    normal: "border-border/70 bg-card/70 text-foreground",
    urgent: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
    done: "border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] leading-none backdrop-blur-md transition-colors ${styles} ${
        interactive ? "hover:border-primary/50 hover:text-foreground" : ""
      }`}
    >
      {children}
    </div>
  );
}
