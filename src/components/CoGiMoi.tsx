import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import anhVinhDanh from "@/assets/manhinh-vinh-danh.png";
import anhChamLai from "@/assets/manhinh-cham-lai.png";

/**
 * Khung khoanh đỏ đặt trên ảnh chụp màn hình.
 * Toạ độ tính theo phần trăm kích thước ảnh, nên ảnh co giãn thế nào
 * khung vẫn nằm đúng chỗ.
 */
export interface KhoanhDo {
  /** Mép trái, tính từ 0 đến 100 */
  x: number;
  /** Mép trên, tính từ 0 đến 100 */
  y: number;
  /** Chiều rộng theo phần trăm */
  w: number;
  /** Chiều cao theo phần trăm */
  h: number;
  /** Chữ chú thích gắn cạnh khung, ví dụ "Bấm vào đây" */
  chu?: string;
}

export interface TinMoi {
  /** Mã riêng, đổi mã là mọi người thấy lại thông báo. */
  key: string;
  ngay: string;
  tieuDe: string;
  noiDung: string;
  /** Ảnh chụp màn hình minh hoạ tính năng */
  anh?: string;
  /** Chú thích dưới ảnh */
  chuThichAnh?: string;
  /** Các vùng cần khoanh đỏ trên ảnh */
  khoanh?: KhoanhDo[];
}

/** Ảnh chụp màn hình kèm khung khoanh đỏ chỉ đúng chỗ cần xem. */
export function AnhMinhHoa({
  anh,
  chuThich,
  khoanh = [],
}: {
  anh: string;
  chuThich?: string;
  khoanh?: KhoanhDo[];
}) {
  return (
    <figure className="mt-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-background/40">
        <img src={anh} alt={chuThich ?? ""} loading="lazy" className="block w-full" />
        {khoanh.map((k, i) => (
          <span
            key={i}
            className="pointer-events-none absolute rounded-lg border-[3px] border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.25)]"
            style={{ left: k.x + "%", top: k.y + "%", width: k.w + "%", height: k.h + "%" }}
          >
            {k.chu && (
              <span className="absolute left-0 top-full mt-1 whitespace-nowrap rounded-md bg-red-500 px-1.5 py-0.5 text-[12px] font-bold text-white shadow">
                {k.chu}
              </span>
            )}
          </span>
        ))}
      </div>
      {chuThich && (
        <figcaption className="mt-1.5 text-[13px] text-muted-foreground">{chuThich}</figcaption>
      )}
    </figure>
  );
}

/**
 * Tin mới nhất nằm trên cùng.
 * Thêm tin: chèn một dòng vào đầu mảng, đặt key chưa dùng bao giờ.
 * 05/11/2026: làm mới theo khoá Subagent — bắt đầu trống.
 */
export const TIN_MOI: TinMoi[] = [];

