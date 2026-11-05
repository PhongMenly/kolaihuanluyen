/**
 * Nội dung khoá học — tổ chức theo NGÀY.
 *
 * Mỗi NGÀY có nhiều video bài giảng nhưng CHỈ MỘT bài tập nộp.
 *
 * THÊM VIDEO: sửa `youtubeId` thành mã video YouTube — đoạn sau "v=" trong link.
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ  ->  youtubeId: "dQw4w9WgXcQ"
 * Để trống ("") thì video đó hiện nhãn "Sắp ra mắt".
 */

export interface Lesson {
  /** Khoá định danh — ĐỪNG đổi sau khi khoá học chạy. */
  key: string;
  /** Số hiệu hiển thị, ví dụ "1.1". */
  code: string;
  title: string;
  description: string;
  /** Mã video YouTube. Để trống nếu chưa có. */
  youtubeId: string;
  /** Thời lượng, để trống nếu chưa biết. */
  duration?: string;
}

export interface Day {
  /** Khoá bài nộp — ĐỪNG đổi sau khi học viên đã nộp, sẽ mất liên kết. */
  key: string;
  /** Ngày thứ mấy của khoá. */
  day: number;
  title: string;
  subtitle: string;
  /** Các video của ngày này. */
  lessons: Lesson[];
  /** Mục tiêu của bài tập ngày này. */
  assignment: string;
  /** Danh sách cụ thể phải có trong bản Google Docs nộp lên. */
  deliverables: string[];
  /** Sơ đồ tóm tắt riêng của ngày — bỏ trống thì lấy từ SO_DO theo key. */
  soDo?: BuocSoDo[];
  /** Lời chúc riêng của ngày — bỏ trống thì lấy từ LOI_CHUC theo key. */
  loiChuc?: string[];
}

export const COURSE_OVERVIEW = {
  title: "Hệ thống huấn luyện cấp tốc của những chiến thần",
  intro:
    "Chương trình huấn luyện dành cho KOL và Affiliate Việt Nam. Mỗi ngày mở một buổi học, xem hết video rồi nộp một bài tập qua Google Docs. Mỗi bài nộp được ghi nhận bằng một huy hiệu khiên vàng trên bảng Vinh danh.",
  steps: [
    {
      title: "Xem bài giảng",
      description: "Mỗi ngày mở một buổi. Xem hết video rồi bấm “Hoàn thành” để hệ thống ghi nhận.",
    },
    {
      title: "Làm bài tập",
      description:
        "Mỗi ngày một bài tập. Làm trên Google Docs, nhớ mở quyền xem cho người có link.",
    },
    {
      title: "Nộp link",
      description:
        "Dán link Google Docs vào tab Nộp bài tập. Nộp rồi vẫn sửa link được bất cứ lúc nào.",
    },
    {
      title: "Nhận huy hiệu",
      description: "Mỗi bài nộp = 1 khiên vàng cạnh tên bạn ở bảng Vinh danh.",
    },
  ],
  scoring: [
    { label: "Nộp bài tập của một ngày", points: 10 },
    { label: "Xem xong 1 video", points: 5 },
  ],
};

/** Video giới thiệu ở Trang chủ — xem trước khi vào học. */
export const COURSE_INTRO = {
  youtubeId: "XAcAxlUrEHU",
  eyebrow: "Bắt đầu từ đây",
  title: "Tổng quan hành trình",
  description:
    "Dành 10 phút xem video này trước. Bạn sẽ hiểu toàn bộ lộ trình, cách hệ thống chấm điểm, và điều gì đang chờ ở cuối chặng đường.",
};

