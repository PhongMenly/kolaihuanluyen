import {
  Brain,
  Download,
  MousePointer,
  FileText,
  Repeat,
  Package,
  Layout,
  Globe,
  Map as MapIcon,
  Search,
  Send,
  Video,
  Sparkles,
  TrendingUp,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { SO_DO, dayLabel, type BuocSoDo, type Day } from "@/lib/lessons";

const ICON: Record<string, LucideIcon> = {
  brain: Brain,
  download: Download,
  "mouse-pointer": MousePointer,
  "file-text": FileText,
  repeat: Repeat,
  package: Package,
  layout: Layout,
  globe: Globe,
  map: MapIcon,
  search: Search,
  send: Send,
  video: Video,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
};

/* Bảng màu riêng của sơ đồ — giữ nguyên ở cả giao diện sáng lẫn tối. */
const KEM = "#f4f2e9";
const CHANH = "#b9d92e";
const CHANH_DAM = "#7f9a12";
const MUC = "#16181c";
const MUC_NHAT = "#5c6068";

/** Bốn kiểu bố cục, mỗi ngày một kiểu cho đỡ nhàm. */
const KIEU: Record<string, "truc" | "doc" | "luoi" | "hang"> = {
  "ngay-1": "truc",
  "ngay-2": "doc",
  "ngay-3": "luoi",
  "ngay-4": "hang",
  "ngay-5": "truc",
};

/** Cắt chuỗi thành nhiều dòng, mỗi dòng không quá `toiDa` ký tự. */
function xuongDong(chu: string, toiDa: number): string[] {
  const tu = chu.split(" ");
  const dong: string[] = [];
  let hienTai = "";
  for (const t of tu) {
    if (!hienTai) hienTai = t;
    else if ((hienTai + " " + t).length <= toiDa) hienTai += " " + t;
    else {
      dong.push(hienTai);
      hienTai = t;
    }
  }
  if (hienTai) dong.push(hienTai);
  return dong;
}

function Nen() {
  return (
    <>
      <defs>
        <pattern id="cham-bi" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill={MUC} opacity="0.055" />
        </pattern>
      </defs>
      <rect width="1200" height="900" fill={KEM} />
      <rect width="1200" height="900" fill="url(#cham-bi)" />
    </>
  );
}

function TieuDe({ chu }: { chu: string }) {
  return (
    <text
      x="600"
      y="84"
      textAnchor="middle"
      fill={MUC}
      fontSize="54"
      fontWeight="900"
      letterSpacing="-1"
    >
      {chu}
    </text>
  );
}

function ThuongHieu() {
  return (
    <>
      <rect x="330" y="828" width="540" height="72" rx="14" fill={MUC} />
      <text
        x="600"
        y="874"
        textAnchor="middle"
        fill="#fff"
        fontSize="30"
        fontWeight="800"
        letterSpacing="1.5"
      >
        phongmenlyai.com
      </text>
    </>
  );
}

/** Vòng tròn biểu tượng dùng chung cho mọi kiểu. */
function VongIcon({ x, y, r, ten }: { x: number; y: number; r: number; ten: string }) {
  const Icon = ICON[ten] ?? Sparkles;
  const c = r * 0.88;
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={CHANH} strokeWidth="7" />
      <circle cx={x} cy={y} r={r - 12} fill={CHANH} opacity="0.13" />
      <Icon x={x - c / 2} y={y - c / 2} width={c} height={c} color={CHANH_DAM} strokeWidth={1.7} />
    </>
  );
}

function SoThuTu({ x, y, so }: { x: number; y: number; so: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="25" fill={CHANH} stroke="#fff" strokeWidth="5" />
      <text x={x} y={y + 9} textAnchor="middle" fill={MUC} fontSize="27" fontWeight="900">
        {so}
      </text>
    </>
  );
}

/** Khối chữ: tên đậm rồi mô tả nhạt, xuống dòng tự động. */
function KhoiChu({
  x,
  y,
  neo,
  ten,
  mota,
  rongTen,
  rongMoTa,
}: {
  x: number;
  y: number;
  neo: "start" | "end" | "middle";
  ten: string;
  mota: string;
  rongTen: number;
  rongMoTa: number;
}) {
  const dt = xuongDong(ten, rongTen);
  const dm = xuongDong(mota, rongMoTa);
  const cao = dt.length * 44 + dm.length * 35;
  const bd = y - cao / 2 + 32;
  return (
    <>
      {dt.map((d, j) => (
        <text
          key={"t" + j}
          x={x}
          y={bd + j * 44}
          textAnchor={neo}
          fill={MUC}
          fontSize="38"
          fontWeight="800"
        >
          {d}
        </text>
      ))}
      {dm.map((d, j) => (
        <text
          key={"m" + j}
          x={x}
          y={bd + dt.length * 44 + j * 35 + 6}
          textAnchor={neo}
          fill={MUC_NHAT}
          fontSize="30"
        >
          {d}
        </text>
      ))}
    </>
  );
}

