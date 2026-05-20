import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  ALLOWED_OWNER_USER_ID: z.string().min(1, "ALLOWED_OWNER_USER_ID is required"),
  INGEST_TOKEN: z.string().min(8, "INGEST_TOKEN must be at least 8 characters"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => {
      const key = issue.path.join(".") || "(root)";
      return `  - ${key}: ${issue.message}`;
    })
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

let cached: Env | undefined;

export function getServerEnv(): Env {
  if (!cached) cached = parseEnv();
  return cached;
}
