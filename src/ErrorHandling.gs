/**
 * ERROR HANDLING MODULE
 * Monitors KPI thresholds, detects anomalies, and creates error records
 * Handles both onboarding and offboarding of error tracking for specific KPIs
 */

/**
 * Main function to check all sheets for KPI violations
 * Called by scheduled trigger
 * @returns {object} Summary of errors found and processed
 */
function checkAllSheetsForErrors() {
  try {
    Logger.log("[ERROR CHECK] Starting dashboard-wide error check");
    
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    
    if (!configSheet) {
      Logger.log("[ERROR CHECK] Configuration sheet not found");
      return { success: false, message: "Configuration sheet not found" };
    }
    
    const data = configSheet.getDataRange().getValues();
    const errorsSummary = {
      total: 0,
      sheets: [],
      timestamp: new Date()
    };
    
    // Process each configured sheet (skip header row)
    for (let i = 1; i < data.length; i++) {
      const sheetName = data[i][0];
      const sheetUrl = data[i][1];
      const status = data[i][2];
      const kpisJson = data[i][3];
      const thresholdsJson = data[i][4];
      
      // Only check active sheets
      if (status !== "ACTIVE") {
        continue;
      }
      
      try {
        const kpiNames = kpisJson.split(", ");
        const thresholds = JSON.parse(thresholdsJson);
        
        const sheetErrors = checkSheetForErrors(sheetUrl, sheetName, kpiNames, thresholds);
        
        if (sheetErrors.length > 0) {
          errorsSummary.sheets.push({
            sheetName: sheetName,
            errorCount: sheetErrors.length,
            errors: sheetErrors
          });
          errorsSummary.total += sheetErrors.length;
        }
        
      } catch (error) {
        Logger.log(`[ERROR CHECK] Error processing sheet ${sheetName}: ${error.message}`);
      }
    }
    
    Logger.log(`[ERROR CHECK] Completed. Found ${errorsSummary.total} total errors`);
    return errorsSummary;
    
  } catch (error) {
    Logger.log(`[ERROR CHECK ERROR] ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Checks a single sheet for KPI threshold violations
 * @param {string} sheetUrl - URL of the sheet to check
 * @param {string} sheetName - Name of the sheet
 * @param {Array<string>} kpiNames - Array of KPI column names
 * @param {object} kpiThresholds - Object mapping KPI names to threshold values
 * @returns {Array<object>} Array of errors found
 */
function checkSheetForErrors(sheetUrl, sheetName, kpiNames, kpiThresholds) {
  const errors = [];
  
  try {
    const sheet = SpreadsheetApp.openByUrl(sheetUrl);
    const dataSheet = sheet.getSheets()[0];
    const data = dataSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices for KPIs
    const kpiColumns = {};
    for (const kpiName of kpiNames) {
      const columnIndex = headers.indexOf(kpiName);
      if (columnIndex !== -1) {
        kpiColumns[kpiName] = columnIndex;
      }
    }
    
    // Check each row for threshold violations
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      for (const kpiName of kpiNames) {
        if (!(kpiName in kpiColumns)) {
          continue; // KPI column not found
        }
        
        const columnIndex = kpiColumns[kpiName];
        const value = row[columnIndex];
        const threshold = kpiThresholds[kpiName];
        
        // Check if value violates threshold
        if (value !== null && value !== "" && typeof value === 'number') {
          if (value < threshold) {
            const error = {
              sheetName: sheetName,
              kpiName: kpiName,
              currentValue: value,
              threshold: threshold,
              rowNumber: i + 1,
              severity: calculateErrorSeverity(value, threshold),
              timestamp: new Date()
            };
            
            errors.push(error);
            logErrorToSheet(error);
          }
        }
      }
    }
    
  } catch (error) {
    Logger.log(`[SHEET CHECK ERROR] Failed to check sheet ${sheetName}: ${error.message}`);
  }
  
  return errors;
}

/**
 * Calculates error severity based on how far below threshold the value is
 * @param {number} value - The current KPI value
 * @param {number} threshold - The threshold value
 * @returns {string} Severity level: "CRITICAL", "HIGH", "MEDIUM", "LOW"
 */
function calculateErrorSeverity(value, threshold) {
  const percentageBelow = ((threshold - value) / threshold) * 100;
  
  if (percentageBelow >= 50) {
    return "CRITICAL";
  } else if (percentageBelow >= 30) {
    return "HIGH";
  } else if (percentageBelow >= 15) {
    return "MEDIUM";
  } else {
    return "LOW";
  }
}

/**
 * Logs an error to the ErrorLogs sheet and creates a new row
 * @param {object} error - The error object to log
 */
function logErrorToSheet(error) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    
    if (!errorSheet) {
      Logger.log("[LOG ERROR] Error logs sheet not found");
      return;
    }
    
    const row = [
      error.timestamp,
      error.sheetName,
      "KPI_THRESHOLD_VIOLATION",
      `${error.kpiName}: ${error.currentValue} (threshold: ${error.threshold})`,
      error.severity,
      `Row ${error.rowNumber}`
    ];
    
    const lastRow = errorSheet.getLastRow() + 1;
    errorSheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
    
    // Format based on severity
    formatErrorRow(errorSheet, lastRow, error.severity);
    
    Logger.log(`[ERROR LOGGED] ${error.sheetName}: ${error.kpiName} = ${error.currentValue}`);
    
  } catch (error) {
    Logger.log(`[LOG ERROR] ${error.message}`);
  }
}

/**
 * Formats error row based on severity
 * @param {Sheet} sheet - The error logs sheet
 * @param {number} rowNum - The row number to format
 * @param {string} severity - The severity level
 */
function formatErrorRow(sheet, rowNum, severity) {
  let backgroundColor = "#ffffff"; // default white
  
  switch (severity) {
    case "CRITICAL":
      backgroundColor = "#ff0000"; // red
      break;
    case "HIGH":
      backgroundColor = "#ff9900"; // orange
      break;
    case "MEDIUM":
      backgroundColor = "#ffff00"; // yellow
      break;
    case "LOW":
      backgroundColor = "#ffcc99"; // light orange
      break;
  }
  
  sheet.getRange(rowNum, 5).setBackground(backgroundColor);
}

/**
 * Onboards a specific KPI for error tracking
 * @param {string} sheetName - The sheet name
 * @param {string} kpiName - The KPI name to onboard
 * @param {number} threshold - The threshold value for this KPI
 * @returns {object} Result of the operation
 */
function onboardKPITracking(sheetName, kpiName, threshold) {
  try {
    Logger.log(`[KPI ONBOARDING] Onboarding KPI tracking: ${sheetName}.${kpiName}`);
    
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    
    if (!configSheet) {
      throw new Error("Configuration sheet not found");
    }
    
    const data = configSheet.getDataRange().getValues();
    const sheetRow = findSheetRowInConfig(data, sheetName);
    
    if (sheetRow === -1) {
      throw new Error(`Sheet "${sheetName}" not found in configuration`);
    }
    
    // Parse current KPIs and thresholds
    const kpisText = data[sheetRow][3];
    const thresholdsText = data[sheetRow][4];
    
    let kpiNames = kpisText ? kpisText.split(", ").filter(k => k.trim()) : [];
    let thresholds = thresholdsText ? JSON.parse(thresholdsText) : {};
    
    // Add new KPI
    if (!kpiNames.includes(kpiName)) {
      kpiNames.push(kpiName);
    }
    thresholds[kpiName] = threshold;
    
    // Update config sheet
    configSheet.getRange(sheetRow + 1, 4).setValue(kpiNames.join(", "));
    configSheet.getRange(sheetRow + 1, 5).setValue(JSON.stringify(thresholds));
    
    // Log to error sheet
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    if (errorSheet) {
      const row = [
        new Date(),
        sheetName,
        "KPI_ONBOARDED",
        `KPI "${kpiName}" onboarded with threshold: ${threshold}`,
        "SUCCESS",
        ""
      ];
      const lastRow = errorSheet.getLastRow() + 1;
      errorSheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
    }
    
    Logger.log(`[KPI ONBOARDING] Successfully onboarded: ${kpiName}`);
    
    return {
      success: true,
      message: `KPI "${kpiName}" has been onboarded for tracking`,
      sheetName: sheetName,
      kpiName: kpiName,
      threshold: threshold
    };
    
  } catch (error) {
    Logger.log(`[KPI ONBOARDING ERROR] ${error.message}`);
    return {
      success: false,
      message: `KPI onboarding failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Offboards a specific KPI from error tracking
 * @param {string} sheetName - The sheet name
 * @param {string} kpiName - The KPI name to offboard
 * @returns {object} Result of the operation
 */
function offboardKPITracking(sheetName, kpiName) {
  try {
    Logger.log(`[KPI OFFBOARDING] Offboarding KPI tracking: ${sheetName}.${kpiName}`);
    
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    
    if (!configSheet) {
      throw new Error("Configuration sheet not found");
    }
    
    const data = configSheet.getDataRange().getValues();
    const sheetRow = findSheetRowInConfig(data, sheetName);
    
    if (sheetRow === -1) {
      throw new Error(`Sheet "${sheetName}" not found in configuration`);
    }
    
    // Parse current KPIs and thresholds
    const kpisText = data[sheetRow][3];
    const thresholdsText = data[sheetRow][4];
    
    let kpiNames = kpisText ? kpisText.split(", ").filter(k => k.trim()) : [];
    let thresholds = thresholdsText ? JSON.parse(thresholdsText) : {};
    
    // Remove KPI
    kpiNames = kpiNames.filter(k => k !== kpiName);
    delete thresholds[kpiName];
    
    // Update config sheet
    configSheet.getRange(sheetRow + 1, 4).setValue(kpiNames.join(", "));
    configSheet.getRange(sheetRow + 1, 5).setValue(JSON.stringify(thresholds));
    
    // Log to error sheet
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    if (errorSheet) {
      const row = [
        new Date(),
        sheetName,
        "KPI_OFFBOARDED",
        `KPI "${kpiName}" has been offboarded from tracking`,
        "SUCCESS",
        ""
      ];
      const lastRow = errorSheet.getLastRow() + 1;
      errorSheet.getRange(lastRow, 1, 1, row.length).setValues([row]);
    }
    
    Logger.log(`[KPI OFFBOARDING] Successfully offboarded: ${kpiName}`);
    
    return {
      success: true,
      message: `KPI "${kpiName}" has been offboarded from tracking`,
      sheetName: sheetName,
      kpiName: kpiName
    };
    
  } catch (error) {
    Logger.log(`[KPI OFFBOARDING ERROR] ${error.message}`);
    return {
      success: false,
      message: `KPI offboarding failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Helper function to find sheet row in configuration data
 * @param {Array<Array>} data - The configuration data
 * @param {string} sheetName - The sheet name to find
 * @returns {number} The row index (0-based) or -1 if not found
 */
function findSheetRowInConfig(data, sheetName) {
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sheetName) {
      return i;
    }
  }
  return -1;
}
