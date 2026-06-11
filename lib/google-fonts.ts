export interface FontVariant {
  weight: string;
  style: "normal" | "italic";
  label: string; // e.g., "Regular 400", "Bold 700 Italic"
}

export interface GoogleFont {
  family: string;
  category: string;
  variants: FontVariant[];
}

// A curated list of popular Google Fonts with their standard variants
export const GOOGLE_FONTS: GoogleFont[] = [
  {
    family: "Inter",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Roboto",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "700", style: "italic", label: "Bold 700 Italic" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Outfit",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Playfair Display",
    category: "serif",
    variants: [
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "700", style: "italic", label: "Bold 700 Italic" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Fira Code",
    category: "monospace",
    variants: [
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
    ],
  },
  {
    family: "Montserrat",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "700", style: "italic", label: "Bold 700 Italic" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Syne",
    category: "sans-serif",
    variants: [
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
    ],
  },
  {
    family: "Poppins",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "200", style: "normal", label: "Extra-Light 200" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Open Sans",
    category: "sans-serif",
    variants: [
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
    ],
  },
  {
    family: "Lato",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "700", style: "italic", label: "Bold 700 Italic" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Oswald",
    category: "sans-serif",
    variants: [
      { weight: "200", style: "normal", label: "Extra-Light 200" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
    ],
  },
  {
    family: "Raleway",
    category: "sans-serif",
    variants: [
      { weight: "100", style: "normal", label: "Thin 100" },
      { weight: "200", style: "normal", label: "Extra-Light 200" },
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "800", style: "normal", label: "Extra-Bold 800" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
  {
    family: "Space Grotesk",
    category: "sans-serif",
    variants: [
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "500", style: "normal", label: "Medium 500" },
      { weight: "600", style: "normal", label: "Semi-Bold 600" },
      { weight: "700", style: "normal", label: "Bold 700" },
    ],
  },
  {
    family: "Merriweather",
    category: "serif",
    variants: [
      { weight: "300", style: "normal", label: "Light 300" },
      { weight: "400", style: "normal", label: "Regular 400" },
      { weight: "400", style: "italic", label: "Regular 400 Italic" },
      { weight: "700", style: "normal", label: "Bold 700" },
      { weight: "700", style: "italic", label: "Bold 700 Italic" },
      { weight: "900", style: "normal", label: "Black 900" },
    ],
  },
];

/**
 * Utility to generate a Google Fonts API CSS URL based on selected families and their variants.
 */
export function generateGoogleFontsUrl(fonts: { family: string; weight: string; style: string }[]) {
  if (!fonts || fonts.length === 0) return "";

  // Group variants by family
  const familyMap = new Map<string, Set<string>>();

  fonts.forEach((f) => {
    if (!f.family) return;
    // If it's italic, Google Fonts uses ital,wght@1,400. If normal, ital,wght@0,400 or just wght@400.
    // To support both, we'll request the ital,wght axis for everything if there are italics,
    // or just construct the specific request.
    const axisValue = f.style === "italic" ? `1,${f.weight}` : `0,${f.weight}`;
    
    if (!familyMap.has(f.family)) {
      familyMap.set(f.family, new Set());
    }
    familyMap.get(f.family)!.add(axisValue);
  });

  const queryParts: string[] = [];

  familyMap.forEach((variants, family) => {
    // Replace spaces with +
    const familyName = family.replace(/ /g, "+");
    
    // Sort variants (e.g. 0,400 before 1,400)
    const sortedVariants = Array.from(variants).sort();
    
    // Check if we actually have any italics
    const hasItalics = sortedVariants.some((v) => v.startsWith("1,"));
    
    if (hasItalics) {
      // Needs ital,wght axis
      const weights = sortedVariants.join(";");
      queryParts.push(`family=${familyName}:ital,wght@${weights}`);
    } else {
      // Just wght axis (strip the "0," prefix)
      const weights = sortedVariants.map((v) => v.replace("0,", "")).join(";");
      queryParts.push(`family=${familyName}:wght@${weights}`);
    }
  });

  return `https://fonts.googleapis.com/css2?${queryParts.join("&")}&display=swap`;
}