/* ── KIỂU 1: trục xoay, bốn nhánh toả ra ─────────────── */
function KieuTruc({ buoc, nhan }: { buoc: BuocSoDo[]; nhan: string }) {
  const CX = 600;
  const CY = 478;
  const RT = 108;
  const RN = 86;
  const vt = [
    { x: 425, y: 300, trai: true },
    { x: 775, y: 300, trai: false },
    { x: 775, y: 655, trai: false },
    { x: 425, y: 655, trai: true },
  ];

  return (
    <>
      <circle
        cx={CX}
        cy={CY}
        r={RT + 74}
        fill="none"
        stroke={CHANH}
        strokeWidth="2.5"
        strokeDasharray="9 11"
        opacity="0.65"
      />
      {vt.map((v, i) => {
        const dx = v.x - CX;
        const dy = v.y - CY;
        const d = Math.hypot(dx, dy);
        return (
          <line
            key={"l" + i}
            x1={CX + (dx / d) * (RT + 4)}
            y1={CY + (dy / d) * (RT + 4)}
            x2={v.x - (dx / d) * (RN + 4)}
            y2={v.y - (dy / d) * (RN + 4)}
            stroke={CHANH}
            strokeWidth="3.5"
          />
        );
      })}

      <circle cx={CX} cy={CY} r={RT} fill="#fff" stroke={CHANH} strokeWidth="7" />
      <circle cx={CX} cy={CY} r={RT - 14} fill={CHANH} opacity="0.14" />
      <Bot x={CX - 49} y={CY - 62} width={98} height={98} color={CHANH_DAM} strokeWidth={1.6} />
      <text
        x={CX}
        y={CY + 66}
        textAnchor="middle"
        fill={MUC}
        fontSize="28"
        fontWeight="900"
        letterSpacing="1.5"
      >
        {nhan.toUpperCase()}
      </text>

      {buoc.map((b, i) => {
        const v = vt[i];
        return (
          <g key={b.tieuDe}>
            <VongIcon x={v.x} y={v.y} r={RN} ten={b.icon} />
            <SoThuTu x={v.x + (v.trai ? RN - 12 : -RN + 12)} y={v.y - RN + 8} so={i + 1} />
            <KhoiChu
              x={v.trai ? v.x - RN - 34 : v.x + RN + 34}
              y={v.y}
              neo={v.trai ? "end" : "start"}
              ten={b.tieuDe}
              mota={b.mota}
              rongTen={13}
              rongMoTa={17}
            />
          </g>
        );
      })}
    </>
  );
}

