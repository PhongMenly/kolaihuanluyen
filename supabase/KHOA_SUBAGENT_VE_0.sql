-- =====================================================
-- KHOA SUBAGENT — MOI NGUOI BAT DAU LAI TU 0 (05/11/2026)
--
-- Khien, diem, so video chi dem bai cua khoa Subagent:
--   bai nop  : sa-ngay-1 .. sa-ngay-4
--   video    : sa1-b1, sa1-b2, ... (ma bat dau bang 'sa')
-- Bai nop va video cua khoa Skill (ngay-1..ngay-5, p1-b1...) VAN CON
-- NGUYEN trong database, chi khong duoc tinh nua.
--
-- MUON MO LAI KHOA SKILL: chay lai file MOI_NGAY_1_KHIEN.sql
-- (ban recalc_points cu) va doi AN_KHOA_SKILL = false trong src/lib/lessons.ts.
-- =====================================================

CREATE OR REPLACE FUNCTION public.recalc_points(p_user UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s INT;          -- so KHIEN = so ngay thuc te co nop bai
  w INT;          -- so video da xem
  g NUMERIC;      -- tong diem bai tap
  t_dau TIMESTAMPTZ;
  d JSONB;        -- diem tung ngay: {"sa-ngay-1": 9.5, ...}
BEGIN
  SELECT count(DISTINCT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date),
         COALESCE(sum(COALESCE(admin_score, ai_score, 0)), 0),
         min(created_at)
    INTO s, g, t_dau
    FROM public.submissions
   WHERE user_id = p_user
     AND lesson_key IN ('sa-ngay-1','sa-ngay-2','sa-ngay-3','sa-ngay-4');

  SELECT COALESCE(jsonb_object_agg(lesson_key,
                                   COALESCE(admin_score, ai_score)), '{}'::jsonb)
    INTO d
    FROM public.submissions
   WHERE user_id = p_user
     AND lesson_key IN ('sa-ngay-1','sa-ngay-2','sa-ngay-3','sa-ngay-4')
     AND COALESCE(admin_score, ai_score) IS NOT NULL;

  SELECT count(*) INTO w
    FROM public.watched_videos
   WHERE user_id = p_user
     AND video_key LIKE 'sa%';

  UPDATE public.profiles
     SET submission_count = s,
         watched_count    = w,
         grade_sum        = g,
         day_scores       = d,
         first_submit_at  = t_dau,
         total_points     = ROUND(g * 10),
         updated_at       = now()
   WHERE id = p_user;
END;
$$;

-- Tinh lai cho tat ca — ai cung ve 0 vi chua ai nop bai khoa Subagent
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalc_points(r.id);
  END LOOP;
END;
$$;

-- Kiem tra: tat ca phai bang 0; du lieu cu van con
SELECT (SELECT count(*) FROM public.profiles)                                   AS so_hoc_vien,
       (SELECT count(*) FROM public.profiles WHERE submission_count > 0
           OR grade_sum > 0 OR watched_count > 0)                               AS con_diem,
       (SELECT count(*) FROM public.submissions)                                AS bai_nop_cu_van_con,
       (SELECT count(*) FROM public.watched_videos)                             AS video_da_xem_van_con;
