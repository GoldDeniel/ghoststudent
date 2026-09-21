export interface LanguageRule {
  // How to format the red error "Expected" text
  formatExpected(text: string): string;

  // How to format the future lines block at the bottom
  formatFutureLines(text: string): string;

  // Does this language benefit from the Subsequence Scanner (Smart Matching)?
  useSmartMatching: boolean;
}

// ==========================================
// 1. C# (and other C-style languages)
// ==========================================
const csharpRule: LanguageRule = {
  formatExpected: (text) => `  // Expected: ${text}`,
  formatFutureLines: (text) => `   // Future lines:${text}`,
  useSmartMatching: true, // Great for {}, (), [], and ""
};

// ==========================================
// 2. HTML / XML
// ==========================================
const htmlRule: LanguageRule = {
  formatExpected: (text) => `  <!-- Expected: ${text} -->`,
  formatFutureLines: (text) => `   <!-- Future lines:${text} -->`,
  useSmartMatching: true, // Great for auto-closing <tags>
};

// ==========================================
// 3. Python / Ruby (Hash comments)
// ==========================================
const hashCommentRule: LanguageRule = {
  formatExpected: (text) => `  # Expected: ${text}`,
  formatFutureLines: (text) => `   # Future lines:${text}`,
  useSmartMatching: true,
};

// ==========================================
// THE REGISTRY (Maps VS Code's language ID to your rules)
// ==========================================
export function getLanguageRule(languageId: string): LanguageRule {
  switch (languageId) {
    case "html":
    case "xml":
      return htmlRule;

    case "csharp":
    case "javascript":
    case "typescript":
    case "java":
    case "cpp":
    case "c":
    case "php":
      return csharpRule;

    case "python":
    case "ruby":
    case "powershell":
      return hashCommentRule;

    default:
      // Fallback for unknown languages (defaults to C-style)
      return csharpRule;
  }
}