/* ── KIỂU 2: dòng chảy dọc, bốn bước nối bằng mũi tên ── */
function KieuDoc({ buoc }: { buoc: BuocSoDo[] }) {
  const X = 210;
  const W = 780;
  const H = 118;
  const KHE = 44;
  const Y0 = 168;

  return (
    <>
      {buoc.map((b, i) => {
        const y = Y0 + i * (H + KHE);
        return (
          <g key={b.tieuDe}>
            {i > 0 && (
              <path
                d={`M600 ${y - KHE + 6} L600 ${y - 12} M582 ${y - 30} L600 ${y - 12} L618 ${y - 30}`}
                stroke={CHANH_DAM}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect
              x={X}
              y={y}
              width={W}
              height={H}
              rx={H / 2}
              fill="#fff"
              stroke={CHANH}
              strokeWidth="6"
            />
            <VongIcon x={X + 66} y={y + H / 2} r={44} ten={b.icon} />
            <SoThuTu x={X + W - 58} y={y + H / 2} so={i + 1} />
            <text x={X + 136} y={y + 52} fill={MUC} fontSize="38" fontWeight="800">
              {b.tieuDe}
            </text>
            <text x={X + 136} y={y + 92} fill={MUC_NHAT} fontSize="29">
              {b.mota}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ── KIỂU 3: lưới hai hàng hai cột quanh một tâm ─────── */
function KieuLuoi({ buoc, nhan }: { buoc: BuocSoDo[]; nhan: string }) {
  const o = [
    { x: 80, y: 150 },
    { x: 660, y: 150 },
    { x: 80, y: 500 },
    { x: 660, y: 500 },
  ];
  const W = 460;
  const H = 268;
  const CX = 600;
  const CY = 452;

  return (
    <>
      {o.map((v, i) => (
        <line
          key={"l" + i}
          x1={v.x + W / 2}
          y1={v.y + H / 2}
          x2={CX}
          y2={CY}
          stroke={CHANH}
          strokeWidth="3"
          opacity="0.55"
        />
      ))}

      {buoc.map((b, i) => {
        const v = o[i];
        return (
          <g key={b.tieuDe}>
            <rect
              x={v.x}
              y={v.y}
              width={W}
              height={H}
              rx="26"
              fill="#fff"
              stroke={CHANH}
              strokeWidth="6"
            />
            <VongIcon x={v.x + 78} y={v.y + 94} r={50} ten={b.icon} />
            <SoThuTu x={v.x + W - 34} y={v.y + 34} so={i + 1} />
            <text x={v.x + 148} y={v.y + 82} fill={MUC} fontSize="36" fontWeight="800">
              {xuongDong(b.tieuDe, 14)[0]}
            </text>
            <text x={v.x + 148} y={v.y + 120} fill={MUC} fontSize="36" fontWeight="800">
              {xuongDong(b.tieuDe, 14)[1] ?? ""}
            </text>
            {xuongDong(b.mota, 24).map((d, j) => (
              <text key={j} x={v.x + 34} y={v.y + 190 + j * 36} fill={MUC_NHAT} fontSize="29">
                {d}
              </text>
            ))}
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r="92" fill={KEM} />
      <circle cx={CX} cy={CY} r="80" fill="#fff" stroke={CHANH} strokeWidth="7" />
      <text
        x={CX}
        y={CY + 12}
        textAnchor="middle"
        fill={MUC}
        fontSize="30"
        fontWeight="900"
        letterSpacing="1"
      >
        {nhan.toUpperCase()}
      </text>
    </>
  );
}

/* ── KIỂU 4: bốn hàng ngang, biểu tượng bên trái ─────── */
function KieuHang({ buoc }: { buoc: BuocSoDo[] }) {
  const Y0 = 190;
  const KHE = 168;

  return (
    <>
      <line
        x1="196"
        y1={Y0}
        x2="196"
        y2={Y0 + KHE * 3}
        stroke={CHANH}
        strokeWidth="4"
        opacity="0.5"
      />
      {buoc.map((b, i) => {
        const y = Y0 + i * KHE;
        return (
          <g key={b.tieuDe}>
            <VongIcon x={196} y={y} r={62} ten={b.icon} />
            <SoThuTu x={252} y={y - 46} so={i + 1} />
            <text x={310} y={y - 6} fill={MUC} fontSize="42" fontWeight="800">
              {b.tieuDe}
            </text>
            <text x={310} y={y + 40} fill={MUC_NHAT} fontSize="30">
              {b.mota}
            </text>
          </g>
        );
      })}
    </>
  );
}

/**
 * Sơ đồ tóm tắt cuối mỗi ngày — vẽ bằng SVG khung 4:3 nên nét ở mọi cỡ
 * màn hình. Mỗi ngày một kiểu bố cục khác nhau.
 */
export function SoDoBaiHoc({ day }: { day: Day }) {
  const buoc = day.soDo ?? SO_DO[day.key];
  if (!buoc || buoc.length !== 4) return null;

  const kieu = KIEU[day.key] ?? "truc";
  const nhan = dayLabel(day.day);

  return (
    <figure className="so-do">
      <svg viewBox="0 0 1200 900" className="so-do__svg" role="img" aria-label={day.title}>
        <Nen />
        <TieuDe chu={`${nhan} — bạn cần làm gì`} />
        {kieu === "truc" && <KieuTruc buoc={buoc} nhan={nhan} />}
        {kieu === "doc" && <KieuDoc buoc={buoc} />}
        {kieu === "luoi" && <KieuLuoi buoc={buoc} nhan={nhan} />}
        {kieu === "hang" && <KieuHang buoc={buoc} />}
        <ThuongHieu />
      </svg>
    </figure>
  );
}
