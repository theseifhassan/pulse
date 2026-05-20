import { parseEnv } from "../src/lib/env";

try {
  parseEnv();
  console.log("✓ All required environment variables are valid");
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
