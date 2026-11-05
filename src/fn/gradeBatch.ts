import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { courseFor, findDay, dayLabel } from "@/lib/lessons";
import {
  GRADING_MODEL,
  GRADING_SYSTEM_PROMPT,
  BANNED_WORDS,
  MIN_SCORE,
  buildAssignmentBrief,
  googleExportPdfUrl,
  type GradeResult,
} from "@/lib/grading";

const GEMINI = "https://generativelanguage.googleapis.com/v1beta/models";

/** Số bài chấm mỗi lượt gọi — giữ nhỏ để không chạm giới hạn thời gian của Vercel. */
const BATCH_SIZE = 3;

async function fetchDocAsPdf(docUrl: string): Promise<string> {
  const exportUrl = googleExportPdfUrl(docUrl);
  if (!exportUrl) {
    throw new Error(
      "Link chưa phải tài liệu Google. Hãy dán link Google Docs, Trang tính hoặc Trang trình bày.",
    );
  }

  const res = await fetch(exportUrl, { redirect: "follow" });
  if (!res.ok)
    throw new Error("Không mở được tài liệu. Hãy đặt quyền “Bất kỳ ai có đường liên kết”.");

  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("pdf")) {
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

async function callGemini(apiKey: string, pdf: string, userText: string): Promise<GradeResult> {
  const res = await fetch(`${GEMINI}/${GRADING_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: GRADING_SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [{ inline_data: { mime_type: "application/pdf", data: pdf } }, { text: userText }],
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

/** Chấm một bài, ghi kết quả vào database. */
async function gradeOne(
  supabase: SupabaseClient,
  apiKey: string,
  row: { user_id: string; lesson_key: string; doc_url: string },
): Promise<"ok" | "error"> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarded_at")
    .eq("id", row.user_id)
    .maybeSingle();

  // Đề bài lấy theo khoá của học viên: Skill hay Subagent
  const day = findDay(row.lesson_key, courseFor(profile?.onboarded_at).days);
  if (!day) return "error";

  const brief = buildAssignmentBrief(
    dayLabel(day.day),
    day.title,
    day.assignment,
    day.deliverables,
  );
  const userText = `TÊN HỌC VIÊN: ${profile?.display_name ?? "bạn"}\n\nĐỀ BÀI:\n${brief}\n\n=====\n\nBÀI LÀM của học viên nằm trong tệp PDF đính kèm.`;

  try {
    const pdf = await fetchDocAsPdf(row.doc_url);
    let result = await callGemini(apiKey, pdf, userText);

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
      .eq("user_id", row.user_id)
      .eq("lesson_key", row.lesson_key);

    return "ok";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase
      .from("submissions")
      .update({ grade_error: message, graded_at: new Date().toISOString() })
      .eq("user_id", row.user_id)
      .eq("lesson_key", row.lesson_key);
    return "error";
  }
}

export interface BatchResult {
  graded: number;
  failed: number;
  remaining: number;
}

/**
 * Chấm một loạt bài chưa chấm. Chỉ Admin gọi được —
 * học viên thường chỉ nhìn thấy bài của chính mình nên không ảnh hưởng ai khác.
 */
export const gradeBatch = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }): Promise<BatchResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Máy chủ chưa cấu hình GEMINI_API_KEY.");

    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Máy chủ thiếu cấu hình Supabase.");
    if (!data.accessToken) throw new Error("Chưa đăng nhập.");

    const supabase = createClient(url, key, {
      global: { headers: { Authorization: "Bearer " + data.accessToken } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Phiên đăng nhập đã hết hạn.");

    // Lấy các bài chưa từng được chấm
    const { data: rows } = await supabase
      .from("submissions")
      .select("user_id, lesson_key, doc_url")
      .is("graded_at", null)
      .limit(BATCH_SIZE);

    const list = rows ?? [];
    let graded = 0;
    let failed = 0;

    for (const row of list) {
      const r = await gradeOne(supabase, apiKey, row);
      if (r === "ok") graded += 1;
      else failed += 1;
    }

    // Còn bao nhiêu bài chưa chấm
    const { count } = await supabase
      .from("submissions")
      .select("lesson_key", { count: "exact", head: true })
      .is("graded_at", null);

    return { graded, failed, remaining: count ?? 0 };
  });
