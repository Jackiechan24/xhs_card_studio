const {
  ItemView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  MarkdownRenderer,
  setIcon,
  normalizePath
} = require("obsidian");

const VIEW_TYPE = "xhs-card-studio-view";
const DEFAULT_IMAGE_RADIUS = 0;
const HUAWEI_DETAIL_BACKGROUND = "#eaf7ff";
const HUAWEI_DETAIL_BACKGROUND_TOP = "#fbfdff";
const HUAWEI_DETAIL_BACKGROUND_BOTTOM = "#d7edff";

const DEFAULT_SETTINGS = {
  assetFolder: "xhs-assets",
  exportScale: 3,
  drafts: {}
};

// Saved notes may still reference these legacy cover styles by ID.
const RETIRED_COVER_STYLE_IDS = new Set([
  "ai-course", "clean-gradient", "huawei-product", "instagram-gradient", "google-search",
  "ux-green", "grid-photo-blue", "google-omni", "minimal-grid-gray",
  "hero-blue-purple", "saas-green-formula", "dark-fresh-green"
]);

const ACTIVE_COVER_STYLE_IDS = new Set(["composition", "neon-grid", "nng-red-system"]);

const COVER_LAYOUT_PRESETS = [
  {
    id: "none",
    background: "",
    accent: "",
    secondary: "",
    text: "",
    gradientFrom: "",
    gradientTo: ""
  },
  {
    id: "nng-red-system",
    background: "#8d252b",
    accent: "#fdb88c",
    secondary: "#f2aff3",
    text: "#050505",
    gradientFrom: "#fdb88c",
    gradientTo: "#f2aff3"
  },
];

function isSupportedCoverStyle(id) {
  return ACTIVE_COVER_STYLE_IDS.has(id)
    || RETIRED_COVER_STYLE_IDS.has(id);
}

const CLEAN_GRADIENT_PALETTES = [
  {
    id: "apple-light-blue",
    name: "Mac 银蓝",
    background: "#f5f5f7",
    accent: "#0071e3",
    secondary: "#e8f2ff",
    text: "#1d1d1f",
    gradientFrom: "#0071e3",
    gradientTo: "#af52de"
  },
  {
    id: "apple-spectrum",
    name: "首页彩虹",
    background: "#fbfbfd",
    accent: "#06c",
    secondary: "#f2f2f7",
    text: "#1d1d1f",
    gradientFrom: "#007aff",
    gradientTo: "#ff2d55"
  },
  {
    id: "apple-pro-dark",
    name: "Pro 银色",
    background: "#f5f5f7",
    accent: "#8e8e93",
    secondary: "#e5e5ea",
    text: "#1d1d1f",
    gradientFrom: "#3a3a3c",
    gradientTo: "#d1d1d6"
  },
  {
    id: "apple-warm-titanium",
    name: "iPhone Pro 橙",
    background: "#fff8f2",
    accent: "#c75b12",
    secondary: "#f7e4d2",
    text: "#1d1d1f",
    gradientFrom: "#ff7a1a",
    gradientTo: "#ff3b30"
  },
  {
    id: "apple-air-sky",
    name: "iPhone Air 蓝",
    background: "#f7fbff",
    accent: "#007aff",
    secondary: "#eaf6ff",
    text: "#1d1d1f",
    gradientFrom: "#58a6ff",
    gradientTo: "#7dd8ff"
  }
];

const CLEAN_GRADIENT_PRESETS = [
  {
    id: "iphone-pro-orange",
    name: "iPhone Pro 橙",
    from: "#bf4800",
    to: "#d70015",
    accent: "#c75b12",
    stops: ["#bf4800", "#e85d00", "#ff453a", "#d70015"]
  },
  {
    id: "iphone-air-blue",
    name: "iPhone Air 蓝",
    from: "#006edb",
    to: "#5856d6",
    accent: "#007aff",
    stops: ["#006edb", "#0a84ff", "#2997ff", "#5856d6"]
  },
  {
    id: "macbook-blue-purple",
    name: "Mac 疾速",
    from: "#6e6aa8",
    to: "#426f89",
    accent: "#6e8fa2",
    stops: ["#6e6aa8", "#5f7faa", "#4e8fa3", "#426f89"]
  },
  {
    id: "apple-spectrum",
    name: "Apple 彩虹",
    from: "#f5b544",
    to: "#0071e3",
    accent: "#0071e3",
    stops: ["#f5b544", "#ff8a00", "#0a84ff", "#45c6d8"]
  },
  {
    id: "pro-night",
    name: "Mac 彩虹",
    from: "#ffcc00",
    to: "#0a84ff",
    accent: "#0071e3",
    stops: ["#ffcc00", "#ff9500", "#ff2d55", "#af52de", "#5856d6", "#0a84ff", "#32d74b"]
  }
];

const APPLE_TEXT_COLOR_PRESETS = [
  { id: "apple-solid-iphone-orange", name: "iPhone 橙", type: "solid", color: "#ff4500" },
  { id: "apple-solid-iphone-violet", name: "iPhone 紫", type: "solid", color: "#8668ff" },
  { id: "apple-solid-iphone-yellow", name: "iPhone 黄", type: "solid", color: "#ffe045" },
  { id: "apple-solid-air-bluegray", name: "Air 蓝灰", type: "solid", color: "#606f7f" },
  { id: "apple-solid-ipad-blue", name: "iPad 蓝", type: "solid", color: "#0093ff" },
  { id: "apple-solid-ipad-pink", name: "iPad 粉", type: "solid", color: "#ff0592" },
  { id: "apple-solid-ipad-yellow", name: "iPad 黄", type: "solid", color: "#ffb62f" },
  { id: "apple-solid-ipad-teal", name: "iPad 青", type: "solid", color: "#479eae" },
  { id: "apple-solid-ipad-purple", name: "iPad 紫", type: "solid", color: "#8168f5" },
  { id: "apple-solid-ipad-copper", name: "iPad 铜橙", type: "solid", color: "#dd763c" },
  { id: "apple-solid-mini-orange", name: "mini 橙", type: "solid", color: "#f56300" },
  { id: "apple-solid-air-sky", name: "Air 浅蓝", type: "solid", color: "#d0eaf4" },
  {
    id: "apple-grad-ai-spectrum",
    name: "AI 彩色",
    type: "gradient",
    from: "#0894ff",
    to: "#ff9004",
    stops: ["#0894ff", "#c959dd", "#ff2e54", "#ff9004"]
  },
  {
    id: "apple-grad-iphone-nature",
    name: "iPhone 自然",
    type: "gradient",
    from: "#a977c8",
    to: "#1d1d1f",
    stops: ["#a977c8", "#6f8cc7", "#639a47", "#1d1d1f"]
  },
  {
    id: "apple-grad-iphone-berry",
    name: "莓紫径向",
    type: "gradient",
    from: "#c53c6f",
    to: "#664ca6",
    stops: ["#c53c6f", "#bf3b87", "#8647b2", "#664ca6"]
  },
  {
    id: "apple-grad-air-titanium",
    name: "Air 钛灰",
    type: "gradient",
    from: "#7a8fa4",
    to: "#f5f5f7",
    stops: ["#7a8fa4", "#f5f5f7"]
  },
  {
    id: "apple-grad-ipad-yellow-green",
    name: "黄绿",
    type: "gradient",
    from: "#f7b500",
    to: "#6dd400",
    stops: ["#f7b500", "#6dd400"]
  },
  {
    id: "apple-grad-ipad-cyan-green",
    name: "青绿",
    type: "gradient",
    from: "#8acad2",
    to: "#c0d590",
    stops: ["#8acad2", "#c0d590"]
  },
  {
    id: "apple-grad-ipad-blue-green",
    name: "蓝青绿",
    type: "gradient",
    from: "#336cd3",
    to: "#c0d590",
    stops: ["#336cd3", "#8acad2", "#c0d590"]
  },
  {
    id: "apple-grad-ipad-air-blue",
    name: "Air 蓝光",
    type: "gradient",
    from: "#004c94",
    to: "#297bc4",
    stops: ["#004c94", "#297bc4"]
  },
  {
    id: "apple-grad-mini-blue-pink",
    name: "蓝粉",
    type: "gradient",
    from: "#0090f5",
    to: "#e151cf",
    stops: ["#0090f5", "#bb64ff", "#e151cf"]
  },
  {
    id: "apple-grad-mini-purple-red",
    name: "紫红",
    type: "gradient",
    from: "#6604e8",
    to: "#ee104d",
    stops: ["#6604e8", "#e210d2", "#ee104d"]
  },
  {
    id: "apple-grad-mini-magenta-orange",
    name: "玫橙",
    type: "gradient",
    from: "#ea28c8",
    to: "#ff5400",
    stops: ["#ea28c8", "#f23c73", "#ff5400"]
  },
  {
    id: "apple-grad-mini-blue-purple",
    name: "蓝紫",
    type: "gradient",
    from: "#557cfa",
    to: "#9e66fc",
    stops: ["#557cfa", "#9e66fc"]
  },
  {
    id: "apple-grad-mini-pink",
    name: "粉紫",
    type: "gradient",
    from: "#d457e9",
    to: "#ec4594",
    stops: ["#d457e9", "#ec4594"]
  },
  {
    id: "apple-grad-mini-red-orange",
    name: "红橙",
    type: "gradient",
    from: "#f24167",
    to: "#f55502",
    stops: ["#f24167", "#f55502"]
  }
];

const APPLE_PRODUCT_TITLE_COLOR_PRESETS = APPLE_TEXT_COLOR_PRESETS.map((item) => Object.assign({}, item));

const CONTENT_FONT_STACK = '"SF Pro"';

const TITLE_ART_FONT_PRESETS = {
  cn: [
    { id: "none", name: "默认", fontFamily: "", canvasFontFamily: "", fontStyle: "normal", fontWeight: 0 },
    { id: "cn-hand", name: "中文手写", fontFamily: "", canvasFontFamily: "", fontStyle: "normal", fontWeight: 0 },
    { id: "cn-rounded", name: "中文圆润", fontFamily: "", canvasFontFamily: "", fontStyle: "normal", fontWeight: 0 },
    { id: "cn-slant", name: "中文斜体", fontFamily: "", canvasFontFamily: "", fontStyle: "normal", fontWeight: 0 }
  ],
  en: [
    { id: "none", name: "Default", fontFamily: "", canvasFontFamily: "", fontStyle: "normal", fontWeight: 0 },
    { id: "en-air", name: "SF Pro Italic", fontFamily: CONTENT_FONT_STACK, canvasFontFamily: CONTENT_FONT_STACK, fontStyle: "italic", fontWeight: 500 },
    { id: "en-script", name: "SF Pro Italic", fontFamily: CONTENT_FONT_STACK, canvasFontFamily: CONTENT_FONT_STACK, fontStyle: "italic", fontWeight: 500 },
    { id: "en-rounded", name: "SF Pro 粗体", fontFamily: CONTENT_FONT_STACK, canvasFontFamily: CONTENT_FONT_STACK, fontStyle: "normal", fontWeight: 700 }
  ]
};

const HUAWEI_PALETTES = [
  {
    id: "huawei-pura-white",
    name: "Pura 云白",
    background: "#f6f3ec",
    accent: "#c8a45d",
    secondary: "#efe6d5",
    text: "#1f1f1f",
    gradientFrom: "#f7ead0",
    gradientTo: "#b8924d"
  },
  {
    id: "huawei-pura-red",
    name: "Pura 绯红",
    background: "#fff5f4",
    accent: "#b61d2a",
    secondary: "#f1d6d8",
    text: "#181818",
    gradientFrom: "#e2363f",
    gradientTo: "#8d111b"
  },
  {
    id: "huawei-mate-black",
    name: "Mate 玄银",
    background: "#f3f4f1",
    accent: "#d7b56d",
    secondary: "#e8e2d2",
    text: "#1f1f1f",
    gradientFrom: "#f5d88b",
    gradientTo: "#8e6a2f"
  },
  {
    id: "huawei-x-green",
    name: "Mate X 青",
    background: "#eff6f2",
    accent: "#1e7d61",
    secondary: "#d7e8df",
    text: "#17201c",
    gradientFrom: "#56b99b",
    gradientTo: "#0f6d55"
  },
  {
    id: "huawei-ultimate-gold",
    name: "非凡暖金",
    background: "#fbf6ea",
    accent: "#d8b36a",
    secondary: "#ead8b0",
    text: "#241d12",
    gradientFrom: "#f6d889",
    gradientTo: "#7f5520"
  }
];

const HUAWEI_PALETTE_GRADIENTS = {
  "huawei-pura-white": "pura-silk-gold",
  "huawei-pura-red": "pura-rose-red",
  "huawei-mate-black": "mate-black-gold",
  "huawei-x-green": "mate-x-jade",
  "huawei-ultimate-gold": "ultimate-copper"
};

const HUAWEI_GRADIENT_PRESETS = [
  {
    id: "pura-silk-gold",
    name: "Pura 金影",
    from: "#b27a22",
    to: "#8a5d1f",
    accent: "#d46a1f",
    stops: ["#b27a22", "#d59d3d", "#c99334", "#8a5d1f"]
  },
  {
    id: "pura-rose-red",
    name: "Pura 红影",
    from: "#9d1022",
    to: "#c75b12",
    accent: "#b61d2a",
    stops: ["#9d1022", "#c91f32", "#e2363f", "#c75b12"]
  },
  {
    id: "mate-x-jade",
    name: "折叠青玉",
    from: "#0f6d55",
    to: "#2b8c73",
    accent: "#1e7d61",
    stops: ["#0f6d55", "#1e8a6c", "#35a886", "#2b8c73"]
  },
  {
    id: "mate-black-gold",
    name: "Mate 黑金",
    from: "#5b4321",
    to: "#8e6a2f",
    accent: "#d7b56d",
    stops: ["#5b4321", "#8e6a2f", "#c99334", "#9a6f2e"]
  },
  {
    id: "ultimate-copper",
    name: "非凡鎏金",
    from: "#8d111b",
    to: "#b27a22",
    accent: "#d8b36a",
    stops: ["#8d111b", "#b8202a", "#c8872a", "#b27a22"]
  }
];

const HUAWEI_TEXT_COLOR_PRESETS = [
  { id: "huawei-solid-ink", name: "原石黑", type: "solid", color: "#1f1f1f" },
  { id: "huawei-solid-warm", name: "陶瓷白", type: "solid", color: "#f7f0df" },
  { id: "huawei-solid-gold", name: "流金", type: "solid", color: "#d7b56d" },
  { id: "huawei-solid-red", name: "Pura 红", type: "solid", color: "#b61d2a" },
  { id: "huawei-solid-jade", name: "Mate 青", type: "solid", color: "#1e7d61" },
  { id: "huawei-solid-ultimate", name: "非凡金", type: "solid", color: "#f0cf7c" },
  { id: "huawei-grad-pura-gold", name: "Pura 金影", type: "gradient", gradientPreset: "pura-silk-gold" },
  { id: "huawei-grad-rose", name: "Pura 红影", type: "gradient", gradientPreset: "pura-rose-red" },
  { id: "huawei-grad-jade", name: "折叠青玉", type: "gradient", gradientPreset: "mate-x-jade" },
  { id: "huawei-grad-black-gold", name: "Mate 黑金", type: "gradient", gradientPreset: "mate-black-gold" },
  { id: "huawei-grad-red-gold", name: "非凡鎏金", type: "gradient", gradientPreset: "ultimate-copper" }
];

const INSTAGRAM_PALETTES = [
  {
    id: "ig-classic",
    name: "经典渐变",
    background: "#fff7fb",
    accent: "#d62976",
    secondary: "#ffe2b8",
    text: "#111111",
    gradientFrom: "#405de6",
    gradientTo: "#fcb045"
  },
  {
    id: "ig-reels-dark",
    name: "Reels 亮白",
    background: "#f6fbff",
    accent: "#ff0050",
    secondary: "#d9fbff",
    text: "#111111",
    gradientFrom: "#00f2ea",
    gradientTo: "#ff0050"
  },
  {
    id: "ig-soft-white",
    name: "清爽白底",
    background: "#fbfbfb",
    accent: "#c13584",
    secondary: "#f1edf7",
    text: "#111111",
    gradientFrom: "#e1306c",
    gradientTo: "#fcb045"
  },
  {
    id: "ig-story-pink",
    name: "Story 粉紫",
    background: "#fff3f8",
    accent: "#c13584",
    secondary: "#f3d8ff",
    text: "#171717",
    gradientFrom: "#bc2a8d",
    gradientTo: "#fccc63"
  },
  {
    id: "ig-night-blue",
    name: "淡紫夜光",
    background: "#f4f0ff",
    accent: "#5851db",
    secondary: "#e6dcff",
    text: "#171326",
    gradientFrom: "#405de6",
    gradientTo: "#833ab4"
  }
];

const INSTAGRAM_PALETTE_GRADIENTS = {
  "ig-classic": "ig-spectrum",
  "ig-reels-dark": "ig-reels-neon",
  "ig-soft-white": "ig-soft-sunset",
  "ig-story-pink": "ig-story-ring",
  "ig-night-blue": "ig-blue-violet"
};

const INSTAGRAM_GRADIENT_PRESETS = [
  {
    id: "ig-spectrum",
    name: "经典光谱",
    from: "#405de6",
    to: "#fcb045",
    accent: "#d62976",
    stops: ["#405de6", "#6251d8", "#833ab4", "#c13584", "#e1306c", "#f56040", "#fcb045"]
  },
  {
    id: "ig-story-ring",
    name: "Story 圆环",
    from: "#feda75",
    to: "#4f5bd5",
    accent: "#d62976",
    stops: ["#feda75", "#f77737", "#e1306c", "#bc2a8d", "#6f45c9", "#4f5bd5"]
  },
  {
    id: "ig-reels-neon",
    name: "Reels 霓虹",
    from: "#00f2ea",
    to: "#ff0050",
    accent: "#ff0050",
    stops: ["#00d8d6", "#405de6", "#6f45c9", "#c13584", "#ff0050"]
  },
  {
    id: "ig-soft-sunset",
    name: "柔粉日落",
    from: "#d62976",
    to: "#f77737",
    accent: "#e1306c",
    stops: ["#c13584", "#d62976", "#e85d75", "#f77737", "#fcb045"]
  },
  {
    id: "ig-blue-violet",
    name: "蓝紫夜光",
    from: "#405de6",
    to: "#c13584",
    accent: "#5851db",
    stops: ["#405de6", "#5851db", "#6f45c9", "#833ab4", "#a83bb7", "#c13584"]
  }
];

const INSTAGRAM_TEXT_COLOR_PRESETS = [
  { id: "ig-solid-black", name: "Instagram 黑", type: "solid", color: "#111111" },
  { id: "ig-solid-gray", name: "Instagram 灰", type: "solid", color: "#737373" },
  { id: "ig-solid-white", name: "Instagram 白", type: "solid", color: "#ffffff" },
  { id: "ig-solid-pink", name: "Instagram 玫红", type: "solid", color: "#e1306c" },
  { id: "ig-solid-blue", name: "Instagram 蓝", type: "solid", color: "#405de6" },
  { id: "ig-grad-spectrum", name: "Instagram 光谱", type: "gradient", gradientPreset: "ig-spectrum" },
  { id: "ig-grad-story", name: "Story 圆环", type: "gradient", gradientPreset: "ig-story-ring" },
  { id: "ig-grad-reels", name: "Reels 霓虹", type: "gradient", gradientPreset: "ig-reels-neon" },
  { id: "ig-grad-sunset", name: "柔粉日落", type: "gradient", gradientPreset: "ig-soft-sunset" },
  { id: "ig-grad-violet", name: "蓝紫夜光", type: "gradient", gradientPreset: "ig-blue-violet" }
];

const GOOGLE_PALETTES = [
  {
    id: "google-home",
    name: "首页白底",
    background: "#ffffff",
    accent: "#1a73e8",
    secondary: "#f8fafd",
    text: "#202124",
    gradientFrom: "#4285f4",
    gradientTo: "#34a853"
  },
  {
    id: "google-blue",
    name: "搜索蓝",
    background: "#f8fbff",
    accent: "#1a73e8",
    secondary: "#e8f0fe",
    text: "#202124",
    gradientFrom: "#1a73e8",
    gradientTo: "#34a853"
  },
  {
    id: "google-play",
    name: "四色柔光",
    background: "#fbfcff",
    accent: "#ea4335",
    secondary: "#fef7e0",
    text: "#202124",
    gradientFrom: "#4285f4",
    gradientTo: "#fbbc04"
  },
  {
    id: "google-mint",
    name: "绿色增长",
    background: "#f7fbf8",
    accent: "#34a853",
    secondary: "#e6f4ea",
    text: "#202124",
    gradientFrom: "#34a853",
    gradientTo: "#1a73e8"
  },
  {
    id: "google-gray",
    name: "Material 浅灰",
    background: "#f8fafd",
    accent: "#5f6368",
    secondary: "#eef2f7",
    text: "#202124",
    gradientFrom: "#5f6368",
    gradientTo: "#1a73e8"
  }
];

const GOOGLE_PALETTE_GRADIENTS = {
  "google-home": "google-logo",
  "google-blue": "google-search-blue",
  "google-play": "google-play-spectrum",
  "google-mint": "google-green-blue",
  "google-gray": "google-material"
};

const GOOGLE_GRADIENT_PRESETS = [
  {
    id: "google-logo",
    name: "Google 四色",
    from: "#4285f4",
    to: "#34a853",
    accent: "#1a73e8",
    stops: ["#4285f4", "#ea4335", "#fbbc04", "#4285f4", "#34a853", "#ea4335"]
  },
  {
    id: "google-search-blue",
    name: "搜索蓝绿",
    from: "#1a73e8",
    to: "#34a853",
    accent: "#1a73e8",
    stops: ["#1a73e8", "#4285f4", "#34a853"]
  },
  {
    id: "google-play-spectrum",
    name: "Play 彩色",
    from: "#4285f4",
    to: "#fbbc04",
    accent: "#ea4335",
    stops: ["#4285f4", "#34a853", "#fbbc04", "#ea4335"]
  },
  {
    id: "google-green-blue",
    name: "绿蓝渐变",
    from: "#34a853",
    to: "#4285f4",
    accent: "#34a853",
    stops: ["#34a853", "#0f9d58", "#1a73e8", "#4285f4"]
  },
  {
    id: "google-material",
    name: "Material 蓝灰",
    from: "#3c4043",
    to: "#1a73e8",
    accent: "#1a73e8",
    stops: ["#3c4043", "#5f6368", "#1a73e8", "#4285f4"]
  }
];

const GOOGLE_TEXT_COLOR_PRESETS = [
  { id: "google-solid-ink", name: "Google 黑", type: "solid", color: "#202124" },
  { id: "google-solid-gray", name: "Google 灰", type: "solid", color: "#5f6368" },
  { id: "google-solid-blue", name: "Google 蓝", type: "solid", color: "#1a73e8" },
  { id: "google-solid-red", name: "Google 红", type: "solid", color: "#ea4335" },
  { id: "google-solid-yellow", name: "Google 黄", type: "solid", color: "#fbbc04" },
  { id: "google-solid-green", name: "Google 绿", type: "solid", color: "#34a853" },
  { id: "google-grad-logo", name: "Google 四色", type: "gradient", gradientPreset: "google-logo" },
  { id: "google-grad-search", name: "搜索蓝绿", type: "gradient", gradientPreset: "google-search-blue" },
  { id: "google-grad-play", name: "Play 彩色", type: "gradient", gradientPreset: "google-play-spectrum" },
  { id: "google-grad-green", name: "绿蓝渐变", type: "gradient", gradientPreset: "google-green-blue" },
  { id: "google-grad-material", name: "Material 蓝灰", type: "gradient", gradientPreset: "google-material" }
];


const VISUAL_RULES = Object.freeze({
  width:1080,height:1440,unit:8,margin:72,gutter:24,column:136,content:936,
  body:36,bodyLarge:40,bodyWeight:400,bodyLeading:1.6,caption:30,captionLeading:1.5,
  headingWeight:600,headingLeading:1.3,primaryLeading:1.2,
  coverTitle:100,coverTitleLeading:1.1,magazineTitle:132,magazineTitleLeading:1.1,
  subtitle:40,subtitleLeading:1.35,description:36,descriptionLeading:1.5,
  cardPadding:32,cardGap:32,titleGap:16,fieldGap:24,radius:8,marker:8,
  background:'#f5f5f7',ink:'#1d1d1f',bodyInk:'#3a3a3c',muted:'#595959',accent:'#0066cc',surface:'#ffffff',media:'#f5f5f5',
  dividerWidth:2,dividerColor:'#e1e1e1',
  capacityReserve:64,tabMinHeight:240,tabHeightRatio:.6,parallelHeightRatio:.5,
  paginationReserve:8,paginationMinLines:1,
  valueLines:3,descriptionLines:4,noteLines:3,groupTitleLines:3,groupBodyLines:4,
  ordinalMin:32,metricScale:8/3,metricLeading:1.05
});

const DEFAULT_CONFIG = {
  xhs_style: "composition",
  composition_layout: "vertical",
  composition_variant: "headline-band",
  composition_theme: "auto",
  composition_custom_colors: {},
  composition_appearance_by_layout: {},
  composition_description: "",
  composition_image: "",
  composition_modules_by_layout: {},
  xhs_width: 1080,
  xhs_height: 1440,
  big_title: "",
  sub_title: "",
  small_title: "",
  title: "AI赋能职场",
  title_prefix: "普通人",
  title_secondary: "如何入局",
  subtitle: "掌握职场AI技能",
  kicker: "AI EMPOWERS\nTHE WORKPLACE",
  english: "TOURIST GUIDE",
  brand: "@ 知数先生",
  title_highlight: "",
  cover_highlight_color: "",
  cover_layout_preset: "none",
  apple_text_color_preset: "apple-grad-ai-spectrum",
  clean_palette: "apple-light-blue",
  title_gradient_enabled: false,
  title_gradient_preset: "",
  title_gradient_from: "#0894ff",
  title_gradient_to: "#ff9004",
  title_gradient_stops: ["#0894ff", "#c959dd", "#ff2e54", "#ff9004"],
  title_art_font_cn: "none",
  title_art_font_en: "none",
  huawei_palette: "huawei-pura-white",
  huawei_text_color_preset: "huawei-grad-pura-gold",
  huawei_gradient_enabled: true,
  huawei_gradient_preset: "pura-silk-gold",
  huawei_gradient_from: "#ff7a18",
  huawei_gradient_to: "#ffcf7a",
  instagram_palette: "ig-classic",
  instagram_text_color_preset: "ig-grad-spectrum",
  instagram_gradient_enabled: true,
  instagram_gradient_preset: "ig-spectrum",
  instagram_gradient_from: "#405de6",
  instagram_gradient_to: "#fcb045",
  google_palette: "google-home",
  google_text_color_preset: "google-grad-logo",
  google_gradient_enabled: true,
  google_gradient_preset: "google-logo",
  google_gradient_from: "#4285f4",
  google_gradient_to: "#34a853",
  bubble_title: "<从0到1>",
  bubble_subtitle: "掌握职场AI技能",
  footer: "每天3分钟，新媒体运营其实很简单",
  proof: "实战教学+案例拆解",
  cta: "千万要看>>",
  date_label: "开展时间",
  date_value: "8.7-8.17",
  tags: ["#电商客服", "#视频剪辑", "#产品美工等"],
  chips: ["设计", "办公", "营销", "数据分析"],
  bullets: ["前沿技术展示", "行业领袖论坛", "互动体验区", "AI 基础入门", "机器学习实战", "深度学习前沿"],
  accent_color: "#08e6cf",
  secondary_color: "#ffffff",
  background_color: "#f7fbff",
  text_color: "#000000",
  cover_title_color: "",
  cover_template_settings: {},
  cover_overlay_width: 0,
  cover_overlay_height: 0,
  cover_overlay_opacity: 70,
  cover_title_display: 'normal',
  cover_cutout_transparency: 100,
  cover_rule_hidden: false,
  cover_rule_thickness: 0,
  title_size: VISUAL_RULES.coverTitle,
  title_font_weight: VISUAL_RULES.headingWeight,
  subtitle_size: VISUAL_RULES.subtitle,
  subtitle_font_weight: 600,
  subtitle_color_mode: "muted",
  title_outline_mode: "off",
  title_outline_width: 3,
  title_outline_color: "#ffffff",
  subtitle_outline_mode: "off",
  subtitle_outline_width: 2,
  subtitle_outline_color: "#ffffff",
  highlight_outline_mode: "off",
  highlight_outline_width: 3,
  highlight_outline_color: "#ffffff",
  body_size: 32,
  cover_font_weight: VISUAL_RULES.headingWeight,
  cover_line_height: VISUAL_RULES.coverTitleLeading,
  cover_letter_spacing: 0,
  detail_background_color: VISUAL_RULES.background,
  detail_page_type: "modular",
  detail_module_layout: "auto",
  detail_text_color: VISUAL_RULES.ink,
  detail_title_highlight: "",
  detail_title_color_mode: "solid",
  detail_title_highlight_color: VISUAL_RULES.accent,
  detail_font_size: 40,
  detail_font_weight: 400,
  detail_typography_version: 0,
  detail_line_height: 1.6,
  detail_letter_spacing: 0,
  detail_image_gap: VISUAL_RULES.gutter,
  detail_image_width: 820,
  detail_image_height: 0,
  detail_image_layouts: {},
  title_letter_spacing: 0,
  title_line_height: VISUAL_RULES.coverTitleLeading,
  border_radius: 0,
  border_width: 0,
  background_image: "",
  main_image: "",
  icon_image: "",
  icon2_image: "",
  logo_image: "",
  xhs_modules: [],
  xhs_modules_by_style: {}
};

const COMPOSITION_LAYOUTS = [
  { id: "vertical", name: "上下" },
  { id: "horizontal", name: "左右" },
  { id: "center", name: "居中" }
];

const COMPOSITION_LEGACY_VARIANTS = {
  vertical: "image-caption",
  horizontal: "aside-image",
  center: "center-banner"
};

const MOSAIC_MAIN_HEIGHT = 936 * 9 / 16;
const MOSAIC_SECONDARY_HEIGHT = 456 * 9 / 16;
const MOSAIC_SECONDARY_Y = 72 + MOSAIC_MAIN_HEIGHT + 24;
const MOSAIC_IMAGE_FRAMES = [
  [72, 72, 936, MOSAIC_MAIN_HEIGHT],
  [72, MOSAIC_SECONDARY_Y, 456, MOSAIC_SECONDARY_HEIGHT],
  [552, MOSAIC_SECONDARY_Y, 456, MOSAIC_SECONDARY_HEIGHT]
];

const COMPOSITION_PRESETS = [
  {
    id: "aside-image", name: "右上图左文", family: "horizontal", theme: "cobalt", titleSize: 104, subtitleSize: 42,
    images: [[480,96,528,704]], block: [72,800,360,3],
    title: [72,864,936,300], subtitle: [72,540,360,70],
    description: [72,630,360,140]
  },
  {
    id: "solid-poster", name: "满版图右下题", family: "vertical", theme: "editorial-red", titleSize: 112, subtitleSize: 40,
    images: [[0,0,1080,1440]], block: [270,760,738,500],
    title: [300,870,678,200], subtitle: [318,794,642,55],
    description: [300,1100,678,120], blockColor: "rgba(13, 17, 23, 0.45)", onImage: true, subtitleOnImage: true
  },
  {
    id: "mosaic", name: "主辅三图", family: "vertical", theme: "citrus", titleSize: 108, subtitleSize: 40,
    images: MOSAIC_IMAGE_FRAMES, block: [72,788,936,3],
    title: [72,830,936,250], subtitle: [72,1120,400,85],
    description: [520,1120,488,170]
  },
  {
    id: "center-banner", name: "中段图文横幅", family: "center", theme: "moon-silver", titleSize: 105, subtitleSize: 39,
    images: [[0,64,1080,1080]], block: [180,1184,720,2],
    title: [96,420,888,220], subtitle: [180,670,720,65],
    description: [125,1216,830,135], align: "center", onImage: true, subtitleOnImage: true
  },
  {
    id: "headline-band", name: "上题中图下说明", family: "vertical", theme: "forest", titleSize: 112, subtitleSize: 41,
    images: [[0,460,1080,810]], block: [72,1208,936,3],
    title: [72,88,936,255], subtitle: [72,370,936,65],
    description: [72,1236,820,135]
  },
  {
    id: "image-caption", name: "上文双栏下图", family: "vertical", theme: "rose", titleSize: 110, subtitleSize: 42,
    images: [[72,600,936,702]], block: [72,568,936,3],
    title: [72,100,936,230], subtitle: [72,400,400,85],
    description: [520,400,488,120]
  },
  {
    id: "band-columns", name: "上图下标题", family: "vertical", theme: "sea-glass", titleSize: 112, subtitleSize: 42,
    images: [[0,0,1080,810]], block: [72,842,936,3],
    title: [72,888,936,250], subtitle: [72,1180,430,85],
    description: [560,1180,448,150]
  },
  {
    id: "left-image-title", name: "左下图右上题", family: "horizontal", theme: "heritage", titleSize: 110, subtitleSize: 41,
    images: [[0,408,600,900]], block: [648,740,360,3],
    title: [180,100,828,240], subtitle: [648,620,360,90],
    description: [648,780,360,180]
  }
];

const COMPOSITION_DEFAULT_CONTENT = {
  title: "AI工具用得越多，为什么你反而更忙？",
  subtitle: "职场 AI 技能提升指南",
  composition_description: "不要问\"这个工作能不能交给AI\"，而要问\"这个工作里的哪些环节适合AI\""
};

const COMPOSITION_THEMES = [
  { id: "cobalt", name: "理性蓝", background: "#EDEDF5", text: "#111116", accent: "#1D4ED8", secondary: "#A9C0EB" },
  { id: "editorial-red", name: "编辑红", background: "#F7F5F3", text: "#111116", accent: "#C1121F", secondary: "#D8A5A7" },
  { id: "citrus", name: "柑橘橙", background: "#FFF7EC", text: "#29231C", accent: "#D75A2B", secondary: "#F5C776" },
  { id: "forest", name: "森林绿", background: "#F2F6F0", text: "#193328", accent: "#24784D", secondary: "#B5D1BD" },
  { id: "rose", name: "柔雾粉", background: "#FAF3F5", text: "#35272E", accent: "#B64066", secondary: "#E9B7C9" },
  { id: "sea-glass", name: "海盐青", background: "#F2F8F7", text: "#17383B", accent: "#087F8C", secondary: "#A8D8DA" },
  { id: "heritage", name: "经典绛金", background: "#F4F0E8", text: "#101B3A", accent: "#B5122B", secondary: "#E7D7B8" },
  { id: "mist-blue", name: "深雾蓝", background: "#5A7D9A", text: "#000000", accent: "#FFFFFF", secondary: "#C4E7F2" },
  { id: "ice-blue", name: "浅冰蓝", background: "#C4E7F2", text: "#1E2321", accent: "#5A7D9A", secondary: "#5A7D9A" },
  { id: "wine-red", name: "珊瑚酒红", background: "#782F34", text: "#FFFFFF", accent: "#F29A95", secondary: "#F29A95" },
  { id: "sunset-peach", name: "落霞桃", background: "#F29A95", text: "#111116", accent: "#782F34", secondary: "#782F34" },
  { id: "olive-green", name: "深橄榄绿", background: "#5B6D3C", text: "#FFFFFF", accent: "#FFFFFF", secondary: "#7A8A55" },
  { id: "sage-green", name: "浅鼠尾草绿", background: "#7A8A55", text: "#111116", accent: "#111116", secondary: "#5B6D3C" },
  { id: "jade-black", name: "墨玉黑", background: "#1E2321", text: "#CFD8DC", accent: "#CFD8DC", secondary: "#CFD8DC" },
  { id: "moon-silver", name: "秋月银", background: "#CFD8DC", text: "#1E2321", accent: "#1E2321", secondary: "#1E2321" }
];

const COVER_TEXT_SAFE_MARGIN = VISUAL_RULES.margin;
const COVER_TEXT_GRID = Object.freeze({...VISUAL_RULES,
  titleGap:VISUAL_RULES.unit*4,descriptionGap:VISUAL_RULES.unit*4,imageGap:VISUAL_RULES.unit*6,
  subtitleSize:VISUAL_RULES.subtitle,subtitleLeading:VISUAL_RULES.subtitle*VISUAL_RULES.subtitleLeading,
  descriptionSize:VISUAL_RULES.description,descriptionLeading:VISUAL_RULES.description*VISUAL_RULES.descriptionLeading});

function removeReferenceLayoutConfig(config) {
  if (!config || typeof config !== "object") return false;
  let changed = false;
  for (const key of [
    "editorial_composition", "editorial_title_lines", "editorial_layout_version", "editorial_layouts_by_composition",
    "layout_title_left", "layout_title_top", "layout_subtitle_top",
    "layout_tags_top", "layout_small_top", "layout_content_left"
  ]) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      delete config[key];
      changed = true;
    }
  }
  const savedStyles = config.xhs_modules_by_style;
  if (savedStyles && typeof savedStyles === "object" && Object.prototype.hasOwnProperty.call(savedStyles, "editorial-ai")) {
    config.xhs_modules_by_style = { ...savedStyles };
    delete config.xhs_modules_by_style["editorial-ai"];
    changed = true;
  }
  if (config.xhs_style === "editorial-ai") {
    const candidates = Object.keys(config.xhs_modules_by_style || {}).filter((style) =>
      isSupportedCoverStyle(style));
    const previousStyle = candidates[candidates.length - 1] || DEFAULT_CONFIG.xhs_style;
    config.xhs_style = previousStyle;
    config.xhs_modules = config.xhs_modules_by_style?.[previousStyle] || [];
    if (!candidates.length) {
      for (const key of ["background_color", "accent_color", "secondary_color", "text_color"]) {
        config[key] = DEFAULT_CONFIG[key];
      }
    }
    changed = true;
  }
  return changed;
}

class XHSCardStudioPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (this.settings.drafts && typeof this.settings.drafts === "object") {
      let migrated = false;
      Object.values(this.settings.drafts).forEach((draft) => {
        migrated = removeReferenceLayoutConfig(draft) || migrated;
      });
      if (migrated) await this.saveSettings();
    }

    this.registerView(VIEW_TYPE, (leaf) => new XHSCardStudioView(leaf, this));

    this.addRibbonIcon("image", "小红书图文工作台", () => this.activateView()).classList.add("xhs-studio-ribbon");

    this.addCommand({
      id: "open-xhs-card-studio",
      name: "打开小红书图文工作台",
      callback: () => this.activateView()
    });

    this.addSettingTab(new XHSCardStudioSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    const leaf = leaves[0] || this.app.workspace.getRightLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class XHSCardStudioView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.config = Object.assign({}, DEFAULT_CONFIG);
    this.pages = [];
    this.activePageIndex = 0;
    this.selectedModuleId = "";
    this.selectedDetailImageKey = "";
    this.imageCache = new Map();
    this.pageIndexByFile = new Map();
    this.reloadVersion = 0;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "小红书图文工作台";
  }

  getIcon() {
    return "image";
  }

  async onOpen() {
    this.containerEl.empty();
    this.containerEl.addClass("xhs-studio-root");

    this.toolbarEl = this.containerEl.createDiv({ cls: "xhs-studio-toolbar" });
    this.bodyEl = this.containerEl.createDiv({ cls: "xhs-studio-body" });
    this.controlsEl = this.bodyEl.createDiv({ cls: "xhs-studio-controls" });
    this.previewShellEl = this.bodyEl.createDiv({ cls: "xhs-studio-preview-shell" });

    this.renderToolbar();
    this.observeStudioViewport();
    await this.reloadFromActiveFile();

    this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
      this.queueReloadFromActiveFile(50);
    }));
    this.registerEvent(this.app.metadataCache.on("changed", () => {
      this.queueReloadFromActiveFile(180);
    }));
  }

  async onClose() {
    this.studioResizeObserver?.disconnect();
    window.cancelAnimationFrame(this.previewFitFrame);
    window.clearTimeout(this.reloadDebounceTimer);
    if (this.saveDraftTimer) {
      window.clearTimeout(this.saveDraftTimer);
      await this.plugin.saveSettings();
    }
  }

  renderToolbar() {
    this.toolbarEl.empty();
    const heading=this.toolbarEl.createDiv({cls:'xhs-studio-toolbar-heading'});
    const toggle=heading.createEl('button',{cls:'xhs-studio-button xhs-studio-controls-toggle',attr:{'aria-label':'显示或隐藏设置'}});
    if(typeof setIcon==='function')setIcon(toggle,'panel-left');else toggle.textContent='设置';
    toggle.addEventListener('click',()=>{
      this.controlsVisibleOverride=this.controlsEl.classList.contains('is-controls-hidden');
      this.syncStudioViewport();
    });
    heading.createDiv({ cls: "xhs-studio-title", text: "XHS Card Studio" });
    const actions = this.toolbarEl.createDiv({ cls: "xhs-studio-actions" });
    this.makeButton(actions, "读取当前笔记", () => this.reloadFromActiveFile()).title = "重新读取当前 Markdown 笔记的正文和配置，刷新预览";
    this.makeButton(actions, "保存参数到笔记", () => this.saveConfigToFrontmatter()).title = "把当前排版配置写入笔记顶部的属性";
    this.makeButton(actions, "导出当前页到本地", () => this.exportCurrentPage());
    this.makeButton(actions, "导出全部到本地", () => this.exportAllPages()).classList.add("xhs-studio-primary-action");
    this.syncStudioViewport();
  }

  observeStudioViewport() {
    this.studioResizeObserver?.disconnect();
    if(typeof ResizeObserver==='undefined')return;
    this.studioResizeObserver=new ResizeObserver(()=>this.syncStudioViewport());
    this.studioResizeObserver.observe(this.containerEl);
    this.studioResizeObserver.observe(this.previewShellEl);
  }

  syncStudioViewport() {
    if(!this.containerEl || !this.controlsEl || !this.previewShellEl)return;
    const width=this.containerEl.clientWidth;
    const narrow=width>0 && width<=640;
    this.containerEl.dataset.studioViewport=narrow?'narrow':width<=1000?'compact':'wide';
    const visible = this.controlsVisibleOverride ?? !narrow;
    this.controlsEl.classList.toggle('is-controls-hidden',!visible);
    this.bodyEl.classList.toggle('is-controls-hidden',!visible);
    this.bodyEl.classList.toggle('is-controls-overlay',narrow&&visible);
    this.controlsEl.inert=!visible;
    this.controlsEl.setAttribute('aria-hidden',String(!visible));
    this.toolbarEl?.querySelector('.xhs-studio-controls-toggle')?.setAttribute('aria-expanded',String(visible));
    const card=this.previewCanvasEl,wrapper=card?.parentElement;
    if(wrapper?.isConnected)this.fitPreviewScale(wrapper,card);
  }

  makeButton(parent, text, onClick) {
    const button = parent.createEl("button", { text, cls: "xhs-studio-button" });
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      button.disabled = true;
      try {
        await onClick();
      } catch (error) {
        console.error("[XHS Card Studio]", error);
        new Notice(`操作失败：${error.message || error}`);
      } finally {
        button.disabled = false;
      }
    });
    return button;
  }

  getActiveMarkdownFile() {
    const file = this.app.workspace.getActiveFile();
    return file instanceof TFile && file.extension === "md" ? file : null;
  }

  queueReloadFromActiveFile(delay) {
    window.clearTimeout(this.reloadDebounceTimer);
    this.reloadDebounceTimer=window.setTimeout(()=>{
      this.reloadDebounceTimer=null;
      void this.reloadFromActiveFile().catch(error=>{
        console.error('[XHS Card Studio]',error);
        new Notice(`预览更新失败：${error.message || error}`);
      });
    },delay);
  }

  async reloadFromActiveFile() {
    const file = this.getActiveMarkdownFile() || this.activeFile;
    const version = ++this.reloadVersion;

    if (!file) {
      this.controlsEl.empty();
      this.previewShellEl.empty();
      this.previewShellEl.createDiv({
        cls: "xhs-studio-empty",
        text: "请先打开一篇 Obsidian Markdown 笔记。"
      });
      return;
    }

    const markdown = await this.app.vault.read(file);
    if (version !== this.reloadVersion) return;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = (cache && cache.frontmatter) || {};
    const draft = (this.plugin.settings.drafts && this.plugin.settings.drafts[file.path]) || {};
    const previousPath = this.activeFile?.path;
    if (previousPath && previousPath !== file.path) {
      this.pageIndexByFile.set(previousPath, this.activePageIndex);
    }
    this.activeFile = file;
    this.imageCache.clear();
    this.config = this.normalizeConfig(Object.assign({}, frontmatter, draft), file.basename);
    const sourcePages = this.buildPages(markdown);
    this.detailSourcePages = sourcePages.slice(1);
    // Same-note navigation still targets the displayed pages until pagination commits.
    if (previousPath !== file.path || !this.pages.length) {
      this.pages = sourcePages;
    }
    this.detailPaginationKey = "";
    const nextIndex = previousPath === file.path
      ? this.activePageIndex : (this.pageIndexByFile.get(file.path) || 0);
    this.activePageIndex = Math.max(0, nextIndex);
    await this.render();
  }

  normalizeConfig(frontmatter, fallbackTitle) {
    const merged = Object.assign({}, DEFAULT_CONFIG, frontmatter || {});
    const states = frontmatter?.cover_template_settings;
    const activeTemplates = new Set(this.getUnifiedCoverTemplates().map(choice =>
      choice.style === "composition" ? `composition:${choice.id}` : choice.style));
    merged.cover_template_settings = states && typeof states === "object" && !Array.isArray(states)
      ? Object.fromEntries(Object.entries(JSON.parse(JSON.stringify(states))).filter(([key, state]) =>
        activeTemplates.has(key) && state && typeof state === "object"))
      : {};
    for (const state of Object.values(merged.cover_template_settings)) {
      removeReferenceLayoutConfig(state.appearance);
      if (state.appearance) delete state.appearance.composition_layout;
    }
    removeReferenceLayoutConfig(merged);

    const legacyLayout = this.toText(merged.cover_layout_preset);
    merged.cover_layout_preset = COVER_LAYOUT_PRESETS.some((preset) => preset.id === merged.cover_layout_preset)
      ? merged.cover_layout_preset
      : DEFAULT_CONFIG.cover_layout_preset;
    if (RETIRED_COVER_STYLE_IDS.has(legacyLayout)
      && (!frontmatter?.xhs_style || !ACTIVE_COVER_STYLE_IDS.has(merged.xhs_style))) {
      merged.xhs_style = legacyLayout;
    }
    merged.xhs_style = isSupportedCoverStyle(merged.xhs_style)
      ? merged.xhs_style
      : (this.isCoverLayoutStyle(merged.cover_layout_preset) ? merged.cover_layout_preset : DEFAULT_CONFIG.xhs_style);
    if (!this.isCoverLayoutStyle(merged.xhs_style) && this.isCoverLayoutStyle(merged.cover_layout_preset)) {
      merged.xhs_style = merged.cover_layout_preset;
    }
    merged.cover_layout_preset = this.isCoverLayoutStyle(merged.xhs_style)
      ? merged.xhs_style
      : DEFAULT_CONFIG.cover_layout_preset;

    merged.xhs_width = this.toNumber(merged.xhs_width, 1080, 720, 4096);
    merged.xhs_height = this.toNumber(merged.xhs_height, 1440, 720, 4096);
    merged.big_title = this.toText(merged.big_title);
    merged.sub_title = this.toText(merged.sub_title);
    merged.small_title = this.toText(merged.small_title);
    merged.title = this.toText(merged.title || merged.big_title || merged.cover_title || fallbackTitle);
    merged.title_prefix = this.toText(merged.title_prefix || merged.cover_kicker);
    merged.title_secondary = this.toText(merged.title_secondary || merged.cover_subtitle);
    merged.subtitle = this.toText(merged.subtitle || merged.cover_subtitle);
    merged.composition_layout = COMPOSITION_LAYOUTS.some((item) => item.id === merged.composition_layout)
      ? merged.composition_layout : DEFAULT_CONFIG.composition_layout;
    const requestedVariant = this.toText(frontmatter?.composition_variant);
    const hasLegacyComposition = Boolean(frontmatter?.composition_modules_by_layout || frontmatter?.xhs_style === "composition");
    const variant = COMPOSITION_PRESETS.find((item) => item.id === requestedVariant)
      || COMPOSITION_PRESETS.find((item) => item.id === (hasLegacyComposition
        ? COMPOSITION_LEGACY_VARIANTS[merged.composition_layout] : DEFAULT_CONFIG.composition_variant));
    merged.composition_variant = variant.id;
    merged.composition_layout = variant.family;
    const requestedTheme = this.toText(frontmatter?.composition_theme);
    merged.composition_theme = requestedTheme === "auto" || requestedTheme === "custom"
      || COMPOSITION_THEMES.some((theme) => theme.id === requestedTheme)
      ? requestedTheme : (hasLegacyComposition ? "custom" : "auto");
    merged.composition_custom_colors = frontmatter?.composition_custom_colors
      && typeof frontmatter.composition_custom_colors === "object"
      && !Array.isArray(frontmatter.composition_custom_colors)
      ? { ...frontmatter.composition_custom_colors } : {};
    merged.composition_appearance_by_layout = frontmatter?.composition_appearance_by_layout
      && typeof frontmatter.composition_appearance_by_layout === "object"
      && !Array.isArray(frontmatter.composition_appearance_by_layout)
      ? { ...frontmatter.composition_appearance_by_layout } : {};
    merged.composition_description = this.toText(merged.composition_description);
    merged.composition_image = this.toText(merged.composition_image);
    merged.kicker = this.toText(merged.kicker || merged.cover_kicker);
    merged.english = this.toText(merged.english || merged.cover_english);
    merged.brand = this.toText(merged.brand || merged.brand_text || merged.tag_text);
    merged.title_highlight = this.toText(merged.title_highlight || merged.highlight_words);
    merged.cover_highlight_color=merged.cover_highlight_color?this.toColor(merged.cover_highlight_color,"#0071e3"):"";
    merged.cover_title_color = merged.cover_title_color?this.toColor(merged.cover_title_color,merged.text_color):"";
    merged.apple_text_color_preset = APPLE_TEXT_COLOR_PRESETS.some((preset) => preset.id === merged.apple_text_color_preset)
      ? merged.apple_text_color_preset
      : DEFAULT_CONFIG.apple_text_color_preset;
    merged.clean_palette = CLEAN_GRADIENT_PALETTES.some((palette) => palette.id === merged.clean_palette)
      ? merged.clean_palette
      : DEFAULT_CONFIG.clean_palette;
    merged.title_gradient_enabled = merged.title_gradient_enabled === true || merged.title_gradient_enabled === "true";
    merged.title_gradient_preset = CLEAN_GRADIENT_PRESETS.some((preset) => preset.id === merged.title_gradient_preset)
      ? merged.title_gradient_preset
      : this.inferTitleGradientPreset(merged.title_gradient_from, merged.title_gradient_to);
    merged.title_gradient_from = this.toColor(merged.title_gradient_from, DEFAULT_CONFIG.title_gradient_from);
    merged.title_gradient_to = this.toColor(merged.title_gradient_to, DEFAULT_CONFIG.title_gradient_to);
    merged.title_gradient_stops = this.normalizeColorList(
      merged.title_gradient_stops,
      [merged.title_gradient_from, merged.title_gradient_to]
    );
    merged.title_art_font_cn = TITLE_ART_FONT_PRESETS.cn.some((preset) => preset.id === merged.title_art_font_cn)
      ? merged.title_art_font_cn
      : DEFAULT_CONFIG.title_art_font_cn;
    merged.title_art_font_en = TITLE_ART_FONT_PRESETS.en.some((preset) => preset.id === merged.title_art_font_en)
      ? merged.title_art_font_en
      : DEFAULT_CONFIG.title_art_font_en;
    merged.huawei_palette = HUAWEI_PALETTES.some((palette) => palette.id === merged.huawei_palette)
      ? merged.huawei_palette
      : DEFAULT_CONFIG.huawei_palette;
    merged.huawei_text_color_preset = HUAWEI_TEXT_COLOR_PRESETS.some((preset) => preset.id === merged.huawei_text_color_preset)
      ? merged.huawei_text_color_preset
      : DEFAULT_CONFIG.huawei_text_color_preset;
    merged.huawei_gradient_enabled = merged.huawei_gradient_enabled !== false && merged.huawei_gradient_enabled !== "false";
    merged.huawei_gradient_preset = HUAWEI_GRADIENT_PRESETS.some((preset) => preset.id === merged.huawei_gradient_preset)
      ? merged.huawei_gradient_preset
      : this.inferHuaweiGradientPreset(merged.huawei_gradient_from, merged.huawei_gradient_to);
    merged.huawei_gradient_from = this.toColor(merged.huawei_gradient_from, DEFAULT_CONFIG.huawei_gradient_from);
    merged.huawei_gradient_to = this.toColor(merged.huawei_gradient_to, DEFAULT_CONFIG.huawei_gradient_to);
    merged.instagram_palette = INSTAGRAM_PALETTES.some((palette) => palette.id === merged.instagram_palette)
      ? merged.instagram_palette
      : DEFAULT_CONFIG.instagram_palette;
    merged.instagram_text_color_preset = INSTAGRAM_TEXT_COLOR_PRESETS.some((preset) => preset.id === merged.instagram_text_color_preset)
      ? merged.instagram_text_color_preset
      : DEFAULT_CONFIG.instagram_text_color_preset;
    merged.instagram_gradient_enabled = merged.instagram_gradient_enabled !== false && merged.instagram_gradient_enabled !== "false";
    merged.instagram_gradient_preset = INSTAGRAM_GRADIENT_PRESETS.some((preset) => preset.id === merged.instagram_gradient_preset)
      ? merged.instagram_gradient_preset
      : this.inferInstagramGradientPreset(merged.instagram_gradient_from, merged.instagram_gradient_to);
    merged.instagram_gradient_from = this.toColor(merged.instagram_gradient_from, DEFAULT_CONFIG.instagram_gradient_from);
    merged.instagram_gradient_to = this.toColor(merged.instagram_gradient_to, DEFAULT_CONFIG.instagram_gradient_to);
    merged.google_palette = GOOGLE_PALETTES.some((palette) => palette.id === merged.google_palette)
      ? merged.google_palette
      : DEFAULT_CONFIG.google_palette;
    merged.google_text_color_preset = GOOGLE_TEXT_COLOR_PRESETS.some((preset) => preset.id === merged.google_text_color_preset)
      ? merged.google_text_color_preset
      : DEFAULT_CONFIG.google_text_color_preset;
    merged.google_gradient_enabled = merged.google_gradient_enabled !== false && merged.google_gradient_enabled !== "false";
    merged.google_gradient_preset = GOOGLE_GRADIENT_PRESETS.some((preset) => preset.id === merged.google_gradient_preset)
      ? merged.google_gradient_preset
      : this.inferGoogleGradientPreset(merged.google_gradient_from, merged.google_gradient_to);
    merged.google_gradient_from = this.toColor(merged.google_gradient_from, DEFAULT_CONFIG.google_gradient_from);
    merged.google_gradient_to = this.toColor(merged.google_gradient_to, DEFAULT_CONFIG.google_gradient_to);
    merged.bubble_title = this.toText(merged.bubble_title || merged.cover_subtitle);
    merged.bubble_subtitle = this.toText(merged.bubble_subtitle || merged.footer_text);
    merged.footer = this.toText(merged.footer || merged.footer_text);
    merged.proof = this.toText(merged.proof || merged.proof_text);
    merged.cta = this.toText(merged.cta || merged.cta_text);
    merged.date_label = this.toText(merged.date_label);
    merged.date_value = this.toText(merged.date_value);
    merged.tags = this.normalizeList(merged.tags || merged.tag_list || merged.tag_text);
    merged.chips = this.normalizeList(merged.chips || merged.chip_texts);
    merged.bullets = this.normalizeList(merged.bullets);
    merged.accent_color = this.toColor(merged.accent_color, DEFAULT_CONFIG.accent_color);
    merged.secondary_color = this.toColor(merged.secondary_color, DEFAULT_CONFIG.secondary_color);
    merged.background_color = this.toColor(merged.background_color, DEFAULT_CONFIG.background_color);
    merged.text_color = this.toColor(merged.text_color, DEFAULT_CONFIG.text_color);
    this.migrateAppleSilverPalette(merged);
    merged.title_size = this.toNumber(merged.title_size, DEFAULT_CONFIG.title_size, 42, 220);
    merged.title_font_weight = this.toNumber(merged.title_font_weight, DEFAULT_CONFIG.title_font_weight, 100, 1000);
    merged.subtitle_size = this.toNumber(merged.subtitle_size, DEFAULT_CONFIG.subtitle_size, 20, 120);
    merged.body_size = this.toNumber(merged.body_size, DEFAULT_CONFIG.body_size, 18, 80);
    merged.subtitle_font_weight = this.toNumber(merged.subtitle_font_weight, DEFAULT_CONFIG.subtitle_font_weight, 100, 1000);
    merged.subtitle_color_mode = ["muted", "black"].includes(merged.subtitle_color_mode)
      ? merged.subtitle_color_mode
      : DEFAULT_CONFIG.subtitle_color_mode;
    ["title", "subtitle", "highlight"].forEach((kind) => {
      const modeKey = `${kind}_outline_mode`;
      const widthKey = `${kind}_outline_width`;
      const colorKey = `${kind}_outline_color`;
      merged[modeKey] = ["off", "text", "gradient", "custom"].includes(merged[modeKey])
        ? merged[modeKey] : DEFAULT_CONFIG[modeKey];
      merged[widthKey] = this.toNumber(merged[widthKey], DEFAULT_CONFIG[widthKey], 1, 12);
      merged[colorKey] = this.toColor(merged[colorKey], DEFAULT_CONFIG[colorKey]);
    });
    merged.cover_font_weight = this.toNumber(merged.cover_font_weight, DEFAULT_CONFIG.cover_font_weight, 100, 1000);
    if ((["clean-gradient", "huawei-product", "instagram-gradient", "google-search"].includes(merged.xhs_style) || this.isCoverLayoutStyle(merged.xhs_style))
      && Number(merged.cover_font_weight) === DEFAULT_CONFIG.cover_font_weight) {
      merged.cover_font_weight = 700;
    }
    merged.cover_line_height = this.toFloat(merged.cover_line_height, DEFAULT_CONFIG.cover_line_height, 0.6, 3);
    merged.cover_letter_spacing = this.toNumber(merged.cover_letter_spacing, DEFAULT_CONFIG.cover_letter_spacing, -50, 100);
    merged.detail_background_color = this.toColor(merged.detail_background_color, DEFAULT_CONFIG.detail_background_color);
    merged.detail_text_color = this.toColor(merged.detail_text_color, DEFAULT_CONFIG.detail_text_color);
    merged.detail_title_highlight = this.toText(merged.detail_title_highlight);
    merged.detail_title_color_mode = ["solid", "gradient"].includes(merged.detail_title_color_mode)
      ? merged.detail_title_color_mode
      : DEFAULT_CONFIG.detail_title_color_mode;
    merged.detail_title_highlight_color = this.toColor(merged.detail_title_highlight_color, DEFAULT_CONFIG.detail_title_highlight_color);
    this.migrateAppleProductColorSelection(merged);
    this.normalizeDetailDesignConfig(merged);
    merged.detail_image_width = DEFAULT_CONFIG.detail_image_width;
    merged.detail_image_height = DEFAULT_CONFIG.detail_image_height;
    merged.detail_image_layouts = this.normalizeDetailImageLayouts(merged.detail_image_layouts);
    merged.title_letter_spacing = 0;
    merged.title_line_height = VISUAL_RULES.coverTitleLeading;
    merged.border_radius = 0;
    merged.border_width = DEFAULT_CONFIG.border_width;
    merged.background_image = "";
    merged.main_image = "";
    merged.icon_image = "";
    merged.icon2_image = "";
    merged.logo_image = "";
    merged.xhs_modules_by_style = this.normalizeModulesByStyle(merged.xhs_modules_by_style);
    const savedRetiredModules = this.getStoredModulesForStyle(merged, merged.xhs_style);
    for (const style of Object.keys(merged.xhs_modules_by_style)) {
      if (!ACTIVE_COVER_STYLE_IDS.has(style)) delete merged.xhs_modules_by_style[style];
    }
    merged.mosaic_image_archive = Array.isArray(merged.mosaic_image_archive)
      ? merged.mosaic_image_archive.filter(image => image?.src).map(({ id, src }) => ({ id, src })) : [];
    merged.composition_modules_by_layout = this.normalizeCompositionModules(merged.composition_modules_by_layout);
    for (const key of ["composition_modules_by_layout", "composition_appearance_by_layout"]) {
      const layouts = merged[key];
      for (const [family, presetId] of Object.entries(COMPOSITION_LEGACY_VARIANTS)) {
        if (!layouts[presetId] && layouts[family]) layouts[presetId] = layouts[family];
        delete layouts[family];
      }
    }
    COMPOSITION_PRESETS.forEach((preset) => {
      const modules = merged.composition_modules_by_layout[preset.id];
      if (modules) {
        this.upgradeCompositionTypography(modules, preset);
        this.applyCurrentCompositionGeometry(modules, preset);
        this.normalizeCompositionEmptyImages(modules);
      }
    });
    merged.xhs_modules = this.normalizeModules(merged.xhs_modules);
    if((Number(merged.swiss_cover_version)===1 || Number(merged.cover_visual_version)===2) && ["neon-grid","nng-red-system","composition"].includes(merged.xhs_style)) {
      this.ensureUnifiedCoverVisuals(merged);
      this.removeDisabledCustomModules(merged);
      return merged;
    }
    if (merged.xhs_style === "composition") {
      this.upgradeCompositionTypography(merged.xhs_modules, variant);
      this.applyCurrentCompositionGeometry(merged.xhs_modules, variant);
      this.normalizeCompositionEmptyImages(merged.xhs_modules);
    }
    if (merged.xhs_style === "composition" && Array.isArray(merged.composition_modules_by_layout[merged.composition_variant])) {
      merged.xhs_modules = this.cloneModules(merged.composition_modules_by_layout[merged.composition_variant]);
    }
    if (merged.xhs_style === "composition" && merged.xhs_modules.length) {
      this.restoreCompositionContentFromModules(merged);
      this.restoreCompositionAppearance(merged, false);
      this.syncCompositionOverlayColors(merged);
    }
    if (!merged.xhs_modules.length && !(merged.xhs_style === "composition"
      && Array.isArray(merged.composition_modules_by_layout[merged.composition_variant]))) {
      const savedModules = ACTIVE_COVER_STYLE_IDS.has(merged.xhs_style)
        ? this.getStoredModulesForStyle(merged, merged.xhs_style) : savedRetiredModules;
      if (savedModules.length) merged.xhs_modules = savedModules;
    }
    if (merged.xhs_style === "neon-grid" && this.isLegacyNeonDefaultModules(merged.xhs_modules)) {
      merged.xhs_modules = this.createDefaultModulesForStyle(merged.xhs_style, merged);
    }
    const migratedRetiredStyle = !ACTIVE_COVER_STYLE_IDS.has(merged.xhs_style);
    if (migratedRetiredStyle) {
      const modules = merged.xhs_modules;
      const photo = modules.find(module => module.type === "image" && !module.custom && module.src);
      const ids = this.getBrandModuleIds(merged.xhs_style);
      if (!frontmatter?.title && !frontmatter?.big_title && !frontmatter?.cover_title) {
        merged.title = modules.find(module => module.id === ids?.title)?.text || merged.title;
      }
      if (!frontmatter?.subtitle && !frontmatter?.cover_subtitle) {
        merged.subtitle = modules.find(module => module.id === ids?.subtitle)?.text || merged.subtitle;
      }
      merged.xhs_style = DEFAULT_CONFIG.xhs_style;
      merged.cover_layout_preset = "none";
      merged.composition_image ||= photo?.src || this.toText(frontmatter?.main_image);
      merged.xhs_modules = [
        ...this.createDefaultModulesForStyle(merged.xhs_style, merged),
        ...modules.filter(module => module.custom)
      ];
    }
    this.ensureTemplateModules(merged);
    this.alignNeonFooterModules(merged);
    this.stripCoverLayoutTextDecorations(merged);
    this.migrateCustomModuleStyles(merged);
    this.removeDisabledCustomModules(merged);
    this.normalizeCurrentTemplateLayout(merged);
    if (merged.xhs_style === "composition" && !merged.xhs_modules.length
      && !Array.isArray(merged.composition_modules_by_layout[merged.composition_variant])) {
      const hasOwnContent = ["title", "subtitle", "composition_description", "composition_image"]
        .some((key) => Object.prototype.hasOwnProperty.call(frontmatter || {}, key));
      merged.xhs_modules = this.createCompositionModules(hasOwnContent ? merged
        : { ...merged, ...COMPOSITION_DEFAULT_CONTENT, composition_image: "" });
      this.restoreCompositionContentFromModules(merged);
    }

    if(!Object.prototype.hasOwnProperty.call(frontmatter || {},"background_color") && !frontmatter?.cover_editor_version
      && !merged.cover_template_settings[this.getCoverTemplateKey(merged)])this.applyDefaultCoverAppearance(merged);
    if(frontmatter?.cover_highlight_color)merged.cover_highlight_color=this.toColor(frontmatter.cover_highlight_color,"#0071e3");
    if (migratedRetiredStyle) this.ensureUnifiedCoverVisuals(merged);
    return merged;
  }

  normalizeCurrentTemplateLayout(config = this.config) {
    if (!config || !Array.isArray(config.xhs_modules)) return;
    const baseStyle = this.isCoverLayoutStyle(config.xhs_style) ? "google-search" : config.xhs_style;
    const layoutPresetId = this.isCoverLayoutStyle(config.xhs_style) ? config.xhs_style : config.cover_layout_preset;
    this.normalizeDefaultTemplateLayout(config.xhs_modules, baseStyle, layoutPresetId, config);
  }

  normalizeModulesByStyle(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    Object.entries(value).forEach(([style, modules]) => {
      const key = this.toText(style);
      if (!key) return;
      const normalized = this.normalizeModules(modules);
      if (normalized.length) output[key] = normalized;
    });
    return output;
  }

  normalizeCompositionModules(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    Object.entries(value).forEach(([variant, modules]) => {
      if (Array.isArray(modules)) output[this.toText(variant)] = this.normalizeModules(modules);
    });
    return output;
  }

  getStyleModuleKey(style = this.config.xhs_style) {
    return this.toText(style || DEFAULT_CONFIG.xhs_style);
  }

  cloneModules(modules) {
    if (!Array.isArray(modules)) return [];
    return modules.map((module) => Object.assign({}, module));
  }

  upgradeCompositionTypography(modules, preset) {
    if(modules?.some(module=>module.coverTextRole))return;
    if (!Array.isArray(modules) || !preset) return;
    const title = modules.find((module) => module.id === "composition-title");
    const subtitle = modules.find((module) => module.id === "composition-subtitle");
    if (title && !title.manualStyle && title.fontSize === 102) title.fontSize = preset.titleSize;
    if (title && !title.manualStyle && title.fontWeight === 620) title.fontWeight = 720;
    if (subtitle && !subtitle.manualStyle && subtitle.fontSize === 46) subtitle.fontSize = preset.subtitleSize;
    const description = modules.find((module) => module.id === "composition-description");
    if (description && !description.manualStyle && !description.manualFontSize && description.fontSize === 30) description.fontSize = 26;
  }

  applyCurrentCompositionGeometry(modules, preset) {
    if (!preset || modules.some(module => module.coverTextRole)) return;
    const frames = new Map([
      ["composition-block", preset.block],
      ["composition-title", preset.title],
      ["composition-subtitle", preset.subtitle],
      ["composition-description", preset.description],
      ...preset.images.map((frame, index) => [index ? `composition-image-${index + 1}` : "composition-image", frame])
    ]);
    for (const module of modules) {
      const frame = frames.get(module.id);
      if (!frame || module.custom || module.manualLayout || module.manualPosition || module.manualSize) continue;
      [module.x, module.y, module.w, module.h] = frame;
    }
  }

  normalizeCompositionEmptyImages(modules) {
    if (!Array.isArray(modules)) return;
    modules.forEach((module) => {
      if (module.template === "composition" && module.type === "image" && !module.src
        && !module.manualStyle && ["var(--xhs-accent)", "var(--xhs-secondary)"].includes(module.background)) {
        module.background = "transparent";
      }
    });
  }

  getStoredModulesForStyle(config, style) {
    const map = config && config.xhs_modules_by_style;
    if (!map || typeof map !== "object") return [];
    return this.cloneModules(map[this.getStyleModuleKey(style)]);
  }

  saveCurrentStyleModules(config = this.config) {
    if (!config || !Array.isArray(config.xhs_modules)) return;
    const appearance={};
    for(const key of this.getFrontmatterSaveKeys().filter(key=>
      /^(cover_|title_|subtitle_|composition_|layout_)/.test(key) && !key.includes("_by_") && key!=="cover_template_settings"
      || ["background_color","text_color","accent_color","secondary_color","google_gradient_enabled"].includes(key))) {
      if(config[key]!==undefined)appearance[key]=JSON.parse(JSON.stringify(config[key]));
    }
    config.cover_template_settings ||= {};
    config.cover_template_settings[this.getCoverTemplateKey(config)]={appearance,modules:this.cloneModules(config.xhs_modules)};
    if (!config.xhs_modules_by_style || typeof config.xhs_modules_by_style !== "object" || Array.isArray(config.xhs_modules_by_style)) {
      config.xhs_modules_by_style = {};
    }
    config.xhs_modules_by_style[this.getStyleModuleKey(config.xhs_style)] = this.cloneModules(config.xhs_modules);
    if (config.xhs_style === "composition") {
      if (config.composition_theme === "custom") {
        config.composition_custom_colors = this.captureCompositionColors(config);
      }
      if (!config.composition_modules_by_layout || typeof config.composition_modules_by_layout !== "object") {
        config.composition_modules_by_layout = {};
      }
      config.composition_modules_by_layout[config.composition_variant] = this.cloneModules(config.xhs_modules);
      if (!config.composition_appearance_by_layout || typeof config.composition_appearance_by_layout !== "object") {
        config.composition_appearance_by_layout = {};
      }
      config.composition_appearance_by_layout[config.composition_variant] = {
        theme: config.composition_theme,
        colors: this.captureCompositionColors(config)
      };
    }
  }

  restoreCompositionContentFromModules(config = this.config) {
    const modules = new Map((config.xhs_modules || []).map((module) => [module.id, module]));
    for (const [key, id] of [["title", "composition-title"], ["subtitle", "composition-subtitle"],
      ["composition_description", "composition-description"]]) {
      if (modules.has(id)) config[key] = this.toText(modules.get(id).text);
    }
    if (modules.has("composition-image")) config.composition_image = this.toText(modules.get("composition-image").src);
  }

  restoreCompositionAppearance(config = this.config, useDefault = true) {
    const saved = config.composition_appearance_by_layout?.[config.composition_variant];
    if (saved && typeof saved === "object") {
      config.composition_theme = saved.theme || "auto";
      Object.assign(config, saved.colors || {});
      if (config.composition_theme === "custom") config.composition_custom_colors = this.captureCompositionColors(config);
    } else if (useDefault) {
      config.composition_theme = "auto";
      config.composition_custom_colors = {};
      this.applyCompositionTheme(config);
    }
    if (config.composition_variant === "center-banner" && config.composition_theme === "auto"
      && ["#1e2321", "#151b28"].includes(String(config.background_color).toLowerCase())) {
      this.applyCompositionTheme(config);
      if (saved) saved.colors = this.captureCompositionColors(config);
    }
  }

  loadModulesForStyle(style, config = this.config) {
    if (style === "composition") {
      const savedLayout = config.composition_modules_by_layout?.[config.composition_variant];
      if (Array.isArray(savedLayout)) return this.cloneModules(savedLayout);
      return this.createCompositionModules({ ...config, ...COMPOSITION_DEFAULT_CONTENT, composition_image: "" });
    }
    const saved = this.getStoredModulesForStyle(config, style);
    if (saved.length) return saved;
    return this.createDefaultModulesForStyle(style, config);
  }

  syncCurrentTextToModules() {
    ["title", "subtitle", "composition_description", "composition_image", "cta", "brand", "tags"].forEach((key) => this.syncNeonModulesFromConfig(key));
  }

  syncCompositionContentFromModule(module) {
    if(!module)return;
    if(module.coverTextRole) {
      const roleKey={title:"title",subtitle:"subtitle",description:"composition_description"}[module.coverTextRole];
      if(roleKey)this.config[roleKey]=this.toText(module.text);
      return;
    }
    if(this.config.xhs_style!=="composition")return;
    const keys = {
      "composition-title": "title",
      "composition-subtitle": "subtitle",
      "composition-description": "composition_description",
      "composition-image": "composition_image"
    };
    const key = keys[module.id];
    if (key) this.config[key] = this.toText(module.type === "image" ? module.src : module.text);
    if (key === "composition_image") this.syncCompositionOverlayColors();
  }

  canApplyDefaultModuleLayout(module) {
    return !module || (!module.manualLayout && !module.manualPosition && !module.manualSize);
  }

  canAutoFitTextModule(module) {
    return !module || !module.manualSize;
  }

  normalizeDetailImageLayouts(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    Object.entries(value).forEach(([key, item]) => {
      if (!item || typeof item !== "object") return;
      if (item.lockBox) return;
      output[key] = {
        x: this.toNumber(item.x, 0, -800, 1600),
        y: this.toNumber(item.y, 0, -800, 1600),
        w: this.toNumber(item.w, 0, 0, 1600),
        h: this.toNumber(item.h, 0, 0, 1600),
        aspectRatio: this.toFloat(item.aspectRatio, 0, 0, 20),
        fit: item.fit==="cover"?"cover":item.fit==="contain"?"contain":undefined,
        frameRatio: this.toFloat(item.frameRatio,4/3,.25,4),
        align: ["left","center","right","free"].includes(item.align)?item.align:"free",
        focalX: this.toNumber(item.focalX,50,0,100),
        focalY: this.toNumber(item.focalY,50,0,100),
        slotH: this.toNumber(item.slotH, 0, 0, 4000),
        slotW: this.toNumber(item.slotW, 0, 0, 4000),
        pairMode: Boolean(item.pairMode),
        forceBlock: Boolean(item.forceBlock),
        adjusted: Boolean(item.adjusted)
      };
      if(item.pairSingleLayout && typeof item.pairSingleLayout==='object') {
        output[key].pairSingleLayout=this.normalizeDetailImageLayouts({single:{...item.pairSingleLayout,pairSingleLayout:undefined}}).single;
      }
    });
    return output;
  }

  toText(value) {
    if (Array.isArray(value)) return value.join("\n");
    return value == null ? "" : String(value);
  }

  escapeCssContent(value) {
    return this.toText(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  getCoverTitleInitial() {
    const source = this.toText(this.config.title || this.config.big_title || "").replace(/\{\{([^{}]+)\}\}/g, "$1");
    const chars = Array.from(source.replace(/\s+/g, ""));
    if (!chars.length) return "A";
    const first = chars[0];
    return /[A-Za-z]/.test(first) ? first.toUpperCase() : first;
  }

  toNumber(value, fallback, min, max) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, min), max);
  }

  toFloat(value, fallback, min, max) {
    const number = Number.parseFloat(String(value));
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, min), max);
  }

  toColor(value, fallback) {
    const text = this.toText(value).trim();
    return /^#[0-9a-f]{3,8}$/i.test(text) ? text : fallback;
  }

  normalizeList(value) {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === "string") {
      return value.split(/\r?\n|[,，]/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  normalizeColorList(value, fallback = []) {
    const items = Array.isArray(value)
      ? value
      : (typeof value === "string" ? value.split(/\r?\n|[,，\s]+/) : []);
    const colors = items
      .map((item) => this.toColor(item, ""))
      .filter(Boolean);
    return colors.length >= 2 ? colors : fallback.filter(Boolean);
  }

  inferTitleGradientPreset(from, to) {
    const start = this.toText(from).toLowerCase();
    const end = this.toText(to).toLowerCase();
    const direct = CLEAN_GRADIENT_PRESETS.find((preset) => (
      this.toText(preset.from).toLowerCase() === start && this.toText(preset.to).toLowerCase() === end
    ));
    if (direct) return direct.id;
    if (start === "#30d158" && end === "#ff2d55") return "apple-spectrum";
    return "";
  }

  inferHuaweiGradientPreset(from, to) {
    const start = this.toText(from).toLowerCase();
    const end = this.toText(to).toLowerCase();
    const direct = HUAWEI_GRADIENT_PRESETS.find((preset) => (
      this.toText(preset.from).toLowerCase() === start && this.toText(preset.to).toLowerCase() === end
    ));
    return direct ? direct.id : "";
  }

  inferInstagramGradientPreset(from, to) {
    const start = this.toText(from).toLowerCase();
    const end = this.toText(to).toLowerCase();
    const direct = INSTAGRAM_GRADIENT_PRESETS.find((preset) => (
      this.toText(preset.from).toLowerCase() === start && this.toText(preset.to).toLowerCase() === end
    ));
    return direct ? direct.id : "";
  }

  inferGoogleGradientPreset(from, to) {
    const start = this.toText(from).toLowerCase();
    const end = this.toText(to).toLowerCase();
    const direct = GOOGLE_GRADIENT_PRESETS.find((preset) => (
      this.toText(preset.from).toLowerCase() === start && this.toText(preset.to).toLowerCase() === end
    ));
    return direct ? direct.id : "";
  }

  parseHighlightedTextSegments(text, highlightWords, includeAdjacentPunctuation = false, matchAcrossLines = false) {
    const words = this.normalizeList(highlightWords)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const crossLinePatterns = matchAcrossLines ? words.map((word) => {
      const escapedCharacters = Array.from(word, (character) => character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      return new RegExp(escapedCharacters.join("(?:[ \\t]*\\r?\\n[ \\t]*)*"), "uy");
    }) : [];
    const splitByWords = (value) => {
      if (!value || !words.length) return value ? [{ text: value, highlight: false }] : [];
      const segments = [];
      let buffer = "";
      let index = 0;
      while (index < value.length) {
        const word = matchAcrossLines
          ? crossLinePatterns.map((pattern) => {
              pattern.lastIndex = index;
              return pattern.exec(value)?.[0];
            }).find(Boolean)
          : words.find((item) => value.startsWith(item, index));
        if (word) {
          let leadingPunctuation = "";
          if (includeAdjacentPunctuation && buffer) {
            const leadingMatch = buffer.match(/[（(\[【《「『“‘]+$/u);
            if (leadingMatch) {
              leadingPunctuation = leadingMatch[0];
              buffer = buffer.slice(0, -leadingPunctuation.length);
            }
          }
          if (buffer) segments.push({ text: buffer, highlight: false });
          let highlightedText = `${leadingPunctuation}${word}`;
          buffer = "";
          index += word.length;
          if (includeAdjacentPunctuation) {
            const trailingMatch = value.slice(index).match(/^[，。！？；：、,.!?;:…—~～·）》】」』”’）)\]\}]+/u);
            if (trailingMatch) {
              highlightedText += trailingMatch[0];
              index += trailingMatch[0].length;
            }
          }
          segments.push({ text: highlightedText, highlight: true });
        } else {
          buffer += value[index];
          index += 1;
        }
      }
      if (buffer) segments.push({ text: buffer, highlight: false });
      return segments;
    };

    const parseInline = (line) => {
      const segments = [];
      let cursor = 0;
      line.replace(/\{\{([^{}\r\n]+)\}\}/g, (match, value, offset) => {
        if (offset > cursor) segments.push(...splitByWords(line.slice(cursor, offset)));
        segments.push({ text: value, highlight: true });
        cursor = offset + match.length;
        return match;
      });
      if (cursor < line.length) segments.push(...splitByWords(line.slice(cursor)));
      return segments;
    };
    const value = this.toText(text);
    if (!matchAcrossLines) {
      return value.split(/\r?\n/).map((line) => {
        const segments = parseInline(line);
        return segments.length ? segments : [{ text: "", highlight: false }];
      });
    }

    const lines = [[]];
    for (const segment of parseInline(value)) {
      const parts = segment.text.split(/\r?\n/);
      parts.forEach((part, index) => {
        if (index) lines.push([]);
        if (part) lines[lines.length - 1].push({ text: part, highlight: segment.highlight });
      });
    }
    return lines.map((line) => line.length ? line : [{ text: "", highlight: false }]);
  }

  parseHighlightedTitleSegments(text) {
    return this.parseHighlightedTextSegments(text, this.config.title_highlight, false, true);
  }

  parseHighlightedDetailTitleSegments(text) {
    return this.parseHighlightedTextSegments(text, this.config.detail_title_highlight, true);
  }

  normalizeModules(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const module = {
        id: this.toText(item.id || `module-${index + 1}`),
        name: this.toText(item.name),
        type: this.toText(item.type || "text"),
        text: this.toText(item.text),
        x: this.toNumber(item.x, 0, -1000, 5000),
        y: this.toNumber(item.y, 0, -1000, 5000),
        w: this.toNumber(item.w, 200, 1, 5000),
        h: this.toNumber(item.h, 80, 1, 5000),
        fontSize: this.toNumber(item.fontSize, 32, 1, 400),
        fontWeight: this.toNumber(item.fontWeight, 900, 100, 1000),
        lineHeight: this.toFloat(item.lineHeight, 1.1, 0.5, 3),
        letterSpacing: this.toNumber(item.letterSpacing, 0, -50, 100),
        color: this.toText(item.color || "#ffffff"),
        background: this.toText(item.background || ""),
        textAlign: ["left", "center", "right"].includes(this.toText(item.textAlign)) ? this.toText(item.textAlign) : "left",
        opacity: 1,
        borderRadius: item.type === "image" ? 0 : this.toNumber(item.borderRadius, 0, 0, 500),
        borderWidth: this.toNumber(item.borderWidth, 0, 0, 40),
        borderMode: ["solid", "gradient"].includes(this.toText(item.borderMode)) ? this.toText(item.borderMode) : "",
        borderColor: this.toText(item.borderColor || ""),
        rotation: this.toFloat(item.rotation, 0, -180, 180),
        tiltX: this.toFloat(item.tiltX, 0, -45, 45),
        tiltY: this.toFloat(item.tiltY, 0, -45, 45),
        depth3d: this.toNumber(item.depth3d, 0, 0, 100),
        aspectRatio: this.toFloat(item.aspectRatio, 0, 0, 20),
        className: this.toText(item.className),
        role: this.toText(item.role),
        src: this.toText(item.src),
        objectFit: this.toText(item.objectFit || "contain"),
        template: this.toText(item.template),
        custom: Boolean(item.custom),
        swissCover: Boolean(item.swissCover),
        coverTextRole: this.toText(item.coverTextRole),
        magazineReference: Boolean(item.magazineReference),
        coverTextStyle: this.normalizeCoverTextStyle(item.coverTextStyle),
        maxLines: Number(item.maxLines) || 0,
        locked: Boolean(item.locked),
        manualPosition: Boolean(item.coverTextRole || item.id === "cover-structure-rule" ? item.manualPosition : item.manualPosition || item.manualLayout),
        manualSize: Boolean(item.manualSize),
        manualLayout: Boolean(item.manualLayout),
        manualStyle: Boolean(item.manualStyle),
        manualFontSize: Boolean(item.manualFontSize)
      };
      if (module.custom && module.className === "xhs-module-shape-rect") {
        if (module.borderRadius >= 200 || module.id.startsWith("circle")) {
          module.name = module.name || "强调圆点";
          module.className = "xhs-module-dot-shape";
          module.w = Math.min(module.w, 120);
          module.h = Math.min(module.h, 120);
          module.borderRadius = 0;
        } else {
          module.name = module.name || "高亮条";
          module.className = "xhs-module-highlight-strip";
          module.h = Math.min(module.h, 48);
          module.borderRadius = 0;
        }
      }
      return module;
    }).filter((module) => module && module.id !== "composition-frame");
  }

  ensureTemplateModules(config) {
    if (this.isCoverLayoutStyle(config.xhs_style)) {
      const hasTemplate = config.xhs_modules.some((module) => module.id === "google-title")
        && config.xhs_modules.some((module) => module.layoutPreset === config.xhs_style);
      if (!config.xhs_modules.length || !hasTemplate) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    } else if (config.xhs_style === "neon-grid") {
      if (!config.xhs_modules.length || !config.xhs_modules.some((module) => module.id === "big-title")) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    } else if (config.xhs_style === "ai-course") {
      if (!config.xhs_modules.length || !config.xhs_modules.some((module) => module.id === "ai-title")) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    } else if (config.xhs_style === "clean-gradient") {
      if (!config.xhs_modules.length || !config.xhs_modules.some((module) => module.id === "clean-title")) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    } else if (config.xhs_style === "huawei-product") {
      if (!config.xhs_modules.length || !config.xhs_modules.some((module) => module.id === "huawei-title")) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    } else if (config.xhs_style === "instagram-gradient") {
      if (!config.xhs_modules.length || !config.xhs_modules.some((module) => module.id === "instagram-title")) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    } else if (config.xhs_style === "google-search") {
      if (!config.xhs_modules.length || !config.xhs_modules.some((module) => module.id === "google-title")) {
        config.xhs_modules = this.createDefaultModulesForStyle(config.xhs_style, config);
      }
    }
  }

  stripCoverLayoutTextDecorations(config) {
    if (!config || !this.isCoverLayoutStyle(config.xhs_style) || !Array.isArray(config.xhs_modules)) return;
    const staleIds = new Set(["layout-kicker", "layout-cta", "layout-footer", "layout-mark"]);
    config.xhs_modules = config.xhs_modules.filter((module) => !staleIds.has(module.id));
  }

  isLegacyNeonDefaultModules(modules) {
    if (!Array.isArray(modules) || modules.length === 0) return false;
    const byId = new Map(modules.map((module) => [module.id, module]));
    const title = byId.get("big-title");
    const subtitle = byId.get("subtitle");
    const tags = byId.get("tags");
    const footer = byId.get("footer");
    if (!title || !subtitle || !tags || !footer) return false;
    return title.x === 82
      && title.y === 92
      && (
        (title.w === 760 && subtitle.x === 82 && subtitle.y === 382 && tags.y === 630 && footer.y === 1352)
        || (title.w === 845 && subtitle.x === 425 && subtitle.y === 612 && tags.y === 965 && footer.y === 1350)
      );
  }

  isLegacyAiDefaultModules(modules) {
    if (!Array.isArray(modules) || modules.length === 0) return false;
    const byId = new Map(modules.map((module) => [module.id, module]));
    const frame = byId.get("ai-frame");
    if (frame && frame.x === 0 && frame.y === 0 && frame.w === 1080 && frame.h === 1440 && !byId.has("ai-icon1") && !byId.has("ai-icon2")) return false;
    const title = byId.get("ai-title");
    const speech = byId.get("ai-speech");
    const main = byId.get("ai-main");
    if (!title || !speech || !main) return false;
    return true;
  }

  isLegacyCleanDefaultModules(modules) {
    if (!Array.isArray(modules) || modules.length === 0) return false;
    const byId = new Map(modules.map((module) => [module.id, module]));
    const title = byId.get("clean-title");
    const subtitle = byId.get("clean-subtitle");
    const image = byId.get("clean-image");
    if (!title || !subtitle || !image) return false;
    const oldTitle = title.x === 70 && (title.y === 88 || title.y === 96);
    const oldSubtitle = subtitle.x === 72 && subtitle.y >= 680;
    const oldImage = image.x >= 96 && image.x <= 104 && image.y >= 900;
    return oldTitle && oldSubtitle && oldImage;
  }

  getCoverRadius() {
    return 0;
  }

  getNeonFooterInset() {
    return 72;
  }

  alignNeonFooterModules(config = this.config) {
    if (!config || config.xhs_style !== "neon-grid" || !Array.isArray(config.xhs_modules)) return;
    const byId = new Map(config.xhs_modules.map((module) => [module.id, module]));
    const footer = byId.get("footer");
    const checkers = byId.get("checkers");
    if (!footer) return;
    const inset = this.getNeonFooterInset();
    if (!footer.manualLayout) {
      footer.x = 0;
      footer.w = config.xhs_width || DEFAULT_CONFIG.xhs_width;
      footer.h = footer.h || 90;
      footer.textAlign = "left";
    }
    if (checkers && !checkers.manualLayout) {
      checkers.x = Math.round(footer.x + footer.w - inset - checkers.w);
      checkers.y = Math.round(footer.y + (footer.h - checkers.h) / 2);
    }
  }

  createDefaultNeonModules(config) {
    return [
      {
        id: "glow",
        type: "shape",
        template: "neon-grid",
        x: 135,
        y: -112,
        w: 810,
        h: 360,
        background: "var(--xhs-accent)",
        opacity: 1,
        borderRadius: 0,
        className: "xhs-module-glow",
        locked: false
      },
      {
        id: "big-title",
        type: "text",
        template: "neon-grid",
        text: config.title,
        x: 78,
        y: 92,
        w: 675,
        h: 605,
        fontSize: Math.max(config.title_size, 118),
        fontWeight: config.title_font_weight || DEFAULT_CONFIG.title_font_weight,
        lineHeight: 0.92,
        letterSpacing: config.title_letter_spacing,
        color: config.text_color,
        className: "xhs-module-neon-title"
      },
      {
        id: "subtitle",
        type: "text",
        template: "neon-grid",
        text: config.subtitle,
        x: 430,
        y: 590,
        w: 350,
        h: 92,
        fontSize: Math.max(config.subtitle_size, 48),
        fontWeight: 950,
        lineHeight: 1.08,
        letterSpacing: config.title_letter_spacing,
        color: "#00110f",
        background: "var(--xhs-accent)",
        className: "xhs-module-label-badge",
        borderRadius: 0
      },
      {
        id: "arrow",
        type: "text",
        template: "neon-grid",
        text: "->",
        x: 812,
        y: 300,
        w: 150,
        h: 92,
        fontSize: 86,
        fontWeight: 400,
        lineHeight: 0.9,
        letterSpacing: -8,
        color: "var(--xhs-secondary)",
        background: "transparent",
        className: "xhs-module-arrow-text"
      },
      {
        id: "tags",
        type: "text",
        template: "neon-grid",
        text: config.tags.join("  "),
        x: 86,
        y: 958,
        w: 860,
        h: 60,
        fontSize: Math.max(config.body_size, 48),
        fontWeight: 950,
        lineHeight: 1.32,
        color: config.text_color
      },
      {
        id: "tag-rule",
        type: "shape",
        template: "neon-grid",
        x: 86,
        y: 1018,
        w: 760,
        h: 1,
        background: "rgba(255,255,255,0.42)",
        className: "xhs-module-line"
      },
      {
        id: "small-title",
        type: "text",
        template: "neon-grid",
        text: config.tags.slice(0, 2).join("\n"),
        x: 86,
        y: 1038,
        w: 860,
        h: 56,
        fontSize: Math.round(config.body_size * 0.78),
        fontWeight: 700,
        lineHeight: 1.45,
        color: config.text_color
      },
      {
        id: "cta",
        type: "text",
        template: "neon-grid",
        text: config.cta,
        x: 86,
        y: 1204,
        w: 558,
        h: 56,
        fontSize: Math.round(config.body_size * 0.76),
        fontWeight: 900,
        lineHeight: 1.2,
        color: "#00110f",
        background: "var(--xhs-accent)",
        className: "xhs-module-cta"
      },
      {
        id: "footer",
        type: "text",
        template: "neon-grid",
        text: config.brand,
        x: 0,
        y: 1350,
        w: 1080,
        h: 90,
        fontSize: Math.round(config.body_size * 0.72),
        fontWeight: 950,
        lineHeight: 1.35,
        color: "#00110f",
        background: "var(--xhs-accent)",
        className: "xhs-module-footer",
        textAlign: "left"
      },
      {
        id: "checkers",
        type: "shape",
        template: "neon-grid",
        x: 770,
        y: 1375,
        w: 218,
        h: 40,
        background: "linear-gradient(70deg, transparent 0 34%, #020404 34% 66%, transparent 66%) 0 0 / 38px 34px repeat-x",
        className: "xhs-module-checkers"
      }
    ];
  }

  createDefaultAiModules(config) {
    return [
      {
        id: "ai-bg",
        type: "shape",
        template: "ai-course",
        x: 0,
        y: 0,
        w: 1080,
        h: 1440,
        background: "var(--xhs-bg)",
        opacity: 1,
        borderRadius: this.getCoverRadius(),
        locked: true,
        className: "xhs-module-ai-bg"
      },
      {
        id: "ai-frame",
        type: "shape",
        template: "ai-course",
        x: 0,
        y: 0,
        w: 1080,
        h: 1440,
        background: "rgba(0,0,0,0)",
        opacity: 1,
        borderRadius: 0,
        locked: true,
        className: "xhs-module-ai-frame"
      },
      {
        id: "ai-title",
        type: "text",
        template: "ai-course",
        text: config.title,
        x: 112,
        y: 130,
        w: 850,
        h: 165,
        fontSize: Math.max(config.title_size, 120),
        fontWeight: config.title_font_weight || DEFAULT_CONFIG.title_font_weight,
        lineHeight: 0.96,
        letterSpacing: -1,
        color: config.text_color
      },
      {
        id: "ai-kicker",
        type: "text",
        template: "ai-course",
        text: config.tags[0] || "",
        x: 124,
        y: 390,
        w: 360,
        h: 48,
        fontSize: 31,
        fontWeight: 950,
        lineHeight: 1.1,
        color: config.text_color
      },
      {
        id: "ai-brand",
        type: "text",
        template: "ai-course",
        text: config.tags[1] || "",
        x: 124,
        y: 884,
        w: 420,
        h: 44,
        fontSize: 28,
        fontWeight: 950,
        lineHeight: 1.1,
        color: config.text_color
      },
      {
        id: "ai-speech",
        type: "shape",
        template: "ai-course",
        x: 124,
        y: 330,
        w: 805,
        h: 72,
        background: "var(--xhs-accent)",
        borderRadius: 0,
        className: "xhs-module-ai-speech"
      },
      {
        id: "ai-bubble-title",
        type: "text",
        template: "ai-course",
        text: config.subtitle,
        x: 124,
        y: 300,
        w: 720,
        h: 68,
        fontSize: Math.max(config.subtitle_size, 48),
        fontWeight: 950,
        lineHeight: 1.08,
        color: config.text_color
      },
      {
        id: "ai-bubble-sub",
        type: "text",
        template: "ai-course",
        text: config.tags.slice(0, 3).join("  "),
        x: 124,
        y: 1030,
        w: 360,
        h: 150,
        fontSize: 34,
        fontWeight: 950,
        lineHeight: 1.36,
        color: config.text_color
      },
      {
        id: "ai-main",
        type: "image",
        template: "ai-course",
        role: "main",
        x: 486,
        y: 438,
        w: 458,
        h: 610,
        objectFit: "contain",
        className: "xhs-module-ai-main"
      },
      {
        id: "ai-chips",
        type: "text",
        template: "ai-course",
        text: config.tags.join("\n"),
        x: 124,
        y: 516,
        w: 360,
        h: 210,
        fontSize: 31,
        fontWeight: 950,
        lineHeight: 1.42,
        color: config.text_color,
        className: "xhs-module-ai-chips"
      },
      {
        id: "ai-proof",
        type: "text",
        template: "ai-course",
        text: config.subtitle,
        x: 124,
        y: 1204,
        w: 520,
        h: 42,
        fontSize: 27,
        fontWeight: 950,
        lineHeight: 1.15,
        color: config.text_color
      },
      {
        id: "ai-bottom",
        type: "text",
        template: "ai-course",
        text: config.tags[0] || config.subtitle,
        x: 124,
        y: 1252,
        w: 550,
        h: 82,
        fontSize: 56,
        fontWeight: 950,
        lineHeight: 1.05,
        color: config.text_color
      }
    ];
  }

  createDefaultCleanModules(config) {
    return [
      {
        id: "clean-bg",
        type: "shape",
        template: "clean-gradient",
        x: 0,
        y: 0,
        w: 1080,
        h: 1440,
        background: "var(--xhs-bg)",
        opacity: 1,
        borderRadius: this.getCoverRadius(),
        locked: true,
        className: "xhs-module-clean-bg"
      },
      {
        id: "clean-title",
        type: "text",
        template: "clean-gradient",
        text: config.title,
        x: 76,
        y: 96,
        w: 928,
        h: 330,
        fontSize: Number(config.title_size) || 104,
        fontWeight: config.title_font_weight || DEFAULT_CONFIG.title_font_weight,
        lineHeight: config.title_line_height || 1.06,
        letterSpacing: 0,
        color: config.text_color,
        background: "transparent",
        textAlign: "center",
        className: "xhs-module-clean-title"
      },
      {
        id: "clean-subtitle",
        type: "text",
        template: "clean-gradient",
        text: config.subtitle,
        x: 170,
        y: 458,
        w: 740,
        h: 72,
        fontSize: Number(config.subtitle_size) || 38,
        fontWeight: config.subtitle_font_weight || DEFAULT_CONFIG.subtitle_font_weight,
        lineHeight: config.title_line_height || 1.08,
        letterSpacing: 0,
        color: this.getCoverSubtitleTextColor(config),
        background: "transparent",
        textAlign: "center",
        className: "xhs-module-clean-subtitle"
      },
      {
        id: "clean-rule",
        type: "shape",
        template: "clean-gradient",
        x: 330,
        y: 590,
        w: 420,
        h: 2,
        background: this.getCleanRuleColor(config),
        borderRadius: 0,
        className: "xhs-module-clean-rule"
      },
      {
        id: "clean-image",
        type: "image",
        template: "clean-gradient",
        role: "main",
        x: 88,
        y: 690,
        w: 904,
        h: 620,
        src: config.main_image || "",
        objectFit: "contain",
        borderRadius: DEFAULT_IMAGE_RADIUS,
        rotation: 0,
        className: "xhs-module-clean-image"
      }
    ];
  }

  createDefaultHuaweiModules(config) {
    return [
      {
        id: "huawei-bg",
        type: "shape",
        template: "huawei-product",
        x: 0,
        y: 0,
        w: 1080,
        h: 1440,
        background: "var(--xhs-bg)",
        opacity: 1,
        borderRadius: this.getCoverRadius(),
        locked: true,
        className: "xhs-module-huawei-bg"
      },
      {
        id: "huawei-title",
        type: "text",
        template: "huawei-product",
        text: config.title,
        x: 72,
        y: 96,
        w: 920,
        h: 292,
        fontSize: Number(config.title_size) || 112,
        fontWeight: config.title_font_weight || DEFAULT_CONFIG.title_font_weight,
        lineHeight: config.title_line_height || 1.06,
        letterSpacing: 0,
        color: config.text_color,
        background: "transparent",
        textAlign: "center",
        className: "xhs-module-huawei-title"
      },
      {
        id: "huawei-subtitle",
        type: "text",
        template: "huawei-product",
        text: config.subtitle,
        x: 174,
        y: 408,
        w: 732,
        h: 76,
        fontSize: Number(config.subtitle_size) || 42,
        fontWeight: config.subtitle_font_weight || DEFAULT_CONFIG.subtitle_font_weight,
        lineHeight: config.title_line_height || 1.08,
        letterSpacing: 0,
        color: this.getCoverSubtitleTextColor(config),
        background: "transparent",
        textAlign: "center",
        className: "xhs-module-huawei-subtitle"
      },
      {
        id: "huawei-rule",
        type: "shape",
        template: "huawei-product",
        x: 356,
        y: 528,
        w: 368,
        h: 2,
        background: this.getHuaweiRuleColor(config),
        borderRadius: 1,
        className: "xhs-module-huawei-rule"
      },
      {
        id: "huawei-image",
        type: "image",
        template: "huawei-product",
        role: "main",
        x: 42,
        y: 616,
        w: 996,
        h: 686,
        src: config.main_image || "",
        objectFit: "contain",
        borderRadius: DEFAULT_IMAGE_RADIUS,
        rotation: 0,
        className: "xhs-module-huawei-image"
      }
    ];
  }

  createDefaultInstagramModules(config) {
    return [
      {
        id: "instagram-bg",
        type: "shape",
        template: "instagram-gradient",
        x: 0,
        y: 0,
        w: 1080,
        h: 1440,
        background: "var(--xhs-bg)",
        opacity: 1,
        borderRadius: this.getCoverRadius(),
        locked: true,
        className: "xhs-module-instagram-bg"
      },
      {
        id: "instagram-title",
        type: "text",
        template: "instagram-gradient",
        text: config.title,
        x: 76,
        y: 118,
        w: 900,
        h: 312,
        fontSize: Number(config.title_size) || 104,
        fontWeight: config.title_font_weight || DEFAULT_CONFIG.title_font_weight,
        lineHeight: config.title_line_height || 1.06,
        letterSpacing: 0,
        color: config.text_color,
        background: "transparent",
        textAlign: "left",
        className: "xhs-module-instagram-title"
      },
      {
        id: "instagram-subtitle",
        type: "text",
        template: "instagram-gradient",
        text: config.subtitle,
        x: 84,
        y: 466,
        w: 630,
        h: 76,
        fontSize: Number(config.subtitle_size) || 38,
        fontWeight: config.subtitle_font_weight || DEFAULT_CONFIG.subtitle_font_weight,
        lineHeight: config.title_line_height || 1.06,
        letterSpacing: 0,
        color: this.getCoverSubtitleTextColor(config),
        background: "transparent",
        textAlign: "left",
        className: "xhs-module-instagram-subtitle"
      },
      {
        id: "instagram-rule",
        type: "shape",
        template: "instagram-gradient",
        x: 84,
        y: 590,
        w: 360,
        h: 8,
        background: "var(--xhs-title-gradient-css)",
        borderRadius: 999,
        className: "xhs-module-instagram-rule"
      },
      {
        id: "instagram-image",
        type: "image",
        template: "instagram-gradient",
        role: "main",
        x: 84,
        y: 660,
        w: 912,
        h: 560,
        src: config.main_image || "",
        objectFit: "cover",
        borderRadius: DEFAULT_IMAGE_RADIUS,
        rotation: 0,
        className: "xhs-module-instagram-image"
      }
    ];
  }

  createDefaultGoogleModules(config) {
    return [
      {
        id: "google-bg",
        type: "shape",
        template: "google-search",
        x: 0,
        y: 0,
        w: 1080,
        h: 1440,
        background: "var(--xhs-bg)",
        opacity: 1,
        borderRadius: this.getCoverRadius(),
        locked: true,
        className: "xhs-module-google-bg"
      },
      {
        id: "google-title",
        type: "text",
        template: "google-search",
        text: config.title,
        x: 92,
        y: 132,
        w: 896,
        h: 300,
        fontSize: Number(config.title_size) || 108,
        fontWeight: config.title_font_weight || DEFAULT_CONFIG.title_font_weight,
        lineHeight: config.title_line_height || 1.06,
        letterSpacing: 0,
        color: config.text_color,
        background: "transparent",
        textAlign: "center",
        className: "xhs-module-google-title"
      },
      {
        id: "google-subtitle",
        type: "text",
        template: "google-search",
        text: config.subtitle,
        x: 162,
        y: 468,
        w: 756,
        h: 86,
        fontSize: Number(config.subtitle_size) || 38,
        fontWeight: config.subtitle_font_weight || DEFAULT_CONFIG.subtitle_font_weight,
        lineHeight: 1.1,
        letterSpacing: 0,
        color: this.getCoverSubtitleTextColor(config),
        background: "#ffffff",
        borderRadius: 999,
        textAlign: "center",
        className: "xhs-module-google-subtitle"
      },
      {
        id: "google-rule",
        type: "shape",
        template: "google-search",
        x: 360,
        y: 612,
        w: 360,
        h: 6,
        background: "var(--xhs-title-gradient-css)",
        borderRadius: 999,
        className: "xhs-module-google-rule"
      },
      {
        id: "google-image",
        type: "image",
        template: "google-search",
        role: "main",
        x: 118,
        y: 700,
        w: 844,
        h: 580,
        src: config.main_image || "",
        objectFit: "cover",
        borderRadius: DEFAULT_IMAGE_RADIUS,
        rotation: 0,
        className: "xhs-module-google-image"
      }
    ];
  }

  getCleanMutedTextColor(config = this.config) {
    return this.isBrightColor(config.text_color || "#1d1d1f") ? "#a1a1a6" : "#6e6e73";
  }

  getCoverSubtitleTextColor(config = this.config) {
    if ((config.subtitle_color_mode || DEFAULT_CONFIG.subtitle_color_mode) === "black") return "#1d1d1f";
    if (config.xhs_style === "huawei-product") return "rgba(31,31,31,0.58)";
    if (config.xhs_style === "instagram-gradient") return "rgba(17,17,17,0.58)";
    if (config.xhs_style === "google-search") return "#5f6368";
    if (this.isCoverLayoutStyle(config.xhs_style)) {
      return config.xhs_style === "dark-fresh-green" ? "rgba(255,255,255,0.82)" : "#5f6368";
    }
    return "#6e6e73";
  }

  getCleanRuleColor(config = this.config) {
    return this.isBrightColor(config.text_color || "#1d1d1f") ? "rgba(245,245,247,0.18)" : "rgba(29,29,31,0.12)";
  }

  getHuaweiMutedTextColor(config = this.config) {
    return this.isBrightColor(config.text_color || "#1f1f1f") ? "rgba(248,240,220,0.72)" : "rgba(31,31,31,0.54)";
  }

  getHuaweiRuleColor(config = this.config) {
    return this.isBrightColor(config.text_color || "#1f1f1f") ? "rgba(248,240,220,0.22)" : "rgba(31,31,31,0.13)";
  }

  getInstagramMutedTextColor(config = this.config) {
    return this.isBrightColor(config.text_color || "#111111") ? "rgba(255,255,255,0.70)" : "rgba(17,17,17,0.56)";
  }

  isBrightColor(color) {
    const text = this.toText(color).trim();
    const match = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return false;
    let hex = match[1];
    if (hex.length === 3) hex = hex.split("").map((char) => char + char).join("");
    const value = Number.parseInt(hex, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }

  buildPages(markdown) {
    const body = markdown.replace(/^\uFEFF?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, "");
    const blocks = [];
    let lines = [], fence = "";
    for (const line of body.split(/\r?\n/)) {
      const marker = line.match(/^ {0,3}([\x60]{3,}|~{3,})(.*)$/);
      if (!fence && /^ {0,3}---[ \t]*$/.test(line)) {
        blocks.push(lines.join("\n").trim());
        lines = [];
        continue;
      }
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = "";
      }
      lines.push(line);
    }
    blocks.push(lines.join("\n").trim());
    const pages = [{ kind: "cover" }];

    blocks.filter(Boolean).forEach((block, index) => {
      const page = this.parseDetailBlock(block, index + 1, true);
      page.sourcePageIndex = index + 1;
      page.isArticleTitle = index === 0 && page.tokens.find(token => token.type !== "spacer")?.level === 1;
      let imageIndex = 0;
      page.tokens.forEach((token) => {
        if (token.type === "image") token.imageKey = this.makeDetailImageKey(index + 1, imageIndex++, token.src);
      });
      if (page.title || page.tokens.length) pages.push(page);
    });

    return pages;
  }

  parseDetailBlock(block, index, scrollable = false) {
    const tokens = this.parseMarkdownTokens(block);
    const titleToken = tokens.find((token) => token.type === "heading");
    return {
      kind: "detail",
      title: titleToken ? titleToken.text : `第 ${index} 页`,
      markdown: block,
      tokens,
      isArticleTitle: index === 1 && tokens.find(token => token.type !== "spacer")?.level === 1,
      scrollable
    };
  }

  parseMarkdownTokens(block) {
    const lines = block.split(/\r?\n/);
    const tokens = [];
    let paragraph = [];
    let list = [];
    let quote = [];
    let code = [];
    let table = [];
    let inCode = false;
    let codeLanguage = "";

    const flushParagraph = () => {
      if (paragraph.length) {
        tokens.push({ type: "paragraph", text: paragraph.join("\n") });
        paragraph = [];
      }
    };
    const flushList = () => {
      if (list.length) {
        tokens.push({ type: "list", items: list });
        list = [];
      }
    };
    const flushQuote = () => {
      if (quote.length) {
        tokens.push({ type: "quote", text: quote.join("\n") });
        quote = [];
      }
    };
    const flushTable = () => {
      if (table.length) {
        const parsed = this.parseMarkdownTable(table);
        if (parsed) tokens.push({ ...parsed, source: table.join("\n") });
        table = [];
      }
    };
    const flushFlow = () => {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (/^```/.test(line)) {
        if (inCode) {
          tokens.push({ type: "code", text: code.join("\n"), language: codeLanguage });
          code = [];
          inCode = false;
        } else {
          flushFlow();
          inCode = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }
      if (inCode) {
        code.push(rawLine);
        return;
      }
      if (!line) {
        flushFlow();
        if (tokens.length) {
      const last = tokens[tokens.length - 1];
      if (last && last.type === "spacer") {
        last.lines = Math.min(4, (last.lines || 1) + 1);
      } else {
        tokens.push({ type: "spacer", lines: 1 });
          }
        }
        return;
      }

      if (/^\|.+\|$/.test(line)) {
        flushParagraph();
        flushList();
        flushQuote();
        table.push(line);
        return;
      }

      const images = this.parseMarkdownImagesLine(line);
      if (images.length) {
        flushFlow();
        images.forEach((image) => tokens.push(image));
        return;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushFlow();
        tokens.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
        return;
      }

      if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
        flushFlow();
        tokens.push({ type: "rule" });
        return;
      }

      const listItem = line.match(/^([-*+]|\d+\.)\s+(.+)$/);
      if (listItem) {
        flushParagraph();
        flushQuote();
        flushTable();
        const indent = (rawLine.match(/^\s*/)[0] || "").replace(/\t/g, "    ").length;
        if (list.length && indent === 0 && /^\d+\.$/.test(list[0].marker) !== /^\d+\.$/.test(listItem[1])) flushList();
        const task = listItem[2].match(/^\[([ xX])\]\s+(.*)$/);
        list.push({ marker: listItem[1], text: task ? task[2] : listItem[2].trim(), depth: Math.min(6, Math.floor(indent / 2)),
          ...(task ? { checked: task[1].toLowerCase() === "x" } : {}) });
        return;
      }

      const quoteLine = line.match(/^>\s?(.+)$/);
      if (quoteLine) {
        flushParagraph();
        flushList();
        quote.push(quoteLine[1].trim());
        return;
      }

      flushList();
      flushQuote();
      flushTable();
      paragraph.push(line);
    });

    if (inCode) tokens.push({ type: "code", text: code.join("\n"), language: codeLanguage });
    flushFlow();
    return tokens;
  }

  parseMarkdownTable(lines) {
    const rows = lines
      .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()))
      .filter((row) => row.length > 1);
    if (!rows.length) return null;
    const filtered = rows.filter((row, index) => {
      if (index !== 1) return true;
      return !row.every((cell) => /^:?-{3,}:?$/.test(cell));
    });
    return { type: "table", rows: filtered };
  }

  isDetailImageWikiTarget(source) {
    const path=String(source || '').split('#')[0];
    const file=this.app?.metadataCache?.getFirstLinkpathDest?.(path,this.activeFile?.path || '');
    const extension=file?.extension || path.match(/\.([^.\/]+)$/)?.[1] || '';
    return /^(png|jpe?g|gif|webp|svg|avif|bmp|tiff?|ico)$/i.test(extension);
  }

  parseMarkdownImage(line) {
    let match = line.match(/^!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
    if (match) {
      if(!this.isDetailImageWikiTarget(match[1]))return null;
      const size = this.parseImageSize(match[2]);
      return { type: "image", src: match[1].trim(), width: size.width, height: size.height };
    }
    match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (!match) return null;
    const size = this.parseImageSize(match[1]);
    return { type: "image", src: match[2].trim(), width: size.width, height: size.height, alt: match[1].trim() };
  }

  parseMarkdownImagesLine(line) {
    const source = this.toText(line).trim();
    if (!source) return [];
    const pattern = /!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]|!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let cursor = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      if (source.slice(cursor, match.index).trim()) return [];
      if (match[1]) {
        if(!this.isDetailImageWikiTarget(match[1]))return [];
        const size = this.parseImageSize(match[2]);
        images.push({ type: "image", src: match[1].trim(), width: size.width, height: size.height });
      } else {
        const size = this.parseImageSize(match[3]);
        images.push({ type: "image", src: match[4].trim(), width: size.width, height: size.height, alt: match[3].trim() });
      }
      cursor = pattern.lastIndex;
    }
    if (!images.length || source.slice(cursor).trim()) return [];
    return images;
  }

  parseImageSize(value) {
    const text = this.toText(value).trim();
    const match = text.match(/(\d{2,4})(?:\s*[x×]\s*(\d{2,4}))?/i);
    return {
      width: match ? Number.parseInt(match[1], 10) : 0,
      height: match && match[2] ? Number.parseInt(match[2], 10) : 0
    };
  }

  async render() {
    this.renderControls();
    await this.renderPreview();
  }

  renderControls() {
    const renderVersion = (this.controlsRenderVersion || 0) + 1;
    this.controlsRenderVersion = renderVersion;
    const scrollTop = this.controlsEl.scrollTop;
    const scrollLeft = this.controlsEl.scrollLeft;
    this.controlsEl.empty();

    const kind = this.pages[this.activePageIndex]?.kind === "detail" ? "detail" : "cover";
    const pageKindChanged = this.controlsEl.dataset.pageKind !== kind;
    this.controlsEl.dataset.pageKind = kind;
    if (kind === "cover") {
      this.renderUnifiedCoverControls();
      this.renderCollapsibleControls("自定义模块", "customModuleLibraryOpen", () => {
        this.renderModuleLibrary();
      });
    } else {
      this.renderDetailControls();
    }
    if (pageKindChanged) this.syncStudioViewport();
    this.controlsEl.scrollTop = scrollTop;
    this.controlsEl.scrollLeft = scrollLeft;
    window.requestAnimationFrame(() => {
      if (this.controlsRenderVersion !== renderVersion) return;
      this.controlsEl.scrollTop = scrollTop;
      this.controlsEl.scrollLeft = scrollLeft;
    });
  }

  getUnifiedCoverTemplates() {
    const names={"neon-grid":"杂志标题型","nng-red-system":"上下对比型",
      "aside-image":"右图左文型","solid-poster":"满版叠字型",
      "mosaic":"主辅三图型","center-banner":"中段横幅型",
      "headline-band":"上题中图型","image-caption":"双栏下图型",
      "band-columns":"上图下题型","left-image-title":"左图右题型"};
    const order=["headline-band","image-caption","band-columns","mosaic","aside-image","left-image-title","solid-poster","center-banner","neon-grid","nng-red-system"];
    return [{id:"neon-grid",style:"neon-grid"},{id:"nng-red-system",style:"nng-red-system"},
      ...COMPOSITION_PRESETS.map(preset=>({...preset,style:"composition"}))].map(preset=>({...preset,name:names[preset.id]}))
      .sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  }

  getCoverTemplateKey(config=this.config) {
    return config.xhs_style==="composition"?`composition:${config.composition_variant}`:config.xhs_style;
  }

  applyDefaultCoverAppearance(config=this.config) {
    const palette=CLEAN_GRADIENT_PALETTES.find(item=>item.id==="apple-air-sky");
    Object.assign(config,{background_color:palette.background,secondary_color:palette.secondary,accent_color:palette.accent,
      text_color:"#000000",cover_title_color:"#000000",cover_highlight_color:"",title_gradient_enabled:false,google_gradient_enabled:false,
      composition_theme:"custom",cover_typography_version:0,cover_text_layout_version:0});
    Object.assign(config,{cover_overlay_width:0,cover_overlay_height:0,cover_overlay_opacity:70});
    Object.assign(config,{cover_title_display:'normal',cover_cutout_transparency:100,cover_rule_hidden:false,cover_rule_thickness:0});
    config.composition_custom_colors=this.captureCompositionColors(config);
    if(config.xhs_style==="neon-grid")Object.assign(config,{background_color:"#000000",text_color:"#ffffff",
      cover_title_color:"#ffffff",accent_color:"#00d6bd",secondary_color:"#00d6bd"});
  }

  createSwissCoverModules(config=this.config) {
    const id=config.xhs_style==="composition" ? config.composition_variant : config.xhs_style;
    const titleLines=Math.min(3,Math.max(1,String(config.title || "").split(/\r?\n/).length));
    const subLines=Math.min(2,Math.max(1,String(config.subtitle || "").split(/\r?\n/).length));
    let size=80,line=88,x=72,y=72,w=776,subSize=24,subLine=32,descriptionLine=28;
    if(id==="center-banner"){size=88;line=96;x=120;y=488;w=840;subSize=28;subLine=36;descriptionLine=30;}
    if(id==="solid-poster"){size=88;line=96;y=192;w=840;}
    if(id==="image-caption"){size=64;line=72;y=760;w=776;}
    if(["headline-band","band-columns","mosaic"].includes(id)){size=72;line=80;descriptionLine=30;}
    if(["aside-image","nng-red-system"].includes(id)){size=64;line=72;w=456;y=144;}
    if(id==="nng-red-system")y=72;
    const common={template:config.xhs_style,swissCover:true,rotation:0,borderRadius:0,borderWidth:0};
    const text=(role,value,tx,ty,tw,font,leading,weight,maxLines)=>({...common,id:`swiss-${role}`,type:"text",text:value || "",
      x:tx,y:ty,w:tw,h:leading*Math.max(1,String(value || "").split(/\r?\n/).length),fontSize:font,
      lineHeight:leading/font,fontWeight:weight,letterSpacing:0,textAlign:"left",background:"transparent",
      color:role==="title" ? config.cover_title_color || config.text_color : config.text_color,
      maxLines,className:`xhs-module-swiss-${role}`});
    const subY=y+titleLines*line+24,descY=subY+subLines*subLine+32;
    const result=[text("title",config.title,x,y,w,size,line,800,3),
      text("subtitle",config.subtitle,x,subY,w,subSize,subLine,600,2),
      text("description",config.composition_description,x,descY,w,20,descriptionLine,400,3)];
    const image=(key,ix,iy,iw,ih)=>({...common,id:`swiss-image-${key}`,type:"image",x:ix,y:iy,w:iw,h:ih,
      src:config.composition_image || config.main_image || "",objectFit:"cover",className:"xhs-module-swiss-image"});
    if(["center-banner","solid-poster"].includes(id)) {
      if(id==="solid-poster")Object.assign(result[2],{x:120,y:1240,w:840});
      result.unshift(image(0,0,0,1080,1440));
      result.splice(1,0,{...common,id:"swiss-mask",type:"shape",x:72,y:id==="center-banner"?440:1208,w:936,
        h:id==="center-banner"?560:160,background:config.background_color || "#f5f5f7",className:"xhs-module-swiss-mask"});
    } else if(id==="image-caption")result.unshift(image(0,72,72,936,640));
    else if(["aside-image","nng-red-system"].includes(id))result.unshift(image(0,552,y,456,id==="nng-red-system"?1296:1008));
    else if(id==="left-image-title") {
      Object.assign(result[0],{x:72,w:776});Object.assign(result[1],{x:72,w:456});
      Object.assign(result[2],{x:552,y:1056,w:456});result.unshift(image(0,72,536,456,768));
    } else if(id==="mosaic") {
      result.unshift(...MOSAIC_IMAGE_FRAMES.map((frame, index) => image(index, ...frame)));
    } else {
      const columnBottom=id==="band-columns" ? Math.max(subY+subLines*subLine,subY+Math.min(3,Math.max(1,String(config.composition_description || "").split(/\r?\n/).length))*descriptionLine) : subY+subLines*subLine;
      const imageY=Math.ceil((columnBottom+48)/8)*8;
      const height=id==="headline-band"?560:600;
      Object.assign(result[2],{y:imageY+height+32});
      if(id==="band-columns"){result[1].w=296;Object.assign(result[2],{x:392,w:616,y:subY});}
      result.unshift(image(0,72,imageY,936,height));
    }
    return result;
  }

  ensureSwissCover(config=this.config,reset=false) {
    config.xhs_width=1080;config.xhs_height=1440;
    if(config.swiss_cover_version!==1 && config.background_color===DEFAULT_CONFIG.background_color) {
      config.background_color="#f5f5f7";
      if(config.text_color===DEFAULT_CONFIG.text_color)config.text_color="#111116";
      if(!config.cover_title_color || config.cover_title_color===DEFAULT_CONFIG.text_color)config.cover_title_color="#111116";
    }
    config.title_gradient_enabled=false;config.google_gradient_enabled=false;
    config.title_art_font_cn="none";config.title_art_font_en="none";
    for(const kind of ["title","subtitle","highlight"])config[`${kind}_outline_mode`]="off";
    if(reset || config.swiss_cover_version!==1 || !config.xhs_modules.some(module=>module.swissCover)) {
      this.saveCurrentStyleModules(config);
      const custom=config.xhs_modules.filter(module=>module.custom),images=config.xhs_modules.filter(module=>module.type==="image");
      config.xhs_modules=[...this.createSwissCoverModules(config),...custom];
      let index=0;
      for(const module of config.xhs_modules.filter(module=>module.swissCover && module.type==="image")) {
        if(images[index]?.src)module.src=images[index].src;
        index++;
      }
    }
    config.swiss_cover_version=1;
  }

  ensureUnifiedCoverVisuals(config=this.config) {
    if(config.cover_solid_palette_version!==1) {
      config.title_gradient_enabled=false;config.google_gradient_enabled=false;
      config.cover_solid_palette_version=1;
    }
    const current=config.xhs_modules || [];
    const stripped=current.some(module=>module.swissCover);
    if(stripped || !current.length) {
      const stored=config.xhs_style==="composition"
        ? config.composition_modules_by_layout?.[config.composition_variant]
        : this.getStoredModulesForStyle(config,config.xhs_style);
      const hasOriginal=stored?.length && !stored.some(module=>module.swissCover);
      const restored=hasOriginal
        ? this.cloneModules(stored) : this.createDefaultModulesForStyle(config.xhs_style,config);
      const custom=current.filter(module=>module.custom);
      const sources=current.filter(module=>module.type==="image" && !module.custom);
      const existing=new Set(restored.map(module=>module.id));
      config.xhs_modules=[...restored,...custom.filter(module=>!existing.has(module.id))];
      config.xhs_modules.filter(module=>module.type==="image" && !module.custom).forEach((module,index)=>{
        if(sources[index]?.src)module.src=sources[index].src;
      });
      if(config.xhs_style==="neon-grid" && sources[0]?.src && !config.xhs_modules.some(module=>module.type==="image" && !module.custom)) {
        config.xhs_modules.push({id:"cover-main-image",type:"image",template:"neon-grid",role:"main",src:sources[0].src,
          x:672,y:908,w:350,h:430,objectFit:"contain",borderRadius:0,className:"xhs-module-cover-image"});
      }
    }
    // Restore the template's own visual modules, not a generic replacement layout.
    config.swiss_cover_version=0;
    config.cover_visual_version=2;
    config.xhs_width=1080;config.xhs_height=1440;
    config.title_art_font_cn="none";config.title_art_font_en="none";
    config.cover_typography_version=3;
    if(config.cover_text_layout_version!==1) {
      config.cover_text_layout_version=1;
      config.title_gradient_enabled=false;config.google_gradient_enabled=false;
      for(const role of ["title","subtitle","highlight"])config[`${role}_outline_mode`]="off";
    }
    this.removeDisabledCustomModules(config);
    this.layoutCoverText(config);
    const titleModule=config.xhs_modules.find(module=>module.coverTextRole==='title');
    if(titleModule)config.cover_title_color ||= titleModule.color;
    if(titleModule)Object.assign(config,{title_font_weight:titleModule.fontWeight,title_line_height:titleModule.lineHeight,
      title_letter_spacing:titleModule.letterSpacing,cover_font_weight:titleModule.fontWeight,
      cover_line_height:titleModule.lineHeight,cover_letter_spacing:titleModule.letterSpacing});
  }

  normalizeCoverTextStyle(style) {
    const result={};
    if(!style || typeof style!=="object")return result;
    const numeric={fontSize:[1,400],fontWeight:[100,1000],lineHeight:[0.6,3],letterSpacing:[0,100]};
    for(const [key,[min,max]] of Object.entries(numeric)) {
      if(Number.isFinite(Number(style[key])) && style[key]!=null)result[key]=Math.max(min,Math.min(max,Number(style[key])));
    }
    if(["left","center","right"].includes(style.textAlign))result.textAlign=style.textAlign;
    const color=this.parseCoverHexColor(style.color);
    if(color)result.color=color;
    return result;
  }

  measureCoverText(text,width,size,leading,weight,balanced=false,tracking=0,wrapLongWords=false) {
    if(!text)return {height:0,lines:0};
    if(typeof document!=="undefined" && document.body) {
      const probe=document.createElement("div");
      probe.style.cssText=`position:fixed;left:-20000px;top:0;width:${width}px;padding:0;margin:0;border:0;font-family:${CONTENT_FONT_STACK};font-size:${size}px;font-weight:${weight};line-height:${leading}px;letter-spacing:${tracking}px;white-space:pre-wrap;word-break:normal;overflow-wrap:${wrapLongWords?"anywhere":"normal"};text-wrap:${balanced?"balance":"wrap"};`;
      probe.textContent=text;document.body.append(probe);
      const height=probe.getBoundingClientRect().height;probe.remove();
      return {height,lines:Math.round(height/leading)};
    }
    const lines=String(text).split(/\r?\n/).reduce((count,line)=>count+Math.max(1,Math.ceil(Array.from(line).reduce((sum,char)=>sum+(/[^\u0000-\u007f]/.test(char)?size:size*0.6),0)/width)),0);
    return {height:lines*leading,lines};
  }

  isMagazineSubtitle(module) {
    return module?.template === "neon-grid" && module.coverTextRole === "subtitle";
  }

  getCoverTextFramePadding(module) {
    return this.isMagazineSubtitle(module) ? 16 : 4;
  }

  measureCoverTextFrame(module,text=module.text) {
    const padding=this.getCoverTextFramePadding(module);
    const measured=this.measureCoverText(String(text || "").replace(/\{\{([^{}]+)\}\}/g,"$1"),
      Math.max(1,module.w-padding*2),module.fontSize,module.fontSize*module.lineHeight,module.fontWeight,
      module.coverTextRole==="title",module.letterSpacing,this.isMagazineSubtitle(module));
    return {...measured,padding,height:measured.height+padding*2};
  }

  measureCoverTextWidth(text,size,weight,tracking=0) {
    const lines=String(text || "").split(/\r?\n/);
    const ctx=typeof document!=="undefined"?document.createElement("canvas").getContext("2d"):null;
    if(ctx)ctx.font=`${weight} ${size}px ${CONTENT_FONT_STACK}`;
    return Math.max(0,...lines.map(line=>(ctx?ctx.measureText(line).width:Array.from(line).reduce((width,char)=>width+(/[^\u0000-\u007f]/.test(char)?size:size*0.6),0))+Array.from(line).length*tracking));
  }

  applyCoverDescriptionAlignment(module) {
    if(module.coverTextRole==="description" && !module.coverTextStyle?.textAlign)
      module.textAlign="left";
  }

  layoutCoverText(config=this.config) {
    const g=COVER_TEXT_GRID,span=n=>n*g.column+(n-1)*g.gutter;
    const id=config.xhs_style==="composition"?config.composition_variant:config.xhs_style;
    if(id==='nng-red-system') {this.layoutComparisonCover(config);return;}
    const modules=config.xhs_modules;
    const title=modules.find(module=>this.isCoverTitleModule(module));
    const subtitle=modules.find(module=>this.isCoverSubtitleModule(module));
    let description=modules.find(module=>["composition-description","cover-description"].includes(module.id));
    if(!title || !subtitle)return;
    if(!description) {
      description={id:"cover-description",type:"text",template:config.xhs_style,className:"xhs-module-cover-description"};modules.push(description);
    }
    if(id==="neon-grid") {
      this.layoutMagazineReference(config,title,subtitle,description);
      return;
    }
    const media=modules.filter(module=>module.type==="image" && !module.custom);
    if(id==="mosaic") {
      const extra=media.slice(MOSAIC_IMAGE_FRAMES.length);
      if(extra.length) {
        const archive=Array.isArray(config.mosaic_image_archive)?config.mosaic_image_archive:[];
        for(const image of extra)if(image.src && !archive.some(saved=>saved.id===image.id && saved.src===image.src))archive.push({id:image.id,src:image.src});
        config.mosaic_image_archive=archive;
        for(let index=modules.length-1;index>=0;index--)if(extra.includes(modules[index]))modules.splice(index,1);
        media.splice(MOSAIC_IMAGE_FRAMES.length);
      }
      media.forEach((module, index) => {
        const [x, y, w, h] = MOSAIC_IMAGE_FRAMES[index];
        Object.assign(module, { x, y, w, h, objectFit: "contain", borderRadius: 0, borderWidth: 0 });
      });
    }
    const bottom=media.length?Math.max(...media.map(module=>module.y+module.h)):0;
    let top=media.length?Math.min(...media.map(module=>module.y)):1440;
    const size=id==='mosaic'?72:VISUAL_RULES.coverTitle;
    const color=this.getCompositionBackgroundTextColor(id==="nng-red-system"?{background_color:"#ffffff"}:config,config.text_color);
    if(id==='headline-band'){this.layoutHeadlineCover(config,title,subtitle,description,media,color);return;}
    const make=(module,role,text,x,y,w,font,leading,weight,maxLines)=>{
      const style={fontSize:font,fontWeight:weight,lineHeight:leading/font,letterSpacing:0,textAlign:"left",
        ...this.normalizeCoverTextStyle(module.coverTextStyle)};
      if(module.manualPosition){x=module.x;y=module.y;}
      if(module.manualSize)w=module.w;
      Object.assign(module,{text:text || "",coverTextRole:role,x,y,w,...style,rotation:0,
        borderRadius:0,borderWidth:0,background:"transparent",maxLines,
        color:role==="title"?config.cover_title_color || color:(style.color || color)});
      this.constrainCoverTextModuleToSafeArea(module);
      const measured=this.measureCoverTextFrame(module);
      module.h=measured.height;
      this.applyCoverDescriptionAlignment(module);
      this.constrainCoverTextModuleToSafeArea(module);
      if(module.manualSize || role==="subtitle")module.maxLines=Math.max(maxLines,measured.lines);
      return text?module.h:0;
    };
    let x=g.margin,y=g.margin,w=span(6);
    if(["aside-image","mosaic","band-columns"].includes(id))y=bottom+g.imageGap;
    if(id==="nng-red-system")y=Math.max(bottom+g.imageGap,768);
    if(id==="center-banner"){x=72;y=488;w=936;}
    if(id==="solid-poster")y=192;
    const th=make(title,"title",config.title,x,y,w,size,size*VISUAL_RULES.coverTitleLeading,VISUAL_RULES.headingWeight,3);
    if(id==="left-image-title" && !title.manualPosition && media.every(image=>!image.manualPosition)) {
      const shift=Math.max(0,title.y+th+g.imageGap-top);
      media.forEach(image=>{image.y+=shift;if(!image.manualSize)image.h=Math.min(image.h,g.height-g.margin-image.y);});
      top+=shift;
    }
    const sy=title.y+th+(th?g.titleGap:0);
    let sw=w,sx=x,dy=sy;
    if(id==="image-caption"){sw=span(2);sx=g.margin;}
    if(id==="left-image-title"){sx=g.margin+4*(g.column+g.gutter);sw=span(2);}
    const subtitleY=id==="left-image-title"?top+g.imageGap:sy;
    const sh=make(subtitle,"subtitle",config.subtitle,sx,subtitleY,sw,g.subtitleSize,g.subtitleLeading,600,sw<span(3)?3:2);
    dy=sh?subtitle.y+sh+g.descriptionGap:title.y+th+g.descriptionGap;
    let dx=sx,dw=sw;
    if(id==="image-caption"){dx=g.margin+2*(g.column+g.gutter);dw=span(4);dy=sy;}
    if(id==="headline-band" || id==="center-banner"){dx=g.margin;dw=span(6);dy=bottom+g.descriptionGap;}
    if(id==="solid-poster") {
      const style={fontSize:g.descriptionSize,lineHeight:g.descriptionLeading/g.descriptionSize,fontWeight:400,letterSpacing:0,
        ...this.normalizeCoverTextStyle(description.coverTextStyle)};
      const measured=this.measureCoverTextFrame({...description,...style,coverTextRole:"description",w:description.manualSize?description.w:w},config.composition_description);
      dy=Math.floor((g.height-g.margin-measured.height)/8)*8;
    }
    make(description,"description",config.composition_description,dx,dy,dw,g.descriptionSize,g.descriptionLeading,400,id==="left-image-title"?6:3);
    if(id==="left-image-title" && media.length && !subtitle.manualPosition && !description.manualPosition) {
      const groupHeight=description.y+description.h-subtitle.y;
      const imageHeight=Math.max(...media.map(image=>image.y+image.h))-top;
      const shift=top+Math.max(24,(imageHeight-groupHeight)/2)-subtitle.y;
      subtitle.y+=shift;description.y+=shift;
    }
    if(["band-columns","mosaic","aside-image"].includes(id)
      && description.y+description.h>g.height-g.margin && config.subtitle && config.composition_description
      && ![title,subtitle,description].some(module=>module.manualPosition || module.manualSize)) {
      make(subtitle,"subtitle",config.subtitle,g.margin,sy,span(2),g.subtitleSize,g.subtitleLeading,600,3);
      make(description,"description",config.composition_description,g.margin+2*(g.column+g.gutter),sy,span(4),g.descriptionSize,g.descriptionLeading,400,4);
    }
    if(id==="image-caption" || id==="headline-band") {
      const textBottom=id==="image-caption"?Math.max(subtitle.y+subtitle.h,description.y+description.h):subtitle.y+subtitle.h;
      if(id==="image-caption" && media.every(image=>!image.manualPosition) && ![title,subtitle,description].some(module=>module.manualPosition)) {
        const shift=Math.max(0,textBottom+g.imageGap-top);
        media.forEach(image=>{image.y+=shift;if(!image.manualSize)image.h=Math.min(image.h,g.height-g.margin-image.y);});
      }
      const delta=Math.max(0,top-g.imageGap-textBottom);
      if(!title.manualPosition)title.y+=delta;
      if(!subtitle.manualPosition)subtitle.y+=delta;
      if(id==="image-caption" && !description.manualPosition)description.y+=delta;
    }
    if(id==="nng-red-system" && ![title,subtitle,description].some(module=>module.manualPosition)) {
      const shift=Math.ceil(Math.max(0,description.y+description.h-(g.height-g.margin))/8)*8;
      if(shift && title.y-shift>=Math.max(g.margin,bottom+g.imageGap)) {
        title.y-=shift;subtitle.y-=shift;description.y-=shift;
      }
    }
    if(["center-banner","solid-poster"].includes(id)) {
      title.color=config.cover_title_color || this.getCompositionBackgroundTextColor({background_color:VISUAL_RULES.surface});
      subtitle.color=this.normalizeCoverTextStyle(subtitle.coverTextStyle).color || this.getCompositionBackgroundTextColor({background_color:"#ffffff"},config.text_color);
      const backdrop=modules.find(module=>module.id==="composition-block");
      if(backdrop)this.layoutCoverBackdrop(config,backdrop,[title,subtitle]);
    }
    if (!config.cover_rule_hidden) {
    let rule=modules.find(module=>module.id==="cover-structure-rule");
    if(!rule){rule={id:"cover-structure-rule",type:"shape",template:config.xhs_style};modules.push(rule);}
    Object.assign(rule,{name:"辅助横线",
      x:rule.manualPosition?rule.x:subtitle.x,y:rule.manualPosition?rule.y:subtitle.y+subtitle.h+16,
      w:rule.manualSize?rule.w:Math.min(subtitle.w,160),h:config.cover_rule_thickness || this.getContentDivider(config).width,
      background:config.secondary_color,opacity:1,rotation:0,borderRadius:0,borderWidth:0,className:"xhs-cover-structure-rule"});
    } else config.xhs_modules=config.xhs_modules.filter(m=>m.id!=="cover-structure-rule");
    if(id==="solid-poster") {
      let caption=modules.find(module=>module.id==="cover-caption-backdrop");
      if(!caption){caption={id:"cover-caption-backdrop",type:"shape",template:config.xhs_style};modules.push(caption);}
      Object.assign(caption,{x:0,y:description.y-24,w:1080,h:1440-description.y+24,
        background:description.text?this.hexToRgba(config.background_color || "#ffffff",0.98):"transparent",borderRadius:0,borderWidth:0,
        className:"xhs-cover-text-backdrop"});
      this.layoutCoverBackdrop(config,caption,[description]);
    }
    const labelIds=new Set(["tags","small-title","cta","footer","layout-kicker","layout-cta","layout-footer"]);
    for(const module of modules.filter(module=>module.type==="text" && !module.custom && !module.manualStyle && !module.manualFontSize && !module.coverTextRole && labelIds.has(module.id))) {
      Object.assign(module,{fontSize:28,fontWeight:400,lineHeight:1.5,letterSpacing:0,color});
    }
    // Grid roles are rendered without the legacy badge/photo-label padding or automatic fitting.
    for(const module of modules) {
      if(module.coverTextRole)module.manualFontSize=module.coverTextStyle?.fontSize!=null;
      if(module.type==="image" && !module.custom){module.borderRadius=0;module.borderWidth=0;}
    }
    config.title_size=title.fontSize;config.subtitle_size=subtitle.fontSize;
  }

  createComparisonCoverModules(config) {
    const image=(id,name,y)=>({id,name,type:'image',template:'nng-red-system',role:'comparison',
      x:0,y,w:1080,h:720,src:'',objectFit:'contain',aspectRatio:1.5,locked:true,
      borderRadius:0,borderWidth:0,background:'transparent',className:'xhs-module-comparison-image'});
    const text=(role,size,leading)=>({id:`comparison-${role}`,type:'text',template:'nng-red-system',
      coverTextRole:role,text:config[role==='description'?'composition_description':role] || '',
      x:72,y:640,w:936,h:leading,fontSize:size,fontWeight:role==='description'?400:600,
      lineHeight:leading/size,letterSpacing:0,textAlign:'center',color:config.cover_title_color || '#000000',
      background:'transparent',borderWidth:0,borderRadius:0,
      className:role==='title'?'xhs-module-google-title':role==='subtitle'?'xhs-module-google-subtitle':'xhs-module-cover-description'});
    return [image('comparison-top','上方图片',0),image('comparison-bottom','下方图片',720),
      {id:'comparison-backdrop',name:'标题半透明底块',type:'shape',template:'nng-red-system',
        x:72,y:600,w:936,h:240,background:'rgba(255, 255, 255, 0.68)',borderRadius:0,borderWidth:0,locked:true,
        className:'xhs-cover-text-backdrop'},text('title',100,120),text('subtitle',40,52),text('description',36,57.6)];
  }

  layoutComparisonCover(config) {
    const previous=config.xhs_modules || [];
    if(!['comparison-top','comparison-bottom','comparison-backdrop','comparison-title','comparison-subtitle','comparison-description'].every(id=>previous.some(m=>m.id===id))) {
      const fresh=this.createComparisonCoverModules(config),sources=previous.filter(m=>m.type==='image'&&!m.custom);
      fresh.filter(m=>m.type==='image').forEach((m,i)=>{if(sources[i]?.src)m.src=sources[i].src;});
      for(const role of ['title','subtitle','description']) {
        const old=previous.find(m=>m.coverTextRole===role || (role==='title'?this.isCoverTitleModule(m):role==='subtitle'?this.isCoverSubtitleModule(m):m.id==='cover-description'));
        if(old?.coverTextStyle)fresh.find(m=>m.coverTextRole===role).coverTextStyle={...old.coverTextStyle};
      }
      config.xhs_modules=[...fresh,...previous.filter(m=>m.custom)];
      config.background_color='#ffffff';
    }
    const modules=config.xhs_modules;
    for(const [i,id]of ['comparison-top','comparison-bottom'].entries()) {
      const m=modules.find(m=>m.id===id);
      Object.assign(m,{x:0,y:i*720,w:1080,h:720,aspectRatio:1.5,locked:true,rotation:0,borderWidth:0,borderRadius:0});
      if(!['contain','cover'].includes(m.objectFit))m.objectFit='contain';
    }
    const roles=['title','subtitle','description'].map(role=>modules.find(m=>m.coverTextRole===role));
    for(const m of roles) {
      const role=m.coverTextRole,size={title:100,subtitle:40,description:36}[role];
      const leading={title:1.2,subtitle:1.3,description:1.6}[role];
      Object.assign(m,{text:config[role==='description'?'composition_description':role] || '',
        fontSize:size,fontWeight:role==='description'?400:600,lineHeight:leading,letterSpacing:0,textAlign:'center',
        ...this.normalizeCoverTextStyle(m.coverTextStyle),
        color:role==='title'?(config.cover_title_color || '#000000'):(this.normalizeCoverTextStyle(m.coverTextStyle).color || '#1D1D1F'),background:'transparent',rotation:0,borderWidth:0,borderRadius:0});
      if(!m.manualSize)m.w=936;
      if(!m.manualPosition)m.x=72;
      this.constrainCoverTextModuleToSafeArea(m);
      const measured=this.measureCoverTextFrame(m);
      m.h=m.text?measured.height:0;
      m.maxLines=Math.max(m.coverTextRole==='title'?3:2,measured.lines);
    }
    const visible=roles.filter(m=>m.text),height=visible.reduce((sum,m)=>sum+m.h,0)+Math.max(0,visible.length-1)*32;
    let y=Math.max(104,720-height/2);
    for(const m of roles){if(!m.manualPosition)m.y=y;if(m.text)y=m.y+m.h+32;}
    const backdrop=modules.find(m=>m.id==='comparison-backdrop');
    this.layoutCoverBackdrop(config,backdrop,roles,720);
    config.title_size=roles[0].fontSize;config.subtitle_size=roles[1].fontSize;
  }

  layoutHeadlineCover(config,title,subtitle,description,media,color) {
    const manual=[title,subtitle,description,...media].some(m=>m.manualPosition);
    const roles=[[title,'title',config.title,84,1.1,600],[subtitle,'subtitle',config.subtitle,32,1.35,600],
      [description,'description',config.composition_description,28,1.5,400]];
    for(const [m,role,text,size,leading,weight]of roles) {
      Object.assign(m,{text:text || '',coverTextRole:role,fontSize:size,lineHeight:leading,fontWeight:weight,letterSpacing:0,textAlign:'left',
        ...this.normalizeCoverTextStyle(m.coverTextStyle),color:role==='title'?config.cover_title_color || color:(this.normalizeCoverTextStyle(m.coverTextStyle).color || color),
        background:'transparent',borderRadius:0,borderWidth:0,rotation:0});
      if(!m.manualSize)m.w=936;
      if(!manual)m.x=72;
      const measured=this.measureCoverTextFrame(m);m.h=m.text?measured.height:0;m.maxLines=Math.max(role==='title'?3:2,measured.lines);
    }
    for(const image of media) {
      if(!image.manualSize)Object.assign(image,{w:1080,h:810});
      image.objectFit='contain';
      if(!image.manualPosition)image.x=0;
    }
    if(!manual) {
      let y=72;
      for(const m of [title,subtitle])if(m.text){m.y=y;y+=m.h+16;}else m.y=y;
      for(const image of media){image.y=y;y+=image.h+32;}
      description.y=y;
    }
    if (!config.cover_rule_hidden) {
    let rule=config.xhs_modules.find(m=>m.id==='cover-structure-rule');
    if(!rule){rule={id:'cover-structure-rule',type:'shape',template:'composition'};config.xhs_modules.push(rule);}
    if(!rule.manualPosition)Object.assign(rule,{x:subtitle.x,y:subtitle.y+subtitle.h+8});
    if(!rule.manualSize)rule.w=160;
    Object.assign(rule,{h:config.cover_rule_thickness || this.getContentDivider(config).width,background:config.secondary_color,className:'xhs-cover-structure-rule',borderWidth:0,borderRadius:0,opacity:1,rotation:0});
    } else config.xhs_modules=config.xhs_modules.filter(m=>m.id!=="cover-structure-rule");
    config.title_size=title.fontSize;config.subtitle_size=subtitle.fontSize;
  }

  layoutCoverBackdrop(config,backdrop,roles,centerY=null) {
    const width=1080;
    const x=(1080-width)/2,visible=roles.filter(m=>String(m.text || '').trim());
    let nextY=visible[0]?.y || 104;
    for(const m of visible) {
      m.x=x+72;m.w=width-144;
      const measured=this.measureCoverTextFrame(m);
      m.h=measured.height;m.maxLines=Math.max(m.maxLines || 0,measured.lines);
      m.y=Math.max(nextY,m.y);nextY=m.y+m.h+32;
    }
    const textTop=visible.length?Math.min(...visible.map(m=>m.y)):nextY;
    const textBottom=visible.length?Math.max(...visible.map(m=>m.y+m.h)):nextY;
    const height=textBottom-textTop+64;
    const y=Math.max(40,Math.min(1400-height,centerY==null?textTop-32:centerY-height/2));
    const shift=y+32-textTop;
    visible.forEach(m=>m.y+=shift);
    const opacity=Math.max(0,Math.min(100,Math.round(Number(config.cover_overlay_opacity??70)/10)*10));
    Object.assign(backdrop,{x,y,w:width,h:height,background:visible.length?`rgba(255, 255, 255, ${this.isTransparentCoverTitle(config)?1:opacity/100})`:'transparent',
      opacity:1,borderRadius:0,borderWidth:0,locked:true,className:'xhs-cover-text-backdrop'});
  }

  renderCoverBackdropTools(toolbar) {
    if(!this.config.xhs_modules.some(m=>(m.className || '').includes('xhs-cover-text-backdrop') && m.background!=='transparent'))return;
    const update=(key,value)=>{this.config[key]=value;this.layoutCoverText();this.persistDraft();void this.renderPreview();};
    const displayTools = toolbar.createDiv({ cls: "xhs-cover-tool-group" });
    displayTools.createSpan({text:'标题显示',cls:'xhs-canvas-toolbar-label'});
    const mode=displayTools.createEl('select',{attr:{'aria-label':'标题显示'}});
    for(const [value,text]of [['normal','普通标题'],['cutout','透明镂空']])mode.createEl('option',{text,attr:{value}});
    mode.value=this.isTransparentCoverTitle()?'cutout':'normal';
    mode.addEventListener('change',()=>update('cover_title_display',mode.value));
    const opacityTools = toolbar.createDiv({ cls: "xhs-cover-tool-group" });
    opacityTools.createSpan({text:'透明度',cls:'xhs-canvas-toolbar-label'});
    const select=opacityTools.createEl('select',{attr:{'aria-label':'透明度'}});
    for(let value=0;value<=100;value+=10)select.createEl('option',{text:`${value}%`,attr:{value:String(value)}});
    select.value=String(this.isTransparentCoverTitle()?this.config.cover_cutout_transparency??100:100-(this.config.cover_overlay_opacity??70));
    select.addEventListener('change',()=>update(this.isTransparentCoverTitle()?'cover_cutout_transparency':'cover_overlay_opacity',this.isTransparentCoverTitle()?Number(select.value):100-Number(select.value)));
  }

  isTransparentCoverTitle(config=this.config) {
    const id=config.xhs_style==='composition'?config.composition_variant:config.xhs_style;
    return config.cover_title_display==='cutout' && ['solid-poster','center-banner','nng-red-system'].includes(id);
  }

  renderTransparentCoverTitle(card) {
    this.coverCutoutRaster=null;
    if(!this.isTransparentCoverTitle())return;
    const title=this.config.xhs_modules.find(m=>m.coverTextRole==='title');
    const panel=this.config.xhs_modules.find(m=>['comparison-backdrop','composition-block'].includes(m.id));
    if(!title?.text || !panel)return;
    const element=card.querySelector(`[data-module-id="${title.id}"]`),backdrop=card.querySelector(`[data-module-id="${panel.id}"]`);
    if(!element || !backdrop)return;
    const canvas=document.createElement('canvas'),scale=3;
    canvas.width=Math.ceil(panel.w*scale);canvas.height=Math.ceil(panel.h*scale);
    const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,panel.w,panel.h);
    ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=Math.max(0,Math.min(100,this.config.cover_cutout_transparency??100))/100;
    const bounds=card.getBoundingClientRect(),ratio=bounds.width/1080 || 1;
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let text;
    while((text=walker.nextNode())) {
      const style=getComputedStyle(text.parentElement);ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.textBaseline='alphabetic';
      const metrics=ctx.measureText('Mg'),ascent=metrics.fontBoundingBoxAscent || Number.parseFloat(style.fontSize)*.9;
      const descent=metrics.fontBoundingBoxDescent || Number.parseFloat(style.fontSize)*.2;
      let offset=0;
      for(const character of text.textContent) {
        const range=document.createRange();range.setStart(text,offset);offset+=character.length;range.setEnd(text,offset);
        const rect=range.getBoundingClientRect();if(!rect.width || !rect.height || !character.trim())continue;
        const x=(rect.left-bounds.left)/ratio-panel.x;
        const y=(rect.top-bounds.top)/ratio-panel.y+(rect.height/ratio-ascent-descent)/2+ascent;
        ctx.fillText(character,x,y);
      }
    }
    const dataUrl=canvas.toDataURL('image/png');
    backdrop.querySelectorAll('.xhs-cutout-raster').forEach(n=>n.remove());backdrop.style.background='transparent';
    backdrop.createEl('img',{cls:'xhs-cutout-raster',attr:{src:dataUrl,alt:''}});
    element.classList.add('xhs-cutout-title');
    for (const textElement of [element, ...element.querySelectorAll("*")]) {
      for (const property of ["color", "-webkit-text-fill-color", "background-image", "text-shadow"]) {
        textElement.style.removeProperty(property);
      }
    }
    this.coverCutoutRaster={moduleId:panel.id,dataUrl};
  }

  layoutMagazineReference(config,title,subtitle,description) {
    const modules=config.xhs_modules;
    const removed=new Set(["tags","small-title","tag-rule","cta","magazine-cta-panel","arrow"]);
    for(let index=modules.length-1;index>=0;index--)if(!modules[index].custom && removed.has(modules[index].id))modules.splice(index,1);
    if(config.background_color==="#f7fbff" && config.accent_color===DEFAULT_CONFIG.accent_color)config.accent_color="#00d6bd";
    config.background_color="#000000";
    config.text_color="#ffffff";
    const palettes=this.getMagazinePalettes();
    if(!palettes.some(p=>p.color===String(config.accent_color).toLowerCase()))config.accent_color=palettes[0].color;
    const accent=config.accent_color;
    config.title_gradient_enabled=false;config.google_gradient_enabled=false;
    const migrating=!title.magazineReference;
    const text=(module,role,value,x,y,w,size,leading,weight,maxLines,color)=>{
      if(migrating){module.manualPosition=false;module.manualSize=false;}
      const style={fontSize:size,fontWeight:weight,lineHeight:leading/size,letterSpacing:0,textAlign:"left",
        ...this.normalizeCoverTextStyle(module.coverTextStyle)};
      Object.assign(module,{text:value || "",coverTextRole:role,magazineReference:true,
        x:module.manualPosition?module.x:x,y:module.manualPosition?module.y:y,w:module.manualSize?module.w:w,
        ...style,color:style.color || color,background:"transparent",borderRadius:0,borderWidth:0,maxLines});
      module.h=this.measureCoverTextFrame(module).height;
      this.applyCoverDescriptionAlignment(module);
      this.constrainCoverTextModuleToSafeArea(module);
    };
    text(title,"title",config.title,72,128,936,VISUAL_RULES.magazineTitle,VISUAL_RULES.magazineTitle*VISUAL_RULES.magazineTitleLeading,VISUAL_RULES.headingWeight,5,config.cover_title_color || config.text_color);
    const subStyle={fontSize:40,fontWeight:600,letterSpacing:0,...this.normalizeCoverTextStyle(subtitle.coverTextStyle)};
    subtitle.coverTextRole = "subtitle";
    subtitle.manualSize = false;
    const inset = this.getCoverTextFramePadding(subtitle);
    const width = this.measureCoverTextWidth(config.subtitle, subStyle.fontSize, subStyle.fontWeight, subStyle.letterSpacing);
    const subWidth = Math.min(936, Math.ceil(width) + inset * 2);
    text(subtitle,"subtitle",config.subtitle,72,title.y+title.h+72,subWidth,40,54,600,2,"#00110f");
    subtitle.maxLines=Math.max(2,this.measureCoverTextFrame(subtitle).lines);
    text(description,"description",config.composition_description,72,1088,936,36,54,400,3,config.text_color);
    const shape=(id,patch)=>{
      let module=modules.find(m=>m.id===id);
      if(!module){module={id,type:"shape",template:"neon-grid"};modules.push(module);}
      const next={...patch};
      if(module.manualPosition){delete next.x;delete next.y;}
      if(module.manualSize){delete next.w;delete next.h;}
      Object.assign(module,next,{borderRadius:0,borderWidth:0});return module;
    };
    const subtitlePanel = shape("magazine-subtitle-panel", { name: "副标题色块",
      className: "xhs-magazine-panel", locked: true });
    Object.assign(subtitlePanel, {
      x: subtitle.x, y: subtitle.y, w: subtitle.w, h: subtitle.h,
      background: subtitle.text.trim() ? accent : "transparent",
      rotation: 0, opacity: 1, manualPosition: false, manualSize: false, manualLayout: false
    });
    const tags=modules.find(m=>m.id==="tags");
    if(tags && !tags.manualLayout)Object.assign(tags,{x:72,y:1000,w:936,h:64,fontSize:40,fontWeight:500,lineHeight:1.25,color:config.text_color,letterSpacing:0});
    if (!config.cover_rule_hidden) {
    const rule=shape("cover-structure-rule",{name:"辅助横线",className:"xhs-cover-structure-rule",
      background:config.secondary_color,h:this.getContentDivider(config).width,opacity:1,rotation:0});
    rule.h=config.cover_rule_thickness || this.getContentDivider(config).width;
    if(!rule.manualPosition)Object.assign(rule,{x:72,y:description.y+description.h+24});
    if(!rule.manualSize)rule.w=936;
    } else config.xhs_modules=config.xhs_modules.filter(m=>m.id!=="cover-structure-rule");
    const footer=modules.find(m=>m.id==="footer"),checkers=modules.find(m=>m.id==="checkers");
    if(footer)Object.assign(footer,{text:"赵同学AI",x:0,y:1350,w:1080,h:90,fontSize:44,fontWeight:500,
      lineHeight:1.2,letterSpacing:0,textAlign:"left",color:"#00110f",background:accent,opacity:1,rotation:0,borderWidth:0,borderRadius:0,locked:true,manualLayout:false});
    if(checkers)Object.assign(checkers,{x:808,y:1375,w:200,h:40,opacity:1,rotation:0,borderWidth:0,borderRadius:0,locked:true,manualLayout:false,
      background:"linear-gradient(65deg, transparent 0 34%, #00110f 34% 66%, transparent 66%) 0 0 / 40px 20px repeat"});
    if(!modules.some(m=>m.id==="glow"))modules.push(this.createDefaultNeonModules(config).find(m=>m.id==="glow"));
    modules.find(m=>m.id==="glow").background="var(--xhs-accent)";
    for(const module of modules)this.constrainMagazineModule(module);
    config.title_size=title.fontSize;config.subtitle_size=subtitle.fontSize;
  }

  getMagazinePalettes() {
    return [{name:"青绿",color:"#00d6bd"},{name:"晴蓝",color:"#56a8ff"},
      {name:"柔紫",color:"#b29aff"},{name:"杏橙",color:"#ffaa70"}];
  }

  constrainMagazineModule(module) {
    if(module?.template!=="neon-grid" || !["subtitle","tags","cta","magazine-subtitle-panel","magazine-cta-panel"].includes(module.id))return false;
    module.w=Math.max(12,Math.min(Number(module.w)||12,936));
    module.x=Math.max(72,Math.min(Number(module.x)||72,1008-module.w));
    return true;
  }

  selectUnifiedCoverTemplate(choice) {
    if(this.getCoverTemplateKey()===(choice.style==="composition"?`composition:${choice.id}`:choice.style))return;
    this.saveCurrentStyleModules();
    this.config.xhs_style = choice.style;
    this.config.cover_layout_preset = choice.style === "nng-red-system" ? choice.style : "none";
    if (choice.style === "composition") {
      this.config.composition_variant = choice.id;
      this.config.composition_layout = choice.family;
      this.config.composition_theme = "custom";
      this.config.composition_custom_colors = this.captureCompositionColors();
    }
    const saved=this.config.cover_template_settings?.[this.getCoverTemplateKey()];
    if(saved) {
      Object.assign(this.config,JSON.parse(JSON.stringify(saved.appearance)));
      this.config.xhs_modules=this.cloneModules(saved.modules);
    } else {
      this.applyDefaultCoverAppearance();
      this.config.xhs_modules=this.loadModulesForStyle(choice.style,this.config);
    }
    this.ensureUnifiedCoverVisuals();
    this.syncCurrentTextToModules();
    this.syncUnifiedCoverContent(true);
    this.selectedModuleId = this.getDefaultSelectedModuleId(choice.style);
    this.persistDraft();
    void this.render();
  }

  resetCurrentCoverTemplate() {
    delete this.config.cover_template_settings?.[this.getCoverTemplateKey()];
    for(const key of ['main_image','background_image','composition_image','logo_image','icon_image','icon2_image'])this.config[key]='';
    this.config.mosaic_image_archive=[];
    this.imageCache?.clear();
    this.applyDefaultCoverAppearance();
    this.config.xhs_modules=this.createDefaultModulesForStyle(this.config.xhs_style,this.config);
    this.ensureUnifiedCoverVisuals();this.syncUnifiedCoverContent();
    for(const m of this.config.xhs_modules.filter(m=>m.type==='image')){m.src='';m.objectFit='contain';}
    this.selectedModuleId=this.getDefaultSelectedModuleId(this.config.xhs_style);
    this.persistDraft();void this.render();
  }

  getUnifiedCoverThemes() {
    return [["冰蓝白",CLEAN_GRADIENT_PALETTES.find(p=>p.id==="apple-air-sky")],
      ["浅杏白",CLEAN_GRADIENT_PALETTES.find(p=>p.id==="apple-warm-titanium")],
      ["银灰白",CLEAN_GRADIENT_PALETTES.find(p=>p.id==="apple-pro-dark")],
      ["薄荷白",HUAWEI_PALETTES.find(p=>p.id==="huawei-x-green")],
      ["浅粉白",HUAWEI_PALETTES.find(p=>p.id==="huawei-pura-red")],
      ["浅灰绿",HUAWEI_PALETTES.find(p=>p.id==="huawei-mate-black")]];
  }

  getUnifiedCoverTextColors() {
    return [{name:'黑色',color:'#000000'},{name:'白色',color:'#ffffff'},
      {name:'皇家蓝',color:'#191970'},{name:'氮气橙',color:'#fb5607'},
      {name:'紫罗兰',color:'#36255c'},{name:'绿松石',color:'#99e1d9'},
      {name:'深青绿',color:'#022e21'},{name:'柑橘绿',color:'#e4fd97'},
      {name:'糖果蓝',color:'#b2d5e5'},{name:'咖啡豆',color:'#2d120d'}];
  }

  getUnifiedCoverGradientColors() {
    const gradient = (name,preset) => ({name,type:"gradient",stops:preset.stops || [preset.from,preset.to]});
    return [gradient("蓝紫橙黄",INSTAGRAM_GRADIENT_PRESETS.find(p=>p.id==="ig-spectrum")),
      gradient("紫粉橙黄",INSTAGRAM_GRADIENT_PRESETS.find(p=>p.id==="ig-soft-sunset")),
      gradient("深蓝渐变",APPLE_TEXT_COLOR_PRESETS.find(p=>p.name==="Air 蓝光")
        ? this.getGradientPresetForTextStyle("clean-gradient",APPLE_TEXT_COLOR_PRESETS.find(p=>p.name==="Air 蓝光"))
        : {from:"#58a6ff",to:"#7dd8ff"}),
      gradient("蓝紫红橙",this.getGradientPresetForTextStyle("clean-gradient",APPLE_TEXT_COLOR_PRESETS.find(p=>p.name==="AI 彩色")))];
  }

  syncUnifiedCoverContent(recolor = false) {
    if(this.config.cover_text_layout_version===1){this.layoutCoverText();return;}
    if(this.config.swiss_cover_version===1) {
      const fresh=this.createSwissCoverModules();
      for(const module of this.config.xhs_modules.filter(module=>module.swissCover)) {
        const next=fresh.find(item=>item.id===module.id);
        if(next) {
          const src=module.src;
          Object.assign(module,next);
          if(module.type==="image" && src)module.src=src;
        }
      }
      return;
    }
    for (const key of ["title","subtitle","composition_description"]) this.syncNeonModulesFromConfig(key);
    let description = this.config.xhs_modules.find(m=>m.id==="composition-description" || m.id==="cover-description");
    if (!description && this.config.composition_description) {
      const subtitle = this.config.xhs_modules.find(m=>this.isCoverSubtitleModule(m));
      description = {id:"cover-description",type:"text",template:this.config.xhs_style,
        x:subtitle?.x || 72,y:(subtitle?.y || 420)+(subtitle?.h || 80)+24,w:900,h:100,
        fontSize:28,fontWeight:400,lineHeight:1.5,color:this.config.xhs_style==="nng-red-system"?"#111116":this.config.text_color,textAlign:"left",background:"transparent",className:"xhs-module-cover-description"};
      this.config.xhs_modules.push(description);
    }
    if (description) description.text=this.config.composition_description;
    for (const module of this.config.xhs_modules) {
      if (this.isCoverTitleModule(module)) module.color=this.config.cover_title_color || this.config.text_color;
    }
    if (this.config.xhs_style==="composition") {
      this.config.composition_theme="custom";
      this.config.composition_custom_colors=this.captureCompositionColors();
      this.syncCompositionOverlayColors();
    }
  }

  applyUnifiedCoverTextColor(choice,{refreshControls=true}={}) {
    const gradient=choice.type==="gradient";
    this.config.title_gradient_enabled=gradient;
    this.config.google_gradient_enabled=gradient;
    this.config.title_gradient_preset="";
    this.config.google_gradient_preset="";
    if (gradient) {
      this.config.title_gradient_stops=choice.stops;
      this.config.title_gradient_from=choice.stops[0];
      this.config.title_gradient_to=choice.stops[choice.stops.length-1];
    } else {
      this.config.cover_title_color=choice.color || choice.stops?.[0];

    }
    this.syncUnifiedCoverContent(true);
    this.persistDraft();if(refreshControls)this.renderControls();this.queueCoverColorPreview();
  }

  queueCoverColorPreview() {
    if(typeof window==='undefined' || !this.previewCanvasEl)return;
    if(this.coverColorFrame)return;
    this.coverColorFrame=window.requestAnimationFrame(()=>{
      this.coverColorFrame=null;
      const card=this.previewCanvasEl;
      if(!card || !card.classList.contains('xhs-page-cover'))return;
      // Reuse the canvas and loaded images while the native picker streams input.
      card.style.background=this.config.background_color;
      card.style.setProperty('--xhs-bg',this.config.background_color);
      card.style.setProperty('--xhs-secondary',this.config.secondary_color);
      card.style.setProperty('--xhs-secondary-soft',this.hexToRgba(this.config.secondary_color,0.18));
      card.style.setProperty('--xhs-secondary-mid',this.hexToRgba(this.config.secondary_color,0.28));
      card.style.setProperty('--xhs-title-gradient-from',this.getActiveGradientFrom());
      card.style.setProperty('--xhs-title-gradient-to',this.getActiveGradientTo());
      card.style.setProperty('--xhs-title-gradient-css',this.getGradientCssFromStops(this.getTitleGradientStops()));
      card.querySelectorAll('[data-module-id]').forEach(element=>{
        const module=this.config.xhs_modules.find(m=>m.id===element.dataset.moduleId);
        if(!module)return;
        this.applyModuleStyle(element,module);
        if(module.type==='text' && this.isCoverTitleModule(module)) {
          const handles=Array.from(element.children).filter(n=>!n.classList.contains('xhs-clean-title-line'));
          handles.forEach(n=>n.remove());
          this.renderHighlightedTitleElement(element,module);
          element.append(...handles);
        }
      });
      this.renderTransparentCoverTitle(card);
    });
  }

  renderUnifiedCoverControls() {
    this.controlsEl.style.setProperty("--xhs-secondary", this.config.secondary_color);
    this.config.cover_editor_version=1;
    this.config.cover_title_color ||= this.config.text_color;
    this.ensureUnifiedCoverVisuals();
    this.syncUnifiedCoverContent();
    const grid = () => this.controlsEl.createDiv({ cls: "xhs-unified-choice-grid" });
    const choices = this.getUnifiedCoverTemplates();
    const current = choices.find(choice => choice.style === this.config.xhs_style
      && (choice.style !== "composition" || choice.id === this.config.composition_variant));
    this.renderCollapsibleControls("封面模板", "coverTemplatePickerOpen", () => {
      const templates = grid();
      for (const choice of choices) {
        const active = choice === current;
        const button = templates.createEl("button", { cls: 'xhs-unified-choice xhs-cover-template-option' + (active ? ' is-active' : ''),
          attr: { type: "button", "data-cover-template": choice.id, "aria-pressed": String(active) } });
        this.renderCoverTemplateThumbnail(button, choice);
        button.createSpan({ cls: "xhs-cover-template-name", text: choice.name });
        button.addEventListener("click", () => {
          this.coverTemplatePickerOpen = true;
          if (!active) this.selectUnifiedCoverTemplate(choice);
        });
      }
      const reset = this.controlsEl.createEl("button", { text: "重置当前模板", cls: "xhs-cover-reset-button",
        attr: { type: "button" } });
      reset.addEventListener("click", () => this.resetCurrentCoverTemplate());
    });

    this.controlsEl.createEl("h3", { text: "封面文案" });
    for (const [label, key] of [
      ["主标题", "title"],
      ["副标题", "subtitle"],
      ["辅助文案", "composition_description"],
      ["高亮字", "title_highlight"]
    ]) {
      this.renderCoverCopyField(label, key);
    }

    this.renderCollapsibleControls("封面主题色", "coverAppearanceOpen", () => this.renderCoverAppearance());
    this.renderCollapsibleControls("封面字体色", "coverTextColorsOpen", () => this.renderCoverTextColors());
  }

  renderCoverTemplateThumbnail(parent, choice) {
    const thumbnail = parent.createSpan({ cls: "xhs-cover-template-thumb", attr: { "aria-hidden": "true" } });
    const composition = choice.style === "composition" ? choice : null;
    const images = composition?.images || (choice.style === "nng-red-system"
      ? [[0, 0, 1080, 720], [0, 720, 1080, 720]] : []);
    const title = composition?.title || (choice.style === "nng-red-system"
      ? [72, 600, 936, 240] : [72, 128, 936, 360]);
    const add = (box, cls) => {
      const [x, y, w, h] = box;
      const element = thumbnail.createSpan({ cls });
      Object.assign(element.style, {
        left: x / 1080 * 100 + "%", top: y / 1440 * 100 + "%",
        width: w / 1080 * 100 + "%", height: h / 1440 * 100 + "%"
      });
    };
    for (const box of images) add(box, "xhs-cover-template-media");
    add(title, "xhs-cover-template-title");
    if (choice.style === "neon-grid") add([0, 1350, 1080, 90], "xhs-cover-template-media");
  }

  renderCoverCopyField(label, key) {
    const field = this.createField(label);
    const input = field.createEl("textarea", { cls: "xhs-studio-textarea xhs-cover-copy-input",
      attr: { "data-cover-copy": key, "aria-label": label, rows: "2" } });
    input.value = this.config[key] || "";
    input.addEventListener("input", () => {
      this.config[key] = input.value;
      this.syncUnifiedCoverContent();
      this.persistDraft();
      void this.renderPreview();
    });
  }

  renderCoverAppearance() {
    const magazine = this.config.xhs_style === "neon-grid";
    const themes = magazine
      ? this.getMagazinePalettes().map(palette => [palette.name, palette])
      : this.getUnifiedCoverThemes();
    const matchesTheme = palette => magazine ? this.config.accent_color === palette.color
      : this.config.background_color === palette.background && this.config.secondary_color === palette.secondary;
    const grid = this.controlsEl.createDiv({ cls: "xhs-unified-choice-grid" });
    const presets = themes.map(([name, palette]) => {
      const button = this.createCoverColorChoice(grid, name, [magazine ? palette.color : palette.background], matchesTheme(palette));
      button.addEventListener("click", () => {
        if (magazine) this.config.accent_color = palette.color;
        else {
          this.config.background_color = palette.background;
          this.config.secondary_color = palette.secondary;
        }
        this.syncUnifiedCoverContent();
        this.persistDraft();
        this.renderControls();
        void this.renderPreview();
      });
      return [button, palette];
    });

    if (!magazine) {
      const syncPresets = () => {
        for (const [button, palette] of presets) {
          const active = matchesTheme(palette);
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", String(active));
        }
      };
      this.controlsEl.createEl("h3", { cls: "xhs-cover-palette-heading", text: "自定义颜色" });
      const colors = this.controlsEl.createDiv({ cls: "xhs-cover-custom-color-grid" });
      this.addUnifiedCoverColor("背景色", "background_color", "", syncPresets, colors);
      this.addUnifiedCoverColor("辅助色", "secondary_color", "", syncPresets, colors);
      return;
    }
    const glow = this.config.xhs_modules.find(module => module.id === "glow");
    if (!glow) return;
    const slider = this.createField("发光强度").createEl("input", { attr: {
      type: "range", min: "0", max: "1", step: "0.05", "aria-label": "发光强度"
    } });
    slider.value = String(glow.opacity ?? 1);
    slider.addEventListener("input", () => {
      glow.opacity = Number(slider.value);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  renderCoverTextColors() {
    const solid = this.getUnifiedCoverTextColors();
    const gradients = this.config.xhs_style === "neon-grid" ? [] : this.getUnifiedCoverGradientColors();
    const matchesPreset = choice => this.isTitleGradientEnabled()
      ? choice.type === "gradient" && JSON.stringify(this.getTitleGradientStops()) === JSON.stringify(choice.stops)
      : choice.color === this.config.cover_title_color;
    const grid = this.controlsEl.createDiv({ cls: "xhs-unified-choice-grid" });
    const presets = [...solid, ...gradients].map(choice => {
      const button = this.createCoverColorChoice(grid, choice.name, choice.stops || [choice.color], matchesPreset(choice));
      button.addEventListener("click", () => this.applyUnifiedCoverTextColor(choice));
      return [button, choice];
    });
    const syncPreset = () => {
      for (const [button, choice] of presets) {
        const active = matchesPreset(choice);
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      }
    };

    this.controlsEl.createEl("h3", { cls: "xhs-cover-palette-heading", text: "自定义颜色" });
    const colors = this.controlsEl.createDiv({ cls: "xhs-cover-custom-color-grid" });
    this.addUnifiedCoverColor("主标题纯色", "cover_title_color", "", syncPreset, colors);
    this.addUnifiedCoverColor("副标题", "", "subtitle", undefined, colors);
    this.addUnifiedCoverColor("说明文案", "", "description", undefined, colors);
    this.addUnifiedCoverColor("高亮字", "cover_highlight_color", "", undefined, colors);
    if (gradients.length) {
      const gradient = colors.createEl("fieldset", { cls: "xhs-cover-gradient-colors" });
      gradient.createEl("legend", { text: "主标题渐变色" });
      const pair = gradient.createDiv({ cls: "xhs-cover-gradient-pair" });
      this.addUnifiedCoverColor("渐变起点", "title_gradient_from", "", syncPreset, pair);
      this.addUnifiedCoverColor("渐变终点", "title_gradient_to", "", syncPreset, pair);
    }
  }

  addUnifiedCoverColor(label,key,role="",onChange,parent=this.controlsEl) {
    const target=()=>this.config.xhs_modules.find(module=>module.coverTextRole===role);
    const current=()=>role?(target()?.coverTextStyle?.color || target()?.color):this.config[key];
    const field=this.createField(label,parent);
    const row=field.createDiv({cls:'xhs-cover-custom-color-row'});
    const swatch=row.createEl('input',{cls:'xhs-cover-custom-swatch',attr:{type:'color','aria-label':`${label}颜色预览`}});
    const input=row.createEl('input',{cls:'xhs-studio-input xhs-cover-custom-hex',attr:{type:'text','aria-label':`${label}色值`,placeholder:'#RRGGBB',spellcheck:'false',autocomplete:'off'}});
    const initial=this.parseCoverHexColor(current() || (key==="cover_highlight_color" ? this.config.cover_title_color : "")) || '#ffffff';
    swatch.value=initial;input.value=initial.toUpperCase();
    const apply=(value, edited=false)=>{
      const switchingTitleMode = edited && ((key==="cover_title_color" && this.isTitleGradientEnabled())
        || (key.startsWith("title_gradient_") && !this.isTitleGradientEnabled()));
      if(value===current() && !switchingTitleMode)return;
      if(role) {
        const module=target();if(!module)return;
        module.color=value;this.markModuleManualChange(module,{color:value});
        this.persistDraft();this.queueCoverColorPreview();return;
      }
      this.config[key]=value;
      if (key==="cover_title_color") this.applyUnifiedCoverTextColor({color:value},{refreshControls:false});
      else if (key.startsWith("title_gradient_")) this.applyUnifiedCoverTextColor({type:"gradient",stops:[this.config.title_gradient_from,this.config.title_gradient_to]},{refreshControls:false});
      else {this.syncUnifiedCoverContent();this.persistDraft();this.queueCoverColorPreview();}
      if (key === "secondary_color") this.controlsEl.style.setProperty("--xhs-secondary", value);
      onChange?.();
    };
    const validate=(edited=false)=>{
      const value=this.parseCoverHexColor(input.value);
      input.setAttribute('aria-invalid',String(!value));
      input.setCustomValidity(value?'':'请输入三位或六位 HEX 色值');
      if(value){swatch.value=value;apply(value,edited);}
      return value;
    };
    input.addEventListener('input',()=>validate(true));
    input.addEventListener('blur',()=>{const value=validate();if(value)input.value=value.toUpperCase();});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const value=validate(true);if(value)input.value=value.toUpperCase();else input.reportValidity();}});
    swatch.addEventListener('input',()=>{
      input.value=swatch.value.toUpperCase();input.setAttribute('aria-invalid','false');input.setCustomValidity('');apply(swatch.value,true);
    });
  }

  parseCoverHexColor(value) {
    const hex=String(value ?? '').trim().replace(/^#/,'');
    if(!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex))return null;
    return '#'+(hex.length===3?[...hex].map(c=>c+c).join(''):hex).toLowerCase();
  }

  createCoverColorChoice(parent,name,colors,active) {
    const button=parent.createEl("button",{cls:`xhs-unified-choice xhs-cover-color-choice${active?" is-active":""}`,
      attr:{type:"button","aria-pressed":String(active)}});
    const swatch=button.createSpan({cls:"xhs-cover-color-swatch",attr:{"aria-hidden":"true"}});
    swatch.style.background=colors.length>1 ? this.getGradientCssFromStops(colors) : colors[0];
    button.createSpan({cls:"xhs-cover-color-name",text:name});
    return button;
  }

  renderCollapsibleControls(title, stateKey, renderContent) {
    const details = this.controlsEl.createEl("details", { cls: "xhs-studio-advanced-section" });
    details.open = Boolean(this[stateKey]);
    details.createEl("summary", { text: title });
    details.addEventListener("toggle", () => {
      if (details.isConnected) this[stateKey] = details.open;
    });
    const parent = this.controlsEl;
    this.controlsEl = details.createDiv({ cls: "xhs-studio-advanced-content" });
    try {
      renderContent();
    } finally {
      this.controlsEl = parent;
    }
  }

  renderCleanStyleControls() {
    this.controlsEl.createEl("h3", { text: "Apple文案" });
    this.addTextArea("主标题", "title");
    this.addInput("主标题高亮字", "title_highlight");
    this.addTextArea("副标题", "subtitle");

    this.controlsEl.createEl("h3", { text: "Apple颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");
    this.renderTextColorStyleControls("Apple标题字色", APPLE_TEXT_COLOR_PRESETS, "apple_text_color_preset", "clean-gradient");
    this.renderCleanPaletteControls();

    this.renderSubtitleColorModeControls();
    this.renderTitleArtFontControls("英文艺术字", "title_art_font_en", "en");

    this.controlsEl.createEl("h3", { text: "Apple详情页" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderHuaweiStyleControls() {
    this.controlsEl.createEl("h3", { text: "华为文案" });
    this.addTextArea("主标题", "title");
    this.addInput("主标题高亮字", "title_highlight");
    this.addTextArea("副标题", "subtitle");

    this.controlsEl.createEl("h3", { text: "华为颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");
    this.renderTextColorStyleControls("华为标题字色", HUAWEI_TEXT_COLOR_PRESETS, "huawei_text_color_preset", "huawei-product");
    this.renderHuaweiPaletteControls();

    this.renderSubtitleColorModeControls();
    this.renderTitleArtFontControls("英文艺术字", "title_art_font_en", "en");

    this.controlsEl.createEl("h3", { text: "华为详情页" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderInstagramStyleControls() {
    this.controlsEl.createEl("h3", { text: "Ins文案" });
    this.addTextArea("主标题", "title");
    this.addInput("主标题高亮字", "title_highlight");
    this.addTextArea("副标题", "subtitle");

    this.controlsEl.createEl("h3", { text: "Ins颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");
    this.renderTextColorStyleControls("Ins标题字色", INSTAGRAM_TEXT_COLOR_PRESETS, "instagram_text_color_preset", "instagram-gradient");
    this.renderInstagramPaletteControls();

    this.renderSubtitleColorModeControls();
    this.renderTitleArtFontControls("英文艺术字", "title_art_font_en", "en");

    this.controlsEl.createEl("h3", { text: "Ins详情页" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderGoogleStyleControls() {
    this.controlsEl.createEl("h3", { text: "Google文案" });
    this.addTextArea("主标题", "title");
    this.addInput("主标题高亮字", "title_highlight");
    this.addTextArea("副标题", "subtitle");

    this.controlsEl.createEl("h3", { text: "Google颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");
    this.renderTextColorStyleControls("Google标题字色", GOOGLE_TEXT_COLOR_PRESETS, "google_text_color_preset", "google-search");
    this.renderGooglePaletteControls();

    this.renderSubtitleColorModeControls();
    this.renderTitleArtFontControls("英文艺术字", "title_art_font_en", "en");

    this.controlsEl.createEl("h3", { text: "Google详情页" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderCoverTemplateStyleControls() {
    this.controlsEl.createEl("h3", { text: "封面文案" });
    this.addTextArea("主标题", "title");
    this.addInput("主标题高亮字", "title_highlight");
    this.addTextArea("副标题", "subtitle");

    this.controlsEl.createEl("h3", { text: "封面颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");
    this.renderCoverLayoutTitleColorControls();

    this.renderSubtitleColorModeControls();
    this.renderTitleArtFontControls("英文艺术字", "title_art_font_en", "en");

    this.controlsEl.createEl("h3", { text: "详情页颜色" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderCompositionControls() {
    this.controlsEl.createEl("h3", { text: "参考版式" });
    const field = this.createField("版式");
    const row = field.createDiv({ cls: "xhs-style-preset-row xhs-text-color-style-row" });
    COMPOSITION_PRESETS.forEach((preset) => {
      const button = row.createEl("button", {
        cls: `xhs-text-color-style-button xhs-style-preset-button is-gradient${this.config.composition_variant === preset.id ? " is-active" : ""}`,
        attr: { type: "button", "aria-label": `选择${preset.name}版式` }
      });
      button.style.setProperty("--text-style-gradient", this.getGradientCssFromStops(
        preset.family === "center" ? ["#f6f5f2", "#8f1d2c", "#f6f5f2"]
          : preset.family === "horizontal" ? ["#f6f5f2", "#bb816f"] : ["#bb816f", "#f6f5f2"]
      ));
      button.createSpan({ cls: "xhs-text-color-style-swatch" });
      button.createSpan({ cls: "xhs-text-color-style-name", text: preset.name });
      button.addEventListener("click", () => {
        if (preset.id === this.config.composition_variant) return;
        this.saveCurrentStyleModules();
        this.config.composition_variant = preset.id;
        this.config.composition_layout = preset.family;
        this.restoreCompositionAppearance(this.config);
        this.config.xhs_modules = this.loadModulesForStyle("composition", this.config);
        this.restoreCompositionContentFromModules();
        this.syncCompositionOverlayColors();
        this.selectedModuleId = this.config.xhs_modules.some((module) => module.id === "composition-title")
          ? "composition-title" : (this.config.xhs_modules[0]?.id || "");
        this.persistDraft();
        void this.render();
      });
    });
    this.renderCompositionThemeControls();
    this.controlsEl.createEl("h3", { text: "封面文案" });
    this.addTextArea("主标题", "title");
    this.addTextArea("副标题", "subtitle");
    this.addTextArea("说明文案", "composition_description");
    this.addImagePath("主图", "composition_image");
    this.controlsEl.createEl("h3", { text: "封面颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");
    this.controlsEl.createEl("h3", { text: "详情页颜色" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderCompositionThemeControls() {
    const field = this.createField("主题配色");
    const row = field.createDiv({ cls: "xhs-style-preset-row xhs-text-color-style-row" });
    COMPOSITION_THEMES.forEach((choice) => {
      const theme = choice;
      const button = row.createEl("button", {
        cls: `xhs-text-color-style-button xhs-style-preset-button is-gradient${this.getCompositionTheme().id === choice.id && this.config.composition_theme !== "custom" ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--text-style-gradient", this.getGradientCssFromStops(
        [theme.background, theme.accent, theme.text]
      ));
      button.createSpan({ cls: "xhs-text-color-style-swatch" });
      button.createSpan({ cls: "xhs-text-color-style-name", text: choice.name });
      button.addEventListener("click", () => {
        if (choice.id === this.config.composition_theme) return;
        this.config.composition_theme = choice.id;
        this.applyCompositionTheme();
        this.persistDraft();
        void this.render();
      });
    });
  }

  renderNeonStyleControls() {
    this.controlsEl.createEl("h3", { text: "封面文案" });
    this.addTextArea("主标题", "title");
    this.addTextArea("副标题", "subtitle");
    this.addInput("按钮文案", "cta");
    this.addInput("底部文案", "brand");
    this.addListArea("标签", "tags");

    this.controlsEl.createEl("h3", { text: "封面颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");

    this.controlsEl.createEl("h3", { text: "详情页颜色" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderAiStyleControls() {
    this.controlsEl.createEl("h3", { text: "封面文案" });
    this.addTextArea("主标题", "title");
    this.addTextArea("副标题", "subtitle");
    this.addListArea("标签", "tags");

    this.controlsEl.createEl("h3", { text: "封面颜色" });
    this.addColor("背景色", "background_color");
    this.addColor("强调色", "accent_color");
    this.addColor("辅助色", "secondary_color");
    this.addColor("文字色", "text_color");

    this.controlsEl.createEl("h3", { text: "详情页颜色" });
    this.addColor("详情页背景色", "detail_background_color");
    this.addColor("详情页文字色", "detail_text_color");
  }

  renderCleanPaletteControls() {
    const field = this.createField("Apple 色板");
    const row = field.createDiv({ cls: "xhs-clean-palette-row" });
    CLEAN_GRADIENT_PALETTES.forEach((palette) => {
      const button = row.createEl("button", {
        cls: `xhs-clean-palette-button${this.config.clean_palette === palette.id ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--palette-bg", palette.background);
      button.style.setProperty("--palette-text", palette.text);
      button.style.setProperty("--palette-accent", palette.accent);
      button.style.setProperty("--palette-secondary", palette.secondary);
      button.style.setProperty("--palette-gradient-from", palette.gradientFrom);
      button.style.setProperty("--palette-gradient-to", palette.gradientTo);
      const preview = button.createDiv({ cls: "xhs-clean-palette-preview" });
      preview.createSpan({ cls: "xhs-clean-palette-title" });
      preview.createSpan({ cls: "xhs-clean-palette-line" });
      preview.createSpan({ cls: "xhs-clean-palette-accent" });
      button.createDiv({ cls: "xhs-clean-palette-name", text: palette.name });
      button.addEventListener("click", () => {
        this.applyCleanPalette(palette.id);
      });
    });
  }

  renderCleanGradientPresetControls() {
    const field = this.createField("标题渐变预设");
    const row = field.createDiv({ cls: "xhs-clean-gradient-row" });
    CLEAN_GRADIENT_PRESETS.forEach((preset) => {
      const isActive = this.config.title_gradient_preset === preset.id
        || (this.config.title_gradient_from === preset.from && this.config.title_gradient_to === preset.to);
      const button = row.createEl("button", {
        cls: `xhs-clean-gradient-button${isActive ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--gradient-from", preset.from);
      button.style.setProperty("--gradient-to", preset.to);
      button.style.setProperty("--gradient-css", this.getGradientCssFromStops(preset.stops || [preset.from, preset.to]));
      button.createSpan({ cls: "xhs-clean-gradient-swatch" });
      button.createSpan({ cls: "xhs-clean-gradient-name", text: preset.name });
      button.addEventListener("click", () => {
        this.applyCleanGradientPreset(preset.id);
      });
    });
  }

  renderHuaweiPaletteControls() {
    const field = this.createField("华为色板");
    const row = field.createDiv({ cls: "xhs-clean-palette-row" });
    HUAWEI_PALETTES.forEach((palette) => {
      const button = row.createEl("button", {
        cls: `xhs-clean-palette-button xhs-huawei-palette-button${this.config.huawei_palette === palette.id ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--palette-bg", palette.background);
      button.style.setProperty("--palette-text", palette.text);
      button.style.setProperty("--palette-accent", palette.accent);
      button.style.setProperty("--palette-secondary", palette.secondary);
      button.style.setProperty("--palette-gradient-from", palette.gradientFrom);
      button.style.setProperty("--palette-gradient-to", palette.gradientTo);
      const preview = button.createDiv({ cls: "xhs-clean-palette-preview" });
      preview.createSpan({ cls: "xhs-clean-palette-title" });
      preview.createSpan({ cls: "xhs-clean-palette-line" });
      preview.createSpan({ cls: "xhs-clean-palette-accent" });
      button.createDiv({ cls: "xhs-clean-palette-name", text: palette.name });
      button.addEventListener("click", () => {
        this.applyHuaweiPalette(palette.id);
      });
    });
  }

  renderHuaweiGradientPresetControls() {
    const field = this.createField("标题渐变预设");
    const row = field.createDiv({ cls: "xhs-clean-gradient-row" });
    HUAWEI_GRADIENT_PRESETS.forEach((preset) => {
      const isActive = this.config.huawei_gradient_preset === preset.id
        || (this.config.huawei_gradient_from === preset.from && this.config.huawei_gradient_to === preset.to);
      const button = row.createEl("button", {
        cls: `xhs-clean-gradient-button xhs-huawei-gradient-button${isActive ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--gradient-from", preset.from);
      button.style.setProperty("--gradient-to", preset.to);
      button.style.setProperty("--gradient-css", this.getGradientCssFromStops(preset.stops || [preset.from, preset.to]));
      button.createSpan({ cls: "xhs-clean-gradient-swatch" });
      button.createSpan({ cls: "xhs-clean-gradient-name", text: preset.name });
      button.addEventListener("click", () => {
        this.applyHuaweiGradientPreset(preset.id);
      });
    });
  }

  renderTextColorStyleControls(label, presets, configKey, style) {
    const field = this.createField(label);
    const row = field.createDiv({ cls: "xhs-text-color-style-row" });
    presets.forEach((preset) => {
      const gradientPreset = this.getGradientPresetForTextStyle(style, preset);
      const colors = gradientPreset ? (gradientPreset.stops || [gradientPreset.from, gradientPreset.to]) : [preset.color || this.config.text_color];
      const button = row.createEl("button", {
        cls: `xhs-text-color-style-button is-${preset.type}${this.config[configKey] === preset.id ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--text-style-solid", preset.color || colors[0] || this.config.text_color);
      button.style.setProperty("--text-style-gradient", this.getGradientCssFromStops(colors));
      button.createSpan({ cls: "xhs-text-color-style-swatch" });
      button.createSpan({ cls: "xhs-text-color-style-name", text: preset.name });
      button.addEventListener("click", () => {
        this.applyTextColorStyle(style, preset.id);
      });
    });
  }

  renderCoverLayoutTitleColorControls() {
    const preset = this.getCoverLayoutPreset(this.config.xhs_style);
    const titlePresets = this.getCoverLayoutTitleColorPresets(preset);
    const field = this.createField("标题字色");
    const row = field.createDiv({ cls: "xhs-text-color-style-row" });
    titlePresets.forEach((item) => {
      const isGradient = item.type === "gradient";
      const colors = isGradient ? (item.stops || [item.from, item.to]) : [item.color];
      const isActive = isGradient
        ? this.isTitleGradientEnabled()
          && this.normalizeColor(this.getActiveGradientFrom()) === this.normalizeColor(item.from)
          && this.normalizeColor(this.getActiveGradientTo()) === this.normalizeColor(item.to)
          && this.areColorStopsEqual(this.getTitleGradientStops(), colors)
        : !this.isTitleGradientEnabled()
          && this.normalizeColor(this.config.text_color) === this.normalizeColor(item.color);
      const button = row.createEl("button", {
        cls: `xhs-text-color-style-button is-${item.type}${isActive ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--text-style-solid", item.color || item.from || this.config.text_color);
      button.style.setProperty("--text-style-gradient", this.getGradientCssFromStops(colors));
      button.createSpan({ cls: "xhs-text-color-style-swatch" });
      button.createSpan({ cls: "xhs-text-color-style-name", text: item.name });
      button.addEventListener("click", () => {
        this.applyCoverLayoutTitleColorPreset(item);
      });
    });
  }

  getCoverLayoutTitleColorPresets(preset) {
    return APPLE_PRODUCT_TITLE_COLOR_PRESETS.map((item) => Object.assign({}, item));
  }

  applyCoverLayoutTitleColorPreset(preset) {
    if (!preset) return;
    if (preset.type === "gradient") {
      const stops = Array.isArray(preset.stops) && preset.stops.length >= 2 ? preset.stops : [preset.from, preset.to];
      const from = preset.from || stops[0];
      const to = preset.to || stops[stops.length - 1];
      this.config.google_gradient_enabled = true;
      this.config.google_gradient_preset = "";
      this.config.google_gradient_from = from;
      this.config.google_gradient_to = to;
      this.config.title_gradient_enabled = true;
      this.config.title_gradient_preset = "";
      this.config.title_gradient_from = from;
      this.config.title_gradient_to = to;
      this.config.title_gradient_stops = stops;
    } else {
      this.config.text_color = preset.color || this.config.text_color;
      this.config.google_gradient_enabled = false;
      this.config.title_gradient_enabled = false;
      this.syncNeonModulesFromConfig("text_color");
    }
    const baseStyle = this.isCoverLayoutStyle(this.config.xhs_style) ? "google-search" : this.config.xhs_style;
    const layoutPresetId = this.isCoverLayoutStyle(this.config.xhs_style) ? this.config.xhs_style : this.config.cover_layout_preset;
    this.normalizeDefaultTemplateLayout(this.config.xhs_modules, baseStyle, layoutPresetId, this.config);
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  getGradientPresetForTextStyle(style, preset) {
    if (!preset || preset.type !== "gradient") return null;
    if (Array.isArray(preset.stops) && preset.stops.length >= 2) {
      const stops = preset.stops;
      return {
        id: preset.id,
        name: preset.name,
        from: preset.from || stops[0],
        to: preset.to || stops[stops.length - 1],
        accent: preset.accent,
        stops
      };
    }
    if (style === "huawei-product") return HUAWEI_GRADIENT_PRESETS.find((item) => item.id === preset.gradientPreset) || null;
    if (style === "instagram-gradient") return INSTAGRAM_GRADIENT_PRESETS.find((item) => item.id === preset.gradientPreset) || null;
    if (style === "google-search") return GOOGLE_GRADIENT_PRESETS.find((item) => item.id === preset.gradientPreset) || null;
    return CLEAN_GRADIENT_PRESETS.find((item) => item.id === preset.gradientPreset) || null;
  }

  renderInstagramPaletteControls() {
    const field = this.createField("Ins 色板");
    const row = field.createDiv({ cls: "xhs-clean-palette-row" });
    INSTAGRAM_PALETTES.forEach((palette) => {
      const button = row.createEl("button", {
        cls: `xhs-clean-palette-button xhs-instagram-palette-button${this.config.instagram_palette === palette.id ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--palette-bg", palette.background);
      button.style.setProperty("--palette-text", palette.text);
      button.style.setProperty("--palette-accent", palette.accent);
      button.style.setProperty("--palette-secondary", palette.secondary);
      button.style.setProperty("--palette-gradient-from", palette.gradientFrom);
      button.style.setProperty("--palette-gradient-to", palette.gradientTo);
      const preview = button.createDiv({ cls: "xhs-clean-palette-preview" });
      preview.createSpan({ cls: "xhs-clean-palette-title" });
      preview.createSpan({ cls: "xhs-clean-palette-line" });
      preview.createSpan({ cls: "xhs-clean-palette-accent" });
      button.createDiv({ cls: "xhs-clean-palette-name", text: palette.name });
      button.addEventListener("click", () => {
        this.applyInstagramPalette(palette.id);
      });
    });
  }

  renderInstagramGradientPresetControls() {
    const field = this.createField("标题渐变预设");
    const row = field.createDiv({ cls: "xhs-clean-gradient-row" });
    INSTAGRAM_GRADIENT_PRESETS.forEach((preset) => {
      const isActive = this.config.instagram_gradient_preset === preset.id
        || (this.config.instagram_gradient_from === preset.from && this.config.instagram_gradient_to === preset.to);
      const button = row.createEl("button", {
        cls: `xhs-clean-gradient-button xhs-instagram-gradient-button${isActive ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--gradient-from", preset.from);
      button.style.setProperty("--gradient-to", preset.to);
      button.style.setProperty("--gradient-css", this.getGradientCssFromStops(preset.stops || [preset.from, preset.to]));
      button.createSpan({ cls: "xhs-clean-gradient-swatch" });
      button.createSpan({ cls: "xhs-clean-gradient-name", text: preset.name });
      button.addEventListener("click", () => {
        this.applyInstagramGradientPreset(preset.id);
      });
    });
  }

  renderGooglePaletteControls() {
    const field = this.createField("Google 色板");
    const row = field.createDiv({ cls: "xhs-clean-palette-row" });
    GOOGLE_PALETTES.forEach((palette) => {
      const button = row.createEl("button", {
        cls: `xhs-clean-palette-button xhs-google-palette-button${this.config.google_palette === palette.id ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--palette-bg", palette.background);
      button.style.setProperty("--palette-text", palette.text);
      button.style.setProperty("--palette-accent", palette.accent);
      button.style.setProperty("--palette-secondary", palette.secondary);
      button.style.setProperty("--palette-gradient-from", palette.gradientFrom);
      button.style.setProperty("--palette-gradient-to", palette.gradientTo);
      const preview = button.createDiv({ cls: "xhs-clean-palette-preview" });
      preview.createSpan({ cls: "xhs-clean-palette-title" });
      preview.createSpan({ cls: "xhs-clean-palette-line" });
      preview.createSpan({ cls: "xhs-clean-palette-accent" });
      button.createDiv({ cls: "xhs-clean-palette-name", text: palette.name });
      button.addEventListener("click", () => {
        this.applyGooglePalette(palette.id);
      });
    });
  }

  renderGoogleGradientPresetControls() {
    const field = this.createField("标题渐变预设");
    const row = field.createDiv({ cls: "xhs-clean-gradient-row" });
    GOOGLE_GRADIENT_PRESETS.forEach((preset) => {
      const isActive = this.config.google_gradient_preset === preset.id
        || (this.config.google_gradient_from === preset.from && this.config.google_gradient_to === preset.to);
      const button = row.createEl("button", {
        cls: `xhs-clean-gradient-button xhs-google-gradient-button${isActive ? " is-active" : ""}`,
        attr: { type: "button" }
      });
      button.style.setProperty("--gradient-from", preset.from);
      button.style.setProperty("--gradient-to", preset.to);
      button.style.setProperty("--gradient-css", this.getGradientCssFromStops(preset.stops || [preset.from, preset.to]));
      button.createSpan({ cls: "xhs-clean-gradient-swatch" });
      button.createSpan({ cls: "xhs-clean-gradient-name", text: preset.name });
      button.addEventListener("click", () => {
        this.applyGoogleGradientPreset(preset.id);
      });
    });
  }

  renderSubtitleColorModeControls() {
    const field = this.createField("副标题颜色");
    const row = field.createDiv({ cls: "xhs-subtitle-mode-row" });
    [
      ["muted", "浅色"],
      ["black", "纯黑"]
    ].forEach(([mode, label]) => {
      const button = row.createEl("button", {
        text: label,
        cls: `xhs-subtitle-mode-button${this.config.subtitle_color_mode === mode ? " is-active" : ""}`
      });
      button.addEventListener("click", () => {
        this.config.subtitle_color_mode = mode;
        this.syncNeonModulesFromConfig("subtitle_color_mode");
        this.persistDraft();
        this.renderControls();
        void this.renderPreview();
      });
    });
  }

  renderCoverTextOutlineControls() {
    this.controlsEl.createEl("h3", { text: "封面文字描边" });
    [["title", "主标题"], ["subtitle", "副标题"], ["highlight", "主标题高亮字"]].forEach(([kind, label]) => {
      const field = this.createField(label);
      const row = field.createDiv({ cls: "xhs-subtitle-mode-row" });
      [["off", "关闭"], ["text", "标题色"], ["gradient", "渐变色"], ["custom", "自定义"]].forEach(([mode, text]) => {
        const button = row.createEl("button", {
          text,
          cls: `xhs-subtitle-mode-button${this.config[`${kind}_outline_mode`] === mode ? " is-active" : ""}`,
          attr: { type: "button" }
        });
        button.addEventListener("click", () => {
          this.config[`${kind}_outline_mode`] = mode;
          this.persistDraft();
          this.renderControls();
          void this.renderPreview();
        });
      });
      if (this.config[`${kind}_outline_mode`] === "off") return;
      const settings = field.createDiv({ cls: "xhs-outline-settings" });
      const widthLabel = settings.createEl("label", { text: "粗细" });
      const width = widthLabel.createEl("input", { type: "number", attr: { min: "1", max: "12", step: "1" } });
      width.value = String(this.config[`${kind}_outline_width`]);
      width.addEventListener("change", () => {
        this.config[`${kind}_outline_width`] = this.toNumber(width.value, DEFAULT_CONFIG[`${kind}_outline_width`], 1, 12);
        width.value = String(this.config[`${kind}_outline_width`]);
        this.persistDraft();
        void this.renderPreview();
      });
      if (this.config[`${kind}_outline_mode`] === "custom") {
        const colorLabel = settings.createEl("label", { text: "颜色" });
        const color = colorLabel.createEl("input", { cls: "xhs-studio-color", type: "color" });
        color.value = this.config[`${kind}_outline_color`];
        color.addEventListener("change", () => {
          this.config[`${kind}_outline_color`] = color.value;
          this.persistDraft();
          void this.renderPreview();
        });
      }
    });
  }

  applyDetailTitleHighlightDefaults() {
    this.config.detail_title_color_mode="solid";
    this.config.detail_title_highlight_color=this.parseCoverHexColor(this.config.detail_title_highlight_color) || VISUAL_RULES.accent;
  }

  uniqueColorPresets(presets) {
    const seen = new Set();
    return presets.filter((preset) => {
      const color = this.normalizeColor(preset.color);
      if (!color || seen.has(color)) return false;
      seen.add(color);
      return true;
    });
  }

  uniqueGradientPresets(presets) {
    const seen = new Set();
    return presets.filter((preset) => {
      const stops = Array.isArray(preset.stops) && preset.stops.length >= 2 ? preset.stops : [preset.from, preset.to];
      const key = stops.map((color) => this.normalizeColor(color)).join("|");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  areColorStopsEqual(left, right) {
    const a = this.normalizeColorList(left, []);
    const b = this.normalizeColorList(right, []);
    return a.length === b.length && a.every((color, index) => this.normalizeColor(color) === this.normalizeColor(b[index]));
  }

  normalizeColor(color) {
    return this.toText(color).trim().toLowerCase();
  }

  renderTitleArtFontControls(label, key, script) {
    const presets = (TITLE_ART_FONT_PRESETS[script] || []).filter(preset => preset.id !== "en-script");
    const activePreset = this.config[key] === "en-script" ? "en-air" : this.config[key];
    const field = this.createField(label);
    const row = field.createDiv({ cls: "xhs-subtitle-mode-row xhs-art-font-row" });
    presets.forEach((preset) => {
      const button = row.createEl("button", {
        text: preset.name,
        cls: `xhs-subtitle-mode-button${activePreset === preset.id ? " is-active" : ""}`
      });
      if (preset.fontFamily) button.style.fontFamily = preset.fontFamily;
      if (preset.fontStyle) button.style.fontStyle = preset.fontStyle;
      if (preset.fontWeight) button.style.fontWeight = String(preset.fontWeight);
      button.addEventListener("click", () => {
        this.config[key] = preset.id;
        this.persistDraft();
        this.renderControls();
        void this.renderPreview();
      });
    });
  }

  applyCoverLayoutPreset(presetId) {
    const preset = this.getCoverLayoutPreset(presetId);
    this.config.cover_layout_preset = preset.id;
    if (preset.id !== "none") {
      this.config.background_color = preset.background || this.config.background_color;
      this.config.accent_color = preset.accent || this.config.accent_color;
      this.config.secondary_color = preset.secondary || this.config.secondary_color;
      this.config.text_color = preset.text || this.config.text_color;
      this.setActiveStyleGradientColors(preset.gradientFrom, preset.gradientTo);
      this.config.xhs_modules = this.createDefaultModulesForStyle(this.config.xhs_style, this.config);
      this.selectedModuleId = this.getDefaultSelectedModuleId(this.config.xhs_style);
      this.applyDetailTitleHighlightDefaults();
    }
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  setActiveStyleGradientColors(from, to) {
    if (!from || !to) return;
    if (this.config.xhs_style === "huawei-product") {
      this.config.huawei_gradient_enabled = true;
      this.config.huawei_gradient_from = from;
      this.config.huawei_gradient_to = to;
      return;
    }
    if (this.config.xhs_style === "instagram-gradient") {
      this.config.instagram_gradient_enabled = true;
      this.config.instagram_gradient_from = from;
      this.config.instagram_gradient_to = to;
      return;
    }
    if (this.config.xhs_style === "google-search" || this.isCoverLayoutStyle(this.config.xhs_style)) {
      this.config.google_gradient_enabled = true;
      this.config.google_gradient_from = from;
      this.config.google_gradient_to = to;
      return;
    }
    this.config.title_gradient_enabled = true;
    this.config.title_gradient_from = from;
    this.config.title_gradient_to = to;
  }

  applyCleanPalette(paletteId) {
    const palette = CLEAN_GRADIENT_PALETTES.find((item) => item.id === paletteId) || CLEAN_GRADIENT_PALETTES[0];
    this.config.clean_palette = palette.id;
    this.config.background_color = palette.background;
    this.config.accent_color = palette.accent;
    this.config.secondary_color = palette.secondary;
    const detail = this.getStyleDetailDefaults("clean-gradient", this.config);
    this.config.detail_background_color = detail.background;
    this.config.detail_font_weight = detail.fontWeight;
    this.config.detail_line_height = detail.lineHeight;
    this.applyDetailTitleHighlightDefaults();
    this.syncNeonModulesFromConfig("background_color");
    this.syncNeonModulesFromConfig("accent_color");
    this.syncNeonModulesFromConfig("secondary_color");
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyCleanGradientPreset(presetId) {
    const preset = CLEAN_GRADIENT_PRESETS.find((item) => item.id === presetId) || CLEAN_GRADIENT_PRESETS[0];
    this.config.apple_text_color_preset = this.findTextColorPresetIdByGradient(APPLE_TEXT_COLOR_PRESETS, preset.id);
    this.config.title_gradient_enabled = true;
    this.config.title_gradient_preset = preset.id;
    this.config.title_gradient_from = preset.from;
    this.config.title_gradient_to = preset.to;
    this.config.title_gradient_stops = preset.stops || [preset.from, preset.to];
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyHuaweiPalette(paletteId) {
    const palette = HUAWEI_PALETTES.find((item) => item.id === paletteId) || HUAWEI_PALETTES[0];
    this.config.huawei_palette = palette.id;
    this.config.background_color = palette.background;
    this.config.accent_color = palette.accent;
    this.config.secondary_color = palette.secondary;
    const detail = this.getStyleDetailDefaults("huawei-product", this.config);
    this.config.detail_background_color = detail.background;
    this.config.detail_font_weight = detail.fontWeight;
    this.config.detail_line_height = detail.lineHeight;
    this.applyDetailTitleHighlightDefaults();
    ["background_color", "accent_color", "secondary_color"].forEach((key) => this.syncNeonModulesFromConfig(key));
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyHuaweiGradientPreset(presetId) {
    const preset = HUAWEI_GRADIENT_PRESETS.find((item) => item.id === presetId) || HUAWEI_GRADIENT_PRESETS[0];
    this.config.huawei_text_color_preset = this.findTextColorPresetIdByGradient(HUAWEI_TEXT_COLOR_PRESETS, preset.id);
    this.config.huawei_gradient_enabled = true;
    this.config.huawei_gradient_preset = preset.id;
    this.config.huawei_gradient_from = preset.from;
    this.config.huawei_gradient_to = preset.to;
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyTextColorStyle(style, presetId) {
    const configMap = {
      "clean-gradient": {
        presets: APPLE_TEXT_COLOR_PRESETS,
        presetKey: "apple_text_color_preset",
        enabledKey: "title_gradient_enabled",
        gradientKey: "title_gradient_preset",
        fromKey: "title_gradient_from",
        toKey: "title_gradient_to",
        stopsKey: "title_gradient_stops"
      },
      "huawei-product": {
        presets: HUAWEI_TEXT_COLOR_PRESETS,
        presetKey: "huawei_text_color_preset",
        enabledKey: "huawei_gradient_enabled",
        gradientKey: "huawei_gradient_preset",
        fromKey: "huawei_gradient_from",
        toKey: "huawei_gradient_to"
      },
      "instagram-gradient": {
        presets: INSTAGRAM_TEXT_COLOR_PRESETS,
        presetKey: "instagram_text_color_preset",
        enabledKey: "instagram_gradient_enabled",
        gradientKey: "instagram_gradient_preset",
        fromKey: "instagram_gradient_from",
        toKey: "instagram_gradient_to"
      },
      "google-search": {
        presets: GOOGLE_TEXT_COLOR_PRESETS,
        presetKey: "google_text_color_preset",
        enabledKey: "google_gradient_enabled",
        gradientKey: "google_gradient_preset",
        fromKey: "google_gradient_from",
        toKey: "google_gradient_to"
      }
    };
    const config = configMap[style];
    if (!config) return;
    const preset = config.presets.find((item) => item.id === presetId) || config.presets[0];
    this.config[config.presetKey] = preset.id;
    if (preset.type === "solid") {
      this.config.text_color = preset.color || this.config.text_color;
      this.config[config.enabledKey] = false;
      this.syncNeonModulesFromConfig("text_color");
      this.syncBrandTitleModuleColor(style, this.config.text_color);
    } else {
      const gradientPreset = this.getGradientPresetForTextStyle(style, preset);
      this.config[config.enabledKey] = true;
      if (gradientPreset) {
        this.config[config.gradientKey] = gradientPreset.id;
        this.config[config.fromKey] = gradientPreset.from;
        this.config[config.toKey] = gradientPreset.to;
        if (config.stopsKey) {
          this.config[config.stopsKey] = gradientPreset.stops || [gradientPreset.from, gradientPreset.to];
        }
      }
    }
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  syncBrandTitleModuleColor(style, color) {
    if (!Array.isArray(this.config.xhs_modules) || !color) return;
    const ids = this.getBrandModuleIds(style);
    if (!ids || !ids.title) return;
    const title = this.config.xhs_modules.find((module) => module && module.id === ids.title);
    if (title && title.type === "text") title.color = color;
  }

  findTextColorPresetIdByGradient(presets, gradientPresetId) {
    const preset = presets.find((item) => item.type === "gradient" && (item.gradientPreset === gradientPresetId || item.id === gradientPresetId));
    return preset ? preset.id : "";
  }

  applyInstagramPalette(paletteId) {
    const palette = INSTAGRAM_PALETTES.find((item) => item.id === paletteId) || INSTAGRAM_PALETTES[0];
    this.config.instagram_palette = palette.id;
    this.config.background_color = palette.background;
    this.config.accent_color = palette.accent;
    this.config.secondary_color = palette.secondary;
    const detail = this.getStyleDetailDefaults("instagram-gradient", this.config);
    this.config.detail_background_color = detail.background;
    this.config.detail_font_weight = detail.fontWeight;
    this.config.detail_line_height = detail.lineHeight;
    this.applyDetailTitleHighlightDefaults();
    ["background_color", "accent_color", "secondary_color"].forEach((key) => this.syncNeonModulesFromConfig(key));
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyInstagramGradientPreset(presetId) {
    const preset = INSTAGRAM_GRADIENT_PRESETS.find((item) => item.id === presetId) || INSTAGRAM_GRADIENT_PRESETS[0];
    this.config.instagram_text_color_preset = this.findTextColorPresetIdByGradient(INSTAGRAM_TEXT_COLOR_PRESETS, preset.id);
    this.config.instagram_gradient_enabled = true;
    this.config.instagram_gradient_preset = preset.id;
    this.config.instagram_gradient_from = preset.from;
    this.config.instagram_gradient_to = preset.to;
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyGooglePalette(paletteId) {
    const palette = GOOGLE_PALETTES.find((item) => item.id === paletteId) || GOOGLE_PALETTES[0];
    this.config.google_palette = palette.id;
    this.config.background_color = palette.background;
    this.config.accent_color = palette.accent;
    this.config.secondary_color = palette.secondary;
    const detail = this.getStyleDetailDefaults("google-search", this.config);
    this.config.detail_background_color = detail.background;
    this.config.detail_font_weight = detail.fontWeight;
    this.config.detail_line_height = detail.lineHeight;
    this.applyDetailTitleHighlightDefaults();
    ["background_color", "accent_color", "secondary_color"].forEach((key) => this.syncNeonModulesFromConfig(key));
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  applyGoogleGradientPreset(presetId) {
    const preset = GOOGLE_GRADIENT_PRESETS.find((item) => item.id === presetId) || GOOGLE_GRADIENT_PRESETS[0];
    this.config.google_text_color_preset = this.findTextColorPresetIdByGradient(GOOGLE_TEXT_COLOR_PRESETS, preset.id);
    this.config.google_gradient_enabled = true;
    this.config.google_gradient_preset = preset.id;
    this.config.google_gradient_from = preset.from;
    this.config.google_gradient_to = preset.to;
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  getTitleGradientStops() {
    if (this.config.xhs_style === "huawei-product") {
      const preset = HUAWEI_GRADIENT_PRESETS.find((item) => item.id === this.config.huawei_gradient_preset);
      if (preset) return preset.stops || [preset.from, preset.to];
      return [
        this.config.huawei_gradient_from || DEFAULT_CONFIG.huawei_gradient_from,
        this.config.huawei_gradient_to || DEFAULT_CONFIG.huawei_gradient_to
      ];
    }
    if (this.config.xhs_style === "instagram-gradient") {
      const preset = INSTAGRAM_GRADIENT_PRESETS.find((item) => item.id === this.config.instagram_gradient_preset);
      if (preset) return preset.stops || [preset.from, preset.to];
      return [
        this.config.instagram_gradient_from || DEFAULT_CONFIG.instagram_gradient_from,
        this.config.instagram_gradient_to || DEFAULT_CONFIG.instagram_gradient_to
      ];
    }
    if (this.isCoverLayoutStyle(this.config.xhs_style)) {
      const titleStops = this.normalizeColorList(this.config.title_gradient_stops, []);
      if (titleStops.length >= 2) return titleStops;
      const preset = GOOGLE_GRADIENT_PRESETS.find((item) => item.id === this.config.google_gradient_preset);
      if (preset) return preset.stops || [preset.from, preset.to];
      return [
        this.config.google_gradient_from || DEFAULT_CONFIG.google_gradient_from,
        this.config.google_gradient_to || DEFAULT_CONFIG.google_gradient_to
      ];
    }
    if (this.config.xhs_style === "google-search") {
      const preset = GOOGLE_GRADIENT_PRESETS.find((item) => item.id === this.config.google_gradient_preset);
      if (preset) return preset.stops || [preset.from, preset.to];
      return [
        this.config.google_gradient_from || DEFAULT_CONFIG.google_gradient_from,
        this.config.google_gradient_to || DEFAULT_CONFIG.google_gradient_to
      ];
    }
    const textPreset = APPLE_TEXT_COLOR_PRESETS.find((item) => item.id === this.config.title_gradient_preset);
    const textGradient = this.getGradientPresetForTextStyle("clean-gradient", textPreset);
    if (textGradient && Array.isArray(textGradient.stops) && textGradient.stops.length >= 2) return textGradient.stops;
    const preset = CLEAN_GRADIENT_PRESETS.find((item) => item.id === this.config.title_gradient_preset);
    if (preset && Array.isArray(preset.stops) && preset.stops.length >= 2) return preset.stops;
    const storedStops = this.normalizeColorList(this.config.title_gradient_stops, []);
    if (storedStops.length >= 2) return storedStops;
    return [
      this.config.title_gradient_from || DEFAULT_CONFIG.title_gradient_from,
      this.config.title_gradient_to || DEFAULT_CONFIG.title_gradient_to
    ];
  }

  getDetailTitleGradientStops() {
    return [VISUAL_RULES.accent,VISUAL_RULES.accent];
  }

  getDetailTitleGradientCss() {
    return this.getGradientCssFromStops(this.getDetailTitleGradientStops());
  }

  getGradientCssFromStops(stops) {
    const colors = Array.isArray(stops) && stops.length >= 2 ? stops : [DEFAULT_CONFIG.title_gradient_from, DEFAULT_CONFIG.title_gradient_to];
    const last = Math.max(1, colors.length - 1);
    return `linear-gradient(105deg, ${colors.map((color, index) => `${color} ${Math.round(index / last * 100)}%`).join(", ")})`;
  }

  getActiveGradientFrom() {
    if (this.config.xhs_style === "huawei-product") {
      return this.config.huawei_gradient_from || DEFAULT_CONFIG.huawei_gradient_from;
    }
    if (this.config.xhs_style === "instagram-gradient") {
      return this.config.instagram_gradient_from || DEFAULT_CONFIG.instagram_gradient_from;
    }
    if (this.isCoverLayoutStyle(this.config.xhs_style)) {
      return this.config.title_gradient_from || this.config.google_gradient_from || DEFAULT_CONFIG.title_gradient_from;
    }
    if (this.config.xhs_style === "google-search") {
      return this.config.google_gradient_from || DEFAULT_CONFIG.google_gradient_from;
    }
    return this.config.title_gradient_from || DEFAULT_CONFIG.title_gradient_from;
  }

  getActiveGradientTo() {
    if (this.config.xhs_style === "huawei-product") {
      return this.config.huawei_gradient_to || DEFAULT_CONFIG.huawei_gradient_to;
    }
    if (this.config.xhs_style === "instagram-gradient") {
      return this.config.instagram_gradient_to || DEFAULT_CONFIG.instagram_gradient_to;
    }
    if (this.isCoverLayoutStyle(this.config.xhs_style)) {
      return this.config.title_gradient_to || this.config.google_gradient_to || DEFAULT_CONFIG.title_gradient_to;
    }
    if (this.config.xhs_style === "google-search") {
      return this.config.google_gradient_to || DEFAULT_CONFIG.google_gradient_to;
    }
    return this.config.title_gradient_to || DEFAULT_CONFIG.title_gradient_to;
  }

  isTitleGradientEnabled() {
    if (this.config.xhs_style === "huawei-product") return Boolean(this.config.huawei_gradient_enabled);
    if (this.config.xhs_style === "instagram-gradient") return Boolean(this.config.instagram_gradient_enabled);
    if (this.config.xhs_style === "google-search" || this.isCoverLayoutStyle(this.config.xhs_style)) return Boolean(this.config.google_gradient_enabled);
    return Boolean(this.config.title_gradient_enabled);
  }

  renderModuleLibrary() {
    this.controlsEl.style.setProperty("--xhs-accent", this.config.accent_color);
    this.controlsEl.style.setProperty("--xhs-text", this.config.text_color);
    this.controlsEl.style.setProperty("--xhs-title-gradient-css", this.getGradientCssFromStops(this.getTitleGradientStops()));
    const groups = [
      {
        title: "图片",
        items: [
          ["图片", "image"]
        ]
      },
      {
        title: "标签样式",
        items: [
          ["描边标签", "label-outline"],
          ["胶囊标签", "label-pill"]
        ]
      },
      {
        title: "装饰形状",
        items: [
          ["角标框", "corner-frame"]
        ]
      }
    ];

    groups.forEach((group) => {
      this.controlsEl.createDiv({ cls: "xhs-module-library-title", text: group.title });
      const grid = this.controlsEl.createDiv({ cls: "xhs-module-library-grid" });
      group.items.forEach(([label, preset]) => {
        const button = grid.createEl("button", {
          cls: `xhs-module-preset xhs-preset-${preset}`,
          attr: { type: "button" }
        });
        button.createDiv({ cls: "xhs-module-preset-icon",
          text: ["label-outline", "label-pill"].includes(preset) ? "标签" : "",
          attr: { "aria-hidden": "true" } });
        button.createDiv({ cls: "xhs-module-preset-label", text: label });
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.addCustomModule(preset);
        });
      });
    });
  }

  addCustomModule(preset) {
    if (preset === "line" || preset === "dashed-line") return;
    const module = this.createCustomModulePreset(preset);
    this.config.xhs_modules.push(module);
    this.selectedModuleId = module.id;
    this.persistDraft();
    void this.renderPreview();
    this.renderControls();
  }

  createCustomModulePreset(preset) {
    const id = `${preset}-${Date.now().toString(36)}`;
    const common = {
      id,
      template: this.config.xhs_style,
      custom: true,
      opacity: 1,
      borderRadius: 0,
      rotation: 0
    };
    const textCommon = {
      type: "text",
      text: "标签",
      x: 150,
      y: 760,
      w: 260,
      h: 68,
      fontSize: 32,
      fontWeight: 900,
      lineHeight: 1.2,
      letterSpacing: 0,
      color: "#00110f"
    };

    const presets = {
      image: { ...common, name: "图片", type: "image", role: "", x: 570, y: 690, w: 360, h: 240, objectFit: "contain", borderRadius: DEFAULT_IMAGE_RADIUS, className: "xhs-module-custom-image" },
      "image-main": { ...common, name: "图片", type: "image", role: "", x: 570, y: 690, w: 360, h: 240, objectFit: "contain", borderRadius: DEFAULT_IMAGE_RADIUS, className: "xhs-module-custom-image" },
      "image-logo": { ...common, name: "Logo", type: "image", role: "logo", x: 820, y: 92, w: 120, h: 120, objectFit: "contain", className: "xhs-module-custom-image" },
      "image-icon2": { ...common, name: "图标", type: "image", role: "icon2", x: 820, y: 235, w: 120, h: 120, objectFit: "contain", className: "xhs-module-custom-image" },
      "label-solid": { ...common, ...textCommon, name: "青色标签", background: "var(--xhs-accent)", className: "xhs-module-label-badge" },
      "label-outline": { ...common, ...textCommon, name: "描边标签", color: this.config.accent_color, background: "transparent", className: "xhs-module-label-outline" },
      "label-pill": {
        ...common,
        ...textCommon,
        name: "胶囊标签",
        color: this.config.text_color,
        background: "transparent",
        borderRadius: 999,
        borderWidth: 2,
        borderMode: "gradient",
        borderColor: "var(--xhs-accent)",
        className: "xhs-module-label-pill"
      },
      "highlight-strip": { ...common, name: "高亮条", type: "shape", x: 140, y: 820, w: 520, h: 42, background: "var(--xhs-accent)", borderRadius: 0, opacity: 1, className: "xhs-module-highlight-strip" },
      "corner-frame": { ...common, name: "角标框", type: "shape", x: 140, y: 760, w: 360, h: 180, background: "var(--xhs-secondary)", borderRadius: 0, className: "xhs-module-corner-frame" },
      dot: { ...common, name: "强调圆点", type: "shape", x: 180, y: 760, w: 96, h: 96, background: "var(--xhs-accent)", borderRadius: 0, className: "xhs-module-dot-shape" },
      "glass-panel": { ...common, name: "玻璃面板", type: "shape", x: 118, y: 360, w: 830, h: 300, background: "rgba(255,255,255,0.16)", borderRadius: 0, opacity: 1, className: "xhs-module-glass-panel" },
      "soft-shadow": { ...common, name: "柔光阴影", type: "shape", x: 560, y: 1110, w: 300, h: 74, background: "rgba(0,0,0,0.48)", borderRadius: 0, opacity: 1, className: "xhs-module-soft-shadow" },
      "light-spot": { ...common, name: "高光光斑", type: "shape", x: 680, y: 840, w: 220, h: 220, background: "rgba(255,255,255,0.34)", borderRadius: 0, opacity: 1, className: "xhs-module-light-spot" },
      speech: { ...common, name: "对话框", type: "shape", x: 160, y: 760, w: 320, h: 150, background: "rgba(255,255,255,0.92)", borderRadius: 18, className: "xhs-module-speech-bubble" },
      arrow: { ...common, ...textCommon, name: "箭头", text: "↗", x: 720, y: 260, w: 120, h: 120, fontSize: 96, color: this.config.accent_color, background: "transparent", className: "xhs-module-arrow-text" },
      "arrow-right": { ...common, ...textCommon, name: "右箭头", text: "→", x: 780, y: 380, w: 180, h: 90, fontSize: 84, color: this.config.accent_color, background: "transparent", className: "xhs-module-arrow-text" }
    };
    return presets[preset] || presets["label-pill"];
  }

  resetCompositionDefaults() {
    if (this.config.xhs_style !== "composition") return;
    this.config.composition_image = "";
    this.config.composition_modules_by_layout = {};
    this.config.composition_appearance_by_layout = {};
    this.config.composition_theme = "auto";
    this.config.composition_custom_colors = {};
    if (this.config.xhs_modules_by_style) delete this.config.xhs_modules_by_style.composition;
    this.applyCompositionTheme();
    this.config.xhs_modules = this.createCompositionModules(this.config);
    this.selectedModuleId = "composition-title";
    this.persistDraft();
    void this.render();
  }

  isLineModule(module) {
    if (!module || module.type !== "shape") return false;
    if (module.id === "cover-structure-rule" || (module.className || "").includes("xhs-cover-structure-rule")) return true;
    if ((module.className || "").includes("xhs-module-cover-layout-rule")) return true;
    return [
      "xhs-module-line",
      "xhs-module-dashed-line",
      "xhs-module-clean-rule",
      "xhs-module-huawei-rule",
      "xhs-module-instagram-rule",
      "xhs-module-google-rule"
    ].includes(module.className);
  }

  isPillLabelModule(module) {
    return module && module.type === "text" && /\bxhs-module-(label-pill|layout-pill)\b/.test(module.className || "");
  }

  isCenteredLabelModule(module) {
    return module && module.type === "text" && /\bxhs-module-(label-outline|label-pill|layout-pill)\b/.test(module.className || "");
  }

  isVerticalCenterTextModule(module) {
    if (!module || module.type !== "text") return false;
    if (this.isCenteredLabelModule(module)) return true;
    return /\bxhs-module-(label-badge|cta|footer)\b/.test(module.className || "");
  }

  makeSmallControlButton(parent, text, onClick) {
    const button = parent.createEl("button", { text, cls: "xhs-studio-button" });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });
    return button;
  }

  getSelectedModule() {
    return this.config.xhs_modules.find((module) => module.id === this.selectedModuleId) || this.config.xhs_modules[0] || null;
  }

  getModuleLabel(module) {
    if (!module) return "";
    if (module.name) return module.name;
    const labels = {
      "composition-block": "强调色块",
      "composition-image": "主体图片",
      "composition-title": "主标题",
      "composition-subtitle": "副标题",
      "composition-description": "辅助文案",
      "glow": "顶部发光",
      "big-title": "主标题",
      "subtitle": "副标题",
      "arrow": "右侧箭头",
      "tags": "标签",
      "tag-rule": "标签分隔线",
      "small-title": "小文案",
      "cta": "按钮文案",
      "footer": "底部栏",
      "checkers": "底部斜纹",
      "ai-bg": "背景",
      "ai-title": "主标题",
      "ai-kicker": "左上文案",
      "ai-brand": "右上品牌",
      "ai-speech": "对话框",
      "ai-bubble-title": "框内主文案",
      "ai-bubble-sub": "框内副文案",
      "ai-icon1": "图标 1",
      "ai-icon2": "图标 2",
      "ai-main": "主体图片",
      "ai-chips": "标签贴纸",
      "ai-proof": "证明短句",
      "ai-bottom": "底部大字",
      "clean-bg": "浅色背景",
      "clean-title": "主标题",
      "clean-subtitle": "副标题",
      "clean-rule": "分割线",
      "clean-image": "下方图片",
      "huawei-bg": "华为背景",
      "huawei-title": "主标题",
      "huawei-subtitle": "副标题",
      "huawei-rule": "分割线",
      "huawei-image": "下方图片",
      "instagram-bg": "Ins背景",
      "instagram-title": "主标题",
      "instagram-subtitle": "副标题",
      "instagram-rule": "渐变分割线",
      "instagram-image": "下方图片",
      "google-bg": "Google背景",
      "google-title": "主标题",
      "google-subtitle": "搜索框副标题",
      "google-rule": "四色分割线",
      "google-image": "下方图片"
    };
    if (labels[module.id]) return labels[module.id];
    const prefixLabels = [
      ["image-main", "主体图片"],
      ["image-logo", "Logo"],
      ["image-icon2", "图标"],
      ["label-solid", "青色标签"],
      ["label-outline", "描边标签"],
      ["label-pill", "胶囊标签"],
      ["highlight-strip", "高亮条"],
      ["corner-frame", "角标框"],
      ["dot", "强调圆点"],
      ["glass-panel", "玻璃面板"],
      ["soft-shadow", "柔光阴影"],
      ["light-spot", "高光光斑"],
      ["speech", "对话框"],
      ["line", "实线"],
      ["google-rule", "四色分割线"],
      ["dashed-line", "虚线"],
      ["arrow-right", "右箭头"],
      ["arrow", "箭头"],
      ["rect", "旧矩形"],
      ["round-rect", "旧圆角矩形"],
      ["circle", "旧圆形"]
    ];
    const found = prefixLabels.find(([prefix]) => module.id.startsWith(prefix));
    if (found) return found[1];
    const textRoles = { title: "主标题", subtitle: "副标题", description: "辅助文案" };
    if (textRoles[module.coverTextRole]) return textRoles[module.coverTextRole];
    const types = { image: "图片", text: "文案", shape: "装饰图形" };
    return types[module.type] || "模块";
  }

  duplicateSelectedModule() {
    const selected = this.getSelectedModule();
    if (!selected) return;
    const copy = Object.assign({}, selected, {
      id: `${selected.id}-copy-${Date.now().toString(36)}`,
      name: `${this.getModuleLabel(selected)} 副本`,
      x: selected.x + 28,
      y: selected.y + 28,
      custom: true,
      locked: false
    });
    const index = this.config.xhs_modules.indexOf(selected);
    this.config.xhs_modules.splice(index + 1, 0, copy);
    this.selectedModuleId = copy.id;
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  deleteSelectedModule() {
    const selected = this.getSelectedModule();
    if (!selected || selected.locked) {
      new Notice("该模块不能删除");
      return;
    }
    if(selected.id==="cover-structure-rule")this.config.cover_rule_hidden=true;
    if(selected.coverTextRole==="description" || ["composition-description","cover-description"].includes(selected.id)) {
      this.config.composition_description="";
      selected.text="";
      this.config.xhs_modules=this.config.xhs_modules.filter(module=>module.id!==selected.id);
      this.selectedModuleId="";
      this.persistDraft();this.renderControls();void this.renderPreview();
      return;
    }
    this.config.xhs_modules = this.config.xhs_modules.filter((module) => module.id !== selected.id);
    if (this.config.xhs_style === "composition" && selected.id === "composition-image") {
      this.config.composition_image = "";
      this.syncCompositionOverlayColors();
    }
    this.selectedModuleId = this.config.xhs_modules[0] ? this.config.xhs_modules[0].id : "";
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  moveSelectedModule(delta) {
    const selected = this.getSelectedModule();
    if (!selected) return;
    const index = this.config.xhs_modules.indexOf(selected);
    const nextIndex = Math.max(0, Math.min(this.config.xhs_modules.length - 1, index + delta));
    if (nextIndex === index) return;
    this.config.xhs_modules.splice(index, 1);
    this.config.xhs_modules.splice(nextIndex, 0, selected);
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  addModuleTextArea(label, module, key) {
    const field = this.createField(label);
    const input = field.createEl("textarea", { cls: "xhs-studio-textarea" });
    input.value = module[key] || "";
    input.addEventListener("input", () => {
      module[key] = input.value;
      if (module.type === "image" && key === "src") module.objectFit = "contain";
      this.syncCompositionContentFromModule(module);
      this.ensureCenteredLabelModuleSize(module);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addModuleImagePath(label, module, key) {
    const field = this.createField(label);
    const row = field.createDiv({ cls: "xhs-studio-image-row" });
    const input = row.createEl("input", { cls: "xhs-studio-input", type: "text" });
    input.value = module[key] || "";
    input.addEventListener("input", () => {
      module[key] = input.value;
      this.syncCompositionContentFromModule(module);
      this.persistDraft();
      void this.renderPreview();
    });

    const upload = row.createEl("input", { type: "file", cls: "xhs-studio-file" });
    upload.accept = "image/*";
    upload.addEventListener("change", async () => {
      const file = upload.files && upload.files[0];
      if (!file) return;
      const vaultPath = await this.importImageFile(file);
      module[key] = vaultPath;
      if (module.type === "image" && key === "src") module.objectFit = "contain";
      this.syncCompositionContentFromModule(module);
      input.value = vaultPath;
      const src = await this.resolveImage(vaultPath);
      if (src) {
        const loadedImage = await this.loadImage(src).catch(() => null);
        module.rawLogo = this.shouldRenderRawLogoImage(module, vaultPath, src, loadedImage);
        await this.fitImageModuleToSource(module, src, null, false, loadedImage);
      }
      this.persistDraft();
      await this.renderPreview();
      new Notice("模块图片已上传");
    });
  }

  addModuleColorValue(label, module, key, fallback, allowTransparent = false) {
    const field = this.createField(label);
    const row = field.createDiv({ cls: "xhs-module-color-row" });
    const color = row.createEl("input", { cls: "xhs-studio-color", type: "color" });
    color.value = this.toColor(module[key], this.toColor(fallback, "#ffffff"));
    const input = row.createEl("input", { cls: "xhs-studio-input", type: "text" });
    input.value = module[key] == null ? "" : String(module[key]);

    const apply = (value) => {
      module[key] = value;
      this.markModuleManualChange(module, { [key]: value });
      input.value = value;
      color.value = this.toColor(value, color.value);
      this.persistDraft();
      void this.renderPreview();
    };

    color.addEventListener("change", () => apply(color.value));
    input.addEventListener("input", () => apply(input.value));

    const presets = field.createDiv({ cls: "xhs-module-preset-row" });
    if (allowTransparent) {
      this.makeSmallControlButton(presets, "透明", () => apply("transparent"));
    }
    this.makeSmallControlButton(presets, "强调色", () => apply("var(--xhs-accent)"));
    this.makeSmallControlButton(presets, "辅助色", () => apply("var(--xhs-secondary)"));
    this.makeSmallControlButton(presets, "文字色", () => apply("var(--xhs-text)"));
  }

  renderPillBorderModeControls(module) {
    const field = this.createField("胶囊边框");
    const row = field.createDiv({ cls: "xhs-subtitle-mode-row" });
    [
      ["solid", "纯色"],
      ["gradient", "渐变"]
    ].forEach(([mode, label]) => {
      const button = row.createEl("button", {
        text: label,
        cls: `xhs-subtitle-mode-button${(module.borderMode || "gradient") === mode ? " is-active" : ""}`
      });
      button.addEventListener("click", () => {
        module.borderMode = mode;
        module.borderWidth = Number(module.borderWidth) || 2;
        module.background = "transparent";
        this.markModuleManualChange(module, { borderMode: mode, borderWidth: module.borderWidth, background: module.background });
        this.persistDraft();
        this.renderControls();
        void this.renderPreview();
      });
    });
  }

  addModuleInput(label, module, key) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "text" });
    input.value = module[key] == null ? "" : String(module[key]);
    input.addEventListener("input", () => {
      const raw = input.value;
      module[key] = key === "opacity" || key === "lineHeight" ? Number.parseFloat(raw) || 0 : raw;
      this.markModuleManualChange(module, { [key]: module[key] });
      this.ensureCenteredLabelModuleSize(module);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addModuleNumber(label, module, key, min, max) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "number" });
    input.value = module[key] == null ? "" : String(key === "fontSize"
      ? this.getCompositionFittedFontSize(module) : module[key]);
    input.addEventListener("input", () => {
      module[key] = this.toNumber(input.value, module[key] || 0, min, max);
      if (module.template === "composition" && module.type === "image" && ["x", "y", "w", "h"].includes(key)) {
        this.constrainCompositionImageBox(module);
      }
      this.markModuleManualChange(module, { [key]: module[key] });
      this.ensureCenteredLabelModuleSize(module);
      input.value = module[key] == null ? "" : String(module[key]);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addModuleAspectNumber(label, module, key, min, max) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "number" });
    input.value = module[key] == null ? "" : String(module[key]);
    input.addEventListener("input", () => {
      const value = this.toNumber(input.value, module[key] || 0, min, max);
      const aspect = module.aspectRatio || module.w / Math.max(1, module.h);
      if (key === "w") {
        module.w = value;
        module.h = Math.max(1, Math.round(module.w / Math.max(0.01, aspect)));
      } else {
        module.h = value;
        module.w = Math.max(1, Math.round(module.h * Math.max(0.01, aspect)));
      }
      module.aspectRatio = module.w / Math.max(1, module.h);
      module.manualSize = true;
      module.manualLayout = true;
      this.persistDraft();
      this.renderControls();
      void this.renderPreview();
    });
  }

  addModuleSquareSize(label, module, min, max) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "number" });
    input.value = String(Math.round(Math.max(module.w || 0, module.h || 0)));
    input.addEventListener("input", () => {
      const value = this.toNumber(input.value, Math.max(module.w || 96, module.h || 96), min, max);
      module.w = value;
      module.h = value;
      module.borderRadius = 0;
      module.manualSize = true;
      module.manualLayout = true;
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addSelect(label, key, options) {
    const field = this.createField(label);
    const select = field.createEl("select", { cls: "xhs-studio-input" });
    options.forEach((option) => select.createEl("option", { value: option.id, text: option.name }));
    select.value = this.config[key];
    select.addEventListener("change", () => {
      if (key === "xhs_style") this.saveCurrentStyleModules();
      this.config[key] = select.value;
      if (key === "xhs_style") {
        this.selectedModuleId = "";
        this.applyStyleDefaultColors(this.config.xhs_style);
        if (this.config.xhs_style === "composition") this.restoreCompositionAppearance(this.config);
        this.config.xhs_modules = this.loadModulesForStyle(this.config.xhs_style, this.config);
        if (this.config.xhs_style === "composition") {
          this.restoreCompositionContentFromModules();
          this.syncCompositionOverlayColors();
        } else {
          this.syncCurrentTextToModules();
        }
      }
      this.persistDraft();
      void this.render();
    });
  }

  createDefaultModulesForStyle(style, config) {
    let modules;
    if(style==='nng-red-system')return this.createComparisonCoverModules(config);
    if (style === "composition") return this.createCompositionModules(config);
    const baseStyle = this.isCoverLayoutStyle(style) ? "google-search" : style;
    const layoutPresetId = this.isCoverLayoutStyle(style) ? style : config.cover_layout_preset;
    if (baseStyle === "neon-grid") modules = this.createDefaultNeonModules(config);
    else if (baseStyle === "clean-gradient") modules = this.createDefaultCleanModules(config);
    else if (baseStyle === "huawei-product") modules = this.createDefaultHuaweiModules(config);
    else if (baseStyle === "instagram-gradient") modules = this.createDefaultInstagramModules(config);
    else if (baseStyle === "google-search") modules = this.createDefaultGoogleModules(config);
    else modules = this.createDefaultAiModules(config);
    return this.normalizeDefaultTemplateLayout(modules, baseStyle, layoutPresetId, config);
  }

  createCompositionModules(config) {
    const preset = COMPOSITION_PRESETS.find((item) => item.id === config.composition_variant)
      || COMPOSITION_PRESETS.find((item) => item.id === DEFAULT_CONFIG.composition_variant);
    const position = ([x, y, w, h]) => ({ x, y, w, h });
    const text = (id, value, box, size, weight, color, align) => ({
      id, type: "text", template: "composition", text: value,
      ...position(box), fontSize: size, fontWeight: weight, lineHeight: 1.12,
      letterSpacing: 0, color,
      background: "transparent",
      textAlign: align,
      className: `xhs-module-composition-${id.slice("composition-".length)}${preset.id === "solid-poster" && ["composition-title", "composition-description"].includes(id) ? " xhs-module-composition-photo-label" : ""}`
    });
    const images = preset.images.map((box, index) => ({
      id: index ? `composition-image-${index + 1}` : "composition-image",
      name: `图片区 ${index + 1}`, type: "image", template: "composition",
      role: index ? "composition-media" : "main", ...position(box),
      src: index ? "" : (config.composition_image || ""), objectFit: preset.id==='headline-band'?'contain':'cover',
      background: "transparent",
      borderRadius: 0, className: "xhs-module-composition-image"
    }));
    const align = preset.align || "left";
    return [
      ...images,
      { id: "composition-block", type: "shape", template: "composition", ...position(preset.block),
        background: preset.blockColor || "var(--xhs-accent)", className: "xhs-module-composition-block" },
      text("composition-title", config.title, preset.title, preset.titleSize, 720,
        preset.onImage ? (preset.id === "solid-poster" || config.composition_image ? "#ffffff" : "#111116")
          : this.getCompositionBackgroundTextColor(config, config.text_color), preset.titleAlign || align),
      text("composition-subtitle", config.subtitle, preset.subtitle, preset.subtitleSize, 500,
        preset.subtitleOnBlock ? this.getCompositionBackgroundTextColor({ background_color: config.accent_color }, config.background_color)
          : (preset.subtitleOnImage ? (preset.id === "solid-poster" || config.composition_image ? "#ffffff" : "#111116")
            : this.getCompositionBackgroundTextColor(config, config.text_color)),
        preset.subtitleAlign || align),
      text("composition-description", config.composition_description, preset.description, 26, 400,
        preset.id === "solid-poster" ? "#ffffff" : this.getCompositionBackgroundTextColor(config),
        preset.descriptionAlign || align),
    ];
  }

  getCompositionTheme(config = this.config) {
    const preset = COMPOSITION_PRESETS.find((item) => item.id === config.composition_variant) || COMPOSITION_PRESETS[0];
    const id = config.composition_theme === "auto" ? preset.theme : config.composition_theme;
    return COMPOSITION_THEMES.find((theme) => theme.id === id) || COMPOSITION_THEMES[0];
  }

  captureCompositionColors(config = this.config) {
    return {
      background_color: config.background_color, text_color: config.text_color,
      accent_color: config.accent_color, secondary_color: config.secondary_color,
      detail_background_color: config.detail_background_color, detail_text_color: config.detail_text_color
    };
  }

  applyCompositionTheme(config = this.config) {
    const theme = this.getCompositionTheme(config);
    config.background_color = theme.background;
    config.text_color = theme.text;
    config.accent_color = theme.accent;
    config.secondary_color = theme.secondary;
    config.detail_background_color = DEFAULT_CONFIG.detail_background_color;
    config.detail_text_color = theme.text;
  }

  getCompositionBackgroundTextColor(config = this.config, preferredColor = "") {
    const channelsFor = (color) => {
      const hex = String(color || "").trim().replace(/^#/, "");
      if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
      return hex.length === 3
        ? Array.from(hex, (digit) => Number.parseInt(digit + digit, 16))
        : [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
    };
    const channels = channelsFor(config.background_color);
    if (!channels) return preferredColor || "var(--xhs-text)";
    const luminanceFor = (values) => {
      const linear = values.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const luminance = luminanceFor(channels);
    const preferred = channelsFor(preferredColor);
    if (preferred) {
      const preferredLuminance = luminanceFor(preferred);
      const ratio = (Math.max(luminance, preferredLuminance) + 0.05)
        / (Math.min(luminance, preferredLuminance) + 0.05);
      if (ratio >= 4.5) return preferredColor;
    }
    if (luminance <= 0.179) return "#ffffff";
    return (luminance + 0.05) / (luminanceFor([17, 17, 22]) + 0.05) >= 4.5 ? "#111116" : "#000000";
  }

  syncCompositionOverlayColors(config = this.config) {
    if (config.xhs_style !== "composition" || !Array.isArray(config.xhs_modules)) return;
    if(config.cover_text_layout_version===1){this.layoutCoverText(config);return;}
    if (config.cover_editor_version === 1) {
      config.xhs_modules.filter(module=>this.isCoverTitleModule(module) && !module.manualStyle)
        .forEach(module=>{module.color=config.cover_title_color || config.text_color;});
      return;
    }
    const preset = COMPOSITION_PRESETS.find((item) => item.id === config.composition_variant);
    if (!preset) return;
    const image = config.xhs_modules.find((module) => module.id === "composition-image");
    const hasImage = Boolean(image?.src);
    const title = config.xhs_modules.find((module) => module.id === "composition-title");
    const subtitle = config.xhs_modules.find((module) => module.id === "composition-subtitle");
    const description = config.xhs_modules.find((module) => module.id === "composition-description");
    if (preset.onImage && title && !title.manualStyle) title.color = preset.id === "solid-poster" || hasImage ? "#ffffff" : "#111116";
    else if (title && !title.manualStyle) title.color = this.getCompositionBackgroundTextColor(config, config.text_color);
    if (preset.subtitleOnImage && subtitle && !subtitle.manualStyle) subtitle.color = preset.id === "solid-poster" || hasImage ? "#ffffff" : "#111116";
    else if (preset.subtitleOnBlock && subtitle && !subtitle.manualStyle) {
      subtitle.color = this.getCompositionBackgroundTextColor({ background_color: config.accent_color }, config.background_color);
    }
    else if (!preset.subtitleOnBlock && subtitle && !subtitle.manualStyle) {
      subtitle.color = this.getCompositionBackgroundTextColor(config, config.text_color);
    }
    if (preset.id === "solid-poster" && description && !description.manualStyle) {
      description.color = "#ffffff";
    } else if (description && !description.manualStyle) {
      description.color = this.getCompositionBackgroundTextColor(config);
    }
  }


  getCoverLayoutPreset(presetId = this.config.cover_layout_preset) {
    return COVER_LAYOUT_PRESETS.find((preset) => preset.id === presetId) || COVER_LAYOUT_PRESETS[0];
  }

  isCoverLayoutStyle(style) {
    return COVER_LAYOUT_PRESETS.some((preset) => preset.id === style && preset.id !== "none");
  }

  getBrandModuleIds(style = this.config.xhs_style) {
    if (style === "clean-gradient") return { bg: "clean-bg", title: "clean-title", subtitle: "clean-subtitle", rule: "clean-rule", image: "clean-image", titleClass: "xhs-module-clean-title", subtitleClass: "xhs-module-clean-subtitle", imageClass: "xhs-module-clean-image" };
    if (style === "huawei-product") return { bg: "huawei-bg", title: "huawei-title", subtitle: "huawei-subtitle", rule: "huawei-rule", image: "huawei-image", titleClass: "xhs-module-huawei-title", subtitleClass: "xhs-module-huawei-subtitle", imageClass: "xhs-module-huawei-image" };
    if (style === "instagram-gradient") return { bg: "instagram-bg", title: "instagram-title", subtitle: "instagram-subtitle", rule: "instagram-rule", image: "instagram-image", titleClass: "xhs-module-instagram-title", subtitleClass: "xhs-module-instagram-subtitle", imageClass: "xhs-module-instagram-image" };
    if (style === "google-search") return { bg: "google-bg", title: "google-title", subtitle: "google-subtitle", rule: "google-rule", image: "google-image", titleClass: "xhs-module-google-title", subtitleClass: "xhs-module-google-subtitle", imageClass: "xhs-module-google-image" };
    return null;
  }

  normalizeDefaultTemplateLayout(modules, style, layoutPresetId, config = this.config) {
    if(config.cover_text_layout_version===1)return modules;
    if (!Array.isArray(modules)) return modules;
    const ids = this.getBrandModuleIds(style);
    if (!ids) return modules;
    const byId = new Map(modules.map((module) => [module.id, module]));
    const title = byId.get(ids.title);
    const subtitle = byId.get(ids.subtitle);
    const rule = byId.get(ids.rule);
    const image = byId.get(ids.image);
    const bg = byId.get(ids.bg);
    if (title && this.canAutoFitTextModule(title)) this.fitTextModuleFrameToContent(title);
    if (subtitle && this.canAutoFitTextModule(subtitle)) this.fitTextModuleFrameToContent(subtitle);

    const presetId = layoutPresetId || "none";
    const preset = this.getCoverLayoutPreset(presetId);
    if (bg && preset.id !== "none") {
      bg.x = 0;
      bg.y = 0;
      bg.w = Number(config.xhs_width) || 1080;
      bg.h = Number(config.xhs_height) || 1440;
      bg.layoutPreset = preset.id;
      bg.background = "transparent";
      bg.borderRadius = 0;
      bg.locked = true;
      const className = (bg.className || ids.bg || "")
        .replace(/\bxhs-cover-layout-bg-[^\s]+/g, "")
        .trim();
      const required = ["xhs-module-cover-layout-bg", `xhs-cover-layout-bg-${preset.id}`];
      bg.className = [className, ...required.filter((item) => !className.includes(item))].join(" ").trim();
    }
    if (presetId === "nng-red-system") {
      if (title && this.canApplyDefaultModuleLayout(title)) {
        title.x = 112;
        title.y = 760;
        title.w = 856;
        title.h = 380;
        title.lineHeight = 1.08;
        title.fontSize = Math.min(Number(title.fontSize) || Number(config.title_size) || 112, 112);
        title.fontWeight = 740;
        title.color = config.text_color || "#050505";
        title.textAlign = "left";
      }
      if (subtitle && this.canApplyDefaultModuleLayout(subtitle)) {
        subtitle.x = 112;
        subtitle.y = 1180;
        subtitle.w = 760;
        subtitle.h = 104;
        subtitle.color = "#050505";
        subtitle.background = "transparent";
        subtitle.borderRadius = 0;
        subtitle.textAlign = "left";
      }
      if (rule && this.canApplyDefaultModuleLayout(rule)) {
        rule.x = 112;
        rule.y = 1340;
        rule.w = 92;
        rule.h = Math.max(1, Number(rule.h) || 2);
        rule.background = "rgba(0,0,0,0.42)";
      }
      return modules;
    }

    const canvasHeight = Number(config.xhs_height) || 1440;
    const lowerBound = Math.max(0, canvasHeight - 70);
    const minGap = presetId && presetId !== "none" ? 34 : 28;

    if (title && subtitle) {
      const nextY = Math.round(title.y + title.h + minGap);
      if (subtitle.y < nextY && this.canApplyDefaultModuleLayout(subtitle)) subtitle.y = nextY;
    }
    if (subtitle && rule) {
      const nextY = Math.round(subtitle.y + subtitle.h + Math.max(24, minGap - 2));
      if (rule.y < nextY && this.canApplyDefaultModuleLayout(rule)) rule.y = nextY;
    }
    if (image) {
      const anchor = rule || subtitle || title;
      if (anchor) {
        const nextY = Math.round(anchor.y + Math.max(1, anchor.h || 1) + Math.max(44, minGap + 16));
        if (image.y < nextY && this.canApplyDefaultModuleLayout(image)) image.y = nextY;
      }
      if (image.y + image.h > lowerBound && this.canApplyDefaultModuleLayout(image)) {
        image.h = Math.max(180, lowerBound - image.y);
      }
    }
    return modules;
  }

  getDefaultSelectedModuleId(style) {
    if (style === "nng-red-system") return "comparison-title";
    if (style === "composition") return "composition-title";
    if (style === "neon-grid") return "big-title";
    if (style === "clean-gradient") return "clean-title";
    if (style === "huawei-product") return "huawei-title";
    if (style === "instagram-gradient") return "instagram-title";
    if (style === "google-search") return "google-title";
    if (this.isCoverLayoutStyle(style)) return "google-title";
    return "ai-title";
  }

  getStyleDetailDefaults(style, config = this.config) {
    return {background:VISUAL_RULES.background,text:VISUAL_RULES.ink,
      fontWeight:VISUAL_RULES.bodyWeight,lineHeight:VISUAL_RULES.bodyLeading};
  }

  migrateAppleSilverPalette(config) {
    if (!config || config.xhs_style !== "clean-gradient") return;
    const silverPalette = CLEAN_GRADIENT_PALETTES.find((palette) => palette.id === "apple-pro-dark");
    if (!silverPalette) return;
    const hasLegacyDarkPalette = config.clean_palette === "apple-pro-dark"
      || ["#05070b", "#06070b", "#0f1724"].includes(this.toText(config.background_color).toLowerCase());
    if (hasLegacyDarkPalette) {
      config.clean_palette = silverPalette.id;
      config.background_color = silverPalette.background;
      config.accent_color = silverPalette.accent;
      config.secondary_color = silverPalette.secondary;
      config.text_color = silverPalette.text;
      if (config.detail_background_color === "#05070b" || config.detail_background_color === DEFAULT_CONFIG.detail_background_color) {
        config.detail_background_color = silverPalette.background;
      }
      if (config.detail_text_color === "#f5f5f7" || config.detail_text_color === DEFAULT_CONFIG.detail_text_color) {
        config.detail_text_color = silverPalette.text;
      }
    }
    const hadLegacyNightGradient = this.toText(config.title_gradient_from).toLowerCase() === "#2997ff"
      && this.toText(config.title_gradient_to).toLowerCase() === "#a972ff";
    if (hadLegacyNightGradient || hasLegacyDarkPalette) {
      config.title_gradient_from = silverPalette.gradientFrom;
      config.title_gradient_to = silverPalette.gradientTo;
    }
  }

  migrateAppleProductColorSelection(config) {
    if (!config) return;
    const solid = APPLE_PRODUCT_TITLE_COLOR_PRESETS.find((preset) => preset.type === "solid");
    const gradient = APPLE_PRODUCT_TITLE_COLOR_PRESETS.find((preset) => preset.type === "gradient");
    const neutralColors = new Set([
      "#000",
      "#000000",
      "#111111",
      "#1d1d1f",
      "#333336",
      "#6e6e73",
      "#86868b",
      "#d2d2d7",
      "#e8e8ed",
      "#f5f5f7",
      "#fff",
      "#ffffff"
    ]);
    const isAppleTitleStyle = config.xhs_style === "clean-gradient" || this.isCoverLayoutStyle(config.xhs_style);
    if (isAppleTitleStyle && solid && !config.title_gradient_enabled && neutralColors.has(this.normalizeColor(config.text_color))) {
      config.text_color = solid.color;
    }
    if (isAppleTitleStyle && gradient) {
      const titleStops = this.normalizeColorList(config.title_gradient_stops, [config.title_gradient_from, config.title_gradient_to]);
      const hadLegacyGradient = this.areColorStopsEqual(titleStops, ["#0071e3", "#af52de"])
        || this.areColorStopsEqual(titleStops, ["#006edb", "#0a84ff", "#2997ff", "#5856d6"])
        || this.areColorStopsEqual(titleStops, ["#6e6aa8", "#5f7faa", "#4e8fa3", "#426f89"]);
      if (hadLegacyGradient) {
        config.title_gradient_from = gradient.from;
        config.title_gradient_to = gradient.to;
        config.title_gradient_stops = gradient.stops || [gradient.from, gradient.to];
        config.apple_text_color_preset = gradient.id;
      }
    }
  }



  migrateCustomModuleStyles(config) {
    if (!config || !Array.isArray(config.xhs_modules)) return;
    config.xhs_modules.forEach((module) => {
      if (!module || !module.custom) return;
      if (this.isPillLabelModule(module)) {
        module.borderRadius = 999;
        module.background = "transparent";
        module.borderWidth = Number(module.borderWidth) || 2;
        module.borderMode = module.borderMode === "solid" ? "solid" : "gradient";
        module.borderColor = module.borderColor || "var(--xhs-accent)";
      }
      if (module.id && module.id.startsWith("speech") && module.className === "xhs-module-ai-speech") {
        module.className = "xhs-module-speech-bubble";
        module.background = module.background && module.background !== "rgba(255,255,255,0)"
          ? module.background
          : "rgba(255,255,255,0.92)";
        module.borderRadius = Math.max(14, Math.min(28, Number(module.borderRadius) || 18));
      }
    });
  }

  removeDisabledCustomModules(config) {
    if (!config || !Array.isArray(config.xhs_modules)) return;
    const disabledClassNames = new Set([
      "xhs-module-label-badge",
      "xhs-module-highlight-strip",
      "xhs-module-dot-shape",
      "xhs-module-speech-bubble",
      "xhs-module-line",
      "xhs-module-dashed-line",
      "xhs-module-arrow-text"
    ]);
    config.xhs_modules = config.xhs_modules.filter((module) => {
      if (!module || !module.custom) return true;
      return !disabledClassNames.has(module.className);
    });
  }

  applyStyleDefaultColors(style) {
    if (style === "composition") {
      if (this.config.composition_theme === "custom"
        && Object.keys(this.config.composition_custom_colors || {}).length) {
        Object.assign(this.config, this.config.composition_custom_colors);
      } else if (this.config.composition_theme !== "custom") this.applyCompositionTheme();
      this.config.title_gradient_enabled = false;
      return;
    }
    if (this.isCoverLayoutStyle(style)) {
      const preset = this.getCoverLayoutPreset(style);
      this.config.cover_layout_preset = preset.id;
      this.config.background_color = preset.background || this.config.background_color;
      this.config.accent_color = preset.accent || this.config.accent_color;
      this.config.secondary_color = preset.secondary || this.config.secondary_color;
      this.config.text_color = preset.text || this.config.text_color;
      this.config.google_text_color_preset = preset.id === "google-omni" ? "google-grad-logo" : "google-grad-material";
      this.config.google_gradient_enabled = true;
      this.config.google_gradient_preset = "";
      this.config.google_gradient_from = preset.gradientFrom || this.config.google_gradient_from;
      this.config.google_gradient_to = preset.gradientTo || this.config.google_gradient_to;
      this.config.title_gradient_enabled = true;
      this.config.title_gradient_preset = "";
      this.config.title_gradient_from = preset.gradientFrom || this.config.title_gradient_from;
      this.config.title_gradient_to = preset.gradientTo || this.config.title_gradient_to;
      this.config.cover_font_weight = 700;
      this.config.subtitle_font_weight = 500;
      this.config.subtitle_color_mode = "muted";
      this.config.title_line_height = 1.06;
      this.config.title_letter_spacing = 0;
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
      return;
    }
    this.config.cover_layout_preset = DEFAULT_CONFIG.cover_layout_preset;
    if (style === "ai-course") {
      this.config.background_color = "#0a1f64";
      this.config.accent_color = "#ff1414";
      this.config.secondary_color = "#ff21c8";
      this.config.text_color = "#ffffff";
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
      return;
    }
    if (style === "clean-gradient") {
      const palette = CLEAN_GRADIENT_PALETTES[0];
      this.config.clean_palette = palette.id;
      this.config.background_color = palette.background;
      this.config.accent_color = palette.accent;
      this.config.secondary_color = palette.secondary;
      this.config.text_color = palette.text;
      this.config.apple_text_color_preset = "apple-grad-mac-speed";
      this.config.title_gradient_enabled = true;
      this.config.title_gradient_preset = "macbook-blue-purple";
      const gradientPreset = CLEAN_GRADIENT_PRESETS.find((item) => item.id === this.config.title_gradient_preset);
      this.config.title_gradient_from = gradientPreset ? gradientPreset.from : palette.gradientFrom;
      this.config.title_gradient_to = gradientPreset ? gradientPreset.to : palette.gradientTo;
      this.config.cover_font_weight = 700;
      this.config.subtitle_font_weight = 500;
      this.config.subtitle_color_mode = "muted";
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
      return;
    }
    if (style === "huawei-product") {
      const palette = HUAWEI_PALETTES[0];
      this.config.huawei_palette = palette.id;
      this.config.background_color = palette.background;
      this.config.accent_color = palette.accent;
      this.config.secondary_color = palette.secondary;
      this.config.text_color = palette.text;
      this.config.huawei_text_color_preset = "huawei-grad-pura-gold";
      this.config.huawei_gradient_enabled = true;
      this.config.huawei_gradient_preset = "pura-silk-gold";
      this.config.huawei_gradient_from = palette.gradientFrom;
      this.config.huawei_gradient_to = palette.gradientTo;
      this.config.title_size = 112;
      this.config.subtitle_size = 42;
      this.config.cover_font_weight = 700;
      this.config.subtitle_font_weight = 500;
      this.config.subtitle_color_mode = "muted";
      this.config.title_line_height = 1.06;
      this.config.title_letter_spacing = 0;
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
      return;
    }
    if (style === "instagram-gradient") {
      const palette = INSTAGRAM_PALETTES[0];
      this.config.instagram_palette = palette.id;
      this.config.background_color = palette.background;
      this.config.accent_color = palette.accent;
      this.config.secondary_color = palette.secondary;
      this.config.text_color = palette.text;
      this.config.instagram_text_color_preset = "ig-grad-spectrum";
      this.config.instagram_gradient_enabled = true;
      this.config.instagram_gradient_preset = "ig-spectrum";
      this.config.instagram_gradient_from = palette.gradientFrom;
      this.config.instagram_gradient_to = palette.gradientTo;
      this.config.title_size = 104;
      this.config.subtitle_size = 38;
      this.config.cover_font_weight = 700;
      this.config.subtitle_font_weight = 500;
      this.config.subtitle_color_mode = "muted";
      this.config.title_line_height = 1.06;
      this.config.title_letter_spacing = 0;
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
      return;
    }
    if (style === "google-search") {
      const palette = GOOGLE_PALETTES[0];
      this.config.google_palette = palette.id;
      this.config.background_color = palette.background;
      this.config.accent_color = palette.accent;
      this.config.secondary_color = palette.secondary;
      this.config.text_color = palette.text;
      this.config.google_text_color_preset = "google-grad-logo";
      this.config.google_gradient_enabled = true;
      this.config.google_gradient_preset = "google-logo";
      this.config.google_gradient_from = palette.gradientFrom;
      this.config.google_gradient_to = palette.gradientTo;
      this.config.title_size = 108;
      this.config.subtitle_size = 38;
      this.config.cover_font_weight = 700;
      this.config.subtitle_font_weight = 500;
      this.config.subtitle_color_mode = "muted";
      this.config.title_line_height = 1.06;
      this.config.title_letter_spacing = 0;
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
      return;
    }
    if (style === "neon-grid") {
      this.config.background_color = "#020404";
      this.config.accent_color = "#08e6cf";
      this.config.secondary_color = "#ffffff";
      this.config.text_color = "#ffffff";
      const detail = this.getStyleDetailDefaults(style, this.config);
      this.config.detail_background_color = detail.background;
      this.config.detail_text_color = detail.text;
      this.config.detail_font_weight = detail.fontWeight;
      this.config.detail_line_height = detail.lineHeight;
      this.applyDetailTitleHighlightDefaults();
    }
  }

  addInput(label, key) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "text" });
    input.value = this.config[key] || "";
    input.addEventListener("change", () => {
      this.config[key] = input.value;
      if (this.config.xhs_style === "composition" && [
        "background_color", "text_color", "accent_color", "secondary_color",
        "detail_background_color", "detail_text_color"
      ].includes(key)) {
        this.config.composition_theme = "custom";
        this.config.composition_custom_colors = this.captureCompositionColors();
        this.renderControls();
      }
      this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addTextArea(label, key) {
    const field = this.createField(label);
    const input = field.createEl("textarea", { cls: "xhs-studio-textarea" });
    input.value = this.config[key] || "";
    input.addEventListener("change", () => {
      this.config[key] = input.value;
      this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addListArea(label, key) {
    const field = this.createField(label);
    const input = field.createEl("textarea", { cls: "xhs-studio-textarea" });
    input.value = this.normalizeList(this.config[key]).join("\n");
    input.addEventListener("input", () => {
      this.config[key] = this.normalizeList(input.value);
      this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  syncNeonModulesFromConfig(key) {
    if (!Array.isArray(this.config.xhs_modules)) return;
    const modules = new Map(this.config.xhs_modules.map((module) => [module.id, module]));
    if (this.config.xhs_style === "composition") {
      const contentKeys = { title: "composition-title", subtitle: "composition-subtitle", composition_description: "composition-description" };
      const target = modules.get(contentKeys[key]);
      if (target) target.text = this.toText(this.config[key]);
      if (key === "composition_image") {
        const image = modules.get("composition-image");
        if (image) image.src = this.config.composition_image;
        this.syncCompositionOverlayColors();
      }
      return;
    }
    const setText = (id, value) => {
      const module = modules.get(id);
      if (module && module.type === "text") module.text = this.toText(value);
    };
    const canSyncStyle = (module) => module && !module.manualStyle;
    const setFont = (id, value) => {
      const module = modules.get(id);
      if (module && module.type === "text" && canSyncStyle(module)) module.fontSize = value;
    };
    const setWeight = (id, value) => {
      const module = modules.get(id);
      if (module && module.type === "text" && canSyncStyle(module)) module.fontWeight = value;
    };
    const setLineHeight = (id, value) => {
      const module = modules.get(id);
      if (module && module.type === "text" && canSyncStyle(module)) module.lineHeight = value;
    };
    const setLetterSpacing = (id, value) => {
      const module = modules.get(id);
      if (module && module.type === "text" && canSyncStyle(module)) module.letterSpacing = value;
    };
    const setColor = (id, value) => {
      const module = modules.get(id);
      if (module && module.type === "text" && canSyncStyle(module)) module.color = value;
    };
    const setBackground = (id, value) => {
      const module = modules.get(id);
      if (module) module.background = value;
    };
    const layoutKeys = new Set(["title", "subtitle", "title_size", "title_font_weight", "subtitle_size", "subtitle_font_weight", "title_line_height", "title_letter_spacing"]);
    const normalizeTemplateLayout = () => {
      if (!layoutKeys.has(key)) return;
      const baseStyle = this.isCoverLayoutStyle(this.config.xhs_style) ? "google-search" : this.config.xhs_style;
      const layoutPresetId = this.isCoverLayoutStyle(this.config.xhs_style) ? this.config.xhs_style : this.config.cover_layout_preset;
      this.normalizeDefaultTemplateLayout(this.config.xhs_modules, baseStyle, layoutPresetId, this.config);
    };
    const textModuleIds = Array.from(modules.values())
      .filter((module) => module && module.type === "text")
      .map((module) => module.id);
    if (key === "cover_font_weight") textModuleIds.forEach((id) => setWeight(id, this.config.cover_font_weight));
    if (key === "cover_line_height") textModuleIds.forEach((id) => setLineHeight(id, this.config.cover_line_height));
    if (key === "cover_letter_spacing") textModuleIds.forEach((id) => setLetterSpacing(id, this.config.cover_letter_spacing));

    if (this.config.xhs_style === "neon-grid") {
      if (key === "title") setText("big-title", this.config.title);
      if (key === "subtitle") setText("subtitle", this.config.subtitle);
      if (key === "cta") setText("cta", this.config.cta);
      if (key === "brand") setText("footer", this.config.brand);
      if (key === "tags") setText("tags", this.normalizeList(this.config.tags).join("  "));
      if (key === "tags") setText("small-title", this.normalizeList(this.config.tags).slice(0, 2).join("\n"));
      if (key === "title_size") setFont("big-title", this.config.title_size);
      if (key === "title_font_weight") setWeight("big-title", this.config.title_font_weight);
      if (key === "subtitle_size") setFont("subtitle", this.config.subtitle_size);
      if (key === "body_size") {
        setFont("tags", this.config.body_size);
        setFont("small-title", Math.round(this.config.body_size * 0.78));
        setFont("cta", Math.round(this.config.body_size * 0.76));
        setFont("footer", Math.round(this.config.body_size * 0.72));
      }
      if (key === "text_color") {
        ["big-title", "tags", "small-title"].forEach((id) => setColor(id, this.config.text_color));
      }
      return;
    }

    if (this.config.xhs_style === "ai-course") {
      if (key === "title") setText("ai-title", this.config.title);
      if (key === "subtitle") {
        setText("ai-bubble-title", this.config.subtitle);
        setText("ai-proof", this.config.subtitle);
      }
      if (key === "tags") {
        const tags = this.normalizeList(this.config.tags);
        setText("ai-kicker", tags[0] || "");
        setText("ai-brand", tags[1] || "");
        setText("ai-bubble-sub", tags.slice(0, 3).join("  "));
        setText("ai-chips", tags.join("\n"));
        setText("ai-bottom", tags[0] || this.config.subtitle);
      }
      if (key === "title_size") setFont("ai-title", this.config.title_size);
      if (key === "title_font_weight") setWeight("ai-title", this.config.title_font_weight);
      if (key === "subtitle_size") {
        setFont("ai-bubble-title", this.config.subtitle_size);
        setFont("ai-bubble-sub", this.config.subtitle_size);
      }
      if (key === "body_size") {
        setFont("ai-proof", Math.max(18, Math.round(this.config.body_size * 0.88)));
        setFont("ai-chips", Math.max(20, Math.round(this.config.body_size * 1.18)));
      }
      if (key === "background_color") {
        const module = modules.get("ai-bg");
        if (module) module.background = "var(--xhs-bg)";
      }
      if (key === "accent_color") {
        const module = modules.get("ai-speech");
        if (module) module.background = "var(--xhs-accent)";
      }
      if (key === "secondary_color") {
        const module = modules.get("ai-frame");
        if (module) module.background = "var(--xhs-secondary)";
      }
      if (key === "text_color") {
        ["ai-title", "ai-kicker", "ai-brand", "ai-bubble-title", "ai-bubble-sub", "ai-chips", "ai-proof", "ai-bottom"].forEach((id) => setColor(id, this.config.text_color));
      }
      return;
    }

    if (this.config.xhs_style === "clean-gradient") {
      if (key === "title") setText("clean-title", this.config.title);
      if (key === "subtitle") setText("clean-subtitle", this.config.subtitle);
      if (key === "title_size") setFont("clean-title", this.config.title_size);
      if (key === "title_font_weight") setWeight("clean-title", this.config.title_font_weight);
      if (key === "subtitle_size") setFont("clean-subtitle", this.config.subtitle_size);
      if (key === "subtitle_font_weight") setWeight("clean-subtitle", this.config.subtitle_font_weight);
      if (key === "subtitle_color_mode") setColor("clean-subtitle", this.getCoverSubtitleTextColor());
      if (key === "title_line_height") {
        setLineHeight("clean-title", this.config.title_line_height);
        setLineHeight("clean-subtitle", this.config.title_line_height);
      }
      if (key === "title_letter_spacing") {
        setLetterSpacing("clean-title", this.config.title_letter_spacing);
        setLetterSpacing("clean-subtitle", this.config.title_letter_spacing);
      }
      if (key === "background_color") {
        const module = modules.get("clean-bg");
        if (module) module.background = "var(--xhs-bg)";
      }
      if (key === "text_color") setColor("clean-title", this.config.text_color);
      if (key === "text_color") setBackground("clean-rule", this.getCleanRuleColor());
      if (key === "accent_color" || key === "secondary_color") {
        setBackground("clean-bg", "var(--xhs-bg)");
      }
      normalizeTemplateLayout();
      return;
    }

    if (this.config.xhs_style === "huawei-product") {
      if (key === "title") setText("huawei-title", this.config.title);
      if (key === "subtitle") setText("huawei-subtitle", this.config.subtitle);
      if (key === "title_size") setFont("huawei-title", this.config.title_size);
      if (key === "title_font_weight") setWeight("huawei-title", this.config.title_font_weight);
      if (key === "subtitle_size") setFont("huawei-subtitle", this.config.subtitle_size);
      if (key === "subtitle_font_weight") setWeight("huawei-subtitle", this.config.subtitle_font_weight);
      if (key === "subtitle_color_mode") setColor("huawei-subtitle", this.getCoverSubtitleTextColor());
      if (key === "title_line_height") {
        setLineHeight("huawei-title", this.config.title_line_height);
        setLineHeight("huawei-subtitle", this.config.title_line_height);
      }
      if (key === "title_letter_spacing") {
        setLetterSpacing("huawei-title", this.config.title_letter_spacing);
        setLetterSpacing("huawei-subtitle", this.config.title_letter_spacing);
      }
      if (key === "background_color") {
        const module = modules.get("huawei-bg");
        if (module) module.background = "var(--xhs-bg)";
      }
      if (key === "text_color") setColor("huawei-title", this.config.text_color);
      if (key === "text_color" || key === "accent_color") setBackground("huawei-rule", this.getHuaweiRuleColor());
      if (key === "accent_color" || key === "secondary_color") {
        setBackground("huawei-bg", "var(--xhs-bg)");
      }
      normalizeTemplateLayout();
      return;
    }

    if (this.config.xhs_style === "instagram-gradient") {
      if (key === "title") setText("instagram-title", this.config.title);
      if (key === "subtitle") setText("instagram-subtitle", this.config.subtitle);
      if (key === "title_size") setFont("instagram-title", this.config.title_size);
      if (key === "title_font_weight") setWeight("instagram-title", this.config.title_font_weight);
      if (key === "subtitle_size") setFont("instagram-subtitle", this.config.subtitle_size);
      if (key === "subtitle_font_weight") setWeight("instagram-subtitle", this.config.subtitle_font_weight);
      if (key === "subtitle_color_mode") setColor("instagram-subtitle", this.getCoverSubtitleTextColor());
      if (key === "title_line_height") {
        setLineHeight("instagram-title", this.config.title_line_height);
        setLineHeight("instagram-subtitle", this.config.title_line_height);
      }
      if (key === "title_letter_spacing") {
        setLetterSpacing("instagram-title", this.config.title_letter_spacing);
        setLetterSpacing("instagram-subtitle", this.config.title_letter_spacing);
      }
      if (key === "background_color") {
        const module = modules.get("instagram-bg");
        if (module) module.background = "var(--xhs-bg)";
      }
      if (key === "text_color") setColor("instagram-title", this.config.text_color);
      if (key === "accent_color" || key === "secondary_color") {
        setBackground("instagram-bg", "var(--xhs-bg)");
        setBackground("instagram-rule", "var(--xhs-title-gradient-css)");
      }
      normalizeTemplateLayout();
    }

    if (this.config.xhs_style === "google-search" || this.isCoverLayoutStyle(this.config.xhs_style)) {
      if (key === "title") setText("google-title", this.config.title);
      if (key === "subtitle") setText("google-subtitle", this.config.subtitle);
      if (key === "title_size") setFont("google-title", this.config.title_size);
      if (key === "title_font_weight") setWeight("google-title", this.config.title_font_weight);
      if (key === "subtitle_size") setFont("google-subtitle", this.config.subtitle_size);
      if (key === "subtitle_font_weight") setWeight("google-subtitle", this.config.subtitle_font_weight);
      if (key === "subtitle_color_mode") setColor("google-subtitle", this.getCoverSubtitleTextColor());
      if (key === "title_line_height") {
        setLineHeight("google-title", this.config.title_line_height);
        setLineHeight("google-subtitle", 1.1);
      }
      if (key === "title_letter_spacing") {
        setLetterSpacing("google-title", this.config.title_letter_spacing);
        setLetterSpacing("google-subtitle", this.config.title_letter_spacing);
      }
      if (key === "background_color") {
        const module = modules.get("google-bg");
        if (module) module.background = "var(--xhs-bg)";
      }
      if (key === "text_color") setColor("google-title", this.config.text_color);
      if (key === "accent_color" || key === "secondary_color") {
        setBackground("google-bg", "var(--xhs-bg)");
        setBackground("google-rule", "var(--xhs-title-gradient-css)");
      }
      normalizeTemplateLayout();
    }
  }

  addColor(label, key) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-color", type: "color" });
    input.value = this.config[key] || "#000000";
    input.addEventListener("change", () => {
      this.config[key] = input.value;
      if (this.config.xhs_style === "composition" && [
        "background_color", "text_color", "accent_color", "secondary_color",
        "detail_background_color", "detail_text_color"
      ].includes(key)) {
        this.config.composition_theme = "custom";
        this.config.composition_custom_colors = this.captureCompositionColors();
      }
      if (key === "title_gradient_from" || key === "title_gradient_to") this.config.title_gradient_preset = "";
      if (key === "huawei_gradient_from" || key === "huawei_gradient_to") this.config.huawei_gradient_preset = "";
      if (key === "instagram_gradient_from" || key === "instagram_gradient_to") this.config.instagram_gradient_preset = "";
      if (key === "google_gradient_from" || key === "google_gradient_to") this.config.google_gradient_preset = "";
      if (key === "detail_title_gradient_from" || key === "detail_title_gradient_to") this.config.detail_title_color_mode = "gradient";
      this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      if (this.config.xhs_style === "composition") this.renderControls();
      void this.renderPreview();
    });
  }

  addCheckbox(label, key) {
    const field = this.createField(label);
    const input = field.createEl("input", { type: "checkbox" });
    input.checked = Boolean(this.config[key]);
    input.addEventListener("change", () => {
      this.config[key] = input.checked;
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addNumber(label, key) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "number" });
    input.value = this.config[key] == null ? "" : String(this.config[key]);
    input.addEventListener("input", () => {
      const bounds = this.getNumberBounds(key);
      this.config[key] = this.toNumber(input.value, DEFAULT_CONFIG[key], bounds.min, bounds.max);
      this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  addFloat(label, key) {
    const field = this.createField(label);
    const input = field.createEl("input", { cls: "xhs-studio-input", type: "number" });
    input.step = "0.01";
    input.value = this.config[key] == null ? "" : String(this.config[key]);
    input.addEventListener("input", () => {
      const bounds = this.getNumberBounds(key);
      this.config[key] = this.toFloat(input.value, DEFAULT_CONFIG[key], bounds.min, bounds.max);
      this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      void this.renderPreview();
    });
  }

  getNumberBounds(key) {
    if (this.config.xhs_style === "clean-gradient") {
      const cleanMap = {
        title_line_height: { min: 0.9, max: 1.35 },
        title_letter_spacing: { min: 0, max: 12 },
        title_size: { min: 42, max: 220 },
        title_font_weight: { min: 100, max: 1000 },
        subtitle_size: { min: 18, max: 120 },
        subtitle_font_weight: { min: 100, max: 1000 },
        detail_font_size: { min: 18, max: 72 },
        detail_line_height: { min: 1.25, max: 2.2 },
        detail_image_gap: { min: 0, max: 180 }
      };
      if (cleanMap[key]) return cleanMap[key];
    }
    if (this.config.xhs_style === "huawei-product") {
      const huaweiMap = {
        title_line_height: { min: 0.9, max: 1.35 },
        title_letter_spacing: { min: 0, max: 16 },
        title_size: { min: 42, max: 220 },
        title_font_weight: { min: 100, max: 1000 },
        subtitle_size: { min: 18, max: 120 },
        subtitle_font_weight: { min: 100, max: 1000 },
        detail_font_size: { min: 18, max: 72 },
        detail_line_height: { min: 1.25, max: 2.2 },
        detail_image_gap: { min: 0, max: 180 }
      };
      if (huaweiMap[key]) return huaweiMap[key];
    }
    if (this.config.xhs_style === "instagram-gradient") {
      const instagramMap = {
        title_line_height: { min: 0.9, max: 1.35 },
        title_letter_spacing: { min: 0, max: 12 },
        title_size: { min: 42, max: 220 },
        title_font_weight: { min: 100, max: 1000 },
        subtitle_size: { min: 18, max: 120 },
        subtitle_font_weight: { min: 100, max: 1000 },
        detail_font_size: { min: 18, max: 72 },
        detail_line_height: { min: 1.25, max: 2.2 },
        detail_image_gap: { min: 0, max: 180 }
      };
      if (instagramMap[key]) return instagramMap[key];
    }
    if (this.config.xhs_style === "google-search" || this.isCoverLayoutStyle(this.config.xhs_style)) {
      const googleMap = {
        title_line_height: { min: 0.9, max: 1.35 },
        title_letter_spacing: { min: 0, max: 12 },
        title_size: { min: 42, max: 220 },
        title_font_weight: { min: 100, max: 1000 },
        subtitle_size: { min: 18, max: 120 },
        subtitle_font_weight: { min: 100, max: 1000 },
        detail_font_size: { min: 18, max: 72 },
        detail_line_height: { min: 1.25, max: 2.2 },
        detail_image_gap: { min: 0, max: 180 }
      };
      if (googleMap[key]) return googleMap[key];
    }
    const map = {
      cover_font_weight: { min: 100, max: 1000 },
      title_font_weight: { min: 100, max: 1000 },
      cover_line_height: { min: 0.6, max: 3 },
      cover_letter_spacing: { min: -50, max: 100 },
      title_line_height: { min: 0.6, max: 2 },
      title_letter_spacing: { min: -20, max: 80 },
      border_width: { min: 0, max: 80 },
      detail_font_size: { min: 18, max: 96 },
      detail_font_weight: { min: 100, max: 1000 },
      detail_line_height: { min: 1.25, max: 3 },
      detail_letter_spacing: { min: 0, max: 100 },
      detail_image_gap: { min: 0, max: 240 }
    };
    return map[key] || { min: 10, max: 4096 };
  }

  addImagePath(label, key) {
    const field = this.createField(label);
    const row = field.createDiv({ cls: "xhs-studio-image-row" });
    const input = row.createEl("input", { cls: "xhs-studio-input", type: "text" });
    input.value = this.config[key] || "";
    input.addEventListener("input", () => {
      this.config[key] = input.value;
      if (key === "composition_image") this.syncNeonModulesFromConfig(key);
      this.persistDraft();
      void this.renderPreview();
    });

    const upload = row.createEl("input", { type: "file", cls: "xhs-studio-file" });
    upload.accept = "image/*";
    upload.addEventListener("change", async () => {
      const file = upload.files && upload.files[0];
      if (!file) return;
      const vaultPath = await this.importImageFile(file);
      this.config[key] = vaultPath;
      if (key === "composition_image") this.syncNeonModulesFromConfig(key);
      input.value = vaultPath;
      this.persistDraft();
      await this.renderPreview();
      new Notice(`${label}已上传`);
    });
  }

  createField(label, parent = this.controlsEl) {
    const field = parent.createDiv({ cls: "xhs-studio-field" });
    field.createDiv({ cls: "xhs-studio-label", text: label });
    return field;
  }

  persistDraft() {
    if (!this.activeFile) return;
    this.saveCurrentStyleModules();
    if (!this.plugin.settings.drafts || typeof this.plugin.settings.drafts !== "object") {
      this.plugin.settings.drafts = {};
    }
    this.plugin.settings.drafts[this.activeFile.path] = this.serializeConfig();
    window.clearTimeout(this.saveDraftTimer);
    this.saveDraftTimer = window.setTimeout(() => {
      void this.plugin.saveSettings();
    }, 250);
  }

  serializeConfig() {
    this.saveCurrentStyleModules();
    const keys = this.getFrontmatterSaveKeys();
    const output = {};
    keys.forEach((key) => {
      output[key] = this.config[key];
    });
    return output;
  }

  async importImageFile(file) {
    const active = this.activeFile || this.getActiveMarkdownFile();
    const baseName = active ? active.basename.replace(/[\\/:*?"<>|]/g, "-") : "note";
    const safeName = file.name.replace(/[\\/:*?"<>|]/g, "-") || "image.png";
    const folder = normalizePath(`${this.plugin.settings.assetFolder}/${baseName}`);
    const path = normalizePath(`${folder}/${Date.now()}-${safeName}`);
    await this.ensureFolder(folder);
    await this.app.vault.createBinary(path, await file.arrayBuffer());
    return path;
  }

  async ensureFolder(folder) {
    const parts = normalizePath(folder).split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await this.app.vault.adapter.exists(current))) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  async renderPreview() {
    const renderVersion = (this.previewRenderVersion || 0) + 1;
    this.previewRenderVersion = renderVersion;
    await this.ensureContentFontsLoaded();
    if (this.previewRenderVersion !== renderVersion) return;
    await this.ensureDetailPagination();
    if (this.previewRenderVersion !== renderVersion) return;
    const shellScrollTop = this.previewShellEl.scrollTop;
    const shellScrollLeft = this.previewShellEl.scrollLeft;
    const previousDetailRoot = this.previewCanvasEl?.querySelector(".xhs-detail-scroll-root.is-scrollable");
    const detailScrollTop = previousDetailRoot ? previousDetailRoot.scrollTop : 0;
    this.previewShellEl.querySelectorAll(".xhs-preview-pager, .xhs-canvas-toolbar, .xhs-preview-old").forEach((child) => child.remove());
    const previousChildren = Array.from(this.previewShellEl.children);
    const hasPreviousPreview = previousChildren.length > 0;
    if (hasPreviousPreview) {
      previousChildren.forEach((child) => child.addClass("xhs-preview-old"));
      this.previewShellEl.addClass("is-preview-updating");
    } else {
      this.previewShellEl.empty();
    }
    const page = this.pages[this.activePageIndex] || this.pages[0] || { kind: "cover" };

    if (!this.exportingAllPages && this.controlsEl.dataset.pageKind !== page.kind) this.renderControls();
    this.renderCanvasModuleToolbar(page);

    const wrapper = this.previewShellEl.createDiv({ cls: `xhs-studio-scale-wrap${page.scrollable ? " is-scrollable-detail-wrap" : ""}` });
    const card = wrapper.createDiv({
      cls: `xhs-card xhs-template-${this.config.xhs_style} xhs-page-${page.kind}${page.scrollable ? " is-scrollable-detail" : ""}`
    });
    card.style.width = `${this.config.xhs_width}px`;
    card.style.height = `${this.config.xhs_height}px`;
    card.style.setProperty("--xhs-accent", this.config.accent_color);
    card.style.setProperty("--xhs-accent-glow-core", this.mixHexColor(this.config.accent_color, "#ffffff", 0.62, 0.28));
    card.style.setProperty("--xhs-accent-glow-mid", this.hexToRgba(this.config.accent_color, 0.16));
    card.style.setProperty("--xhs-accent-glow-edge", this.hexToRgba(this.config.accent_color, 0.055));
    card.style.setProperty("--xhs-secondary", this.config.secondary_color);
    card.style.setProperty("--xhs-secondary-soft", this.hexToRgba(this.config.secondary_color, 0.18));
    card.style.setProperty("--xhs-secondary-mid", this.hexToRgba(this.config.secondary_color, 0.28));
    card.style.setProperty("--xhs-bg", this.config.background_color);
    card.style.setProperty("--xhs-text", this.config.text_color);
    card.style.setProperty("--xhs-title-gradient-from", this.getActiveGradientFrom());
    card.style.setProperty("--xhs-title-gradient-to", this.getActiveGradientTo());
    card.style.setProperty("--xhs-title-gradient-css", this.getGradientCssFromStops(this.getTitleGradientStops()));
    card.style.setProperty("--xhs-cover-initial", `"${this.escapeCssContent(this.getCoverTitleInitial())}"`);
    card.style.setProperty("--xhs-clean-glow-from", this.hexToRgba(this.config.accent_color || "#0071e3", 0.09));
    card.style.setProperty("--xhs-clean-glow-to", this.hexToRgba(this.config.secondary_color || "#f5f5f7", 0.075));
    card.style.setProperty("--xhs-clean-grid", this.isBrightColor(this.config.text_color || "#1d1d1f") ? "rgba(245,245,247,0.026)" : "rgba(29,29,31,0.024)");
    card.style.setProperty("--xhs-clean-wash-mid", this.hexToRgba(this.config.accent_color || "#0071e3", 0.012));
    card.style.setProperty("--xhs-clean-wash", this.hexToRgba(this.config.accent_color || "#0071e3", 0.026));
    card.style.setProperty("--xhs-huawei-start", this.isBrightColor(this.config.text_color || "#1f1f1f") ? "rgba(255,255,255,0.04)" : "#ffffff");
    card.style.setProperty("--xhs-huawei-top-wash", this.isBrightColor(this.config.text_color || "#1f1f1f") ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.22)");
    card.style.setProperty("--xhs-title-size", `${this.config.title_size}px`);
    card.style.setProperty("--xhs-subtitle-size", `${this.config.subtitle_size}px`);
    card.style.setProperty("--xhs-body-size", `${this.config.body_size}px`);
    card.style.setProperty("--xhs-detail-bg", this.config.detail_background_color);
    card.style.setProperty("--xhs-detail-text", this.getDetailTextColor());
    card.style.setProperty("--xhs-detail-title-highlight", this.config.detail_title_highlight_color);
    card.style.setProperty("--xhs-detail-title-gradient-css", this.getDetailTitleGradientCss());
    card.style.setProperty("--xhs-detail-font-size", `${this.config.detail_font_size}px`);
    card.style.setProperty("--xhs-detail-font-weight", String(this.config.detail_font_weight));
    card.style.setProperty("--xhs-detail-line-height", String(this.config.detail_line_height));
    card.style.setProperty("--xhs-detail-letter-spacing", `${this.config.detail_letter_spacing}px`);
    card.style.setProperty("--xhs-detail-image-gap", `${this.getDetailImageGap()}px`);
    card.style.setProperty("--xhs-title-letter-spacing", `${this.config.title_letter_spacing}px`);
    card.style.setProperty("--xhs-title-line-height", String(this.config.title_line_height));
    card.style.borderRadius = `${this.getCoverRadius()}px`;
    card.style.clipPath = `inset(0 round ${this.getCoverRadius()}px)`;
    card.style.setProperty("--xhs-border-radius", `${this.getCoverRadius()}px`);
    card.style.setProperty("--xhs-border-width", "0px");
    if (this.config.xhs_style === "nng-red-system" && page.kind === "cover") {
      card.style.background = this.config.background_color || '#ffffff';
    }

    const images = {
      background: await this.resolveImage(this.config.background_image),
      main: await this.resolveImage(this.config.main_image),
      icon: await this.resolveImage(this.config.icon_image),
      icon2: await this.resolveImage(this.config.icon2_image),
      logo: await this.resolveImage(this.config.logo_image)
    };
    if (this.previewRenderVersion !== renderVersion) { wrapper.remove(); return; }

    if (page.kind === "cover") {
      this.renderCover(card, images);
    } else {
      this.applyDetailPresentation(card);
      await this.renderDetail(card, page, images);
      this.refreshDetailImageAnchors(card);
      if (page.scrollable) this.updateScrollableDetailHeight(card);
      this.updateDetailOverflowNotice(card, page);
    }

    if (this.previewRenderVersion !== renderVersion) { wrapper.remove(); return; }
    this.previewCanvasEl = card;
    this.fitPreviewScale(wrapper, card);
    this.renderPreviewPager();
    const restorePreviewPosition = () => {
      if (this.previewRenderVersion !== renderVersion) return;
      this.previewShellEl.scrollTop = shellScrollTop;
      this.previewShellEl.scrollLeft = shellScrollLeft;
      const detailRoot = card.querySelector(".xhs-detail-scroll-root.is-scrollable");
      if (detailRoot) detailRoot.scrollTop = detailScrollTop;
    };
    restorePreviewPosition();
    window.requestAnimationFrame(() => {
      if (this.previewRenderVersion !== renderVersion) return;
      this.fitTextBlocks(card);
      if (page.scrollable) {
        this.refreshDetailImageAnchors(card);
        this.updateScrollableDetailHeight(card);
        window.requestAnimationFrame(() => {
          if (this.previewRenderVersion !== renderVersion) return;
          this.refreshDetailImageAnchors(card);
          this.updateScrollableDetailHeight(card);
          restorePreviewPosition();
        });
      }
      restorePreviewPosition();
      if (hasPreviousPreview) {
        window.requestAnimationFrame(() => {
          if (this.previewRenderVersion !== renderVersion) return;
          previousChildren.forEach((child) => child.remove());
          this.previewShellEl.removeClass("is-preview-updating");
          Array.from(this.previewShellEl.children).forEach((child) => child.removeClass("xhs-preview-old"));
          restorePreviewPosition();
        });
      }
    });
  }

  updateDetailOverflowNotice(card, page) {
    this.previewShellEl.querySelectorAll(".xhs-detail-overflow-notice").forEach(node => node.remove());
  }

  renderPreviewPager() {
    if (this.pages.length <= 1) return;
    const pager = this.previewShellEl.createDiv({ cls: "xhs-preview-pager" });
    const home = pager.createEl("button", { text: "首页", cls: "xhs-preview-nav-btn xhs-preview-home-btn", attr: { "aria-label": "跳转首页" } });
    home.disabled = this.activePageIndex === 0;
    home.addEventListener("click", () => this.gotoPreviewPage(0));
    const prev = pager.createEl("button", { text: "←", cls: "xhs-preview-nav-btn", attr: { type: "button", "aria-label": "上一页" } });
    prev.disabled = this.activePageIndex === 0;
    prev.addEventListener("click", () => this.gotoPreviewPage(this.activePageIndex - 1));

    pager.createDiv({
      cls: "xhs-preview-counter",
      text: `${this.activePageIndex + 1}/${this.pages.length}`
    });

    const next = pager.createEl("button", { text: "→", cls: "xhs-preview-nav-btn", attr: { type: "button", "aria-label": "下一页" } });
    next.disabled = this.activePageIndex >= this.pages.length - 1;
    next.addEventListener("click", () => this.gotoPreviewPage(this.activePageIndex + 1));
  }

  renderCanvasModuleToolbar(page) {
    if (page.kind !== "cover") return;
    const toolbar = this.previewShellEl.createDiv({ cls: "xhs-canvas-toolbar xhs-cover-style-toolbar" });
    const settings = toolbar.createDiv({ cls: "xhs-cover-toolbar-settings" });
    this.renderCoverBackdropTools(settings);
    const selected = this.getSelectedModule();
    if (!selected) {
      settings.createDiv({ cls: "xhs-canvas-toolbar-label", text: "选择模块后调整样式" });
      return;
    }

    const moduleTools = settings.createDiv({ cls: "xhs-cover-tool-group xhs-cover-module-tools" });
    moduleTools.createDiv({ cls: "xhs-canvas-toolbar-label", text: this.getModuleLabel(selected) });
    if (selected.type === "text") {
      if (selected.custom) {
        const color = moduleTools.createEl("input", { cls: "xhs-canvas-text-color", type: "color",
          attr: { "aria-label": "文字颜色" } });
        color.value = this.parseCoverHexColor(selected.color) || this.config.text_color;
        color.addEventListener("change", () => {
          const patch = { color: color.value };
          if (this.isPillLabelModule(selected)) {
            patch.borderColor = color.value;
            patch.borderMode = "solid";
          }
          this.updateSelectedModule(patch);
        });
        const text = moduleTools.createEl("input", { cls: "xhs-cover-label-text", type: "text", attr: { "aria-label": "模块文字" } });
        text.value = selected.text || "";
        text.addEventListener("change", () => this.updateSelectedModule({ text: text.value }));
      }
      const sizeTools = settings.createDiv({ cls: "xhs-cover-tool-group xhs-cover-stepper" });
      sizeTools.createDiv({ cls: "xhs-canvas-toolbar-label is-compact", text: "字号" });
      this.makeCanvasToolButton(sizeTools, "-", () => this.adjustSelectedNumber("fontSize", -4, 1, 400));
      if (selected.custom && this.isCenteredLabelModule(selected)) {
        const size = sizeTools.createEl("input", { cls: "xhs-cover-label-size", type: "number",
          attr: { min: "1", max: "400", step: "1", "aria-label": "标签字号" } });
        size.value = String(selected.fontSize);
        size.addEventListener("change", () => {
          if (!size.value || !Number.isFinite(Number(size.value))) {
            size.value = String(selected.fontSize);
            return;
          }
          this.updateSelectedModule({ fontSize: Math.max(1, Math.min(400, Math.round(Number(size.value)))) });
        });
      } else {
        sizeTools.createDiv({ cls: "xhs-canvas-toolbar-value", text: String(this.getCompositionFittedFontSize(selected)), attr: { "data-selected-style-value": "fontSize" } });
      }
      this.makeCanvasToolButton(sizeTools, "+", () => this.adjustSelectedNumber("fontSize", 4, 1, 400));
      const bold = Number(selected.fontWeight || 0) >= 700;
      const boldButton = this.makeCanvasToolButton(settings, "B", () => this.toggleSelectedFontWeight(selected), bold ? " is-active" : "");
      boldButton.setAttribute("aria-label", "加粗");
      boldButton.setAttribute("aria-pressed", String(bold));
      if (!this.isCenteredLabelModule(selected)) this.renderCanvasTextAlignTools(settings, selected);
      const leadingTools = settings.createDiv({ cls: "xhs-cover-tool-group xhs-cover-stepper" });
      leadingTools.createDiv({ cls: "xhs-canvas-toolbar-label is-compact", text: "行高" });
      this.makeCanvasToolButton(leadingTools, "-", () => this.adjustSelectedFloat("lineHeight", -0.02, 0.6, 3));
      leadingTools.createDiv({ cls: "xhs-canvas-toolbar-value", text: String(this.toFloat(selected.lineHeight, 1.1, 0.6, 3).toFixed(2)), attr: { "data-selected-style-value": "lineHeight" } });
      this.makeCanvasToolButton(leadingTools, "+", () => this.adjustSelectedFloat("lineHeight", 0.02, 0.6, 3));
      const trackingTools = settings.createDiv({ cls: "xhs-cover-tool-group xhs-cover-stepper" });
      trackingTools.createDiv({ cls: "xhs-canvas-toolbar-label is-compact", text: "字距" });
      this.makeCanvasToolButton(trackingTools, "-", () => this.adjustSelectedNumber("letterSpacing", -1, selected.coverTextRole ? 0 : -50, 100));
      trackingTools.createDiv({ cls: "xhs-canvas-toolbar-value", text: String(selected.letterSpacing || 0), attr: { "data-selected-style-value": "letterSpacing" } });
      this.makeCanvasToolButton(trackingTools, "+", () => this.adjustSelectedNumber("letterSpacing", 1, -50, 100));
    }
    if (this.isLineModule(selected)) {
      const lineTools = settings.createDiv({ cls: "xhs-cover-tool-group" });
      [["h", "粗细", 1, 200]].forEach(([key,label,min,max]) => {
        lineTools.createDiv({ cls: "xhs-canvas-toolbar-label is-compact", text: label });
        const input=lineTools.createEl("input",{cls:"xhs-canvas-line-number",type:"number",
          attr:{min:String(min),max:String(max),step:"1","aria-label":label,"data-line-parameter":key}});
        input.value=String(selected[key]);
        input.addEventListener("change",()=>{
          const value=Number(input.value);
          if(!input.value.trim() || !Number.isFinite(value)){input.value=String(selected[key]);return;}
          this.updateSelectedModule({[key]:Math.round(Math.max(min,Math.min(max,value)))});
        });
      });
      this.makeCanvasToolButton(lineTools,"1px",()=>this.updateSelectedModule({h:1}));
    }
    if (selected.type === "image") {
      const imageTools = settings.createDiv({ cls: "xhs-cover-tool-group" });
      if (selected.custom && selected.src) {
        const nodes = this.previewCanvasEl?.querySelectorAll("[data-source-ratio]");
        const image = Array.from(nodes || []).find(node => node.dataset.moduleId === selected.id);
        imageTools.createSpan({ cls: "xhs-canvas-toolbar-label", text: image ? "原图 " + image.dataset.sourceRatio : "",
          attr: { "data-custom-image-ratio": selected.id, "aria-live": "polite" } });
      }
      this.makeCanvasToolButton(imageTools, "更换图片", () => this.pickModuleImage(null, selected));
      if (!selected.custom && selected.template === "composition") {
        this.makeCanvasToolButton(imageTools, "恢复图片框", () => this.restoreCompositionImageBox(selected));
      }
    }
    const actionTools = toolbar.createDiv({ cls: "xhs-cover-tool-group xhs-cover-action-tools" });
    this.makeCanvasToolButton(actionTools, "复制", () => this.duplicateSelectedModule());
    this.makeCanvasToolButton(actionTools, "删除", () => this.deleteSelectedModule(), " xhs-cover-delete-tool");
  }

  renderDetailControls() {
    const sections = [
      ["detail_page_type", "详情页样式", [["modular", "模块化详情页"], ["document", "纯色文档型"]]],
      ["detail_font_size", "字号", this.getDetailStylePresets()[0][2].map(size => [size, String(size)])]
    ];
    for (const [key, label, options] of sections) {
      this.controlsEl.createEl("h3", { text: label });
      const group = this.controlsEl.createDiv({ cls: "xhs-unified-choice-grid", attr: { role: "group", "aria-label": label } });
      for (const [value, text] of options) {
        const button = group.createEl("button", { cls: "xhs-unified-choice", text,
          attr: { type: "button", "aria-pressed": String(this.config[key] === value) } });
        button.addEventListener("click", () => {
          if (this.config[key] === value) return;
          this.updateDetailStyle({ [key]: value });
          this.renderControls();
        });
      }
    }
  }

  renderDetailAccentControl(parent) {
    const row=parent.createDiv({cls:'xhs-cover-custom-color-row'});
    const picker=row.createEl('input',{cls:'xhs-cover-custom-swatch',attr:{type:'color','aria-label':'详情页强调色颜色预览'}});
    const input=row.createEl('input',{cls:'xhs-studio-input xhs-cover-custom-hex',attr:{type:'text','aria-label':'详情页强调色色值',placeholder:'#RRGGBB'}});
    const initial=this.parseCoverHexColor(this.config.detail_title_highlight_color) || VISUAL_RULES.accent;
    picker.value=initial;input.value=initial.toUpperCase();
    const apply=value=>{
      this.config.detail_title_highlight_color=value;
      this.persistDraft();
      if(this.previewCanvasEl?.classList.contains('xhs-page-detail')) {
        this.applyDetailPresentation(this.previewCanvasEl);
        this.previewCanvasEl.style.setProperty('--xhs-detail-title-highlight',value);
      }
    };
    const validate=()=>{
      const value=this.parseCoverHexColor(input.value);
      input.setCustomValidity(value?'':'请输入三位或六位 HEX 色值');
      input.setAttribute('aria-invalid',String(!value));
      if(value){picker.value=value;apply(value);}return value;
    };
    picker.addEventListener('input',()=>{input.value=picker.value.toUpperCase();input.setCustomValidity('');input.setAttribute('aria-invalid','false');apply(picker.value);});
    input.addEventListener('input',validate);
    input.addEventListener('blur',()=>{const value=validate();if(value)input.value=value.toUpperCase();});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const value=validate();if(value)input.value=value.toUpperCase();else input.reportValidity();}});
  }

  getDetailStylePresets(config = this.config) {
    const scale = (Number(config.xhs_width) || 1080) / 1080;
    return [
      ["detail_font_size", "字号", [VISUAL_RULES.body,VISUAL_RULES.bodyLarge].map(value => value * scale)],
      ["detail_font_weight", "字重", [VISUAL_RULES.bodyWeight]],
      ["detail_letter_spacing", "字间距", [0]],
      ["detail_line_height", "行间距", [VISUAL_RULES.bodyLeading]],
      ["detail_image_gap", "图片间距", [VISUAL_RULES.gutter * scale]]
    ];
  }

  adjustDetailNumber(key, delta, min, max) {
    const current = this.toNumber(this.config[key], DEFAULT_CONFIG[key] || 0, min, max);
    this.updateDetailStyle({ [key]: Math.min(max, Math.max(min, current + delta)) });
  }

  adjustDetailFloat(key, delta, min, max) {
    const current = this.toFloat(this.config[key], DEFAULT_CONFIG[key] || 1, min, max);
    this.updateDetailStyle({ [key]: Number(Math.min(max, Math.max(min, current + delta)).toFixed(2)) });
  }

  updateDetailStyle(patch) {
    Object.assign(this.config, patch);
    this.normalizeDetailDesignConfig();
    this.persistDraft();
    this.applyDetailStyleToPreview();
    void this.renderPreview();
  }

  applyDetailStyleToPreview() {
    const card = this.previewCanvasEl;
    if (!card || !card.classList.contains("xhs-page-detail")) return;
    this.applyDetailPresentation(card);
    card.style.setProperty("--xhs-detail-bg", this.config.detail_background_color);
    card.style.setProperty("--xhs-detail-text", this.getDetailTextColor());
    card.style.setProperty("--xhs-detail-title-highlight", this.config.detail_title_highlight_color);
    card.style.setProperty("--xhs-detail-title-gradient-css", this.getDetailTitleGradientCss());
    card.style.setProperty("--xhs-detail-font-size", `${this.config.detail_font_size}px`);
    card.style.setProperty("--xhs-detail-font-weight", String(this.config.detail_font_weight));
    card.style.setProperty("--xhs-detail-line-height", String(this.config.detail_line_height));
    card.style.setProperty("--xhs-detail-letter-spacing", `${this.config.detail_letter_spacing}px`);
    card.style.setProperty("--xhs-detail-image-gap", `${this.getDetailImageGap()}px`);
    card.style.setProperty("--xhs-title-gradient-css", this.getGradientCssFromStops(this.getTitleGradientStops()));
    card.style.setProperty("--xhs-title-gradient-from", this.getActiveGradientFrom());
    card.style.setProperty("--xhs-title-gradient-to", this.getActiveGradientTo());
    card.style.setProperty("--xhs-title-gradient-css", this.getGradientCssFromStops(this.getTitleGradientStops()));
    card.style.setProperty("--xhs-clean-glow-from", this.hexToRgba(this.config.accent_color || "#0071e3", 0.09));
    card.style.setProperty("--xhs-clean-glow-to", this.hexToRgba(this.config.secondary_color || "#f5f5f7", 0.075));
    card.style.setProperty("--xhs-clean-grid", this.isBrightColor(this.config.text_color || "#1d1d1f") ? "rgba(245,245,247,0.026)" : "rgba(29,29,31,0.024)");
    card.style.setProperty("--xhs-clean-wash-mid", this.hexToRgba(this.config.accent_color || "#0071e3", 0.012));
    card.style.setProperty("--xhs-clean-wash", this.hexToRgba(this.config.accent_color || "#0071e3", 0.026));
    card.style.setProperty("--xhs-huawei-start", this.isBrightColor(this.config.text_color || "#1f1f1f") ? "rgba(255,255,255,0.04)" : "#ffffff");
    card.style.setProperty("--xhs-huawei-top-wash", this.isBrightColor(this.config.text_color || "#1f1f1f") ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.22)");
    card.querySelectorAll(".xhs-detail-spacer").forEach((spacer) => {
      spacer.style.height = `${this.getDetailBlankLineHeight(Number(spacer.dataset.lines || 1))}px`;
    });
    window.requestAnimationFrame(() => {
      this.refreshDetailImageAnchors(card);
      this.updateScrollableDetailHeight(card);
    });
  }

  makeCanvasTextInput(parent, module) {
    const input = parent.createEl("input", {
      cls: "xhs-canvas-text-input",
      type: "text",
      attr: { placeholder: "输入文案" }
    });
    input.value = this.toText(module.text);
    input.addEventListener("input", () => {
      module.text = input.value;
      if (this.isCoverTitleModule(module)) this.config.title = module.text;
      if (this.isCoverSubtitleModule(module)) this.config.subtitle = module.text;
      this.persistDraft();
      if (this.isCoverTitleModule(module) || this.isCenteredLabelModule(module)) {
        void this.renderPreview();
      } else {
        this.updateModuleTextNode(module);
      }
    });
    input.addEventListener("pointerdown", (event) => event.stopPropagation());
    input.addEventListener("click", (event) => event.stopPropagation());
    return input;
  }

  updateModuleTextNode(module) {
    if (!this.previewCanvasEl || !module) return;
    const element = this.previewCanvasEl.querySelector(`[data-module-id="${module.id}"]`);
    if (!element) return;
    const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = this.toText(module.text);
    } else {
      element.insertBefore(document.createTextNode(this.toText(module.text)), element.firstChild);
    }
  }

  makeCanvasToolButton(parent, text, onClick, extraClass = "") {
    const button = parent.createEl("button", { cls: `xhs-canvas-tool-button${extraClass}`, text });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });
    return button;
  }

  renderCanvasTextAlignTools(parent, module) {
    const group = parent.createDiv({ cls: "xhs-canvas-align-group" });
    [
      ["left", "左"],
      ["center", "中"],
      ["right", "右"]
    ].forEach(([align, label]) => {
      this.makeCanvasToolButton(
        group,
        label,
        () => this.updateSelectedModule({ textAlign: align }),
        (module.textAlign || "left") === align ? " is-active" : ""
      );
    });
  }

  makeCanvasColorTool(parent, value, onInput) {
    const input = parent.createEl("input", { cls: "xhs-canvas-color", type: "color" });
    input.value = this.toColor(value, "#ffffff");
    input.addEventListener("change", () => onInput(input.value));
    return input;
  }

  adjustSelectedNumber(key, delta, min, max) {
    const selected = this.getSelectedModule();
    if (!selected) return;
    const current = key === "fontSize" ? this.getCompositionFittedFontSize(selected) : Number(selected[key] || 0);
    const next = Math.max(min, Math.min(max, current + delta));
    this.updateSelectedModule({ [key]: next });
  }

  adjustSelectedFloat(key, delta, min, max) {
    const selected = this.getSelectedModule();
    if (!selected) return;
    const fallback = key === "lineHeight" ? 1.1 : 0;
    const current = this.toFloat(selected[key], fallback, min, max);
    const next = Number(Math.max(min, Math.min(max, current + delta)).toFixed(2));
    this.updateSelectedModule({ [key]: next });
  }

  getImage3dMatrix(module) {
    const tiltX = this.toFloat(module && module.tiltX, 0, -45, 45);
    const tiltY = this.toFloat(module && module.tiltY, 0, -45, 45);
    const depth = this.toNumber(module && module.depth3d, 0, 0, 100);
    if (!tiltX && !tiltY && !depth) return null;
    const radX = tiltX * Math.PI / 180;
    const radY = tiltY * Math.PI / 180;
    const scaleX = Math.max(0.62, 1 - Math.abs(tiltY) * 0.005 - depth * 0.0012);
    const scaleY = Math.max(0.55, 1 - Math.abs(tiltX) * 0.006 - depth * 0.0016);
    const skewX = Math.tan(radY) * 0.28;
    const skewY = -Math.tan(radX) * 0.20;
    return { a: scaleX, b: skewY, c: skewX, d: scaleY };
  }

  getModuleTransformCss(module) {
    const parts = [];
    const matrix = module && module.type === "image" ? this.getImage3dMatrix(module) : null;
    const rotation = Number.parseFloat(module && module.rotation) || 0;
    if (rotation) parts.push(`rotate(${rotation}deg)`);
    if (matrix) parts.push(`matrix(${matrix.a.toFixed(4)}, ${matrix.b.toFixed(4)}, ${matrix.c.toFixed(4)}, ${matrix.d.toFixed(4)}, 0, 0)`);
    return parts.join(" ");
  }

  markModuleManualChange(module, patch = {}) {
    if (!module || typeof module !== "object") return;
    const keys = Object.keys(patch || {});
    const layoutKeys = new Set(["x", "y", "w", "h"]);
    const styleKeys = new Set([
      "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color",
      "background", "textAlign", "borderRadius", "borderWidth", "borderMode",
      "borderColor", "opacity", "rotation", "tiltX", "tiltY", "depth3d"
    ]);
    if (keys.some((key) => key === "x" || key === "y")) module.manualPosition = true;
    if (keys.some((key) => key === "w" || key === "h")) module.manualSize = true;
    if (keys.some((key) => layoutKeys.has(key))) module.manualLayout = true;
    if (keys.some((key) => styleKeys.has(key))) module.manualStyle = true;
    if(module.coverTextRole) {
      module.coverTextStyle={...this.normalizeCoverTextStyle(module.coverTextStyle),...this.normalizeCoverTextStyle(patch)};
    }
    if (keys.includes("fontSize") && module.template === "composition") module.manualFontSize = true;
  }

  updateSelectedModule(patch) {
    const selected = this.getSelectedModule();
    if (!selected) return;
    Object.assign(selected, patch);
    if(selected.id === "cover-structure-rule") {
      selected.w=Math.max(1,Math.min(selected.w,this.config.xhs_width-144));
      if(patch.h != null)this.config.cover_rule_thickness=this.toNumber(patch.h,2,1,200);
      selected.h=this.config.cover_rule_thickness || this.getContentDivider().width;
      selected.background=this.config.secondary_color;selected.opacity=1;selected.rotation=0;
      selected.x=Math.max(72,Math.min(selected.x,this.config.xhs_width-72-selected.w));
      selected.y=Math.max(72,Math.min(selected.y,this.config.xhs_height-72-selected.h));
    }
    this.syncCompositionContentFromModule(selected);
    this.markModuleManualChange(selected, patch);
    if (patch.fontSize != null) {
      if (this.isCoverTitleModule(selected)) this.config.title_size = selected.fontSize;
      if (this.isCoverSubtitleModule(selected)) this.config.subtitle_size = selected.fontSize;
    }
    if (patch.text != null) {
      if (this.isCoverTitleModule(selected)) this.config.title = selected.text;
      if (this.isCoverSubtitleModule(selected)) this.config.subtitle = selected.text;
    }
    if (patch.lineHeight != null && (this.isCoverTitleModule(selected) || this.isCoverSubtitleModule(selected))) {
      this.config.title_line_height = selected.lineHeight;
    }
    if (patch.letterSpacing != null && (this.isCoverTitleModule(selected) || this.isCoverSubtitleModule(selected))) {
      this.config.title_letter_spacing = selected.letterSpacing;
    }
    if (patch.fontWeight != null && this.isCoverSubtitleModule(selected)) {
      this.config.subtitle_font_weight = selected.fontWeight;
    }
    if (patch.fontWeight != null && this.isCoverTitleModule(selected)) {
      this.config.title_font_weight = selected.fontWeight;
    }
    this.ensureCenteredLabelModuleSize(selected);
    this.constrainCoverTextModuleToSafeArea(selected);
    this.fitTextModuleFrameToContent(selected);
    this.constrainCoverTextModuleToSafeArea(selected);
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  isCoverTitleModule(module) {
    if(module?.id==="swiss-title")return true;
    if (module?.id === "composition-title") return true;
    const className = module?.className || "";
    return [
      "xhs-module-neon-title",
      "xhs-module-clean-title",
      "xhs-module-huawei-title",
      "xhs-module-instagram-title",
      "xhs-module-google-title"
    ].some((titleClass) => className.includes(titleClass));
  }

  isCoverSubtitleModule(module) {
    if(module?.id==="swiss-subtitle")return true;
    if(module?.id==="composition-subtitle")return true;
    const className = module?.className || "";
    if (module?.template === "neon-grid" && module?.id === "subtitle") return true;
    return [
      "xhs-module-clean-subtitle",
      "xhs-module-huawei-subtitle",
      "xhs-module-instagram-subtitle",
      "xhs-module-google-subtitle"
    ].some((subtitleClass) => className.includes(subtitleClass));
  }

  isCoverSafeTextModule(module) {
    return this.isCoverTitleModule(module) || this.isCoverSubtitleModule(module)
      || (module?.template === "composition" && module.type === "text");
  }

  constrainCoverTextModuleToSafeArea(module) {
    if(this.constrainMagazineModule(module))return true;
    if(module?.id === "cover-structure-rule") {
      module.h=this.config.cover_rule_thickness || this.getContentDivider().width;
      module.background=this.config.secondary_color;
      module.opacity=1;module.rotation=0;
      module.w=Math.max(1,Math.min(module.w,this.config.xhs_width-144));
      module.x=Math.max(72,Math.min(module.x,this.config.xhs_width-72-module.w));
      module.y=Math.max(72,Math.min(module.y,this.config.xhs_height-72-module.h));
      return true;
    }
    if (!this.isCoverSafeTextModule(module)) return false;
    const canvasWidth = Math.max(1, Number(this.config.xhs_width) || DEFAULT_CONFIG.xhs_width);
    const margin = Math.min(COVER_TEXT_SAFE_MARGIN, Math.floor(canvasWidth / 4));
    const maxWidth = Math.max(1, canvasWidth - margin * 2);
    const previous = { x: module.x, y: module.y, w: module.w };
    module.w = Math.min(Math.max(module.coverTextRole ? 33 : 1, Number(module.w) || maxWidth), maxWidth);
    module.x = Math.max(margin, Math.min(Number(module.x) || margin, canvasWidth - margin - module.w));
    module.y = Math.max(margin, Number(module.y) || margin);
    if(module.coverTextRole && module.manualPosition)module.y=Math.max(margin,Math.min(module.y,(Number(this.config.xhs_height)||1440)-margin-(module.h||0)));
    return previous.x !== module.x || previous.y !== module.y || previous.w !== module.w;
  }

  toggleSelectedFontWeight(selected) {
    if (!selected || selected.type !== "text") return;
    this.updateSelectedModule({ fontWeight: this.getNextModuleFontWeight(selected.fontWeight) });
  }

  getNextModuleFontWeight(value) {
    const current = Number(value) || 900;
    if (current >= 900) return 700;
    if (current >= 700) return 500;
    if (current >= 500) return 300;
    return 950;
  }

  refreshCoverSelectionUi() {
    const card = this.previewCanvasEl;
    if (!card || !card.classList.contains("xhs-page-cover")) return false;
    card.querySelectorAll(".xhs-edit-module").forEach((element) => {
      element.classList.toggle("is-selected", element.getAttribute("data-module-id") === this.selectedModuleId);
    });
    this.previewShellEl.querySelectorAll(".xhs-canvas-toolbar").forEach((toolbar) => toolbar.remove());
    this.renderCanvasModuleToolbar(this.pages[this.activePageIndex] || { kind: "cover" });
    return true;
  }

  selectCoverModule(moduleId) {
    if (!moduleId) return;
    this.selectedModuleId = moduleId;
    if (!this.refreshCoverSelectionUi()) void this.renderPreview();
  }

  gotoPreviewPage(index) {
    if (this.exportingAllPages || !this.pages.length || !Number.isFinite(index)) return;
    const nextIndex = Math.min(Math.max(index, 0), this.pages.length - 1);
    if (nextIndex === this.activePageIndex) return;
    this.activePageIndex = nextIndex;
    if (this.activeFile) this.pageIndexByFile.set(this.activeFile.path, nextIndex);
    void this.renderPreview();
  }

  fitPreviewScale(wrapper, card) {
    window.cancelAnimationFrame(this.previewFitFrame);
    this.previewFitFrame=window.requestAnimationFrame(() => {
      if(!wrapper.isConnected || !this.previewShellEl?.isConnected)return;
      const shell=this.previewShellEl,style=getComputedStyle(shell);
      const horizontal=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
      const vertical=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
      const toolbar = shell.querySelector(":scope > .xhs-cover-style-toolbar");
      const toolbarSpace = parseFloat(style.getPropertyValue("--xhs-preview-toolbar-space")) || 0;
      const toolbarHeight = toolbar ? toolbar.offsetHeight + (parseFloat(getComputedStyle(toolbar).marginBottom) || 0) : 0;
      const pagerSpace = this.pages.length > 1 ? parseFloat(style.getPropertyValue("--xhs-preview-pager-space")) || 0 : 0;
      const occupied = Math.max(toolbarSpace, toolbarHeight) + pagerSpace;
      const availableWidth = Math.max(1, shell.clientWidth - horizontal);
      const availableHeight = Math.max(1, shell.clientHeight - vertical - occupied);
      const scale = Math.min(0.62, availableWidth / this.config.xhs_width, availableHeight / this.config.xhs_height);
      wrapper.style.width = `${this.config.xhs_width * scale}px`;
      wrapper.style.height = `${this.config.xhs_height * scale}px`;
      card.style.transform = `scale(${scale})`;
    });
  }

  updateScrollableDetailHeight(card) {
    if (!card || !card.classList.contains("is-scrollable-detail")) return;
    card.style.height = `${this.config.xhs_height}px`;
    const content = card.querySelector(".xhs-detail-markdown");
    const imageLayer = card.querySelector(".xhs-detail-image-layer");
    const root = card.querySelector(".xhs-detail-scroll-root");
    const viewportHeight = root ? root.clientHeight : Math.max(1, this.config.xhs_height - 152);
    const contentBottom = content ? this.getDetailContentHeight(content) : viewportHeight;
    let imageBottom = 0;
    if (imageLayer) {
      imageLayer.querySelectorAll(".xhs-detail-image-wrap").forEach((wrap) => {
        imageBottom = Math.max(imageBottom, wrap.offsetTop + wrap.offsetHeight);
      });
    }
    const scrollHeight = Math.max(viewportHeight, Math.ceil(contentBottom), Math.ceil(imageBottom));
    if (imageLayer) imageLayer.style.height = `${scrollHeight}px`;
  }

  getDetailContentHeight(content) {
    let bottom = content.scrollHeight || 0;
    Array.from(content.children).forEach((child) => {
      const style = window.getComputedStyle(child);
      const marginBottom = Number.parseFloat(style.marginBottom) || 0;
      bottom = Math.max(bottom, child.offsetTop + child.offsetHeight + marginBottom);
    });
    return bottom;
  }

  renderCover(card, images) {
    if(this.config.cover_text_layout_version===1){this.layoutCoverText();card.classList.add("xhs-cover-text-grid");}
    if(this.config.xhs_style==="neon-grid")card.classList.add("xhs-magazine-reference");
    if(this.config.swiss_cover_version===1) {
      card.classList.add("xhs-swiss-cover");card.style.background=this.config.background_color;
      this.config.xhs_modules.forEach(module=>this.renderEditableModule(card,module,images));return;
    }
    const renderers = {
      "neon-grid": this.renderNeonCover,
      "clean-gradient": this.renderCleanGradientCover,
      "huawei-product": this.renderHuaweiProductCover,
      "instagram-gradient": this.renderInstagramGradientCover,
      "google-search": this.renderGoogleSearchCover
    };
    if (this.config.xhs_style === "composition") {
      this.renderCompositionCover(card, images);
      this.reflowCoverTextGroups(card);
      this.renderTransparentCoverTitle(card);
      return;
    }
    const renderer = this.isCoverLayoutStyle(this.config.xhs_style)
      ? this.renderGoogleSearchCover
      : (renderers[this.config.xhs_style] || this.renderNeonCover);
    renderer.call(this, card, images);
    this.reflowCoverTextGroups(card);
    this.renderTransparentCoverTitle(card);
    if(this.config.xhs_style==='nng-red-system')this.renderComparisonCoverTools(card);
  }

  renderComparisonCoverTools(card) {
    const tools=card.createDiv({cls:'xhs-cover-comparison-tools'});
    const button=tools.createEl('button',{cls:'xhs-comparison-swap',attr:{type:'button','aria-label':'交换上下图片'}});
    if(typeof setIcon==='function')setIcon(button,'arrow-up-down');else button.textContent='↕';
    for(const name of ['pointerdown','dblclick'])button.addEventListener(name,event=>{event.preventDefault();event.stopPropagation();});
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();button.disabled=true;
      try {
        const top=this.config.xhs_modules.find(m=>m.id==='comparison-top'),bottom=this.config.xhs_modules.find(m=>m.id==='comparison-bottom');
        [top.src,bottom.src]=[bottom.src,top.src];
        this.persistDraft();this.renderControls();await this.renderPreview();
      }finally{button.disabled=false;}
    });
  }

  reflowCoverTextGroups(card) {
    if(this.config.cover_text_layout_version===1)return;
    if(this.config.cover_visual_version!==2)return;
    const title=this.config.xhs_modules.find(module=>this.isCoverTitleModule(module));
    const subtitle=this.config.xhs_modules.find(module=>this.isCoverSubtitleModule(module));
    const description=this.config.xhs_modules.find(module=>["cover-description","composition-description"].includes(module.id));
    const elements=new Map(Array.from(card.querySelectorAll("[data-module-id]"),element=>[element.dataset.moduleId,element]));
    for(const [a,b] of [[title,subtitle],[subtitle,description]]) {
      if(!a || !b || !a.text || !b.text || b.manualStyle || b.y<a.y)continue;
      if(a.x>=b.x+b.w || a.x+a.w<=b.x)continue;
      const height=Math.max(a.h,elements.get(a.id)?.scrollHeight || 0);
      const nextY=a.y+height+(b===subtitle?24:32);
      if(b.y<nextY){b.y=nextY;const element=elements.get(b.id);if(element)element.style.top=`${nextY}px`;}
    }
  }

  renderNeonCover(card, images) {
    if(!card.classList.contains("xhs-magazine-reference")) {
      this.addImage(card, images.background, "xhs-bg-img");
      this.addImage(card, images.main, "xhs-neon-main-img");
    }
    if (this.config.xhs_modules.length === 0) {
      this.config.xhs_modules = this.createDefaultModulesForStyle(this.config.xhs_style, this.config);
    }
    this.alignNeonFooterModules(this.config);
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = "big-title";
    }
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  renderCleanGradientCover(card, images) {
    this.addImage(card, images.background, "xhs-bg-img");
    if (this.config.xhs_modules.length === 0) {
      this.config.xhs_modules = this.createDefaultModulesForStyle(this.config.xhs_style, this.config);
    }
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = "clean-title";
    }
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  renderHuaweiProductCover(card, images) {
    this.addImage(card, images.background, "xhs-bg-img");
    if (this.config.xhs_modules.length === 0) {
      this.config.xhs_modules = this.createDefaultModulesForStyle(this.config.xhs_style, this.config);
    }
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = "huawei-title";
    }
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  renderInstagramGradientCover(card, images) {
    this.addImage(card, images.background, "xhs-bg-img");
    if (this.config.xhs_modules.length === 0) {
      this.config.xhs_modules = this.createDefaultModulesForStyle(this.config.xhs_style, this.config);
    }
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = "instagram-title";
    }
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  renderGoogleSearchCover(card, images) {
    this.addImage(card, images.background, "xhs-bg-img");
    if (this.config.xhs_modules.length === 0) {
      this.config.xhs_modules = this.createDefaultModulesForStyle(this.config.xhs_style, this.config);
    }
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = this.getDefaultSelectedModuleId(this.config.xhs_style);
    }
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  renderCompositionCover(card, images) {
    if (!this.config.xhs_modules.length
      && !Array.isArray(this.config.composition_modules_by_layout?.[this.config.composition_variant])) {
      this.config.xhs_modules = this.loadModulesForStyle("composition", this.config);
      this.restoreCompositionContentFromModules();
    }
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = this.config.xhs_modules.some((module) => module.id === "composition-title")
        ? "composition-title" : this.config.xhs_modules[0].id;
    }
    this.syncCompositionOverlayColors();
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  isFixedCoverImage(module) {
    return module?.type === "image" && !module.custom && !["logo", "icon2", "background"].includes(module.role);
  }

  normalizeCoverImageFrame(module) {
    if(module?.type === "image")module.borderRadius=0;
    if(this.config.cover_visual_version===2 && !module?.custom)return;
    if(module?.swissCover)return;
    if (module?.template === "composition" && this.config.composition_variant === "headline-band" && !module.manualLayout) {
      const imageBottom = 460 + this.config.xhs_width * 3 / 4;
      if (module.id === "composition-block") module.y = Math.max(Number(module.y), imageBottom + 28);
      if (module.id === "composition-description") module.y = Math.max(Number(module.y), imageBottom + 56);
    }
    if (module?.id === "composition-block" && this.config.composition_variant === "solid-poster") {
      delete module.aspectRatio;
      if (/^rgba\(13,\s*17,\s*23,\s*0\.7\)$/.test(module.background || "")) module.background = "rgba(13, 17, 23, 0.45)";
      return;
    }
    if (!this.isFixedCoverImage(module)) return;
    if (module.template === "composition" && this.config.composition_variant === "center-banner") {
      module.h = Number(module.w);
      module.aspectRatio = 1;
      return;
    }
    if (module.template === "composition" && this.config.composition_variant === "headline-band" && module.id === "composition-image" && !module.manualSize) {
      module.w = this.config.xhs_width;
      module.h = module.w * 3 / 4;
      module.aspectRatio = 4 / 3;
      return;
    }
    const width = Number(module.w);
    const height = Number(module.h);
    if (!(width > 0 && height > 0)) return;
    const ratio = width < height ? 3 / 4 : 4 / 3;
    // Fit inside the existing frame without moving text or enlarging its footprint.
    module.w = Math.min(width, height * ratio);
    module.h = module.w / ratio;
    module.aspectRatio = ratio;
  }

  getImageFrameRatio(module, exact = false) {
    const ratio=Number(module?.w)/Number(module?.h);
    if(!Number.isFinite(ratio) || Number(module?.w)<=0 || Number(module?.h)<=0 || ratio<=0)return '';
    // Use actual frame geometry, including fractional layout dimensions.
    for(let denominator=1;!exact && denominator<=1000;denominator++) {
      const numerator=Math.round(ratio*denominator);
      if(numerator>0 && Math.abs(numerator/denominator-ratio)<1e-8)return `${numerator}:${denominator}`;
    }
    let width = Math.round(Number(module?.w) || 0);
    let height = Math.round(Number(module?.h) || 0);
    if (width <= 0 || height <= 0) return "";
    let a = width;
    let b = height;
    while (b) [a, b] = [b, a % b];
    return `${width / a}:${height / a}`;
  }

  renderEditableModule(card, module, images = {}) {
    if(module.coverTextRole && !String(module.text || "").trim())return;
    if (module.id === "magazine-subtitle-panel" && module.background === "transparent") return;
    this.normalizeCoverImageFrame(module);
    const element = card.createDiv({
      cls: `xhs-edit-module ${module.className || ""}${module.id === this.selectedModuleId ? " is-selected" : ""}`,
      attr: { "data-module-id": module.id }
    });
    this.applyModuleStyle(element, module);

    if (module.type === "text") {
      if (this.isCoverTitleModule(module)) {
        this.renderHighlightedTitleElement(element, module);
      } else {
        element.textContent = module.text || "";
      }
    }

    if (module.type === "image") {
      const sourcePath = module.src || (module.template === "composition" ? "" : (module.role === "main" ? this.config.main_image : ""));
      if ((module.className || "").includes("xhs-module-cover-layout-image") && !sourcePath) {
        element.remove();
        return null;
      }
      element.addEventListener("dblclick", (event) => this.pickModuleImage(event, module));
      const renderImage = (src) => {
        if (!src || !element.isConnected) return;
        element.querySelectorAll("img").forEach((img) => img.remove());
        element.querySelectorAll(".xhs-module-image-placeholder").forEach((placeholder) => placeholder.remove());
        const img = element.createEl("img", {
          cls: "xhs-module-img",
          attr: { src, alt: "" }
        });
        img.style.objectFit = module.objectFit || "contain";
        img.style.borderRadius = `${module.borderRadius || 0}px`;
      };
      const renderPlaceholder = () => {
        if (element.querySelector("img") || element.querySelector(".xhs-module-image-placeholder")) return;
        const ratio = module.custom ? "" : this.getImageFrameRatio(module);
        const compact = module.w < 320 || module.h < 240;
        const placeholder = element.createDiv({ cls: `xhs-module-image-placeholder${ratio ? " has-ratio" : ""}${compact ? " is-compact" : ""}${module.h < 120 ? " is-mini" : ""}` });
        if (typeof setIcon === "function") setIcon(placeholder.createSpan({ cls: "xhs-module-image-placeholder-icon" }), "image-up");
        placeholder.createSpan({ cls: "xhs-module-image-placeholder-title", text: "双击上传图片" });
        placeholder.createSpan({ cls: "xhs-module-image-placeholder-ratio", text: ratio ? `区域 ${ratio} · 原比例完整显示` : "原比例完整显示" });
        placeholder.addEventListener("dblclick", (event) => this.pickModuleImage(event, module));
      };
      if (sourcePath) {
        void this.resolveImage(sourcePath).then(async (src) => {
          if (src) {
            const loadedImage = await this.loadImage(src).catch(() => null);
            if (loadedImage) {
              module.rawLogo = this.shouldRenderRawLogoImage(module, sourcePath, src, loadedImage);
              element.classList.toggle("is-raw-logo", Boolean(module.rawLogo));
            }
            if (!element.isConnected || (module.src && module.src !== sourcePath)) return;
            await this.fitImageModuleToSource(module, src, element, !module.aspectRatio, loadedImage);
            if (module.custom && loadedImage) {
              const ratio = this.getImageFrameRatio({ w: loadedImage.naturalWidth || loadedImage.width,
                h: loadedImage.naturalHeight || loadedImage.height }, true);
              element.dataset.sourceRatio = ratio;
              const label = this.previewShellEl?.querySelector("[data-custom-image-ratio]");
              if (label?.dataset.customImageRatio === module.id) label.textContent = ratio ? "原图 " + ratio : "";
            }
            renderImage(src);
          }
          else renderPlaceholder();
        });
      } else {
        renderPlaceholder();
      }
    }

    if (!module.locked) {
      if (!this.isMagazineSubtitle(module)) {
        const handle = element.createDiv({ cls: "xhs-module-resize-handle" });
        handle.addEventListener("pointerdown", (event) => this.startModuleResize(event, module, element));
      }
      if (module.type === "image") {
        const rotateHandle = element.createDiv({ cls: "xhs-module-rotate-handle" });
        rotateHandle.setAttribute("aria-label", "拖动旋转，双击回正");
        rotateHandle.addEventListener("pointerdown", (event) => this.startModuleRotate(event, module, element, rotateHandle));
        rotateHandle.addEventListener("dblclick", (event) => {
          event.preventDefault();event.stopPropagation();
          module.rotation=0;
          this.markModuleManualChange(module,{rotation:0});
          element.style.transform=this.getModuleTransformCss(module);
          this.persistDraft();this.renderControls();
        });
      }
      element.addEventListener("pointerdown", (event) => this.startModuleDrag(event, module, element));
    }

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.selectCoverModule(module.id);
    });

    return element;
  }

  shouldRenderRawLogoImage(module, sourcePath = "", src = "", image = null) {
    if (!module || module.type !== "image") return false;
    if (module.role === "main") return false;
    const text = `${module.role || ""} ${module.name || ""} ${module.src || ""} ${sourcePath || ""} ${src || ""}`.toLowerCase();
    const logoLike = module.role === "logo" || /logo|商标|标志|transparent|透明/.test(text);
    const transparentFormat = /\.(png|webp|svg)(?:[?#]|$)/i.test(text) || /^data:image\/(?:png|webp|svg\+xml)/i.test(src || "");
    return (logoLike || (module.custom && transparentFormat)) && this.imageLooksTransparent(image);
  }

  imageLooksTransparent(image) {
    if (!image) return false;
    const width = image.naturalWidth || image.width || 0;
    const height = image.naturalHeight || image.height || 0;
    if (!width || !height) return false;
    if (/svg/i.test(image.currentSrc || image.src || "")) return true;
    try {
      const canvas = document.createElement("canvas");
      const sampleWidth = Math.min(80, width);
      const sampleHeight = Math.min(80, height);
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      for (let index = 3; index < data.length; index += 4) {
        if (data[index] < 245) return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  applyModuleStyle(element, module) {
    if(!module.swissCover && !module.coverTextRole) {
      this.ensureCenteredLabelModuleSize(module);
      this.constrainCoverTextModuleToSafeArea(module);
      this.fitTextModuleFrameToContent(module);
      this.constrainCoverTextModuleToSafeArea(module);
    }
    element.style.left = `${module.x}px`;
    element.style.top = `${module.y}px`;
    element.style.width = `${module.w}px`;
    element.style.height = `${module.h}px`;
    element.style.opacity = "1";
    element.style.borderRadius = `${module.borderRadius || 0}px`;
    element.style.transform = this.getModuleTransformCss(module);
    element.style.transformOrigin = "center center";
    if (module.layoutPreset && module.type === "shape" && (module.className || "").includes("xhs-module-cover-layout-bg") && this.getCoverLayoutPreset(module.layoutPreset).id !== "none") {
      element.style.background = this.getCoverLayoutBackgroundCss(module.layoutPreset);
      element.style.overflow = "hidden";
      element.style.backgroundSize = "";
    } else if (module.className === "xhs-module-glow") {
      const glowColor = this.getModuleGlowColor(module);
      element.style.setProperty("--xhs-module-glow-color", glowColor);
      element.style.setProperty("--xhs-module-glow-core", this.mixHexColor(glowColor, "#ffffff", 0.62, 0.28));
      element.style.setProperty("--xhs-module-glow-mid", this.hexToRgba(glowColor, 0.16));
      element.style.setProperty("--xhs-module-glow-edge", this.hexToRgba(glowColor, 0.055));
      element.style.background = "transparent";
      element.style.overflow = "visible";
    } else if (module.background && !this.moduleUsesCssBackground(module)) {
      element.style.background = module.background;
    }

    if (this.isPillLabelModule(module)) {
      const borderWidth = Math.max(1, Number(module.borderWidth) || 2);
      const borderMode = module.borderMode || "gradient";
      element.style.background = "transparent";
      element.style.border = `${borderWidth}px solid ${borderMode === "solid" ? this.resolveCssModuleColor(module.borderColor || module.color || "var(--xhs-accent)") : "transparent"}`;
      element.style.setProperty("--xhs-pill-border-width", `${borderWidth}px`);
      element.style.setProperty("--xhs-pill-border-color", this.resolveCssModuleColor(module.borderColor || "var(--xhs-accent)"));
      if (borderMode === "gradient") {
        const border = this.createPillLabelBorderCanvas(module, borderWidth);
        if (border) {
          element.style.background = `url("${border.toDataURL()}") center / 100% 100% no-repeat border-box`;
        }
      }
    }

    if (module.className === "xhs-module-google-subtitle" && !module.coverTextRole) {
      element.style.border = "1px solid rgba(218,220,224,0.95)";
      element.style.boxShadow = "0 2px 8px rgba(60,64,67,0.08), 0 12px 28px rgba(60,64,67,0.08)";
    }
    if ((module.className || "").includes("xhs-module-cover-layout-subtitle")) {
      element.style.border = "0";
      element.style.boxShadow = "none";
      element.style.background = module.background || "transparent";
      element.style.padding = "0";
      element.style.borderRadius = `${module.borderRadius || 0}px`;
    }

    if (module.type === "text") {
      const padding = this.getModulePadding(module);
      element.style.fontSize = `${this.getCompositionFittedFontSize(module)}px`;
      element.style.fontWeight = String(module.fontWeight);
      element.style.lineHeight = String(module.lineHeight);
      element.style.letterSpacing = `${module.letterSpacing}px`;
      element.style.color = module.color || "#ffffff";
      if (this.isCoverTitleModule(module) || (module.template === "ai-course" && module.id === "ai-title")) {
        this.applyCoverTextOutlineStyle(element, "title", module.color);
      }
      if (this.isCoverSubtitleModule(module) || (module.template === "ai-course" && module.id === "ai-bubble-title")) {
        this.applyCoverTextOutlineStyle(element, "subtitle", module.color);
      }
      element.style.fontFamily = this.getCanvasFontFamilyForModule(module);
      element.style.textAlign = this.isCenteredLabelModule(module) ? "center" : (module.textAlign || "left");
      if (this.isCoverSafeTextModule(module)) {
        element.style.whiteSpace = "pre-wrap";
        element.style.wordBreak = "normal";
        element.style.overflowWrap = "anywhere";
        element.style.overflow = "visible";
      } else if (module.template === "composition") {
        element.style.whiteSpace = this.shouldPreserveManualTextLines(module) ? "pre" : "pre-wrap";
        element.style.wordBreak = "normal";
        element.style.overflowWrap = "anywhere";
        element.style.overflow = "hidden";
      } else if (this.shouldPreserveManualTextLines(module)) {
        element.style.whiteSpace = "pre";
        element.style.wordBreak = "normal";
        element.style.overflowWrap = "normal";
        element.style.overflow = "visible";
      }
      element.style.setProperty("--xhs-label-pad-x", `${padding.x}px`);
      element.style.setProperty("--xhs-label-pad-y", `${padding.y}px`);
      if (this.isVerticalCenterTextModule(module)) {
        element.style.alignItems = "center";
      }
      if (this.isCenteredLabelModule(module)) {
        element.style.alignItems = "center";
        element.style.justifyContent = "center";
        element.style.whiteSpace = this.isCoverSubtitleModule(module) ? "pre-wrap" : "pre";
      }
    }

    if (module.type === "image") {
      element.style.background = module.background || "transparent";
      element.style.overflow = module.swissCover || module.className === "xhs-module-composition-image"
        ? "hidden" : "visible";
      element.style.setProperty("--xhs-image-radius", `${module.borderRadius || 0}px`);
    }
    if(module.swissCover && module.type==="text") {
      element.style.whiteSpace="pre";element.style.overflowWrap="normal";
      element.style.overflow="visible";element.style.padding="0";
    }
    if(this.config.cover_visual_version===2 && module.type==="text") {
      element.style.whiteSpace="pre-wrap";element.style.wordBreak="normal";
      element.style.overflowWrap="anywhere";element.style.overflow="visible";
      if (module.className === "xhs-module-footer") {
        element.style.whiteSpace = "pre";
        element.style.overflowWrap = "normal";
      }
    }
    if(module.coverTextRole) {
      element.classList.add("xhs-cover-structured-text");element.dataset.coverTextRole=module.coverTextRole;
      element.style.setProperty("--xhs-cover-text-align",module.textAlign);
      element.style.setProperty("--xhs-cover-text-tracking",`${module.letterSpacing}px`);
      element.style.setProperty("--xhs-cover-frame-padding",`${this.getCoverTextFramePadding(module)}px`);
      element.style.padding=`${this.getCoverTextFramePadding(module)}px`;element.style.boxSizing="border-box";element.style.display="block";
      element.style.whiteSpace = "pre-wrap";
      element.style.wordBreak = "normal";
      element.style.overflowWrap = module.coverTextRole === "subtitle"
        || (module.coverTextRole === "title" && this.config.xhs_style !== "composition")
        ? "anywhere" : "normal";
      element.style.textWrap=module.coverTextRole==="title"?"balance":"wrap";
      element.style.textAlignLast=module.textAlign || 'left';
      element.style.textShadow="none";element.style.webkitTextStroke="0";
    }
  }

  moduleUsesCssBackground(module) {
    return ["xhs-module-corner-frame", "xhs-module-glass-panel", "xhs-module-soft-shadow",
      "xhs-module-light-spot", "xhs-module-dashed-line", "xhs-module-speech-bubble"].includes(module.className);
  }

  getCoverLayoutBackgroundCss(presetId) {
    return this.isCoverLayoutStyle(presetId) ? this.config.background_color || "#ffffff" : "transparent";
  }

  renderHighlightedTitleElement(element, module) {
    element.empty();
    const lines = this.parseHighlightedTitleSegments(module.text || "");
    lines.forEach((segments) => {
      const line = element.createDiv({ cls: "xhs-clean-title-line" });
      segments.forEach((segment) => {
        this.splitTitleSegmentByArtScript(segment).forEach((run) => {
          const classes = [];
          if (this.shouldUseTitleGradient(segment)) {
            classes.push("xhs-clean-title-gradient");
          } else if (segment.highlight) {
            classes.push("xhs-clean-title-highlight");
          }
          const artStyle = this.getTitleArtStyleForScript(run.script);
          if (artStyle) classes.push("xhs-title-art-text");
          const span = line.createSpan({ cls: classes.join(" "), text: run.text });
          if (segment.highlight && (this.config.cover_highlight_color || (!this.isTitleGradientEnabled() && this.config.cover_editor_version===1))) {
            span.style.color=this.config.cover_highlight_color || this.config.cover_title_color || module.color;
          }
          if (segment.highlight) this.applyCoverTextOutlineStyle(span, "highlight", this.config.accent_color);
          if (artStyle) {
            span.style.setProperty("--xhs-cover-run-font", artStyle.fontFamily);
            span.style.fontStyle = artStyle.fontStyle || "normal";
            if (artStyle.fontWeight) span.style.fontWeight = String(artStyle.fontWeight);
          }
        });
      });
    });
  }

  shouldUseTitleGradient(segment) {
    return this.isTitleGradientEnabled()
      && (!segment.highlight || !this.config.cover_highlight_color);
  }

  applyCoverTextOutlineStyle(element, kind, textColor) {
    const mode = this.config[`${kind}_outline_mode`] || "off";
    if (mode === "off" && kind !== "highlight") return;
    element.style.webkitTextStroke = "0 transparent";
    element.style.textShadow = "none";
    if (mode === "off") return;
    const width = Math.max(1, Math.min(12, Number(this.config[`${kind}_outline_width`]) || 2));
    element.style.paintOrder = "stroke fill";
    if (mode === "gradient" || (mode === "text" && this.isTitleGradientEnabled()
      && (kind === "highlight" || (kind === "title" && !this.config.title_highlight)))) {
      const stops = this.getTitleGradientStops();
      const first = stops[0] || this.config.accent_color;
      const middle = stops[Math.floor(stops.length / 2)] || first;
      const last = stops[stops.length - 1] || middle;
      element.style.webkitTextStroke = `${Math.max(1, width / 2)}px ${middle}`;
      element.style.textShadow = [
        `-${width}px 0 ${first}`, `-${width}px -${width}px ${first}`, `-${width}px ${width}px ${first}`,
        `0 -${width}px ${middle}`, `0 ${width}px ${middle}`,
        `${width}px 0 ${last}`, `${width}px -${width}px ${last}`, `${width}px ${width}px ${last}`
      ].join(", ");
      return;
    }
    const color = mode === "custom" ? this.config[`${kind}_outline_color`] : this.resolveCssModuleColor(textColor || this.config.text_color);
    element.style.webkitTextStroke = `${width}px ${color}`;
  }

  pickModuleImage(event, module) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!module || module.type !== "image") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const vaultPath = await this.importImageFile(file);
      module.src = vaultPath;
      module.objectFit = "contain";
      this.syncCompositionContentFromModule(module);
      const src = await this.resolveImage(vaultPath);
      if (src) {
        const loadedImage = await this.loadImage(src).catch(() => null);
        module.rawLogo = this.shouldRenderRawLogoImage(module, vaultPath, src, loadedImage);
        await this.fitImageModuleToSource(module, src, null, true, loadedImage);
      }
      this.selectedModuleId = module.id;
      this.persistDraft();
      this.renderControls();
      await this.renderPreview();
      new Notice("模块图片已上传");
    });
    input.click();
  }

  async fitImageModuleToSource(module, src, element = null, persist = false, loadedImage = null) {
    if(this.config.cover_visual_version===2 && !module?.custom)return;
    if(module.swissCover)return;
    if (!module || module.type !== "image" || !src) return;
    if (this.isFixedCoverImage(module)) {
      this.normalizeCoverImageFrame(module);
      if (element) {
        element.style.width = `${module.w}px`;
        element.style.height = `${module.h}px`;
      }
      if (persist) this.persistDraft();
      return;
    }
    try {
      const image = loadedImage || await this.loadImage(src);
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height) return;
      module.aspectRatio = width / height;
      if(module.custom) {
        module.objectFit = "contain";
        const oldW=module.w,oldH=module.h;
        module.w=Math.min(oldW,oldH*module.aspectRatio);
        module.h=module.w/module.aspectRatio;
        module.x+=(oldW-module.w)/2;
        module.y+=(oldH-module.h)/2;
      } else if (module.template !== "composition") {
        module.h = Math.max(12, Math.round(module.w / module.aspectRatio));
      }
      if (element) {
        element.style.left = `${module.x}px`;
        element.style.top = `${module.y}px`;
        element.style.width = `${module.w}px`;
        element.style.height = `${module.h}px`;
      }
      if (persist) this.persistDraft();
    } catch (error) {
      console.error("[XHS Card Studio] 图片比例读取失败", error);
    }
  }

  updateAlignmentGuides(card, module, snap = false) {
    if (!card || !module) return { x: 0, y: 0 };
    this.clearAlignmentGuides(card);

    this.createAlignmentGuide(card, "vertical", this.config.xhs_width / 2, "画布垂直居中", false);
    this.createAlignmentGuide(card, "horizontal", this.config.xhs_height / 2, "画布水平居中", false);

    const tolerance = 8;
    const result = { x: 0, y: 0 };
    const verticalMatch = this.findAlignmentMatch("vertical", module, tolerance);
    const horizontalMatch = this.findAlignmentMatch("horizontal", module, tolerance);

    if (verticalMatch) {
      result.x = snap ? verticalMatch.delta : 0;
      if (snap) module.x += verticalMatch.delta;
      this.createAlignmentGuide(card, "vertical", verticalMatch.value, verticalMatch.label, true);
    }
    if (horizontalMatch) {
      result.y = snap ? horizontalMatch.delta : 0;
      if (snap) module.y += horizontalMatch.delta;
      this.createAlignmentGuide(card, "horizontal", horizontalMatch.value, horizontalMatch.label, true);
    }
    return result;
  }

  findAlignmentMatch(axis, module, tolerance) {
    const candidates = this.getAlignmentCandidates(axis, module);
    const points = axis === "vertical"
      ? [
        { value: module.x, label: "左对齐" },
        { value: module.x + module.w / 2, label: "居中" },
        { value: module.x + module.w, label: "右对齐" }
      ]
      : [
        { value: module.y, label: "顶对齐" },
        { value: module.y + module.h / 2, label: "居中" },
        { value: module.y + module.h, label: "底对齐" }
      ];

    let best = null;
    points.forEach((point) => {
      candidates.forEach((candidate) => {
        const delta = candidate.value - point.value;
        const distance = Math.abs(delta);
        if (distance <= tolerance && (!best || distance < best.distance)) {
          best = {
            value: candidate.value,
            delta,
            distance,
            label: `${point.label} · ${candidate.label}`
          };
        }
      });
    });
    return best;
  }

  getAlignmentCandidates(axis, selected) {
    const candidates = axis === "vertical"
      ? [
        { value: 0, label: "画布左边" },
        { value: this.config.xhs_width / 2, label: "画布中心" },
        { value: this.config.xhs_width, label: "画布右边" }
      ]
      : [
        { value: 0, label: "画布顶部" },
        { value: this.config.xhs_height / 2, label: "画布中心" },
        { value: this.config.xhs_height, label: "画布底部" }
      ];

    this.config.xhs_modules
      .filter((module) => module.id !== selected.id && !module.locked && module.className !== "xhs-module-glow")
      .forEach((module) => {
        const label = this.getModuleLabel(module);
        if (axis === "vertical") {
          candidates.push({ value: module.x, label: `${label} 左边` });
          candidates.push({ value: module.x + module.w / 2, label: `${label} 中心` });
          candidates.push({ value: module.x + module.w, label: `${label} 右边` });
        } else {
          candidates.push({ value: module.y, label: `${label} 顶部` });
          candidates.push({ value: module.y + module.h / 2, label: `${label} 中心` });
          candidates.push({ value: module.y + module.h, label: `${label} 底部` });
        }
      });
    return candidates;
  }

  createAlignmentGuide(card, axis, value, label, active) {
    const guide = card.createDiv({
      cls: `xhs-alignment-guide is-${axis}${active ? " is-active" : ""}`
    });
    if (axis === "vertical") {
      guide.style.left = `${Math.round(value)}px`;
      guide.style.top = "0";
      guide.style.height = `${this.config.xhs_height}px`;
    } else {
      guide.style.left = "0";
      guide.style.top = `${Math.round(value)}px`;
      guide.style.width = `${this.config.xhs_width}px`;
    }
    guide.createDiv({ cls: "xhs-alignment-guide-label", text: label });
  }

  clearAlignmentGuides(card) {
    card.querySelectorAll(".xhs-alignment-guide").forEach((guide) => guide.remove());
  }

  startModuleDrag(event, module, element) {
    if (event.target && event.target.classList && (
      event.target.classList.contains("xhs-module-resize-handle")
      || event.target.classList.contains("xhs-module-rotate-handle")
    )) return;
    event.preventDefault();
    event.stopPropagation();
    this.selectedModuleId = module.id;
    this.refreshCoverSelectionUi();
    const card = element.closest(".xhs-card");
    const scale = this.getCardScale(card);
    const startX = event.clientX;
    const startY = event.clientY;
    const startModuleX = module.x;
    const startModuleY = module.y;
    const subtitlePanel = this.isMagazineSubtitle(module)
      ? card.querySelector('[data-module-id="magazine-subtitle-panel"]') : null;
    element.setPointerCapture(event.pointerId);

    const move = (moveEvent) => {
      module.x = Math.round(startModuleX + (moveEvent.clientX - startX) / scale);
      module.y = Math.round(startModuleY + (moveEvent.clientY - startY) / scale);
      module.manualPosition = true;
      module.manualLayout = true;
      this.updateAlignmentGuides(card, module, true);
      this.constrainCoverTextModuleToSafeArea(module);
      element.style.left = `${module.x}px`;
      element.style.top = `${module.y}px`;
      if (subtitlePanel) {
        subtitlePanel.style.left = element.style.left;
        subtitlePanel.style.top = element.style.top;
      }
    };
    const up = () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      this.clearAlignmentGuides(card);
      this.persistDraft();
      this.renderControls();
      if(module.coverTextRole)void this.renderPreview();
    };

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
  }

  startModuleResize(event, module, element) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedModuleId = module.id;
    this.refreshCoverSelectionUi();
    const card = element.closest(".xhs-card");
    const scale = this.getCardScale(card);
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = module.w;
    const startH = module.h;
    const startFontSize = module.fontSize || 32;
    const lockedAspect = this.getLockedResizeAspect(module, startW, startH);
    element.setPointerCapture(event.pointerId);

    const move = (moveEvent) => {
      module.w = Math.max(12, Math.round(startW + (moveEvent.clientX - startX) / scale));
      module.h = this.isLineModule(module) ? startH : Math.max(12, Math.round(startH + (moveEvent.clientY - startY) / scale));
      module.manualSize = true;
      module.manualLayout = true;
      if (lockedAspect) {
        const widthScale = module.w / Math.max(1, startW);
        const heightScale = module.h / Math.max(1, startH);
        if (module.template === "composition" && module.type === "image") {
          const requestedScale = Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;
          const maxScale = Math.min(
            (this.config.xhs_width - module.x) / Math.max(1, startW),
            (this.config.xhs_height - module.y) / Math.max(1, startH)
          );
          const nextScale = Math.max(12 / Math.min(startW, startH), Math.min(requestedScale, maxScale));
          module.w = Math.max(12, Math.round(startW * nextScale));
          module.h = Math.max(12, Math.round(startH * nextScale));
          this.constrainCompositionImageBox(module);
        } else {
          const nextScale = Math.max(widthScale, heightScale);
          module.w = Math.max(12, Math.round(startW * nextScale));
          module.h = Math.max(12, module.w / lockedAspect);
        }
        if (this.isDotModule(module)) module.borderRadius = 0;
      }
      this.constrainCoverTextModuleToSafeArea(module);
      if (!module.coverTextRole && this.shouldResizeTextWithBox(module)) {
        const widthScale = module.w / Math.max(1, startW);
        const heightScale = module.h / Math.max(1, startH);
        module.fontSize = Math.max(1, Math.min(400, Math.round(startFontSize * Math.max(widthScale, heightScale))));
        module.manualStyle = true;
        element.style.fontSize = `${module.fontSize}px`;
      }
      this.ensureCenteredLabelModuleSize(module);
      this.constrainCoverTextModuleToSafeArea(module);
      this.fitTextModuleFrameToContent(module);
      this.constrainCoverTextModuleToSafeArea(module);
      element.style.left = `${module.x}px`;
      element.style.top = `${module.y}px`;
      element.style.width = `${module.w}px`;
      element.style.height = `${module.h}px`;
      if(module.coverTextRole) {
        this.layoutCoverText();
        card.querySelectorAll("[data-module-id]").forEach(node=>{
          const item=this.config.xhs_modules.find(candidate=>candidate.id===node.dataset.moduleId);
          if(item)this.applyModuleStyle(node,item);
        });
      }
      this.updateAlignmentGuides(card, module, false);
    };
    const up = () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      this.clearAlignmentGuides(card);
      this.persistDraft();
      this.renderControls();
      if(module.coverTextRole)void this.renderPreview();
    };

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
  }

  startModuleRotate(event, module, element, handle) {
    event.preventDefault();
    event.stopPropagation();
    if (!module || module.type !== "image") return;
    this.selectedModuleId = module.id;
    this.refreshCoverSelectionUi();
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    const startRotation = Number.parseFloat(module.rotation) || 0;
    handle.setPointerCapture(event.pointerId);

    const move = (moveEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const delta = (angle - startAngle) * 180 / Math.PI;
      module.rotation = Math.round(startRotation + delta);
      module.manualStyle = true;
      element.style.transform = this.getModuleTransformCss(module);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      this.persistDraft();
      this.renderControls();
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }

  shouldResizeTextWithBox(module) {
    return module.type === "text" && (
      /\bxhs-module-arrow-text\b/.test(module.className || "")
    );
  }

  getLockedResizeAspect(module, fallbackW, fallbackH) {
    if (!module) return 0;
    if(module.type === "image" && module.custom)return module.aspectRatio || fallbackW / Math.max(1,fallbackH);
    if (module.id === "composition-block" && this.config.composition_variant === "solid-poster") return 0;
    if (module.template === "composition" && module.type === "image") return fallbackW / Math.max(1, fallbackH);
    if (module.type === "image") return module.aspectRatio || fallbackW / Math.max(1, fallbackH);
    if (this.isDotModule(module)) return 1;
    return 0;
  }

  constrainCompositionImageBox(module) {
    const width = this.config.xhs_width;
    const height = this.config.xhs_height;
    module.x = Math.max(0, Math.min(module.x, width - 12));
    module.y = Math.max(0, Math.min(module.y, height - 12));
    module.w = Math.max(12, Math.min(module.w, width - module.x));
    module.h = Math.max(12, Math.min(module.h, height - module.y));
  }

  restoreCompositionImageBox(module) {
    const preset = COMPOSITION_PRESETS.find((item) => item.id === this.config.composition_variant);
    const index = module.id === "composition-image" ? 0
      : Number.parseInt(module.id.match(/^composition-image-(\d+)$/)?.[1] || "0", 10) - 1;
    const box = preset?.images[index];
    if (!box) return;
    [module.x, module.y, module.w, module.h] = box;
    module.manualPosition = false;
    module.manualSize = false;
    module.manualLayout = false;
    this.persistDraft();
    this.renderControls();
    void this.renderPreview();
  }

  isDotModule(module) {
    return module && module.type === "shape" && /\bxhs-module-dot-shape\b/.test(module.className || "");
  }

  getCardScale(card) {
    if (!card) return 1;
    const rect = card.getBoundingClientRect();
    return rect.width ? rect.width / this.config.xhs_width : 1;
  }

  pickEnglishDisplay(value, fallback) {
    const text = this.toText(value).trim();
    if (!text) return fallback;
    const letters = text.replace(/[^a-zA-Z]/g, "").length;
    const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
    return letters >= 4 && letters >= cjk ? text : fallback;
  }

  renderAiCourseCover(card, images) {
    this.addImage(card, images.background, "xhs-bg-img");
    if (this.config.xhs_modules.length === 0 || !this.config.xhs_modules.some((module) => module.id === "ai-title")) {
      this.config.xhs_modules = this.createDefaultAiModules(this.config);
    }
    if (!this.selectedModuleId && this.config.xhs_modules.length) {
      this.selectedModuleId = "ai-title";
    }
    this.config.xhs_modules.forEach((module) => this.renderEditableModule(card, module, images));
  }

  async renderDetail(card, page, images) {
    this.applyDetailPresentation(card);
    card.createDiv({ cls: "xhs-detail-bg" });
    const scrollRoot = card.createDiv({ cls: `xhs-detail-scroll-root${page.scrollable ? " is-scrollable" : ""}` });
    const content = scrollRoot.createDiv({ cls: "xhs-detail-markdown xhs-detail-layout-plain xhs-detail-layout-principles" });
    const imageLayer = scrollRoot.createDiv({ cls: "xhs-detail-image-layer" });
    const tokens = this.prepareDetailTokens(page.tokens || []);
    this.detailImageRenderIndex = 0;
    if (typeof page.readingHtml === "string") {
      const host = content.createDiv({ cls: "xhs-native-markdown-block markdown-rendered" });
      // This HTML is generated only from the already rendered Obsidian DOM.
      host.innerHTML = page.readingHtml;
      for (const slot of Array.from(host.querySelectorAll("[data-detail-image-slot]"))) {
        const key = slot.getAttribute("data-detail-image-slot");
        const token = tokens.find(item => item.type === "image" && item.imageKey === key);
        if (!token) throw new Error("Missing source image for reading page");
        const parent = slot.parentElement;
        const paired = parent.classList.contains("is-pair-mode");
        const keys = Array.from(parent.querySelectorAll("[data-detail-image-slot]"), node => node.getAttribute("data-detail-image-slot"));
        const holder = document.createElement("div");
        const result = await this.renderMarkdownImageToken(holder, token, imageLayer, paired, paired ? 2 : 1, keys, false, keys, paired);
        slot.replaceWith(...Array.from(holder.children));
        if (!result) throw new Error("Reading page image could not be loaded");
        if(slot.dataset.detailAutoWidth) {
          const wrap=Array.from(imageLayer.children).find(node=>node.dataset.detailImageKey===key);
          if(wrap && !this.config.detail_image_layouts?.[key]?.adjusted) {
            result.layout.w=Number(slot.dataset.detailAutoWidth);
            this.applyDetailImageLayout(wrap,wrap.querySelector("img"),result.layout);
            wrap._xhsDetailImageSlot.dataset.detailAutoWidth=slot.dataset.detailAutoWidth;
          }
        }
      }
      await this.finalizeDetailReadingFlow(content, card, page);
      return;
    }
    if (MarkdownRenderer?.render && typeof page.markdown === "string") {
      const host = content.createDiv({ cls: "xhs-native-markdown-block markdown-rendered" });
      const prepared = this.prepareNativeDetailSource(page.markdown, tokens);
      await MarkdownRenderer.render(this.app, prepared.markdown, host, this.activeFile?.path || "", this);
      for (let index = 0; index < prepared.runs.length; index++) {
        const anchor = host.querySelector(`[data-xhs-native-images="${index}"]`);
        if (!anchor) throw new Error("Native Markdown image anchor missing; refusing incomplete detail rendering.");
        anchor.classList.add("xhs-detail-media-group");
        await this.renderDetailImageRun(anchor, prepared.runs[index], imageLayer);
      }
      await this.finalizeDetailReadingFlow(content, card, page);
      return;
    }
    this.detailImageRenderIndex = 0;
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.type === "image") {
        const run = this.collectDetailImageRun(tokens, index);
        const imageTokens = run.imageTokens;
        index = run.endIndex;
        const groupKeys = imageTokens.map((imageToken, imageOffset) => (
          this.getDetailImageKey(imageToken, this.detailImageRenderIndex + imageOffset)
        ));
        for (let imageOffset = 0; imageOffset < imageTokens.length; imageOffset += 2) {
          const rowTokens = imageTokens.slice(imageOffset, imageOffset + 2);
          const rowKeys = groupKeys.slice(imageOffset, imageOffset + 2);
          const rowPairMode = rowKeys.length === 2 && rowKeys.some((imageKey) => this.isDetailImagePairModeKey(imageKey));
          if (rowPairMode) {
            const row = content.createDiv({ cls: "xhs-detail-image-row is-pair-mode" });
            row._xhsDetailTokens = rowTokens;
            let pairMasterSize = null;
            for (const imageToken of rowTokens) {
              const rendered = await this.renderMarkdownImageToken(
                row,
                imageToken,
                imageLayer,
                true,
                2,
                groupKeys,
                false,
                rowKeys,
                true,
                pairMasterSize
              );
              if (!pairMasterSize && rendered && rendered.layout) {
                pairMasterSize = {
                  w: rendered.layout.w,
                  h: rendered.layout.h,
                  slotW: rendered.layout.slotW,
                  aspectRatio: rendered.layout.aspectRatio
                };
              }
            }
          } else {
            for (const imageToken of rowTokens) {
              await this.renderMarkdownImageToken(content, imageToken, imageLayer, false, 1, groupKeys, false, rowKeys, false);
            }
          }
        }
        continue;
      }
      const before = content.children.length;
      await this.renderMarkdownToken(content, token, imageLayer);
      if (token.type !== "spacer" && content.children.length > before) {
        const element = content.children[before];
        element._xhsDetailTokens = [token];
        if (token.fittedScale) element.style.setProperty("--xhs-detail-font-size", `${this.config.detail_font_size * token.fittedScale}px`);
      }
    }
    if (document.fonts?.ready) await document.fonts.ready;
    await this.finalizeDetailReadingFlow(content, card, page);
  }

  normalizeDetailBlockPresentation(host) {
    host.querySelectorAll('.xhs-callout-type').forEach(node=>node.remove());
    for(const callout of host.querySelectorAll('.callout')) {
      const title=callout.querySelector(':scope > .callout-title');
      const inner=title?.querySelector('.callout-title-inner');
      const type=callout.dataset.callout || '';
      // Obsidian's default type heading is metadata, not the author's title.
      title?.classList.toggle('xhs-callout-type-only',Boolean(inner && inner.textContent.trim().toLowerCase()===type.toLowerCase()));
    }
  }

  normalizeDetailHighlights(host) {
    const palette={red:'#e93147',orange:'#ec7500',yellow:'#e0ac00',green:'#08b94e',blue:'#086ddd',purple:'#7852ee'};
    const symbols={'🔴':'red','🟠':'orange','🟡':'yellow','🟢':'green','🔵':'blue','🟣':'purple'};
    for(const mark of host.querySelectorAll('mark')) {
      let name=mark.dataset.color || mark.dataset.highlightColor || mark.dataset.highlight || mark.dataset.xhsHighlightColor;
      const prefix=mark.textContent.match(/^(🔴|🟠|🟡|🟢|🔵|🟣)\ufe0f?/u);
      if(prefix) {
        name=symbols[prefix[1]];
        // Remove the source color marker, retaining nested bold nodes and all visible text.
        const walker=document.createTreeWalker(mark,4);let remaining=prefix[0].length,node;
        while(remaining && (node=walker.nextNode())){const count=Math.min(remaining,node.nodeValue.length);node.nodeValue=node.nodeValue.slice(count);remaining-=count;}
      }
      if(!name)name=Array.from(mark.classList).map(value=>value.match(/^(?:highlight|color|hl)-(red|orange|yellow|green|blue|purple)$/)?.[1]).find(Boolean);
      const color=palette[name] || this.parseCoverHexColor(name)
        || mark.style.getPropertyValue('--xhs-emphasis-color') || mark.style.color || mark.style.backgroundColor;
      if(color)mark.style.setProperty('--xhs-emphasis-color',color);
      if(name)mark.dataset.xhsHighlightColor=name;
      // Highlight is an inline color wrapper, not a change in the bold title's role.
      const children=Array.from(mark.childNodes).filter(node=>node.nodeType!==3 || node.textContent.trim());
      if(!mark.closest('pre,code') && children.length===1 && children[0].nodeType===1 && children[0].matches('strong,b')) {
        const strong=children[0];strong.replaceWith(...Array.from(strong.childNodes));
        mark.replaceWith(strong);strong.append(mark);
      }
    }
  }

  prepareNativeDetailSource(markdown, tokens) {
    const originals = tokens.filter(token => token.type === "image");
    const runs = [];
    const lines = markdown.split(/\r?\n/);
    let fence = null;
    let cursor = 0;
    const output = [];
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const match = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (match) {
        if (!fence) fence = match[1];
        else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
        output.push(line); continue;
      }
      if(!fence && /^ {0,3}<!--\s*xhs:/.test(line)) {
        const directive=line.match(/^ {0,3}<!--\s*xhs:bg=blue(?:\s+items=(all|\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*))?\s*-->\s*$/);
        const columns=line.match(/^ {0,3}<!--\s*xhs:columns\s*=\s*([12])\s*-->\s*$/);
        if(columns)output.push('',`<div data-xhs-columns-marker="${columns[1]}"></div>`,'');
        else if(directive)output.push('',`<div data-xhs-bg-marker="${directive[1] || ''}"></div>`,'');
        else this.warnDetailBackground('模块参数无效：'+line.trim());
        continue;
      }
      const images = fence ? [] : this.parseMarkdownImagesLine(line);
      // A flush-left bold label is a new group, not a lazy list continuation.
      if (!fence && /^(?:\*\*[^*].*\*\*|__[^_].*__)\s*$/.test(line)
        && index > 0 && /^\s*(?:[-+*]|\d+[.)])\s+/.test(lines[index - 1])) {
        output.push("", line, ""); continue;
      }
      if (!images.length || images.some((image, offset) => originals[cursor + offset]?.src !== image.src)) {
        output.push(line); continue;
      }
      const run = originals.slice(cursor, cursor + images.length);
      cursor += images.length;
      while (index + 1 < lines.length) {
        let next = index + 1;
        while (next < lines.length && !lines[next].trim()) next++;
        const following = next < lines.length ? this.parseMarkdownImagesLine(lines[next]) : [];
        if (!following.length || following.some((image, offset) => originals[cursor + offset]?.src !== image.src)) break;
        run.push(...originals.slice(cursor, cursor + following.length));
        cursor += following.length; index = next;
      }
      output.push("", `<div data-xhs-native-images="${runs.length}"></div>`, "");
      runs.push(run);
    }
    // Keep unsupported/ambiguous image syntax native instead of dropping source.
    if (cursor !== originals.length) return this.prepareNativeDetailSource(markdown, []);
    return { markdown: output.join("\n"), runs };
  }

  warnDetailBackground(message) {
    this.detailBackgroundWarnings ||= new Set();
    if(this.detailBackgroundWarnings.has(message))return;
    this.detailBackgroundWarnings.add(message);new Notice(message);
  }

  applyDetailBackgroundMarkers(host) {
    const markers='[data-xhs-bg-marker],[data-xhs-columns-marker]';
    for(const marker of host.querySelectorAll(markers)) {
      let target=marker.nextElementSibling;
      while(target?.matches(markers))target=target.nextElementSibling;
      marker.remove();
      const columns=marker.dataset.xhsColumnsMarker;
      if(columns) {
        const group=target?.matches('ul,table')?target:
          target?.querySelector(':scope > table,:scope > .callout-content > ul');
        if(group)group.dataset.detailColumns=columns;
        continue;
      }
      const spec=marker.dataset.xhsBgMarker;
      if(!target || target.matches('hr')) {
        this.warnDetailBackground('背景参数后没有可用模块');continue;
      }
      if(!spec){
        target.dataset.detailBackground='blue';
        if(target.tagName==='P')target.classList.add('xhs-background-text-card');
        continue;
      }
      const table=target.matches('table')?target:target.querySelector(':scope > table');
      const list=target.matches('ul,ol')?target:target.querySelector(':scope > .callout-content > ul,:scope > .callout-content > ol');
      const items=table?Array.from(table.querySelectorAll(':scope > tbody > tr')):
        list?Array.from(list.children).filter(n=>n.tagName==='LI'):[];
      if(!items.length){this.warnDetailBackground('items 参数仅适用于表格数据行或顶层列表项');continue;}
      const selected=new Set();let valid=true;
      for(const range of spec==='all'?['1-'+items.length]:spec.split(',')) {
        const [start,end=start]=range.split('-').map(Number);
        if(start<1 || end<start || end>items.length){valid=false;break;}
        for(let number=start;number<=end;number++)selected.add(number-1);
      }
      if(!valid){this.warnDetailBackground('背景 items 序号越界或范围无效：'+spec);continue;}
      for(const index of selected)items[index].dataset.detailBackground='blue';
    }
  }

  async renderDetailImageRun(parent, imageTokens, imageLayer) {
    const groupKeys = imageTokens.map((token, offset) => this.getDetailImageKey(token, this.detailImageRenderIndex + offset));
    for (let offset = 0; offset < imageTokens.length; offset += 2) {
      const pair = imageTokens.slice(offset, offset + 2);
      const keys = groupKeys.slice(offset, offset + 2);
      const paired = keys.length === 2 && keys.some(key => this.isDetailImagePairModeKey(key));
      const target = paired ? parent.createDiv({ cls: "xhs-detail-image-row is-pair-mode" }) : parent;
      let master = null;
      for (const token of pair) {
        const result = await this.renderMarkdownImageToken(target, token, imageLayer, paired, paired ? 2 : 1,
          groupKeys, false, keys, paired, master);
        if (!master && result?.layout) master = result.layout;
      }
    }
  }

  markDetailStyleStructure(host, card) {
    card?.classList.toggle("xhs-has-visual-layout", Boolean(host.closest(".xhs-detail-layout-visual")));
    card?.classList.toggle("xhs-has-major-heading", Boolean(host.querySelector("h1,h2")));
    host.classList.toggle("xhs-starts-with-heading", Boolean(host.querySelector(":scope > :is(h1,h2,h3,h4,h5,h6)")));

    const childRules = [
      ["ul,ol", "xhs-list-with-markers", "li > .xhs-detail-list-marker"],
      ["li", "xhs-item-with-marker", ".xhs-detail-list-marker"],
      [".xhs-unified-number-list > li,.xhs-module-number-list > li", "xhs-item-with-ordinal", ".xhs-module-ordinal"],
      [".xhs-reference-item,[data-reading-continuation]", "xhs-item-with-reference-body", ".xhs-reference-body"],
      [".xhs-reference-item", "xhs-item-with-reference-title", ".xhs-reference-item-title"],
      [".xhs-reference-item", "xhs-item-with-reference-value", ".xhs-reference-value"],
      [".xhs-reference-item", "xhs-item-with-reference-ordinal", ".xhs-reference-ordinal"],
      [".xhs-reference-summary > p:first-child,blockquote.xhs-source-quote > p", "xhs-standalone-strong", "strong:only-child"],
      [".xhs-detail-module", "xhs-module-with-major-heading", ":is(h1,h2):not([data-reading-repeat])"]
    ];
    for (const [selector, className, child] of childRules) {
      for (const node of host.querySelectorAll(selector)) {
        node.classList.toggle(className, Boolean(node.querySelector(`:scope > ${child}`)));
      }
    }
    for (const node of host.querySelectorAll(".xhs-detail-module,.xhs-detail-card-group")) {
      const next = node.nextElementSibling;
      node.classList.toggle("xhs-before-heading-module", Boolean(next?.matches(".xhs-detail-module[data-detail-heading-level]")));
    }
    for (const row of host.querySelectorAll("table:not(.xhs-module-record-table,.xhs-reference-table) tr")) {
      row.classList.toggle("xhs-two-cell-row", row.children.length === 2);
    }
  }


  async finalizeDetailReadingFlow(content, card, page = {}) {
    if (typeof content.querySelectorAll !== "function") return;
    let host;
    const fragments = Array.from(content.children).filter(node => !node.classList.contains("xhs-detail-spacer"));
    if (fragments.length === 1 && fragments[0].classList.contains("xhs-native-markdown-block")) host = fragments[0];
    else {
      host = document.createElement("div"); host.className = "xhs-native-markdown-block markdown-rendered";
      for (const node of Array.from(content.childNodes)) {
        if (node.nodeType === 1 && node.classList.contains("xhs-detail-spacer")) { node.remove(); continue; }
        if (node.nodeType === 1 && node.classList.contains("xhs-native-markdown-block")) {
          host.append(...Array.from(node.childNodes)); node.remove();
        } else host.append(node);
      }
      content.append(host);
    }
    content.dataset.detailLayoutVersion = "reading-principles-2";
    // Editor-only copy controls are not source content and must not make code atomic.
    host.querySelectorAll('pre > .copy-code-button').forEach(button=>button.remove());
    for(const cell of host.querySelectorAll('td,th')) {
      const alignment=cell.style.textAlign || cell.getAttribute('align');
      if(['left','center','right'].includes(alignment))cell.dataset.detailCellAlign=alignment;
    }
    this.normalizeDetailBlockPresentation(host);
    this.normalizeDetailHighlights(host);
    this.applyDetailBackgroundMarkers(host);
    this.allocateDetailTableColumns(host);
    const first = Array.from(host.children).find(node => node.tagName !== "HR");
    host.querySelectorAll(".xhs-reading-title").forEach(node => node.classList.remove("xhs-reading-title"));
    if (page.isArticleTitle && first?.tagName === "H1") first.classList.add("xhs-reading-title");
    host.querySelectorAll(".xhs-reading-phrase").forEach(node => node.replaceWith(...node.childNodes));
    host.querySelectorAll(".xhs-reading-focus").forEach(node => node.classList.remove("xhs-reading-focus"));
    const focus = host.querySelector(".xhs-reading-title") || host.querySelector("h1,h2,h3,h4,h5,h6")
      || host.querySelector(".xhs-detail-media-group,table,p");
    focus?.classList.add("xhs-reading-focus");
    for (const heading of host.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      heading.classList.add("xhs-reading-heading");
      if (heading.nextElementSibling) heading.nextElementSibling.classList.add("xhs-reading-owned");
    }
    for (const paragraph of host.querySelectorAll("p")) {
      if (this.config.detail_page_type !== "modular" && paragraph.nextElementSibling && paragraph.textContent.length <= 60 && paragraph.children.length === 1
        && paragraph.firstElementChild.tagName === "STRONG"
        && paragraph.textContent.trim() === paragraph.firstElementChild.textContent.trim()) {
        paragraph.classList.add("xhs-reading-label");
        paragraph.nextElementSibling?.classList.add("xhs-reading-owned");
      }
    }
    if (document.fonts?.ready) await document.fonts.ready;
    this.ensureDetailContinuationContext(host);
    if(this.config.detail_page_type==="modular")this.composeModularDetail(host,card);
    if(this.config.detail_page_type==="modular") {
      for(const module of host.querySelectorAll("[data-detail-module]")) {
        module.dataset.detailVisualStyle=this.getDetailVisualStyle(module.dataset.detailModule,module.dataset.detailVariant);
      }
      this.mergeDetailTableFragments(host);
      this.ensureDetailContinuationContext(host);
      this.applyDetailPageHierarchy(host);
    }
    if(this.config.detail_page_type==='modular') {
      for(const quote of host.querySelectorAll('blockquote:not(.callout):not(.xhs-detail-callout)')) {
        if(!quote.closest('.callout,.xhs-detail-callout'))quote.classList.add('xhs-source-quote');
      }
    }
    this.normalizeDetailAuxiliaryMarkers(host);
    this.markDetailStyleStructure(host, card);
    if(this.config.detail_page_type==="modular" && !page.readingHtml)this.fitStandaloneDetailMedia(host,card);
    this.refreshDetailImageAnchors(card);
    content._xhsReadingAudit = this.auditDetailReadingFlow(content);
  }

  getDetailModuleRegistry() {
    return {
      chapter:{name:"章节正文",composition:"editorial",design:"chapter-grid"},steps:{name:"有序列表",composition:"sequence",design:"numbered-strip"},
      categories:{name:"标题项目",composition:"outlined-rows",design:"outlined-label"},checklist:{name:"任务清单",composition:"checklist",design:"task-panel"},
      list:{name:"无序列表",composition:"list",design:"shared-list"},quote:{name:"引用",composition:"quote",design:"source-quote-panel"},
      callout:{name:"提示块",composition:"callout",design:"callout-sidebar"},table:{name:"表格",composition:"tabular",design:"field-table"},
      code:{name:"代码",composition:"code",design:"code-frame"},figure:{name:"图片",composition:"figure",design:"media-frame"},
      native:{name:"原生内容",composition:"native",design:"native-region"}
    };
  }

  getDetailVisualStyle(type, variant = "") {
    if(type==="steps")return "steps";
    if(type==="categories" || variant==="label-content")return "categories";
    if(type==="list")return "matrix";
    if(type==="chapter")return variant==="labelled-prose"?"reading":"article";
    return "professional";
  }

  applyDetailPageHierarchy(host) {
    const headings=Array.from(host.querySelectorAll("h1,h2")).filter(heading=>!heading.hasAttribute("data-reading-context"));
    headings.forEach((heading,index)=>{
      heading.dataset.detailPageRole=index===0?"primary":"secondary";
      if(heading.childNodes.length!==1 || heading.firstChild.nodeType!==3 || /[\r\n]/.test(heading.textContent))return;
      const phrases=heading.textContent.match(/[^，,：:；;。！？!?]+[，,：:；;。！？!?]?/g);
      if(!phrases || phrases.length<2 || phrases.some(phrase=>phrase.length<4) || phrases.join("")!==heading.textContent)return;
      heading.replaceChildren(...phrases.map(phrase=>{
        const span=document.createElement("span");span.className="xhs-heading-phrase";span.textContent=phrase;return span;
      }));
    });
    host.querySelectorAll("[data-reading-context]").forEach(heading=>heading.dataset.detailPageRole="continuation");
    host.querySelectorAll(".xhs-reading-focus").forEach(node=>node.classList.remove("xhs-reading-focus"));
    const focus=host.querySelector("h1:not([data-reading-context]),h2:not([data-reading-context])")
      || host.querySelector(".xhs-table-record > td:first-child .xhs-table-field-value,.xhs-module-item-title,.xhs-prose-step-title,.xhs-module-group-label,.xhs-module-prose-label,h3,h4,h5,h6")
      || host.querySelector("[data-reading-context],.xhs-detail-media-group,table,p") || host.firstElementChild;
    focus?.classList.add("xhs-reading-focus");
  }

  getDetailLayoutRules() {
    const scale=this.getDetailDesignSystem().unit/VISUAL_RULES.unit;
    return {gridTitleLines:2,gridBodyLines:4,plainCardLines:1,mediaMinHeightUnits:40,mediaMinScale:.6,
      capacityReserve:VISUAL_RULES.capacityReserve*scale,tabMinHeight:VISUAL_RULES.tabMinHeight*scale,
      paginationReserve:VISUAL_RULES.paginationReserve*scale,paginationMinLines:VISUAL_RULES.paginationMinLines,
      tabHeightRatio:VISUAL_RULES.tabHeightRatio,parallelHeightRatio:VISUAL_RULES.parallelHeightRatio,
      valueLines:VISUAL_RULES.valueLines,descriptionLines:VISUAL_RULES.descriptionLines,noteLines:VISUAL_RULES.noteLines,
      groupTitleLines:VISUAL_RULES.groupTitleLines,groupBodyLines:VISUAL_RULES.groupBodyLines};
  }

  getDetailReferenceRules() {
    return {
      panel:{name:'有序列表（标题＋段落）',tags:['OL'],slots:0},notices:{name:'无序列表（标题＋段落）',tags:['UL'],slots:0},grid:{name:'无序列表（标题＋子列表）',tags:['UL'],slots:0},
      tabs:{name:'无序列表（标签＋同段说明）',tags:['UL'],slots:0},metrics:{name:'表格（指标＋数值）',tags:['UL'],slots:3},attributes:{name:'表格（对象＋关键属性）',tags:['UL','OL'],slots:4},
      courses:{name:'有序列表（标题＋子列表）',tags:['UL','OL'],slots:0}
    };
  }

  getDetailLeadingEmphasis(node) {
    const first=node?.firstElementChild;
    if(!first)return null;
    if(Array.from(node.childNodes).slice(0,Array.from(node.childNodes).indexOf(first)).some(child=>child.textContent.trim()))return null;
    return first.matches('strong')?first:first.tagName==='P'?this.getDetailLeadingEmphasis(first):null;
  }

  getDetailMarkdownTableSchema(table) {
    const headers=Array.from(table.querySelectorAll(':scope > thead > tr > th'));
    const rows=Array.from(table.querySelectorAll(':scope > tbody > tr'));
    if(!headers.length || !rows.length || table.querySelector('[rowspan],[colspan]')
      || rows.some(row=>row.cells.length!==headers.length))return null;
    const names=headers.map(cell=>cell.textContent.trim().replace(/\s+/g,''));
    const schemas=[
      {name:'metrics',required:['item-title','value'],aliases:{'指标':'item-title','指标名称':'item-title','数值':'value','数值与单位':'value','说明':'note','注释':'note','备注':'note'}},
      {name:'attributes',required:['item-title','value'],aliases:{'对象':'item-title','对象名称':'item-title','关键属性':'value','说明':'description','补充':'note','补充说明':'note'}}
    ];
    for(const schema of schemas) {
      const fields=names.map(name=>schema.aliases[name]);
      if(fields.every(Boolean) && new Set(fields).size===fields.length
        && schema.required.every(role=>fields.includes(role)))return {name:schema.name,fields};
    }
    return null;
  }

  getDetailTableKey(node) {
    const emphasized=Array.from(node?.querySelectorAll('strong') || []).find(key=>key.textContent.trim());
    if(emphasized)return emphasized;
    let first=Array.from(node?.childNodes || []).find(child=>child.textContent.trim());
    if(first?.nodeType===1 && first.matches('mark')) {
      const walker=document.createTreeWalker(first,NodeFilter.SHOW_TEXT);let text;
      while((text=walker.nextNode()))if(text.textContent.trim()){first=text;break;}
    }
    if(!first)return null;
    if(first.nodeType!==3)return first.nodeType===1?first:null;
    // Wrap existing text only: ordinary Markdown needs no added bold markers.
    const match=first.data.match(/^(\s*)([+\-−]?(?:\d[\d,]*(?:\.\d+)?|\.\d+))/)
      || first.data.match(/^(\s*)(\S+)/);
    if(!match)return null;
    const text=match[1].length?first.splitText(match[1].length):first;
    if(text.length>match[2].length)text.splitText(match[2].length);
    const key=document.createElement('span');text.before(key);key.append(text);return key;
  }

  matchDetailMarkdownStructure(module) {
    const block=module.querySelector(':scope > ul,:scope > ol,:scope > table,:scope > .table-wrapper > table');
    if(!block || block.querySelector('input[type=checkbox],.task-list-item,pre,img,.image-embed,.callout,.math-block,blockquote,.internal-embed,.mermaid,video,audio,iframe,table'))return null;
    if(block.tagName==='TABLE') {
      // Only explicit semantic headers select a card type; column count and bold do not.
      return this.getDetailMarkdownTableSchema(block)?.name || null;
    }
    const items=Array.from(block.children).filter(node=>node.tagName==='LI');
    if(block.querySelector('table,blockquote,.internal-embed,.mermaid,video,audio,iframe'))return null;
    if(!items.length || !items.every(item=>this.getDetailListTitle(item)?.tagName==='STRONG'))return null;
    const nested=items.map(item=>Boolean(item.querySelector(':scope > ul,:scope > ol')));
    if(nested.every(Boolean))return block.tagName==='OL'?'courses':'grid';
    if(nested.some(Boolean))return null;
    const separate=items.map(item=>item.firstElementChild?.tagName==='P'
      && item.firstElementChild.textContent.trim()===this.getDetailListTitle(item).textContent.trim());
    if(separate.every(Boolean) && items.every(item=>Array.from(item.childNodes).some(node=>node!==item.firstElementChild && node.textContent.trim())))return block.tagName==='OL'?'panel':'notices';
    if(block.tagName==='UL' && separate.every(value=>!value) && items.every(item=>item.querySelectorAll(':scope > p').length<=1))return 'tabs';
    return null;
  }

  validateDetailReferenceContent(name,nodes) {
    const rule=this.getDetailReferenceRules()[name];
    const fail=message=>{throw new Error(`xhs-${name}：${message}`);};
    if(!rule)fail('未知结构');
    const lists=nodes.filter(node=>node.matches('ul,ol'));
    if(lists.length!==1 || !rule.tags.includes(lists[0].tagName) || nodes.some(node=>node!==lists[0] && node.tagName!=='P'))fail(`正文必须含一个 ${rule.tags.join('/')} 列表，可在列表前后加段落`);
    const items=Array.from(lists[0].children);
    if(!items.length || !items.every(item=>this.getDetailListTitle(item)))fail('每项必须以加粗标题开头并包含所属正文');
    if(items.some(item=>item.querySelector('table,pre,img,.callout,input[type=checkbox]')))fail('这里只支持文本段落和子列表，专业模块请单独声明');
    if(rule.slots && items.some(item=>item.children.length!==rule.slots || Array.from(item.children).some(child=>child.tagName!=='P')))fail(`每项必须恰好包含 ${rule.slots} 个段落，字段顺序见示例`);
    if(rule.slots && items.some(item=>!item.children[rule.slots===3?1:2].firstElementChild?.matches('strong')))fail('数值/关键属性段必须以加粗内容开头，后面可接单位');
  }

  mergeDetailTableFragments(host) {
    this.mergeDetailReferenceTables(host);
    this.mergeDetailReferenceFragments(host);
    let previous=null;
    for(const node of Array.from(host.children)) {
      const before=previous?.dataset.detailModule==='table'?previous.querySelector('table'):null;
      const after=node.dataset.detailModule==='table'?node.querySelector('table'):null;
      if(before?.dataset.readingTable && before.dataset.readingTable===after?.dataset.readingTable
        && !node.querySelector('h1:not([data-reading-repeat]),h2:not([data-reading-repeat]),h3:not([data-reading-repeat]),h4:not([data-reading-repeat]),h5:not([data-reading-repeat]),h6:not([data-reading-repeat])')
        && before.querySelector('tbody') && after.querySelector('tbody')) {
        before.querySelector('tbody').append(...Array.from(after.querySelector('tbody').children));node.remove();
      } else if(previous?.dataset.detailModule==='chapter' && node.dataset.detailModule==='chapter' && node.dataset.readingFragment
        && previous.dataset.detailSource===node.dataset.detailSource
        && !node.querySelector('h1:not([data-reading-repeat]),h2:not([data-reading-repeat]),h3:not([data-reading-repeat]),.xhs-module-prose-label:not([data-reading-repeat])')
        && previous.querySelector(':scope > .xhs-module-chapter-body') && node.querySelector(':scope > .xhs-module-chapter-body')) {
        previous.querySelector(':scope > .xhs-module-chapter-body').append(...Array.from(node.querySelector(':scope > .xhs-module-chapter-body').children).filter(child=>!child.hasAttribute('data-reading-context')));
        node.remove();
      } else previous=node;
    }
    for(const table of host.querySelectorAll('table.xhs-module-record-table')) {
      let record=null;
      for(const row of table.querySelectorAll(':scope > tbody > tr')) {
        if(record && row.dataset.readingContinuation && record.dataset.readingRecord===row.dataset.readingRecord) {
          const last=record.lastElementChild,first=row.firstElementChild;
          if(last && first?.dataset.readingContinuation && last.dataset.detailCell===first.dataset.detailCell) {
            last.querySelector('.xhs-table-field-value').append(...first.querySelector('.xhs-table-field-value').childNodes);first.remove();
          }
          record.append(...row.children);row.remove();
        }else record=row;
      }
    }
  }

  fitStandaloneDetailMedia(host,card) {
    const scale=this.getCardScale(card);
    const capacity=card.querySelector('.xhs-detail-scroll-root').getBoundingClientRect().height/scale-this.getDetailLayoutRules().capacityReserve;
    for(const wrap of card.querySelectorAll('.xhs-detail-image-wrap')) {
      const slot=wrap._xhsDetailImageSlot,layout=wrap._xhsDetailLayout;
      const module=slot?.closest('[data-detail-module="figure"]');
      if(!module || !layout?.aspectRatio || module.querySelectorAll('[data-detail-image-slot]').length>1
        || this.config.detail_image_layouts?.[wrap.dataset.detailImageKey]?.adjusted || slot?._xhsDetailTokens?.[0]?.width)continue;
      const excess=module.getBoundingClientRect().height/scale-capacity;
      if(excess<=0)continue;
      const height=layout.h-excess-this.getDetailDesignSystem().unit*2;
      if(height<this.getDetailDesignSystem().unit*this.getDetailLayoutRules().mediaMinHeightUnits || height<layout.h*this.getDetailLayoutRules().mediaMinScale)continue;
      layout.w=Math.floor(layout.w*height/layout.h);
      this.applyDetailImageLayout(wrap,wrap.querySelector('img'),layout);
      slot.dataset.detailAutoWidth=String(layout.w);
    }
  }

  ensureDetailContinuationContext(host) {
    // Remove only renderer-generated copies, never equal text authored in Markdown.
    for(const node of host.querySelectorAll('[data-reading-repeat],[data-reading-context]')) {
      if(node.tagName==='THEAD')node.closest('table').dataset.readingContinuation='true';
      node.remove();
    }
    for(const item of host.querySelectorAll('[data-reading-continuation]')) {
      item.querySelectorAll(':scope > [data-reading-generated="ordinal"]').forEach(node=>node.remove());
    }
  }

  normalizeDetailAuxiliaryMarkers(host) {
    const system = this.getDetailDesignSystem();
    for (const list of host.querySelectorAll("ol")) {
      if(list.classList.contains('xhs-reference-list'))continue;
      list.classList.add("xhs-unified-number-list");
      let ordinal = Number(list.getAttribute("start") || 1);
      const items = Array.from(list.children).filter(node => node.tagName === "LI");
      for (const item of items) {
        if (item.hasAttribute("value")) ordinal = Number(item.getAttribute("value"));
        let marker = item.querySelector(":scope > .xhs-module-ordinal");
        if (!marker && !item.hasAttribute("data-reading-continuation")) {
          marker = document.createElement("span");
          marker.className = "xhs-module-ordinal";
          marker.dataset.readingGenerated = "ordinal";
          marker.setAttribute("aria-hidden", "true");
          marker.textContent = String(item.dataset.detailOrdinal || ordinal);
          item.prepend(marker);
        }
        if(!item.classList.contains('is-titled-item') && !item.querySelector(':scope > .xhs-number-content')) {
          const body=document.createElement('div');body.className='xhs-number-content';
          body.append(...Array.from(item.childNodes).filter(node=>node!==marker));item.append(body);
        }
        ordinal++;
      }
      const width=Number(list.dataset.detailNumberTrack) || this.measureDetailOrdinalTrack(items.map(item=>item.querySelector(':scope > .xhs-module-ordinal')).filter(Boolean));
      list.dataset.detailNumberTrack=String(width);
      for (const item of items) {
        const continuing=item.hasAttribute('data-reading-continuation') && !item.querySelector(':scope > .xhs-module-ordinal');
        item.style.setProperty("--ordinal-width", `${continuing?0:width}px`);
        item.style.removeProperty('--ordinal-padding');
      }
    }
  }

  measureDetailOrdinalTrack(markers) {
    const system=this.getDetailDesignSystem();
    const widths=markers.map(marker=>{
      const range=document.createRange();range.selectNodeContents(marker);
      const card=marker.closest(".xhs-card"),scale=card?this.getCardScale(card):1;
      const width=range.getBoundingClientRect().width/scale;if(width)return width;
      const style=getComputedStyle(marker),context=document.createElement('canvas').getContext('2d');
      if(!context)return system.cardTokens['ordinal-min'];
      context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return context.measureText(marker.textContent).width;
    });
    return Math.max(system.cardTokens['ordinal-min'],Math.ceil(Math.max(0,...widths)/system.unit)*system.unit);
  }

  fitDefaultDetailMedia(host,card) {
    const wraps=Array.from(card.querySelectorAll(".xhs-detail-image-wrap"));
    if(wraps.length!==1)return;
    const wrap=wraps[0],slot=wrap._xhsDetailImageSlot,layout=wrap._xhsDetailLayout;
    const saved=this.config.detail_image_layouts?.[wrap.dataset.detailImageKey];
    const token=slot?._xhsDetailTokens?.[0];
    if(!slot || !layout?.aspectRatio || saved?.adjusted || saved?.w || token?.width
      || this.config.detail_image_width!==DEFAULT_CONFIG.detail_image_width
      || wrap.dataset.detailInline==="1")return;
    const bottom=card.querySelector(".xhs-detail-scroll-root").getBoundingClientRect().bottom;
    const last=host.lastElementChild?.getBoundingClientRect().bottom || 0;
    const overflow=(last-bottom)/this.getCardScale(card)+this.getDetailDesignSystem().unit*4;
    const height=layout.h-overflow;
    // Only rebalance a near-fitting page; never make a large document image a thumbnail.
    if(overflow<=0 || height<Math.max(320,layout.h*.6))return;
    layout.w=Math.floor(layout.w*height/layout.h);
    this.applyDetailImageLayout(wrap,wrap.querySelector("img"),layout);
    slot.dataset.detailAutoWidth=String(layout.w);
  }

  getDetailListTitle(item) {
    const first=item.firstElementChild;
    const title=first?.tagName==="P"?first.firstElementChild:first;
    if(!title || !title.matches("strong,h1,h2,h3,h4,h5,h6"))return null;
    const before=Array.from((first.tagName==="P"?first:item).childNodes);
    if(before.slice(0,before.indexOf(title)).some(node=>node.textContent.trim()))return null;
    return item.textContent.trim().length>title.textContent.trim().length?title:null;
  }

  suppressDetailTitleBoundaryBreak(body) {
    let first=Array.from(body.childNodes).find(node=>node.textContent.trim() || node.nodeName==="BR" || node.nodeName==="P");
    if(first?.nodeName==="P")first=Array.from(first.childNodes).find(node=>node.textContent.trim() || node.nodeName==="BR");
    if(first?.nodeName==="BR")first.classList.add("xhs-layout-boundary-break");
  }

  classifyDetailModule(nodes) {
    if(nodes.length===2 && this.isDetailParagraphLabel(nodes[0])
      && nodes[1].matches("[data-detail-image-slot],.xhs-detail-media-group,.xhs-detail-image-row,figure"))return "figure";
    const nonHeadings=nodes.filter(node=>!/^H[1-6]$/.test(node.tagName));
    if(this.isDetailMediaLead(nonHeadings[0],nonHeadings[1]) || this.isDetailStepFigure(nodes))return 'figure';
    if(nonHeadings.length===2 && this.isDetailModuleLead(nonHeadings[0],nonHeadings[1]))return this.classifyDetailModule([nonHeadings[1]]);
    const body=nodes.find(node=>!/^H[1-6]$/.test(node.tagName));
    if(!body)return "chapter";
    if(body.matches(".callout"))return "callout";
    if(body.tagName==="BLOCKQUOTE")return "quote";
    if(body.matches("table,.table-wrapper"))return "table";
    if(body.tagName==="PRE")return "code";
    if(body.matches("ul,ol")) {
      const items=Array.from(body.children).filter(node=>node.tagName==="LI");
      if(items.some(item=>item.matches(".task-list-item") || item.querySelector(":scope > input[type=checkbox]")))return "checklist";
      if(body.tagName==="OL")return "steps";
      return items.length>=2 && items.every(item=>this.getDetailListTitle(item))?"categories":"list";
    }
    if(body.matches(".internal-embed:not(.image-embed)") || body.querySelector(".internal-embed:not(.image-embed)"))return "native";
    if(body.matches("[data-detail-image-slot],.xhs-detail-media-group,.xhs-detail-image-row,figure")
      || (body.tagName==="P" && body.querySelector("img,.image-embed") && !body.textContent.trim()))return "figure";
    if(body.matches(".math,.math-block,iframe,video,audio,.internal-embed,.mermaid") || body.querySelector(".math-block,.mermaid"))return "native";
    return "chapter";
  }

  isDetailParagraphLabel(node) {
    return node?.tagName==="P" && node.children.length===1 && node.firstElementChild.matches("strong,b")
      && Boolean(node.textContent.trim()) && node.textContent.trim()===node.firstElementChild.textContent.trim();
  }

  isDetailReadingCardTitle(node) {
    return this.isDetailParagraphLabel(node)
      && !/[。！？；.!?;：:][”’"'」』）)\]]*$/.test(node.textContent.trim());
  }

  isDetailStepFigure(nodes) {
    const [heading, ...body]=nodes;
    if(!heading?.matches('h3,h4,h5,h6'))return false;
    const media=body.findIndex(node=>node.matches('.xhs-detail-media-group,.xhs-detail-image-row,[data-detail-image-slot],figure'));
    return media>=0 && body.slice(0,media).every(node=>node.tagName==='P')
      && body.slice(media+1).every(node=>node.matches('figcaption,.xhs-figure-source'));
  }

  isDetailMediaLead(node, next) {
    if(node?.tagName!=='P' || !next?.matches('[data-detail-image-slot],.xhs-detail-media-group,.xhs-detail-image-row,figure'))return false;
    const text=node.textContent.trim();
    return this.isDetailReadingCardTitle(node) || /[:：]$/.test(text)
      || /^(?:第[一二三四五六七八九十\d]+步|步骤\s*\d+|\d+(?:[、)]|\.(?!\d)))\s*\S/.test(text);
  }

  isDetailModuleLead(node, next) {
    if(node?.tagName!=='P' || !next?.matches('ul,ol,table,pre,blockquote,.callout'))return false;
    return this.isDetailReadingCardTitle(node)
      || (/[:：]$/.test(node.textContent.trim()) && (next.matches('ul,ol') || this.isDetailParagraphLabel(node)));
  }

  normalizeDetailDeclarations(host) {
    const references=this.getDetailReferenceRules();
    const types={reading:"chapter",article:"chapter",steps:"steps",categories:"categories",matrix:"list",
      ...Object.fromEntries(Object.keys(references).map(name=>[name,'native']))};
    for(const callout of Array.from(host.querySelectorAll('.callout[data-callout^="xhs-"]'))) {
      const name=callout.dataset.callout.slice(4),type=types[name];
      if(!type)throw new Error(`未知详情页模块声明：xhs-${name}`);
      if(callout.parentElement!==host)throw new Error("详情页模块声明不能嵌套，请把声明放在文档顶层");
      const content=callout.querySelector(':scope > .callout-content');
      const nodes=Array.from(content?.children || []);
      const fail=message=>{throw new Error(`xhs-${name}：${message}`);};
      if(!nodes.length)fail("模块正文不能为空");
      if(references[name]) {
        this.validateDetailReferenceContent(name,nodes);
      } else if(name==='reading' || name==='article') {
        if(nodes.some(node=>!node.matches('p') || node.querySelector('img,.internal-embed,.math-block')))fail("正文只能包含文本段落；标题写在声明行，列表、图片或表格请使用对应模块");
      } else {
        const tag=name==='steps'?'OL':'UL';
        if(nodes.length!==1 || nodes[0].tagName!==tag)fail(`正文必须是一个${tag==='OL'?'有序':'无序'}列表`);
        const items=Array.from(nodes[0].children);
        if(!items.length)fail("列表不能为空");
        if(name==='categories' && !items.every(item=>this.getDetailListTitle(item)))fail("每项必须以加粗标题开头，并包含所属正文");
        if(name==='matrix' && items.some(item=>item.querySelector('ul,ol,pre,table,img,.callout,input[type=checkbox]')))fail("矩阵项目只支持文本段落，不支持嵌套列表、媒体或专业块");
        if(name==='steps' && items.some(item=>item.querySelector('input[type=checkbox]')))fail("任务清单不能声明为步骤");
      }
      const declared=document.createElement('div');
      declared.dataset.detailDeclared=name;declared.dataset.detailDeclaredType=type;
      if(callout.dataset.detailBackground)declared.dataset.detailBackground=callout.dataset.detailBackground;
      const sourceTitle=callout.querySelector(':scope > .callout-title .callout-title-inner');
      if(sourceTitle?.textContent.trim()) {
        const title=document.createElement(name==='reading'?'p':references[name]?'h2':'h3');
        if(name==='reading') {
          const strong=document.createElement('strong');strong.append(...Array.from(sourceTitle.childNodes));title.append(strong);
        } else title.append(...Array.from(sourceTitle.childNodes));
        declared.append(title);
      }
      if(name==='reading' && !declared.children.length)fail("请提供卡片标题");
      declared.append(...nodes);callout.replaceWith(declared);
    }
  }

  detailContentSignature(hosts) {
    // Compare formatted text runs, links and media IDs; ignore pagination-only repeated headers.
    const runs=[];
    const add=(text,marks)=>{
      if(!text)return;
      const last=runs[runs.length-1];
      if(last?.marks===marks)last.text+=text;else runs.push({text,marks});
    };
    const visit=(node,marks="")=>{
      if(node.nodeType===3){
        if(!node.nodeValue.trim() && /[\r\n]/.test(node.nodeValue)
          && node.parentElement?.matches("div,section,blockquote,li,ul,ol,table,thead,tbody,tr"))return;
        add(marks.includes("code")?node.nodeValue:node.nodeValue.replace(/\s+/g," "),marks);return;
      }
      if(node.nodeType!==1 || node.hasAttribute("data-reading-repeat") || node.hasAttribute("data-reading-generated"))return;
      if(node.hasAttribute("data-detail-image-slot")){add(node.getAttribute("data-detail-image-slot"),"image-slot");return;}
      if(node.tagName==="IMG"){add(node.getAttribute("src") || "",`image:${node.getAttribute("alt") || ""}`);return;}
      if(["IFRAME","VIDEO","AUDIO"].includes(node.tagName))add(node.getAttribute("src") || node.outerHTML,"embed");
      if(["STRONG","B","EM","I","MARK","CODE","DEL","S"].includes(node.tagName))marks+=`/${node.tagName.toLowerCase()}`;
      if(node.tagName==="A")marks+=`/link:${node.getAttribute("href") || ""}`;
      if(node.tagName==="LI" && node.dataset.detailItem)marks+=`/item:${node.dataset.detailItem}/ordinal:${node.dataset.detailOrdinal || ""}`;
      if(node.matches("td,th") && node.dataset.detailCell)marks+=`/cell:${node.dataset.detailCell}`;
      if(node.tagName==="INPUT" && node.type==="checkbox")add(String(node.checked),`${marks}/task`);
      if(node.tagName==="BR")add("\n",`${marks}/break`);
      for(const child of node.childNodes)visit(child,marks);
    };
    for(const host of hosts)visit(host);
    return JSON.stringify(runs);
  }

  normalizeFlatDetailGroups(host) {
    // Explicit bold H4 titles select cards; ordinary headings always remain chapters.
    const parse=title=>{
      if(title?.tagName!=='H4')return null;
      const strong=title.querySelector(':scope > strong');
      if(!strong || title.children.length!==1 || !strong.textContent.trim())return null;
      const before=Array.from(title.childNodes).slice(0,Array.from(title.childNodes).indexOf(strong)).map(n=>n.textContent).join('');
      const after=Array.from(title.childNodes).slice(Array.from(title.childNodes).indexOf(strong)+1).map(n=>n.textContent).join('');
      if(after.trim())return null;
      const numbered=before.trim().match(/^(\d+)[.、]$/);
      if(before.trim() && !numbered)return null;
      return {title,strong,number:numbered?numbered[1]:null};
    };
    const nodes=Array.from(host.children);
    for(let i=0;i<nodes.length;) {
      if(!parse(nodes[i])){i++;continue;}
      const items=[];let cursor=i;
      while(parse(nodes[cursor])) {
        const entry=parse(nodes[cursor]),body=[];let end=cursor+1;
        while(nodes[end]?.matches('p,ul,ol') && !nodes[end].querySelector('img,.internal-embed,input,table,pre,.callout'))body.push(nodes[end++]);
        const lists=body.filter(n=>n.matches('ul,ol'));
        const kind=body.length && !lists.length?'prose':lists.length===1?'list':null;
        if(!kind || lists.some(l=>l.querySelector('ul,ol')))break;
        if(items.length && (items[0].kind!==kind || Boolean(items[0].number)!==Boolean(entry.number)))break;
        items.push({...entry,body,kind});cursor=end;
      }
      if(!items.length){i++;continue;}
      const list=document.createElement(items[0].number?'ol':'ul');
      if(items[0].number)list.setAttribute('start',items[0].number);
      items[0].title.before(list);
      for(const item of items){const li=document.createElement('li'),p=document.createElement('p');
        if(item.number)li.setAttribute('value',item.number);
        p.append(item.strong);li.append(p,...item.body);list.append(li);item.title.remove();
      }
      i=cursor;
    }
  }

  composeModularDetail(host,card) {
    const registry=this.getDetailModuleRegistry();
    if(host.querySelector(":scope > [data-detail-module],:scope > [data-detail-composition]")) {
      // Paginated HTML already carries measured tracks; reflow would invalidate its page bounds.
      return;
    }
    this.normalizeDetailDeclarations(host);
    this.normalizeFlatDetailGroups(host);
    host.querySelectorAll(".xhs-reading-label").forEach(node=>node.classList.remove("xhs-reading-label"));
    // Obsidian emits BR plus a source newline; pre-wrap must not render both as breaks.
    for(const br of host.querySelectorAll("br")) {
      const text=br.nextSibling;
      if(br.closest("pre,code") || text?.nodeType!==3 || !/^\r?\n/.test(text.nodeValue))continue;
      const length=text.nodeValue.startsWith("\r\n")?2:1;
      text.splitText(length);
      const delimiter=document.createElement("span");delimiter.className="xhs-hard-break-source";
      text.replaceWith(delimiter);delimiter.append(text);
    }
    for(const callout of host.querySelectorAll(".callout")) {
      callout.classList.remove("is-collapsed");
      const content=callout.querySelector(":scope > .callout-content");
      if(content) {content.style.removeProperty("display");content.style.removeProperty("height");}
    }
    // Native Markdown rendering is authoritative for list ownership, including continuation paragraphs.
    let itemSequence=0;
    for(const list of host.querySelectorAll("ol,ul")) {
      let number=list.hasAttribute("start")?Number(list.getAttribute("start")):1;
      const direction=list.hasAttribute("reversed")?-1:1;
      if(list.hasAttribute("reversed") && !list.hasAttribute("start"))number=list.children.length;
      for(const item of Array.from(list.children).filter(node=>node.tagName==="LI")) {
        item.dataset.detailItem=String(itemSequence++);
        if(item.hasAttribute("value"))number=Number(item.getAttribute("value"));
        if(list.tagName==="OL")item.dataset.detailOrdinal=String(number);
        number+=direction;
      }
    }
    Array.from(host.querySelectorAll("table")).forEach((table,index)=>{
      Array.from(table.rows).forEach((row,rowIndex)=>Array.from(row.cells).forEach((cell,cellIndex)=>{
        cell.dataset.detailCell=`${index}.${rowIndex}.${cellIndex}`;
      }));
    });
    const signature=this.detailContentSignature([host]);
    const nodes=Array.from(host.children);let current=null,sequence=0;
    const start=()=>{current=document.createElement("section");current.className="xhs-detail-module";
      current.dataset.detailSource=String(sequence++);host.append(current);};
    for(const [index,node] of nodes.entries()) {
      if(node.dataset.detailDeclared) {
        start();current.dataset.detailDeclared=node.dataset.detailDeclared;
        current.dataset.detailDeclaredType=node.dataset.detailDeclaredType;
        if(node.dataset.detailBackground)current.dataset.detailBackground=node.dataset.detailBackground;
        current.append(...Array.from(node.children));node.remove();current=null;continue;
      }
      if(node.tagName==="HR") {host.append(node);current=null;continue;}
      const previous=host.lastElementChild;
      if(node.tagName==='P' && node.children.length===1 && node.firstElementChild.matches('em')
        && node.textContent.trim()===node.firstElementChild.textContent.trim()
        && previous?.querySelector('[data-detail-image-slot],.xhs-detail-media-group,.xhs-detail-image-row,figure')) {
        node.classList.add('xhs-figure-source');previous.append(node);current=null;continue;
      }
      const heading=/^H[1-6]$/.test(node.tagName);
      const next=nodes[index+1];
      const label=this.isDetailReadingCardTitle(node) || this.isDetailModuleLead(node,next) || this.isDetailMediaLead(node,next);
      const ownsMediaLabel=current && this.isDetailMediaLead(current.lastElementChild,node)
        && Array.from(current.children).every(child=>/^H[1-6]$/.test(child.tagName) || child===current.lastElementChild)
        && node.matches("[data-detail-image-slot],.xhs-detail-media-group,.xhs-detail-image-row,figure");
      const ownsStepFigure=current && this.isDetailStepFigure([...current.children,node]);
      const ownsModuleLabel=current && this.isDetailModuleLead(current.lastElementChild,node)
        && Array.from(current.children).every(child=>/^H[1-6]$/.test(child.tagName) || child===current.lastElementChild);
      const onlyHeading=current && Array.from(current.children).every(child=>/^H[1-6]$/.test(child.tagName));
      const consecutiveParagraph=node.tagName==="P" && current?.lastElementChild?.tagName==="P"
        && Array.from(current.children).every(child=>/^H[1-6]$/.test(child.tagName) || child.tagName==="P")
        && !current.querySelector("img,.internal-embed,.math-block")
        && !node.querySelector("img,.internal-embed,.math-block");
      if(!current || heading || (label && current.querySelector("p") && !ownsStepFigure)
        || (!ownsMediaLabel && !ownsStepFigure && !ownsModuleLabel && !onlyHeading && !consecutiveParagraph))start();
      current.append(node);
      if(!heading && node.tagName!=="P")current=null;
    }
    let contextHeading="",contextTitle="";
    for(const module of host.querySelectorAll(":scope > .xhs-detail-module")) {
      const heading=module.querySelector(":scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6");
      if(heading){contextHeading=heading.outerHTML;contextTitle=heading.textContent.trim();}
      if(contextHeading){module.dataset.detailContextHeading=contextHeading;module.dataset.detailContextTitle=contextTitle;}
      const type=module.dataset.detailDeclaredType || this.classifyDetailModule(Array.from(module.children));
      module.dataset.detailModule=type;module.dataset.detailComposition=registry[type].composition;
      module.dataset.detailDesign=registry[type].design;
      this.composeDetailEditorialModule(module);
      const label=module.querySelector('.xhs-module-prose-label');
      if(label)module.dataset.detailContextLabel=label.outerHTML;
    }
    // Record source adjacency before pagination splits or moves modules.
    for(const heading of host.querySelectorAll(":scope > .xhs-detail-module > :is(h1,h2)")) {
      const module=heading.parentElement;
      const next=heading.nextElementSibling;
      const followedByCard=next
        ?next.matches("table,.table-wrapper,blockquote,.callout,.xhs-detail-callout,pre,ul,ol")
        :module.nextElementSibling?.matches('[data-detail-module]:is([data-detail-reference],[data-detail-variant="labelled-prose"],[data-detail-module="table"],[data-detail-module="quote"],[data-detail-module="callout"],[data-detail-module="code"],[data-detail-module="steps"],[data-detail-module="categories"],[data-detail-module="checklist"],[data-detail-module="list"])');
      if(followedByCard)heading.dataset.detailBeforeCard="true";
    }
    this.fitModularColumns(host);
    this.fitDetailRecordLayouts(host,card);
    this.markDetailStyleStructure(host, card);
    this.fitDetailReferenceLayouts(host,card);
    if(signature!==this.detailContentSignature([host]))throw new Error("模块编排内容核对失败，已停止转换");
    card.dataset.detailComposition=Array.from(host.children,node=>node.dataset.detailComposition || "heading").join(" ");
  }

  composeDetailEditorialModule(module) {
    const pattern=!module.dataset.detailDeclared && this.matchDetailMarkdownStructure(module);
    if(pattern) {
      module.dataset.detailReference=pattern;module.dataset.detailMatch='markdown-structure';module.dataset.detailModule='native';
      if(module.querySelector(':scope > table,:scope > .table-wrapper > table'))this.composeDetailReferenceTableModule(module);
      else this.composeDetailReferenceModule(module);
      return;
    }
    if(this.getDetailReferenceRules()[module.dataset.detailDeclared]) {
      this.composeDetailReferenceModule(module);return;
    }
    const heading=module.querySelector(":scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6");
    if(heading)module.dataset.detailHeadingLevel=heading.tagName.slice(1);
    const paragraphs=Array.from(module.children).filter(node=>node!==heading);
    const label=module.firstElementChild;
    if(this.isDetailParagraphLabel(label) && module.children.length===2 && module.dataset.detailModule!=="chapter" && module.dataset.detailModule!=="figure")label.classList.add("xhs-module-group-label");
    if(module.dataset.detailModule==="table")this.composeDetailTableRows(module);
    if(module.dataset.detailModule==="code") {
      for(const pre of module.querySelectorAll("pre")) {
        const code=pre.querySelector("code");
        const language=Array.from(code?.classList || []).find(name=>name.startsWith("language-"));
        if(language)pre.dataset.detailLanguage=language.slice(9);
      }
    }
    if(module.dataset.detailModule==="chapter" && paragraphs.length
      && paragraphs.every(node=>node.tagName==="P")) {
      module.dataset.detailVariant=heading?"chapter-reading":"prose-reading";
      if(!heading)module.dataset.detailDesign="paragraph-reading";
      const content=document.createElement("div");content.className="xhs-module-chapter-body";
      content.append(...paragraphs);module.append(content);
      const label=!heading && (module.dataset.detailDeclared==='reading' || this.isDetailReadingCardTitle(paragraphs[0]));
      if(label) {
        paragraphs[0].classList.add("xhs-module-prose-label");
        module.dataset.detailVariant=paragraphs.length===1?"standalone-label":"labelled-prose";
        module.dataset.detailDesign="labelled-reading";
      }
      if(paragraphs.length>1 && !label)module.classList.add("xhs-module-reading-sequence");
      for(const paragraph of paragraphs)paragraph.classList.add("xhs-module-reading-paragraph");
    }
    if(module.dataset.detailModule==="figure") {
      const label=Array.from(module.children).find(node=>this.isDetailMediaLead(node,node.nextElementSibling));
      if(label)label.classList.add("xhs-module-media-label");
    }
    const list=module.querySelector(":scope > ul,:scope > ol");
    if(!list)return;
    list.dataset.detailSemanticGroup=module.dataset.detailSource;
    const items=Array.from(list.children).filter(node=>node.tagName==="LI");
    if(module.dataset.detailModule==="checklist") {list.classList.add("xhs-module-checklist");return;}
    if(module.dataset.detailModule==="steps") {
      list.classList.add("xhs-module-number-list");
      for(const item of items) {
        const title=this.getDetailListTitle(item);
        if(title) {
          const body=document.createElement("div");body.className="xhs-module-item-body";
          const titleWrap=document.createElement("div");titleWrap.className="xhs-module-item-title";
          // Keep the original node order and inline formatting; only introduce layout wrappers.
          const first=item.firstElementChild;
          if(first.tagName==="P" && first.textContent.trim()===title.textContent.trim())titleWrap.append(first);
          else {
            const following=title.nextSibling;
            const punctuation=following?.nodeType===3?following.nodeValue.match(/^[ \t]*[：:]/):null;
            titleWrap.append(title);
            if(punctuation) {following.splitText(punctuation[0].length);titleWrap.append(following);}
          }
          body.append(...Array.from(item.childNodes));item.append(titleWrap,body);
          this.suppressDetailTitleBoundaryBreak(body);
          item.classList.add("is-titled-item");
        }
        const marker=document.createElement("span");marker.className="xhs-module-ordinal";
        marker.dataset.readingGenerated="ordinal";marker.setAttribute("aria-hidden","true");
        marker.textContent=item.dataset.detailOrdinal;item.prepend(marker);
      }
      return;
    }
    const simple=(module.dataset.detailDeclared==='matrix' || items.length>=2) && items.every(item=>!item.querySelector("ul,ol,pre,table,img,.callout"));
    if(module.dataset.detailModule==="categories") {
      list.classList.add("xhs-module-category-list");
      for(const item of items) {
        const title=this.getDetailListTitle(item);
        if(!title)continue;
        if(title.textContent.length>24)item.classList.add("is-stacked-title");
        const wrapper=document.createElement("div");wrapper.className="xhs-module-item-heading";
        const following=title.nextSibling;
        const punctuation=following?.nodeType===3?following.nodeValue.match(/^[ \t]*[：:]/):null;
        const first=item.firstElementChild;
        if(first.tagName==="P" && first.textContent.trim()===title.textContent.trim())wrapper.append(first);
        else wrapper.append(title);
        if(punctuation) {
          following.splitText(punctuation[0].length);wrapper.append(following);
        }
        const body=document.createElement("div");body.className="xhs-module-item-body";
        body.append(...Array.from(item.childNodes));item.append(wrapper,body);
        this.suppressDetailTitleBoundaryBreak(body);
      }
      list.classList.add("is-single-column");
    } else if(simple || (items.length===1 && items.every(item=>!item.querySelector('ul,ol,pre,table,img,.callout')))) {
      if(!module.dataset.detailDeclared && !list.dataset.detailColumns && !list.closest('[data-detail-background]') && !items.some(item=>item.dataset.detailBackground)) {
        list.classList.add('xhs-continuous-list');
        this.assignDetailCardRows(items,items.map(()=>true));
      }
      module.dataset.detailVariant="matrix";list.classList.add("xhs-module-plain-matrix");
      for(const item of items) {
        const marker=document.createElement("span");marker.className="xhs-module-bullet";
        marker.dataset.readingGenerated="bullet";marker.setAttribute("aria-hidden","true");
        marker.textContent="\u2022";item.prepend(marker);
      }
    } else {
      list.classList.add("xhs-module-nested-list");
      module.dataset.detailDesign="hierarchy-list";
      for(const item of items) {
        if(!item.querySelector("ul,ol,pre,table,.callout") && !this.getDetailListTitle(item)) {
          item.classList.add("is-plain-reading-item");
          continue;
        }
        const header=document.createElement("div");header.className="xhs-module-parent-heading";
        const first=item.firstElementChild;
        if(first?.tagName==="P")header.append(first);
        else {
          while(item.firstChild && !["UL","OL","PRE","TABLE"].includes(item.firstChild.nodeName)) {
            header.append(item.firstChild);
          }
        }
        if(header.childNodes.length)item.prepend(header);
      }
    }
  }

  composeDetailReferenceModule(module) {
    const name=module.dataset.detailReference || module.dataset.detailDeclared,list=module.querySelector(':scope > ul,:scope > ol');
    module.dataset.detailReference=name;module.dataset.detailVariant=`reference-${name}`;
    module.dataset.detailReferenceName=this.getDetailReferenceRules()[name].name;
    module.dataset.detailComposition=`reference-${name}`;module.dataset.detailDesign=`reference-${name}`;
    module.classList.add('xhs-reference-module');
    module.querySelector(':scope > h2,:scope > h3')?.classList.add('xhs-reference-heading');
    const children=Array.from(module.children),position=children.indexOf(list);
    children.slice(0,position).filter(node=>node.tagName==='P').forEach(node=>node.classList.add('xhs-reference-intro'));
    const trailing=children.slice(position+1);
    if(trailing.length) {
      const summary=document.createElement('div');summary.className='xhs-reference-summary';
      summary.append(...trailing);module.append(summary);
    }
    list.classList.add('xhs-reference-list');
    for(const item of list.children) {
      item.classList.add('xhs-reference-item');item.dataset.detailReferenceItem=name;
      if(name==='metrics' || name==='attributes') {
        const fields=Array.from(item.children);
        fields[0].classList.add('xhs-reference-item-title');
        if(name==='metrics') {
          fields[1].classList.add('xhs-reference-value');fields[2].classList.add('xhs-reference-note');
        } else {
          fields[1].classList.add('xhs-reference-description');fields[2].classList.add('xhs-reference-value');fields[3].classList.add('xhs-reference-note');
        }
        fields[name==='metrics'?1:2].firstElementChild.classList.add('xhs-reference-key');
      } else {
        const title=this.getDetailListTitle(item),first=item.firstElementChild;
        const head=document.createElement('div');head.className='xhs-reference-item-title';
        if(first.tagName==='P' && first.textContent.trim()===title.textContent.trim())head.append(first);
        else {
          const following=title.nextSibling;
          const punctuation=following?.nodeType===3?following.nodeValue.match(/^[ \t]*[：:]/):null;
          head.append(title);
          if(punctuation){following.splitText(punctuation[0].length);head.append(following);}
        }
        const body=document.createElement('div');body.className='xhs-reference-body';
        body.append(...Array.from(item.childNodes));item.append(head,body);
        this.suppressDetailTitleBoundaryBreak(body);
        if(name==='tabs')item.classList.add('is-horizontal-tab');
      }
      if(list.tagName==='OL') {
        const ordinal=document.createElement('span');ordinal.className='xhs-reference-ordinal';
        ordinal.dataset.readingGenerated='ordinal';ordinal.setAttribute('aria-hidden','true');
        ordinal.textContent=item.dataset.detailOrdinal;item.prepend(ordinal);
      }
    }
  }

  splitDetailReferenceItem(node) {
    const title=node.querySelector(':scope > .xhs-reference-item-title');
    const ordinal=node.querySelector(':scope > .xhs-reference-ordinal');
    const body=node.querySelector(':scope > .xhs-reference-body');
    if(node.dataset.detailReferenceItem==='tabs' && title) {
      const limit=parseFloat(node.closest('[data-detail-reference]')?.style.getPropertyValue('--reference-tab-height')) || 640;
      if(title.scrollWidth>title.clientWidth+1 || title.getBoundingClientRect().height>limit+64) {
        const paragraph=document.createElement('p');paragraph.className='xhs-reference-tab-label';
        paragraph.append(...Array.from(title.childNodes,child=>child.cloneNode(true)));
        const parts=this.splitReadingElement(paragraph);
        if(parts.length>1)return parts.map((part,index)=>{
          const wrapper=node.cloneNode(false),label=title.cloneNode(false);label.append(...Array.from(part.childNodes));wrapper.append(label);
          if(index===parts.length-1 && body)wrapper.append(body.cloneNode(true));
          return wrapper;
        });
      }
    }
    let fields=body?Array.from(body.children):Array.from(node.children).filter(child=>child!==title && child!==ordinal);
    if(body && Array.from(body.childNodes).some(child=>child.nodeType===3 && child.textContent.trim())) {
      const paragraph=document.createElement('p');paragraph.append(...Array.from(body.childNodes,child=>child.cloneNode(true)));fields=[paragraph];
    }
    const pieces=fields.flatMap(field=>this.splitDetailReferenceField(field));
    if(pieces.length<2)return [node];
    return pieces.map((piece,index)=>{
      const wrapper=node.cloneNode(false),context=title?.cloneNode(true);
      if(ordinal && !index)wrapper.append(ordinal.cloneNode(true));
      if(context && !index)wrapper.append(context);
      if(body) {
        const content=body.cloneNode(false);content.append(piece.cloneNode(true));wrapper.append(content);
      } else {
        wrapper.append(piece.cloneNode(true));
      }
      if(index)wrapper.dataset.readingContinuation='true';
      return wrapper;
    });
  }

  mergeDetailReferenceFragments(host) {
    let previous=null;
    for(const node of Array.from(host.children)) {
      const before=previous?.querySelector(':scope > .xhs-reference-list');
      const after=node.querySelector(':scope > .xhs-reference-list');
      const fragment=Array.from(node.children).every(child=>child===after || child.hasAttribute('data-reading-repeat'));
      if(before && after && fragment && previous.dataset.detailReference===node.dataset.detailReference
        && previous.dataset.detailSource===node.dataset.detailSource) {
        before.append(...Array.from(after.children));node.remove();
      } else previous=node;
    }
    // Adjacent fragments of one source item share one frame on the same page.
    for(const group of host.querySelectorAll('.xhs-reference-list')) {
      let previousItem=null;
      for(const item of Array.from(group.children)) {
        if(previousItem && item.hasAttribute('data-reading-continuation')
          && item.dataset.detailItem!==undefined && item.dataset.detailItem===previousItem.dataset.detailItem) {
          for(const field of Array.from(item.children)) {
            const role=['body','description','value','note'].find(name=>field.classList.contains('xhs-reference-'+name));
            const existing=role && previousItem.querySelector(':scope > .xhs-reference-'+role);
            if(existing)existing.append(...Array.from(field.childNodes));else previousItem.append(field);
          }
          item.remove();
        } else previousItem=item;
      }
    }
  }

  splitDetailReferenceField(field) {
    if(field.tagName!=='TD')return this.splitReadingElement(field);
    const paragraph=document.createElement('p');paragraph.className=field.className;
    paragraph.append(...Array.from(field.childNodes,node=>node.cloneNode(true)));
    return this.splitReadingElement(paragraph).map(part=>{
      const cell=field.cloneNode(false);cell.append(...Array.from(part.childNodes));return cell;
    });
  }

  splitDetailReferenceTable(table) {
    const rows=table.querySelectorAll(':scope > tbody > tr');
    if(rows.length!==1)return [table];
    const parts=this.splitDetailReferenceItem(rows[0]);
    if(parts.length<2)return [table];
    table.dataset.readingTable=table.dataset.readingTable || String(this.readingTableSequence=(this.readingTableSequence || 0)+1);
    return parts.map((row,index)=>{
      const copy=table.cloneNode(true);copy.querySelector('tbody').replaceChildren(row);
      if(index){copy.querySelector('thead')?.remove();copy.dataset.readingContinuation='true';}return copy;
    });
  }

  composeDetailReferenceTableModule(module) {
    const name=module.dataset.detailReference,table=module.querySelector('table');
    module.dataset.detailVariant=`reference-${name}`;module.dataset.detailComposition=`reference-${name}`;
    module.dataset.detailDesign=`reference-${name}`;module.dataset.detailReferenceName=this.getDetailReferenceRules()[name].name;
    module.classList.add('xhs-reference-module');table.classList.add('xhs-reference-table');
    const header=table.querySelector(':scope > thead');
    if(header){header.hidden=true;header.dataset.detailHiddenHeader='true';}
    const schema=this.getDetailMarkdownTableSchema(table);
    const roles=schema?.name===name?schema.fields:name==='metrics'?['item-title','value','note']:['item-title','description','value','note'];
    const headers=Array.from(table.querySelectorAll(':scope > thead > tr > th'));
    for(const [rowIndex,row] of Array.from(table.querySelectorAll(':scope > tbody > tr')).entries()) {
      row.classList.add('xhs-reference-item');row.dataset.detailReferenceItem=name;
      row.dataset.detailReferenceRow=String(rowIndex);
      Array.from(row.cells).forEach((cell,index)=>{
        cell.classList.add(`xhs-reference-${roles[index] || 'extra'}`);cell.dataset.detailReferenceField=String(index);
        if(index>=roles.length) {
          const label=document.createElement('div');label.className='xhs-reference-extra-label';label.dataset.readingGenerated='field-label';
          label.append(...Array.from(headers[index].childNodes,node=>node.cloneNode(true)));cell.prepend(label);
        }
      });
      this.getDetailTableKey(row.cells[roles.indexOf('value')])?.classList.add('xhs-reference-key');
    }
  }

  joinDetailReferenceRows(before,after) {
    if(!before || before.dataset.detailReferenceRow!==after.dataset.detailReferenceRow || !after.hasAttribute('data-reading-continuation'))return false;
    for(const cell of Array.from(after.cells)) {
      const existing=Array.from(before.cells).find(item=>item.dataset.detailReferenceField===cell.dataset.detailReferenceField);
      if(!existing)before.append(cell);
      else if(cell.hasAttribute('data-reading-repeat'))continue;
      else if(existing.hasAttribute('data-reading-repeat'))existing.replaceWith(cell);
      else existing.append(...Array.from(cell.childNodes));
    }
    before.append(...Array.from(before.cells).sort((a,b)=>Number(a.dataset.detailReferenceField)-Number(b.dataset.detailReferenceField)));
    return true;
  }

  mergeDetailReferenceTables(host) {
    let previous=null;
    for(const node of Array.from(host.children)) {
      const before=previous?.querySelector('.xhs-reference-table'),after=node.querySelector('.xhs-reference-table');
      const root=after?.parentElement===node?after:after?.parentElement;
      const pure=Array.from(node.children).every(child=>child===root || child.hasAttribute('data-reading-repeat'));
      if(before && after && pure && after.dataset.readingTable && before.dataset.readingTable===after.dataset.readingTable
        && (after.dataset.readingContinuation || after.querySelector('thead')?.hasAttribute('data-reading-repeat'))
        && previous.dataset.detailSource===node.dataset.detailSource && previous.dataset.detailReference===node.dataset.detailReference) {
        const body=before.querySelector('tbody');
        for(const row of Array.from(after.querySelector('tbody').children)) {
          if(!this.joinDetailReferenceRows(body.lastElementChild,row))body.append(row);
        }
        node.remove();
      } else previous=node;
    }
  }

  composeDetailTableRows(module) {
    const table=module.querySelector("table");
    const headers=Array.from(table?.querySelectorAll(":scope > thead > tr > th") || []);
    const rows=Array.from(table?.querySelectorAll(":scope > tbody > tr") || []);
    if(headers.length<3 || !rows.length || table.querySelector("tfoot,colgroup:not([data-reading-columns]),table,ul,ol,pre,img,.callout,.math-block,iframe,video,audio")
      || Array.from(table.querySelectorAll("td,th")).some(cell=>cell.colSpan!==1 || cell.rowSpan!==1)
      || rows.some(row=>row.cells.length!==headers.length))return;
    table.classList.add("xhs-module-record-table");module.dataset.detailComposition="record-rows";
    for(const [rowIndex,row] of rows.entries()) {
      row.classList.add("xhs-table-record");
      row.dataset.readingRecord=String(rowIndex);
      Array.from(row.cells).forEach((cell,index)=>{
        cell.dataset.readingFieldRole=index===0?'title':'body';
        const label=document.createElement("div");label.className="xhs-table-field-label";
        label.dataset.readingGenerated="field-label";label.append(...Array.from(headers[index].childNodes,node=>node.cloneNode(true)));
        const value=document.createElement("div");value.className="xhs-table-field-value";
        value.append(...Array.from(cell.childNodes));cell.append(label,value);
      });
    }
  }

  fitDetailRecordLayouts(host,card) {
    const system=this.getDetailDesignSystem(),rules=this.getDetailLayoutRules(),scale=this.getCardScale(card);
    const root=card.querySelector('.xhs-detail-scroll-root');
    const capacity=(root?.getBoundingClientRect().height/scale || Number(this.config.xhs_height)-system.margin*2)-rules.capacityReserve;
    for(const table of host.querySelectorAll('table.xhs-module-record-table')) {
      if(table.dataset.detailRecordLayout)continue;
      table.dataset.detailRecordLayout='adaptive';
      const rows=Array.from(table.querySelectorAll(':scope > tbody > tr'));
      if(table.dataset.detailColumns==='1')this.assignDetailCardRows(rows,rows.map(()=>true));
      // Measure compact label/value lanes at the actual half-card width first.
      for(const row of rows) {
        for(const cell of row.querySelectorAll(':scope > td[data-reading-field-role="body"]')) {
          cell.classList.add('is-compact-field');
          const label=cell.querySelector('.xhs-table-field-label'),value=cell.querySelector('.xhs-table-field-value');
          const exceeds=(node,lines)=>{
            const style=getComputedStyle(node);
            return node.scrollWidth>node.clientWidth+1 || node.getBoundingClientRect().height/scale>parseFloat(style.lineHeight)*lines+1;
          };
          if(exceeds(label,1)||exceeds(value,2))cell.classList.remove('is-compact-field');
        }
        if(row.querySelector(':scope > td[data-reading-field-role="body"]:not(.is-compact-field)')) {
          row.querySelectorAll(':scope > td.is-compact-field').forEach(cell=>cell.classList.remove('is-compact-field'));
        }
        const labels=Array.from(row.querySelectorAll(':scope > td.is-compact-field > .xhs-table-field-label'));
        if(labels.length)row.style.setProperty('--detail-record-label-width',`${Math.max(...labels.map(label=>label.getBoundingClientRect().width/scale))}px`);
      }
      if(this.applyDetailCardColumns(rows,table.dataset.detailColumns,card))continue;
      const decisions=rows.map(row=>row.getBoundingClientRect().height/scale>capacity*rules.parallelHeightRatio ||
        Array.from(row.querySelectorAll('.xhs-table-field-label,.xhs-table-field-value')).some(field=>{
          const style=getComputedStyle(field),title=field.closest('[data-reading-field-role="title"]');
          const lines=field.classList.contains('xhs-table-field-label') || title?2:3;
          return field.scrollWidth>field.clientWidth+1 || field.getBoundingClientRect().height/scale>parseFloat(style.lineHeight)*lines+1;
        }));
      let rowIndex=0,pending=null;
      for(const [index,row]of rows.entries()) {
        row.classList.remove('is-reference-full');
        if(decisions[index]) {
          if(pending){pending.classList.add('is-reference-full');pending=null;rowIndex++;}
          row.classList.add('is-reference-full');row.dataset.detailCardRow=String(rowIndex++);
        } else {
          row.dataset.detailCardRow=String(rowIndex);
          if(pending){
            const heights=[pending,row].map(item=>{
              const cells=Array.from(item.cells);
              return (cells.at(-1).getBoundingClientRect().bottom-cells[0].getBoundingClientRect().top)/scale;
            });
            if(Math.max(...heights)-Math.min(...heights)>system.unit*6 && Math.max(...heights)>Math.min(...heights)*1.5) {
              pending.classList.add('is-reference-full');row.classList.add('is-reference-full');
              row.dataset.detailCardRow=String(++rowIndex);
            }
            pending=null;rowIndex++;
          }else pending=row;
        }
      }
      if(pending)pending.classList.add('is-reference-full');
    }
  }

  fitDetailReferenceLayouts(host,card) {
    const system=this.getDetailDesignSystem(),rules=this.getDetailLayoutRules(),scale=this.getCardScale(card);
    const root=card.querySelector('.xhs-detail-scroll-root');
    const capacity=(root?.getBoundingClientRect().height/scale || Number(this.config.xhs_height)-system.margin*2)-rules.capacityReserve;
    for(const module of host.querySelectorAll('[data-detail-reference]')) {
      if(module.dataset.detailReferenceLayout)continue;
      const name=module.dataset.detailReference;
      const group=module.querySelector(':scope > .xhs-reference-list,:scope > table > tbody,:scope > .table-wrapper > table > tbody');
      if(!group)continue;
      const items=Array.from(group.children);
      module.dataset.detailReferenceLayout='standard';
      if(name==='metrics') {
        module.dataset.detailReferenceColumns='2';
        group.removeAttribute('data-detail-equal-cards');group.style.removeProperty('--detail-equal-card-height');
        items.forEach(item=>item.classList.remove('is-reference-full'));
        if(this.applyDetailCardColumns(items,group.dataset.detailColumns || group.closest('table')?.dataset.detailColumns,card))continue;
        const exceeds=(node,lines)=>{
          if(!node)return false;
          const style=getComputedStyle(node),leading=parseFloat(style.lineHeight);
          return node.scrollWidth>node.clientWidth+1 || node.getBoundingClientRect().height/scale>leading*lines+1;
        };
        const full=items.map(item=>{
          const value=item.querySelector('.xhs-reference-value'),key=value?.querySelector('.xhs-reference-key');
          const valueLeading=Math.max(parseFloat(value && getComputedStyle(value).lineHeight)||0,parseFloat(key && getComputedStyle(key).lineHeight)||0);
          return exceeds(item.querySelector('.xhs-reference-item-title'),2)
            || exceeds(item.querySelector('.xhs-reference-note'),3)
            || (value && (value.scrollWidth>value.clientWidth+1 || value.getBoundingClientRect().height/scale>valueLeading*1.5+1))
            || item.getBoundingClientRect().height/scale>capacity*rules.parallelHeightRatio;
        });
        this.assignDetailCardRows(items,full);
      }
      if(name==='grid')this.fitDetailGridRows(module,group,card);
      if(name==='attributes') {
        const tooTall=(node,lines)=>{
          if(!node)return false;
          const style=getComputedStyle(node);
          return node.getBoundingClientRect().height/scale-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)>parseFloat(style.lineHeight)*lines+1;
        };
        for(const item of items) {
          const title=item.querySelector(':scope > .xhs-reference-item-title'),value=item.querySelector(':scope > .xhs-reference-value');
          item.style.setProperty('--reference-title-height',`${title?.getBoundingClientRect().height/scale || 0}px`);
          item.style.setProperty('--reference-value-height',`${value?.getBoundingClientRect().height/scale || 0}px`);
        }
        const stacked=items.map(item=>item.getBoundingClientRect().height/scale>capacity*rules.parallelHeightRatio
          || tooTall(item.querySelector(':scope > .xhs-reference-item-title'),rules.groupTitleLines)
          || tooTall(item.querySelector(':scope > .xhs-reference-value'),rules.valueLines)
          || tooTall(item.querySelector(':scope > .xhs-reference-description'),rules.descriptionLines)
          || tooTall(item.querySelector(':scope > .xhs-reference-note'),rules.noteLines));
        items.forEach((item,index)=>{if(stacked[index])item.dataset.detailItemLayout='stacked';});
        if(stacked.length && stacked.every(Boolean))module.dataset.detailReferenceLayout='stacked';
      }
      if(name==='courses') {
        const cap=group.clientWidth*.28,context=document.createElement('canvas').getContext('2d');
        // Measure actual text per block, never the total list height or stretched title box.
        const exceedsText=(node,lines)=>{
          if(!node || !node.textContent.trim())return false;
          const range=document.createRange();range.selectNodeContents(node);
          const leading=parseFloat(getComputedStyle(node.querySelector('p,li') || node).lineHeight) || system.body*VISUAL_RULES.bodyLeading;
          return node.scrollWidth>node.clientWidth+1 || range.getBoundingClientRect().height/scale>leading*lines+1;
        };
        const stacked=items.map(item=>{
          const title=item.querySelector(':scope > .xhs-reference-item-title'),body=item.querySelector(':scope > .xhs-reference-body');
          const blocks=body?Array.from(body.querySelectorAll(':scope > p,:scope > ul > li,:scope > ol > li')):[];
          return exceedsText(title,rules.groupTitleLines)
            || (blocks.length?blocks:body?[body]:[]).some(block=>exceedsText(block,rules.groupBodyLines));
        });
        const widths=items.flatMap((item,index)=>{
          if(stacked[index]){item.dataset.detailItemLayout='stacked';return [];}
          const title=item.querySelector(':scope > .xhs-reference-item-title');if(!title || !context)return [];
          const style=getComputedStyle(title);context.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
          return [context.measureText(title.textContent.trim()).width+system.cardTokens['column-gap']+(parseFloat(style.borderRightWidth)||0)+system.unit];
        });
        module.style.setProperty('--reference-course-title-track',Math.min(cap,Math.max(system.body*2,...widths))+'px');
        if(stacked.length && stacked.every(Boolean))module.dataset.detailReferenceLayout='stacked';
      }
      if(name==='tabs') {
        module.style.setProperty('--reference-tab-height',`${Math.max(rules.tabMinHeight,Math.floor(capacity*rules.tabHeightRatio/system.unit)*system.unit)}px`);
        const queue=Array.from(group.children);
        while(queue.length) {
          const item=queue.shift(),title=item.querySelector(':scope > .xhs-reference-item-title');
          if(!title || title.scrollWidth<=title.clientWidth+1)continue;
          const pieces=this.splitDetailReferenceItem(item);
          if(pieces.length>1){item.replaceWith(...pieces);queue.unshift(...pieces);}
        }
        this.alignDetailTabBodies(module,card);
      }
      // Reserve an actual track for source ordinals; never overlay text with a watermark.
      const ordinals=items.map(item=>item.querySelector(':scope > .xhs-reference-ordinal')).filter(Boolean);
      if(ordinals.length) {
        module.style.setProperty('--reference-ordinal-track',`${this.measureDetailOrdinalTrack(ordinals)}px`);
      }
    }
  }

  fitDetailGridRows(module,group,card) {
    const items=Array.from(group.children),rules=this.getDetailLayoutRules(),scale=this.getCardScale(card);
    module.dataset.detailReferenceColumns=items.length===1?'1':'2';
    group.removeAttribute('data-detail-equal-cards');group.style.removeProperty('--detail-equal-card-height');
    items.forEach(item=>item.classList.remove('is-reference-full'));
    if(this.applyDetailCardColumns(items,group.dataset.detailColumns,card))return;
    const exceeds=(node,lines)=>{
      if(!node)return false;
      const range=document.createRange();range.selectNodeContents(node);
      const line=parseFloat(getComputedStyle(node.querySelector('p,li') || node).lineHeight);
      return node.scrollWidth>node.clientWidth+1 || range.getBoundingClientRect().height/scale>line*lines+1;
    };
    // Decide every item at half width before any full-width item changes the grid tracks.
    const full=items.map(item=>exceeds(item.querySelector('.xhs-reference-item-title'),rules.gridTitleLines)
      || exceeds(item.querySelector('.xhs-reference-body'),rules.gridBodyLines));
    this.assignDetailCardRows(items,full);
  }

  applyDetailCardColumns(items,columns,card) {
    if(columns!=='1' && columns!=='2')return false;
    const root=card.querySelector('.xhs-detail-scroll-root');
    const scale=this.getCardScale(card);
    const limit=root
      ? root.getBoundingClientRect().height/scale-this.getDetailLayoutRules().capacityReserve
      : Infinity;
    // An oversized half-width card needs the existing full-width pagination path.
    this.assignDetailCardRows(items,items.map(item=>columns==='1' || item.getBoundingClientRect().height/scale>limit));
    return true;
  }

  assignDetailCardRows(items,full) {
    let row=0,pending=null;
    for(const [index,item] of items.entries()) {
      if(full[index]) {
        if(pending){pending.classList.add('is-reference-full');pending=null;row++;}
        item.classList.add('is-reference-full');item.dataset.detailCardRow=String(row++);
      } else {
        item.dataset.detailCardRow=String(row);
        if(pending){pending=null;row++;}else pending=item;
      }
    }
    if(pending)pending.classList.add('is-reference-full');
  }

  alignDetailTabBodies(module,card) {
    const scale=this.getCardScale(card);
    for(const body of module.querySelectorAll('.xhs-reference-body')) {
      body.classList.remove('is-single-line-body');
      if(!body.textContent.trim() || body.querySelector('ul,ol,table,pre,img,br'))continue;
      const range=document.createRange();range.selectNodeContents(body);
      const bounds=range.getBoundingClientRect();
      const line=parseFloat(getComputedStyle(body.querySelector('p') || body).lineHeight);
      if(Number.isFinite(line) && bounds.height<=line*scale+1)body.classList.add('is-single-line-body');
    }
  }

  equalizeDetailCardHeights(group,capacity) {
    const items=Array.from(group.children);
    if(items.length<2)return;
    const unit=this.getDetailDesignSystem().unit;
    const height=Math.ceil(Math.max(...items.map(item=>item.getBoundingClientRect().height))/unit)*unit;
    if(!height || height>capacity)return;
    group.dataset.detailEqualCards='true';
    group.style.setProperty('--detail-equal-card-height',`${height}px`);
  }

  fitModularColumns(host) {
    const unit=this.getDetailDesignSystem().unit;
    for(const paragraph of host.querySelectorAll('.xhs-module-reading-paragraph:not(.xhs-module-prose-label)')) {
      const line=parseFloat(getComputedStyle(paragraph).lineHeight);
      paragraph.classList.toggle('is-long-reading',paragraph.getBoundingClientRect().height>line*3);
    }
    const labelWidth=(title,total)=>{
      const style=getComputedStyle(title),context=document.createElement('canvas').getContext('2d');
      if(!context)return total*.25;
      context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return Math.min(total/3,Math.ceil(Math.max(total*.2,context.measureText(title.textContent.trim()).width+unit*6)/unit)*unit);
    };
    for(const module of host.querySelectorAll('[data-detail-variant="label-content"]')) {
      const title=module.querySelector(':scope > h3,:scope > h4,:scope > h5,:scope > h6');
      if(!title)continue;
      module.style.setProperty('--label-track',`${labelWidth(title,module.getBoundingClientRect().width)}px`);
      title.style.alignSelf='start';
      const style=getComputedStyle(title),line=parseFloat(style.lineHeight);
      module.classList.toggle('is-single-column',title.scrollWidth>title.clientWidth+1
        || title.getBoundingClientRect().height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)>line*2+1);
      title.style.removeProperty('align-self');
    }
    const limit=(Number(this.config.xhs_height)||VISUAL_RULES.height)-this.getDetailDesignSystem().margin*2;
    for(const item of host.querySelectorAll(".xhs-module-category-list > li")) {
      const title=item.querySelector(":scope > .xhs-module-item-heading");
      const body=item.querySelector(":scope > .xhs-module-item-body");
      if(!title || !body)continue;
      item.style.setProperty('--label-track',`${labelWidth(title,item.getBoundingClientRect().width)}px`);
      item.classList.remove("is-stacked-title");
      title.style.alignSelf="start";
      const style=getComputedStyle(title),line=parseFloat(style.lineHeight);
      const padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
      if(title.scrollWidth>title.clientWidth+1 || title.getBoundingClientRect().height-padding>line*2+1
        || body.getBoundingClientRect().height-padding>line*4+1)item.classList.add("is-stacked-title");
      title.style.removeProperty("align-self");
    }
    const alignTracks=nodes=>{
      const rows=Array.from(nodes).filter(node=>!node.classList.contains('is-single-column') && !node.classList.contains('is-stacked-title'));
      const width=Math.max(0,...rows.map(node=>parseFloat(node.style.getPropertyValue('--label-track'))||0));
      if(width)rows.forEach(node=>node.style.setProperty('--label-track',`${width}px`));
    };
    alignTracks(host.querySelectorAll('[data-detail-variant="label-content"]'));
    for(const group of host.querySelectorAll('.xhs-module-category-list'))alignTracks(group.children);
    for(const group of host.querySelectorAll(".xhs-module-category-list,.xhs-module-plain-matrix,[data-detail-variant='label-content']")) {
      delete group.dataset.detailEqualCards;
      group.style.removeProperty('--detail-equal-card-height');
      if(group.classList.contains('xhs-module-plain-matrix'))group.classList.remove('is-single-column');
      const children=group.matches("table")?Array.from(group.querySelectorAll("tbody > tr")):Array.from(group.children);
      if(group.matches("ul")) {
        const paired=group.classList.contains("xhs-module-plain-matrix") && group.hasAttribute("data-detail-semantic-group") && children.length>=2 && !group.classList.contains("xhs-continuous-list");
        group.dataset.detailMatrixRole="source-list-scan";
        group.style.setProperty("--editorial-columns",paired?"2":"1");
        group.classList.toggle("is-compact-grid",paired);
        if(paired) {
          const card=host.closest('.xhs-card'),scale=this.getCardScale(card),rules=this.getDetailLayoutRules();
          children.forEach(child=>{child.classList.remove('is-reference-full');child.style.removeProperty('min-height');});
          if(this.applyDetailCardColumns(children,group.dataset.detailColumns,card))continue;
          const full=children.map(child=>{
            const range=document.createRange();range.selectNodeContents(child);
            const line=parseFloat(getComputedStyle(child.querySelector('p') || child).lineHeight);
            return child.scrollWidth>child.clientWidth+2 || range.getBoundingClientRect().height/scale>line*rules.plainCardLines+1;
          });
          this.assignDetailCardRows(children,full);
        }
        if(group.classList.contains('xhs-module-plain-matrix'))continue;
      }
      if(children.some(child=>child.scrollWidth>child.clientWidth+2 || child.getBoundingClientRect().height>limit*.5))group.classList.add("is-single-column");
    }
  }

  allocateDetailTableColumns(host) {
    for (const table of host.querySelectorAll("table")) {
      const rows = Array.from(table.rows);
      const count = rows[0]?.cells.length || 0;
      if (count < 2 || rows.some(row => row.cells.length !== count
        || Array.from(row.cells).some(cell => cell.colSpan !== 1 || cell.rowSpan !== 1))) continue;
      // Keep author-provided column geometry; recalculate only plugin-owned spans.
      if (table.querySelector("colgroup:not([data-reading-columns])")) continue;
      const basis=`${this.getDetailDesignSystem().content}:${this.getDetailDesignSystem().body}`;
      if(table.dataset.readingColumnBasis===basis && table.querySelector('colgroup[data-reading-columns]'))continue;
      const lengths = Array.from({length:count}, (_, index) => rows.map(row => {
        const text = row.cells[index].textContent.trim();
        return Array.from(text).reduce((sum, char) => sum + (/[^\x00-\x7f]/.test(char) ? 1 : .55), 0);
      }));
      const scores = lengths.map(values => Math.max(1,
        values.reduce((sum, value) => sum + value, 0) / values.length));
      const comparable = Math.max(...scores) / Math.min(...scores) <= 1.6;
      let weights = comparable ? scores.map(() => 1) : scores.map(value => Math.sqrt(value));
      if (count === 2 && scores[0] <= 16 && scores[1] > scores[0] * 1.8) {
        const labelShare = Math.max(.2, Math.min(.35, scores[0] / (scores[0] + scores[1])));
        weights = [labelShare, 1 - labelShare];
      }
      const total = weights.reduce((sum, value) => sum + value, 0);
      const minimum = Math.min(.15, .6 / count);
      const remainder = 1 - minimum * count;
      const shares = weights.map(weight => minimum + remainder * weight / total);
      // Two-column field/description tables reserve 20-35% for the field label.
      if (count === 2 && scores[0] <= 16 && scores[1] > scores[0] * 1.8) {
        shares[0] = weights[0]; shares[1] = weights[1];
      }
      const width=table.getBoundingClientRect().width || this.getDetailDesignSystem().content;
      const style=getComputedStyle(rows[0].cells[0]),font=parseFloat(style.fontSize) || this.getDetailDesignSystem().body;
      const labelMinimum=font*4+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)
        +(parseFloat(style.borderLeftWidth)||0)+(parseFloat(style.borderRightWidth)||0)+this.getDetailDesignSystem().unit;
      if(count===2 && scores[0]<=16 && labelMinimum<width*.5 && shares[0]*width<labelMinimum) {
        shares[0]=labelMinimum/width;shares[1]=1-shares[0];
      }
      for(const row of rows) {
        const label=row.cells[0],short=count===2 && Array.from(label.textContent.trim()).length<=4;
        label.toggleAttribute('data-reading-short-label',short);
      }
      table.querySelectorAll("colgroup[data-reading-columns]").forEach(group => group.remove());
      const group = document.createElement("colgroup");
      group.dataset.readingColumns = "true";
      for (const share of shares) {
        const column = document.createElement("col"); column.style.width = `${share * 100}%`; group.append(column);
      }
      table.insertBefore(group, table.querySelector("thead,tbody,tfoot,tr"));
      table.dataset.readingColumnBasis=basis;
    }
  }

  auditDetailReadingFlow(content) {
    const issues = [];
    const system = this.getDetailDesignSystem();
    const font = Number(this.config.detail_font_size) || 30;
    const root = content.closest(".xhs-detail-scroll-root");
    const bounds = root?.getBoundingClientRect();
    const scale = this.getCardScale(content.closest(".xhs-card"));
    const headings = Array.from(content.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    for (const node of content.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,table,pre,.xhs-detail-image-slot")) {
      if (!node.getClientRects().length) continue;
      const rect = node.getBoundingClientRect();
      if (node.scrollWidth > node.clientWidth + 2 || (bounds && (rect.right > bounds.right + 2 || rect.left < bounds.left - 2)))
        issues.push({ type: "horizontal-overflow", element: node.tagName });
      if (bounds && rect.bottom > bounds.bottom + 2)
        issues.push({ type: "vertical-overflow", element: node.tagName });
      if (node.tagName === "TABLE" && Array.from(node.querySelectorAll("td,th"))
        .some(cell => {
          const auxiliary=node.classList.contains('xhs-reference-table') && (cell.tagName==='TH' || cell.classList.contains('xhs-reference-note'));
          return parseFloat(getComputedStyle(cell).fontSize)<(auxiliary?system.caption:font)-1;
        })) issues.push({ type: "small-table-text" });
      if (node.classList.contains("xhs-detail-image-slot") && rect.width / Math.max(.01, scale)
        < (node.classList.contains("is-inline") ? system.column : system.column * 2 + system.gutter) - 2)
        issues.push({ type: "small-image", width: Math.round(rect.width / Math.max(.01, scale)) });
    }
    const title = content.querySelector(".xhs-reading-title");
    const hierarchy = !title || headings.filter(heading => heading !== title).every(heading =>
      this.config.detail_page_type==="modular"
        ?parseFloat(getComputedStyle(title).fontSize)>=parseFloat(getComputedStyle(heading).fontSize)
        :parseFloat(getComputedStyle(title).fontSize)>parseFloat(getComputedStyle(heading).fontSize));
    const alignment = headings.every(heading => ["start", "left"].includes(getComputedStyle(heading).textAlign));
    const axis = content.getBoundingClientRect().left;
    const blockAlignment = Array.from(content.querySelector(".xhs-native-markdown-block")?.children || [])
      .filter(node => /^(H[1-6]|P|TABLE|PRE|BLOCKQUOTE)$/.test(node.tagName) || node.classList.contains("xhs-detail-media-group"))
      .every(node => Math.abs(node.getBoundingClientRect().left - axis) <= 2 * scale);
    const proximity = headings.every(heading => {
      if (!heading.previousElementSibling) return true;
      const style = getComputedStyle(heading);
      return parseFloat(style.marginTop) >= parseFloat(style.marginBottom) + system.unit * 2;
    });
    const luminance = color => {
      const channels = (color.match(/[\d.]+/g) || []).slice(0, 3).map(value => Number(value) / 255)
        .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return channels.length === 3 ? channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 : null;
    };
    const foreground = luminance(getComputedStyle(content).color);
    const backgroundNode = content.closest(".xhs-card")?.querySelector(".xhs-detail-bg");
    const background = backgroundNode ? luminance(getComputedStyle(backgroundNode).backgroundColor) : null;
    const contrastRatio = foreground != null && background != null
      ? (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) : null;
    const balance = !issues.some(issue => /overflow|small-image/.test(issue.type)) && headings.every(heading =>
      !bounds || heading.getBoundingClientRect().height <= bounds.height * .28);
    const rhythm = Number(this.config.detail_line_height) >= 1.45 && Number(this.config.detail_line_height) <= 1.65;
    const host = content.querySelector(".xhs-native-markdown-block");
    const blocks = Array.from(host?.children || []);
    const modular=this.config.detail_page_type==="modular";
    const pageEntry=!modular || host?.querySelectorAll(".xhs-reading-focus").length===1;
    const moduleRoles=!modular || Array.from(host?.querySelectorAll("[data-detail-module]") || []).every(node=>
      node.dataset.detailVisualStyle===this.getDetailVisualStyle(node.dataset.detailModule,node.dataset.detailVariant));
    const labelOwnership=!modular || Array.from(host?.querySelectorAll('[data-detail-visual-style="reading"] .xhs-module-prose-label') || [])
      .every(node=>Boolean(node.nextElementSibling?.textContent.trim()));
    const stepOwnership=!modular || Array.from(host?.querySelectorAll('.xhs-module-number-list > li.is-titled-item:not([data-reading-continuation])') || [])
      .every(node=>Boolean(node.querySelector(':scope > .xhs-module-item-title') && node.querySelector(':scope > .xhs-module-item-body')));
    const matrixOwnership=!modular || Array.from(host?.querySelectorAll('.xhs-module-plain-matrix.is-compact-grid') || []).every(list=>{
      const items=Array.from(list.children),rows=new Map();for(const item of items){const key=item.dataset.detailCardRow;const heights=rows.get(key)||[];heights.push(item.getBoundingClientRect().height);rows.set(key,heights);}
      return list.hasAttribute('data-detail-semantic-group') && items.every(item=>!item.querySelector('ul,ol,table,pre,.callout'))
        && Array.from(rows.values()).every(heights=>Math.max(...heights)-Math.min(...heights)<=2);
    });
    const continuationContext=!modular || Array.from(host?.querySelectorAll('[data-reading-context]') || [])
      .every(node=>node.hasAttribute('data-reading-repeat') && node.dataset.detailPageRole==='continuation');
    const recordEntry=!modular || Array.from(host?.querySelectorAll('.xhs-table-record > td[data-reading-field-role="title"] .xhs-table-field-value') || [])
      .every(node=>Math.abs(parseFloat(getComputedStyle(node).fontSize)-system.module)<1);
    const mediaLoaded=Array.from(content.closest('.xhs-card').querySelectorAll('.xhs-detail-image-wrap img'))
      .every(img=>img.complete && img.naturalWidth>0 && img.naturalHeight>0);
    const spans = [1, 2, 3, 4, 6].map(span => system.column * span + system.gutter * (span - 1));
    const grid = Math.abs(content.getBoundingClientRect().width / scale - system.content) <= 2
      && Array.from(content.closest(".xhs-card").querySelectorAll(".xhs-detail-image-wrap")).every(image =>
        this.config.detail_page_type==="modular"
          ? image.getBoundingClientRect().width/scale<=system.content+2
            && image.getBoundingClientRect().width/scale>=Math.min(80,system.content)-2
          : spans.some(width => Math.abs(image.getBoundingClientRect().width / scale - width) <= 2));
    const typography = blocks.filter(node => /^(P|UL|OL|TABLE)$/.test(node.tagName)).every(node =>
      Math.abs(parseFloat(getComputedStyle(node).fontSize) - system.body) < 1)
      && headings.every(heading => Math.abs(parseFloat(getComputedStyle(heading).fontSize)
        - this.getDetailHeadingSize(heading,system)) < 1);
    const spacing = blocks.every(node => ["marginTop", "marginBottom"].every(property => {
      const value = parseFloat(getComputedStyle(node)[property]) || 0;
      return Math.abs(value / system.unit - Math.round(value / system.unit)) < .05;
    }));
    const areas = blocks.map(node => {
      const rect = node.getBoundingClientRect();
      return { area: rect.width * rect.height, y: bounds ? ((rect.top + rect.bottom) / 2 - bounds.top) / bounds.height : 0 };
    });
    const area = areas.reduce((total, item) => total + item.area, 0);
    const density = bounds ? area / (bounds.width * bounds.height) : null;
    const centerY = area ? areas.reduce((total, item) => total + item.area * item.y, 0) / area : null;
    return { version: 4, issues,
      checks: { alignment: alignment && blockAlignment, hierarchy, proximity, contrast: contrastRatio == null ? null : contrastRatio >= 4.5,
        balance, rhythm, readableTables: !issues.some(issue => issue.type === "small-table-text"),
        unbrokenHeadings: headings.every(node => getComputedStyle(node).whiteSpace === "pre-wrap"),
        horizontalBounds: !issues.some(issue => issue.type === "horizontal-overflow"),
        exportBounds: !issues.some(issue => /overflow/.test(issue.type)), grid, typography, spacing,
        pageEntry,moduleRoles,labelOwnership,stepOwnership,matrixOwnership,continuationContext,recordEntry,mediaLoaded },
      designSystem: system,
      visualReview: { density, centerY, headingCount: headings.length,
        assignedFocus: host?.querySelector(".xhs-reading-focus")?.tagName || null,
        assignedFocusCount: host?.querySelectorAll(".xhs-reading-focus").length || 0,
        images: Array.from(content.closest(".xhs-card").querySelectorAll(".xhs-detail-image-wrap"), image => {
          const rect = image.getBoundingClientRect();
          return { width: rect.width / scale, height: rect.height / scale,
            areaShare: bounds ? rect.width * rect.height / (bounds.width * bounds.height) : null };
        }),
        requiresHumanReview: true, signals: [density < .3 ? "sparse-page" : density > .85 ? "dense-page" : null,
          centerY != null && (centerY < .25 || centerY > .65) ? "vertical-mass-imbalance" : null].filter(Boolean),
        note: "Geometry and line cadence are safeguards, not proof of semantic focus or aesthetic balance." },
      contrastRatio, manualReview: ["focal-priority", "visual-balance", "reading-rhythm"],
      criteria: ["alignment", "hierarchy", "proximity", "contrast", "balance", "rhythm"] };
  }

  createDetailStructure(tokens) {
    const sections = [];
    const stack = [];
    const blocks = tokens.map((token, index) => ({ id: `source-${index}`, index,
      type: token.type, token, parentId: null }));
    for (const block of blocks) {
      if (block.type === "heading") {
        while (stack.length && stack[stack.length - 1].level >= block.token.level) stack.pop();
        const section = { id: block.id, headingIndex: block.index, level: block.token.level,
          parentId: stack[stack.length - 1]?.id || null, body: [] };
        block.parentId = section.parentId;
        sections.push(section); stack.push(section);
      } else {
        block.parentId = stack[stack.length - 1]?.id || null;
        if (stack.length) stack[stack.length - 1].body.push(block.index);
      }
    }
    return { version: 2, blocks, sections };
  }

  planDetailComposition(structure) {
    const { blocks, sections } = structure;
    const first = blocks.find(block => block.type !== "spacer");
    const title = first?.type === "heading" && sections.every(section =>
      section.id === first.id || section.level > first.token.level) ? first.index : null;
    const modules = [];
    let current = null;
    for (const block of blocks) {
      if (block.type === "spacer") continue;
      if (block.index === title) {
        modules.push({ id: block.id, component: "hero", indices: [block.index] }); current = null;
      } else if (block.type === "heading") {
        current = { id: block.id, component: "article", headingIndex: block.index,
          parentId: block.parentId, level: block.token.level, indices: [block.index] };
        modules.push(current);
      } else if (["quote", "rule"].includes(block.type)) {
        modules.push({ id: block.id, component: block.type === "quote" ? "quote" : "divider",
          parentId: block.parentId, indices: [block.index] }); current = null;
      } else {
        if (!current) { current = { id: block.id, component: "article", parentId: block.parentId,
          indices: [] }; modules.push(current); }
        current.indices.push(block.index);
      }
    }
    for (const module of modules.filter(item => item.component === "article")) {
      const body = module.indices.filter(index => index !== module.headingIndex).map(index => blocks[index]);
      const textLength = body.reduce((sum, block) => sum + String(block.token.text || "").length
        + (block.token.items || []).reduce((length, item) => length + item.text.length, 0), 0);
      module.weight = textLength;
      module.featureIndices = body.filter(block => block.type === "list" && !block.token.ordered
        && block.token.items?.length >= 2 && block.token.items.length <= 8
        && block.token.items.every(item => !item.depth && typeof item.checked !== "boolean"
          && !/^\d/.test(item.marker || "") && item.text.length <= 24)).map(block => block.index);
      module.component = body.some(block => block.type === "image") ? "case"
        : body.some(block => ["table", "code"].includes(block.type)) ? "reference"
        : module.featureIndices.length ? "features" : "article";
      module.canShare = textLength <= 240 && body.every(block => ["paragraph", "list"].includes(block.type));
      if (module.component === "features") module.canShare = false;
      if (module.headingIndex == null && modules.indexOf(module) === 1 && title != null
        && body.length === 1 && body[0].type === "paragraph" && textLength <= 80) module.component = "subtitle";
      const heading = blocks[module.headingIndex]?.token.text || "";
      module.sequence = /^(?:第[一二三四五六七八九十\d]+步|步骤\s*\d+|step\s*\d+|\d+[.、．])/i.test(heading);
      module.sequence = module.sequence && textLength <= 240 && ["article", "features"].includes(module.component);
    }
    const groups = [];
    for (let i = 0; i < modules.length;) {
      const start = modules[i];
      if (start.headingIndex == null || (!start.canShare && !start.sequence)) { groups.push({ component: "single", modules: [start] }); i++; continue; }
      const peers = [start];
      while (i + peers.length < modules.length) {
        const next = modules[i + peers.length];
        if (next.headingIndex == null || (!next.canShare && !next.sequence) || next.parentId !== start.parentId
          || next.level !== start.level || next.sequence !== start.sequence) break;
        peers.push(next);
      }
      const sequence = peers.length > 1 && peers.every(module => module.sequence);
      const component = peers.length > 1 ? (sequence ? "path" : "peers") : "single";
      const maxWeight = Math.max(...peers.map(module => module.weight));
      if (sequence) for (const module of peers) {
        module.component = "stage";
        module.featureIndices = [];
      }
      groups.push({ component, columns: component === "single" ? 1 : maxWeight <= 90 ? Math.min(4, peers.length) : 2,
        modules: peers, evidence: sequence ? "explicit-step-headings" : "sibling-headings" });
      i += peers.length;
    }
    return { version: 2, theme: "knowledge-cards", source: structure, modules, groups };
  }

  createDetailComposition(root, model) {
    const targets = new Map();
    for (const group of model.groups) {
      const row = root.createDiv({ cls: `xhs-composition-group is-${group.component}` });
      row.style.setProperty("--composition-columns", String(group.columns || 1));
      for (const module of group.modules) {
        const panel = row.createEl("section", { cls: `xhs-composition-module is-${module.component}` });
        panel.dataset.moduleId = module.id;
        if (group.component === "path") panel.classList.add("is-stage");
        const header = panel.createDiv({ cls: "xhs-composition-heading" });
        const body = panel.createDiv({ cls: "xhs-composition-body" });
        for (const index of module.indices) targets.set(index,
          index === module.headingIndex || module.component === "hero" ? header : body);
      }
    }
    return targets;
  }

  finishDetailComposition(root, model) {
    for (const module of model.modules) {
      const panel = root.querySelector(`[data-module-id="${module.id}"]`);
      if (!panel) continue;
      if (!panel.querySelector(".xhs-composition-heading").children.length)
        panel.querySelector(".xhs-composition-heading").remove();
      if (!panel.querySelector(".xhs-composition-body").children.length)
        panel.querySelector(".xhs-composition-body").remove();
      if (module.component !== "features") continue;
      for (const list of panel.querySelectorAll("ul")) {
        if (list.parentElement.closest("li")) continue;
        const source = module.featureIndices.map(index => model.source.blocks[index].token)
          .find(token => token.items.length === list.children.length
            && token.items.every((item, index) => list.children[index].textContent.includes(item.text.replace(/\*+/g, ""))));
        if (!source) continue;
        list.classList.add("xhs-composition-features");
        list.style.setProperty("--feature-columns", String(Math.min(5, source.items.length)));
        const featureWidth = (list.clientWidth - 16 * (Math.min(5, source.items.length) - 1)) / Math.min(5, source.items.length);
        if (featureWidth < (this.config.detail_font_size || 30) * 4)
          list.style.setProperty("--feature-columns", String(Math.max(1, Math.floor(list.clientWidth / ((this.config.detail_font_size || 30) * 4 + 16)))));
        if (typeof setIcon === "function") for (const item of list.children) {
          const icon = document.createElement("span"); icon.className = "xhs-composition-icon";
          icon.setAttribute("aria-hidden", "true");
          const text = item.textContent;
          const name = /下载/.test(text) ? "download" : /修改|编写/.test(text) ? "pencil"
            : /学习|阅读/.test(text) ? "book-open" : /搜索|查找/.test(text) ? "search"
            : /展示/.test(text) ? "panels-top-left" : /看|查看/.test(text) ? "eye" : "circle-dot";
          setIcon(icon, name); item.prepend(icon);
        }
      }
    }
    // Reflow constrained rows without rewriting content or reducing typography.
    for (const row of root.querySelectorAll(".is-peers,.is-path")) {
      const columns = Number(row.style.getPropertyValue("--composition-columns"));
      const context = document.createElement("canvas").getContext("2d");
      const brokenWord = Array.from(row.querySelectorAll("li,p")).some(element => {
        context.font = getComputedStyle(element).font;
        return (element.textContent.match(/[A-Za-z][A-Za-z0-9_-]+/g) || [])
          .some(word => context.measureText(word).width > element.clientWidth - 8);
      });
      const crowded = Array.from(row.children).some(panel => panel.clientWidth < (this.config.detail_font_size || 30) * 6
        || panel.scrollWidth > panel.clientWidth + 2 || panel.offsetHeight > 700);
      if ((crowded || brokenWord) && columns > 1) row.style.setProperty("--composition-columns", columns > 2 ? "2" : "1");
      row.dataset.columns = row.style.getPropertyValue("--composition-columns");
      if (row.classList.contains("is-path") && typeof setIcon === "function") {
        const columns = Number(row.dataset.columns);
        for (let index = 0; index < row.children.length - 1; index++) {
          if ((index + 1) % columns === 0) continue;
          const connector = document.createElement("span");
          connector.className = "xhs-composition-connector";
          connector.setAttribute("aria-hidden", "true");
          setIcon(connector, "arrow-right"); row.children[index].append(connector);
        }
      }
    }
    const diagnostics = [];
    for (const element of root.querySelectorAll("p,li,pre,table,h1,h2,h3,h4,h5,h6"))
      if (element.scrollWidth > element.clientWidth + 2) diagnostics.push({ type: "horizontal-overflow", moduleId:
        element.closest("[data-module-id]")?.dataset.moduleId });
    model.diagnostics = diagnostics;
  }

  applyDetailModuleLayout(content) {
    const structure = this.buildDetailContentModel(content);
    const model = this.buildDetailPageModel(structure);
    content._xhsPageModel = model;
    content.classList.add("xhs-detail-layout-visual");
    content.dataset.detailLayoutVersion = "visual-1";
    this.renderDetailPageModel(content, model, structure);
  }

  buildDetailContentModel(content) {
    return Array.from(content.children).map((node, index) => ({
      id: `block-${index}`,
      type: node._xhsDetailTokens?.[0]?.type || "spacing",
      tokens: node._xhsDetailTokens || [],
      node
    }));
  }

  buildDetailPageModel(blocks) {
    const modules = [];
    let current = null;
    const meaningful = blocks.filter(block => block.type !== "spacing");
    for (const block of blocks) {
      const token = block.tokens[0];
      const label = block.type === "heading" || (block.type === "paragraph"
        && /^(?:\*\*[^\n]+\*\*|__[^\n]+__)\s*$/.test(token?.text || ""));
      const title = block === meaningful[0] && block.type === "heading"
        && (token.level === 1 || meaningful.filter(item => item.type === "heading")
          .every(item => item === block || item.tokens[0].level > token.level));
      if (title) {
        modules.push({ id: block.id, component: "page-heading", contentIds: [block.id], level: token.level });
        current = null;
      } else if (label) {
        current = { id: `module-${block.id}`, component: "explanation", labelId: block.id,
          contentIds: [block.id], level: token.level || 0 };
        modules.push(current);
      } else if (block.type === "rule") {
        modules.push({ id: block.id, component: "divider", contentIds: [block.id] });
        current = null;
      } else if (block.type === "quote") {
        modules.push({ id: block.id, component: "callout", parentModuleId: current?.id,
          contentIds: [block.id], level: current?.level || 0 });
        current = null;
      } else {
        if (!current) {
          current = { id: `module-${block.id}`, component: "explanation", contentIds: [], level: 0 };
          modules.push(current);
        }
        current.contentIds.push(block.id);
      }
    }
    const byId = new Map(blocks.map(block => [block.id, block]));
    for (const module of modules) {
      if (["page-heading", "divider"].includes(module.component)) continue;
      const owned = module.contentIds.map(id => byId.get(id)).filter(block => block.type !== "spacing");
      if (!owned.length) { module.component = "spacing"; continue; }
      const body = owned.filter(block => block.id !== module.labelId);
      if (!body.length && module.labelId) { module.component = "section-heading"; continue; }
      if (!module.labelId && modules[0]?.component === "page-heading"
        && modules.indexOf(module) === 1 && body.length === 1 && body[0].type === "paragraph"
        && Array.from(body[0].tokens[0]?.text || "").length <= 80) {
        module.component = "lead";
        continue;
      }
      const lists = body.filter(block => block.type === "list");
      module.component = body.some(block => block.type === "image") ? "media-panel"
        : body.some(block => ["table", "code"].includes(block.type)) ? "reference-panel"
        : body.length === 1 && body[0].type === "quote" ? "callout"
        : lists.some(block => /^\d/.test(block.tokens[0]?.items?.[0]?.marker || "")) ? "step-panel"
        : lists.length ? "list-panel" : "explanation";
      module.featureIds = lists.filter(block => block.tokens.every(token => !token.ordered
        && !/^\d/.test(token.items?.[0]?.marker || "") && token.items?.length >= 2 && token.items.length <= 6
        && token.items.every(item => !item.depth && typeof item.checked !== "boolean"
          && Array.from(item.text || "").length <= 10))).map(block => block.id);
      module.compact = body.every(block => ["paragraph", "list"].includes(block.type))
        && owned.reduce((length, block) => length + Array.from(block.node.textContent || "").length, 0) <= 180;
    }
    return { version: 1, theme: "knowledge-cards", modules };
  }

  renderDetailPageModel(content, model, blocks) {
    const byId = new Map(blocks.map(block => [block.id, block]));
    const font = Number(this.config.detail_font_size) || 30;
    const panels = [];
    for (const module of model.modules) {
      const nodes = module.contentIds.map(id => byId.get(id).node);
      if (module.component === "page-heading") {
        nodes[0].classList.add("xhs-visual-page-title");
        continue;
      }
      if (module.component === "section-heading") {
        nodes[0].classList.add("xhs-visual-panel-title");
        continue;
      }
      if (["divider", "spacing"].includes(module.component)) continue;
      const panel = document.createElement("section");
      panel.className = `xhs-visual-panel is-${module.component}`;
      panel.dataset.moduleId = module.id;
      panel.dataset.component = module.component;
      nodes[0].before(panel);
      const body = document.createElement("div"); body.className = "xhs-visual-panel-body";
      for (const node of nodes) {
        if (module.labelId && node === byId.get(module.labelId).node) {
          node.classList.add("xhs-visual-panel-title"); panel.append(node);
        } else body.append(node);
      }
      panel.append(body);
      for (const id of module.featureIds || []) {
        const node = byId.get(id).node;
        const list = ["UL", "OL"].includes(node.tagName) ? node : node.querySelector("ul");
        if (!list) continue;
        list.classList.add("xhs-visual-feature-grid");
        const count = list.children.length;
        list.style.setProperty("--feature-columns", String(Math.min(3, count)));
        if (Array.from(list.children).some(item => item.scrollWidth > item.clientWidth + 1)) {
          list.classList.remove("xhs-visual-feature-grid");
        }
      }
      panels.push({ module, panel });
    }
    for (let index = 0; index + 1 < panels.length; index++) {
      const left = panels[index], right = panels[index + 1];
      if (left.module.featureIds?.length || right.module.featureIds?.length) continue;
      if (!left.module.labelId || !right.module.labelId || !left.module.compact || !right.module.compact
        || left.module.level !== right.module.level || left.panel.nextElementSibling !== right.panel
        || content.clientWidth < font * 27) continue;
      const row = document.createElement("div"); row.className = "xhs-visual-peer-grid";
      left.panel.before(row); row.append(left.panel, right.panel);
      const heights = [left.panel.offsetHeight, right.panel.offsetHeight];
      if (Math.max(...heights) > font * 23 || [left.panel, right.panel].some(panel => panel.scrollWidth > panel.clientWidth + 1)) {
        row.before(left.panel, right.panel); row.remove();
      } else { left.module.columns = right.module.columns = 2; index++; }
    }
  }

  applySwissDetailLayout(content) {
    const nodes = Array.from(content.children);
    const tokenOf = node => node?._xhsDetailTokens?.[0];
    const blocks = nodes.filter(node => tokenOf(node));
    const headings = blocks.filter(node => tokenOf(node).type === "heading");
    const first = headings[0];
    const title = first && blocks[0] === first && (tokenOf(first).level === 1 || headings.length === 1
      || headings.slice(1).every(node => tokenOf(node).level > tokenOf(first).level)) ? first : null;
    if (title) title.classList.add("xhs-magazine-title");
    // Fully bold paragraphs remain paragraphs; their source emphasis is a visual label only.
    const isLabel = node => tokenOf(node)?.type === "paragraph"
      && /^(?:\*\*[^\n]+\*\*|__[^\n]+__)\s*$/.test(tokenOf(node).text || "")
      && (node.querySelector("strong") || node.firstElementChild?.tagName === "STRONG");
    const boundaries = blocks.filter(node => node !== title
      && (tokenOf(node).type === "heading" || isLabel(node)));
    for (let index = 0; index < boundaries.length; index++) {
      const label = boundaries[index];
      const start = nodes.indexOf(label);
      const end = index + 1 < boundaries.length ? nodes.indexOf(boundaries[index + 1]) : nodes.length;
      const members = nodes.slice(start, end);
      label.classList.add(tokenOf(label).type === "heading" ? "xhs-magazine-section-title" : "xhs-swiss-source-label");
      const owned = members.filter(node => tokenOf(node));
      const tokens = owned.flatMap(node => node._xhsDetailTokens);
      if (tokens.some(token => token.type === "rule")) continue;
      if (owned.length < 2) continue;
      const section = document.createElement("section");
      section.className = "xhs-detail-module xhs-magazine-module xhs-swiss-section";
      section.classList.add("xhs-swiss-card");
      content.insertBefore(section, label);
      members.forEach(node => section.append(node));
      const trailing = [];
      while (section.lastElementChild?.classList.contains("xhs-detail-spacer")) trailing.unshift(section.removeChild(section.lastElementChild));
      section.after(...trailing);
      if (owned.length === 2 && ["UL", "P"].includes(owned[1].tagName)
        && !tokens.some(token => token.items?.some(item => item.depth))
        && Array.from(label.textContent).length <= 24) {
        section.classList.add("xhs-magazine-label-layout");
        const font = Number(this.config.detail_font_size) || 30;
        const list = owned[1];
        if (section.clientWidth < font * 24 || list.clientWidth < font * 14
          || list.offsetHeight > font * 9 || section.offsetHeight > font * 17 || label.offsetHeight > font * 4) {
          section.classList.remove("xhs-magazine-label-layout");
        }
      }
    }
    // Bind an explicit introductory label to its list, never infer a new heading.
    for (const list of Array.from(content.children).filter(node => ["UL", "OL"].includes(node.tagName))) {
      let label = list.previousElementSibling;
      const gaps = [];
      while (label?.classList.contains("xhs-detail-spacer")) { gaps.unshift(label); label = label.previousElementSibling; }
      if (label?.tagName !== "P" || !/[:：]\s*$/.test(tokenOf(label)?.text || "")) continue;
      const group = document.createElement("section");
      group.className = "xhs-detail-module xhs-magazine-module xhs-swiss-section xhs-swiss-card xhs-swiss-intro-group";
      content.insertBefore(group, label);
      group.append(label, ...gaps, list);
    }
    content.querySelectorAll("ol").forEach(list => list.classList.add("xhs-magazine-steps"));
    content.querySelectorAll("blockquote:not(.xhs-detail-callout)").forEach(quote => quote.classList.add("xhs-magazine-quote"));
    this.composeSwissModules(content);
  }

  composeSwissModules(content) {
    const font = Number(this.config.detail_font_size) || 30;
    const modules = Array.from(content.children).filter(node => node.classList.contains("xhs-swiss-card"));
    for (const section of modules) {
      const label = section.firstElementChild;
      const body = document.createElement("div");
      body.className = "xhs-swiss-card-body";
      while (label.nextSibling) body.append(label.nextSibling);
      label.classList.add("xhs-swiss-card-heading");
      section.append(body);
      section.classList.remove("xhs-magazine-label-layout");
      section.dataset.sourceLevel = label._xhsDetailTokens?.[0]?.level || "label";
      const tokens = Array.from(body.children).flatMap(node => node._xhsDetailTokens || []);
      section.dataset.presentation = tokens.some(token => token.type === "image") ? "illustrated"
        : tokens.some(token => ["table", "code"].includes(token.type)) ? "reference"
        : tokens.some(token => token.type === "list") ? "list" : "prose";
      // A heading/list rail expresses source ownership, never an invented sequence.
      if (section.dataset.presentation === "list" && content.clientWidth >= font * 22
        && Array.from(label.textContent).length <= 24) {
        section.classList.add("xhs-swiss-reading-rail");
        if (body.clientWidth < font * 13 || label.offsetHeight > font * 5
          || body.scrollWidth > body.clientWidth + 1) section.classList.remove("xhs-swiss-reading-rail");
      }
      if (section.dataset.presentation === "illustrated") section.classList.add("xhs-swiss-example-section");
    }
    // Pair only consecutive peers; measure at final column width before committing.
    for (let index = 0; index + 1 < modules.length; index++) {
      const left = modules[index], right = modules[index + 1];
      if ([left, right].some(section => section.dataset.presentation !== "prose")) continue;
      if (left.dataset.sourceLevel !== right.dataset.sourceLevel || content.clientWidth < font * 28) continue;
      const gaps = [];
      let next = left.nextElementSibling;
      while (next?.classList.contains("xhs-detail-spacer")) { gaps.push(next); next = next.nextElementSibling; }
      if (next !== right || left.querySelector("table,pre") || right.querySelector("table,pre")) continue;
      const row = document.createElement("div");
      row.className = "xhs-swiss-module-grid";
      left.before(row);
      row.append(left, right);
      const heights = [left.offsetHeight, right.offsetHeight];
      const tooNarrow = [left, right].some(section => section.clientWidth < font * 13
        || section.scrollWidth > section.clientWidth + 1
        || section.querySelector(".xhs-swiss-card-heading").offsetHeight > font * 4);
      if (tooNarrow || Math.max(...heights) > font * 23
        || Math.max(...heights) > Math.max(1, Math.min(...heights)) * 1.75) {
        row.before(left, ...gaps, right);
        row.remove();
      } else { gaps.forEach(gap => gap.remove()); index++; }
    }
  }

  applyMagazineDetailLayout(content) {
    const nodes = Array.from(content.children);
    const headings = nodes.filter(node => node._xhsDetailTokens?.[0]?.type === "heading");
    const firstBlock = nodes.find(node => node._xhsDetailTokens);
    // Only a uniquely higher first heading is a page title; peer headings remain modules.
    const firstHeading = headings[0];
    const hasTitle = !!firstHeading && firstBlock === firstHeading && (headings.length === 1
      || headings.slice(1).every(node => node._xhsDetailTokens[0].level > firstHeading._xhsDetailTokens[0].level));
    if (hasTitle) firstHeading.classList.add("xhs-magazine-title");
    const candidates = hasTitle ? headings.slice(1) : headings;
    const level = candidates.length ? Math.min(...candidates.map(node => node._xhsDetailTokens[0].level)) : 0;
    const boundaries = candidates.filter(node => node._xhsDetailTokens[0].level === level);
    const modules = [];
    for (let i = 0; i < boundaries.length; i++) {
      const start = nodes.indexOf(boundaries[i]);
      const end = i + 1 < boundaries.length ? nodes.indexOf(boundaries[i + 1]) : nodes.length;
      const members = nodes.slice(start, end);
      const tokens = members.flatMap(node => node._xhsDetailTokens || []);
      boundaries[i].classList.add("xhs-magazine-section-title");
      // Image slots use an absolute sibling layer: do not change their offset parent.
      if (tokens.some(token => ["image", "table", "code", "rule"].includes(token.type))) continue;
      const paragraphs = tokens.filter(token => token.type === "paragraph");
      const lists = tokens.filter(token => token.type === "list");
      const compact = tokens.every(token => ["heading", "paragraph", "list"].includes(token.type))
        && tokens.filter(token => token.type === "heading").length === 1
        && Array.from(boundaries[i].textContent).length <= 24
        && paragraphs.length <= 2 && paragraphs.every(token => Array.from(token.text || "").length <= 70)
        && lists.every(token => token.items.length <= 6 && token.items.every(item => !item.depth
          && !/^\d/.test(item.marker) && Array.from(item.text || "").length <= 32))
        && tokens.reduce((sum, token) => sum + Array.from(token.text || "").length
          + (token.items || []).reduce((n, item) => n + Array.from(item.text || "").length, 0), 0) <= 260;
      const section = document.createElement("section");
      section.className = `xhs-detail-module xhs-magazine-module${compact ? " is-compact" : ""}`;
      content.insertBefore(section, boundaries[i]);
      members.forEach(node => section.appendChild(node));
      while (section.lastElementChild && !section.lastElementChild._xhsDetailTokens) section.lastElementChild.remove();
      modules.push(section);
    }
    const font = Number(this.config.detail_font_size) || 30;
    for (const section of modules) {
      const blocks = Array.from(section.children).filter(node => node._xhsDetailTokens);
      const list = blocks[1];
      if (blocks.length !== 2 || !section.classList.contains("is-compact") || list?.tagName !== "UL") continue;
      section.classList.add("xhs-magazine-label-layout");
      if (section.clientWidth < font * 24 || list.clientWidth < font * 14
        || section.offsetHeight > font * 17) section.classList.remove("xhs-magazine-label-layout");
    }
    for (let i = 0; i + 1 < modules.length; i++) {
      const left = modules[i], right = modules[i + 1];
      if (left.classList.contains("xhs-magazine-label-layout") || right.classList.contains("xhs-magazine-label-layout")) continue;
      if (!left.classList.contains("is-compact") || !right.classList.contains("is-compact")) continue;
      const between = []; let next = left.nextElementSibling;
      while (next && next !== right && next.classList.contains("xhs-detail-spacer")) { between.push(next); next = next.nextElementSibling; }
      if (next !== right) continue;
      const row = document.createElement("div"); row.className = "xhs-detail-module-row xhs-magazine-pair";
      content.insertBefore(row, left); row.append(left, right); between.forEach(node => node.remove());
      // Measure at column width, reverting pairs that wrap into excessively tall modules.
      const heights = [left.offsetHeight, right.offsetHeight];
      if (Math.max(...heights) > (Number(this.config.detail_font_size) || 30) * 16
        || Math.max(...heights) > Math.max(1, Math.min(...heights)) * 1.8) {
        row.before(left, right); row.remove();
      } else i++;
    }
    this.organizeMagazineContentGroups(content);
    content.querySelectorAll("ol").forEach(list => list.classList.add("xhs-magazine-steps"));
    content.querySelectorAll("blockquote:not(.xhs-detail-callout)").forEach(quote => quote.classList.add("xhs-magazine-quote"));
  }

  organizeMagazineContentGroups(content) {
    const shortList = node => {
      const token = node._xhsDetailTokens?.[0];
      return token?.type === "list" && token.items.length >= 2 && token.items.length <= 8
        && token.items.every(item => !item.depth && Array.from(item.text || "").length <= 48);
    };
    // Labels are recognized structurally (colon-ended paragraph immediately before a list).
    // Preserve the paragraph intact, including its introductory lines.
    const scopes = [content, ...content.querySelectorAll(".xhs-magazine-module")];
    for (const scope of scopes) {
      if (scope.closest(".xhs-magazine-pair")) continue;
      for (const list of Array.from(scope.children).filter(node => ["UL", "OL"].includes(node.tagName))) {
        let label = list.previousElementSibling;
        const gaps = [];
        while (label?.classList.contains("xhs-detail-spacer")) { gaps.unshift(label); label = label.previousElementSibling; }
        const text = label?._xhsDetailTokens?.[0]?.text || "";
        const labelled = label?.tagName === "P" && /[:：]\s*$/.test(text) && Array.from(text).length <= 140;
        if (!labelled) continue;
        const panel = document.createElement("section");
        panel.className = `xhs-magazine-content-group${list.tagName === "OL" ? " is-sequence" : " is-list-group"}`;
        panel.dataset.compact = "false";
        scope.insertBefore(panel, labelled ? label : list);
        if (labelled) { label.classList.add("xhs-magazine-group-label"); panel.append(label); gaps.forEach(gap => gap.remove()); }
        panel.append(list);
      }
      const groups = Array.from(scope.children).filter(node => node.classList.contains("xhs-magazine-content-group"));
      for (let i = 0; i + 1 < groups.length; i++) {
        const left = groups[i], right = groups[i + 1];
        if (left.dataset.compact !== "true" || right.dataset.compact !== "true") continue;
        const gaps = []; let next = left.nextElementSibling;
        while (next?.classList.contains("xhs-detail-spacer")) { gaps.push(next); next = next.nextElementSibling; }
        if (next !== right) continue;
        const row = document.createElement("div"); row.className = "xhs-magazine-content-row";
        scope.insertBefore(row, left); row.append(left, right); gaps.forEach(gap => gap.remove());
        const heights = [left.offsetHeight, right.offsetHeight];
        const font = Number(this.config.detail_font_size) || 30;
        if (Math.max(...heights) > font * 19 || Math.max(...heights) > Math.max(1, Math.min(...heights)) * 2) {
          row.before(left, right); row.remove();
        } else i++;
      }
    }
  }

  prepareDetailTokens(source) {
    // Source blank lines delimit blocks; typography controls their displayed spacing.
    const blocks = source.filter((token) => token.type !== "spacer");
    const result = [];
    blocks.forEach((original, index) => {
      const token = { ...original };
      const previous = blocks[index - 1];
      if (previous) {
        const gap = this.getDetailBlockGap(previous, token);
        if (gap) result.push({ type: "spacer", lines: gap });
      }
      if (token.type === "heading") {
        token.displayLevel = token.level;
      }
      result.push(token);
    });
    return result;
  }

  getDetailBlockGap(previous, token) {
    if (!previous) return 0;
    if (token.type === "paragraph" && /^(?:\*\*[^\n]+\*\*|__[^\n]+__)\s*$/.test(token.text || "")) return 0.8;
    if (token.type === "heading") return token.level <= 2 ? 1 : 0.65;
    if (previous.type === "heading") return previous.level <= 2 ? 0.4 : 0.25;
    if (token.type === "list" && previous.type === "paragraph") return 0.2;
    if (token.type === "rule" || previous.type === "rule") return 0.65;
    if (token.type === "image" && previous.type === "image") return this.getDetailImageGap() / (this.config.detail_font_size || 30);
    return 0.4;
  }

  applyDetailPresentation(card) {
    this.normalizeDetailDesignConfig();
    const system = this.getDetailDesignSystem();
    card.style.setProperty('--detail-divider',system.divider.border);
    card.style.setProperty('--detail-divider-width',`${system.divider.width}px`);
    card.style.setProperty('--detail-divider-color',system.divider.color);
    card.dataset.detailPageType=this.config.detail_page_type;
    card.style.setProperty("--module-accent",system.colors.accent);
    card.style.setProperty("--module-surface",system.colors.background);
    card.style.setProperty("--module-border",system.colors.ink);
    card.style.setProperty("--module-divider",system.colors.ink);
    card.style.setProperty("--module-secondary",system.colors.ink);
    card.dataset.detailDesignSystem = system.version;
    card.style.setProperty('--detail-muted-text',system.colors.muted);
    card.style.setProperty('--detail-body-ink',system.colors.bodyInk);
    card.style.setProperty('--detail-heading-ink',system.colors.ink);
    card.style.setProperty('--detail-highlight-text',system.colors.highlight);
    card.style.setProperty('--detail-accent-fill',system.colors.accent);
    card.style.setProperty('--detail-accent-on-fill',system.colors.onAccent);
    card.style.setProperty('--detail-accent-tint',system.colors.tint);
    card.style.setProperty('--detail-media-surface',system.colors.media);
    Object.entries(system.typography).forEach(([key,value])=>card.style.setProperty(`--detail-type-${key}`,String(value)));
    Object.entries(system.spacing).forEach(([key,value])=>card.style.setProperty(`--detail-gap-${key}`,`${value}px`));
    Object.entries(system.cardTokens).forEach(([key,value])=>card.style.setProperty(`--reference-${key}`,`${value}px`));
    Object.entries(system.borders).forEach(([key,value])=>card.style.setProperty(`--reference-border-${key}`,value));
    card.style.setProperty('--detail-panel-edge',`${system.unit / 8}px solid ${system.divider.color}`);
    card.style.setProperty('--detail-card-shadow',system.effects.cardShadow);
    card.style.setProperty('--detail-label-edge',system.effects.labelEdge);
    card.dataset.detailColorPolicy='neutral-60-ink-30-accent-10';
    card.style.setProperty("--detail-ordinal-size",`${system.ordinal}px`);
    card.style.setProperty("--detail-body-size",`${system.body}px`);
    card.style.setProperty("--detail-body-leading",`${system.body*system.typography.bodyLeading}px`);
    card.style.setProperty("--detail-card-surface",system.colors.card);
    card.style.setProperty("--detail-title-surface",system.colors.titleBand);
    card.style.setProperty("--detail-margin", `${system.margin}px`);
    card.style.setProperty("--detail-space", `${system.unit}px`);
    card.style.setProperty("--detail-title-size", `${system.title}px`);
    card.style.setProperty("--detail-section-size", `${system.section}px`);
    card.style.setProperty("--detail-caption-size", `${system.caption}px`);
    if(system.headingSizes)system.headingSizes.forEach((size,index)=>card.style.setProperty(`--detail-h${index+1}-size`,`${size}px`));
    card.style.setProperty("--detail-text-width", `${system.content}px`);
    card.style.setProperty("--detail-media-gap", `${this.config.detail_image_gap}px`);
    const vars = {
      "detail-bg": system.colors.background,
      "detail-text": system.colors.ink,
      accent: system.colors.accent,
      "secondary-soft": system.colors.background,
      "secondary-mid": system.colors.background,
      "detail-font-size": `${this.config.detail_font_size}px`,
      "detail-font-weight": this.config.detail_font_weight,
      "detail-line-height": this.config.detail_line_height,
      "detail-letter-spacing": `${this.config.detail_letter_spacing}px`,
      "detail-image-gap": `${this.getDetailImageGap()}px`
    };
    Object.entries(vars).forEach(([key, value]) => card.style.setProperty(`--xhs-${key}`, String(value)));
  }

  getDetailPaginationKey() {
    const keys = ["detail_page_type", "detail_module_layout", "xhs_style", "xhs_width", "xhs_height", "detail_font_size", "detail_font_weight",
      "detail_line_height", "detail_letter_spacing", "detail_image_gap", "detail_image_width", "detail_image_layouts"];
    const theme = typeof document === "undefined" ? "" : [document.body.className,
      getComputedStyle(document.body).getPropertyValue("--font-text"), getComputedStyle(document.body).getPropertyValue("--font-monospace")];
    return JSON.stringify(["bounded-reading-73-card-heading", this.activeFile?.path, theme, ...keys.map((key) => this.config[key])]);
  }

  async ensureDetailPagination() {
    this.normalizeDetailDesignConfig();
    if (!this.detailSourcePages) return;
    if (Number(this.config.detail_line_height) < 1.45 || Number(this.config.detail_line_height) > 1.65)
      this.config.detail_line_height = DEFAULT_CONFIG.detail_line_height;
    if (typeof document === "undefined" || !MarkdownRenderer?.render) {
      this.pages = [{ kind: "cover" }, ...this.detailSourcePages];
    } else {
      for(;;) {
        const sources=this.detailSourcePages;
        if (!sources.length) {
          this.pages = [{ kind: "cover" }];
          break;
        }
        const config=this.config,presentation=this.getDetailPaginationKey();
        const key=presentation+JSON.stringify(sources.map(page=>page.markdown));
        if(this.detailPaginationKey===key)break;
        if(this.readingPaginationPending) {
          try{await this.readingPaginationPending;}catch(error){/* The owning request reports the failure. */}
          continue;
        }
        const isObsolete=()=>this.detailSourcePages!==sources || this.config!==config || this.getDetailPaginationKey()!==presentation;
        const pending=this.paginateReadingSources(sources.slice(),isObsolete);
        this.readingPaginationPending=pending;
        try {
          const details = await pending;
          if(details && !isObsolete()) {
            this.pages = [{ kind: "cover" }, ...details];
            this.detailPaginationKey = key;
          }
        } finally {if(this.readingPaginationPending===pending)this.readingPaginationPending=null;}
      }
    }
    this.activePageIndex = Math.max(0, Math.min(this.activePageIndex, this.pages.length - 1));
    if (this.activeFile) this.pageIndexByFile.set(this.activeFile.path, this.activePageIndex);
  }

  splitReadingElement(node) {
    if(node.matches('table.xhs-reference-table') && node.querySelectorAll(':scope > tbody > tr').length===1)return this.splitDetailReferenceTable(node);
    if(node.matches('table.xhs-module-record-table') && node.querySelectorAll(':scope > tbody > tr').length===1)return this.splitRecordTableFields(node);
    if(node.classList.contains('xhs-reference-item'))return this.splitDetailReferenceItem(node);
    if(node.dataset.detailVariant==="labelled-prose") {
      const body=node.querySelector(':scope > .xhs-module-chapter-body');
      const label=body?.querySelector(':scope > .xhs-module-prose-label:not([data-reading-context])');
      const payload=Array.from(body?.children || []).filter(child=>child!==label && !child.hasAttribute('data-reading-context'));
      if(label && payload.length) {
        const pieces=payload.length>1?payload:this.splitReadingElement(payload[0]);
        if(pieces.length>1)return pieces.map((piece,index)=>{
          const wrapper=node.cloneNode(false),content=body.cloneNode(false);
          if(!index)content.append(label.cloneNode(true));
          if(index)wrapper.dataset.readingFragment='true';
          content.append(piece.cloneNode(true));wrapper.append(content);return wrapper;
        });
        // The generic wrapper splitter must not detach a label from its first paragraph.
        return [node];
      }
    }
    if(node.dataset.detailModule==='figure' && node.querySelector('[data-detail-image-slot],img'))return [node];
    if(node.hasAttribute("data-detail-module") && node.children.length>1 && /^H[1-6]$/.test(node.firstElementChild.tagName)) {
      const [heading,...body]=Array.from(node.children);
      const pieces=body.length===1?this.splitReadingElement(body[0]):body;
      if(body.length===1 && pieces.length===1)return [node];
      return pieces.map((piece,index)=>{
        const wrapper=node.cloneNode(false);
        if(!index)wrapper.append(heading.cloneNode(true));
        if(index && node.dataset.detailModule==="chapter") {
          wrapper.dataset.readingFragment="true";
          wrapper.dataset.detailVariant="prose-reading";
          wrapper.dataset.detailDesign="paragraph-reading";
        }
        wrapper.append(piece.cloneNode(true));return wrapper;
      });
    }
    if (node.tagName === "TABLE") {
      if (Array.from(node.querySelectorAll("td, th")).some(cell => cell.rowSpan > 1)) return [node];
      const rows = Array.from(node.querySelectorAll(":scope > tbody > tr"));
      const groups=[];
      for(const row of rows) {
        const previous=groups.at(-1);
        if(row.dataset.detailCardRow!==undefined && previous?.[0].dataset.detailCardRow===row.dataset.detailCardRow)previous.push(row);
        else groups.push([row]);
      }
      if (groups.length > 1) return groups.map((members, index) => {
        const table = node.cloneNode(true);
        table.dataset.readingTable = node.dataset.readingTable || (node.dataset.readingTable = String(this.readingTableSequence = (this.readingTableSequence || 0) + 1));
        table.querySelectorAll("tbody > tr").forEach(item => item.remove());
        table.querySelector("tbody").append(...members.map(row=>row.cloneNode(true)));
        if (index){table.querySelector("thead")?.remove();table.dataset.readingContinuation='true';}
        return table;
      });
    }
    if(node.dataset.detailModule==='figure' && node.querySelector('figcaption,.xhs-figure-source'))return [node];
    const hasDirectText = Array.from(node.childNodes).some(child => child.nodeType === 3 && child.textContent.trim());
    if(node.matches('ul,ol') && Array.from(node.children).some(child=>child.dataset.detailCardRow!==undefined)) {
      const groups=[];
      for(const child of node.children) {
        const previous=groups.at(-1);
        if(previous?.[0].dataset.detailCardRow===child.dataset.detailCardRow)previous.push(child);else groups.push([child]);
      }
      if(groups.length>1)return groups.map(group=>{const part=node.cloneNode(false);part.append(...group.map(child=>child.cloneNode(true)));return part;});
      if(node.children.length===1 && node.firstElementChild.classList.contains('is-reference-full')) {
        const pieces=this.splitReadingElement(node.firstElementChild);
        if(pieces.length>1)return pieces.map(piece=>{const part=node.cloneNode(false);part.append(piece);return part;});
      }
      return [node];
    }
    if (["UL", "OL", "BLOCKQUOTE", "DIV", "SECTION"].includes(node.tagName) && !hasDirectText && node.children.length > 1) {
      return Array.from(node.children, (child, index) => {
        const wrapper = node.cloneNode(false);
        if(node.classList.contains("xhs-detail-composition"))wrapper.classList.add("is-single-column");
        if (node.tagName === "OL") wrapper.setAttribute("start", child.dataset.detailOrdinal || String((Number(node.getAttribute("start")) || 1) + index));
        wrapper.append(child.cloneNode(true));
        return wrapper;
      });
    }
    if (["UL", "OL", "BLOCKQUOTE", "DIV", "SECTION"].includes(node.tagName) && !hasDirectText && node.children.length === 1) {
      const parts = this.splitReadingElement(node.firstElementChild);
      if (parts.length > 1) return parts.map(part => {
        const wrapper = node.cloneNode(false);
        if(node.dataset.detailModule==="chapter")wrapper.dataset.readingFragment="true";
        wrapper.append(part);return wrapper;
      });
    }
    const textSplitThreshold=node.classList.contains('xhs-reference-tab-label')?2:node.classList.contains('xhs-reference-value')?24:80;
    if (["P", "LI", "PRE"].includes(node.tagName) && node.textContent.length > textSplitThreshold) {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
      let midpoint = Math.floor(node.textContent.length / 2);
      const boundaries=[node.textContent.lastIndexOf("\n",midpoint),node.textContent.indexOf("\n",midpoint)]
        .filter(index=>index>=0).map(index=>index+1).filter(index=>index>0 && index<node.textContent.length
          && node.textContent.slice(0,index).trim() && node.textContent.slice(index).trim());
      if(boundaries.length)midpoint=boundaries.sort((a,b)=>Math.abs(a-midpoint)-Math.abs(b-midpoint))[0];
      if (/^[\uDC00-\uDFFF]$/.test(node.textContent[midpoint])) midpoint--;
      let offset = midpoint, boundary;
      for (const text of texts) {
        if (offset <= text.length) { boundary = { text, offset }; break; }
        offset -= text.length;
      }
      if (boundary) return [true, false].map(before => {
        const range = document.createRange(); range.selectNodeContents(node);
        if (before) range.setEnd(boundary.text, boundary.offset); else range.setStart(boundary.text, boundary.offset);
        const part = node.cloneNode(false); part.append(range.cloneContents());
        if (!before && node.tagName === "LI") part.dataset.readingContinuation = "true";
        return part;
      });
    }
    return [node];
  }

  splitRecordTableFields(table) {
    const row=table.querySelector(':scope > tbody > tr'),fields=Array.from(row?.cells || []);
    if(!fields.length)return [table];
    let pieces=fields;
    if(fields.length===1) {
      const field=fields[0],value=field.querySelector(':scope > .xhs-table-field-value');
      if(!value)return [table];
      const paragraph=document.createElement('p');paragraph.append(...Array.from(value.childNodes,node=>node.cloneNode(true)));
      const parts=this.splitReadingElement(paragraph);
      if(parts.length<2)return [table];
      pieces=parts.map((part,index)=>{
        const cell=field.cloneNode(false),content=value.cloneNode(false);content.append(...part.childNodes);
        const label=field.querySelector(':scope > .xhs-table-field-label');
        if(!index && label)cell.append(label.cloneNode(true));
        if(index)cell.dataset.readingContinuation='true';
        cell.append(content);return cell;
      });
    }
    return pieces.map((field,index)=>{
      const fragment=table.cloneNode(true),record=row.cloneNode(false);record.append(field.cloneNode(true));
      fragment.querySelector('tbody').replaceChildren(record);
      if(index) {
        fragment.querySelector('thead')?.remove();fragment.dataset.readingContinuation='true';record.dataset.readingContinuation='true';
      }
      return fragment;
    });
  }

  splitReadingToFit(node, accepts, protectedNodes = new Set()) {
    if(protectedNodes.has(node) || node.matches('img,svg,mjx-container,.math,.math-block,.xhs-detail-image-slot'))return null;
    const continuation=part=>{
      part.dataset.readingContinuation='true';
      if(part.dataset.detailModule==='chapter') {
        part.dataset.readingFragment='true';
        part.dataset.detailVariant='prose-reading';
        part.dataset.detailDesign='paragraph-reading';
      }
      return part;
    };
    // An oversized group can break between complete image rows. The lead stays
    // with the first row and the source caption stays with the last one.
    if(node.dataset.detailModule==='figure') {
      const media=node.querySelector(':scope > .xhs-detail-media-group');
      const rows=Array.from(media?.children || []);
      if(rows.length>1) {
        const children=Array.from(node.children),index=children.indexOf(media);
        const wrap=(members,tail)=>{
          const part=node.cloneNode(false),group=media.cloneNode(false);
          group.append(...members.map(row=>row.cloneNode(true)));
          if(!tail)part.append(...children.slice(0,index).map(child=>child.cloneNode(true)));
          part.append(group);
          if(tail)part.append(...children.slice(index+1).map(child=>child.cloneNode(true)));
          return tail?continuation(part):part;
        };
        for(let count=rows.length-1;count>0;count--) {
          const head=wrap(rows.slice(0,count),false);
          if(accepts(head))return [head,wrap(rows.slice(count),true)];
        }
      }
    }
    // For an oversized caption, keep its first lines with the image and continue only the text.
    const caption=node.dataset.detailModule==='figure' && node.querySelector(':scope > figcaption,:scope > .xhs-figure-source');
    if(caption && node.querySelector('[data-detail-image-slot],img')) {
      const children=Array.from(node.children),index=children.indexOf(caption);
      const wrap=(piece,tail=false)=>{const part=node.cloneNode(false);part.append(...(tail?[]:children.slice(0,index)).map(child=>child.cloneNode(true)),piece.cloneNode(true),...(tail?children.slice(index+1):[]).map(child=>child.cloneNode(true)));return tail?continuation(part):part;};
      const parts=this.splitReadingToFit(caption,piece=>accepts(wrap(piece)),protectedNodes);
      return parts?[wrap(parts[0]),wrap(parts[1],true)]:null;
    }
    const children=Array.from(node.children);
    const directText=Array.from(node.childNodes).some(child=>child.nodeType===3 && child.textContent.trim());
    const heading=child=>/^H[1-6]$/.test(child.tagName) || child.matches('.xhs-module-prose-label,.xhs-reference-item-title,.xhs-module-item-title,.xhs-module-ordinal,.xhs-reference-ordinal');
    if(['SECTION','DIV','BLOCKQUOTE','UL','OL','LI'].includes(node.tagName) && !directText && children.length) {
      if(node.matches('.callout,.xhs-detail-image-wrap,.xhs-detail-image-row,.xhs-reference-table'))return null;
      const singleFullRow=children.length===1 && children[0].classList.contains('is-reference-full');
      const parallel=!singleFullRow && (node.matches('.xhs-module-plain-matrix.is-compact-grid')
        || node.matches('.xhs-reference-list') && node.closest('[data-detail-reference-columns="2"]'));
      const measuredRows=!singleFullRow && children.some(child=>child.dataset.detailCardRow!==undefined);
      const stride=parallel&&!measuredRows?2:1;
      const wrap=(members,start=0)=>{
        const part=node.cloneNode(false);part.append(...members.map(child=>child.cloneNode(true)));
        if(start && node.tagName==='OL')part.setAttribute('start',children[start]?.dataset.detailOrdinal || String((Number(node.getAttribute('start'))||1)+start));
        return start?continuation(part):part;
      };
      let best=0;
      for(let count=stride;count<children.length;count+=stride) {
        if(measuredRows && children[count-1].dataset.detailCardRow===children[count].dataset.detailCardRow)continue;
        if(heading(children[count-1]))continue;
        if(!accepts(wrap(children.slice(0,count))))break;
        best=count;
      }
      // Try the overflowing child in its real wrapper, rather than halving its text.
      if(!parallel && !measuredRows && best<children.length && !heading(children[best])) {
        const parts=this.splitReadingToFit(children[best],piece=>accepts(wrap([...children.slice(0,best),piece])),protectedNodes);
        if(parts) {
          const first=wrap([...children.slice(0,best),parts[0]]);
          const tail=continuation(wrap([parts[1],...children.slice(best+1)]));
          if(node.tagName==='OL')tail.setAttribute('start',children[best].dataset.detailOrdinal || String((Number(node.getAttribute('start'))||1)+best));
          return [first,tail];
        }
      }
      if(best)return [wrap(children.slice(0,best)),wrap(children.slice(best),best)];
      // A source heading must stay with the beginning of its first body block.
      const firstBody=children.findIndex(child=>!heading(child));
      if(!parallel && firstBody>0) {
        const parts=this.splitReadingToFit(children[firstBody],piece=>accepts(wrap([...children.slice(0,firstBody),piece])),protectedNodes);
        if(parts)return [wrap([...children.slice(0,firstBody),parts[0]]),continuation(wrap([parts[1],...children.slice(firstBody+1)]))];
      }
      return null;
    }
    if(!['P','LI','PRE'].includes(node.tagName) || node.querySelector('img,svg,mjx-container,.math,input,ul,ol,table'))return null;
    const cuts=[];
    let consumed=0;
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
    while(walker.nextNode()) {
      const text=walker.currentNode;
      if(text.nodeType===1) {
        if(text.tagName==='BR')cuts.push({text:text.parentNode,offset:Array.from(text.parentNode.childNodes).indexOf(text)+1,position:consumed});
        continue;
      }
      if(text.parentElement.closest('[data-reading-generated]')){consumed+=text.length;continue;}
      const offsets=segmenter?Array.from(segmenter.segment(text.data),part=>part.index+part.segment.length)
        :Array.from(text.data).reduce((all,char)=>{all.push((all.at(-1)||0)+char.length);return all;},[]);
      for(const offset of offsets) {
        cuts.push({text,offset,position:consumed+offset});
      }
      consumed+=text.length;
    }
    const split=index=>{
      const boundary=cuts[index];
      return [true,false].map(before=>{
        const range=document.createRange();range.selectNodeContents(node);
        if(before)range.setEnd(boundary.text,boundary.offset);else range.setStart(boundary.text,boundary.offset);
        const part=node.cloneNode(false);part.append(range.cloneContents());
        return before?part:continuation(part);
      });
    };
    const plain=node.textContent,first=plain.search(/\S/),last=plain.trimEnd().length;
    const valid=cuts.map((_,index)=>index).filter(index=>cuts[index].position>first && cuts[index].position<last);
    // Code lines are atomic whenever a newline boundary can fit.
    const lineCuts=node.tagName==='PRE'?valid.filter(index=>cuts[index].text.nodeType===3 && cuts[index].text.data[cuts[index].offset-1]==='\n'):[];
    const search=indices=>{
      let left=0,right=indices.length-1,best=-1;
      while(left<=right) {
        const mid=(left+right)>>1;
        if(accepts(split(indices[mid])[0])){best=indices[mid];left=mid+1;}else right=mid-1;
      }
      return best;
    };
    let best=search(lineCuts.length?lineCuts:valid);
    if(best<0)return null;
    return split(best);
  }

  async paginateReadingSources(sources, isObsolete = () => false) {
    await this.ensureContentFontsLoaded();
    if(isObsolete())return null;
    const measureRoot=document.createElement("div");
    measureRoot.className="xhs-studio-root";
    measureRoot.style.cssText="display:block;position:fixed;left:-100000px;top:0;pointer-events:none";
    const card = document.createElement("div");
    card.className = "xhs-card xhs-page-detail xhs-detail-measure";
    card.style.cssText = `position:fixed;left:-100000px;top:0;width:${this.config.xhs_width}px;height:${this.config.xhs_height}px;transform:none;visibility:hidden;pointer-events:none`;
    this.applyDetailPresentation(card);
    measureRoot.append(card);document.body.append(measureRoot);
    const details = [];
    try {
      for (const source of sources) {
        const pageStart = details.length;
        card.replaceChildren();
        await this.renderDetail(card, { ...source, scrollable: false }, {});
        if(isObsolete())return null;
        const root = card.querySelector(".xhs-detail-scroll-root");
        const host = card.querySelector(".xhs-native-markdown-block");
        const sourceSignature=this.config.detail_page_type==="modular"?this.detailContentSignature([host]):null;
        const reserve=this.getDetailLayoutRules().paginationReserve;
        const fits = () => {
          this.ensureDetailContinuationContext(host);
          if(this.config.detail_page_type==="modular")this.applyDetailPageHierarchy(host);
          this.markDetailStyleStructure(host, card);
          const boundary = this.getDetailPaginationBottom(card);
          return Array.from(host.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,table,pre,[data-detail-image-slot],[data-detail-module],[data-detail-composition]"))
            .every(node => node.getBoundingClientRect().bottom <= boundary + 0.5);
        };
        // Keep an author-defined page intact whenever its complete rendered layout fits.
        if(host.children.length && fits()) {
          details.push({...source,scrollable:false,continuation:false,part:0,readingHtml:host.innerHTML,
            ...(sourceSignature?{modularIntegrity:true}:{})});
          continue;
        }
        const queue = Array.from(host.children, node => node.cloneNode(true));
        host.replaceChildren();
        let part = 0, attempts = 0;
        const emit = () => {
          if (!host.children.length) return;
          details.push({ ...source, scrollable: false, continuation: part > 0, part,
            isArticleTitle: source.isArticleTitle && part === 0, readingHtml: host.innerHTML });
          part++; host.replaceChildren();
        };
        while (queue.length) {
          if (++attempts > 10000) throw new Error("Reading pagination exceeded safe limits");
          if(attempts%24===0)await this.delay(0);
          if(isObsolete())return null;
          const node = queue.shift();
          const previous = host.lastElementChild;
          const findTable=element=>element?.tagName==="TABLE"?element
            :element?.dataset.detailModule==="table"?element.querySelector("table"):null;
          const previousTable=findTable(previous),nextTable=findTable(node);
          const mergingTable=previousTable && nextTable && nextTable.dataset.readingTable
            && previousTable.dataset.readingTable===nextTable.dataset.readingTable
            && !node.querySelector("h1,h2,h3,h4,h5,h6");
          const previousBody=previous?.querySelector(":scope > .xhs-module-chapter-body");
          const nextBody=node.querySelector(":scope > .xhs-module-chapter-body");
          const mergingChapter=node.dataset.readingFragment && previous?.dataset.detailModule==="chapter"
            && node.dataset.detailModule==="chapter" && previous.dataset.detailSource===node.dataset.detailSource
            && previousBody && nextBody && !node.querySelector("h1,h2,h3,h4,h5,h6");
          const referenceGroup=element=>element?.dataset.detailReference
            ?element.querySelector(':scope > .xhs-reference-list,:scope > table > tbody,:scope > .table-wrapper > table > tbody'):null;
          const previousReference=referenceGroup(previous),nextReference=referenceGroup(node);
          const mergingReference=previousReference && nextReference
            && previous.dataset.detailReference===node.dataset.detailReference && previous.dataset.detailSource===node.dataset.detailSource
            && !node.querySelector('h1,h2,h3,h4,h5,h6,.xhs-reference-intro,.xhs-reference-summary');
          const rows = mergingTable ? Array.from(nextTable.querySelectorAll("tbody > tr"), row => row.cloneNode(true))
            :mergingChapter?Array.from(nextBody.children,child=>child.cloneNode(true))
            :mergingReference?Array.from(nextReference.children,child=>child.cloneNode(true)):[];
          if (mergingTable) previousTable.querySelector("tbody").append(...rows);
          else if(mergingChapter)previousBody.append(...rows);
          else if(mergingReference)previousReference.append(...rows);
          else host.append(node);
          if (fits()) continue;
          rows.forEach(row => row.remove());
          node.remove();
          const keepHeading = previous && (/^H[1-6]$/.test(previous.tagName) || previous.classList.contains("xhs-reading-label") || previous.dataset.detailVariant==='standalone-label');
          const current=Array.from(host.children);
          const capacity=root.getBoundingClientRect().height-reserve;
          host.replaceChildren(node);
          this.markDetailStyleStructure(host, card);
          const protectedNodes=new Set(Array.from(node.querySelectorAll('li,.xhs-reference-item')).filter(item=>item.getBoundingClientRect().height<=capacity*.5));
          if(node.matches('li,.xhs-reference-item') && node.getBoundingClientRect().height<=capacity*.5)protectedNodes.add(node);
          const oversized=!fits();
          const tableModule=node.tagName==='TABLE' || node.dataset.detailModule==='table';
          if(!oversized && node.dataset.detailModule==='figure')protectedNodes.add(node);
          host.replaceChildren(...current);
          const used=host.lastElementChild?host.lastElementChild.getBoundingClientRect().bottom-root.getBoundingClientRect().top:0;
          const shortParagraphChapter=!oversized && node.dataset.detailModule==='chapter' && nextBody?.children.length===1 && nextBody.firstElementChild.tagName==='P';
          if(!shortParagraphChapter && (current.length || oversized) && capacity-used>=this.getDetailDesignSystem().body*VISUAL_RULES.bodyLeading*this.getDetailLayoutRules().paginationMinLines) {
            const parts=this.splitReadingToFit(node,piece=>{
              // Trial layout must match the chapter merge used when accepting a queued fragment.
              const body=piece.querySelector(':scope > .xhs-module-chapter-body');
              const merge=mergingChapter && body && !piece.querySelector('h1,h2,h3,h4,h5,h6');
              const added=merge?Array.from(body.children,child=>child.cloneNode(true)):[];
              host.replaceChildren(...current);
              if(merge)previousBody.append(...added);else host.append(piece);
              const result=fits();added.forEach(child=>child.remove());host.replaceChildren(...current);return result;
            },protectedNodes);
            if(parts){queue.unshift(...parts);continue;}
          }
          if (previous && (!keepHeading || host.children.length > 1)) {
            // Chapters may continue at paragraph boundaries, not only when taller than a page.
            // Keep headings with their first paragraph and indivisible cards intact.
            if(this.config.detail_page_type==="modular" && !keepHeading) {
              const current=Array.from(host.children);
              const chapterBody=node.querySelector(':scope > .xhs-module-chapter-body');
              const continuingChapter=node.dataset.detailModule==='chapter' && chapterBody?.children.length>1
                && Array.from(chapterBody.children).every(child=>child.tagName==='P');
              host.replaceChildren(node);
              const oversized=!fits();
              host.replaceChildren(...current);
              const recordTable=node.matches('table.xhs-module-record-table')?node:node.querySelector('table.xhs-module-record-table');
              const splittableTable=tableModule && (!recordTable || recordTable.querySelectorAll(':scope > tbody > tr').length>1);
              if(oversized || continuingChapter && !protectedNodes.has(node) || splittableTable) {
                const pieces=this.splitReadingElement(node);
                if(pieces.length>1){queue.unshift(...pieces);continue;}
              }
            }
            if (keepHeading) previous.remove();
            emit();
            if (keepHeading) host.append(previous);
            queue.unshift(node); continue;
          }
          const parts = this.splitReadingElement(node);
          if (parts.length > 1) { queue.unshift(...parts); continue; }
          // Never shrink body text or silently clip an indivisible block.
          host.append(node);
          if(!fits())throw new Error('内容块无法在单页完整显示，请拆分过大的图片、合并单元格表格或不可拆模块。');
          emit();
        }
        emit();
        for(const page of details.slice(pageStart)) {
          host.innerHTML=page.readingHtml;
          if(this.config.detail_page_type==='modular') {
            this.mergeDetailTableFragments(host);this.ensureDetailContinuationContext(host);this.applyDetailPageHierarchy(host);
          }
          if(!fits())throw new Error('自动分页边界核对失败，已停止生成，避免内容被裁切。');
          page.readingHtml=host.innerHTML;
        }
        if(sourceSignature) {
          const rendered=details.slice(pageStart).map(page=>{const node=document.createElement("div");node.innerHTML=page.readingHtml;return node;});
          if(sourceSignature!==this.detailContentSignature(rendered))throw new Error("模块化分页内容核对失败，已停止生成");
          details.slice(pageStart).forEach(page=>{page.modularIntegrity=true;});
        }
      }
      return details;
    } finally { measureRoot.remove(); }
  }

  async paginateDetailSources(sources) {
    const card = document.createElement("div");
    card.className = `xhs-card xhs-template-${this.config.xhs_style} xhs-page-detail xhs-detail-measure`;
    card.style.cssText = `position:fixed;left:-100000px;top:0;width:${this.config.xhs_width}px;height:${this.config.xhs_height}px;transform:none;visibility:hidden;pointer-events:none`;
    this.applyDetailPresentation(card);
    document.body.appendChild(card);
    const capacity = this.config.xhs_height - 152 - 2;
    const measure = async (tokens) => {
      card.replaceChildren();
      await this.renderDetail(card, { tokens, scrollable: false }, {});
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const content = card.querySelector(".xhs-detail-markdown");
      return Array.from(content.children).filter((el) => el._xhsDetailTokens).map((el) => ({
        tokens: el._xhsDetailTokens,
        height: Math.ceil(el.getBoundingClientRect().height)
      }));
    };
    const measureUnit = async (tokens) => {
      const units = await measure(tokens);
      return { tokens, height: units.reduce((sum, unit, index) => sum + unit.height + (index ? this.detailUnitGap(units[index - 1], unit) : 0), 0) };
    };
    const details = [];
    try {
      for (const source of sources) {
        const units = await measure(source.tokens);
        const pages = await this.paginateDetailUnits(units, capacity, measureUnit);
        pages.forEach((tokens, part) => details.push({
          ...source, tokens, scrollable: false, continuation: part > 0, part,
          title: source.title
        }));
      }
      return details;
    } finally { card.remove(); }
  }

  detailUnitGap(previous, next) {
    return previous ? this.getDetailBlankLineHeight(this.getDetailBlockGap(previous.tokens.at(-1), next.tokens[0])) : 0;
  }

  detailKeepWithNext(unit, next) {
    if (!next) return false;
    const last = unit.tokens.at(-1);
    return last.type === "heading" || last.type === "rule"
      || (last.type === "paragraph" && /[:\uff1a]\s*$/.test(last.text))
      || (last.type === "image" && next.tokens[0].type === "paragraph");
  }

  async minimumDetailUnitHeight(unit, measure) {
    const token = unit.tokens[0];
    if (token.type === "image") {
      return Math.min(unit.height, (this.config.detail_font_size || 30) * this.getDetailLineHeight() * 3);
    }
    if (token.type === "list" && token.items.length > 1) {
      return (await measure([{ ...token, items: token.items.slice(0, 1) }])).height;
    }
    if (["paragraph", "quote", "code"].includes(token.type)) {
      return Math.min(unit.height, (this.config.detail_font_size || 30) * this.getDetailLineHeight() * 2);
    }
    if (token.type === "table" && token.rows.length > 2) {
      return (await measure([{ ...token, rows: token.rows.slice(0, 2) }])).height;
    }
    return unit.height;
  }

  sliceDetailInlineText(text, start, end) {
    let offset = 0;
    return this.parseInlineSegments(text).map((segment) => {
      const chars = Array.from(segment.text);
      const part = chars.slice(Math.max(0, start - offset), Math.max(0, Math.min(chars.length, end - offset))).join("");
      offset += chars.length;
      if (!part) return "";
      if (segment.link) return `[${part}](${segment.link})`;
      return segment.bold ? `**${part}**` : segment.code ? `\`${part}\`` : part;
    }).join("");
  }

  async splitDetailUnit(unit, room, measure) {
    if (room < (this.config.detail_font_size || 30) * this.getDetailLineHeight()) return null;
    const token = unit.tokens[0];
    if (unit.tokens.every((item) => item.type === "image")) {
      const scale = Math.min(1, (room - 2) / Math.max(1, unit.height));
      const fitted = await measure(unit.tokens.map((item) => ({ ...item, displayScale: (item.displayScale || 1) * scale })));
      return fitted.height <= room ? [fitted, null] : null;
    }
    if (unit.tokens.length !== 1) return null;
    let length;
    let head;
    let tail;
    if (token.type === "list" && token.items.length > 1) {
      length = token.items.length - 1;
      head = (n) => ({ ...token, items: token.items.slice(0, n) });
      tail = (n) => ({ ...token, items: token.items.slice(n) });
    } else if (token.type === "table" && token.rows.length > 2) {
      length = token.rows.length - 1;
      head = (n) => ({ ...token, rows: token.rows.slice(0, n + 1) });
      tail = (n) => ({ ...token, rows: [token.rows[0], ...token.rows.slice(n + 1)], repeatedHeader: true });
    } else {
      const listItem = token.type === "list" && token.items.length === 1 ? token.items[0] : null;
      const text = listItem ? listItem.text : token.text;
      if (typeof text !== "string") return null;
      const raw = token.type === "code";
      const chars = Array.from(raw ? text : this.parseInlineSegments(text).map((segment) => segment.text).join(""));
      length = chars.length - 1;
      const slice = (from, to) => raw ? chars.slice(from, to).join("") : this.sliceDetailInlineText(text, from, to);
      head = (n) => listItem ? { ...token, items: [{ ...listItem, text: slice(0, n) }] } : { ...token, text: slice(0, n) };
      tail = (n) => listItem
        ? { ...token, ordered: token.ordered ?? /^\d+\.$/.test(listItem.marker), items: [{ ...listItem, marker: "", continuation: true, text: slice(n, chars.length) }] }
        : { ...token, text: slice(n, chars.length), continuation: true };
    }
    let low = 1;
    let high = length;
    let count = 0;
    let fitted = null;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = await measure([head(mid)]);
      if (candidate.height <= room) { count = mid; fitted = candidate; low = mid + 1; }
      else high = mid - 1;
    }
    if (!count) return null;
    let remainder = await measure([tail(count)]);
    const minimum = (this.config.detail_font_size || 30) * this.getDetailLineHeight() * 2;
    if (["paragraph", "quote"].includes(token.type) && remainder.height < minimum && unit.height > minimum * 2) {
      let left = 1;
      let right = count - 1;
      let balanced = 0;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if ((await measure([tail(mid)])).height >= minimum) { balanced = mid; left = mid + 1; }
        else right = mid - 1;
      }
      if (balanced) { fitted = await measure([head(balanced)]); remainder = await measure([tail(balanced)]); }
    }
    return [fitted, remainder];
  }

  async paginateDetailUnits(source, capacity, measure) {
    const pending = source.slice();
    const pages = [];
    let page = [];
    let used = 0;
    const flush = () => {
      if (page.length) pages.push(page.flatMap((unit) => unit.tokens));
      page = []; used = 0;
    };
    while (pending.length) {
      const unit = pending[0];
      const gap = this.detailUnitGap(page.at(-1), unit);
      let reserve = 0;
      let cursor = 0;
      while (this.detailKeepWithNext(pending[cursor], pending[cursor + 1])) {
        const next = pending[++cursor];
        reserve += this.detailUnitGap(pending[cursor - 1], next) + await this.minimumDetailUnitHeight(next, measure);
      }
      const room = capacity - used - gap;
      if (unit.height + reserve <= room) {
        page.push(unit); used += gap + unit.height; pending.shift(); continue;
      }
      if (page.length && (unit.height + reserve <= capacity || room - reserve < (this.config.detail_font_size || 30) * this.getDetailLineHeight() * 2)) {
        flush(); continue;
      }
      const split = await this.splitDetailUnit(unit, Math.max(0, room - Math.min(reserve, capacity / 2)), measure);
      if (split) {
        page.push(split[0]);
        if (split[1]) { pending[0] = split[1]; flush(); }
        else { used += gap + split[0].height; pending.shift(); }
        continue;
      }
      if (page.length) { flush(); continue; }
      // A single oversized table row needs a fitted presentation, not silent clipping.
      const fitted = await measure(unit.tokens.map((token) => ({ ...token, fittedScale: capacity / Math.max(capacity, unit.height) })));
      page.push(fitted); pending.shift(); flush();
    }
    flush();
    return pages;
  }

  collectDetailImageRun(tokens, startIndex) {
    const imageTokens = [];
    let cursor = startIndex;
    let lastImageIndex = startIndex;
    while (cursor < tokens.length) {
      const token = tokens[cursor];
      if (token && token.type === "image") {
        imageTokens.push(token);
        lastImageIndex = cursor;
        cursor++;
        continue;
      }
      if (token && token.type === "spacer") {
        let lookahead = cursor + 1;
        while (lookahead < tokens.length && tokens[lookahead] && tokens[lookahead].type === "spacer") {
          lookahead++;
        }
        if (lookahead < tokens.length && tokens[lookahead] && tokens[lookahead].type === "image") {
          cursor++;
          continue;
        }
      }
      break;
    }
    return { imageTokens, endIndex: lastImageIndex };
  }

  async renderMarkdownToken(parent, token, imageLayer = parent) {
    if (MarkdownRenderer?.render && ["heading", "rule", "paragraph", "list", "table", "quote", "code"].includes(token.type)) {
      const source = token.type === "heading" ? `${"#".repeat(Math.min(6, Math.max(1, token.level)))} ${token.text || ""}`
        : token.type === "rule" ? "***" : token.type === "list" ? token.items.map(item =>
        `${"  ".repeat(item.depth || 0)}${item.marker || "-"} ${typeof item.checked === "boolean" ? `[${item.checked ? "x" : " "}] ` : ""}${item.text || ""}`).join("\n")
        : token.type === "quote" ? (token.text || "").split("\n").map(line => `> ${line}`).join("\n")
        : token.type === "code" ? `\`\`\`${token.language || ""}\n${token.text || ""}\n\`\`\``
        : token.type === "table" ? token.source || token.rows.map((row, index) =>
          `| ${row.join(" | ")} |${index === 0 ? `\n| ${row.map(() => "---").join(" | ")} |` : ""}`).join("\n")
        : token.text || "";
      const host = parent.createDiv({ cls: "xhs-native-markdown-block markdown-rendered" });
      host.dataset.sourceType = token.type;
      await MarkdownRenderer.render(this.app, source, host, this.activeFile?.path || "", this);
      return;
    }
    if (token.type === "rule") {
      parent.createEl("hr");
      return;
    }
    if (token.type === "spacer") {
      const spacer = parent.createDiv({ cls: "xhs-detail-spacer", attr: { "data-lines": String(token.lines || 1) } });
      spacer.style.height = `${this.getDetailBlankLineHeight(token.lines)}px`;
      return;
    }
    if (token.type === "heading") {
      const tag = `h${Math.min(6, Math.max(1, token.level))}`;
      const heading = parent.createEl(tag);
      heading.classList.add(`xhs-detail-level-${token.displayLevel || token.level}`);
      this.renderDetailHeadingInline(heading, token.text);
      return;
    }
    if (token.type === "list") {
      const ordered = token.ordered ?? /^\d+\.$/.test(token.items[0]?.marker || "");
      const list = parent.createEl(ordered ? "ol" : "ul");
      const markerWidth = ordered ? Math.max(2, ...token.items.map((item) => String(item.marker || "").length)) : 1;
      list.style.setProperty("--xhs-marker-width", `${markerWidth * 0.65 + 0.5}em`);
      if (ordered) {
        const firstNumber = this.getOrderedListMarkerNumber(token.items[0]?.marker);
        if (firstNumber > 1) list.setAttr("start", String(firstNumber));
      }
      token.items.forEach((item) => {
        const li = list.createEl("li");
        li.style.marginLeft = `${(item.depth || 0) * 0.8}em`;
        if (ordered && /^\d+\.$/.test(item.marker || "")) {
          li.setAttr("value", String(this.getOrderedListMarkerNumber(item.marker)));
        }
        const marker = item.continuation ? "" : typeof item.checked === "boolean" ? (item.checked ? "\u2611" : "\u2610") : /^\d+\.$/.test(item.marker || "") ? item.marker : "\u2022";
        li.createSpan({ cls: "xhs-detail-list-marker", text: marker, attr: { "aria-hidden": "true" } });
        this.renderInlineMarkdown(li.createSpan({ cls: "xhs-detail-list-text" }), item.text || item);
      });
      return;
    }
    if (token.type === "table") {
      const table = parent.createEl("table");
      token.rows.forEach((row, rowIndex) => {
        const tr = table.createEl("tr");
        row.forEach((cell) => {
          const tag = rowIndex === 0 ? "th" : "td";
          const el = tr.createEl(tag);
          this.renderInlineMarkdown(el, cell);
        });
      });
      return;
    }
    if (token.type === "quote") {
      const callout = (token.text || "").match(/^\[!([\w-]+)\]([+-])?\s*([^\n]*)(?:\n([\s\S]*))?$/);
      if (callout) {
        const box = parent.createEl("blockquote", { cls: "xhs-detail-callout" });
        box.dataset.calloutType = callout[1].toLowerCase();
        const labels = { note: "笔记", tip: "提示", warning: "注意", danger: "警告", info: "信息", example: "示例", question: "问题", success: "完成", abstract: "摘要", todo: "待办" };
        if(callout[3])box.createDiv({ cls: "xhs-detail-callout-title", text: callout[3] });
        const body = box.createDiv({ cls: "xhs-detail-callout-body" });
        for (const child of this.prepareDetailTokens(this.parseMarkdownTokens(callout[4] || ""))) {
          await this.renderMarkdownToken(body, child, imageLayer);
        }
        return;
      }
      const quote = parent.createEl("blockquote");
      this.renderInlineMarkdown(quote, token.text);
      return;
    }
    if (token.type === "code") {
      const pre = parent.createEl("pre");
      pre.createEl("code", { text: token.text });
      return;
    }
    if (token.type === "image") {
      await this.renderMarkdownImageToken(parent, token, imageLayer);
      return;
    }
    const paragraph = parent.createEl("p");
    this.renderInlineMarkdown(paragraph, token.text || "");
  }

  renderInlineMarkdown(parent, text) {
    const pattern = /(<br\s*\/?>|==[^\n]+?==|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\)|\[\[[^\]]+\]\])/gi;
    let cursor = 0;
    const source = this.toText(text);
    source.replace(pattern, (match, _token, offset) => {
      if (offset > cursor) parent.appendChild(document.createTextNode(source.slice(cursor, offset)));
      if (/^<br/i.test(match)) {
        parent.createEl("br");
      } else if (match.startsWith("==")) {
        const mark=parent.createEl("mark");
        this.renderInlineMarkdown(mark, match.slice(2, -2));
        this.normalizeDetailHighlights(parent);
      } else if (match.startsWith("**")) {
        this.renderInlineMarkdown(parent.createEl("strong"), match.slice(2, -2));
      } else if (match.startsWith("`")) {
        parent.createEl("code", { text: match.slice(1, -1) });
      } else {
        const link = this.parseDetailLink(match);
        parent.createEl("span", { cls: "xhs-detail-link", text: link.text });
      }
      cursor = offset + match.length;
      return match;
    });
    if (cursor < source.length) parent.appendChild(document.createTextNode(source.slice(cursor)));
  }

  getOrderedListMarkerNumber(marker) {
    const match = this.toText(marker).match(/^(\d+)\.$/);
    return match ? Math.max(1, Number.parseInt(match[1], 10) || 1) : 1;
  }

  renderDetailHeadingInline(parent, text) {
    this.renderInlineMarkdown(parent, text);
  }

  async renderMarkdownImageToken(parent, token, imageLayer, inline = false, columns = 1, groupKeys = [], groupForcedBlock = false, pairKeys = [], pairMode = false, pairMasterSize = null) {
    const src = await this.resolveImage(token.src);
    if (!src) {
      const missing = parent.createDiv({ cls: "xhs-detail-image-missing", text: token.src });
      missing._xhsDetailTokens = [token];
      return;
    }
    const imageIndex = this.detailImageRenderIndex++;
    const imageKey = this.getDetailImageKey(token, imageIndex);
    const imageMeta = await this.loadImage(src).catch(() => null);
    const imageAspectRatio = imageMeta
      ? (imageMeta.naturalWidth || imageMeta.width) / Math.max(1, imageMeta.naturalHeight || imageMeta.height)
      : 0;
    const imageNaturalWidth = imageMeta ? (imageMeta.naturalWidth || imageMeta.width || 0) : 0;
    const contentWidth = this.getDetailContentWidth();
    const imageGap = this.getDetailImageGap();
    const maxDefaultWidth = inline ? Math.floor((contentWidth - imageGap * Math.max(0, columns - 1)) / Math.max(1, columns)) : 0;
    const layout = this.getDetailImageLayout(imageKey, token, imageAspectRatio, imageIndex, imageNaturalWidth, maxDefaultWidth);
    if (inline && pairMode && pairMasterSize) {
      layout.w = pairMasterSize.w;
      layout.h = Math.round(layout.w / Math.max(0.01, layout.aspectRatio));
      layout.slotW = pairMasterSize.slotW || maxDefaultWidth || pairMasterSize.w;
      layout.pairMode = true;
    }
    const slot = parent.createDiv({
      cls: `xhs-detail-image-slot${inline ? " is-inline" : ""}`,
      attr: { "data-detail-image-slot": imageKey }
    });
    slot._xhsDetailTokens = [token];
    this.applyDetailImageSlot(slot, layout);
    const wrap = imageLayer.createDiv({
      cls: `xhs-detail-image-wrap${this.selectedDetailImageKey === imageKey ? " is-selected" : ""}`,
      attr: { "data-detail-image-key": imageKey }
    });
    wrap.dataset.detailMaxW = String(contentWidth);
    wrap.dataset.detailInline = inline ? "1" : "0";
    wrap.dataset.detailGroupKeys = groupKeys.length ? groupKeys.join("|") : imageKey;
    wrap.dataset.detailGroupForced = groupForcedBlock ? "1" : "0";
    wrap.dataset.detailPairKeys = pairKeys.length ? pairKeys.join("|") : imageKey;
    wrap.dataset.detailPairMode = pairMode ? "1" : "0";
    this.bindDetailImageSlot(wrap, slot);
    const img = wrap.createEl("img", { attr: { src, alt: token.alt || "" } });
    this.applyDetailImageLayout(wrap, img, layout);
    ["nw", "ne", "sw", "se"].forEach((anchor) => {
      const handle = wrap.createDiv({ cls: `xhs-detail-image-resize-handle is-${anchor}` });
      handle.addEventListener("pointerdown", (event) => this.startDetailImageResize(event, imageKey, wrap, img, anchor));
    });
    wrap.addEventListener("pointerdown", (event) => this.startDetailImageDrag(event, imageKey, wrap, img));
    wrap.addEventListener("click", (event) => {
      event.stopPropagation();
      this.selectDetailImageElement(imageKey, wrap);
    });
    this.renderDetailImageActions(wrap,imageKey);
    return { key: imageKey, layout };
  }

  getDetailImageLayout(key, token, imageAspectRatio = 0, imageIndex = 0, imageNaturalWidth = 0, maxDefaultWidth = 0) {
    if (!this.config.detail_image_layouts || typeof this.config.detail_image_layouts !== "object") {
      this.config.detail_image_layouts = {};
    }
    const saved = this.config.detail_image_layouts[key] || {};
    const tokenAspectRatio = token.width && token.height ? token.width / Math.max(1, token.height) : 0;
    const savedAspectRatio = this.toFloat(saved.aspectRatio, 0, 0, 20);
    const aspectRatio = imageAspectRatio || tokenAspectRatio || savedAspectRatio;
    const contentWidth = this.getDetailContentWidth();
    const forceBlock = Boolean(saved.forceBlock);
    const inline = maxDefaultWidth > 0 && !forceBlock;
    const defaultLimit = inline ? maxDefaultWidth : contentWidth;
    const configuredWidth = this.config.detail_image_width === DEFAULT_CONFIG.detail_image_width
      ? contentWidth : this.toNumber(this.config.detail_image_width, contentWidth, 80, contentWidth);
    const documentWidth = token.width || configuredWidth;
    const defaultWidth = Math.min(defaultLimit, documentWidth || imageNaturalWidth || 520);
    const savedBoxAspect = saved.w && saved.h ? saved.w / Math.max(1, saved.h) : 0;
    const modular=this.config.detail_page_type==="modular";
    const frameRatio=modular && saved.fit==="cover" ? this.toFloat(saved.frameRatio,4/3,.25,32) : 0;
    const legacyWrongBox = !(modular && saved.fit) && !frameRatio && !token.width && imageAspectRatio && savedBoxAspect && Math.abs(savedBoxAspect - imageAspectRatio) > 0.08;
    const maxWidth = inline ? Math.max(80, defaultLimit) : contentWidth;
    const selectedWidth = this.toNumber((legacyWrongBox ? 0 : saved.w) || token.width || defaultWidth, defaultWidth, 80, maxWidth);
    const system = this.getDetailDesignSystem();
    const displayRatio=frameRatio || aspectRatio;
    const reserve=frameRatio?this.getDetailLayoutRules().paginationReserve:system.unit*(modular?32:8);
    const pageLimit = displayRatio ? (this.config.xhs_height - system.margin * 2 - reserve) * displayRatio : maxWidth;
    const naturalLimit=modular && !saved.adjusted && !saved.w && !token.width && !inline
      && this.config.detail_image_width===DEFAULT_CONFIG.detail_image_width && imageNaturalWidth>0
      ? imageNaturalWidth : maxWidth;
    const width = Math.max(1, Math.round(this.snapDetailImageWidth(selectedWidth, Math.min(maxWidth, pageLimit, naturalLimit))));
    const heightFallback = saved.h || token.height || this.config.detail_image_height || (aspectRatio ? Math.round(width / aspectRatio) : 0);
    const height = displayRatio ? Math.max(1, Math.round(width / displayRatio)) : this.toNumber(heightFallback, 0, 0, 1600);
    const defaultX = inline ? 0 : Math.max(0, (contentWidth - width) / 2);
    return {
      x: modular && saved.adjusted
        ? this.toNumber(saved.x, defaultX, -contentWidth, contentWidth)
        : defaultX,
      y: 0,
      w: width,
      h: height,
      aspectRatio,
      fit:frameRatio?"cover":"contain",
      frameRatio:frameRatio || 4/3,
      align: saved.align && saved.align !== "free" ? saved.align : modular && saved.adjusted ? "free" : "center",
      focalX:this.toNumber(saved.focalX,50,0,100),
      focalY:this.toNumber(saved.focalY,50,0,100),
      slotH: height,
      slotW: inline ? Math.max(40, maxDefaultWidth || width) : width,
      pairMode: Boolean(saved.pairMode),
      forceBlock,
      anchored: true
    };
  }

  getDetailImageKey(token, imageIndex) {
    if (token && token.imageKey) return token.imageKey;
    return this.makeDetailImageKey(this.activePageIndex, imageIndex, token && token.src);
  }

  makeDetailImageKey(pageIndex, imageIndex, src) {
    const source = this.toText(src || `image-${imageIndex}`).trim();
    let hash = 0;
    Array.from(source).forEach((char) => {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    });
    return `${pageIndex}:${imageIndex}:${Math.abs(hash)}`;
  }

  saveDetailImageLayout(key, layout) {
    if (!this.config.detail_image_layouts || typeof this.config.detail_image_layouts !== "object") {
      this.config.detail_image_layouts = {};
    }
    if(this.config.detail_page_type==="modular" && layout.aspectRatio) {
      const ratio=layout.fit==="cover"?layout.frameRatio || 4/3:layout.aspectRatio;
      layout.h=Math.max(1,Math.round(layout.w/ratio));
    }
    this.config.detail_image_layouts[key] = {
      x: Math.round(layout.x || 0),
      y: 0,
      w: Math.round(layout.w || 0),
      h: Math.round(layout.h || 0),
      aspectRatio: Number(layout.aspectRatio || 0),
      fit:layout.fit==="cover"?"cover":"contain",
      frameRatio:Number(layout.frameRatio || 4/3),
      align:layout.align || "free",
      focalX:this.toNumber(layout.focalX,50,0,100),
      focalY:this.toNumber(layout.focalY,50,0,100),
      slotH: Math.round(layout.h || 0),
      slotW: Math.round(layout.slotW || layout.w || 0),
      pairMode: Boolean(layout.pairMode),
      forceBlock: Boolean(layout.forceBlock),
      adjusted: true,
      anchored: true
    };
    this.persistDraft();
  }

  getDetailPairWidth(wrap,requested) {
    const max=Math.floor((Number(wrap.dataset.detailMaxW || this.getDetailContentWidth())-this.getDetailImageGap())/2);
    const card=wrap.closest('.xhs-card'),system=this.getDetailDesignSystem();
    const height=this.config.xhs_height-system.margin*2-system.unit*32;
    let limit=max;
    for(const key of this.getDetailPairKeysFromWrap(wrap)) {
      const peer=card?.querySelector(`[data-detail-image-key="${key}"]`);
      const aspect=this.getDetailImageAspect(peer?._xhsDetailLayout || this.config.detail_image_layouts?.[key] || {},peer,peer?.querySelector('img'));
      if(aspect)limit=Math.min(limit,height*aspect);
    }
    return Math.max(1,Math.min(limit,Math.max(Math.min(80,limit),Math.round(requested || max))));
  }

  previewDetailImagePair(wrap,layout) {
    const card=wrap.closest('.xhs-card');
    for(const key of this.getDetailPairKeysFromWrap(wrap)) {
      const peer=card?.querySelector(`[data-detail-image-key="${key}"]`);
      if(!peer || peer===wrap)continue;
      const next={...peer._xhsDetailLayout,w:layout.w,x:0,y:0,fit:'contain'};
      this.applyDetailImageLayout(peer,peer.querySelector('img'),next);
    }
  }

  renderDetailImageActions(wrap,key) {
    const tools=wrap.createDiv({cls:'xhs-detail-image-actions'});
    tools.addEventListener('pointerdown',event=>event.stopPropagation());
    tools.addEventListener('dblclick',event=>event.stopPropagation());
    if(this.canToggleDetailImagePairMode(wrap,key)) {
      const active=wrap.dataset.detailPairMode==='1';
      const toggle=tools.createEl('button',{text:active?'逐张':'并排',attr:{type:'button','aria-label':active?'切换为逐张图片':'两张图片并排展示'}});
      toggle.addEventListener('click',event=>{event.stopPropagation();this.toggleDetailImagePairMode(wrap,key);});
    }
    const reset=tools.createEl('button',{text:'恢复尺寸',attr:{type:'button'}});
    reset.addEventListener('click',event=>{
      event.stopPropagation();
      if(wrap.dataset.detailPairMode==='1') {
        const width=this.getDetailPairWidth(wrap,Infinity);
        this.saveDetailImagePairLayout(wrap,{...wrap._xhsDetailLayout,w:width});
        this.detailPaginationKey='';void this.renderPreview();
      } else this.resetDetailImageLayout(key);
    });
  }

  saveDetailImagePairLayout(wrap, currentLayout) {
    const keys = this.getDetailPairKeysFromWrap(wrap);
    if (keys.length !== 2 || !currentLayout) return false;
    if (!this.config.detail_image_layouts || typeof this.config.detail_image_layouts !== "object") {
      this.config.detail_image_layouts = {};
    }
    const contentWidth = Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const pairWidth = Math.max(80, Math.floor((contentWidth - this.getDetailImageGap()) / 2));
    const width = this.getDetailPairWidth(wrap,currentLayout.w);
    const aspectRatio = Number(currentLayout.aspectRatio) || (currentLayout.w && currentLayout.h ? currentLayout.w / Math.max(1, currentLayout.h) : 1);
    const card = wrap.closest(".xhs-card");
    keys.forEach((imageKey) => {
      const previous = this.config.detail_image_layouts[imageKey] || {};
      const imageWrap = card ? card.querySelector(`[data-detail-image-key="${imageKey}"]`) : null;
      const ownAspect = this.getDetailImageAspect(imageWrap?._xhsDetailLayout || previous, imageWrap, imageWrap?.querySelector("img")) || aspectRatio;
      const height = Math.max(1, Math.round(width / ownAspect));
      this.config.detail_image_layouts[imageKey] = {
        ...previous,
        fit:"contain",
        x: 0,
        y: 0,
        w: width,
        h: height,
        slotH: height,
        slotW: pairWidth,
        aspectRatio: ownAspect,
        pairMode: true,
        forceBlock: false,
        adjusted: true,
        anchored: true
      };
    });
    this.persistDraft();
    return true;
  }

  resetDetailImageLayout(key) {
    if (!key) return;
    if (!this.config.detail_image_layouts || typeof this.config.detail_image_layouts !== "object") {
      this.config.detail_image_layouts = {};
    }
    delete this.config.detail_image_layouts[key];
    this.detailPaginationKey="";
    this.selectedDetailImageKey = "";
    this.persistDraft();
    void this.renderPreview();
    new Notice("已恢复为文档初始尺寸");
  }

  getDetailPairKeysFromWrap(wrap) {
    return this.toText(wrap && wrap.dataset ? wrap.dataset.detailPairKeys : "")
      .split("|")
      .map((key) => key.trim())
      .filter(Boolean);
  }

  canToggleDetailImagePairMode(wrap, key) {
    const keys = this.getDetailPairKeysFromWrap(wrap);
    return keys.length === 2 && keys.includes(key);
  }

  toggleDetailImagePairMode(wrap, key) {
    const keys = this.getDetailPairKeysFromWrap(wrap);
    if (keys.length !== 2 || !keys.includes(key)) return false;
    if (!this.config.detail_image_layouts || typeof this.config.detail_image_layouts !== "object") {
      this.config.detail_image_layouts = {};
    }
    const active = keys.some((imageKey) => this.isDetailImagePairModeKey(imageKey));
    if (active) {
      keys.forEach(imageKey=>{
        const previous=this.config.detail_image_layouts[imageKey] || {};
        if(previous.pairSingleLayout)this.config.detail_image_layouts[imageKey]={...previous.pairSingleLayout};
        else {
          const restored={...previous,pairMode:false,forceBlock:false};
          for(const field of ['w','h','slotW','slotH','x','y','pairSingleLayout'])delete restored[field];
          this.config.detail_image_layouts[imageKey]=restored;
        }
      });
      this.detailPaginationKey="";
      this.persistDraft();
      void this.renderPreview();
      return true;
    }

    const card = wrap.closest(".xhs-card");
    const firstWrap = card ? card.querySelector(`[data-detail-image-key="${keys[0]}"]`) : null;
    const firstLayout = (firstWrap && firstWrap._xhsDetailLayout) || this.config.detail_image_layouts[keys[0]] || {};
    const contentWidth = Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const pairWidth = Math.max(80, Math.floor((contentWidth - this.getDetailImageGap()) / 2));
    const firstWidth = this.getDetailPairWidth(wrap,pairWidth);
    const firstAspect = Number(firstLayout.aspectRatio) || (firstLayout.w && firstLayout.h ? firstLayout.w / Math.max(1, firstLayout.h) : 0) || 1;
    keys.forEach((imageKey) => {
      const previous = this.config.detail_image_layouts[imageKey] || {};
      const imageWrap = card ? card.querySelector(`[data-detail-image-key="${imageKey}"]`) : null;
      const ownAspect = this.getDetailImageAspect(imageWrap?._xhsDetailLayout || previous, imageWrap, imageWrap?.querySelector("img")) || firstAspect;
      const height = Math.max(1, Math.round(firstWidth / ownAspect));
      this.config.detail_image_layouts[imageKey] = {
        ...previous,
        pairSingleLayout:{...previous},
        fit:"contain",
        x: 0,
        y: 0,
        w: firstWidth,
        h: height,
        slotH: height,
        slotW: pairWidth,
        aspectRatio: ownAspect,
        pairMode: true,
        forceBlock: false,
        adjusted: true,
        anchored: true
      };
    });
    this.detailPaginationKey="";
    this.persistDraft();
    void this.renderPreview();
    return true;
  }

  releaseDetailImageGroupBlock(wrap, currentKey, currentLayout = null) {
    if (!this.config.detail_image_layouts || typeof this.config.detail_image_layouts !== "object") {
      this.config.detail_image_layouts = {};
    }
    const keys = this.toText(wrap && wrap.dataset ? wrap.dataset.detailGroupKeys : "")
      .split("|")
      .map((key) => key.trim())
      .filter(Boolean);
    if (!keys.length && currentKey) keys.push(currentKey);
    keys.forEach((key) => {
      const previous = this.config.detail_image_layouts[key] || {};
      const next = key === currentKey && currentLayout ? { ...previous, ...currentLayout } : { ...previous };
      next.forceBlock = false;
      next.adjusted = true;
      next.anchored = true;
      this.config.detail_image_layouts[key] = next;
    });
    if (wrap && wrap.dataset) wrap.dataset.detailGroupForced = "0";
    this.persistDraft();
  }

  isDetailImageForcedBlock(token, imageIndex) {
    const key = this.getDetailImageKey(token, imageIndex);
    return this.isDetailImageKeyForcedBlock(key);
  }

  isDetailImageKeyForcedBlock(key) {
    const layout = this.config.detail_image_layouts && this.config.detail_image_layouts[key];
    return Boolean(layout && layout.forceBlock);
  }

  isDetailImagePairModeKey(key) {
    const layout = this.config.detail_image_layouts && this.config.detail_image_layouts[key];
    return Boolean(layout && layout.pairMode);
  }

  applyDetailImageLayout(wrap, img, layout) {
    wrap._xhsDetailLayout = layout;
    const aspectRatio = this.getDetailImageAspect(layout, wrap, img);
    const system = this.getDetailDesignSystem();
    const limit = wrap.dataset.detailInline === "1" ? layout.slotW : Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const modular=this.config.detail_page_type==="modular";
    const displayRatio=modular && layout.fit==="cover" ? layout.frameRatio || 4/3 : aspectRatio;
    const reserve=modular && layout.fit==='cover'?this.getDetailLayoutRules().paginationReserve:system.unit*(modular?32:8);
    const pageLimit = displayRatio ? (this.config.xhs_height - system.margin * 2 - reserve) * displayRatio : limit;
    layout.w = this.snapDetailImageWidth(layout.w || wrap.offsetWidth || limit, Math.min(limit, pageLimit));
    if (aspectRatio) {
      layout.aspectRatio = aspectRatio;
      layout.h = Math.max(1, Math.round((layout.w || wrap.offsetWidth || 80) / displayRatio));
    }
    const contentWidth = Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const baseX = Number(wrap.dataset.detailBaseX || 0);
    const baseY = Number(wrap.dataset.detailBaseY || 0);
    const inline = wrap.dataset.detailInline === "1";
    const pairMode = wrap.dataset.detailPairMode === "1";
    if (inline && pairMode) {
      layout.x = 0;
      layout.y = 0;
      wrap.style.left = `${baseX}px`;
      wrap.style.top = `${baseY}px`;
      wrap.style.width = `${layout.w}px`;
      wrap.style.height = `${layout.h}px`;
      wrap.style.aspectRatio = aspectRatio ? String(aspectRatio) : "";
      img.style.width = "100%";
      img.style.height = "100%";
      if (wrap._xhsDetailImageSlot) this.applyDetailImageSlot(wrap._xhsDetailImageSlot, layout);
      return;
    }
    const minX = inline ? -baseX : 0;
    const maxX = Math.max(minX, contentWidth - baseX - (layout.w || 0));
    layout.x = modular ? this.toNumber(layout.x,0,minX,maxX) : 0;
    if(!inline && ["left","center","right"].includes(layout.align)) {
      layout.x=layout.align==="left"?minX:layout.align==="right"?maxX:(minX+maxX)/2;
    }
    layout.y = 0;
    wrap.style.left = `${baseX + layout.x}px`;
    wrap.style.top = `${baseY + layout.y}px`;
    wrap.style.width = `${layout.w}px`;
    wrap.style.height = `${layout.h}px`;
    wrap.style.aspectRatio = displayRatio ? String(displayRatio) : "";
    img.style.width = "100%";
    img.style.height = "100%";
    if(modular) {
      img.style.objectFit=layout.fit==="cover"?"cover":"contain";
      img.style.objectPosition=`${layout.focalX ?? 50}% ${layout.focalY ?? 50}%`;
    }
    if (wrap._xhsDetailImageSlot) this.applyDetailImageSlot(wrap._xhsDetailImageSlot, layout);
  }

  bindDetailImageSlot(wrap, slot) {
    wrap._xhsDetailImageSlot = slot;
    const position = this.getDetailSlotPosition(slot);
    wrap.dataset.detailBaseX = String(position.x);
    wrap.dataset.detailBaseY = String(position.y);
  }

  getDetailSlotPosition(slot) {
    const content = slot.closest(".xhs-detail-markdown");
    let x = 0, y = 0, node = slot;
    while (node && node !== content) {
      x += node.offsetLeft || 0;
      y += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return { x, y };
  }

  applyDetailImageSlot(slot, layout) {
    const inline = slot.classList.contains("is-inline");
    const reserveHeight = Math.max(1, Math.round(layout.h || 0));
    layout.slotH = reserveHeight;
    slot.style.height = `${reserveHeight}px`;
    if (inline) {
      const reserveWidth = Math.max(40, Math.round(layout.slotW || layout.w || 0));
      slot.style.width = `${reserveWidth}px`;
    } else {
      slot.style.width = "100%";
    }
  }

  getDetailContentWidth() {
    return this.getDetailDesignSystem().content;
  }

  getContentDivider(config = this.config) {
    const width=VISUAL_RULES.dividerWidth*(Number(config.xhs_width)||VISUAL_RULES.width)/VISUAL_RULES.width;
    return {width,color:VISUAL_RULES.dividerColor,border:`${width}px solid ${VISUAL_RULES.dividerColor}`,
      inset:`inset ${-width}px 0 0 ${VISUAL_RULES.dividerColor}`};
  }

  getDetailPalette(config = this.config) {
    const {background,ink,bodyInk,muted,surface,media}=VISUAL_RULES;
    const accent=this.parseCoverHexColor(config.detail_title_highlight_color) || VISUAL_RULES.accent;
    const readableOn=base=>this.getDetailColorContrast(accent,base)>=4.5;
    const highlight=readableOn(background) && readableOn(surface) && readableOn(media) ? accent : ink;
    const channels=accent.slice(1).match(/../g).map(channel=>parseInt(channel,16));
    let tint=background;
    if(accent===VISUAL_RULES.accent) tint='#e6ebff';
    else for(const amount of [.12,.08,.04]) {
      const candidate='#'+channels.map(channel=>Math.round(255+(channel-255)*amount).toString(16).padStart(2,'0')).join('');
      if(this.getDetailColorContrast(highlight,candidate)>=4.5){tint=candidate;break;}
    }
    const onAccent=this.getDetailColorContrast('#ffffff',accent)>=4.5 ? '#ffffff' : '#000000';
    return {background,ink,bodyInk,muted,accent,highlight,tint,onAccent,media,card:surface,titleBand:surface};
  }

  getDetailDesignSystem(config = this.config) {
    const divider=this.getContentDivider(config);
    const scale = (Number(config.xhs_width) || VISUAL_RULES.width) / VISUAL_RULES.width;
    const body = [VISUAL_RULES.body,VISUAL_RULES.bodyLarge].find(value => Math.abs(value * scale - config.detail_font_size) < .01) || VISUAL_RULES.body;
    const headingSizes=(config.detail_page_type==="modular"?[60,52,40,36,36,36]:[64,48,40,36,36,36]).map(value=>value*body/VISUAL_RULES.body*scale);
    const modular=config.detail_page_type==="modular";
    const spacing={micro:4,icon:8,item:16,card:VISUAL_RULES.cardPadding,control:24,paragraph:24,column:24,module:32,chapter:48};
    for(const key of Object.keys(spacing))spacing[key]*=scale;
    const radius=(modular?24:16)*scale;
    return {version:"unified-detail-1",columns:6,
      unit:VISUAL_RULES.unit*scale,margin:VISUAL_RULES.margin*scale,gutter:VISUAL_RULES.gutter*scale,column:VISUAL_RULES.column*scale,content:VISUAL_RULES.content*scale,
      title:headingSizes[0],section:headingSizes[1],module:headingSizes[2],body:body*scale,caption:VISUAL_RULES.caption*body/VISUAL_RULES.body*scale,
      ordinal:headingSizes[2],
      colors:this.getDetailPalette(config),
      typography:{
        textFont:CONTENT_FONT_STACK,
        displayFont:CONTENT_FONT_STACK,
        monoFont:CONTENT_FONT_STACK,
        bodyLeading:VISUAL_RULES.bodyLeading,captionLeading:VISUAL_RULES.captionLeading,headingLeading:VISUAL_RULES.headingLeading,
        primaryLeading:VISUAL_RULES.primaryLeading,headingWeight:VISUAL_RULES.headingWeight,bodyWeight:VISUAL_RULES.bodyWeight,
        metricScale:VISUAL_RULES.metricScale,metricLeading:VISUAL_RULES.metricLeading},
      divider,
      effects:{cardShadow:`0 ${2*scale}px ${8*scale}px rgba(29,29,31,.045), 0 ${scale}px ${2*scale}px rgba(29,29,31,.04), inset 0 0 0 ${scale}px rgba(29,29,31,.06)`,labelEdge:divider.inset},
      spacing,
      cardTokens:{padding:spacing.card,gap:spacing.item,'title-gap':spacing.item,'field-gap':spacing.control,'paragraph-gap':spacing.paragraph,
        'item-gap':spacing.item,'column-gap':spacing.item,radius,'marker-size':VISUAL_RULES.marker*scale,'marker-gap':16*scale,
        'marker-inset':24*scale,'label-width':144*scale,'label-inset':16*scale,'ordinal-min':VISUAL_RULES.ordinalMin*scale,'tab-height-default':640*scale},
      borders:{container:divider.border,record:divider.border,title:divider.border},
      colorBudget:{target:{neutral:.6,ink:.3,accent:.1},minimumNeutral:.6,maximumAccent:.1,maximumInk:.3,excludeMedia:true},
      headingSizes};
  }

  getDetailHeadingSize(heading,system=this.getDetailDesignSystem()) {
    if(system.headingSizes)return system.headingSizes[Number(heading.tagName.slice(1))-1];
    return heading.classList.contains("xhs-reading-title")?system.title:system.section;
  }

  auditDetailColorPixels(imageData, excludedRects=[]) {
    const budget=this.getDetailDesignSystem().colorBudget,counts={neutral:0,ink:0,accent:0};
    const {data,width,height}=imageData;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      if(excludedRects.some(rect=>x>=rect.x && x<rect.x+rect.width && y>=rect.y && y<rect.y+rect.height))continue;
      const i=(y*width+x)*4,alpha=data[i+3]/255;
      const r=data[i]*alpha+255*(1-alpha),g=data[i+1]*alpha+255*(1-alpha),b=data[i+2]*alpha+255*(1-alpha);
      const role=b-r>36 && b-g>24?'accent':(.2126*r+.7152*g+.0722*b)<200?'ink':'neutral';
      counts[role]++;
    }
    const total=Object.values(counts).reduce((a,b)=>a+b,0),ratios={};
    for(const role of Object.keys(counts))ratios[role]=total?counts[role]/total:0;
    return {target:budget.target,ratios,sampledPixels:total,excludedMedia:excludedRects.length,
      passed:total>0 && ratios.neutral>=budget.minimumNeutral && ratios.ink<=budget.maximumInk && ratios.accent<=budget.maximumAccent};
  }

  async auditDetailExportColors(node, blob) {
    const url=URL.createObjectURL(blob),image=new Image();
    try {
      image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=Math.min(540,image.naturalWidth);
      canvas.height=Math.round(image.naturalHeight*canvas.width/image.naturalWidth);
      const context=canvas.getContext('2d');context.drawImage(image,0,0,canvas.width,canvas.height);
      const bounds=node.getBoundingClientRect(),sx=canvas.width/bounds.width,sy=canvas.height/bounds.height;
      const media=Array.from(node.querySelectorAll('img,video,canvas,.mermaid,.math-block'));
      const explicit=Array.from(node.querySelectorAll('[data-detail-background="blue"]'));
      const excluded=[...media,...explicit].map(media=>{
        const rect=media.getBoundingClientRect();return {x:(rect.left-bounds.left)*sx,y:(rect.top-bounds.top)*sy,width:rect.width*sx,height:rect.height*sy};
      });
      return {...this.auditDetailColorPixels(context.getImageData(0,0,canvas.width,canvas.height),excluded),
        excludedMedia:media.length,excludedExplicitBackgrounds:explicit.length};
    }finally{URL.revokeObjectURL(url);}
  }

  normalizeDetailDesignConfig(config = this.config) {
    config.detail_background_color = DEFAULT_CONFIG.detail_background_color;
    config.detail_page_type=config.detail_page_type==="document"?"document":"modular";
    config.detail_module_layout="auto";
    config.detail_text_color=VISUAL_RULES.ink;
    config.detail_title_color_mode='solid';
    config.detail_title_highlight_color=this.parseCoverHexColor(config.detail_title_highlight_color) || VISUAL_RULES.accent;
    delete config.detail_title_gradient_from;
    delete config.detail_title_gradient_to;
    delete config.detail_title_gradient_stops;
    config.detail_typography_version=3;
    const system = this.getDetailDesignSystem(config);
    const defaults = [system.body,VISUAL_RULES.bodyWeight,0,VISUAL_RULES.bodyLeading,system.gutter];
    this.getDetailStylePresets(config).forEach(([key, label, values], index) => {
      config[key] = values.find(value => Math.abs(value - Number(config[key])) < .001) ?? defaults[index];
    });
    Object.assign(config,{detail_font_weight:VISUAL_RULES.bodyWeight,detail_letter_spacing:0,detail_line_height:VISUAL_RULES.bodyLeading,detail_image_gap:system.gutter});
    return config;
  }

  snapDetailImageWidth(width, limit = this.getDetailContentWidth()) {
    if(this.config.detail_page_type==="modular")return Math.max(1,Math.min(limit,Math.max(Math.min(80,limit),Math.round(width))));
    const system = this.getDetailDesignSystem();
    const widths = (limit < system.column * 2 + system.gutter ? [1] : [2, 3, 4, 6]).map(span => span * system.column + (span - 1) * system.gutter)
      .filter(value => value <= limit + 1);
    return widths.length ? widths.reduce((best, value) => Math.abs(value - width) < Math.abs(best - width) ? value : best) : limit;
  }

  getDetailBlankLineHeight(lines = 1) {
    const fontSize = this.config.detail_font_size || this.config.body_size || DEFAULT_CONFIG.detail_font_size;
    return Math.round(fontSize * Math.max(0, Number(lines) || 0));
  }

  getDetailImageGap() {
    return this.getDetailDesignSystem().gutter;
  }

  refreshDetailImageAnchors(card) {
    if (!card) return;
    card.querySelectorAll(".xhs-detail-image-wrap").forEach((wrap) => {
      const key = wrap.getAttribute("data-detail-image-key");
      const slot = card.querySelector(`[data-detail-image-slot="${key}"]`);
      const layout = wrap._xhsDetailLayout || (this.config.detail_image_layouts && this.config.detail_image_layouts[key]);
      if (!slot || !layout) return;
      wrap._xhsDetailImageSlot = slot;
      const position = this.getDetailSlotPosition(slot);
      wrap.dataset.detailBaseX = String(position.x);
      wrap.dataset.detailBaseY = String(position.y);
      wrap.style.left = `${position.x + (layout.x || 0)}px`;
      layout.y = 0;
      wrap.style.top = `${position.y}px`;
    });
  }

  selectDetailImageElement(key, wrap) {
    this.selectedDetailImageKey = key;
    const card = wrap.closest(".xhs-card");
    if (!card) return;
    card.querySelectorAll(".xhs-detail-image-wrap").forEach((item) => {
      item.classList.toggle("is-selected", item === wrap);
    });
  }

  isDetailImageLayoutAdjusted(layout) {
    if (!layout) return false;
    return Boolean(layout.adjusted || layout.x || layout.y || layout.w || layout.h);
  }

  canAdjustDetailImage(wrap) {
    return true;
  }

  beginDetailImageAdjust(key, wrap) {
    this.selectDetailImageElement(key, wrap);
    return true;
  }

  clampDetailImageLayoutByOrder(card, wrap, layout, resize = false) {
    if (!card || !wrap || !layout) return;
    const baseX = Number(wrap.dataset.detailBaseX || 0);
    const contentWidth = Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const inline = wrap.dataset.detailInline === "1";
    const minX = inline ? -baseX : 0;
    const maxX = Math.max(minX, contentWidth - baseX - (layout.w || 0));
    layout.x = this.toNumber(layout.x, 0, minX, maxX);
    layout.y = 0;
  }

  startDetailImageDrag(event, key, wrap, img) {
    if (event.target?.closest?.(".xhs-detail-image-actions"))return;
    if (wrap.dataset.detailPairMode === "1") { event.preventDefault();event.stopPropagation();this.beginDetailImageAdjust(key,wrap);return; }
    if (event.target && event.target.classList && event.target.classList.contains("xhs-detail-image-resize-handle")) return;
    event.preventDefault();
    event.stopPropagation();
    if (!this.beginDetailImageAdjust(key, wrap)) return;
    const layout = Object.assign({
      x: 0,
      y: 0,
      w: wrap.offsetWidth,
      h: wrap.offsetHeight,
      aspectRatio: this.getDetailImageAspect({}, wrap, img)
    }, this.config.detail_image_layouts[key] || {}, wrap._xhsDetailLayout || {});
    const card = wrap.closest(".xhs-card");
    const scale = this.getCardScale(card);
    const startX = event.clientX;
    const startLayoutX = layout.x || 0;
    const contentWidth = Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const inline = wrap.dataset.detailInline === "1";
    const baseX = Number(wrap.dataset.detailBaseX || 0);
    const wasForceBlock = Boolean(layout.forceBlock) || wrap.dataset.detailGroupForced === "1";
    let releaseForceBlock = false;
    let moved = false;
    wrap.setPointerCapture(event.pointerId);

    const move = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      if (Math.abs(deltaX) >= 2) moved = true;
      const minX = inline ? -baseX : 0;
      const maxX = Math.max(minX, contentWidth - baseX - (layout.w || wrap.offsetWidth));
      layout.x = Math.min(maxX, Math.max(minX, Math.round(startLayoutX + deltaX)));
      if(this.config.detail_page_type==="modular")layout.align="free";
      layout.y = 0;
      if (wasForceBlock && Math.abs(deltaX) >= 24) {
        layout.forceBlock = false;
        releaseForceBlock = true;
      }
      this.clampDetailImageLayoutByOrder(card, wrap, layout, false);
      this.applyDetailImageLayout(wrap, img, layout);
      this.updateDetailImageAlignmentGuides(card, wrap, layout, false);
      this.refreshDetailImageAnchors(card);
      this.updateScrollableDetailHeight(card);
    };
    const up = () => {
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointercancel", up);
      this.clearAlignmentGuides(card);
      if (!moved && !releaseForceBlock) return;
      if (releaseForceBlock) {
        this.releaseDetailImageGroupBlock(wrap, key, layout);
      } else {
        this.saveDetailImageLayout(key, layout);
      }
      this.refreshDetailImageAnchors(card);
      this.updateScrollableDetailHeight(card);
      if (releaseForceBlock) {
        new Notice("已切回同排调整");
      }
      void this.renderPreview();
    };

    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerup", up);
    wrap.addEventListener("pointercancel", up);
  }

  startDetailImageResize(event, key, wrap, img, anchor = "se") {
    event.preventDefault();
    event.stopPropagation();
    if (!this.beginDetailImageAdjust(key, wrap)) return;
    const layout = Object.assign({
      x: 0,
      y: 0,
      w: wrap.offsetWidth,
      h: wrap.offsetHeight,
      aspectRatio: this.getDetailImageAspect({}, wrap, img)
    }, this.config.detail_image_layouts[key] || {}, wrap._xhsDetailLayout || {});
    layout.aspectRatio = this.getDetailImageAspect({}, wrap, img) || layout.aspectRatio;
    const resizeRatio=this.config.detail_page_type==="modular" && layout.fit==="cover"?layout.frameRatio:layout.aspectRatio;
    const card = wrap.closest(".xhs-card");
    const scale = this.getCardScale(card);
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = layout.w || wrap.offsetWidth;
    const startH = layout.h || wrap.offsetHeight;
    const startLayoutX = layout.x || 0;
    const isWest = anchor.includes("w");
    const isNorth = anchor.includes("n");
    const contentWidth = Number(wrap.dataset.detailMaxW || this.getDetailContentWidth());
    const inline = wrap.dataset.detailInline === "1";
    const baseX = Number(wrap.dataset.detailBaseX || 0);
    const maxResizeWidth = inline
      ? Math.floor((contentWidth - this.getDetailImageGap()) / 2)
      : contentWidth;
    let resized = false;
    wrap.setPointerCapture(event.pointerId);
    this.showDetailImagePageBoundary(card,wrap);

    const move = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      if (Math.abs(deltaX) >= 2 || Math.abs(deltaY) >= 2) resized = true;
      const rawW = Math.min(maxResizeWidth, Math.max(80, startW + (isWest ? -deltaX : deltaX)));
      const rawH = Math.max(1, startH + (isNorth ? -deltaY : deltaY));
      if (layout.aspectRatio) {
        const scaleByWidth = rawW / Math.max(1, startW);
        const scaleByHeight = rawH / Math.max(1, startH);
        const nextScale = Math.abs(deltaX)>=Math.abs(deltaY)*resizeRatio ? scaleByWidth : scaleByHeight;
        layout.w = Math.min(maxResizeWidth, Math.max(80, Math.round(startW * nextScale)));
        layout.h = Math.max(1, Math.round(layout.w / resizeRatio));
      } else {
        layout.w = rawW;
        layout.h = rawH;
      }
      if (isWest) {
        const minX = inline ? -baseX : 0;
        const maxX = Math.max(minX, contentWidth - baseX - layout.w);
        layout.x = Math.min(maxX, Math.max(minX, Math.round(startLayoutX + startW - layout.w)));
      }
      if(wrap.dataset.detailPairMode === "1")layout.w=this.getDetailPairWidth(wrap,layout.w);
      layout.y = 0;
      this.clampDetailImageLayoutByOrder(card, wrap, layout, true);
      this.applyDetailImageLayout(wrap, img, layout);
      if(wrap.dataset.detailPairMode === "1")this.previewDetailImagePair(wrap,layout);
      this.updateDetailImageAlignmentGuides(card, wrap, layout, false);
      this.refreshDetailImageAnchors(card);
      this.showDetailImagePageBoundary(card,wrap);
      this.updateScrollableDetailHeight(card);
    };
    const up = (endEvent) => {
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointercancel", up);
      this.clearAlignmentGuides(card);
      if(endEvent?.type==="pointercancel"){this.detailPaginationKey="";void this.renderPreview();return;}
      if (!resized) return;
      const savedPair = wrap.dataset.detailPairMode === "1" && this.saveDetailImagePairLayout(wrap, layout);
      if (!savedPair) this.saveDetailImageLayout(key, layout);
      this.refreshDetailImageAnchors(card);
      this.updateScrollableDetailHeight(card);
      this.detailPaginationKey="";
      void this.renderPreview();
    };

    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerup", up);
    wrap.addEventListener("pointercancel", up);
  }

  getDetailPaginationBottom(card) {
    const root=card.querySelector('.xhs-detail-scroll-root');
    return root.getBoundingClientRect().bottom-this.getDetailLayoutRules().paginationReserve*this.getCardScale(card);
  }

  showDetailImagePageBoundary(card,wrap) {
    if(!card || !wrap)return;
    card.querySelectorAll('.xhs-detail-page-boundary').forEach(node=>node.remove());
    const root=card.querySelector('.xhs-detail-scroll-root');
    if(!root)return;
    const scale=this.getCardScale(card);
    const imageBottom=wrap.getBoundingClientRect().bottom;
    // Pagination measures the reserved slot and enclosing module, not just the image.
    let extent=imageBottom,node=wrap._xhsDetailImageSlot;
    while(node && node!==root) {
      if(node.matches('[data-detail-image-slot],[data-detail-module],[data-detail-composition]'))extent=Math.max(extent,node.getBoundingClientRect().bottom);
      node=node.parentElement;
    }
    const bottom=this.getDetailPaginationBottom(card)-Math.max(0,extent-imageBottom);
    const remaining=Math.floor((bottom-imageBottom+0.5*scale)/scale);
    this.createAlignmentGuide(card,'horizontal',(bottom-card.getBoundingClientRect().top)/scale,
      remaining<0?'超出内容边界，松开后自动分页':`本页内容底线 · 剩余 ${remaining}px`,remaining<0);
    const guides=card.querySelectorAll('.xhs-alignment-guide');
    const guide=guides[guides.length-1];
    guide.classList.add('xhs-detail-page-boundary');
    guide.classList.toggle('is-overflow',remaining<0);
  }

  getDetailImageAspect(layout, wrap, img) {
    if (img && img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
    if (layout && layout.aspectRatio) return Number(layout.aspectRatio);
    if (wrap && wrap.offsetWidth && wrap.offsetHeight) return wrap.offsetWidth / wrap.offsetHeight;
    return 0;
  }

  updateDetailImageAlignmentGuides(card, wrap, layout, snap = false) {
    if (!card || !wrap || !layout) return;
    this.clearAlignmentGuides(card);
    this.createAlignmentGuide(card, "vertical", this.config.xhs_width / 2, "画布中心", false);
    this.createAlignmentGuide(card, "horizontal", this.config.xhs_height / 2, "画布中心", false);

    const box = this.getDetailImageVisualBox(card, wrap);
    const verticalMatches = this.findDetailImageAlignmentMatches(card, wrap, "vertical", box, 8);
    const horizontalMatches = this.findDetailImageAlignmentMatches(card, wrap, "horizontal", box, 8);
    if (verticalMatches[0] && snap) {
      layout.x = Math.round((layout.x || 0) + verticalMatches[0].delta);
    }
    verticalMatches.slice(0, 3).forEach((match) => {
      this.createAlignmentGuide(card, "vertical", match.value, match.label, true);
    });
    horizontalMatches.slice(0, 3).forEach((match) => {
      this.createAlignmentGuide(card, "horizontal", match.value, match.label, true);
    });
  }

  findDetailImageAlignmentMatch(card, selectedWrap, axis, box, tolerance) {
    return this.findDetailImageAlignmentMatches(card, selectedWrap, axis, box, tolerance)[0] || null;
  }

  findDetailImageAlignmentMatches(card, selectedWrap, axis, box, tolerance) {
    const points = axis === "vertical"
      ? [
        { value: box.x, label: "图片左边" },
        { value: box.x + box.w / 2, label: "图片中心" },
        { value: box.x + box.w, label: "图片右边" }
      ]
      : [
        { value: box.y, label: "图片顶部" },
        { value: box.y + box.h / 2, label: "图片中心" },
        { value: box.y + box.h, label: "图片底部" }
      ];
    const contentLeft = 70;
    const contentRight = this.config.xhs_width - 70;
    const contentTop = 76;
    const contentBottom = this.config.xhs_height - 76;
    const candidates = axis === "vertical"
      ? [
        { value: contentLeft, label: "内容左边" },
        { value: this.config.xhs_width / 2, label: "画布中心" },
        { value: contentRight, label: "内容右边" }
      ]
      : [
        { value: contentTop, label: "内容顶部" },
        { value: this.config.xhs_height / 2, label: "画布中心" },
        { value: contentBottom, label: "内容底部" }
      ];

    card.querySelectorAll(".xhs-detail-image-wrap").forEach((wrap) => {
      if (wrap === selectedWrap) return;
      const other = this.getDetailImageVisualBox(card, wrap);
      if (axis === "vertical") {
        candidates.push({ value: other.x, label: "其他图片左边" });
        candidates.push({ value: other.x + other.w / 2, label: "其他图片中心" });
        candidates.push({ value: other.x + other.w, label: "其他图片右边" });
      } else {
        candidates.push({ value: other.y, label: "其他图片顶部" });
        candidates.push({ value: other.y + other.h / 2, label: "其他图片中心" });
        candidates.push({ value: other.y + other.h, label: "其他图片底部" });
      }
    });

    const matches = [];
    points.forEach((point) => {
      candidates.forEach((candidate) => {
        const delta = candidate.value - point.value;
        const distance = Math.abs(delta);
        if (distance <= tolerance) {
          matches.push({ value: candidate.value, delta, distance, label: `${point.label} / ${candidate.label}` });
        }
      });
    });
    const unique = [];
    matches
      .sort((a, b) => a.distance - b.distance)
      .forEach((match) => {
        if (unique.some((item) => Math.abs(item.value - match.value) < 2)) return;
        unique.push(match);
      });
    return unique;
  }

  getDetailImageVisualBox(card, wrap) {
    const cardRect = card.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const scale = this.getCardScale(card);
    return {
      x: (wrapRect.left - cardRect.left) / scale,
      y: (wrapRect.top - cardRect.top) / scale,
      w: wrapRect.width / scale,
      h: wrapRect.height / scale
    };
  }

  findCanvasAlignmentMatch(axis, box, tolerance) {
    const points = axis === "vertical"
      ? [
        { value: box.x, label: "左边" },
        { value: box.x + box.w / 2, label: "中心" },
        { value: box.x + box.w, label: "右边" }
      ]
      : [
        { value: box.y, label: "顶部" },
        { value: box.y + box.h / 2, label: "中心" },
        { value: box.y + box.h, label: "底部" }
      ];
    const candidates = axis === "vertical"
      ? [
        { value: 0, label: "画布左边" },
        { value: this.config.xhs_width / 2, label: "画布中心" },
        { value: this.config.xhs_width, label: "画布右边" }
      ]
      : [
        { value: 0, label: "画布顶部" },
        { value: this.config.xhs_height / 2, label: "画布中心" },
        { value: this.config.xhs_height, label: "画布底部" }
      ];
    let best = null;
    points.forEach((point) => {
      candidates.forEach((candidate) => {
        const delta = candidate.value - point.value;
        const distance = Math.abs(delta);
        if (distance <= tolerance && (!best || distance < best.distance)) {
          best = {
            value: candidate.value,
            delta,
            distance,
            label: `${point.label} · ${candidate.label}`
          };
        }
      });
    });
    return best;
  }

  renderSimpleList(parent, lines, cls) {
    const list = parent.createEl("ul", { cls });
    lines.filter(Boolean).forEach((line) => list.createEl("li", { text: line }));
    return list;
  }

  addMultiline(parent, cls, text) {
    const block = parent.createDiv({ cls });
    this.toText(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      .forEach((line) => block.createDiv({ text: line }));
    return block;
  }

  addImage(parent, src, cls) {
    if (!src) return null;
    return parent.createEl("img", { cls, attr: { src, alt: "" } });
  }

  fitTextBlocks(card) {
    if (card.classList.contains("xhs-template-neon-grid")) {
      return;
    }
    const targets = [
      [".xhs-ai-title-main", 54],
      [".xhs-ai-speech-title", 28],
      [".xhs-ai-speech-sub", 28],
      [".xhs-ai-chip", 18],
      [".xhs-ai-proof", 18],
      [".xhs-ai-bottom-title", 28],
      [".xhs-detail-title", 36]
    ];

    targets.forEach(([selector, minSize]) => {
      card.querySelectorAll(selector).forEach((element) => this.fitOneTextBlock(element, minSize));
    });
  }

  fitOneTextBlock(element, minSize) {
    const computed = window.getComputedStyle(element);
    let size = Number.parseFloat(computed.fontSize);
    if (!Number.isFinite(size)) return;
    element.style.overflow = "hidden";
    for (let guard = 0; guard < 80; guard++) {
      const tooTall = element.scrollHeight > element.clientHeight + 2;
      const tooWide = element.scrollWidth > element.clientWidth + 2;
      if ((!tooTall && !tooWide) || size <= minSize) break;
      size -= 2;
      element.style.fontSize = `${size}px`;
    }
  }

  async resolveImage(path) {
    const raw = this.toText(path).trim();
    if (!raw) return "";
    if (this.imageCache.has(raw)) return this.imageCache.get(raw);

    if (/^(data:image\/|https?:\/\/)/i.test(raw)) {
      this.imageCache.set(raw, raw);
      return raw;
    }

    const clean = raw.replace(/^!\[\[|\]\]$/g, "").replace(/^\[\[|\]\]$/g, "").split("|")[0];
    if (!clean || /^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(clean)) return "";

    const vault = this.app.vault;
    const file = this.app.metadataCache.getFirstLinkpathDest(clean, this.activeFile?.path || "")
      || vault.getAbstractFileByPath(normalizePath(clean));
    if (!(file instanceof TFile)) return "";

    const dataUrl = await this.fileToDataUrl(file);
    this.imageCache.set(raw, dataUrl);
    return dataUrl;
  }

  async fileToDataUrl(file) {
    const bytes = await this.app.vault.readBinary(file);
    return this.arrayBufferToDataUrl(bytes, this.mimeFromPath(file.path));
  }

  arrayBufferToDataUrl(buffer, mime) {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: mime || "image/png" });
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  mimeFromPath(path) {
    const ext = path.split(".").pop().toLowerCase();
    const map = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" };
    return map[ext] || "image/png";
  }

  async saveConfigToFrontmatter() {
    const file = this.activeFile || this.getActiveMarkdownFile();
    if (!file) {
      new Notice("请先打开一篇笔记");
      return;
    }

    const keys = this.getFrontmatterSaveKeys();
    const managedKeys = this.getManagedConfigKeys();

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      managedKeys.forEach((key) => {
        delete frontmatter[key];
      });
      keys.forEach((key) => {
        frontmatter[key] = this.config[key];
      });
    });
    new Notice("参数已保存到当前笔记");
  }

  getFrontmatterSaveKeys() {
    const common = [
      "cover_editor_version", "cover_overlay_opacity", "cover_title_display", "cover_cutout_transparency", "cover_rule_hidden", "cover_rule_thickness",
      "cover_title_color", "cover_highlight_color", "swiss_cover_version", "cover_visual_version", "cover_solid_palette_version", "cover_typography_version", "cover_text_layout_version", "mosaic_image_archive",
      "composition_variant", "composition_theme", "composition_custom_colors", "composition_description", "composition_image", "composition_modules_by_layout", "composition_appearance_by_layout",
      "xhs_style", "xhs_width", "xhs_height", "background_color", "accent_color",
      "secondary_color", "text_color", "title_size", "title_font_weight", "subtitle_size", "body_size",
      "subtitle_font_weight", "subtitle_color_mode",
      "title_outline_mode", "title_outline_width", "title_outline_color",
      "subtitle_outline_mode", "subtitle_outline_width", "subtitle_outline_color",
      "highlight_outline_mode", "highlight_outline_width", "highlight_outline_color",
      "cover_font_weight", "cover_line_height", "cover_letter_spacing",
      "detail_page_type", "detail_module_layout", "detail_typography_version",
      "detail_background_color", "detail_text_color", "detail_font_size", "detail_image_gap", "detail_image_layouts",
      "detail_font_weight", "detail_line_height", "detail_letter_spacing",
      "detail_title_highlight", "detail_title_highlight_color",
      "title_letter_spacing", "title_line_height",
      "title", "title_highlight", "apple_text_color_preset", "clean_palette", "title_gradient_enabled", "title_gradient_preset", "title_gradient_from",
      "title_gradient_to", "title_gradient_stops", "huawei_palette", "huawei_text_color_preset", "huawei_gradient_enabled", "huawei_gradient_preset",
      "huawei_gradient_from", "huawei_gradient_to", "instagram_palette", "instagram_text_color_preset", "instagram_gradient_enabled",
      "instagram_gradient_preset", "instagram_gradient_from", "instagram_gradient_to",
      "google_palette", "google_text_color_preset", "google_gradient_enabled", "google_gradient_preset", "google_gradient_from", "google_gradient_to",
      "subtitle", "cta", "brand", "tags", "xhs_modules", "xhs_modules_by_style", "cover_template_settings"
    ];
    return common;
  }

  getManagedConfigKeys() {
    return [
      // Retired fields are cleanup-only: never serialize them back into notes.
      "detail_title_color_mode", "detail_title_gradient_from", "detail_title_gradient_to", "detail_title_gradient_stops",
      "composition_layout", "composition_variant", "composition_theme", "composition_custom_colors", "composition_description", "composition_image", "composition_modules_by_layout", "composition_appearance_by_layout",
      "xhs_style", "xhs_width", "xhs_height", "editorial_composition", "editorial_title_lines", "editorial_layout_version", "editorial_layouts_by_composition",
      "big_title", "sub_title", "small_title", "title",
      "title_highlight", "cover_layout_preset", "apple_text_color_preset", "clean_palette", "title_gradient_enabled", "title_gradient_preset", "title_gradient_from",
      "title_gradient_to", "title_gradient_stops", "title_art_font_cn", "title_art_font_en", "huawei_palette", "huawei_text_color_preset", "huawei_gradient_enabled", "huawei_gradient_preset",
      "huawei_gradient_from", "huawei_gradient_to", "instagram_palette", "instagram_text_color_preset", "instagram_gradient_enabled",
      "instagram_gradient_preset", "instagram_gradient_from", "instagram_gradient_to",
      "google_palette", "google_text_color_preset", "google_gradient_enabled", "google_gradient_preset", "google_gradient_from", "google_gradient_to",
      "title_prefix", "title_secondary", "subtitle", "kicker",
      "english", "brand", "bubble_title", "bubble_subtitle",
      "footer", "proof", "cta", "date_label", "date_value",
      "tags", "chips", "bullets", "accent_color", "secondary_color",
      "background_color", "text_color", "title_size", "title_font_weight", "subtitle_size",
      "subtitle_font_weight", "subtitle_color_mode",
      "title_outline_mode", "title_outline_width", "title_outline_color",
      "subtitle_outline_mode", "subtitle_outline_width", "subtitle_outline_color",
      "highlight_outline_mode", "highlight_outline_width", "highlight_outline_color",
      "body_size", "cover_font_weight", "cover_line_height", "cover_letter_spacing",
      "detail_page_type", "detail_module_layout",
      "detail_background_color", "detail_text_color", "detail_font_size",
      "detail_font_weight", "detail_line_height", "detail_letter_spacing",
      "detail_title_highlight", "detail_title_highlight_color",
      "detail_image_width", "detail_image_height", "detail_image_gap", "detail_image_layouts",
      "title_letter_spacing", "title_line_height",
      "layout_title_left", "layout_title_top", "layout_subtitle_top",
      "layout_tags_top", "layout_small_top", "layout_content_left",
      "border_width", "background_image", "main_image",
      "icon_image", "icon2_image", "logo_image", "xhs_modules", "xhs_modules_by_style", "cover_template_settings", "cover_comparison_opacity"
    ];
  }

  getPageExportFileName(page, index, usedNames) {
    const heading = ".xhs-native-markdown-block :is(h1,h2,h3,h4,h5,h6)";
    const title = page.kind === "cover"
      ? this.toText(this.config.title).replace(/\{\{([^{}]+)\}\}/g, "$1")
      : this.previewCanvasEl?.querySelector?.(heading + ":not([data-reading-repeat], [data-reading-generated])")?.textContent.trim()
        || this.previewCanvasEl?.querySelector?.(heading + "[data-reading-context]")?.textContent.trim();
    const pageNumber = index + 1;
    const prefix = String(pageNumber).padStart(Math.max(2, String(this.pages.length).length), "0");
    const label = title?.trim() || (page.kind === "cover" ? "封面" : "第 " + pageNumber + " 页");
    const stem = this.makeFileName(prefix + "_" + label);
    let name = this.makeFileName(stem + ".png");
    for (let copy = 2; usedNames?.has(name.toLowerCase()); copy += 1) {
      const suffix = " (" + copy + ").png";
      name = this.makeFileName(Array.from(stem).slice(0, 96 - suffix.length).join("") + suffix);
    }
    usedNames?.add(name.toLowerCase());
    return name;
  }

  async exportCurrentPage() {
    await this.renderPreview();
    if (!this.previewCanvasEl) {
      new Notice("没有可导出的预览页面");
      return;
    }
    new Notice("正在导出当前页到本地...");
    const page = this.pages[this.activePageIndex] || { kind: "cover" };
    await this.exportNode(this.previewCanvasEl, this.getPageExportFileName(page, this.activePageIndex), null, true);
  }

  async exportAllPages() {
    await this.ensureDetailPagination();
    if (!this.previewCanvasEl) {
      new Notice("没有可导出的预览页面");
      return;
    }
    new Notice("正在导出全部页面到本地...");
    const current = this.activePageIndex;
    const directoryHandle = await this.pickLocalExportDirectory();
    if (directoryHandle === false) return;
    this.exportingAllPages = true;
    const usedNames = new Set();
    try {
      for (let index = 0; index < this.pages.length; index++) {
        this.activePageIndex = index;
        await this.renderPreview();
        await this.delay(160);
        const page = this.pages[index] || { kind: "cover" };
        const name = this.getPageExportFileName(page, index, usedNames);
        await this.exportNode(this.previewCanvasEl, name, directoryHandle, false);
        await this.delay(160);
      }
    } finally {
      this.exportingAllPages = false;
      this.activePageIndex = Math.max(0, Math.min(current, this.pages.length - 1));
      await this.render();
    }
    new Notice(`已导出 ${this.pages.length} 张 PNG 到本地`);
  }

  auditCoverTextLayout(card) {
    const checks={grid:true,bounds:true,lines:true,alignment:true,typography:true,spacing:true,overlap:true,pureTitle:!this.isTitleGradientEnabled()},issues=[],roles=[];
    const modules=this.config.xhs_modules.filter(module=>module.coverTextRole && module.text);
    const media=this.config.xhs_modules.filter(module=>module.type==="image" && !module.custom);
    const id=this.config.xhs_style==="composition"?this.config.composition_variant:this.config.xhs_style;
    for(const module of modules) {
      const element=Array.from(card.querySelectorAll("[data-module-id]")).find(item=>item.dataset.moduleId===module.id);
      if(!element){checks.bounds=false;issues.push(`${module.coverTextRole}未渲染`);continue;}
      const role=module.coverTextRole,weight=module.fontWeight;
      const measured=this.measureCoverTextFrame(module);
      if(measured.lines>module.maxLines){checks.lines=false;issues.push(`${role}超过${module.maxLines}行`);}
      if(module.x<72 || module.y<72 || module.x+module.w>1008 || module.y+Math.max(module.h,measured.height)>1368){checks.bounds=false;issues.push(`${role}超出安全边距`);}
      if(!module.manualPosition && !["solid-poster","center-banner","nng-red-system"].includes(id) && (role==="title" ? module.x!==72 : (module.x-72)%160!==0 && module.x!==120)){checks.grid=false;issues.push(`${role}偏离网格轴`);}
      const style=getComputedStyle(element);
      if(style.textAlign!==module.textAlign)checks.alignment=false;
      const tracking=style.letterSpacing==="normal"?0:Number.parseFloat(style.letterSpacing);
      if(Number(style.fontWeight)!==weight || Math.abs(Number.parseFloat(style.fontSize)-module.fontSize)>0.5 || !style.fontFamily.includes("SF Pro") || Math.abs(tracking-module.letterSpacing)>0.5)checks.typography=false;
      const rect=element.getBoundingClientRect(),walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
      let text;
      while((text=walker.nextNode())) {
        if(!text.textContent.trim())continue;
        const range=document.createRange();range.selectNodeContents(text);
        if(Array.from(range.getClientRects()).some(ink=>ink.right>rect.right+1 || ink.left<rect.left-1)){checks.bounds=false;issues.push(`${role}文字越界`);}
      }
      for(const image of media) {
        if(["solid-poster","center-banner","nng-red-system"].includes(id))continue;
        if(module.x<image.x+image.w && module.x+module.w>image.x && module.y<image.y+image.h && module.y+module.h>image.y){checks.overlap=false;issues.push(`${role}与固定图片重叠`);}
      }
      roles.push({role,x:module.x,y:module.y,w:module.w,h:module.h,lines:measured.lines,fontSize:module.fontSize,
        fontWeight:style.fontWeight,fontFamily:style.fontFamily,letterSpacing:style.letterSpacing});
    }
    for(let i=0;i<modules.length;i++)for(let j=i+1;j<modules.length;j++) {
      const a=modules[i],b=modules[j];
      if(a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y){checks.overlap=false;issues.push(`${a.coverTextRole}与${b.coverTextRole}重叠`);}
    }
    const title=modules.find(module=>module.coverTextRole==="title"),subtitle=modules.find(module=>module.coverTextRole==="subtitle");
    const titleGap=id==='headline-band'?16:32;
    if(title && subtitle && !title.manualPosition && !subtitle.manualPosition && !["left-image-title","neon-grid"].includes(id) && Math.abs(subtitle.y-title.y-title.h-titleGap)>1){checks.spacing=false;issues.push(`标题与副标题间距不为${titleGap}px`);}
    const description=modules.find(module=>module.coverTextRole==="description");
    const gap=(actual,expected,message)=>{if(Math.abs(actual-expected)>1){checks.spacing=false;issues.push(message);}};
    const pairedCaption=description && subtitle && Math.abs(description.y-subtitle.y)<1 && description.x>=subtitle.x+subtitle.w;
    if(description && subtitle && !description.manualPosition && !subtitle.manualPosition && !pairedCaption && !["image-caption","headline-band","center-banner","solid-poster","neon-grid"].includes(id))gap(description.y-subtitle.y-subtitle.h,32,"副标题与辅助文案间距不为32px");
    if(media.length && !modules.some(module=>module.manualPosition)) {
      const top=Math.min(...media.map(module=>module.y)),bottom=Math.max(...media.map(module=>module.y+module.h));
      if(title && ["aside-image","mosaic","band-columns"].includes(id))gap(title.y-bottom,48,"图片与标题间距不为48px");
      if(description && ["headline-band","center-banner"].includes(id))gap(description.y-bottom,32,"图片与辅助说明间距不为32px");
      if(subtitle && description && id==="left-image-title") {
        const groupHeight=description.y+description.h-subtitle.y;
        gap(subtitle.y-top,Math.max(24,(bottom-top-groupHeight)/2),"第二栏文字组未垂直平衡");
      }
      if(subtitle && id==="headline-band") {
        const spacing=top-subtitle.y-subtitle.h;
        gap(spacing,16,"副标题与图片间距不为16px");
      }
      if(subtitle && description && id==="image-caption") {
        gap(subtitle.y-description.y,0,"双栏文案未顶对齐");
        gap(top-Math.max(subtitle.y+subtitle.h,description.y+description.h),48,"双栏文字与图片间距不为48px");
      }
    }
    return {checks,issues:[...new Set(issues)],roles};
  }

  auditSwissCover(card) {
    const issues=[],bounds=card.getBoundingClientRect(),scale=bounds.width/1080;
    if(!scale)return ["封面尚未完成渲染"];
    const occupied=[];
    for(const module of this.config.xhs_modules.filter(item=>item.swissCover)) {
      const element=Array.from(card.querySelectorAll("[data-module-id]")).find(item=>item.dataset.moduleId===module.id);
      if(!element){issues.push(`${module.id}未渲染`);continue;}
      const fullImage=module.type==="image" && module.w===1080 && module.h===1440;
      if(!fullImage && (module.x<72 || module.y<72 || module.x+module.w>1008 || module.y+module.h>1368))issues.push(`${module.id}超出安全边距`);
      if(module.type!=="text" || !module.text)continue;
      if(String(module.text).split(/\r?\n/).length>module.maxLines)issues.push(`${module.id}超过${module.maxLines}行`);
      const rect=element.getBoundingClientRect();
      const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
      let textNode;
      while((textNode=walker.nextNode())) {
        if(!textNode.textContent.trim())continue;
        const range=document.createRange();range.selectNodeContents(textNode);
        for(const ink of range.getClientRects()) {
          // DOM text ranges include font ascender/descent space outside the CSS line box.
          if(ink.left<rect.left-2 || ink.right>rect.right+2)issues.push(`${module.id}文字超出文本框，请在输入框换行`);
        }
      }
      const style=getComputedStyle(element);
      if(!style.fontFamily.includes("SF Pro"))issues.push(`${module.id}字体未统一`);
      if(style.textAlign!=="left")issues.push(`${module.id}未左对齐`);
      occupied.push(module);
    }
    for(let i=0;i<occupied.length;i++)for(let j=i+1;j<occupied.length;j++) {
      const a=occupied[i],b=occupied[j];
      if(a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y)issues.push(`${a.id}与${b.id}重叠`);
    }
    return [...new Set(issues)];
  }

  async exportNode(node, fileName, directoryHandle = null, useSavePicker = false) {
    const textGrid=node?.classList?.contains("xhs-cover-text-grid")?node:node?.querySelector?.(".xhs-cover-text-grid");
    if(textGrid?.classList?.contains("xhs-cover-text-grid")) {
      const audit=this.auditCoverTextLayout(textGrid);
      if(audit.issues.length){new Notice(`封面文字排版需调整：${audit.issues.join("、")}`);throw new Error(audit.issues.join(","));}
    }
    const swiss=node?.classList?.contains("xhs-swiss-cover")?node:node?.querySelector?.(".xhs-swiss-cover");
    if(swiss?.classList?.contains("xhs-swiss-cover")) {
      await this.ensureContentFontsLoaded();
      const issues=this.auditSwissCover(swiss);
      if(issues.length){new Notice(`封面排版检查未通过：${issues.join("、")}`);throw new Error(issues.join(","));}
    }
    const root = node?.querySelector(".xhs-detail-scroll-root");
    if (root) {
      this.refreshDetailImageAnchors(node);
      const content = root.querySelector(".xhs-detail-markdown");
      const audit = content && this.auditDetailReadingFlow(content);
      if (!audit) throw new Error("详情页规范检查不可用，已停止导出");
      if (audit && Object.values(audit.checks).some(value => value !== true)) {
        const failed = Object.entries(audit.checks).filter(([, value]) => value !== true).map(([key]) => key);
        const descriptions={labelOwnership:'标题与所属正文被分页拆开',exportBounds:'内容超出页面边界',
          horizontalBounds:'内容超出页面宽度',balance:'内容布局超出安全范围',mediaLoaded:'图片尚未完整加载',
          hierarchy:'标题层级异常',typography:'文字样式异常',spacing:'模块间距异常',grid:'内容宽度异常',
          stepOwnership:'步骤标题与正文归属异常',matrixOwnership:'并排卡片结构异常',recordEntry:'字段卡片标题样式异常',
          pageEntry:'页面标题定位异常',moduleRoles:'模块样式归属异常',continuationContext:'续页结构异常',
          alignment:'内容对齐异常',proximity:'标题与正文距离异常',contrast:'文字对比度不足',
          rhythm:'正文行高异常',readableTables:'表格文字过小',unbrokenHeadings:'标题换行样式异常'};
        throw new Error(`无法导出：${failed.map(key=>descriptions[key] || '排版检查异常').join('；')}。请重新生成预览后重试。`);
      }
      const bounds = root.getBoundingClientRect();
      const overflow = Array.from(root.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6,pre,table,img,.xhs-detail-image-wrap"))
        .some(element => {
          if (!element.getClientRects().length) return false;
          const rect = element.getBoundingClientRect();
          return rect.bottom > bounds.bottom + 2 || rect.right > bounds.right + 2 || rect.left < bounds.left - 2;
        });
      if (overflow) {
        new Notice("内容超出本页范围，已停止导出。请使用 --- 手动分页或调整排版设置。" );
        throw new Error("详情页内容超出导出范围");
      }
    }
    const scale = Math.max(1, Math.min(6, Number(this.plugin.settings.exportScale) || 3));
    let blob;
    try {
      blob = await this.renderPreviewNodeBlob(node, scale);
    } catch (error) {
      const page = this.pages[this.activePageIndex];
      if (page?.kind === "detail") {
        console.error("[XHS Card Studio] 详情页图片导出失败", error);
        new Notice("详情页图片导出失败，请重试；不会导出另一套排版。" );
        return;
      }
      console.warn("[XHS Card Studio] 预览节点导出失败，改用画布导出", error);
      try {
        blob = await this.renderCanvasBlob(scale);
      } catch (canvasError) {
        console.error("[XHS Card Studio] 导出失败", canvasError);
        new Notice(`导出失败：${canvasError && canvasError.message ? canvasError.message : "PNG 生成异常"}`);
        return;
      }
    }
    if(root && node.dataset.detailPageType==='modular') {
      this.lastDetailColorAudit=await this.auditDetailExportColors(node,blob);
      if(!this.lastDetailColorAudit.passed)new Notice('本页配色超出阅读预算，请减少大面积强调文字或色块；内容仍完整导出。');
    }
    const outputPath = await this.saveExportBlob(blob, fileName, directoryHandle, useSavePicker);
    if (!outputPath) return;
    new Notice(`已导出 ${this.config.xhs_width * scale}x${this.config.xhs_height * scale} PNG：${outputPath}`);
  }

  async renderPreviewNodeBlob(node, scale) {
    if (!node) throw new Error("没有可导出的预览节点");
    await this.ensureContentFontsLoaded();
    await this.waitForImages(node);
    await this.delay(80);
    if(node.classList.contains('xhs-page-cover')){await document.fonts.ready;this.renderTransparentCoverTitle(node);await this.waitForImages(node);}

    const width = Number(this.config.xhs_width) || 1080;
    const height = Number(this.config.xhs_height) || 1440;
    const clone = node.cloneNode(true);
    this.inlineComputedStylesForExport(node, clone);
    await this.inlineCloneImagesForExport(clone);
    this.preparePreviewCloneForExport(clone, width, height);

    const cssText = this.collectPreviewExportCss();
    const serialized = new XMLSerializer().serializeToString(clone);
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">`,
      `<foreignObject x="0" y="0" width="${width}" height="${height}">`,
      `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;">`,
      `<style><![CDATA[${this.escapeSvgStyle(cssText)}]]></style>`,
      serialized,
      `</div>`,
      `</foreignObject>`,
      `</svg>`
    ].join("");

    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    try {
      const image = await this.loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建导出画布");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) throw new Error("PNG 生成失败");
      return blob;
    } finally {}
  }

  preparePreviewCloneForExport(clone, width, height) {
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    clone.classList.remove("is-selected", "xhs-preview-old");
    clone.querySelectorAll(".is-selected").forEach((element) => element.classList.remove("is-selected"));
    clone.querySelectorAll(".xhs-module-resize-handle, .xhs-module-rotate-handle, .xhs-alignment-guide, .xhs-detail-image-resize-handle, .xhs-cover-comparison-tools, .xhs-detail-image-actions").forEach((element) => element.remove());
    this.stripExportOnlySelectionStyles(clone);
    clone.style.width = `${width}px`;
    clone.style.height = `${height}px`;
    clone.style.position = "relative";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.pointerEvents = "none";
  }

  stripExportOnlySelectionStyles(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
    const clearSelectionChrome = (element) => {
      element.style.outline = "0";
      element.style.outlineColor = "transparent";
      element.style.outlineOffset = "0";
      element.style.outlineStyle = "none";
      element.style.outlineWidth = "0";
    };
    clearSelectionChrome(root);
    root.querySelectorAll(".xhs-edit-module, .xhs-detail-image-wrap").forEach(clearSelectionChrome);
  }

  inlineComputedStylesForExport(source, target) {
    if (!source || !target || typeof window === "undefined") return;
    const copyStyle = (from, to) => {
      if (!from || !to || from.nodeType !== Node.ELEMENT_NODE || to.nodeType !== Node.ELEMENT_NODE) return;
      const computed = window.getComputedStyle(from);
      if (!computed) return;
      for (let index = 0; index < computed.length; index++) {
        const property = computed[index];
        const value = computed.getPropertyValue(property);
        if (value) to.style.setProperty(property, value, computed.getPropertyPriority(property));
      }
      to.style.transform = from === source ? "none" : computed.transform;
      to.style.animation = "none";
      to.style.transition = "none";
      if (
        from.classList.contains("is-selected") &&
        (to.classList.contains("xhs-edit-module") || to.classList.contains("xhs-detail-image-wrap"))
      ) {
        to.style.outline = "0";
        to.style.outlineColor = "transparent";
        to.style.outlineOffset = "0";
        to.style.outlineStyle = "none";
        to.style.outlineWidth = "0";
      }
    };
    const walk = (from, to) => {
      copyStyle(from, to);
      const fromChildren = Array.from(from.children || []);
      const toChildren = Array.from(to.children || []);
      fromChildren.forEach((child, index) => walk(child, toChildren[index]));
    };
    walk(source, target);
    this.preparePreviewCloneForExport(target, Number(this.config.xhs_width) || 1080, Number(this.config.xhs_height) || 1440);
  }

  async inlineCloneImagesForExport(clone) {
    const images = Array.from(clone.querySelectorAll("img"));
    await Promise.all(images.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        img.setAttribute("src", await this.blobToDataUrl(blob));
      } catch (error) {
        console.error("[XHS Card Studio] 图片内联到预览导出失败", error);
      }
    }));
  }

  blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  collectPreviewExportCss() {
    const chunks = [this.getPreviewExportBaseCss()];
    Array.from(document.styleSheets).forEach((sheet) => {
      let rules = [];
      try {
        rules = Array.from(sheet.cssRules || []);
      } catch (error) {
        return;
      }
      rules.forEach((rule) => {
        const text = rule && rule.cssText ? rule.cssText : "";
        if (text.includes("xhs-") || text.includes("--xhs-")) chunks.push(text);
      });
    });
    chunks.push(`
      .xhs-card {
        transform: none !important;
        position: relative !important;
        left: 0 !important;
        top: 0 !important;
        margin: 0 !important;
      }
      .xhs-edit-module.is-selected {
        outline: 0 !important;
      }
      .xhs-module-resize-handle,
      .xhs-module-rotate-handle,
      .xhs-alignment-guide,
      .xhs-detail-image-resize-handle {
        display: none !important;
      }
    `);
    return chunks.join("\n");
  }

  getPreviewExportBaseCss() {
    return `
      .xhs-card,
      .xhs-card *,
      .xhs-card *::before,
      .xhs-card *::after {
        box-sizing: border-box;
      }
      .xhs-card {
        position: relative !important;
        overflow: hidden !important;
        transform: none !important;
        margin: 0 !important;
        isolation: isolate;
      }
      .xhs-edit-module {
        position: absolute !important;
        display: block;
        overflow: visible !important;
      }
      .xhs-page-cover .xhs-edit-module.xhs-module-label-badge,
      .xhs-page-cover .xhs-edit-module.xhs-module-arrow-text,
      .xhs-page-cover .xhs-edit-module.xhs-module-cta,
      .xhs-page-cover .xhs-edit-module.xhs-module-footer {
        white-space: pre !important;
        word-break: normal !important;
        overflow-wrap: normal !important;
      }
      .xhs-page-cover .xhs-edit-module.xhs-module-neon-title,
      .xhs-page-cover .xhs-edit-module.xhs-module-clean-title,
      .xhs-page-cover .xhs-edit-module.xhs-module-clean-subtitle,
      .xhs-page-cover .xhs-edit-module.xhs-module-huawei-title,
      .xhs-page-cover .xhs-edit-module.xhs-module-huawei-subtitle,
      .xhs-page-cover .xhs-edit-module.xhs-module-instagram-title,
      .xhs-page-cover .xhs-edit-module.xhs-module-instagram-subtitle,
      .xhs-page-cover .xhs-edit-module.xhs-module-google-title,
      .xhs-page-cover .xhs-edit-module.xhs-module-google-subtitle,
      .xhs-page-cover .xhs-edit-module.xhs-module-cover-layout-subtitle,
      .xhs-page-cover .xhs-edit-module[data-module-id="subtitle"],
      .xhs-page-cover .xhs-clean-title-line {
        white-space: pre-wrap !important;
        word-break: normal !important;
        overflow-wrap: anywhere !important;
      }
      .xhs-module-label-badge,
      .xhs-module-cta,
      .xhs-module-footer {
        display: flex !important;
        align-items: center !important;
      }
      .xhs-edit-module.is-selected {
        outline: 0 !important;
      }
      .xhs-module-clean-title,
      .xhs-module-huawei-title,
      .xhs-module-instagram-title,
      .xhs-module-google-title {
        overflow: visible !important;
        white-space: pre-wrap;
        word-break: normal;
        overflow-wrap: anywhere;
      }
      .xhs-clean-title-line {
        display: block;
        min-height: 1em;
        line-height: inherit;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .xhs-clean-title-gradient {
        color: transparent !important;
        background: var(--xhs-title-gradient-css, linear-gradient(105deg, var(--xhs-title-gradient-from), var(--xhs-title-gradient-to)));
        -webkit-background-clip: text;
        background-clip: text;
      }
      .xhs-module-label-pill,
      .xhs-module-layout-pill {
        position: absolute !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        white-space: pre;
        overflow: hidden;
        border-radius: 999px !important;
      }
      .xhs-module-resize-handle,
      .xhs-module-rotate-handle,
      .xhs-alignment-guide,
      .xhs-detail-image-resize-handle {
        display: none !important;
      }
    `;
  }

  escapeSvgStyle(cssText) {
    return this.toText(cssText).replace(/\]\]>/g, "]]]]><![CDATA[>");
  }

  async renderCanvasBlob(scale) {
    const page = this.pages[this.activePageIndex] || { kind: "cover" };
    const canvas = document.createElement("canvas");
    canvas.width = this.config.xhs_width * scale;
    canvas.height = this.config.xhs_height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    const images = {
      background: await this.resolveImage(this.config.background_image),
      main: await this.resolveImage(this.config.main_image),
      icon: await this.resolveImage(this.config.icon_image),
      icon2: await this.resolveImage(this.config.icon2_image),
      logo: await this.resolveImage(this.config.logo_image)
    };

    if (page.kind === "cover") {
      await this.drawCoverCanvas(ctx, images);
    } else {
      await this.drawDetailCanvas(ctx, page, images);
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("PNG 生成失败");
    return blob;
  }

  async drawCoverCanvas(ctx, images) {
    ctx.save();
    this.roundRectPath(ctx, 0, 0, this.config.xhs_width, this.config.xhs_height, this.getCoverRadius());
    ctx.clip();
    const modules = Array.isArray(this.config.xhs_modules) ? this.config.xhs_modules : [];
    this.alignNeonFooterModules(this.config);
    await this.drawTemplateBase(ctx, images, modules);
    for (const module of modules) {
      await this.drawCanvasModule(ctx, module, images);
    }
    ctx.restore();
  }

  async drawDetailCanvas(ctx, page, images) {
    ctx.save();
    this.roundRectPath(ctx, 0, 0, this.config.xhs_width, this.config.xhs_height, this.getCoverRadius());
    ctx.clip();
    await this.drawDetailBase(ctx, images);
    let y = 76;
    const contentLeft = 70;
    const contentWidth = this.getDetailContentWidth();
    const tokens = this.prepareDetailTokens(page.tokens || []);
    const imageDraws = [];
    this.detailImageCanvasIndex = 0;
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.type === "image") {
        const run = this.collectDetailImageRun(tokens, index);
        const imageTokens = run.imageTokens;
        index = run.endIndex;
        const groupKeys = imageTokens.map((imageToken, imageOffset) => (
          this.getDetailImageKey(imageToken, this.detailImageCanvasIndex + imageOffset)
        ));
        for (let imageOffset = 0; imageOffset < imageTokens.length; imageOffset += 2) {
          const rowTokens = imageTokens.slice(imageOffset, imageOffset + 2);
          const rowKeys = groupKeys.slice(imageOffset, imageOffset + 2);
          const rowPairMode = rowKeys.length === 2 && rowKeys.some((imageKey) => this.isDetailImagePairModeKey(imageKey));
          if (rowPairMode) {
            if (imageOffset > 0) y += this.getDetailImageGap();
            y = await this.drawCanvasImageRow(rowTokens, contentLeft, y, contentWidth, imageDraws);
          } else {
            for (const imageToken of rowTokens) {
              if (imageOffset > 0 || imageToken !== rowTokens[0]) y += this.getDetailImageGap();
              y = await this.drawMarkdownCanvasToken(ctx, imageToken, contentLeft, y, contentWidth, imageDraws);
            }
          }
        }
        continue;
      }
      y = await this.drawMarkdownCanvasToken(ctx, token, contentLeft, y, contentWidth, imageDraws);
    }
    imageDraws.forEach((item) => this.drawDetailImageItem(ctx, item));
    ctx.restore();
  }

  drawDetailImageItem(ctx, item) {
    if (!item || !item.image) return;
    const radius = 6;
    ctx.save();
    this.roundRectPath(ctx, item.x, item.y, item.w, item.h, radius);
    ctx.clip();
    this.drawObjectFitImage(ctx, item.image, item.x, item.y, item.w, item.h, "contain");
    ctx.restore();
  }

  async drawDetailBase(ctx, images) {
    const width = this.config.xhs_width;
    const height = this.config.xhs_height;
    ctx.save();
    this.roundRectPath(ctx, 0, 0, width, height, this.getCoverRadius());
    ctx.clip();
    this.drawStyledDetailBackground(ctx, width, height);
    ctx.restore();
  }

  drawStyledDetailBackground(ctx, width, height) {
    this.config.detail_background_color = DEFAULT_CONFIG.detail_background_color;
    ctx.fillStyle = DEFAULT_CONFIG.detail_background_color;
    ctx.fillRect(0, 0, width, height);
  }

  async drawMarkdownCanvasToken(ctx, token, x, y, width, imageDraws = null) {
    const baseSize = (this.config.detail_font_size || this.config.body_size) * (token.fittedScale || 1);
    if (token.type === "rule") {
      const divider=this.getContentDivider();
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = divider.color;
      ctx.fillRect(x, y, width, divider.width);
      ctx.restore();
      return y + divider.width;
    }
    if (token.type === "spacer") {
      return y + this.getDetailBlankLineHeight(token.lines);
    }
    if (token.type === "heading") {
      const detailFontSize = this.config.detail_font_size || this.config.body_size;
      const level = token.displayLevel || token.level;
      const { size, weight, lineHeight } = this.getDetailHeadingMetrics(level, token.fittedScale || 1);
      ctx.font = `${weight} ${size}px ${this.getDetailCanvasFontFamily(false)}`;
      ctx.fillStyle = this.getDetailTextColor();
      ctx.textBaseline = "top";
      const nextY = this.drawWrappedDetailHeadingText(ctx, token.text, x, y, width, lineHeight, size, weight);
      return nextY;
    }
    if (token.type === "list") {
      let nextY = y;
      const ordered = token.ordered ?? /^\d+\.$/.test(token.items[0]?.marker || "");
      const markerWidth = ordered ? Math.max(2, ...token.items.map((item) => String(item.marker || "").length)) : 1;
      for (let index = 0; index < token.items.length; index++) {
        const item = token.items[index];
        const marker = item.continuation ? "" : typeof item.checked === "boolean" ? (item.checked ? "\u2611" : "\u2610") : /^\d+\.$/.test(item.marker || "") ? item.marker : "\u2022";
        const detailFontSize = baseSize;
        ctx.font = `${this.getDetailFontWeight()} ${detailFontSize}px ${this.getDetailCanvasFontFamily(false)}`;
        ctx.fillStyle = this.getDetailTextColor();
        ctx.textBaseline = "top";
        ctx.fillStyle = this.getDetailTextColor();
        const itemX = x + (item.depth || 0) * detailFontSize * 0.8;
        ctx.fillText(marker, itemX, nextY);
        const markerGap = detailFontSize * (markerWidth * 0.65 + 0.5);
        nextY = this.drawWrappedInlineText(ctx, item.text || item, itemX + markerGap, nextY, width - markerGap - (itemX - x), detailFontSize * this.getDetailLineHeight(), detailFontSize);
        if (index < token.items.length - 1) nextY += detailFontSize * 0.15;
      }
      return nextY;
    }
    if (token.type === "table") {
      return this.drawCanvasTable(ctx, token, x, y, width);
    }
    if (token.type === "quote") {
      const detailFontSize = baseSize;
      const lineHeight = detailFontSize * this.getDetailLineHeight();
      ctx.fillStyle = this.getDetailTextColor();
      const barWidth = 2;
      const gap = Math.round(detailFontSize * 0.75);
      const nextY = this.drawWrappedInlineText(ctx, token.text, x + gap, y, width - gap, lineHeight, detailFontSize);
      ctx.fillStyle = this.config.accent_color || this.getDetailTextColor();
      ctx.fillRect(x, y, barWidth, Math.max(lineHeight, nextY - y));
      return nextY;
    }
    if (token.type === "code") {
      const fontSize = baseSize;
      const padding = Math.round(fontSize * 0.62);
      ctx.font = `500 ${fontSize}px ${this.getDetailCanvasFontFamily()}`;
      const lines = this.toText(token.text).split(/\r?\n/).flatMap(line => {
        const wrapped = []; let current = "";
        for (const char of Array.from(line)) {
          if (current && ctx.measureText(current + char).width > width - padding * 2) { wrapped.push(current); current = ""; }
          current += char;
        }
        wrapped.push(current); return wrapped;
      });
      const boxHeight = lines.length * fontSize * this.getDetailLineHeight() + padding * 2;
      ctx.fillStyle = this.hexToRgba(this.config.secondary_color, 0.18);
      ctx.fillRect(x, y, width, boxHeight);
      ctx.font = `500 ${fontSize}px ${this.getDetailCanvasFontFamily()}`;
      ctx.fillStyle = this.getDetailTextColor();
      ctx.textBaseline = "top";
      lines.forEach((line, index) => ctx.fillText(line, x + padding, y + padding + index * fontSize * this.getDetailLineHeight()));
      return y + boxHeight;
    }
    if (token.type === "image") {
      const src = await this.resolveImage(token.src);
      if (!src) return y;
      const imageIndex = this.detailImageCanvasIndex++;
      const image = await this.loadImage(src);
      const key = this.getDetailImageKey(token, imageIndex);
      const imageAspectRatio = (image.naturalWidth || image.width) / Math.max(1, image.naturalHeight || image.height);
      const layout = this.getDetailImageLayout(key, token, imageAspectRatio, imageIndex, image.naturalWidth || image.width || 0);
      const imageWidth = layout.w || token.width || this.config.detail_image_width;
      const imageHeight = layout.h || Math.round(imageWidth / Math.max(0.01, imageAspectRatio));
      const reserveHeight = Math.max(1, Math.round(imageHeight));
      if (imageDraws) {
        imageDraws.push({
          image,
          x: x + (layout.x || 0),
          y,
          w: imageWidth,
          h: imageHeight
        });
      }
      return y + reserveHeight;
    }
    ctx.textBaseline = "top";
    const detailFontSize = baseSize;
    const nextY = this.drawWrappedInlineText(ctx, token.text, x, y, width, detailFontSize * this.getDetailLineHeight(), detailFontSize);
    return nextY;
  }

  async drawCanvasImageRow(tokens, x, y, width, imageDraws = null) {
    const gap = this.getDetailImageGap();
    let cursorY = y;

    for (let offset = 0; offset < tokens.length; offset += 2) {
      const rowTokens = tokens.slice(offset, offset + 2);
      const columns = rowTokens.length;
      const maxDefaultWidth = columns > 1
        ? Math.floor((width - gap) / 2)
        : 0;
      const rowItems = [];
      let rowPairMode = false;

      for (const token of rowTokens) {
        const src = await this.resolveImage(token.src);
        if (!src) continue;
        const imageIndex = this.detailImageCanvasIndex++;
        const image = await this.loadImage(src);
        const key = this.getDetailImageKey(token, imageIndex);
        const imageAspectRatio = (image.naturalWidth || image.width) / Math.max(1, image.naturalHeight || image.height);
        const layout = this.getDetailImageLayout(key, token, imageAspectRatio, imageIndex, image.naturalWidth || image.width || 0, maxDefaultWidth);
        rowPairMode = rowPairMode || this.isDetailImagePairModeKey(key);
        rowItems.push({ image, key, layout, token, imageAspectRatio });
      }
      if (!rowItems.length) continue;
      if (rowPairMode && rowItems.length === 2) {
        const master = rowItems[0].layout;
        rowItems[1].layout.w = master.w;
        rowItems[1].layout.h = Math.round(master.w / Math.max(0.01, rowItems[1].imageAspectRatio));
        rowItems[1].layout.slotW = master.slotW;
      }

      const sizes = rowItems.map((item) => {
        const imageWidth = item.layout.w || item.token.width || this.config.detail_image_width;
        const imageHeight = item.layout.h || Math.round(imageWidth / Math.max(0.01, item.imageAspectRatio));
        return {
          imageWidth,
          imageHeight,
          reserveWidth: Math.max(40, Math.round(item.layout.slotW || imageWidth)),
          reserveHeight: Math.max(1, Math.round(imageHeight))
        };
      });
      const rowHeight = Math.max(...sizes.map((size) => size.reserveHeight), 1);
      const totalWidth = sizes.reduce((sum, size) => sum + size.reserveWidth, 0) + gap * Math.max(0, sizes.length - 1);

      let cursorX = rowPairMode && sizes.length === 2 ? 0 : Math.max(0, Math.round((width - totalWidth) / 2));
      for (let itemIndex = 0; itemIndex < rowItems.length; itemIndex++) {
        const item = rowItems[itemIndex];
        const size = sizes[itemIndex];
        const drawX = rowPairMode && itemIndex === 1 ? Math.max(0, width - size.reserveWidth) : cursorX;
        if (imageDraws) {
          imageDraws.push({
            image: item.image,
            x: x + drawX + (rowPairMode ? 0 : (item.layout.x || 0)),
            y: cursorY,
            w: size.imageWidth,
            h: size.imageHeight
          });
        }
        cursorX += size.reserveWidth + gap;
      }
      cursorY += rowHeight + gap;
    }

    return cursorY > y ? cursorY - gap : y;
  }

  drawWrappedInlineText(ctx, text, x, y, width, lineHeight, fontSize) {
    const chars = [];
    this.parseInlineSegments(text).forEach((segment) => {
      Array.from(segment.text).forEach((char) => chars.push({ char, bold: segment.bold, code: segment.code }));
    });
    let cursorX = x;
    let cursorY = y;
    const letterSpacing = this.getDetailLetterSpacing();
    chars.forEach((part) => {
      if (part.char === "\n") {
        cursorX = x;
        cursorY += lineHeight;
        return;
      }
      this.setInlineCanvasFont(ctx, fontSize, part.bold, part.code);
      const charWidth = ctx.measureText(part.char).width;
      if (cursorX > x && cursorX + charWidth > x + width) {
        cursorX = x;
        cursorY += lineHeight;
      }
      ctx.fillStyle = this.getDetailTextColor();
      ctx.fillText(part.char, cursorX, cursorY);
      cursorX += charWidth + letterSpacing;
    });
    return cursorY + lineHeight;
  }

  drawWrappedDetailHeadingText(ctx, text, x, y, width, lineHeight, fontSize, fontWeight) {
    const letterSpacing = this.getDetailLetterSpacing();
    ctx.font = `${fontWeight} ${fontSize}px ${this.getDetailCanvasFontFamily(false)}`;
    const wrapped = this.wrapHighlightedSegmentsForCanvas(
      ctx,
      this.stripInlineMarkdown(text).split(/\r?\n/).map((line) => [{ text: line, highlight: false }]),
      width,
      letterSpacing
    );
    let cursorY = y;
    wrapped.forEach((segments) => {
      let cursorX = x;
      segments.forEach((segment) => {
        const segmentWidth = this.measureTextWithSpacing(ctx, segment.text, letterSpacing);
        ctx.fillStyle = segment.highlight
          ? (this.config.detail_title_color_mode === "gradient"
            ? this.createDetailTitleGradient(ctx, cursorX, cursorY, Math.max(1, segmentWidth))
            : (this.config.detail_title_highlight_color || this.config.accent_color || this.getDetailTextColor()))
          : this.getDetailTextColor();
        this.drawLetterSpacedText(ctx, segment.text, cursorX, cursorY, letterSpacing);
        cursorX += segmentWidth;
      });
      cursorY += lineHeight;
    });
    return cursorY;
  }

  getDetailFontWeight() {
    return this.toNumber(this.config.detail_font_weight, DEFAULT_CONFIG.detail_font_weight, 100, 1000);
  }

  getDetailLineHeight() {
    return this.toFloat(this.config.detail_line_height, DEFAULT_CONFIG.detail_line_height, 1.25, 3);
  }

  getDetailLetterSpacing() {
    return this.toNumber(this.config.detail_letter_spacing, DEFAULT_CONFIG.detail_letter_spacing, 0, 100);
  }

  getDetailColorContrast(foreground, background) {
    const luminance = (hex) => {
      const value = this.toColor(hex, "#ffffff").replace("#", "");
      const expanded = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
      const channels = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16) / 255)
        .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const bg = luminance(background);
    const fg = luminance(foreground);
    return (Math.max(bg,fg)+0.05)/(Math.min(bg,fg)+0.05);
  }

  getDetailTextColor() {
    const text=this.config.detail_text_color || DEFAULT_CONFIG.detail_text_color;
    const background=this.config.detail_background_color || DEFAULT_CONFIG.detail_background_color;
    if(this.getDetailColorContrast(text,background)>=4.5)return text;
    return this.getDetailColorContrast('#000000',background)>=this.getDetailColorContrast('#ffffff',background)
      ? '#111116' : '#ffffff';
  }

  getDetailHeadingMetrics(level, scale = 1) {
    const system=this.getDetailDesignSystem();
    const index = Math.min(5, Math.max(0, level - 1));
    const size = system.headingSizes[index] * scale;
    return {size,weight:system.typography.headingWeight,lineHeight:size*(index===0?system.typography.primaryLeading:system.typography.headingLeading)};
  }

  parseDetailLink(source) {
    if (source.startsWith("[[")) {
      const [target, ...labels] = source.slice(2, -2).split("|");
      return { text: labels.join("|") || target, target };
    }
    const match = source.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return match ? { text: match[1], target: match[2] } : { text: source, target: "" };
  }

  getDetailCanvasFontFamily(heading = false) {
    return CONTENT_FONT_STACK;
  }

  async ensureContentFontsLoaded() {
    if(typeof document==="undefined" || !document.fonts?.load)return;
    const text = "中文排版 English 123";
    await Promise.all(["400", "600", "900", "italic 500"].map(
      style => document.fonts.load(`${style} 36px ${CONTENT_FONT_STACK}`, text)
    ));
  }

  parseInlineSegments(text) {
    const source = this.toText(text);
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\)|\[\[[^\]]+\]\])/g;
    const segments = [];
    let cursor = 0;
    source.replace(pattern, (match, _token, offset) => {
      if (offset > cursor) segments.push({ text: source.slice(cursor, offset), bold: false, code: false });
      if (match.startsWith("**")) {
        segments.push({ text: match.slice(2, -2), bold: true, code: false });
      } else if (match.startsWith("`")) {
        segments.push({ text: match.slice(1, -1), bold: false, code: true });
      } else {
        const link = this.parseDetailLink(match);
        segments.push({ text: link.text, link: link.target, bold: false, code: false });
      }
      cursor = offset + match.length;
      return match;
    });
    if (cursor < source.length) segments.push({ text: source.slice(cursor), bold: false, code: false });
    return segments;
  }

  setInlineCanvasFont(ctx, fontSize, bold, code) {
    if (code) {
      ctx.font = `600 ${fontSize}px ${this.getDetailCanvasFontFamily()}`;
      return;
    }
    const weight = this.getDetailFontWeight();
    ctx.font = `${bold ? Math.max(weight, 700) : weight} ${fontSize}px ${this.getDetailCanvasFontFamily(false)}`;
  }

  drawWrappedText(ctx, text, x, y, width, lineHeight, letterSpacing = 0) {
    let line = "";
    let cursorY = y;
    Array.from(this.toText(text)).forEach((char) => {
      const test = line + char;
      if (line && this.measureTextWithSpacing(ctx, test, letterSpacing) > width) {
        this.drawLetterSpacedText(ctx, line, x, cursorY, letterSpacing);
        cursorY += lineHeight;
        line = char;
      } else {
        line = test;
      }
    });
    if (line) {
      this.drawLetterSpacedText(ctx, line, x, cursorY, letterSpacing);
      cursorY += lineHeight;
    }
    return cursorY;
  }

  measureTextWithSpacing(ctx, text, spacing) {
    const chars = Array.from(this.toText(text));
    return ctx.measureText(text).width + Math.max(0, chars.length - 1) * (spacing || 0);
  }

  drawCanvasTable(ctx, token, x, y, width) {
    const rows = token.rows || [];
    if (!rows.length) return y;
    const colCount = Math.max(...rows.map((row) => row.length));
    const colWidth = width / colCount;
    const fontSize = (this.config.detail_font_size || this.config.body_size) * (token.fittedScale || 1);
    const lineHeight = fontSize * this.getDetailLineHeight();
    const cellPadX = Math.round(fontSize * 0.44);
    const cellPadY = Math.round(fontSize * 0.36);
    ctx.font = `700 ${fontSize}px ${this.getDetailCanvasFontFamily()}`;
    ctx.textBaseline = "top";
    let cursorY = y;
    rows.forEach((row, rowIndex) => {
      const wrapped = row.map(cell => {
        const lines = []; let current = "";
        ctx.font = `${rowIndex === 0 ? 700 : this.getDetailFontWeight()} ${fontSize}px ${this.getDetailCanvasFontFamily(false)}`;
        for (const char of Array.from(this.parseInlineSegments(cell).map(segment => segment.text).join(""))) {
          if (char === "\n" || (current && ctx.measureText(current + char).width > colWidth - cellPadX * 2)) { lines.push(current); current = ""; }
          if (char !== "\n") current += char;
        }
        lines.push(current); return lines;
      });
      const rowHeight = Math.max(1, ...wrapped.map(lines => lines.length)) * lineHeight + cellPadY * 2;
      row.forEach((cell, colIndex) => {
        const cellX = x + colIndex * colWidth;
        const cellY = cursorY;
        ctx.fillStyle = rowIndex === 0 ? this.hexToRgba(this.config.secondary_color, 0.28) : "rgba(255,255,255,0.04)";
        ctx.fillRect(cellX, cellY, colWidth, rowHeight);
        ctx.strokeStyle = this.hexToRgba(this.getDetailTextColor(), 0.2);
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, colWidth, rowHeight);
        ctx.fillStyle = this.getDetailTextColor();
        wrapped[colIndex].forEach((line, index) => ctx.fillText(line, cellX + cellPadX, cellY + cellPadY + index * lineHeight));
      });
      cursorY += rowHeight;
    });
    return cursorY;
  }

  hexToRgba(color, alpha) {
    const text = this.toText(color).trim();
    const match = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return `rgba(255,255,255,${alpha})`;
    let hex = match[1];
    if (hex.length === 3) hex = hex.split("").map((char) => char + char).join("");
    const value = Number.parseInt(hex, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  mixHexColor(color, targetColor, targetRatio, alpha = 1) {
    const parse = (value, fallback) => {
      const text = this.toText(value).trim();
      const match = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!match) return fallback;
      let hex = match[1];
      if (hex.length === 3) hex = hex.split("").map((char) => char + char).join("");
      const number = Number.parseInt(hex, 16);
      return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
    };
    const from = parse(color, [255, 255, 255]);
    const to = parse(targetColor, [255, 255, 255]);
    const ratio = Math.max(0, Math.min(1, Number(targetRatio) || 0));
    const mixed = from.map((channel, index) => Math.round(channel * (1 - ratio) + to[index] * ratio));
    if (alpha < 1) return `rgba(${mixed[0]},${mixed[1]},${mixed[2]},${alpha})`;
    return `rgb(${mixed[0]},${mixed[1]},${mixed[2]})`;
  }

  stripInlineMarkdown(text) {
    return this.toText(text)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
  }

  drawCleanSoftWash(ctx, x, y, width, height) {
    const wash = ctx.createLinearGradient(x, y, x, y + height);
    wash.addColorStop(0, "rgba(255,255,255,0.96)");
    wash.addColorStop(0.46, "rgba(255,255,255,0.72)");
    wash.addColorStop(0.76, this.hexToRgba(this.config.accent_color || "#0071e3", 0.026));
    wash.addColorStop(1, this.hexToRgba(this.config.secondary_color || "#e8f2ff", 0.18));
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, width, height);
  }

  drawAppleProductBackground(ctx, x, y, width, height) {
    ctx.fillStyle = this.config.background_color || "#f5f5f7";
    ctx.fillRect(x, y, width, height);

    const leftGlow = ctx.createRadialGradient(x + width * 0.06, y + height * 0.82, 10, x + width * 0.06, y + height * 0.82, width * 0.44);
    leftGlow.addColorStop(0, this.hexToRgba(this.getActiveGradientFrom(), 0.16));
    leftGlow.addColorStop(1, this.hexToRgba(this.getActiveGradientFrom(), 0));
    ctx.fillStyle = leftGlow;
    ctx.fillRect(x, y, width, height);

    const rightGlow = ctx.createRadialGradient(x + width * 0.96, y + height * 0.40, 10, x + width * 0.96, y + height * 0.40, width * 0.42);
    rightGlow.addColorStop(0, this.hexToRgba(this.getActiveGradientTo(), 0.12));
    rightGlow.addColorStop(1, this.hexToRgba(this.getActiveGradientTo(), 0));
    ctx.fillStyle = rightGlow;
    ctx.fillRect(x, y, width, height);

    this.drawCleanSoftWash(ctx, x, y, width, height);
    this.drawSubtleGradientDither(ctx, x, y, width, height, 0.012);
  }

  drawCoverLayoutBackground(ctx, x, y, width, height, presetId) {
    if (!this.isCoverLayoutStyle(presetId)) return false;
    ctx.fillStyle = this.getCoverLayoutBackgroundCss(presetId);
    ctx.fillRect(x, y, width, height);
    return true;
  }

  drawSubtleGradientDither(ctx, x, y, width, height, alpha = 0.012) {
    if (typeof document === "undefined" || !ctx || alpha <= 0) return;
    if (!this.gradientDitherCanvas) {
      const noiseCanvas = document.createElement("canvas");
      const size = 128;
      noiseCanvas.width = size;
      noiseCanvas.height = size;
      const noiseCtx = noiseCanvas.getContext("2d");
      if (!noiseCtx) return;
      const imageData = noiseCtx.createImageData(size, size);
      let seed = 1729;
      for (let index = 0; index < imageData.data.length; index += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const value = seed & 255;
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
        imageData.data[index + 3] = 255;
      }
      noiseCtx.putImageData(imageData, 0, 0);
      this.gradientDitherCanvas = noiseCanvas;
    }
    const pattern = ctx.createPattern(this.gradientDitherCanvas, "repeat");
    if (!pattern) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  drawHuaweiProductBackground(ctx, x, y, width, height) {
    const dark = !this.isBrightColor(this.config.text_color || "#1f1f1f");
    const base = this.config.background_color || (dark ? "#050403" : "#f6f3ec");
    const secondary = this.config.secondary_color || (dark ? "#221910" : "#efe6d5");
    const from = this.getActiveGradientFrom();
    const to = this.getActiveGradientTo();
    const bg = ctx.createLinearGradient(x, y, x + width, y + height);
    if (dark) {
      bg.addColorStop(0, this.mixHexColor(base, "#ffffff", 0.05, 1));
      bg.addColorStop(0.54, base);
      bg.addColorStop(1, this.mixHexColor(secondary, "#000000", 0.34, 1));
    } else {
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(0.48, base);
      bg.addColorStop(1, this.mixHexColor(secondary, "#ffffff", 0.28, 1));
    }
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, width, height);

    const topGlow = ctx.createRadialGradient(x + width * 0.50, y + height * 0.10, 20, x + width * 0.50, y + height * 0.10, width * 0.62);
    topGlow.addColorStop(0, this.hexToRgba(from, dark ? 0.12 : 0.085));
    topGlow.addColorStop(1, this.hexToRgba(from, 0));
    ctx.fillStyle = topGlow;
    ctx.fillRect(x, y, width, height);

    const productGlow = ctx.createRadialGradient(x + width * 0.50, y + height * 0.74, 20, x + width * 0.50, y + height * 0.74, width * 0.68);
    productGlow.addColorStop(0, this.hexToRgba(to, dark ? 0.28 : 0.19));
    productGlow.addColorStop(0.52, this.hexToRgba(to, dark ? 0.09 : 0.065));
    productGlow.addColorStop(1, this.hexToRgba(to, 0));
    ctx.fillStyle = productGlow;
    ctx.fillRect(x, y, width, height);

    ctx.save();
    ctx.strokeStyle = this.hexToRgba(from, dark ? 0.13 : 0.10);
    ctx.lineWidth = Math.max(16, width * 0.028);
    ctx.beginPath();
    ctx.arc(x + width * 0.50, y + height * 0.80, width * 0.43, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.restore();

    const wash = ctx.createLinearGradient(0, y, 0, y + height);
    wash.addColorStop(0, dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.22)");
    wash.addColorStop(0.54, "rgba(255,255,255,0)");
    wash.addColorStop(1, this.hexToRgba(this.config.accent_color || "#c8a45d", dark ? 0.10 : 0.045));
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, width, height);
    this.drawSubtleGradientDither(ctx, x, y, width, height, dark ? 0.016 : 0.010);
  }

  drawInstagramGradientBackground(ctx, x, y, width, height) {
    const dark = this.isBrightColor(this.config.text_color || "#111111");
    const base = this.config.background_color || (dark ? "#050509" : "#fff7fb");
    const secondary = this.config.secondary_color || (dark ? "#211327" : "#ffe2b8");
    const stops = this.getTitleGradientStops();
    const bg = ctx.createLinearGradient(x, y, x + width, y + height);
    if (dark) {
      bg.addColorStop(0, this.mixHexColor(base, "#ffffff", 0.04, 1));
      bg.addColorStop(0.58, base);
      bg.addColorStop(1, this.mixHexColor(secondary, "#000000", 0.32, 1));
    } else {
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(0.58, base);
      bg.addColorStop(1, this.mixHexColor(secondary, "#ffffff", 0.55, 1));
    }
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, width, height);

    const glowPoints = [
      [0.16, 0.22, 0.48, 0.065],
      [0.86, 0.42, 0.52, 0.065],
      [0.46, 0.88, 0.54, 0.052]
    ];
    glowPoints.forEach((point, index) => {
      const color = stops[index % stops.length] || this.getActiveGradientFrom();
      const glow = ctx.createRadialGradient(x + width * point[0], y + height * point[1], 16, x + width * point[0], y + height * point[1], width * point[2]);
      glow.addColorStop(0, this.hexToRgba(color, dark ? point[3] + 0.08 : point[3]));
      glow.addColorStop(0.52, this.hexToRgba(color, dark ? 0.045 : 0.032));
      glow.addColorStop(1, this.hexToRgba(color, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x, y, width, height);
    });
    this.drawSubtleGradientDither(ctx, x, y, width, height, dark ? 0.018 : 0.012);
  }

  drawGoogleSearchBackground(ctx, x, y, width, height) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(218,220,224,0.62)";
    ctx.lineWidth = 1;
    for (let gx = x + 60; gx < x + width; gx += 120) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + height);
      ctx.stroke();
    }
    for (let gy = y + 70; gy < y + height; gy += 120) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + width, gy);
      ctx.stroke();
    }
    ctx.restore();

    const colors = ["#4285f4", "#ea4335", "#fbbc04", "#34a853"];
    const points = [
      [0.18, 0.24, 0.30, 0.045],
      [0.82, 0.26, 0.28, 0.040],
      [0.22, 0.82, 0.34, 0.042],
      [0.78, 0.78, 0.34, 0.045]
    ];
    points.forEach((point, index) => {
      const glow = ctx.createRadialGradient(x + width * point[0], y + height * point[1], 12, x + width * point[0], y + height * point[1], width * point[2]);
      glow.addColorStop(0, this.hexToRgba(colors[index], point[3]));
      glow.addColorStop(1, this.hexToRgba(colors[index], 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x, y, width, height);
    });

    this.drawSubtleGradientDither(ctx, x, y, width, height, 0.014);
  }

  async drawTemplateBase(ctx, images, modules = []) {
    const width = this.config.xhs_width;
    const height = this.config.xhs_height;
    const radius = this.getCoverRadius();
    ctx.save();
    this.roundRectPath(ctx, 0, 0, width, height, radius);
    ctx.clip();
    ctx.fillStyle = this.config.background_color || (this.config.xhs_style === "neon-grid" ? "#020404" : "#071747");
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (images.background) {
      try {
        const bgImage = await this.loadImage(images.background);
        this.drawObjectFitImage(ctx, bgImage, 0, 0, width, height, "cover");
      } catch (error) {
        console.error("[XHS Card Studio] 背景图导出失败", error);
      }
    }

    if (this.config.xhs_style === "composition" || this.hasTemplateBackgroundModule(modules)) return;

    if (this.config.xhs_style === "neon-grid") {
      this.drawGrid(ctx, width, height, 36, "rgba(255,255,255,0.085)");
    } else if (this.config.xhs_style === "clean-gradient") {
      this.drawAppleProductBackground(ctx, 0, 0, width, height);
    } else if (this.config.xhs_style === "huawei-product") {
      this.drawHuaweiProductBackground(ctx, 0, 0, width, height);
      this.drawGrid(ctx, width, height, 54, this.isBrightColor(this.config.text_color || "#1f1f1f") ? "rgba(255,255,255,0.018)" : "rgba(28,34,30,0.022)");
    } else if (this.config.xhs_style === "instagram-gradient") {
      this.drawInstagramGradientBackground(ctx, 0, 0, width, height);
      this.drawGrid(ctx, width, height, 48, this.isBrightColor(this.config.text_color || "#111111") ? "rgba(255,255,255,0.018)" : "rgba(20,20,24,0.018)");
    } else if (this.config.xhs_style === "google-search") {
      this.drawGoogleSearchBackground(ctx, 0, 0, width, height);
    } else if (this.isCoverLayoutStyle(this.config.xhs_style)) {
      this.drawCoverLayoutBackground(ctx, 0, 0, width, height, this.config.xhs_style);
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#081a4c");
      bg.addColorStop(0.62, "#06123b");
      bg.addColorStop(1, "#120d3b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      const pink = ctx.createRadialGradient(width * 0.75, height * 0.78, 20, width * 0.75, height * 0.78, 380);
      pink.addColorStop(0, "rgba(255,163,222,0.36)");
      pink.addColorStop(1, "rgba(255,163,222,0)");
      ctx.fillStyle = pink;
      ctx.fillRect(0, 0, width, height);
      const blue = ctx.createRadialGradient(width * 0.28, height * 0.84, 20, width * 0.28, height * 0.84, 430);
      blue.addColorStop(0, "rgba(129,91,255,0.32)");
      blue.addColorStop(1, "rgba(129,91,255,0)");
      ctx.fillStyle = blue;
      ctx.fillRect(0, 0, width, height);
    }
  }

  hasTemplateBackgroundModule(modules) {
    if (!Array.isArray(modules)) return false;
    return modules.some((module) => this.isTemplateBackgroundModule(module));
  }

  isTemplateBackgroundModule(module) {
    const className = module && module.className ? module.className : "";
    return [
      "xhs-module-clean-bg",
      "xhs-module-huawei-bg",
      "xhs-module-instagram-bg",
      "xhs-module-google-bg",
      "xhs-module-ai-bg",
      "xhs-module-cover-layout-bg"
    ].some((name) => className.includes(name));
  }

  drawGrid(ctx, width, height, step, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  async drawCanvasModule(ctx, module, images) {
    const cutout=this.isTransparentCoverTitle() && this.config.xhs_modules.some(m=>m.coverTextRole==='title'&&m.text);
    if(cutout && module.coverTextRole==='title')return;
    if(cutout && ['comparison-backdrop','composition-block'].includes(module.id)) {
      if(this.coverCutoutRaster?.moduleId!==module.id)throw new Error('透明标题尚未完成渲染，请刷新预览');
      const raster=await this.loadImage(this.coverCutoutRaster.dataUrl);ctx.drawImage(raster,module.x,module.y,module.w,module.h);return;
    }
    this.normalizeCoverImageFrame(module);
    ctx.save();
    ctx.globalAlpha = 1;
    if (module.type === "shape") {
      this.drawShapeModule(ctx, module);
    } else if (module.type === "image") {
      await this.drawImageModule(ctx, module, images);
    } else {
      this.drawTextModule(ctx, module);
    }
    ctx.restore();
  }

  drawShapeModule(ctx, module) {
    if (module.rotation && !module._drawingRotated) {
      const rotation = (Number.parseFloat(module.rotation) || 0) * Math.PI / 180;
      ctx.save();
      ctx.translate(module.x + module.w / 2, module.y + module.h / 2);
      ctx.rotate(rotation);
      this.drawShapeModule(ctx, Object.assign({}, module, {
        x: -module.w / 2,
        y: -module.h / 2,
        rotation: 0,
        _drawingRotated: true
      }));
      ctx.restore();
      return;
    }
    if (module.layoutPreset && (module.className || "").includes("xhs-module-cover-layout-bg") && this.drawCoverLayoutBackground(ctx, module.x, module.y, module.w, module.h, module.layoutPreset)) {
      return;
    }
    if (module.className === "xhs-module-glow") {
      const glowColor = this.getModuleGlowColor(module);
      const cx = module.x + module.w * 0.5;
      const cy = module.y + module.h * 0.5;
      const radius = Math.max(module.w, module.h) * 0.78;
      const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
      gradient.addColorStop(0, this.mixHexColor(glowColor, "#ffffff", 0.62, 0.28));
      gradient.addColorStop(0.36, this.hexToRgba(glowColor, 0.16));
      gradient.addColorStop(0.66, this.hexToRgba(glowColor, 0.055));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.15, module.w / Math.max(1, module.h)) * 1.18, 1);
      ctx.filter = "blur(16px) saturate(0.76)";
      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      const glass = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 0.66);
      glass.addColorStop(0, "rgba(255,255,255,0.055)");
      glass.addColorStop(0.45, "rgba(255,255,255,0.02)");
      glass.addColorStop(1, "rgba(255,255,255,0)");
      ctx.filter = "blur(26px)";
      ctx.fillStyle = glass;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (module.className === "xhs-module-checkers") {
      ctx.fillStyle = "#020404";
      const step=module.w/5;
      for (let index=0;index<5;index++) {
        const x=module.x+index*step;
        ctx.beginPath();
        ctx.moveTo(x + step*0.25, module.y);
        ctx.lineTo(x + step*0.7, module.y);
        ctx.lineTo(x + step*0.95, module.y + module.h);
        ctx.lineTo(x + step*0.5, module.y + module.h);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }
    if (module.className === "xhs-module-clean-bg") {
      this.drawAppleProductBackground(ctx, module.x, module.y, module.w, module.h);
      return;
    }
    if (module.className === "xhs-module-huawei-bg") {
      this.drawHuaweiProductBackground(ctx, module.x, module.y, module.w, module.h);
      this.drawGrid(ctx, module.w, module.h, 54, this.isBrightColor(this.config.text_color || "#1f1f1f") ? "rgba(255,255,255,0.018)" : "rgba(28,34,30,0.022)");
      return;
    }
    if (module.className === "xhs-module-instagram-bg") {
      this.drawInstagramGradientBackground(ctx, module.x, module.y, module.w, module.h);
      this.drawGrid(ctx, module.w, module.h, 48, this.isBrightColor(this.config.text_color || "#111111") ? "rgba(255,255,255,0.018)" : "rgba(20,20,24,0.018)");
      return;
    }
    if (module.className === "xhs-module-google-bg") {
      this.drawGoogleSearchBackground(ctx, module.x, module.y, module.w, module.h);
      return;
    }
    if (module.className === "xhs-module-instagram-rule") {
      ctx.fillStyle = this.createTextGradient(ctx, module.x, module.y, Math.max(1, module.w));
      this.roundRectPath(ctx, module.x, module.y, module.w, Math.max(1, module.h), module.borderRadius || 999);
      ctx.fill();
      return;
    }
    if (module.className === "xhs-module-google-rule") {
      ctx.fillStyle = this.createTextGradient(ctx, module.x, module.y, Math.max(1, module.w));
      this.roundRectPath(ctx, module.x, module.y, module.w, Math.max(1, module.h), module.borderRadius || 999);
      ctx.fill();
      return;
    }
    if (module.className === "xhs-module-ai-bg") {
      const gradient = ctx.createLinearGradient(module.x, module.y, module.x, module.y + module.h);
      const bg = this.config.background_color || "#07185a";
      gradient.addColorStop(0, this.mixHexColor(bg, "#ffffff", 0.88, 1));
      gradient.addColorStop(0.58, bg);
      gradient.addColorStop(1, this.mixHexColor(bg, this.config.secondary_color || "#6f6dff", 0.76, 1));
      ctx.fillStyle = gradient;
      this.roundRectPath(ctx, module.x, module.y, module.w, module.h, module.borderRadius || 0);
      ctx.fill();
      const glowOne = ctx.createRadialGradient(module.x + module.w * 0.74, module.y + module.h * 0.74, 20, module.x + module.w * 0.74, module.y + module.h * 0.74, 300);
      glowOne.addColorStop(0, this.hexToRgba(this.config.accent_color || "#15dfde", 0.18));
      glowOne.addColorStop(1, this.hexToRgba(this.config.accent_color || "#15dfde", 0));
      ctx.fillStyle = glowOne;
      ctx.fillRect(module.x, module.y, module.w, module.h);
      const glowTwo = ctx.createRadialGradient(module.x + module.w * 0.32, module.y + module.h * 0.84, 20, module.x + module.w * 0.32, module.y + module.h * 0.84, 380);
      glowTwo.addColorStop(0, this.hexToRgba(this.config.secondary_color || "#6f6dff", 0.34));
      glowTwo.addColorStop(1, this.hexToRgba(this.config.secondary_color || "#6f6dff", 0));
      ctx.fillStyle = glowTwo;
      ctx.fillRect(module.x, module.y, module.w, module.h);
      return;
    }
    if (module.className === "xhs-module-ai-frame") {
      ctx.strokeStyle = this.config.secondary_color || "#6f6dff";
      ctx.lineWidth = 48;
      ctx.strokeRect(module.x + 24, module.y + 24, module.w - 48, module.h - 48);
      return;
    }
    if (module.className === "xhs-module-ai-speech") {
      ctx.strokeStyle = this.config.accent_color || "#15dfde";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(module.x, module.y);
      ctx.lineTo(module.x + module.w, module.y);
      ctx.stroke();
      return;
    }
    if (module.className === "xhs-module-speech-bubble") {
      const radius = Math.max(0, module.borderRadius || 18);
      const fill = this.resolveModuleFill(module.background || "rgba(255,255,255,0.92)");
      const stroke = this.config.accent_color || "#0071e3";
      ctx.save();
      ctx.shadowColor = "rgba(29,29,31,0.16)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = fill;
      this.roundRectPath(ctx, module.x, module.y, module.w, module.h, radius);
      ctx.fill();
      ctx.restore();

      const tailX = module.x + Math.min(72, Math.max(36, module.w * 0.18));
      const tailY = module.y + module.h - 2;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tailX + 42, tailY);
      ctx.lineTo(tailX + 22, tailY + 34);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      this.roundRectPath(ctx, module.x + 2, module.y + 2, module.w - 4, module.h - 4, Math.max(0, radius - 2));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tailX + 22, tailY + 34);
      ctx.lineTo(tailX + 42, tailY);
      ctx.stroke();
      return;
    }
    if (module.className === "xhs-module-dashed-line") {
      ctx.strokeStyle = this.resolveModuleFill(module.background || "var(--xhs-accent)");
      ctx.lineWidth = Math.max(1, module.h || 1);
      ctx.setLineDash([22, 14]);
      ctx.beginPath();
      ctx.moveTo(module.x, module.y + module.h * 0.5);
      ctx.lineTo(module.x + module.w, module.y + module.h * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    if (module.className === "xhs-module-line") {
      ctx.fillStyle = this.resolveModuleFill(module.background || "var(--xhs-accent)");
      ctx.fillRect(module.x, module.y, module.w, Math.max(1, module.h));
      return;
    }
    if (module.className === "xhs-module-highlight-strip") {
      ctx.fillStyle = this.resolveModuleFill(module.background || "var(--xhs-accent)");
      ctx.beginPath();
      ctx.moveTo(module.x + 18, module.y);
      ctx.lineTo(module.x + module.w, module.y);
      ctx.lineTo(module.x + module.w - 18, module.y + module.h);
      ctx.lineTo(module.x, module.y + module.h);
      ctx.closePath();
      ctx.fill();
      return;
    }
    if (module.className === "xhs-module-corner-frame") {
      ctx.strokeStyle = this.config.secondary_color;
      ctx.lineWidth = 6;
      const l = Math.min(82, module.w * 0.34, module.h * 0.42);
      ctx.beginPath();
      ctx.moveTo(module.x, module.y + l);
      ctx.lineTo(module.x, module.y);
      ctx.lineTo(module.x + l, module.y);
      ctx.moveTo(module.x + module.w - l, module.y + module.h);
      ctx.lineTo(module.x + module.w, module.y + module.h);
      ctx.lineTo(module.x + module.w, module.y + module.h - l);
      ctx.stroke();
      return;
    }
    if (module.className === "xhs-module-glass-panel") {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.32)";
      ctx.shadowBlur = 34;
      ctx.shadowOffsetY = 22;
      const glass = ctx.createLinearGradient(module.x, module.y, module.x + module.w, module.y + module.h);
      glass.addColorStop(0, "rgba(255,255,255,0.28)");
      glass.addColorStop(0.48, "rgba(255,255,255,0.11)");
      glass.addColorStop(1, "rgba(125,188,255,0.20)");
      ctx.fillStyle = glass;
      this.roundRectPath(ctx, module.x, module.y, module.w, module.h, 0);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.64)";
      ctx.lineWidth = 3;
      this.roundRectPath(ctx, module.x + 1.5, module.y + 1.5, module.w - 3, module.h - 3, 0);
      ctx.stroke();

      const shine = ctx.createLinearGradient(module.x, module.y, module.x, module.y + module.h * 0.45);
      shine.addColorStop(0, "rgba(255,255,255,0.34)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      this.roundRectPath(ctx, module.x + 24, module.y + 18, module.w - 48, module.h * 0.36, 0);
      ctx.fill();
      return;
    }
    if (module.className === "xhs-module-soft-shadow") {
      const cx = module.x + module.w * 0.5;
      const cy = module.y + module.h * 0.5;
      const gradient = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(module.w, module.h) * 0.55);
      gradient.addColorStop(0, "rgba(0,0,0,0.54)");
      gradient.addColorStop(0.45, "rgba(18,20,65,0.24)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, Math.max(0.18, module.h / Math.max(1, module.w)));
      ctx.beginPath();
      ctx.arc(0, 0, module.w * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (module.className === "xhs-module-light-spot") {
      const cx = module.x + module.w * 0.42;
      const cy = module.y + module.h * 0.36;
      const gradient = ctx.createRadialGradient(cx, cy, 2, module.x + module.w * 0.5, module.y + module.h * 0.5, Math.max(module.w, module.h) * 0.56);
      gradient.addColorStop(0, "rgba(255,255,255,0.82)");
      gradient.addColorStop(0.34, "rgba(145,205,255,0.42)");
      gradient.addColorStop(0.62, "rgba(90,80,255,0.18)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(module.x, module.y, module.w, module.h);
      return;
    }
    ctx.fillStyle = this.resolveModuleFill(module.background);
    this.roundRectPath(ctx, module.x, module.y, module.w, module.h, module.borderRadius || 0);
    ctx.fill();
  }

  drawTextModule(ctx, module) {
    this.ensureCenteredLabelModuleSize(module);
    this.constrainCoverTextModuleToSafeArea(module);
    this.fitTextModuleFrameToContent(module);
    this.constrainCoverTextModuleToSafeArea(module);
    const padding = this.getModulePadding(module);
    const className = module.className || "";
    if (module.className === "xhs-module-google-subtitle") {
      ctx.save();
      ctx.shadowColor = "rgba(60,64,67,0.14)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = this.resolveModuleFill(module.background || "#ffffff");
      this.roundRectPath(ctx, module.x, module.y, module.w, module.h, module.borderRadius || 999);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(218,220,224,0.95)";
      ctx.lineWidth = 1;
      this.roundRectPath(ctx, module.x + 0.5, module.y + 0.5, Math.max(1, module.w - 1), Math.max(1, module.h - 1), module.borderRadius || 999);
      ctx.stroke();
    } else if (module.background && !this.isPillLabelModule(module)) {
      ctx.fillStyle = this.resolveModuleFill(module.background);
      this.roundRectPath(ctx, module.x, module.y, module.w, module.h, module.borderRadius || 0);
      ctx.fill();
    }
    if (/\bxhs-module-label-outline\b/.test(className)) {
      ctx.strokeStyle = this.resolveModuleFill(module.color || "var(--xhs-accent)");
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 9]);
      this.roundRectPath(ctx, module.x + 2, module.y + 2, module.w - 4, module.h - 4, module.borderRadius || 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.isPillLabelModule(module)) {
      const borderWidth = Math.max(1, Number(module.borderWidth) || 2);
      this.drawPillLabelBorder(ctx, module, borderWidth);
    }
    if (this.isCenteredLabelModule(module)) {
      this.drawCenteredLabelTextModule(ctx, module, padding);
      return;
    }
    if (module.className === "xhs-module-ai-chips") {
      this.drawChipTextModule(ctx, module);
      return;
    }
    if (this.isCoverTitleModule(module)) {
      this.drawHighlightedTitleModule(ctx, module);
      return;
    }
    ctx.save();
    if (!className.includes("xhs-module-cover-layout-subtitle")
      && module.className !== "xhs-module-clean-subtitle"
      && module.className !== "xhs-module-huawei-subtitle"
      && module.className !== "xhs-module-instagram-subtitle"
      && module.className !== "xhs-module-google-subtitle"
      && !this.isCanvasOverflowVisibleTextModule(module)) {
      this.roundRectPath(ctx, module.x, module.y, module.w, module.h, module.borderRadius || 0);
      ctx.clip();
    }
    const fontSize = this.getCompositionFittedFontSize(module);
    const lineHeight = fontSize * (module.lineHeight || 1.1);
    const fontFamily = this.getCanvasFontFamilyForModule(module);
    ctx.font = `${module.fontWeight || 900} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = this.resolveModuleFill(module.color || "#ffffff");
    ctx.textBaseline = "top";
    const lines = this.getCanvasTextLinesForModule(ctx, module, Math.max(1, module.w - padding.x * 2), module.letterSpacing || 0);
    const drawTop = this.getTextModuleDrawTop(module, padding, lineHeight, lines.length);
    lines.forEach((line, index) => {
      const textWidth = this.measureTextWithSpacing(ctx, line, module.letterSpacing || 0);
      const drawX = this.getAlignedTextX(module, padding, textWidth);
      const drawY = drawTop + index * lineHeight;
      if (this.isCoverTitleModule(module) || this.isCoverSubtitleModule(module)
        || (module.template === "ai-course" && ["ai-title", "ai-bubble-title"].includes(module.id))) {
        this.strokeCoverText(ctx, line, drawX, drawY, textWidth, module.letterSpacing || 0,
          this.isCoverTitleModule(module) || module.id === "ai-title" ? "title" : "subtitle", ctx.fillStyle);
      }
      this.drawLetterSpacedText(ctx, line, drawX, drawY, module.letterSpacing || 0);
    });
    ctx.restore();
  }

  getTextModuleDrawTop(module, padding, lineHeight, lineCount) {
    if (this.isVerticalCenterTextModule(module)) {
      const textBlockHeight = Math.max(1, lineCount) * lineHeight;
      return module.y + padding.y + Math.max(0, (module.h - padding.y * 2 - textBlockHeight) / 2);
    }
    return module.y + padding.y;
  }

  drawCenteredLabelTextModule(ctx, module, padding) {
    ctx.save();
    const fontSize = module.fontSize || 32;
    const lineHeight = fontSize * (module.lineHeight || 1.1);
    const fontFamily = this.getCanvasFontFamilyForModule(module);
    const lines = this.getCenteredLabelLines(module);
    const letterSpacing = module.letterSpacing || 0;
    const borderWidth = this.getCenteredLabelBorderWidth(module);
    const contentTop = module.y + borderWidth + padding.y;
    const contentHeight = Math.max(1, module.h - (borderWidth + padding.y) * 2);
    const textBlockHeight = Math.max(1, lines.length * lineHeight);
    const blockTop = contentTop + Math.max(0, (contentHeight - textBlockHeight) / 2);
    ctx.font = `${module.fontWeight || 900} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = this.resolveModuleFill(module.color || "#ffffff");
    ctx.textBaseline = "middle";
    lines.forEach((line, index) => {
      const textWidth = this.measureTextWithSpacing(ctx, line, letterSpacing);
      const contentLeft = module.x + borderWidth + padding.x;
      const contentWidth = Math.max(1, module.w - (borderWidth + padding.x) * 2);
      const minX = contentLeft;
      const maxX = contentLeft + contentWidth - textWidth;
      const centeredX = contentLeft + (contentWidth - textWidth) / 2;
      const drawX = Math.max(minX, Math.min(maxX, centeredX));
      const lineCenterY = blockTop + index * lineHeight + lineHeight / 2;
      if (this.isCoverSubtitleModule(module)) {
        this.strokeCoverText(ctx, line, drawX, lineCenterY, textWidth, letterSpacing, "subtitle", ctx.fillStyle);
      }
      this.drawLetterSpacedText(ctx, line, drawX, lineCenterY, letterSpacing);
    });
    ctx.restore();
  }

  createPillLabelBorderCanvas(module, borderWidth) {
    const width = Math.max(1, Math.round(Number(module.w) || 1));
    const height = Math.max(1, Math.round(Number(module.h) || 1));
    const outerRadius = Math.min(width, height) / 2;
    const innerWidth = Math.max(0, width - borderWidth * 2);
    const innerHeight = Math.max(0, height - borderWidth * 2);
    const innerRadius = Math.max(0, Math.min(innerWidth, innerHeight) / 2);

    const buffer = document.createElement("canvas");
    buffer.width = width;
    buffer.height = height;
    const bufferCtx = buffer.getContext("2d");
    if (!bufferCtx) return null;
    bufferCtx.fillStyle = (module.borderMode || "gradient") === "gradient"
      ? this.createTextGradient(bufferCtx, 0, 0, width)
      : this.resolveModuleFill(module.borderColor || module.color || "var(--xhs-accent)");
    this.roundRectPath(bufferCtx, 0, 0, width, height, outerRadius);
    bufferCtx.fill();
    if (innerWidth > 0 && innerHeight > 0) {
      bufferCtx.globalCompositeOperation = "destination-out";
      this.roundRectPath(bufferCtx, borderWidth, borderWidth, innerWidth, innerHeight, innerRadius);
      bufferCtx.fill();
      bufferCtx.globalCompositeOperation = "source-over";
    }
    return buffer;
  }

  drawPillLabelBorder(ctx, module, borderWidth) {
    if (typeof document !== "undefined") {
      const border = this.createPillLabelBorderCanvas(module, borderWidth);
      if (border) ctx.drawImage(border, module.x, module.y);
      return;
    }

    const width = Math.max(1, Math.round(Number(module.w) || 1));
    const height = Math.max(1, Math.round(Number(module.h) || 1));
    const outerRadius = Math.min(width, height) / 2;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = (module.borderMode || "gradient") === "gradient"
      ? this.createTextGradient(ctx, module.x, module.y, width)
      : this.resolveModuleFill(module.borderColor || module.color || "var(--xhs-accent)");
    ctx.lineWidth = borderWidth;
    this.roundRectPath(ctx, module.x + borderWidth / 2, module.y + borderWidth / 2, width - borderWidth, height - borderWidth, outerRadius);
    ctx.stroke();
    ctx.restore();
  }

  drawHighlightedTitleModule(ctx, module) {
    const padding = this.getModulePadding(module);
    ctx.save();
    const fontSize = module.fontSize || 108;
    const lineHeight = fontSize * (module.lineHeight || 1.08);
    const letterSpacing = module.letterSpacing || 0;
    ctx.font = this.getTitleCanvasFont(module, fontSize, "");
    ctx.textBaseline = "top";
    const explicitLines = this.parseHighlightedTitleSegments(module.text || "");
    const lines = this.shouldPreserveManualTextLines(module)
      ? explicitLines
      : this.wrapHighlightedSegmentsForCanvas(
        ctx,
        explicitLines,
        Math.max(1, module.w - padding.x * 2),
        letterSpacing,
        module,
        fontSize
      );
    lines.forEach((segments, index) => {
      const lineWidth = this.measureHighlightedTitleLine(ctx, module, segments, fontSize, letterSpacing);
      let cursorX = this.getAlignedTextX(module, padding, lineWidth);
      const cursorY = module.y + padding.y + index * lineHeight;
      segments.forEach((segment) => {
        this.splitTitleSegmentByArtScript(segment).forEach((run) => {
          ctx.font = this.getTitleCanvasFont(module, fontSize, run.script);
          const segmentWidth = this.measureTextWithSpacing(ctx, run.text, letterSpacing);
          ctx.fillStyle = this.shouldUseTitleGradient(segment)
            ? this.createTextGradient(ctx, cursorX, cursorY, Math.max(1, segmentWidth))
            : (segment.highlight ? (this.config.cover_highlight_color || (this.config.cover_editor_version===1 ? this.config.cover_title_color || module.color : this.config.accent_color || "#0071e3")) : this.resolveModuleFill(module.color || "var(--xhs-text)"));
          this.strokeCoverText(ctx, run.text, cursorX, cursorY, segmentWidth, letterSpacing,
            segment.highlight ? "highlight" : "title", ctx.fillStyle);
          this.drawLetterSpacedText(ctx, run.text, cursorX, cursorY, letterSpacing);
          cursorX += segmentWidth;
        });
      });
    });
    ctx.restore();
  }

  getCanvasFontFamilyForModule(module) {
    return CONTENT_FONT_STACK;
  }

  createTextGradient(ctx, x, y, width) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    const stops = this.getTitleGradientStops();
    const last = Math.max(1, stops.length - 1);
    stops.forEach((color, index) => {
      gradient.addColorStop(index / last, color);
    });
    return gradient;
  }

  strokeCoverText(ctx, text, x, y, width, spacing, kind, fillStyle) {
    const mode = this.config[`${kind}_outline_mode`] || "off";
    if (mode === "off" || !text) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, Math.min(12, Number(this.config[`${kind}_outline_width`]) || 2)) * 2;
    ctx.strokeStyle = mode === "gradient" ? this.createTextGradient(ctx, x, y, Math.max(1, width))
      : mode === "custom" ? this.config[`${kind}_outline_color`]
      : fillStyle;
    if (!spacing) {
      ctx.strokeText(text, x, y);
    } else {
      let cursor = x;
      Array.from(text).forEach((char) => {
        ctx.strokeText(char, cursor, y);
        cursor += ctx.measureText(char).width + spacing;
      });
    }
    ctx.restore();
  }

  createDetailTitleGradient(ctx, x, y, width) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    const stops = this.getDetailTitleGradientStops();
    const last = Math.max(1, stops.length - 1);
    stops.forEach((color, index) => {
      gradient.addColorStop(index / last, color);
    });
    return gradient;
  }

  wrapPlainTextForCanvas(ctx, text, maxWidth, letterSpacing = 0) {
    const wrapped = [];
    this.toText(text).split(/\r?\n/).forEach((line) => {
      const segments = this.wrapSegmentTokensForCanvas(
        ctx,
        [{ text: line, highlight: false }],
        maxWidth,
        letterSpacing
      );
      wrapped.push(...segments.map((items) => items.map((item) => item.text).join("")));
    });
    return wrapped.length ? wrapped : [""];
  }

  wrapKeepAllTextForCanvas(ctx, text, maxWidth, letterSpacing = 0) {
    const wrapped = [];
    this.toText(text).split(/\r?\n/).forEach((line) => {
      const tokens = this.tokenizeCanvasKeepAllText(line);
      let current = "";
      tokens.forEach((token) => {
        if (!token.text) return;
        if (!current && token.kind === "space") return;
        const test = current + token.text;
        if (current && this.measureTextWithSpacing(ctx, test.trimEnd(), letterSpacing) > maxWidth) {
          wrapped.push(current.trimEnd());
          current = token.kind === "space" ? "" : token.text.replace(/^\s+/g, "");
          return;
        }
        current = test;
      });
      wrapped.push(current.trim());
    });
    return wrapped.length ? wrapped : [""];
  }

  tokenizeCanvasKeepAllText(text) {
    const tokens = [];
    let buffer = "";
    let kind = "";
    const flush = () => {
      if (buffer) tokens.push({ text: buffer, kind });
      buffer = "";
      kind = "";
    };
    Array.from(this.toText(text)).forEach((char) => {
      const nextKind = /\s/.test(char) ? "space" : "word";
      if (kind && kind !== nextKind) flush();
      buffer += char;
      kind = nextKind;
    });
    flush();
    return tokens;
  }

  wrapHighlightedSegmentsForCanvas(ctx, explicitLines, maxWidth, letterSpacing = 0, module = null, fontSize = 0) {
    const wrapped = [];
    explicitLines.forEach((segments) => {
      wrapped.push(...this.wrapSegmentTokensForCanvas(ctx, segments, maxWidth, letterSpacing, module, fontSize));
    });
    return wrapped.length ? wrapped : [[{ text: "", highlight: false }]];
  }

  wrapSegmentTokensForCanvas(ctx, segments, maxWidth, letterSpacing = 0, module = null, fontSize = 0) {
    const tokens = [];
    (segments || []).forEach((segment) => {
      this.tokenizeCanvasWrapText(segment && segment.text).forEach((token) => {
        tokens.push(Object.assign({}, token, { highlight: Boolean(segment && segment.highlight) }));
      });
    });
    if (!tokens.length) return [[{ text: "", highlight: false }]];

    const lines = [];
    let current = [];
    const pushToken = (token) => {
      if (!token || !token.text) return;
      const last = current[current.length - 1];
      if (last && last.highlight === token.highlight) {
        last.text += token.text;
      } else {
        current.push({ text: token.text, highlight: token.highlight });
      }
    };
    const pushLine = () => {
      current = this.trimCanvasWrapSegments(current);
      lines.push(this.mergeAdjacentSegments(current.length ? current : [{ text: "", highlight: false }]));
      current = [];
    };

    tokens.forEach((token) => {
      if (!token.text) return;
      if (!current.length && token.kind === "space") return;
      const testLine = this.trimCanvasWrapSegments([...current, { text: token.text, highlight: token.highlight }], false);
      const testWidth = this.measureCanvasWrapSegments(ctx, testLine, letterSpacing, module, fontSize);
      if (current.length && testWidth > maxWidth) {
        pushLine();
        if (token.kind === "space") return;
      }
      if (!current.length && this.measureCanvasWrapToken(ctx, token, letterSpacing, module, fontSize) > maxWidth) {
        this.splitOversizeTokenForCanvas(ctx, token, maxWidth, letterSpacing, module, fontSize).forEach((part) => {
          const nextLine = [...current, { text: part.text, highlight: part.highlight }];
          if (current.length && this.measureCanvasWrapSegments(ctx, nextLine, letterSpacing, module, fontSize) > maxWidth) {
            pushLine();
          }
          pushToken(part);
        });
        return;
      }
      pushToken(token);
    });
    pushLine();
    return lines;
  }

  tokenizeCanvasWrapText(text) {
    const tokens = [];
    let buffer = "";
    let kind = "";
    const flush = () => {
      if (buffer) tokens.push({ text: buffer, kind });
      buffer = "";
      kind = "";
    };
    Array.from(this.toText(text)).forEach((char) => {
      let nextKind = "cjk";
      if (/\s/.test(char)) nextKind = "space";
      else if (/[A-Za-z0-9_./:@-]/.test(char)) nextKind = "latin";
      if (nextKind === "cjk") {
        flush();
        tokens.push({ text: char, kind: "cjk" });
        return;
      }
      if (kind && kind !== nextKind) flush();
      buffer += char;
      kind = nextKind;
    });
    flush();
    return tokens;
  }

  trimCanvasWrapSegments(segments, trimStart = true) {
    const output = (segments || [])
      .map((segment) => ({ text: this.toText(segment && segment.text), highlight: Boolean(segment && segment.highlight) }))
      .filter((segment) => segment.text);
    if (!output.length) return [];
    output[output.length - 1].text = output[output.length - 1].text.replace(/\s+$/g, "");
    if (trimStart && output[0]) output[0].text = output[0].text.replace(/^\s+/g, "");
    return output.filter((segment) => segment.text);
  }

  measureCanvasWrapSegments(ctx, segments, letterSpacing = 0, module = null, fontSize = 0) {
    if (module && fontSize) {
      return this.measureHighlightedTitleLine(ctx, module, segments, fontSize, letterSpacing);
    }
    return this.measureTextWithSpacing(ctx, segments.map((segment) => segment.text).join(""), letterSpacing);
  }

  measureCanvasWrapToken(ctx, token, letterSpacing = 0, module = null, fontSize = 0) {
    return this.measureCanvasWrapSegments(
      ctx,
      [{ text: this.toText(token && token.text), highlight: Boolean(token && token.highlight) }],
      letterSpacing,
      module,
      fontSize
    );
  }

  splitOversizeTokenForCanvas(ctx, token, maxWidth, letterSpacing = 0, module = null, fontSize = 0) {
    const parts = [];
    let current = "";
    Array.from(this.toText(token && token.text)).forEach((char) => {
      const test = current + char;
      const testWidth = this.measureCanvasWrapToken(
        ctx,
        { text: test, highlight: Boolean(token && token.highlight) },
        letterSpacing,
        module,
        fontSize
      );
      if (current && testWidth > maxWidth) {
        parts.push({ text: current, highlight: Boolean(token && token.highlight), kind: token.kind });
        current = char;
      } else {
        current = test;
      }
    });
    if (current) parts.push({ text: current, highlight: Boolean(token && token.highlight), kind: token && token.kind });
    return parts.length ? parts : [{ text: "", highlight: Boolean(token && token.highlight), kind: token && token.kind }];
  }

  mergeAdjacentSegments(segments) {
    const merged = [];
    segments.forEach((segment) => {
      if (!segment || segment.text == null) return;
      const last = merged[merged.length - 1];
      if (last && last.highlight === segment.highlight) {
        last.text += segment.text;
      } else {
        merged.push({ text: segment.text, highlight: Boolean(segment.highlight) });
      }
    });
    return merged.length ? merged : [{ text: "", highlight: false }];
  }

  splitTitleSegmentByArtScript(segment) {
    const text = this.toText(segment && segment.text);
    if (!text) return [{ text: "", script: "" }];
    const output = [];
    let currentScript = "";
    let currentText = "";
    Array.from(text).forEach((char) => {
      const charScript = this.getTitleArtScriptForChar(char);
      const script = charScript || currentScript || "";
      if (currentText && script !== currentScript && charScript) {
        output.push({ text: currentText, script: currentScript });
        currentText = char;
        currentScript = script;
      } else {
        currentText += char;
        currentScript = currentScript || script;
      }
    });
    if (currentText) output.push({ text: currentText, script: currentScript });
    return output.length ? output : [{ text, script: "" }];
  }

  getTitleArtScriptForChar(char) {
    if (/[\u3400-\u9fff\uf900-\ufaff]/u.test(char)) return "cn";
    if (/[A-Za-z0-9]/.test(char)) return "en";
    return "";
  }

  getTitleArtStyleForScript(script) {
    if (script === "cn") return null;
    const key = script === "en" ? "title_art_font_en" : script === "cn" ? "title_art_font_cn" : "";
    const presets = TITLE_ART_FONT_PRESETS[script] || [];
    const preset = presets.find((item) => item.id === this.config[key]);
    if (!preset || preset.id === "none") return null;
    return preset;
  }

  getTitleCanvasFont(module, fontSize, script) {
    const artStyle = this.getTitleArtStyleForScript(script);
    const style = artStyle && artStyle.fontStyle && artStyle.fontStyle !== "normal" ? `${artStyle.fontStyle} ` : "";
    const weight = artStyle && artStyle.fontWeight ? artStyle.fontWeight : (module.fontWeight || 800);
    const family = artStyle && artStyle.canvasFontFamily ? artStyle.canvasFontFamily : this.getCanvasFontFamilyForModule(module);
    return `${style}${weight} ${fontSize}px ${family}`;
  }

  measureHighlightedTitleLine(ctx, module, segments, fontSize, letterSpacing) {
    return segments.reduce((sum, segment) => {
      return sum + this.splitTitleSegmentByArtScript(segment).reduce((runSum, run) => {
        ctx.font = this.getTitleCanvasFont(module, fontSize, run.script);
        return runSum + this.measureTextWithSpacing(ctx, run.text, letterSpacing);
      }, 0);
    }, 0);
  }

  getAlignedTextX(module, padding, textWidth) {
    const align = module.textAlign || "left";
    const left = module.x + padding.x;
    const contentWidth = Math.max(0, module.w - padding.x * 2);
    if (align === "center") return left + Math.max(0, (contentWidth - textWidth) / 2);
    if (align === "right") return left + Math.max(0, contentWidth - textWidth);
    return left;
  }

  drawChipTextModule(ctx, module) {
    const lines = this.toText(module.text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const fontSize = module.fontSize || 34;
    ctx.font = `${module.fontWeight || 900} ${fontSize}px ${this.getCanvasFontFamilyForModule(module)}`;
    ctx.textBaseline = "top";
    let x = module.x;
    let y = module.y;
    lines.forEach((line) => {
      const w = Math.min(module.w, ctx.measureText(line).width + 34);
      ctx.strokeStyle = "rgba(232,244,255,0.95)";
      ctx.lineWidth = 4;
      this.roundRectPath(ctx, x, y, w, fontSize + 22, 0);
      ctx.stroke();
      ctx.fillStyle = module.color || "#ffffff";
      ctx.fillText(line, x + 16, y + 10);
      x += w + 16;
      if (x + 130 > module.x + module.w) {
        x = module.x;
        y += fontSize + 34;
      }
    });
  }

  async drawImageModule(ctx, module, images) {
    const src = module.src
      ? await this.resolveImage(module.src)
      : (module.template === "composition" ? "" : (module.role === "main" ? images.main : ""));
    if (!src) return;
    const image = await this.loadImage(src);
    ctx.save();
    const className = module.className || "";
    const radius = module.borderRadius || 0;
    const rotation = (Number.parseFloat(module.rotation) || 0) * Math.PI / 180;
    const cx = module.x + module.w / 2;
    const cy = module.y + module.h / 2;
    ctx.translate(cx, cy);
    if (rotation) ctx.rotate(rotation);
    const matrix = this.getImage3dMatrix(module);
    if (matrix) ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
    const rawLogo = this.shouldRenderRawLogoImage(module, module.src || "", src, image);
    if (rawLogo) {
      this.drawObjectFitImage(ctx, image, -module.w / 2, -module.h / 2, module.w, module.h, module.objectFit || "contain");
      ctx.restore();
      return;
    }
    if (className.includes("xhs-module-clean-image") || className.includes("xhs-module-huawei-image")) {
      const glowOne = ctx.createRadialGradient(module.w * 0.08, -module.h * 0.2, 8, module.w * 0.08, -module.h * 0.2, module.w * 0.72);
      glowOne.addColorStop(0, this.hexToRgba(this.getActiveGradientFrom(), className.includes("xhs-module-huawei-image") ? 0.11 : 0.08));
      glowOne.addColorStop(1, this.hexToRgba(this.getActiveGradientFrom(), 0));
      ctx.fillStyle = glowOne;
      ctx.fillRect(-module.w * 0.64, -module.h * 0.64, module.w * 1.28, module.h * 1.28);
      const glowTwo = ctx.createRadialGradient(-module.w * 0.28, module.h * 0.42, 8, -module.w * 0.28, module.h * 0.42, module.w * 0.70);
      glowTwo.addColorStop(0, this.hexToRgba(this.getActiveGradientTo(), className.includes("xhs-module-huawei-image") ? 0.12 : 0.07));
      glowTwo.addColorStop(1, this.hexToRgba(this.getActiveGradientTo(), 0));
      ctx.fillStyle = glowTwo;
      ctx.fillRect(-module.w * 0.64, -module.h * 0.64, module.w * 1.28, module.h * 1.28);
      ctx.shadowColor = "rgba(29,29,31,0.18)";
      ctx.shadowBlur = 42;
      ctx.shadowOffsetY = 24;
    } else if (className.includes("xhs-module-ai-main") || className.includes("xhs-module-custom-image")) {
      ctx.shadowColor = "rgba(0,0,0,0.42)";
      ctx.shadowBlur = 34;
      ctx.shadowOffsetY = 22;
    } else if (className.includes("xhs-module-google-image")) {
      ctx.shadowColor = "rgba(60,64,67,0.16)";
      ctx.shadowBlur = 34;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = "#ffffff";
      this.roundRectPath(ctx, -module.w / 2, -module.h / 2, module.w, module.h, radius);
      ctx.fill();
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    if (radius || module.template === "composition") {
      ctx.save();
      this.roundRectPath(ctx, -module.w / 2, -module.h / 2, module.w, module.h, radius);
      ctx.clip();
      this.drawObjectFitImage(ctx, image, -module.w / 2, -module.h / 2, module.w, module.h, module.objectFit || "contain");
      ctx.restore();
    } else {
      this.drawObjectFitImage(ctx, image, -module.w / 2, -module.h / 2, module.w, module.h, module.objectFit || "contain");
    }
    if (className.includes("xhs-module-clean-image") || className.includes("xhs-module-huawei-image")) {
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.save();
      this.roundRectPath(ctx, -module.w / 2, -module.h / 2, module.w, module.h, radius);
      ctx.clip();
      const wash = ctx.createLinearGradient(0, -module.h / 2, 0, module.h / 2);
      wash.addColorStop(0, "rgba(255,255,255,0.10)");
      wash.addColorStop(0.38, "rgba(255,255,255,0)");
      wash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(-module.w / 2, -module.h / 2, module.w, module.h);
      ctx.restore();
    }
    if (className.includes("xhs-module-google-image")) {
      ctx.strokeStyle = "rgba(218,220,224,0.86)";
      ctx.lineWidth = 1;
      this.roundRectPath(ctx, -module.w / 2 + 0.5, -module.h / 2 + 0.5, Math.max(1, module.w - 1), Math.max(1, module.h - 1), radius);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawObjectFitImage(ctx, image, x, y, w, h, fit) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (!iw || !ih) return;
    const scale = fit === "cover" ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  drawLetterSpacedText(ctx, text, x, y, spacing) {
    if (!spacing) {
      ctx.fillText(text, x, y);
      return;
    }
    let cursor = x;
    Array.from(text).forEach((char) => {
      ctx.fillText(char, cursor, y);
      cursor += ctx.measureText(char).width + spacing;
    });
  }

  getCompositionFittedFontSize(module) {
    if(module?.coverTextRole)return module.fontSize;
    if(module?.swissCover)return module.fontSize;
    const original = Number(module?.fontSize) || 32;
    if (module?.template !== "composition" || module.type !== "text") return original;
    if (module.manualFontSize && !this.shouldPreserveManualTextLines(module)) return original;
    const preferred = Math.max(12, original);
    const content = this.toText(module.text);
    if (!content) return preferred;
    const padding = this.getModulePadding(module);
    const availableWidth = Math.max(1, Number(module.w) - padding.x * 2 - 20);
    const availableHeight = Math.max(1, Number(module.h) - padding.y * 2 - 16);
    const context = this.getCenteredLabelMeasureContext() || {
      measureText: (value) => ({ width: Array.from(value).reduce((sum, char) =>
        sum + (/[^\u0000-\u007f]/.test(char) ? 1 : /\s/.test(char) ? 0.35 : 0.6) * candidate, 0) })
    };
    let candidate = Math.floor(preferred);
    for (; candidate >= 12; candidate -= 1) {
      context.font = `${module.fontWeight || 600} ${candidate}px ${this.getCanvasFontFamilyForModule(module)}`;
      const lines = this.shouldPreserveManualTextLines(module) ? content.split(/\r?\n/)
        : this.wrapPlainTextForCanvas(context, content, availableWidth, Number(module.letterSpacing) || 0);
      const height = lines.length * candidate * (Number(module.lineHeight) || 1.12);
      if (height <= availableHeight && lines.every((line) =>
        this.measureTextWithSpacing(context, line, Number(module.letterSpacing) || 0) <= availableWidth)) {
        return candidate;
      }
    }
    return 12;
  }

  getModulePadding(module) {
    if(module?.coverTextRole){const inset=this.getCoverTextFramePadding(module);return {x:inset,y:inset};}
    if ((module.className || "").includes("xhs-module-composition-photo-label")) return { x: 18, y: 12 };
    if (module.className === "xhs-module-footer") return { x: 72, y: 0 };
    if (module.className === "xhs-module-cta") return { x: 18, y: 0 };
    if (module.className === "xhs-module-label-badge") return { x: 18, y: 0 };
    if (module.className === "xhs-module-google-subtitle") return { x: 56, y: 22 };
    if ((module.className || "").includes("xhs-module-layout-pill")) return { x: 24, y: 0 };
    if ((module.className || "").includes("xhs-module-layout-cta")) return { x: 28, y: 14 };
    if ((module.className || "").includes("xhs-module-layout-badge")) return { x: 18, y: 10 };
    if (this.isCenteredLabelModule(module)) return this.getCenteredLabelPadding(module);
    return { x: 0, y: 0 };
  }

  getCenteredLabelPadding(module) {
    if ((module.className || "").includes("xhs-module-layout-pill")) return { x: 24, y: 0 };
    const fontSize = Math.max(1, Number(module.fontSize) || 32);
    return {
      x: Math.max(18, Math.round(fontSize * 0.34)),
      y: Math.max(8, Math.round(fontSize * 0.18))
    };
  }

  getCenteredLabelBorderWidth(module) {
    if (this.isPillLabelModule(module)) return Math.max(1, Number(module.borderWidth) || 2);
    if (module && /\bxhs-module-label-outline\b/.test(module.className || "")) return Math.max(1, Number(module.borderWidth) || 4);
    return 0;
  }

  getPillLabelRadius(module, borderWidth = this.getCenteredLabelBorderWidth(module)) {
    const width = Math.max(1, Number(module && module.w) || 1) - borderWidth;
    const height = Math.max(1, Number(module && module.h) || 1) - borderWidth;
    return Math.max(0, Math.min(width, height) / 2);
  }

  getCenteredLabelLines(module) {
    const lines = this.toText(module && module.text).split(/\r?\n/);
    if (!this.isCoverSubtitleModule(module)) return lines.length ? lines : [""];
    const ctx = this.getCenteredLabelMeasureContext();
    if (!ctx) return lines.length ? lines : [""];
    const fontSize = Math.max(1, Number(module.fontSize) || 32);
    const padding = this.getCenteredLabelPadding(module);
    const borderWidth = this.getCenteredLabelBorderWidth(module);
    const maxWidth = Math.max(1, (Number(module.w) || 1) - (padding.x + borderWidth) * 2);
    ctx.font = `${module.fontWeight || 900} ${fontSize}px ${this.getCanvasFontFamilyForModule(module)}`;
    const wrapped = lines.flatMap((line) => this.wrapPlainTextForCanvas(ctx, line, maxWidth, Number(module.letterSpacing) || 0));
    return wrapped.length ? wrapped : [""];
  }

  getCenteredLabelMeasureContext() {
    if (!this.centeredLabelMeasureCanvas && typeof document !== "undefined") {
      this.centeredLabelMeasureCanvas = document.createElement("canvas");
    }
    return this.centeredLabelMeasureCanvas ? this.centeredLabelMeasureCanvas.getContext("2d") : null;
  }

  measureCenteredLabelLine(module, line) {
    const fontSize = Math.max(1, Number(module.fontSize) || 32);
    const ctx = this.getCenteredLabelMeasureContext();
    if (!ctx) return Array.from(this.toText(line)).length * fontSize * 0.62;
    ctx.font = `${module.fontWeight || 900} ${fontSize}px ${this.getCanvasFontFamilyForModule(module)}`;
    return this.measureTextWithSpacing(ctx, this.toText(line), Number(module.letterSpacing) || 0);
  }

  getCenteredLabelMinSize(module) {
    if (!this.isCenteredLabelModule(module)) return { w: 12, h: 12 };
    const padding = this.getCenteredLabelPadding(module);
    const borderWidth = this.getCenteredLabelBorderWidth(module);
    const fontSize = Math.max(1, Number(module.fontSize) || 32);
    const lineHeight = fontSize * (Number(module.lineHeight) || 1.1);
    const lines = this.getCenteredLabelLines(module);
    const textWidth = Math.max(...lines.map((line) => this.measureCenteredLabelLine(module, line)), 0);
    return {
      w: Math.ceil(textWidth + padding.x * 2 + borderWidth * 2),
      h: Math.ceil(lines.length * lineHeight + padding.y * 2 + borderWidth * 2)
    };
  }

  ensureCenteredLabelModuleSize(module) {
    if(module?.coverTextRole)return;
    if (!this.isCenteredLabelModule(module)) return;
    const minSize = this.getCenteredLabelMinSize(module);
    module.w = Math.max(Number(module.w) || 0, minSize.w);
    if ((module.className || "").includes("xhs-module-layout-pill")) {
      module.h = Math.max(Number(module.h) || 0, minSize.h);
    } else {
      module.h = minSize.h;
    }
    module.textAlign = "center";
    if (this.isPillLabelModule(module)) module.borderRadius = 999;
  }

  fitTextModuleFrameToContent(module) {
    if(module?.coverTextRole){module.h=this.measureCoverTextFrame(module).height;return;}
    if (!module || module.type !== "text" || this.isCenteredLabelModule(module)) return;
    if (!this.canAutoFitTextModule(module) && !this.isCoverSafeTextModule(module)) return;
    if (!this.shouldFitTextModuleFrame(module)) return;
    const fontSize = Math.max(1, Number(module.fontSize) || 32);
    const lineHeight = fontSize * (Number(module.lineHeight) || 1.1);
    const padding = this.getModulePadding(module);
    const borderWidth = module.className === "xhs-module-google-subtitle" ? 1 : 0;
    const measureWidth = Math.max(1, Number(module.w) - padding.x * 2 - borderWidth * 2);
    const lines = this.measureTextModuleLines(module, measureWidth);
    if (this.shouldFitTextModuleWidth(module)) {
      const ctx = this.getCenteredLabelMeasureContext();
      if (ctx) {
        ctx.font = `${module.fontWeight || 900} ${fontSize}px ${this.getCanvasFontFamilyForModule(module)}`;
        const letterSpacing = Number(module.letterSpacing) || 0;
        const contentWidth = Math.max(...lines.map((line) => this.measureTextWithSpacing(ctx, line, letterSpacing)), 1);
        module.w = Math.max(1, Math.ceil(contentWidth + padding.x * 2 + borderWidth * 2));
      }
    }
    module.h = Math.max(1, Math.ceil(lines.length * lineHeight + padding.y * 2 + borderWidth * 2));
  }

  fitTextModuleHeightToContent(module) {
    this.fitTextModuleFrameToContent(module);
  }

  shouldFitTextModuleFrame(module) {
    return this.isCoverTitleModule(module)
      || this.isCoverSubtitleModule(module)
      || this.isNeonTagTextModule(module)
      || this.isNeonArrowTextModule(module);
  }

  shouldFitTextModuleWidth(module) {
    return this.isNeonTagTextModule(module)
      || this.isNeonArrowTextModule(module);
  }

  isAutoFitLabelModule(module) {
    if (!module || module.type !== "text") return false;
    return /\bxhs-module-label-badge\b/.test(module.className || "");
  }

  measureTextModuleLines(module, width) {
    const ctx = this.getCenteredLabelMeasureContext();
    if (!ctx) return this.toText(module.text).split(/\r?\n/);
    const fontSize = Math.max(1, Number(module.fontSize) || 32);
    ctx.font = `${module.fontWeight || 900} ${fontSize}px ${this.getCanvasFontFamilyForModule(module)}`;
    if (this.shouldPreserveManualTextLines(module)) {
      return this.toText(module.text).split(/\r?\n/);
    }
    if (module.className === "xhs-module-neon-title") {
      return this.wrapKeepAllTextForCanvas(ctx, this.toText(module.text), width, module.letterSpacing || 0);
    }
    if (this.isCoverTitleModule(module)) {
      return this.wrapHighlightedSegmentsForCanvas(
        ctx,
        this.parseHighlightedTitleSegments(module.text || ""),
        width,
        module.letterSpacing || 0,
        module,
        fontSize
      ).map((segments) => segments.map((segment) => segment.text).join(""));
    }
    return this.wrapPlainTextForCanvas(ctx, this.toText(module.text), width, module.letterSpacing || 0);
  }

  getCanvasTextLinesForModule(ctx, module, width, letterSpacing = 0) {
    if (this.shouldPreserveManualTextLines(module)) {
      return this.toText(module.text).split(/\r?\n/);
    }
    if (module.className === "xhs-module-neon-title") {
      return this.wrapKeepAllTextForCanvas(ctx, this.toText(module.text), width, letterSpacing);
    }
    return this.wrapPlainTextForCanvas(ctx, this.toText(module.text), width, letterSpacing);
  }

  isNeonTagTextModule(module) {
    return module?.template === "neon-grid" && (module.id === "tags" || module.id === "small-title");
  }

  isNeonArrowTextModule(module) {
    return module?.template === "neon-grid" && module.type === "text" && /\bxhs-module-arrow-text\b/.test(module.className || "");
  }

  shouldKeepTextModuleSingleLine(module) {
    if (!module || module.type !== "text") return false;
    const className = module.className || "";
    return /\bxhs-module-(label-badge|arrow-text|cta|footer)\b/.test(className);
  }

  shouldPreserveManualTextLines(module) {
    if(this.config.cover_visual_version===2 && module?.type==="text")return false;
    if(module?.swissCover && module.type==="text")return true;
    if (!module || module.type !== "text") return false;
    if (module.template === "composition") return module.id === "composition-title" && /\r?\n/.test(module.text || "");
    if (this.isCoverSafeTextModule(module)) return false;
    const className = module.className || "";
    if (module.template && module.template !== "") return true;
    return /\bxhs-module-(neon-title|label-badge|arrow-text|cta|footer|clean-title|clean-subtitle|huawei-title|huawei-subtitle|instagram-title|instagram-subtitle|google-title|google-subtitle|cover-layout-subtitle)\b/.test(className);
  }

  isCanvasOverflowVisibleTextModule(module) {
    if (!module || module.type !== "text") return false;
    if (module.className === "xhs-module-neon-title") return true;
    return this.isNeonTagTextModule(module);
  }

  resolveModuleFill(value) {
    const text = this.toText(value).trim();
    if (!text) return "rgba(0,0,0,0)";
    if (text === "var(--xhs-accent)") return this.config.accent_color;
    if (text === "var(--xhs-secondary)") return this.config.secondary_color;
    if (text === "var(--xhs-text)") return this.config.text_color;
    if (text.includes("linear-gradient")) return this.config.accent_color;
    if (text.includes("radial-gradient")) return this.config.accent_color;
    return text;
  }

  resolveCssModuleColor(value) {
    const text = this.toText(value).trim();
    if (!text) return this.config.accent_color || "#0071e3";
    if (text === "var(--xhs-accent)") return this.config.accent_color;
    if (text === "var(--xhs-secondary)") return this.config.secondary_color;
    if (text === "var(--xhs-text)") return this.config.text_color;
    if (text.includes("gradient")) return this.config.accent_color || "#0071e3";
    return text;
  }

  getModuleGlowColor(module) {
    const resolved = this.resolveModuleFill(module && module.background ? module.background : this.config.accent_color);
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(resolved)) return resolved;
    return this.config.accent_color;
  }

  roundRectPath(ctx, x, y, w, h, radius) {
    const r = Math.max(0, Math.min(radius || 0, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  waitForImages(node) {
    const images = Array.from(node.querySelectorAll("img"));
    return Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = window.setTimeout(() => reject(new Error("导出图片渲染超时")), 12000);
      image.onload = () => {
        window.clearTimeout(timer);
        resolve(image);
      };
      image.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("导出图片渲染失败"));
      };
      image.src = url;
    });
  }

  async pickLocalExportDirectory() {
    if (!window.showDirectoryPicker) return null;
    try {
      return await window.showDirectoryPicker({ mode: "readwrite" });
    } catch (error) {
      if (error && error.name === "AbortError") {
        new Notice("已取消导出");
        return false;
      }
      throw error;
    }
  }

  async saveExportBlob(blob, fileName, directoryHandle = null, useSavePicker = false) {
    const safeName = this.makeFileName(fileName || "xhs-card.png");
    if (directoryHandle) {
      const handle = await directoryHandle.getFileHandle(safeName, { create: true });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return safeName;
    }

    if (useSavePicker && window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: safeName,
          types: [
            {
              description: "PNG 图片",
              accept: { "image/png": [".png"] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return handle.name || safeName;
      } catch (error) {
        if (error && error.name === "AbortError") {
          new Notice("已取消导出");
          return "";
        }
        throw error;
      }
    }

    this.downloadBlob(blob, safeName);
    return `本地下载目录/${safeName}`;
  }

  downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1000);
  }

  makeFileName(name) {
    const extension = /\.png$/i.test(name) ? ".png" : "";
    const base = extension ? name.slice(0, -extension.length) : name;
    let stem = base.replace(/\s+/g, " ").replace(/[\\/:*?"<>|\x00-\x1f]/g, "-").trim().replace(/[. ]+$/g, "");
    if (!stem) stem = "xhs-card";
    if (/^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)/i.test(stem)) stem = "_" + stem;
    return Array.from(stem).slice(0, 96 - extension.length).join("").replace(/[. ]+$/g, "") + extension;
  }

  delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}

class XHSCardStudioSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "XHS Card Studio" });

    new Setting(containerEl)
      .setName("图片素材目录")
      .setDesc("上传图片会保存到这个 vault 目录。")
      .addText((text) => text
        .setValue(this.plugin.settings.assetFolder)
        .onChange(async (value) => {
          this.plugin.settings.assetFolder = value.trim() || DEFAULT_SETTINGS.assetFolder;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("导出倍率")
      .setDesc("默认 3 倍：1080×1440 会导出为 3240×4320。")
      .addSlider((slider) => slider
        .setLimits(1, 6, 1)
        .setValue(this.plugin.settings.exportScale)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.exportScale = value;
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = XHSCardStudioPlugin;
