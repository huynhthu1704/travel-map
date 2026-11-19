// Nhận diện nội dung trông giống địa chỉ nhà riêng trước khi đăng công khai (chỉ để cảnh báo, không chặn).
const PATTERNS = [
  // 12 Nguyễn Trãi / 12A/3 đường Lê Lợi / 45 ngõ 12 / hẻm 5
  /(^|\s)(số\s*)?\d{1,5}[a-z]?(\/\d{1,4}[a-z]?)*\s*(,\s*)?(đường|đ\.|phố|ngõ|ngách|hẻm|kiệt|kiet|duong|pho|ngo|hem)\s/i,
  /(^|\s)(ngõ|ngách|hẻm|kiệt|ngo|hem)\s*\d{1,4}/i,
  /số\s*nhà|nhà\s*(mình|tôi|tui|em|anh|chị|bố mẹ|ba mẹ)|địa\s*chỉ\s*nhà|căn\s*hộ\s*\d|phòng\s*\d{2,4}\b|chung\s*cư\s+.*\b(tầng|căn|block)\b/i,
  // 12 Nguyễn Trãi / 25/3 Lê Văn Sỹ (số nhà + tên đường viết hoa)
  /(^|\s)\d{1,4}[A-Z]?(\/\d{1,4})*\s+\p{Lu}\p{Ll}+(\s+\p{Lu}\p{Ll}+){1,3}/u,
  // 221B Baker Street / 10 Downing St / Apt 4B
  /(^|\s)\d{1,5}[a-z]?\s+[A-Za-zÀ-ỹ.'-]+(\s+[A-Za-zÀ-ỹ.'-]+){0,3}\s+(street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|way|court|ct\.?|place|pl\.?)\b/i,
  /\b(apt|apartment|unit|flat|suite)\s*#?\s*\d+|\b(my|our)\s+(home|house|place|apartment|flat)\b|home\s+address/i,
];

export function looksLikeHomeAddress(...texts) {
  return texts.filter(Boolean).some((s) => PATTERNS.some((re) => re.test(` ${s} `)));
}