export const DAYS: Day[] = [
  {
    key: "ngay-1",
    day: 1,
    title: "Ngày 1 — Nền tảng công cụ AI",
    subtitle: "Hiểu bộ công cụ trước khi bắt tay làm: Skill, MCP, Sub-Agent, ChatGPT và Codex.",
    lessons: [
      {
        key: "p1-b1",
        code: "1.1",
        title: "Hiểu tổng quan về Skill · MCP · Sub-Agent",
        description:
          "Ba khái niệm nền tảng của hệ thống AI hiện đại: Skill là gì, MCP kết nối những gì, và Sub-Agent hoạt động ra sao.",
        youtubeId: "jYKzQePWbO8",
      },
      {
        key: "p1-b2",
        code: "1.2",
        title: "Hiểu tất tần tật về ChatGPT · Work · Codex",
        description:
          "Phân biệt ChatGPT, chế độ Work và Codex — cái nào dùng khi nào, mạnh yếu ở đâu.",
        youtubeId: "tCrqO_1YXTU",
        duration: "16 phút",
      },
      {
        key: "p1-b3",
        code: "1.3",
        title: "Setup cài đặt ChatGPT Codex — Cách dùng không tốn token",
        description:
          "Đăng ký tài khoản ChatGPT Plus, cài app Codex về máy, và cách dùng sao cho không đốt token.",
        youtubeId: "Is-Z7yFm6qc",
      },
    ],
    assignment: "Nắm được Skill, cài xong Codex và dùng thành thạo giao diện.",
    deliverables: [
      "Hiểu được Skill là gì và nó hoạt động như thế nào với AI Agent",
      "Tải được ChatGPT Codex về máy",
      "Làm quen được toàn bộ giao diện từ web tới app và có thể thao tác như một chuyên gia",
    ],
  },
  {
    key: "ngay-2",
    day: 2,
    title: "Ngày 2 — Từ Skill đến App bằng AI",
    subtitle:
      "Đóng gói một việc lặp đi lặp lại thành Skill, rồi biến Skill đó thành app và trang bán hàng.",
    lessons: [
      {
        key: "p2-b1",
        code: "2.1",
        title: "Khái niệm Skill và demo ảnh thương hiệu đầu tiên",
        description:
          "Skill là đóng gói một việc lặp lại để AI tự nhớ, không phải hỏi lại từ đầu. Khác khoá học ở chỗ nó là quy trình sống, không lỗi thời. Kèm công thức câu lệnh tạo ảnh theo phong cách tham chiếu.",
        youtubeId: "Rp-OETn-4RQ",
      },
      {
        key: "p2-b2",
        code: "2.2",
        title: "Đóng gói Skill ảnh thương hiệu — demo chi tiết",
        description:
          "Một Skill hoàn chỉnh gồm câu lệnh, màu thương hiệu, gương mặt và quy trình. Không cần công thức cứng — mô tả đúng ý rồi đóng gói lại, áp dụng được cho mọi lĩnh vực.",
        youtubeId: "PF4eF-ZwLYA",
      },
      {
        key: "p2-b3",
        code: "2.3",
        title: "ChatGPT vs Claude Code — từ Skill lên App",
        description:
          "So sánh ChatGPT và Claude Code khi làm Skill. Đóng gói một Skill thành app dùng trên điện thoại và máy tính, rồi chuyển giao cho người khác dùng để làm affiliate.",
        youtubeId: "_gwAqwIHaCI",
      },
      {
        key: "p2-b4",
        code: "2.4",
        title: "Deploy app, tạo trang bán hàng bằng AI",
        description:
          "Lưu Skill và app lên GitHub, Vercel để bán hoặc thu phí định kỳ. AI tự dựng một trang bán hàng chỉ từ một ảnh mẫu. Tổng kết trọn chuỗi: câu lệnh mẫu, mô tả thương hiệu, quy trình, build app.",
        youtubeId: "XlJit2a93TI",
      },
    ],
    assignment:
      "Đóng gói một việc bạn hay làm thành Skill, dùng Skill đó tạo ra sản phẩm thật và đưa lên nơi công khai.",
    deliverables: [
      "Chọn một việc bạn hay làm đi làm lại, đóng gói thành một Skill gồm câu lệnh và phong cách",
      "Dùng chính Skill đó tạo ra một sản phẩm hoàn chỉnh: một tấm ảnh hoặc một trang bán hàng",
      "Đưa sản phẩm lên một nơi công khai để dùng thật — deploy, đăng bài, hoặc gửi cho một người khác dùng thử",
    ],
  },
  {
    key: "ngay-3",
    day: 3,
    title: "Ngày 3 — Tự động hoá kênh bằng AI Agent",
    subtitle:
      "Xây kênh để bán hàng, rồi đóng gói phong cách kênh thành Skill để AI tự đăng bài đa nền tảng.",
    lessons: [
      {
        key: "p3-b1",
        code: "3.1",
        title: "Chiến lược Content Queen — xây kênh để bán hàng",
        description:
          "Xây kênh và bán hàng là hai việc khác nhau, cần hai tư duy khác nhau. Bản đồ Content Queen – Sản Phẩm Queen – Nền Tảng Queen, phễu ba tầng thu hút · uy tín · chuyển đổi, kèm hai case thật: Fan Đông Gia và anh Hữu Hoàng.",
        youtubeId: "ALlkuycPAeY",
      },
      {
        key: "p3-b2",
        code: "3.2",
        title: "Đóng gói Skill AI — tự động đăng bài đa nền tảng",
        description:
          "Đóng gói phong cách kênh thành một Skill dùng lại nhiều lần. Kết nối Facebook và TikTok để AI tự đăng bài, tự trả lời bình luận. Demo cắm kênh đối thủ vào AI, tạo sẵn 15 bài và lên lịch 15 ngày.",
        youtubeId: "yLgiJE2uhpg",
      },
    ],
    assignment:
      "Xác định vị trí của bạn trên bản đồ content, đóng gói phong cách kênh thành Skill AI và cho AI tự đăng bài.",
    deliverables: [
      "Xác định bạn đang ở nhóm nào: chưa có sản phẩm, hay có sản phẩm nhưng bí content",
      "Chọn một kênh mẫu đã viral đúng ngách của bạn và ghi ra công thức nội dung của họ",
      "Viết ra Content Queen – Sản Phẩm Queen – Nền Tảng Queen của riêng bạn",
      "Đóng gói phong cách kênh của bạn thành một Skill: ảnh đại diện, kênh mẫu, tông giọng",
      "Kết nối một nền tảng (Facebook hoặc TikTok) và thử cho AI đăng tự động một bài",
      "Cắm một kênh đối thủ vào AI, yêu cầu tạo sẵn 5 bài đăng theo đúng phong cách của họ",
    ],
  },
  {
    key: "ngay-4",
    day: 4,
    title: "Ngày 4 — Nhân bản kênh và video bằng AI",
    subtitle:
      "Từ bài viết chuyển sang video: giọng AI, ghép mặt, nhân bản kênh và lộ trình 1000 đô đầu tiên.",
    lessons: [
      {
        key: "p4-b1",
        code: "4.1",
        title: "Từ bài viết sang video — cắm kênh và tư duy nhân bản",
        description:
          "Demo giọng AI Adam. Phân biệt “cắm kênh” là học phong cách với “cắm video” là học một video mẫu. Ba câu hỏi phải đặt ra trước khi tự động hoá quy mô lớn, kèm case thật: chọn kênh 100k follow có sẵn thay vì xây từ con số không.",
        youtubeId: "v8-q-m4ZvoA",
      },
      {
        key: "p4-b2",
        code: "4.2",
        title: "AI ghép mặt làm video bán hàng — lộ trình 1000 đô đầu tiên",
        description:
          "Demo AI ghép mặt tạo video review bán hàng, không cần biết Photoshop, kèm cảnh báo đạo đức về việc dùng hình ảnh và giọng nói của người khác. Cắt một video Zoom dài thành 30 video ngắn bằng app KOLAI Global. Lộ trình từ 0 đồng tới 1000 đô đầu tiên.",
        youtubeId: "ScT2odH5YlQ",
      },
    ],
    assignment:
      "Chọn kênh để học theo, làm thử video bằng AI cho sản phẩm của bạn và viết lộ trình 1000 đô đầu tiên.",
    deliverables: [
      "Chọn một kênh 10k–100k follow đúng ngách, phân tích xem có thể “cắm” để học theo được không",
      "Tạo thử một video ngắn bằng AI (ghép mặt hoặc giọng nói) cho đúng sản phẩm bạn đang bán",
      "Viết ra lộ trình 0 đồng đến 1000 đô đầu tiên của riêng bạn: ngách gì, sản phẩm gì, nguồn lực gì",
      "Tạo một video viral có dùng giọng Adam và đăng lên kênh của bạn",
    ],
  },
  {
    key: "ngay-5",
    day: 5,
    title: "Ngày 5 — Chuyển giao Skill và trang bán hàng",
    subtitle:
      "Buổi tổng kết: nhận trọn bộ trang bán hàng cùng hai Skill, dựng thương hiệu riêng và bán những đồng đầu tiên.",
    lessons: [
      {
        key: "p5-b1",
        code: "5.1",
        title: "Tổng kết — chuyển giao Skill và trang bán hàng",
        description:
          "Ba chủ đề của buổi: thương mại, chuyển giao, rồi mời cùng phát triển cộng đồng. Chiến lược giá bậc thang, phân biệt đại sứ với đại diện, so sánh ChatGPT · Claude Code · Gemini. Demo dựng video và trang bán hàng chỉ từ một link web, rồi chuyển giao mã nguồn trang bán hàng cùng hai Skill.",
        youtubeId: "Vp_f1XALBn8",
      },
    ],
    assignment:
      "Nhận bộ chuyển giao, dựng thành trang bán hàng của riêng bạn và bán những đồng doanh thu đầu tiên.",
    deliverables: [
      "Clone trang bán hàng về máy bằng Claude Code hoặc Codex, đổi tên, màu sắc và nội dung cho đúng thương hiệu của bạn",
      "Cài hai Skill được tặng — tạo video và xây thương hiệu trang web — rồi dùng thử để làm ra ít nhất một sản phẩm hoàn chỉnh",
      "Bán thử để đạt doanh thu 500K đến 1,5 triệu trong 7 ngày, gửi bill xác nhận để được cấp giấy phép thương mại đầy đủ",
      "Giữ kín bộ tài sản này, không chia sẻ rộng ra ngoài lớp",
    ],
  },
];

