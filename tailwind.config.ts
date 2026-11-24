import type { Config } from "tailwindcss";

/**
 * 设计基调：温暖的私人收藏图鉴
 *
 * 改造要点（去 slop）：
 * - 灰阶全部暖化，去掉冷灰 + 五色渐变背景的「梦幻」感
 * - white 改为米白 #fffdf9，卡片天然带纸感，不需要玻璃滤镜
 * - 强调色只有一个：砖红。不再有 violet/amber/emerald/rose/indigo 五种并列
 * - 字体分三层：衬线标题、无衬线正文、等宽数字
 */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 米白：替代纯白。卡片 / 面板底色
        white: "#fffdf9",

        // 暖灰阶：带一点黄调，跟米白纸面同族
        gray: {
          50:  "#faf8f4",
          100: "#f3eee5",
          200: "#e7dfd2",
          300: "#d6cbbc",
          400: "#b5aa9a",
          500: "#736a5e",
          600: "#5e554a",
          700: "#463e35",
          800: "#2e2822",
          900: "#1f1b16",
          950: "#14110d",
        },

        // 页面底色
        paper: {
          DEFAULT: "#f7f4ee",
          deep: "#efeae1",
        },

        // 描边
        line: {
          DEFAULT: "#e6ded1",
          strong: "#d5cabb",
        },

        // 墨色文字（正文 / 次要 / 弱）
        ink: {
          DEFAULT: "#1f1b16",
          2: "#5e554a",
          3: "#736a5e",
        },

        // 唯一强调色：砖红
        accent: {
          50:  "#fdf3ec",
          100: "#f6e7dd",
          200: "#ecd0bd",
          300: "#dda886",
          400: "#c67a4d",
          500: "#b1572b",
          600: "#9a3412",
          700: "#7c2d12",
          800: "#62240e",
          900: "#4a1c0c",
        },

        // 历史遗留的 primary，语义上等同 accent，保留以免旧代码失效
        primary: {
          50:  "#fdf3ec",
          100: "#f6e7dd",
          200: "#ecd0bd",
          300: "#dda886",
          400: "#c67a4d",
          500: "#b1572b",
          600: "#9a3412",
          700: "#7c2d12",
          800: "#62240e",
          900: "#4a1c0c",
        },
      },
      fontFamily: {
        // 正文
        sans: [
          "Noto Sans SC",
          "Chiron Sans HK WS",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        // 标题
        serif: [
          "Noto Serif SC",
          "Source Han Serif SC",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        // 数字 / 标签
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        // 收敛成两档：控件 5px、容器 8px
        DEFAULT: "5px",
        md: "5px",
        lg: "6px",
        xl: "8px",
        "2xl": "10px",
        "3xl": "12px",
      },
      boxShadow: {
        // 只有两档，不再有紫光晕
        card: "0 1px 2px rgba(31,27,22,0.06)",
        "card-hover": "0 2px 6px rgba(31,27,22,0.09)",
        pop: "0 8px 28px -8px rgba(31,27,22,0.22)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
