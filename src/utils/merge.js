// 合併策略函數
import { INITIAL_TEMPLATES_CONFIG } from '../data/templates';
import { INITIAL_BANKS, INITIAL_DEFAULTS } from '../data/banks';
import { deepClone, makeUniqueKey } from './helpers';

// 合併系統模板，系統模板強制更新，使用者改動備份
export const mergeTemplatesWithSystem = (currentTemplates, { backupSuffix }) => {
  const systemMap = new Map(INITIAL_TEMPLATES_CONFIG.map(t => [t.id, deepClone(t)]));
  const merged = INITIAL_TEMPLATES_CONFIG.map(t => deepClone(t));
  const notes = [];
  const existingIds = new Set(merged.map(t => t.id));

  currentTemplates.forEach(t => {
    if (systemMap.has(t.id)) {
      const sys = systemMap.get(t.id);
      const isDifferent = t.name !== sys.name || t.content !== sys.content;
      if (isDifferent) {
        const backupId = makeUniqueKey(t.id, existingIds, "user");
        existingIds.add(backupId);
        merged.push({ ...deepClone(t), id: backupId, name: `${t.name}${backupSuffix || ""}` });
        notes.push(`模板 ${t.id} 已更新，舊版備份為 ${backupId}`);
      }
    } else {
      let newId = t.id;
      if (existingIds.has(newId)) {
        newId = makeUniqueKey(newId, existingIds, "custom");
        notes.push(`自訂模板 ${t.id} 與系統衝突，已重新命名為 ${newId}`);
      }
      existingIds.add(newId);
      merged.push({ ...deepClone(t), id: newId });
    }
  });

  return { templates: merged, notes };
};

// 合併系統詞庫與預設值，系統詞庫強制更新，使用者改動備份
export const mergeBanksWithSystem = (currentBanks, currentDefaults, { backupSuffix }) => {
  const mergedBanks = deepClone(INITIAL_BANKS);
  const mergedDefaults = { ...INITIAL_DEFAULTS };
  const notes = [];
  const existingKeys = new Set(Object.keys(mergedBanks));

  Object.entries(currentBanks || {}).forEach(([key, bank]) => {
    if (INITIAL_BANKS[key]) {
      const isDifferent = JSON.stringify(bank) !== JSON.stringify(INITIAL_BANKS[key]);
      if (isDifferent) {
        const backupKey = makeUniqueKey(key, existingKeys, "user");
        existingKeys.add(backupKey);
        mergedBanks[backupKey] = deepClone(bank);
        if (currentDefaults && key in currentDefaults) mergedDefaults[backupKey] = currentDefaults[key];
        notes.push(`詞庫 ${key} 已更新，使用者改動備份為 ${backupKey}`);
      }
    } else {
      let newKey = key;
      if (existingKeys.has(newKey)) {
        newKey = makeUniqueKey(newKey, existingKeys, "custom");
        notes.push(`自訂詞庫 ${key} 與系統衝突，已重新命名為 ${newKey}`);
      }
      existingKeys.add(newKey);
      mergedBanks[newKey] = deepClone(bank);
      if (currentDefaults && key in currentDefaults) mergedDefaults[newKey] = currentDefaults[key];
    }
  });

  Object.entries(currentDefaults || {}).forEach(([key, val]) => {
    if (!(key in mergedDefaults) && mergedBanks[key]) {
      mergedDefaults[key] = val;
    }
  });

  return { banks: mergedBanks, defaults: mergedDefaults, notes };
};
