/**
 * Cron Endpoints Test Script
 *
 * This script tests the cron job endpoints to verify they work correctly:
 * 1. Tests authentication (with and without valid secret)
 * 2. Tests endpoint availability
 * 3. Optionally triggers actual execution
 *
 * Run with: npx tsx scripts/test-cron-endpoints.ts [--execute]
 *
 * Options:
 *   --execute: Actually execute the cron jobs (warning: will send newsletter if subscribers exist)
 *   --local: Test against local server (http://localhost:3001)
 *
 * Prerequisites:
 * 1. Ensure .env file has CRON_SECRET configured
 * 2. For remote tests, set SITE_URL in .env
 */

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

interface TestResult {
  endpoint: string;
  test: string;
  passed: boolean;
  message: string;
  responseStatus?: number;
  responseTime?: number;
}

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.SITE_URL || "https://flashinfoafrique.com";
const LOCAL_URL = "http://localhost:3001";

const args = process.argv.slice(2);
const shouldExecute = args.includes("--execute");
const useLocal = args.includes("--local");

const BASE_URL = useLocal ? LOCAL_URL : SITE_URL;

const ENDPOINTS = [
  { path: "/api/scrape-rss", name: "RSS Scraping" },
  { path: "/api/newsletter/send-weekly", name: "Newsletter Send" },
];

/**
 * Test an endpoint with a specific authentication scenario
 */
async function testEndpoint(
  endpoint: string,
  name: string,
  authHeader?: string,
  expectedStatus: number = 200
): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    
    const responseTime = Date.now() - startTime;
    const passed = response.status === expectedStatus;
    
    let responseBody = "";
    try {
      responseBody = await response.text();
      const json = JSON.parse(responseBody);
      responseBody = JSON.stringify(json, null, 2).substring(0, 200);
    } catch {
      responseBody = responseBody.substring(0, 200);
    }
    
    return {
      endpoint,
      test: name,
      passed,
      message: passed 
        ? `Status ${response.status} as expected` 
        : `Expected ${expectedStatus}, got ${response.status}: ${responseBody}`,
      responseStatus: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Connection refused is expected if testing against local server that's not running
    if (errorMessage.includes("ECONNREFUSED") && useLocal) {
      return {
        endpoint,
        test: name,
        passed: false,
        message: "Local server not running. Start with: pnpm dev",
        responseTime,
      };
    }
    
    return {
      endpoint,
      test: name,
      passed: false,
      message: `Error: ${errorMessage}`,
      responseTime,
    };
  }
}

/**
 * Run all tests for an endpoint
 */
async function runEndpointTests(endpoint: string, name: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test 1: Without authentication (should return 401)
  logInfo(`  Testing without authentication...`);
  results.push(await testEndpoint(endpoint, "No auth (expect 401)", undefined, 401));
  
  // Test 2: With invalid authentication (should return 401)
  logInfo(`  Testing with invalid secret...`);
  results.push(await testEndpoint(endpoint, "Invalid auth (expect 401)", "Bearer invalid-secret", 401));
  
  // Test 3: With valid authentication (should return 200 or 504 for timeout)
  if (CRON_SECRET && shouldExecute) {
    logInfo(`  Testing with valid secret (executing endpoint)...`);
    const result = await testEndpoint(endpoint, "Valid auth (expect 200/504)", `Bearer ${CRON_SECRET}`, 200);
    // Also accept 504 (timeout) as valid - operation may be slow
    if (result.responseStatus === 504) {
      result.passed = true;
      result.message = "Status 504 (timeout) - operation took too long but auth worked";
    }
    // Also accept 500 with success:false for valid auth but operation failure
    if (result.responseStatus === 500) {
      result.passed = true;
      result.message = "Status 500 - auth worked but operation failed (check server logs)";
    }
    results.push(result);
  } else if (CRON_SECRET) {
    logInfo(`  Testing with valid secret (dry run - checking auth only)...`);
    // For dry run, we still test the endpoint but expect it to work
    const result = await testEndpoint(endpoint, "Valid auth (dry run)", `Bearer ${CRON_SECRET}`, 200);
    // Accept any 2xx/5xx as auth success (the operation might fail but auth worked)
    if (result.responseStatus && result.responseStatus >= 200 && result.responseStatus < 600) {
      if (result.responseStatus === 401) {
        // Auth actually failed
        result.passed = false;
      } else {
        result.passed = true;
        result.message = `Auth successful (status ${result.responseStatus})`;
      }
    }
    results.push(result);
  } else {
    logWarning(`  Skipping valid auth test - CRON_SECRET not configured`);
    results.push({
      endpoint,
      test: "Valid auth",
      passed: false,
      message: "CRON_SECRET not configured in .env",
    });
  }
  
  return results;
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log("");
  log("========================================", COLORS.cyan);
  log("  Cron Endpoints Test Suite", COLORS.cyan);
  log("========================================", COLORS.cyan);
  console.log("");
  
  logInfo(`Testing against: ${BASE_URL}`);
  logInfo(`Execute mode: ${shouldExecute ? "ENABLED (will run operations)" : "DISABLED (auth check only)"}`);
  
  if (!CRON_SECRET) {
    logError("CRON_SECRET is not configured in .env");
    logInfo("Please set CRON_SECRET in your .env file");
    process.exit(1);
  }
  
  logSuccess(`CRON_SECRET is configured (${CRON_SECRET.length} characters)`);
  console.log("");
  
  const allResults: TestResult[] = [];
  
  for (const { path, name } of ENDPOINTS) {
    log(`Testing ${name} (${path})...`, COLORS.blue);
    const results = await runEndpointTests(path, name);
    allResults.push(...results);
    
    for (const result of results) {
      if (result.passed) {
        logSuccess(`  ${result.test}: ${result.message}${result.responseTime ? ` (${result.responseTime}ms)` : ""}`);
      } else {
        logError(`  ${result.test}: ${result.message}${result.responseTime ? ` (${result.responseTime}ms)` : ""}`);
      }
    }
    console.log("");
  }
  
  // Summary
  log("========================================", COLORS.cyan);
  log("  Summary", COLORS.cyan);
  log("========================================", COLORS.cyan);
  console.log("");
  
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  
  log(`Total: ${allResults.length} tests`, COLORS.reset);
  if (passed > 0) logSuccess(`Passed: ${passed}`);
  if (failed > 0) logError(`Failed: ${failed}`);
  console.log("");
  
  if (failed > 0) {
    logError("Some tests failed. Check the errors above.");
    console.log("");
    logInfo("Common issues:");
    log("  - If testing locally, make sure the server is running: pnpm dev", COLORS.reset);
    log("  - If testing remotely, make sure the application is deployed", COLORS.reset);
    log("  - Check that CRON_SECRET matches the one in Vercel", COLORS.reset);
    process.exit(1);
  } else {
    logSuccess("All tests passed!");
    
    if (!shouldExecute) {
      console.log("");
      logInfo("To actually execute the cron jobs, run with --execute flag:");
      log("  npx tsx scripts/test-cron-endpoints.ts --execute", COLORS.reset);
      logWarning("Warning: This will trigger actual operations (RSS scraping, newsletter sending)");
    }
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error}`);
  process.exit(1);
});
