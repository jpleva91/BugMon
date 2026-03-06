export interface ParsedError {
  type: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  raw: string;
}

// Extract structured error info from raw stderr/stdout text
export function parseError(text: string): ParsedError | null {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return null;

  // Try to match common error patterns
  const errorLine = lines.find((l) =>
    /Error|ENOENT|ECONNREFUSED|segmentation fault|SIGSEGV|timeout|ETIMEDOUT/i.test(l)
  );

  if (!errorLine) return null;

  const parsed: ParsedError = {
    type: "Unknown",
    message: errorLine.trim(),
    raw: text,
  };

  // Extract error type: "TypeError: Cannot read properties..."
  const typeMatch = errorLine.match(/^(\w*Error):\s*(.*)/);
  if (typeMatch) {
    parsed.type = typeMatch[1];
    parsed.message = typeMatch[2];
  }

  // Unhandled promise rejection
  if (/UnhandledPromiseRejection|unhandled.*reject/i.test(text)) {
    parsed.type = "PromiseRejection";
  }

  // Stack overflow
  if (/Maximum call stack|stack overflow/i.test(text)) {
    parsed.type = "StackOverflow";
  }

  // Memory
  if (/heap out of memory|memory leak|allocation failed/i.test(text)) {
    parsed.type = "MemoryLeak";
  }

  // Node/system errors
  if (/ENOENT/i.test(errorLine)) parsed.type = "ENOENT";
  if (/ECONNREFUSED/i.test(errorLine)) parsed.type = "ECONNREFUSED";
  if (/timeout|ETIMEDOUT/i.test(errorLine)) parsed.type = "Timeout";
  if (/segmentation fault|SIGSEGV/i.test(errorLine)) parsed.type = "Segfault";

  // Extract file location from stack trace
  // Patterns: "at Object.<anonymous> (/path/file.ts:10:5)"
  //           "(/path/file.ts:10:5)"
  //           "file.ts:10:5"
  for (const line of lines) {
    const locationMatch =
      line.match(/\(([^)]+):(\d+):(\d+)\)/) ||
      line.match(/at\s+([^:]+):(\d+):(\d+)/) ||
      line.match(/([^\s]+\.\w+):(\d+):(\d+)/);

    if (locationMatch) {
      const filePath = locationMatch[1].trim();
      // Skip node_modules and internal paths
      if (!filePath.includes("node_modules") && !filePath.startsWith("node:")) {
        parsed.file = filePath;
        parsed.line = parseInt(locationMatch[2], 10);
        parsed.column = parseInt(locationMatch[3], 10);
        break;
      }
    }
  }

  // Capture stack trace
  const stackLines = lines.filter((l) => l.trim().startsWith("at "));
  if (stackLines.length > 0) {
    parsed.stack = stackLines.join("\n");
  }

  return parsed;
}

// Parse multiple errors from a chunk of output
export function parseErrors(text: string): ParsedError[] {
  const errors: ParsedError[] = [];

  // Split on common error boundaries
  const chunks = text.split(/(?=\n\w*Error:|\nUnhandledPromiseRejection)/);

  for (const chunk of chunks) {
    const parsed = parseError(chunk);
    if (parsed) {
      errors.push(parsed);
    }
  }

  return errors;
}
