/**
 * ONBOARDING MODULE
 * Handles the process of adding new Google Sheets to the dashboard
 * Validates sheet structure, KPI configuration, and initializes error tracking
 */

/**
 * Main onboarding function to add a new sheet to the dashboard
 * @param {string} sheetUrl - The URL of the Google Sheet to onboard
 * @param {string} sheetName - The name/identifier for the sheet in the dashboard
 * @param {Array<string>} kpiNames - Array of KPI column names to monitor
 * @param {object} kpiThresholds - Object mapping KPI names to their threshold values
 * @returns {object} Onboarding result with status and message
 */
function onboardSheet(sheetUrl, sheetName, kpiNames, kpiThresholds) {
  try {
    Logger.log(`[ONBOARDING] Starting onboarding for sheet: ${sheetName}`);
    
    // Validate inputs
    if (!sheetUrl || !sheetName || !kpiNames || !kpiThresholds) {
      throw new Error("Missing required parameters: sheetUrl, sheetName, kpiNames, kpiThresholds");
    }
    
    // Get or open the sheet
    const sheet = SpreadsheetApp.openByUrl(sheetUrl);
    if (!sheet) {
      throw new Error(`Failed to access sheet at URL: ${sheetUrl}`);
    }
    
    // Validate sheet structure
    validateSheetStructure(sheet, kpiNames);
    
    // Get the configuration sheet in the dashboard
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = getOrCreateConfigSheet(dashboardSpreadsheet);
    
    // Register the sheet in the configuration
    registerSheetConfiguration(configSheet, {
      sheetUrl: sheetUrl,
      sheetName: sheetName,
      kpiNames: kpiNames,
      kpiThresholds: kpiThresholds,
      status: "ACTIVE",
      onboardDate: new Date(),
      lastSyncDate: null
    });
    
    // Initialize error tracking for this sheet
    initializeErrorTracking(sheetName, kpiNames);
    
    Logger.log(`[ONBOARDING] Successfully onboarded sheet: ${sheetName}`);
    
    return {
      success: true,
      message: `Sheet "${sheetName}" has been successfully onboarded to the dashboard`,
      sheetName: sheetName
    };
    
  } catch (error) {
    Logger.log(`[ONBOARDING ERROR] ${error.message}`);
    return {
      success: false,
      message: `Onboarding failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Validates that the sheet has the required structure and columns
 * @param {Sheet} sheet - The Google Sheet to validate
 * @param {Array<string>} requiredColumns - Array of required column names
 * @throws {Error} If sheet structure is invalid
 */
function validateSheetStructure(sheet, requiredColumns) {
  try {
    const dataSheet = sheet.getSheets()[0];
    if (!dataSheet) {
      throw new Error("Sheet has no tabs");
    }
    
    const firstRow = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    
    for (const columnName of requiredColumns) {
      if (!firstRow.includes(columnName)) {
        throw new Error(`Required column not found: ${columnName}`);
      }
    }
    
    Logger.log("[VALIDATION] Sheet structure is valid");
    return true;
    
  } catch (error) {
    Logger.log(`[VALIDATION ERROR] ${error.message}`);
    throw error;
  }
}

/**
 * Gets or creates the configuration sheet
 * @param {Spreadsheet} spreadsheet - The dashboard spreadsheet
 * @returns {Sheet} The configuration sheet
 */
function getOrCreateConfigSheet(spreadsheet) {
  const CONFIG_SHEET_NAME = "DashboardConfig";
  
  let configSheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  
  if (!configSheet) {
    configSheet = spreadsheet.insertSheet(CONFIG_SHEET_NAME);
    
    // Initialize headers
    const headers = ["SheetName", "SheetURL", "Status", "KPIs", "Thresholds", "OnboardDate", "LastSyncDate", "OffboardDate"];
    configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    configSheet.setFrozenRows(1);
  }
  
  return configSheet;
}

/**
 * Registers a sheet in the configuration
 * @param {Sheet} configSheet - The configuration sheet
 * @param {object} sheetConfig - Configuration object for the sheet
 */
function registerSheetConfiguration(configSheet, sheetConfig) {
  const lastRow = configSheet.getLastRow() + 1;
  
  const row = [
    sheetConfig.sheetName,
    sheetConfig.sheetUrl,
    sheetConfig.status,
    sheetConfig.kpiNames.join(", "),
    JSON.stringify(sheetConfig.kpiThresholds),
    sheetConfig.onboardDate,
    sheetConfig.lastSyncDate || "",
    ""
  ];
  
  configSheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
  Logger.log(`[CONFIG] Sheet registered in row ${lastRow}`);
}

/**
 * Initializes error tracking for a newly onboarded sheet
 * @param {string} sheetName - The name of the sheet
 * @param {Array<string>} kpiNames - Array of KPI names to track
 */
function initializeErrorTracking(sheetName, kpiNames) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorLogsSheet = getOrCreateErrorLogsSheet(dashboardSpreadsheet);
    
    // Add initialization entry
    const row = [
      new Date(),
      sheetName,
      "INITIALIZATION",
      `Error tracking initialized for KPIs: ${kpiNames.join(", ")}`,
      "SUCCESS",
      ""
    ];
    
    const lastRow = errorLogsSheet.getLastRow() + 1;
    errorLogsSheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
    
    Logger.log(`[ERROR TRACKING] Initialized for sheet: ${sheetName}`);
  } catch (error) {
    Logger.log(`[ERROR TRACKING INIT ERROR] ${error.message}`);
  }
}

/**
 * Gets or creates the error logs sheet
 * @param {Spreadsheet} spreadsheet - The dashboard spreadsheet
 * @returns {Sheet} The error logs sheet
 */
function getOrCreateErrorLogsSheet(spreadsheet) {
  const ERROR_SHEET_NAME = "ErrorLogs";
  
  let errorSheet = spreadsheet.getSheetByName(ERROR_SHEET_NAME);
  
  if (!errorSheet) {
    errorSheet = spreadsheet.insertSheet(ERROR_SHEET_NAME);
    
    // Initialize headers
    const headers = ["Timestamp", "SheetName", "ErrorType", "ErrorMessage", "Status", "Resolution"];
    errorSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    errorSheet.setFrozenRows(1);
  }
  
  return errorSheet;
}
