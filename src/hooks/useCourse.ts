import { useProfile } from "./useProfile";
import { courseFor, type Course } from "@/lib/lessons";

/** Khoá học của người đang đăng nhập: Skill (vào trước 05/11/2026) hay Subagent. */
export function useCourse(): Course {
  const { profile } = useProfile();
  return courseFor(profile?.onboarded_at);
}
