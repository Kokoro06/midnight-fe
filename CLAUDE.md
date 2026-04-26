# CLAUDE.md — Midnight Moodvie 工作指南

## 專案簡介

**Midnight Moodvie** 是一個心情配電影的互動網站。使用者回答測驗，系統依情緒標籤推薦電影，並提供月份心情日誌與影展資訊。

## 技術棧

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite 5
- **Router**: React Router v6
- **Styling**: CSS Modules（每個頁面獨立 `.css` 檔）
- **CMS / 資料庫**: Directus（headless CMS，管理電影資料與標籤）
- **Data fetching**: @directus/sdk（runtime fetch）

## 專案結構

```
src/
├── App.tsx                  # 路由設定
├── pages/                   # 六個頁面元件
│   ├── Home.tsx / .css
│   ├── Festival.tsx / .css
│   ├── Month.tsx / .css
│   ├── Quiz.tsx / .css
│   ├── Effect.tsx / .css
│   └── Result.tsx / .css
├── components/
│   └── GrainCanvas.tsx      # Canvas 顆粒效果，Home / Quiz / Result 共用
└── data/
    └── movieDB.ts           # 電影資料庫（靜態 TypeScript）
public/
├── img/                     # 海報圖、月份照片
├── 2.1.mp4                  # 首頁背景影片
└── ir.mp4                   # 其他頁面背景影片
```

## 路由對應

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/` | Home | 首頁，影片背景 + 進入按鈕 |
| `/festival` | Festival | 影展月曆 |
| `/month` | Month | 月份心情，無限橫向捲動 |
| `/quiz` | Quiz | 心情測驗 |
| `/effect?mood=` | Effect | 過場動畫 |
| `/result?type=` | Result | 電影推薦結果 |

## 資料模型

### Directus Collections

```
movies
  - id (uuid, PK)
  - title (string)           ← 中文片名
  - original_title (string)  ← 原文片名
  - year (integer)
  - poster (uuid → directus_files)
  - tags (M2M → tags)

tags
  - id (uuid, PK)
  - name (string, unique)    ← 受控詞彙，統一情緒標籤
  - category (string)        ← 情緒 / 類型 / 風格
```

### TypeScript 型別（對應 Directus API 回傳）

```typescript
interface Tag {
  id: string
  name: string
  category: string
}

interface Movie {
  id: string
  title: string
  original_title: string
  year: number
  poster: string             // Directus file UUID，透過 /assets/:id 取得圖片
  tags: Tag[]
}
```

> `src/data/movieDB.ts` 為過渡期靜態備份，Directus 接通後棄用。

## 開發指令

```bash
npm run dev      # 開發伺服器 http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # 預覽 build 結果
```

## 編碼規範

- 元件使用函式式元件 + Hooks，不用 class component
- TypeScript 型別定義放在使用處附近，不建立獨立 `types/` 目錄（現階段）
- DOM 操作一律透過 `useEffect` + `useRef`
- 頁面間導航用 `useNavigate()`，URL 參數用 `useSearchParams()`
- 不加不必要的註解；不寫說明「這段做了什麼」的 comment

## 樣式規則

- 每個頁面的樣式只存在其對應 `.css` 檔，不跨頁面共用
- 現階段不使用 CSS Modules 的 `module.css` 命名，直接 `import './Page.css'`
- 顏色、字體以直接值為主，尚未引入 design token 系統

# Sub-agent orchestration rules

This project uses three sub-agents: `ux-designer`, `frontend-designer`, `qa-engineer`.

## Invocation order (strict)
For any new feature: ux-designer → frontend-designer → qa-engineer.
Never invoke them in parallel. Never invoke two at the same time.

## Why sequential
Parallel sub-agents that both call Edit/Write can deadlock if either edit is rejected
(see claude-code issue #7091). Running them sequentially eliminates the race.

## File ownership
- ux-designer: read-only, no file edits
- frontend-designer: source files only (src/, app/, components/, etc.)
- qa-engineer: test files only (*.test.*, *.spec.*, __tests__/, e2e/)

If a sub-agent needs to edit outside its lane, it must STOP and ask the main agent.

## Handoff protocol
Each sub-agent's final message must contain a structured handoff section
(`## HANDOFF`, `## DONE`, or `## QA REPORT`). The main agent reads that section
and passes it verbatim into the next sub-agent's prompt.

## When to escalate to user
- Any time a sub-agent reports `Q:` open questions
- Any time qa-engineer reports ❌ Failing
- Before running destructive bash commands (rm, git reset, db migrations)