/** Tin của khoá Skill (31/08–08/09/2026) — tạm ẩn, không xoá. */
export const TIN_MOI_KHOA_SKILL: TinMoi[] = [
  {
    key: "2026-09-08-mo-het",
    ngay: "08/09",
    tieuDe: "Đã mở toàn bộ 5 ngày — học theo nhịp của bạn",
    noiDung:
      "Từ giờ bạn vào học và nộp bài ngày nào cũng được, không phải nộp xong ngày trước mới mở được ngày sau. Bài nộp và điểm đã có vẫn giữ nguyên, khiên vẫn tính như cũ.",
  },
  {
    key: "2026-09-01-so-do",
    ngay: "01/09",
    tieuDe: "Mỗi ngày có sơ đồ tóm tắt việc cần làm",
    noiDung:
      "Học tới video cuối của ngày, bạn sẽ thấy một sơ đồ gọn gàng tóm tắt các bước phải làm để nộp bài. Nhìn là hình dung được ngay, khỏi phải đọc lại cả đề.",
  },
  {
    key: "2026-09-03-ngay5",
    ngay: "03/09",
    tieuDe: "Ngày 5 đã mở — buổi tổng kết và chuyển giao",
    noiDung:
      "Nhận trọn bộ mã nguồn trang bán hàng cùng hai Skill tạo video và xây thương hiệu, dựng thành thương hiệu riêng của bạn. Đây là buổi cuối, nộp xong bài ngày 4 là vào học được.",
  },
  {
    key: "2026-09-02-cham-lai",
    ngay: "02/09",
    tieuDe: "Bài chưa mở được tài liệu — bấm một nút là Phong chấm lại",
    noiDung:
      "Nếu Phong báo chưa mở được bài, bạn vào Google Docs đặt quyền “Bất kỳ ai có đường liên kết” rồi bấm nút ngay dưới bài. Khiên vàng của bạn vẫn giữ nguyên, không phải nộp lại từ đầu.",
    anh: anhChamLai,
    chuThichAnh: "Khung báo lỗi hiện ngay dưới bài nộp của bạn.",
    khoanh: [{ x: 14.6, y: 84, w: 22.5, h: 8, chu: "Bấm sau khi đã công khai" }],
  },
  {
    key: "2026-09-02-ngay4",
    ngay: "02/09",
    tieuDe: "Ngày 4 đã mở — Nhân bản kênh và video bằng AI",
    noiDung:
      "Giọng AI Adam, ghép mặt làm video bán hàng, cắt một video dài thành 30 video ngắn, và lộ trình 1000 đô đầu tiên. Nộp xong bài ngày 3 là vào học được.",
  },
  {
    key: "2026-09-01-ngay3",
    ngay: "01/09",
    tieuDe: "Ngày 3 đã mở — Tự động hoá kênh bằng AI Agent",
    noiDung:
      "Chiến lược Content Queen để xây kênh bán hàng, và cách đóng gói phong cách kênh thành Skill AI tự đăng bài đa nền tảng. Nộp xong bài ngày 2 là vào học được.",
  },
  {
    key: "2026-09-01-giao-dien",
    ngay: "01/09",
    tieuDe: "Thêm giao diện sáng, chữ to và rõ hơn",
    noiDung:
      "Bấm nút mặt trời trên thanh đầu trang để đổi giữa giao diện sáng và tối, hệ thống sẽ nhớ lựa chọn của bạn. Cỡ chữ toàn app cũng đã được tăng lên cho dễ đọc.",
    anh: anhVinhDanh,
    chuThichAnh: "Nút đổi giao diện nằm ở góc trên bên phải, cạnh ảnh đại diện của bạn.",
    khoanh: [{ x: 90, y: 1, w: 3.4, h: 6.5, chu: "Bấm vào đây" }],
  },
  {
    key: "2026-08-31-khien",
    ngay: "31/08",
    tieuDe: "Mỗi ngày chỉ tính một khiên",
    noiDung:
      "Khiên vàng đếm theo số ngày bạn thực sự có nộp bài. Nộp dồn hai bài trong cùng một hôm vẫn là một khiên, nhưng điểm chấm thì cộng đủ cả hai.",
  },
  {
    key: "2026-08-31-ngay2",
    ngay: "31/08",
    tieuDe: "Ngày 2 đã mở — Từ Skill đến App bằng AI",
    noiDung:
      "Bốn bài mới: khái niệm Skill, đóng gói Skill ảnh thương hiệu, ChatGPT với Claude Code, và deploy app kèm trang bán hàng. Nộp xong bài ngày 1 là vào học được.",
  },
  {
    key: "2026-08-31-diem",
    ngay: "31/08",
    tieuDe: "Điểm chấm thấp nhất là 7",
    noiDung:
      "Đã bỏ công làm và nộp bài thì thấp nhất cũng 7 điểm, không ai thấp hơn. Thứ hạng trên bảng Vinh danh xếp theo tổng điểm chấm của tất cả các ngày.",
    anh: anhVinhDanh,
    chuThichAnh: "Trên bảng Vinh danh, mỗi người hiện điểm của từng ngày và tổng điểm.",
    khoanh: [
      { x: 18.8, y: 41, w: 9.5, h: 5, chu: "Điểm từng ngày" },
      { x: 80.2, y: 35, w: 7, h: 9, chu: "Tổng điểm" },
    ],
  },
];

const KHOA = "kol-tin-da-xem";

/** Ghi nhận đã đọc hết tin — dùng chung với tab Có gì mới. */
export function danhDauDaXem() {
  try {
    localStorage.setItem(KHOA, JSON.stringify(TIN_MOI.map((t) => t.key)));
  } catch {
    /* trình duyệt chặn lưu — bỏ qua */
  }
}

function daXem(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KHOA) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Bảng tin — chỉ hiện khi có tin bạn chưa đọc, đóng rồi thì thôi. */
export function CoGiMoi() {
  const [chuaXem, setChuaXem] = useState<TinMoi[]>([]);

  useEffect(() => {
    const xong = daXem();
    setChuaXem(TIN_MOI.filter((t) => !xong.includes(t.key)));
  }, []);

  if (chuaXem.length === 0) return null;

  const dong = () => {
    danhDauDaXem();
    setChuaXem([]);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gold/[0.05] p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="min-w-0 flex-1 text-[16px] font-black uppercase tracking-[0.08em] text-gold">
          Có gì mới
        </h2>
        <button
          onClick={dong}
          aria-label="Đã đọc, đóng lại"
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {chuaXem.map((t) => (
          <div key={t.key} className="flex gap-3">
            <span className="mt-px shrink-0 rounded-md bg-gold/15 px-1.5 py-0.5 text-[12px] font-black tabular-nums text-gold">
              {t.ngay}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-foreground">{t.tieuDe}</div>
              <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
                {t.noiDung}
              </p>
              {t.anh && (
                <AnhMinhHoa anh={t.anh} chuThich={t.chuThichAnh} khoanh={t.khoanh} />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={dong}
        className="mt-3 text-[13px] font-bold text-gold underline-offset-4 transition hover:underline"
      >
        Đã đọc
      </button>
    </section>
  );
}
