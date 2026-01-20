/**
 * QUICK START GUIDE - Main Script Entry Points
 * Copy and paste these functions into your Google Apps Script project
 * Execute them from the Apps Script IDE
 */

// ============================================
// ONBOARDING EXAMPLES
// ============================================

/**
 * Example: Onboard a new sheet to the dashboard
 * Replace the values with your actual sheet URL, KPI names, and thresholds
 */
function example_onboardNewSheet() {
  const result = onboardSheet(
    "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit", // Sheet URL
    "Sales Dashboard Q1 2026", // Sheet Name
    ["Revenue", "Conversion_Rate", "Customer_Acquisition"], // KPI column names
    {
      "Revenue": 50000,
      "Conversion_Rate": 3.5,
      "Customer_Acquisition": 100
    }
  );
  
  console.log(result);
}

// ============================================
// OFFBOARDING EXAMPLES
// ============================================

/**
 * Example: Offboard a sheet from the dashboard
 */
function example_offboardSheet() {
  const result = offboardSheet(
    "Sales Dashboard Q1 2026", // Sheet name to offboard
    true // Archive error logs before removing
  );
  
  console.log(result);
}

/**
 * Example: Validate before offboarding
 */
function example_validateOffboarding() {
  const validation = validateOffboarding("Sales Dashboard Q1 2026");
  console.log(validation);
}

// ============================================
// ERROR HANDLING EXAMPLES
// ============================================

/**
 * Example: Manually check all sheets for errors
 */
function example_checkAllErrors() {
  const summary = checkAllSheetsForErrors();
  console.log(summary);
}

/**
 * Example: Onboard a new KPI for tracking
 */
function example_onboardKPI() {
  const result = onboardKPITracking(
    "Sales Dashboard Q1 2026", // Sheet name
    "MarketShare", // New KPI name
    15 // Threshold value
  );
  
  console.log(result);
}

/**
 * Example: Offboard a KPI from tracking
 */
function example_offboardKPI() {
  const result = offboardKPITracking(
    "Sales Dashboard Q1 2026", // Sheet name
    "MarketShare" // KPI name to remove
  );
  
  console.log(result);
}

// ============================================
// UTILITIES EXAMPLES
// ============================================

/**
 * Example: Get all active sheets
 */
function example_getActiveSheets() {
  const sheets = getAllActiveSheets();
  console.log(sheets);
}

/**
 * Example: Get error logs for a specific sheet
 */
function example_getErrorLogs() {
  const logs = getSheetErrorLogs("Sales Dashboard Q1 2026");
  console.log(logs);
}

/**
 * Example: Get error summary statistics
 */
function example_getErrorSummary() {
  const summary = getErrorSummary();
  console.log(summary);
}

/**
 * Example: Create error check trigger (runs every 30 minutes)
 */
function example_setupErrorCheckTrigger() {
  const result = createErrorCheckTrigger(30); // 5, 15, or 30 minutes
  console.log(result);
}

/**
 * Example: Send error notification email
 */
function example_sendErrorNotification() {
  const summary = getErrorSummary();
  sendErrorNotification("admin@company.com", summary);
}

/**
 * Example: Export error logs as CSV
 */
function example_exportErrorLogs() {
  const csv = exportErrorLogsAsCSV(); // Or specify a sheet name
  console.log(csv);
  
  // Optionally save to a file:
  // DriveApp.createFile("error-logs.csv", csv, MimeType.CSV);
}

/**
 * Example: Clear error logs (use with caution!)
 */
function example_clearErrorLogs() {
  const result = clearErrorLogs(); // Or specify a sheet name
  console.log(result);
}

// ============================================
// SETUP FUNCTION
// Run this ONCE to initialize the dashboard
// ============================================

function setupDashboard() {
  try {
    Logger.log("=== SETTING UP DASHBOARD ===");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create config sheet
    const configSheet = getOrCreateConfigSheet(ss);
    Logger.log("✓ Configuration sheet created/verified");
    
    // Create error logs sheet
    const errorSheet = getOrCreateErrorLogsSheet(ss);
    Logger.log("✓ Error logs sheet created/verified");
    
    // Setup error check trigger
    const triggerResult = createErrorCheckTrigger(30);
    Logger.log("✓ Error check trigger configured");
    
    Logger.log("=== DASHBOARD SETUP COMPLETE ===");
    Logger.log("Next steps:");
    Logger.log("1. Call onboardSheet() to add new sheets");
    Logger.log("2. Configure KPI thresholds in the DashboardConfig sheet");
    Logger.log("3. Error checks will run automatically every 30 minutes");
    
  } catch (error) {
    Logger.log("ERROR during setup: " + error.message);
  }
}
