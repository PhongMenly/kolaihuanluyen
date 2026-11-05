import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { courseFor, findDay, dayLabel } from "@/lib/lessons";
import {
  GRADING_MODEL,
  GRADING_SYSTEM_PROMPT,
  BANNED_WORDS,
  MIN_SCORE,
  buildAssignmentBrief,
  googleExportPdfUrl,
  type GradeResult,
  type GradeOutcome,
} from "@/lib/grading";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Tải bản PDF của Google Docs — giữ được cả ảnh chụp màn hình trong bài. */
async function fetchDocAsPdf(docUrl: string): Promise<string> {
  const exportUrl = googleExportPdfUrl(docUrl);
  if (!exportUrl) {
    throw new Error(
      "Link chưa phải tài liệu Google. Hãy dán link Google Docs, Trang tính hoặc Trang trình bày.",
    );
  }

  const res = await fetch(exportUrl, { redirect: "follow" });

  if (!res.ok) {
    throw new Error(
      "Không mở được tài liệu. Hãy đặt quyền “Bất kỳ ai có đường liên kết” rồi nộp lại.",
    );
  }

  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("pdf")) {
    // Google trả về trang đăng nhập HTML khi tài liệu còn ở chế độ riêng tư
    throw new Error(
      "Tài liệu đang ở chế độ riêng tư. Hãy đặt quyền “Bất kỳ ai có đường liên kết”.",
    );
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength < 400) throw new Error("Tài liệu trống.");
  if (buf.byteLength > 15_000_000) throw new Error("Tài liệu quá lớn (trên 15 MB).");

  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function callGemini(apiKey: string, pdfBase64: string, userText: string) {
  const res = await fetch(`${GEMINI_ENDPOINT}/${GRADING_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: GRADING_SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
            { text: userText },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 8000,
        responseMimeType: "application/json",
      },
    }),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (json.error) throw new Error("Gemini: " + (json.error.message ?? "lỗi không rõ"));

  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini không trả về nội dung.");

  const parsed = JSON.parse(raw) as GradeResult;
  if (typeof parsed.diem !== "number" || typeof parsed.nhan_xet !== "string") {
    throw new Error("Gemini trả về sai định dạng.");
  }
  return parsed;
}

/**
 * Chấm một bài nộp.
 * Chạy phía máy chủ nên khoá Gemini không bao giờ lộ ra trình duyệt.
 */
export const gradeSubmission = createServerFn({ method: "POST" })
  .inputValidator((data: { lessonKey: string; accessToken: string }) => data)
  .handler(async ({ data }): Promise<GradeOutcome> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Máy chủ chưa cấu hình GEMINI_API_KEY.");

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Máy chủ thiếu cấu hình Supabase.");

    // Token do chính trình duyệt gửi lên — mọi thao tác vẫn đi qua RLS của học viên đó
    if (!data.accessToken) throw new Error("Chưa đăng nhập.");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: "Bearer " + data.accessToken } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Phiên đăng nhập đã hết hạn.");

    const { data: sub } = await supabase
      .from("submissions")
      .select("doc_url, graded_at")
      .eq("user_id", user.id)
      .eq("lesson_key", data.lessonKey)
      .maybeSingle();

    if (!sub) throw new Error("Chưa có bài nộp cho bài này.");
    if (sub.graded_at) return { alreadyGraded: true };

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, onboarded_at")
      .eq("id", user.id)
      .maybeSingle();

    // Đề bài lấy theo khoá của học viên: Skill hay Subagent
    const day = findDay(data.lessonKey, courseFor(profile?.onboarded_at).days);
    if (!day) throw new Error("Không tìm thấy bài tập.");

    const studentName = profile?.display_name ?? "bạn";

    const brief = buildAssignmentBrief(
      dayLabel(day.day),
      day.title,
      day.assignment,
      day.deliverables,
    );
    const userText = `TÊN HỌC VIÊN: ${studentName}\n\nĐỀ BÀI:\n${brief}\n\n=====\n\nBÀI LÀM của học viên nằm trong tệp PDF đính kèm.`;

    try {
      const pdf = await fetchDocAsPdf(sub.doc_url);

      let result = await callGemini(apiKey, pdf, userText);

      // Lọt từ quá phô thì chấm lại một lần
      const lower = result.nhan_xet.toLowerCase();
      if (BANNED_WORDS.some((w) => lower.includes(w))) {
        result = await callGemini(
          apiKey,
          pdf,
          userText + "\n\nLƯU Ý: viết lại tự nhiên hơn, tuyệt đối không dùng từ hoa mỹ.",
        );
      }

      // Chốt sàn ngay tại đây, phòng khi AI chấm lệch xuống dưới mức cho phép
    const score = Math.max(MIN_SCORE, Math.min(10, Math.round(result.diem * 10) / 10));

      await supabase
        .from("submissions")
        .update({
          ai_score: score,
          ai_feedback: result.nhan_xet.trim(),
          grade_error: null,
          graded_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("lesson_key", data.lessonKey);

      return { score, feedback: result.nhan_xet.trim() };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);

      await supabase
        .from("submissions")
        .update({ grade_error: message, graded_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("lesson_key", data.lessonKey);

      return { error: message };
    }
  });
