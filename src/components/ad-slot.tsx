// No third-party script is loaded. AdSense activation is a separate, reviewed step.
// Keep this component on editorial pages only, never in the converter or root layout.
export function AdSlot({
  position,
  preview = false,
}: {
  position: "top" | "middle" | "bottom";
  preview?: boolean;
}) {
  if (!preview) return null;
  return (
    <aside
      className="ad-slot"
      data-position={position}
      aria-label="광고 영역 미리보기"
    >
      <span>광고</span>
      <p>광고 영역 미리보기</p>
    </aside>
  );
}
