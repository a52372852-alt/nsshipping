import type { NormalizedOrder } from "@/types/order";

// Toss uses a generic title containing "무릎 담요" even for single/double sizes.
// Classify using the selected option before any title or saved-name rule.
export function shortenTossBlanketName(
  order: NormalizedOrder,
): NormalizedOrder | null {
  if (order.platform !== "toss") return null;
  if (!/담요|블랭킷|blanket/i.test(order.productName + order.optionName))
    return null;
  const option = order.optionName.normalize("NFKC");
  const dimensions = [
    ...option.matchAll(
      /(?<![\d.])(\d+(?:\.\d+)?)\s*(?:cm)?\s*[x×*]\s*(\d+(?:\.\d+)?)(?![\d.])\s*(?:cm)?/gi,
    ),
  ];
  if (dimensions.length !== 1) return null;
  const [match] = dimensions;
  const width = Number(match[1]);
  const height = Number(match[2]);
  const compact = option.replace(/\s+/g, "");
  const colors = ["포레스트그린", "베이지", "그레이", "블루"].filter((color) =>
    compact.includes(color),
  );
  if (colors.length > 1) return null;
  const description = option
    .slice(0, match.index)
    .replace(/(?:색상|컬러|사이즈)\s*[:：]?/g, "")
    .replace(/무릎\s*담요|싱글|더블/g, "")
    .replace(/[,/|_()\[\]:：-]+/g, " ")
    .trim();
  const product = colors[0] || description;
  if (!product) return null;
  const size =
    height === 200 && width === 150
      ? "싱글"
      : height === 200 && width === 180
        ? "더블"
        : "무릎담요";
  const name =
    size === "무릎담요" ? `무릎담요_${product}` : `${product}${size}`;
  return { ...order, productName: name, optionName: name };
}
