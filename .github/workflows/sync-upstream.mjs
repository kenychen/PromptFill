import { Converter } from '@willh/opencc-js';
import { readFile, writeFile } from 'fs/promises';

const FILES = [
  {
    url: 'https://github.com/TanShilongMario/PromptFill/raw/refs/heads/main/src/data/banks.js',
    dest: 'src/data/banks.js'
  },
  {
    url: 'https://github.com/TanShilongMario/PromptFill/raw/refs/heads/main/src/data/templates.js',
    dest: 'src/data/templates.js'
  }
];

async function downloadFile(url, dest) {
  console.log(`下載 ${url} ...`);
  try {
    // 使用 fetch API 下載，默認會 follow redirect
    const response = await fetch(url, {
      redirect: 'follow' // 明確指定跟隨重定向
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();

    // 驗證內容是否為空
    if (!content || content.trim().length === 0) {
      throw new Error(`下載的檔案為空: ${dest}`);
    }

    // 將內容寫入檔案
    await writeFile(dest, content, 'utf8');

    console.log(`✓ 成功下載到 ${dest}`);
    return content;
  } catch (error) {
    console.error(`✗ 下載失敗: ${url}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function processFile(filePath, content) {
  console.log(`處理檔案 ${filePath} ...`);

  // 1. 字串替換: "cn" -> "zh-tw"
  let processedContent = content.replace(/['"]cn['"]/g, '"zh-tw"');

  // 處理 cn: 的情況
  processedContent = processedContent.replace(/cn:/g, '"zh-tw":');

  // 2. 簡繁轉換
  const converter = Converter({ from: 'cn', to: 'tw2' });
  processedContent = converter(processedContent);

  // 寫回檔案
  await writeFile(filePath, processedContent, 'utf8');
  console.log(`✓ 成功處理 ${filePath}`);
}

async function main() {
  console.log('開始同步上游資料檔...\n');

  for (const file of FILES) {
    // 下載檔案
    const content = await downloadFile(file.url, file.dest);

    // 處理檔案
    await processFile(file.dest, content);

    console.log('');
  }

  console.log('所有檔案同步完成！');
}

main().catch(error => {
  console.error('執行失敗:', error);
  process.exit(1);
});
