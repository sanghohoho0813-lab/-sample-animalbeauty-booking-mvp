/** 받침 유무에 맞는 조사 — josa("콩이", "은는") → "콩이는", josa("초콩", "이가") → "초콩이" */
export function josa(word: string, pair: "은는" | "이가" | "을를" | "과와" | "으로로"): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const jong = isHangul ? (last - 0xac00) % 28 : 0;
  const hasBatchim = jong > 0;
  const [withB, without] = pair === "으로로" ? ["으로", "로"] : [pair[0], pair[1]];
  // '로'는 받침이 ㄹ(8)이어도 '로'
  if (pair === "으로로" && jong === 8) return `${word}로`;
  return `${word}${hasBatchim ? withB : without}`;
}