/**
 * Lời chúc mừng khi học xong một bài, viết bám đúng chủ đề của ngày hôm đó.
 * Mỗi lần hiện một câu lấy ngẫu nhiên để không nhàm.
 */
const LOI_CHUC: Record<string, string[]> = {
  "ngay-1": [
    "Xong một bài. Bạn vừa thêm một công cụ vào tay nghề của mình.",
    "Hiểu được Skill là hiểu cách bảo AI làm việc thay mình. Đi tiếp nào.",
    "Nền móng chắc thì xây gì lên cũng vững. Bạn đang làm đúng thứ tự.",
    "Người khác còn đang hỏi AI từng câu, bạn thì đang học cách đóng gói nó.",
  ],
  "ngay-2": [
    "Một việc lặp đi lặp lại vừa biến thành thứ chạy được nhiều lần. Ngon.",
    "Từ câu lệnh tới sản phẩm — bạn vừa đi hết một quãng mà nhiều người bỏ dở.",
    "Skill đóng gói xong là tài sản của bạn, không phải kiến thức đi mượn.",
    "Cái bạn vừa học không cũ đi theo thời gian, vì nó là quy trình chứ không phải mẹo.",
  ],
  "ngay-3": [
    "Xây kênh và bán hàng là hai việc khác nhau. Giờ bạn phân biệt được rồi.",
    "Nội dung tự chạy, bạn rảnh tay lo phần quan trọng hơn: bán được hàng.",
    "Một kênh mẫu tốt đáng giá hơn mười ý tưởng trong đầu. Bạn vừa có công thức.",
    "Bạn đang chuyển từ làm content bằng tay sang vận hành một hệ thống.",
  ],
  "ngay-4": [
    "Từ chữ sang hình, từ hình sang video — bạn vừa lên một bậc.",
    "Nhân bản được thì quy mô không còn phụ thuộc vào số giờ bạn ngồi làm.",
    "Công cụ mạnh đi kèm trách nhiệm. Dùng đúng thì đường dài mới bền.",
    "Nghìn đô đầu tiên bắt đầu từ một ngách rõ ràng. Bạn vừa vẽ xong bản đồ.",
  ],
  "ngay-5": [
    "Bài cuối rồi. Thứ bạn vừa nhận không phải kiến thức, mà là gia sản để làm ăn.",
    "Học xong là một chuyện, bán được đồng đầu tiên mới là chuyện khác. Bắt tay vào đi.",
    "Cả chặng đường tới đây bạn đều tự đi. Phần còn lại cũng vậy thôi.",
    "Trang bán hàng, hai Skill, và một cái nghề. Giờ tới lượt bạn dùng nó.",
  ],
};

