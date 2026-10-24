import type { NormalizedOrder } from "@/types/order";

const colors = ["포레스트그린", "베이지", "그레이", "블루"] as const;
const sizes = ["무릎담요", "싱글", "더블"] as const;
const compact = (text: string) => text.normalize("NFKC").replace(/\s+/g, "");

// Recognize the approved short names even when a seller appends dimensions.
// Keep other goods (e.g. a bed frame) out of this narrowly scoped cleanup.
export function stripBedDimensions(text: string): string {
  const match = compact(text).match(
    /^(베이지|그레이|포레스트그린)(싱글|더블)[_:/-]?[([]?\d+(?:\.\d+)?(?:cm|mm)?[x×*]\d+(?:\.\d+)?(?:cm|mm)?[)\]]?(?:cm|mm)?(?:[,/-]?\d+개)?$/i,
  );
  return match ? `${match[1]}${match[2]}` : text;
}

function selectedColor(text: string) {
  return colors.filter((color) => text.includes(color));
}

function selectedSize(text: string) {
  // A named size is stronger evidence than a marketing title mentioning knees.
  if (/슈퍼싱글|퀸|킹/.test(text)) return ["unsupported"];
  const bed = sizes.slice(1).filter((size) => text.includes(size));
  if (bed.length) return bed;
  return /무릎담요|100[xX×*]150(?![0-9.])(?:cm)?/.test(text)
    ? ["무릎담요"]
    : [];
}

export function shortenBlanketName(order: NormalizedOrder): NormalizedOrder {
  const product = compact(stripBedDimensions(order.productName));
  const option = compact(stripBedDimensions(order.optionName));
  const exactShort =
    /^(?:무릎담요_(?:그레이|베이지|블루)|(?:베이지|그레이|포레스트그린)(?:싱글|더블))$/;
  // Do not shorten unrelated goods that merely share a color and size.
  if (
    !/담요|블랭킷|blanket/i.test(product + option) &&
    !exactShort.test(product) &&
    !exactShort.test(option)
  )
    return order;

  const optionColors = selectedColor(option);
  const optionSizes = selectedSize(option);
  const foundColors = optionColors.length
    ? optionColors
    : selectedColor(product);
  const foundSizes = optionSizes.length ? optionSizes : selectedSize(product);
  if (foundColors.length !== 1 || foundSizes.length !== 1) return order;
  const color = foundColors[0];
  const size = foundSizes[0];
  const name = size === "무릎담요" ? `무릎담요_${color}` : `${color}${size}`;
  if (!exactShort.test(name)) return order;
  return { ...order, productName: name, optionName: name };
}
