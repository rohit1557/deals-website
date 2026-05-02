// Category-specific dark gradients — used as fallback when no product image is available.
// These are injected directly into the #bg element via page.evaluate (no API calls).
const CATEGORY_GRADIENTS: Record<string, string> = {
  Tech:    "linear-gradient(135deg, #0f0c29 0%, #1a1a4e 40%, #0d3b66 100%)",
  Gaming:  "linear-gradient(135deg, #0d0221 0%, #1a0533 40%, #2d1b69 100%)",
  Home:    "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  Fashion: "linear-gradient(135deg, #1a1a2e 0%, #3d1a38 50%, #6b2d5e 100%)",
  Beauty:  "linear-gradient(135deg, #2d1b2e 0%, #4a1942 50%, #1a0d2e 100%)",
  Travel:  "linear-gradient(135deg, #00293c 0%, #1b4f72 50%, #005f87 100%)",
  Other:   "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
};

export function getCategoryGradient(category: string): string {
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS["Other"];
}