/** Một câu chúc ngẫu nhiên hợp với ngày đang học. */
export function loiChucNgauNhien(day: Day): string {
  const ds = day.loiChuc ?? LOI_CHUC[day.key] ?? ["Xong một bài. Đi tiếp thôi."];
  return ds[Math.floor(Math.random() * ds.length)];
}

/** Một bước trong sơ đồ tóm tắt của ngày. */
export interface BuocSoDo {
  /** Tên biểu tượng lucide, ánh xạ trong SoDoBaiHoc */
  icon: string;
  tieuDe: string;
  mota: string;
}

/**
 * Sơ đồ tóm tắt cuối mỗi ngày — nhìn là biết ngay phải làm gì để nộp bài.
 * Cố ý viết cực ngắn: mỗi bước vài chữ, không chép lại đề bài.
 */
export const SO_DO: Record<string, BuocSoDo[]> = {
  "ngay-1": [
    { icon: "brain", tieuDe: "Hiểu Skill", mota: "Skill · MCP · Sub-Agent" },
    { icon: "download", tieuDe: "Cài Codex", mota: "Tải về máy, đăng nhập" },
    { icon: "mouse-pointer", tieuDe: "Thạo giao diện", mota: "Thao tác web và app" },
    { icon: "file-text", tieuDe: "Nộp bài", mota: "Một link Google Docs" },
  ],
  "ngay-2": [
    { icon: "repeat", tieuDe: "Chọn việc lặp lại", mota: "Việc bạn làm hoài" },
    { icon: "package", tieuDe: "Đóng gói Skill", mota: "Câu lệnh + phong cách" },
    { icon: "layout", tieuDe: "Dựng thành App", mota: "Dùng trên máy, trên điện thoại" },
    { icon: "globe", tieuDe: "Đưa ra công khai", mota: "Deploy hoặc gửi người dùng thử" },
  ],
  "ngay-3": [
    { icon: "map", tieuDe: "Định vị bản thân", mota: "Có sản phẩm hay chưa" },
    { icon: "search", tieuDe: "Rút công thức", mota: "Từ một kênh đã viral" },
    { icon: "package", tieuDe: "Đóng gói kênh", mota: "Ảnh, kênh mẫu, tông giọng" },
    { icon: "send", tieuDe: "Cho AI đăng", mota: "Nối Facebook hoặc TikTok" },
  ],
  "ngay-4": [
    { icon: "search", tieuDe: "Chọn kênh mẫu", mota: "Loại 10k đến 100k follow" },
    { icon: "video", tieuDe: "Làm video AI", mota: "Ghép mặt hoặc giọng nói" },
    { icon: "map", tieuDe: "Vẽ lộ trình", mota: "0 đồng tới 1000 đô" },
    { icon: "send", tieuDe: "Đăng lên kênh", mota: "Một video dùng giọng Adam" },
  ],
  "ngay-5": [
    { icon: "download", tieuDe: "Clone trang bán", mota: "Đổi tên, màu, nội dung" },
    { icon: "package", tieuDe: "Cài hai Skill", mota: "Tạo video · thương hiệu web" },
    { icon: "sparkles", tieuDe: "Làm sản phẩm", mota: "Ít nhất một cái hoàn chỉnh" },
    { icon: "trending-up", tieuDe: "Bán và gửi bill", mota: "500K đến 1,5 triệu / 7 ngày" },
  ],
};

