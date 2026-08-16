export function isFinishSpeechIntent(text: string): boolean {
  const normalized = text.replace(/[，。！？、,.!?\s]/g, "");
  if (!normalized || normalized.length > 48) return false;
  if (/(过|过了|过麦|结束发言|结束了|下一轮了?|进入下一轮|天黑了?|天黑请闭眼)$/.test(normalized)) {
    return true;
  }
  if (/(但是|不过|可是|怀疑|觉得|认为|因为|所以|投票|站边)/.test(normalized)) {
    return false;
  }
  return /(没|没有|暂无)(什么|啥)?(信息|补充|要说的)/.test(normalized);
}
