/**
 * Cron Job Configuration Verification Script
 *
 * This script verifies the cron job configuration before deployment:
 * 1. Checks that CRON_SECRET is properly configured
 * 2. Validates vercel.json cron schedules
 * 3. Verifies endpoint availability locally
 *
 * Run with: npx tsx scripts/verify-cron-config.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has CRON_SECRET configured
 */

import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color = COLORS.reset): void {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSuccess(message: string): void {
  log(`✅ ${message}`, COLORS.green);
}

function logWarning(message: string): void {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function logError(message: string): void {
  log(`❌ ${message}`, COLORS.red);
}

function logInfo(message: string): void {
  log(`ℹ️  ${message}`, COLORS.blue);
}

interface VercelConfig {
  crons?: Array<{
    path: string;
    schedule: string;
  }>;
  functions?: {
    [key: string]: {
      maxDuration?: number;
    };
  };
}

interface ValidationResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate cron schedule format (5-field cron expression)
 */
function validateCronSchedule(schedule: string): { valid: boolean; error?: string } {
  const fields = schedule.split(" ");
  
  if (fields.length !== 5) {
    return { valid: false, error: `Expected 5 fields, got ${fields.length}` };
  }

  const fieldNames = ["minute", "hour", "day of month", "month", "day of week"];
  const fieldRanges = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 7 },  // day of week (0 and 7 are Sunday)
  ];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const range = fieldRanges[i];
    
    // Valid patterns: *, */n, n, n-m, n,m,o
    const validPattern = /^(\*|\d+(-\d+)?)(\/\d+)?$|^(\d+,)+\d+$/;
    
    if (!validPattern.test(field)) {
      // Allow * alone or */n pattern
      if (field !== "*" && !field.match(/^\*\/\d+$/) && !field.match(/^\d+(,\d+)*$/) && !field.match(/^\d+-\d+$/)) {
        return { valid: false, error: `Invalid ${fieldNames[i]} field: ${field}` };
      }
    }

    // Check numeric values are in range
    const numbers = field.match(/\d+/g);
    if (numbers) {
      for (const num of numbers) {
        const value = parseInt(num, 10);
        if (value < range.min || value > range.max) {
          return { valid: false, error: `${fieldNames[i]} value ${value} is out of range (${range.min}-${range.max})` };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Parse cron schedule to human-readable format
 */
function parseCronToHuman(schedule: string): string {
  const fields = schedule.split(" ");
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  const descriptions: string[] = [];

  // Day of week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (dayOfWeek !== "*") {
    const dayNum = parseInt(dayOfWeek, 10);
    if (!isNaN(dayNum)) {
      descriptions.push(`on ${days[dayNum]}`);
    }
  }

  // Hour
  if (hour.includes("*/")) {
    const interval = hour.split("/")[1];
    descriptions.push(`every ${interval} hours`);
  } else if (hour !== "*") {
    descriptions.push(`at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")} UTC`);
  }

  // Minute
  if (minute.includes("*/")) {
    const interval = minute.split("/")[1];
    descriptions.push(`every ${interval} minutes`);
  }

  return descriptions.join(" ") || schedule;
}

/**
 * Check CRON_SECRET configuration
 */
function checkCronSecret(): ValidationResult {
  const result: ValidationResult = { passed: true, warnings: [], errors: [] };
  
  const cronSecret = process.env.CRON_SECRET;
  const defaultSecret = "default-cron-secret-change-me";

  if (!cronSecret) {
    result.errors.push("CRON_SECRET is not set in environment variables");
    result.passed = false;
    return result;
  }

  if (cronSecret === defaultSecret) {
    result.errors.push("CRON_SECRET is using the default value - this will fail in production!");
    result.passed = false;
    return result;
  }

  if (cronSecret.length < 16) {
    result.warnings.push(`CRON_SECRET is short (${cronSecret.length} chars) - recommend at least 32 characters`);
  }

  // Check for invalid characters that could break the Authorization header
  if (/[\n\r]/.test(cronSecret)) {
    result.errors.push("CRON_SECRET contains newline characters which will break the Authorization header");
    result.passed = false;
    return result;
  }

  logSuccess(`CRON_SECRET is configured (${cronSecret.length} characters)`);
  return result;
}

/**
 * Check vercel.json configuration
 */
function checkVercelConfig(): ValidationResult {
  const result: ValidationResult = { passed: true, warnings: [], errors: [] };
  
  const vercelJsonPath = path.join(process.cwd(), "vercel.json");
  
  if (!fs.existsSync(vercelJsonPath)) {
    result.errors.push("vercel.json not found");
    result.passed = false;
    return result;
  }

  let config: VercelConfig;
  try {
    const content = fs.readFileSync(vercelJsonPath, "utf-8");
    config = JSON.parse(content);
  } catch (error) {
    result.errors.push(`Failed to parse vercel.json: ${error}`);
    result.passed = false;
    return result;
  }

  // Check crons configuration
  if (!config.crons || config.crons.length === 0) {
    result.warnings.push("No cron jobs configured in vercel.json");
  } else {
    logInfo(`Found ${config.crons.length} cron job(s):`);
    
    for (const cron of config.crons) {
      const validation = validateCronSchedule(cron.schedule);
      const humanReadable = parseCronToHuman(cron.schedule);
      
      if (validation.valid) {
        logSuccess(`  ${cron.path}: ${cron.schedule} (${humanReadable})`);
      } else {
        logError(`  ${cron.path}: Invalid schedule - ${validation.error}`);
        result.errors.push(`Invalid cron schedule for ${cron.path}: ${validation.error}`);
        result.passed = false;
      }
    }
  }

  // Check maxDuration
  if (config.functions) {
    const apiConfig = config.functions["api/index.js"];
    if (apiConfig?.maxDuration) {
      if (apiConfig.maxDuration < 300) {
        result.warnings.push(`maxDuration is ${apiConfig.maxDuration}s - RSS scraping may timeout with many sources`);
      } else if (apiConfig.maxDuration >= 600) {
        logSuccess(`maxDuration is ${apiConfig.maxDuration}s (10+ minutes) - sufficient for RSS scraping`);
      } else {
        logInfo(`maxDuration is ${apiConfig.maxDuration}s`);
      }
    } else {
      result.warnings.push("No maxDuration configured - default is 10s which is insufficient for cron jobs");
    }
  }

  return result;
}

/**
 * Check that cron endpoint files exist
 */
function checkEndpointFiles(): ValidationResult {
  const result: ValidationResult = { passed: true, warnings: [], errors: [] };
  
  const vercelJsonPath = path.join(process.cwd(), "vercel.json");
  
  if (!fs.existsSync(vercelJsonPath)) {
    return result; // Already checked in checkVercelConfig
  }

  const config: VercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
  
  if (!config.crons) return result;

  // Check that the API handler file exists
  const apiHandlerPath = path.join(process.cwd(), "api", "index.js");
  const apiSourcePath = path.join(process.cwd(), "api", "_index.ts");
  
  if (!fs.existsSync(apiHandlerPath)) {
    result.warnings.push("api/index.js not found - run 'pnpm build' to generate it");
  } else {
    // Check if the handler contains verifyCronAuth
    const content = fs.readFileSync(apiHandlerPath, "utf-8");
    if (!content.includes("verifyCronAuth")) {
      result.errors.push("api/index.js does not contain verifyCronAuth - run 'pnpm build' to regenerate");
      result.passed = false;
    } else {
      logSuccess("api/index.js contains verifyCronAuth authentication");
    }
  }

  if (!fs.existsSync(apiSourcePath)) {
    result.warnings.push("api/_index.ts source file not found");
  }

  return result;
}

/**
 * Main verification function
 */
async function main(): Promise<void> {
  console.log("");
  log("========================================", COLORS.cyan);
  log("  Cron Job Configuration Verification  ", COLORS.cyan);
  log("========================================", COLORS.cyan);
  console.log("");

  const results: ValidationResult[] = [];

  // 1. Check CRON_SECRET
  logInfo("Checking CRON_SECRET configuration...");
  results.push(checkCronSecret());
  console.log("");

  // 2. Check vercel.json
  logInfo("Checking vercel.json configuration...");
  results.push(checkVercelConfig());
  console.log("");

  // 3. Check endpoint files
  logInfo("Checking endpoint files...");
  results.push(checkEndpointFiles());
  console.log("");

  // Summary
  log("========================================", COLORS.cyan);
  log("  Summary", COLORS.cyan);
  log("========================================", COLORS.cyan);
  console.log("");

  const allWarnings = results.flatMap(r => r.warnings);
  const allErrors = results.flatMap(r => r.errors);
  const allPassed = results.every(r => r.passed);

  if (allErrors.length > 0) {
    logError("Errors found:");
    for (const error of allErrors) {
      log(`  - ${error}`, COLORS.red);
    }
    console.log("");
  }

  if (allWarnings.length > 0) {
    logWarning("Warnings:");
    for (const warning of allWarnings) {
      log(`  - ${warning}`, COLORS.yellow);
    }
    console.log("");
  }

  if (allPassed && allErrors.length === 0) {
    logSuccess("All checks passed! Cron jobs should work correctly.");
    console.log("");
    logInfo("Next steps:");
    log("  1. Ensure CRON_SECRET is configured in Vercel (Settings > Environment Variables)", COLORS.reset);
    log("  2. Deploy the application", COLORS.reset);
    log("  3. Test cron endpoints with: curl -H 'Authorization: Bearer YOUR_SECRET' https://your-domain/api/scrape-rss", COLORS.reset);
    console.log("");
  } else {
    logError("Some checks failed. Please fix the errors above before deploying.");
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error}`);
  process.exit(1);
});