/** Tất cả video của mọi ngày, gộp phẳng. */
export const ALL_LESSONS: Lesson[] = DAYS.flatMap((d) => d.lessons);

// ─────────────────────────────────────────────────────────────
// KHOÁ SUBAGENT — dành cho tài khoản vào học chính thức từ 05/11/2026
// ─────────────────────────────────────────────────────────────

/**
 * 8 video về Subagent trên kênh @Phongmenlyaigoglobalus, xếp từ cũ tới mới.
 * Khoá bài nộp dùng lại "ngay-1".."ngay-4" để khiên, điểm và bảng xếp hạng
 * chạy như khoá cũ. Mỗi học viên chỉ học MỘT khoá nên không bao giờ trùng.
 */
export const SUBAGENT_DAYS: Day[] = [
  {
    key: "ngay-1",
    day: 1,
    title: "Ngày 1 — Subagent là gì",
    subtitle: "Hiểu kiềng 3 chân Skill · MCP · Sub-agent, rồi xem một kỹ sư SpaceX điều khiển 20 AI Agent.",
    lessons: [
      {
        key: "sa1-b1",
        code: "1.1",
        title: "3 công cụ Claude nâng cao: Skill · MCP · Sub-agent",
        description:
          "Vì sao dùng Claude mãi mà AI vẫn chưa làm thay được việc: bạn chưa có đủ kiềng 3 chân Skill, MCP và Sub-agent. Hiểu từng cái làm gì và ghép lại ra sao.",
        youtubeId: "jYKzQePWbO8",
        duration: "14 phút",
      },
      {
        key: "sa1-b2",
        code: "1.2",
        title: "Điều khiển 20 AI Agent — cách Lauren Tan (SpaceX) xây đội",
        description:
          "Xem AI như cộng sự, phê duyệt tự động, đóng gói quy trình thành Skill, một Agent quản lý điều phối các Sub-agent, đưa hệ thống lên Cloud chạy 24/7, giữ an toàn và tối ưu chi phí.",
        youtubeId: "yZCawhPmP1I",
        duration: "16 phút",
      },
    ],
    assignment: "Hiểu Subagent khác gì chatbot và vẽ ra đội Subagent đầu tiên bạn muốn có.",
    deliverables: [
      "Giải thích bằng lời của bạn: Skill, MCP và Sub-agent khác nhau thế nào",
      "Liệt kê 5 việc bạn đang làm tay mỗi tuần có thể giao cho Subagent",
      "Vẽ sơ đồ một Agent quản lý và 3 Sub-agent đầu tiên, mỗi Sub-agent làm một việc",
    ],
    soDo: [
      { icon: "brain", tieuDe: "Hiểu 3 chân", mota: "Skill · MCP · Sub-agent" },
      { icon: "search", tieuDe: "Học cách SpaceX", mota: "Một quản lý, nhiều Sub-agent" },
      { icon: "repeat", tieuDe: "Tìm việc lặp lại", mota: "5 việc làm tay mỗi tuần" },
      { icon: "file-text", tieuDe: "Nộp bài", mota: "Sơ đồ đội Subagent" },
    ],
    loiChuc: [
      "Xong một bài. Bạn vừa hiểu vì sao AI của người khác làm được việc thật.",
      "Chatbot trả lời câu hỏi, Subagent làm xong việc. Bạn đã thấy khác biệt.",
      "Một quản lý, nhiều Sub-agent — bạn đang nghĩ như người điều hành rồi đó.",
    ],
  },
  {
    key: "ngay-2",
    day: 2,
    title: "Ngày 2 — Subagent làm video",
    subtitle: "Giao trọn việc tạo video và edit video cho Subagent, bạn chỉ việc nhận kết quả.",
    lessons: [
      {
        key: "sa2-b1",
        code: "2.1",
        title: "Subagent tự động tạo video AI từ A–Z",
        description:
          "Cài bộ câu lệnh Subagent, kết nối AI Agent với công cụ tạo video, giao việc từ kịch bản tới dựng hình và xuất bản, kèm cách tối ưu chi phí khi chạy tự động.",
        youtubeId: "-1F_ytj5CNk",
        duration: "16 phút",
      },
      {
        key: "sa2-b2",
        code: "2.2",
        title: "Subagent tự động edit video: cắt khoảng lặng, phụ đề, hiệu ứng",
        description:
          "Nạp Skill, cấp quyền thư mục làm việc, giao việc cắt khoảng lặng, thêm phụ đề, chỉnh màu và hiệu ứng. Xem token tiêu hao thật, dạy Subagent học phong cách từ video mẫu và edit hàng loạt.",
        youtubeId: "Zn46ByXjZfI",
        duration: "17 phút",
      },
    ],
    assignment: "Giao cho Subagent làm ra một video hoàn chỉnh, từ tạo tới edit.",
    deliverables: [
      "Cài bộ câu lệnh Subagent tạo video và kết nối được với một công cụ tạo video",
      "Cho Subagent tạo một video ngắn cho đúng sản phẩm hoặc chủ đề của bạn",
      "Cho Subagent edit video đó: cắt khoảng lặng, thêm phụ đề, gửi link video thành phẩm",
    ],
    soDo: [
      { icon: "download", tieuDe: "Cài câu lệnh", mota: "Subagent tạo video" },
      { icon: "video", tieuDe: "Tạo video", mota: "Kịch bản tới dựng hình" },
      { icon: "sparkles", tieuDe: "Edit tự động", mota: "Cắt lặng, phụ đề, hiệu ứng" },
      { icon: "send", tieuDe: "Nộp link video", mota: "Một video thành phẩm" },
    ],
    loiChuc: [
      "Một video ra lò mà bạn không phải ngồi dựng. Đó là sức mạnh của Subagent.",
      "Từ giờ edit video là việc giao đi, không phải việc thức khuya.",
      "Bạn vừa chuyển từ người làm video sang người giao việc làm video.",
    ],
  },
  {
    key: "ngay-3",
    day: 3,
    title: "Ngày 3 — Dựng đội Subagent",
    subtitle: "Tạo nhân sự AI tự làm việc theo lịch, rồi dựng cả đội 20 Subagent chạy được luôn.",
    lessons: [
      {
        key: "sa3-b1",
        code: "3.1",
        title: "Tạo nhân sự ChatGPT Agent tự làm việc thay bạn",
        description:
          "Setup AI Agent từ số 0: đặt lịch tự chạy theo khung giờ, phân luồng việc AI tự quyết và việc cần người duyệt, nạp bộ não Subagent từ cẩm nang, demo tự trả lời bình luận và edit video.",
        youtubeId: "m6NfjUFt5qU",
        duration: "20 phút",
      },
      {
        key: "sa3-b2",
        code: "3.2",
        title: "Setup đội 20 Subagent làm việc tự động",
        description:
          "Thiết lập Subagent kết hợp MCP trên Claude Desktop: cài đặt, kết nối công cụ, nạp cẩm nang huấn luyện, chạy quy trình tạo nhân vật, hình ảnh và video tự động theo khung giờ cố định mỗi ngày.",
        youtubeId: "XnlS3U1hqss",
        duration: "23 phút",
      },
    ],
    assignment: "Dựng đội Subagent của riêng bạn và cho nó tự chạy theo lịch.",
    deliverables: [
      "Cài Claude Desktop (hoặc ChatGPT Agent) và kết nối ít nhất một công cụ qua MCP",
      "Tạo ít nhất 3 Subagent, mỗi bạn một việc rõ ràng, ghi ra việc nào AI tự quyết, việc nào cần bạn duyệt",
      "Đặt lịch cho một Subagent tự chạy mỗi ngày, chụp màn hình kết quả lần chạy đầu",
    ],
    soDo: [
      { icon: "download", tieuDe: "Cài và nối MCP", mota: "Claude Desktop + công cụ" },
      { icon: "package", tieuDe: "Tạo 3 Subagent", mota: "Mỗi bạn một việc" },
      { icon: "repeat", tieuDe: "Đặt lịch chạy", mota: "Tự làm mỗi ngày" },
      { icon: "file-text", tieuDe: "Nộp bài", mota: "Ảnh kết quả lần đầu" },
    ],
    loiChuc: [
      "Bạn vừa có nhân sự đầu tiên không cần trả lương.",
      "Một mình nhưng có cả đội. Đó là cách làm của người kinh doanh một mình thời AI.",
      "Việc chạy theo lịch thì bạn rảnh tay lo phần bán hàng.",
    ],
  },
  {
    key: "ngay-4",
    day: 4,
    title: "Ngày 4 — Vận hành cả công ty AI",
    subtitle: "Ghép các Subagent thành một công ty số tự vận hành, rồi dùng chính đội đó để thử nghiệm và ra quyết định.",
    lessons: [
      {
        key: "sa4-b1",
        code: "4.1",
        title: "Quy trình xây đội AI Agent tự động hoá toàn bộ công việc",
        description:
          "Tạo workspace như một công ty số, cho AI học DNA thương hiệu để viết bài và trả lời bình luận đúng giọng, Agent tổng điều phối các Sub-agent, quản lý tiến độ bằng Notion và điều khiển từ xa bằng điện thoại.",
        youtubeId: "wQHMGdYhegk",
        duration: "27 phút",
      },
      {
        key: "sa4-b2",
        code: "4.2",
        title: "Dùng Subagent thử nghiệm mô hình tạo ảnh AI",
        description:
          "Giao Subagent chạy tạo ảnh hàng loạt với Nano Banana 2, 2.1 và GPT Image 2.5 bằng cùng bộ lệnh và ảnh gốc, rồi so độ chân thực khuôn mặt, trang phục, chi tiết để chọn mô hình tốt nhất.",
        youtubeId: "Xd5-Vx7HvSk",
        duration: "17 phút",
      },
    ],
    assignment: "Ghép đội Subagent thành một hệ thống tự vận hành và dùng nó làm một việc thật cho công việc của bạn.",
    deliverables: [
      "Dựng một Agent tổng điều phối giao việc cho các Sub-agent của bạn",
      "Cho AI học giọng thương hiệu của bạn và viết một bài đăng đúng giọng",
      "Giao đội Subagent chạy một thử nghiệm thật (so mô hình ảnh, so câu lệnh…) và ghi lại kết luận",
      "Điều khiển hệ thống từ điện thoại ít nhất một lần, chụp màn hình làm bằng chứng",
    ],
    soDo: [
      { icon: "layout", tieuDe: "Dựng công ty số", mota: "Một Agent tổng điều phối" },
      { icon: "brain", tieuDe: "Nạp DNA", mota: "Giọng thương hiệu của bạn" },
      { icon: "search", tieuDe: "Chạy thử nghiệm", mota: "Để đội tự so và kết luận" },
      { icon: "trending-up", tieuDe: "Điều khiển từ xa", mota: "Ra lệnh bằng điện thoại" },
    ],
    loiChuc: [
      "Bài cuối rồi. Bạn không còn dùng AI nữa — bạn đang điều hành nó.",
      "Một công ty số chạy bằng Subagent. Giờ đem nó đi kiếm tiền thôi.",
      "Cả chặng đường tới đây bạn đều tự đi. Đội Subagent sẽ đi cùng bạn phần còn lại.",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// CHỌN KHOÁ THEO TÀI KHOẢN
// ─────────────────────────────────────────────────────────────

export type CourseId = "skill" | "subagent";

export interface Course {
  id: CourseId;
  days: Day[];
  lessons: Lesson[];
  intro: typeof COURSE_INTRO;
}

/**
 * Mốc chuyển khoá: ai hoàn tất đăng ký (onboarded_at) từ 00:00 ngày 05/11/2026
 * giờ Việt Nam trở đi thì học khoá Subagent. Người vào trước giữ khoá Skill.
 */
export const SUBAGENT_FROM = "2026-11-04T17:00:00Z";

export const COURSES: Record<CourseId, Course> = {
  skill: { id: "skill", days: DAYS, lessons: ALL_LESSONS, intro: COURSE_INTRO },
  subagent: {
    id: "subagent",
    days: SUBAGENT_DAYS,
    lessons: SUBAGENT_DAYS.flatMap((d) => d.lessons),
    intro: {
      youtubeId: "ehR6ZsEy5is",
      eyebrow: "Bắt đầu từ đây",
      title: "Subagent đã lớn thế nào trong 2 tháng",
      description:
        "Dành 3 phút xem video này trước. Bạn sẽ thấy Subagent làm được gì, rồi đi lần lượt 4 ngày học từ hiểu khái niệm tới vận hành cả một công ty AI.",
    },
  },
};

/** Khoá học của một tài khoản, tính theo ngày hoàn tất đăng ký. */
export function courseIdFor(onboardedAt: string | null | undefined): CourseId {
  if (!onboardedAt) return "skill";
  return new Date(onboardedAt).getTime() >= new Date(SUBAGENT_FROM).getTime()
    ? "subagent"
    : "skill";
}

export function courseFor(onboardedAt: string | null | undefined): Course {
  return COURSES[courseIdFor(onboardedAt)];
}

export function findLesson(key: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.key === key);
}

export function findDay(key: string, days: Day[] = DAYS): Day | undefined {
  return days.find((d) => d.key === key);
}

/** Ngày chứa video này. */
export function dayOfLesson(lessonKey: string, days: Day[] = DAYS): Day | undefined {
  return days.find((d) => d.lessons.some((l) => l.key === lessonKey));
}

export const POINTS_PER_SUBMISSION = 10;
export const POINTS_PER_VIDEO = 5;

// ─────────────────────────────────────────────────────────────
// LỊCH MỞ KHOÁ & HẠN NỘP
// ─────────────────────────────────────────────────────────────

/**
 * Ngày khai giảng — MỐC GỐC cho cả lịch mở khoá lẫn hạn nộp.
 * Định dạng YYYY-MM-DD, theo giờ Việt Nam. ĐỔI KHI MỞ LỚP MỚI.
 */
export const COURSE_START_DATE = "2026-08-30";

/**
 * MỞ TOÀN BỘ KHOÁ HỌC.
 * Bật lên thì bỏ hết mọi rào: không cần chờ tới ngày, không cần nộp bài
 * ngày trước, không cần xem hết video mới được nộp.
 * Muốn khoá lại theo trình tự cũ thì đổi thành false.
 */
export const MO_TOAN_BO = true;

/** Nhãn hiển thị: "Ngày 1", "Ngày 2"... */
export function dayLabel(day: number): string {
  return "Ngày " + day;
}

/** Mốc mở khoá của một ngày — 00:00 giờ Việt Nam. */
export function getDayOpenDate(day: number): Date {
  const [y, m, d] = COURSE_START_DATE.split("-").map(Number);
  // 00:00 giờ VN (UTC+7) = 17:00 UTC ngày hôm trước
  return new Date(Date.UTC(y, m - 1, d + (day - 1) - 1, 17, 0, 0));
}

/** Hạn nộp bài của một ngày — 23:59:59 giờ Việt Nam của chính ngày đó. */
export function getDayDeadline(day: number): Date {
  const [y, m, d] = COURSE_START_DATE.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + (day - 1), 16, 59, 59));
}

