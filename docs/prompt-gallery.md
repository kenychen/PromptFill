# 內建 Prompt Gallery（模板/詞庫）維護指南

本文件說明如何把「自訂的 Prompt Gallery」（你在網站內新增/修改的模板與詞庫）提升為**網站內建（System/Official）**版本，以及之後如何更新與讓使用者同步。

---

## 1. 名詞與資料來源

在 Prompt Fill 裡，「Prompt Gallery」對應到「發現頁（Discovery）」所展示的**模板（Templates）**，並搭配全域共享的**詞庫（Word Banks）**與**預設值（Defaults）**。

資料分兩層：

- **內建（System）資料**
  - 模板：`src/data/templates.js` 的 `INITIAL_TEMPLATES_CONFIG`
  - 詞庫/預設/分類：`src/data/banks.js` 的 `INITIAL_BANKS` / `INITIAL_DEFAULTS` / `INITIAL_CATEGORIES`
  - 資料版本：`src/data/templates.js` 的 `SYSTEM_DATA_VERSION`
- **使用者（Custom）資料**
  - 預設使用瀏覽器 `LocalStorage`（狀態 key 以 `app_` 開頭）
  - 也可切到「本機資料夾」模式，會自動讀寫：`prompt_fill_data.json`（檔名固定）

---

## 2. 如何把自訂 Gallery 變成「內建」

### Step A：把自訂資料匯出成檔案

你有兩種來源可拿到自訂 Gallery 的原始資料：

1. **在網站操作匯出**
   - 進入設定/資料管理，使用「匯出全部」產生備份檔（`prompt_fill_backup_*.json`）
2. **如果你用本機資料夾模式**
   - 直接打開資料夾裡的 `prompt_fill_data.json`

兩種檔案結構都包含（或接近包含）：
- `templates`：模板清單
- `banks`：詞庫 map（key 對應 `{{variable}}`）
- `categories`：分類（通常不需要提升為內建）
- `defaults`：每個 variable 的預設值（有時會在 `prompt_fill_data.json` 內）

### Step B：把內容整理成「內建格式」

#### 1) 模板（Templates）

將你要內建的模板加入 `src/data/templates.js` 的 `INITIAL_TEMPLATES_CONFIG`。

模板欄位重點：
- `id`：必須唯一，建議以 `tpl_` 開頭，且**發佈後盡量不要更改**（更新/合併高度依賴 id）。
- `name`：可用字串或雙語物件 `{ 'zh-tw': string, en: string }`。
- `content`：可用字串或雙語物件；支援 `{{variable}}` 與簡單 Markdown（如 `###`、清單）。
- `imageUrl` / `imageUrls`：封面圖（建議放 `public/`，用 `/...` 相對路徑避免外連失效）。
- `tags`：需從 `TEMPLATE_TAGS` 取用；必要時先擴充 `TEMPLATE_TAGS`。
- `language`：`'zh-tw' | 'en' | ['zh-tw','en']`，用來控制模板內容語言切換。
- `selections`：可選；用來為模板預填特定選項。
  - 同一個變數在模板內出現多次時，會用 `variable-0`、`variable-1`… 存放。
  - 因此預填可以用 `grid_pose-0`、`grid_pose-1` 這種 key。

#### 2) 詞庫（Banks）與預設值（Defaults）

只要模板內容出現 `{{variable}}`，就應該在 `src/data/banks.js` 補齊：
- `INITIAL_BANKS[variable]`：該變數的選項清單與分類
- `INITIAL_DEFAULTS[variable]`：該變數的預設選項（避免顯示 Undefined）

`INITIAL_BANKS` 的 `options` 可用：
- 純字串（單語）
- 或雙語物件 `{ 'zh-tw': '...', en: '...' }`（推薦）

分類（Categories）通常不建議頻繁改動；目前「取得最新資料」的合併流程**不會合併 categories**，因此若你新增/調整 `INITIAL_CATEGORIES`，既有使用者不一定會自動獲得更新。

---

## 3. 內建 Gallery 如何更新（對使用者會發生什麼事）

內建模板/詞庫的更新是透過「資料版本」驅動：

- `src/data/templates.js`：`SYSTEM_DATA_VERSION`
- `public/version.json`：`dataVersion`

當新版本部署後：
1. App 會比對 `SYSTEM_DATA_VERSION` 與使用者本機記錄的 `app_data_version_v1`。
2. 若使用者曾經有本地資料（不是首次使用），會跳出「發現新內容」提示。
3. 使用者點「立即更新 / 取得最新資料」後會執行合併（`src/utils/merge.js`）：
   - **系統模板**：強制更新為最新；若使用者曾改過同 id 的模板內容，會自動新增「自訂備份」副本保留舊版。
   - **詞庫**：系統詞庫強制更新，但會把「使用者額外新增的選項」合併回去，不會直接覆蓋掉。
   - **模板填空狀態（selections）**：會盡量保留已填過的選擇。
4. 若使用者使用「本機資料夾」模式，合併結果會自動寫回 `prompt_fill_data.json`。

---

## 4. 發佈/更新 Checklist（維護者）

當你更新內建 Gallery（新增/修改模板、詞庫、預設）時，建議照這個順序：

1. 編輯資料
   - `src/data/templates.js`（模板、`SYSTEM_DATA_VERSION`、`TEMPLATE_TAGS`）
   - `src/data/banks.js`（詞庫/預設）
2. 同步更新版本檔
   - `public/version.json` 的 `dataVersion` 必須與 `SYSTEM_DATA_VERSION` 一致
3. 本機驗證
   - `npm run dev`：確認模板可正常渲染、變數都有對應詞庫與預設
   - （可選）先在瀏覽器做一次「匯出全部」備份，然後按「取得最新資料」確認合併結果合理
4. 建置與部署
   - `npm run build`（產生 `dist/`）
   - 部署靜態檔（`dist/` + `public/version.json` 會被打包到輸出）

如果本次也更新了程式本體，請同時維持版本一致：
- `src/App.jsx` 的 `APP_VERSION`
- `package.json` 的 `version`
- `public/version.json` 的 `appVersion`