/** Ngày này đã tới lịch mở chưa. */
export function isDayOpen(day: number, now: Date = new Date()): boolean {
  return now.getTime() >= getDayOpenDate(day).getTime();
}

/** Ngày mở dạng dd/mm để hiện cho học viên. */
export function formatOpenDate(day: number): string {
  return getDayOpenDate(day).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/** Lý do một ngày chưa mở được. */
export type LockReason =
  | { locked: false }
  | { locked: true; kind: "date"; openDate: string }
  | { locked: true; kind: "prev"; needDay: number }
  | { locked: true; kind: "video"; done: number; total: number };

/**
 * Ngày này đã mở cho học viên chưa.
 * Phải thoả: đã tới lịch, VÀ đã nộp bài mọi ngày trước đó.
 */
export function dayLockState(
  day: number,
  submittedKeys: Set<string>,
  now: Date = new Date(),
  days: Day[] = DAYS,
): LockReason {
  if (MO_TOAN_BO) return { locked: false };

  if (!isDayOpen(day, now)) {
    return { locked: true, kind: "date", openDate: formatOpenDate(day) };
  }
  // Ngày trước chưa nộp thì chưa được học tiếp
  for (const d of days) {
    if (d.day < day && !submittedKeys.has(d.key)) {
      return { locked: true, kind: "prev", needDay: d.day };
    }
  }
  return { locked: false };
}

/**
 * Được nộp bài của ngày này chưa.
 * Ngoài điều kiện mở khoá, còn phải XEM HẾT video của ngày đó.
 */
export function submitLockState(
  day: Day,
  submittedKeys: Set<string>,
  watchedKeys: Set<string>,
  now: Date = new Date(),
  days: Day[] = DAYS,
): LockReason {
  if (MO_TOAN_BO) return { locked: false };

  const base = dayLockState(day.day, submittedKeys, now, days);
  if (base.locked) return base;

  const done = day.lessons.filter((l) => watchedKeys.has(l.key)).length;
  if (done < day.lessons.length) {
    return { locked: true, kind: "video", done, total: day.lessons.length };
  }
  return { locked: false };
}

export interface DeadlineInfo {
  day: Day;
  deadline: Date;
  overdue: boolean;
}

/** Tất cả ngày kèm hạn nộp, theo thứ tự. */
export function allDeadlines(now: Date = new Date(), days: Day[] = DAYS): DeadlineInfo[] {
  return days.map((day) => {
    const deadline = getDayDeadline(day.day);
    return { day, deadline, overdue: now.getTime() > deadline.getTime() };
  });
}

/** Ngày đang tới hạn: ngày gần nhất chưa quá hạn. Hết hạn tất cả thì null. */
export function currentDeadline(
  now: Date = new Date(),
  days: Day[] = DAYS,
): DeadlineInfo | null {
  return allDeadlines(now, days).find((d) => !d.overdue) ?? null;
}
