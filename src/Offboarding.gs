/**
 * OFFBOARDING MODULE
 * Handles the process of removing Google Sheets from the dashboard
 * Archives error logs, cleans up configuration, and performs final validation
 */

/**
 * Main offboarding function to remove a sheet from the dashboard
 * @param {string} sheetName - The name/identifier of the sheet to offboard
 * @param {boolean} archiveData - Whether to archive the error logs before removal (default: true)
 * @returns {object} Offboarding result with status and message
 */
function offboardSheet(sheetName, archiveData = true) {
  try {
    Logger.log(`[OFFBOARDING] Starting offboarding for sheet: ${sheetName}`);
    
    // Validate input
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error("Invalid sheet name provided");
    }
    
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if sheet exists in configuration
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    if (!configSheet) {
      throw new Error("Dashboard configuration sheet not found");
    }
    
    // Find the sheet in configuration
    const sheetRow = findSheetInConfig(configSheet, sheetName);
    if (sheetRow === -1) {
      throw new Error(`Sheet "${sheetName}" not found in dashboard configuration`);
    }
    
    // Archive error logs if requested
    if (archiveData) {
      archiveSheetErrorLogs(dashboardSpreadsheet, sheetName);
    }
    
    // Remove associated error logs
    removeSheetErrorLogs(dashboardSpreadsheet, sheetName);
    
    // Update configuration status to OFFBOARDED
    configSheet.getRange(sheetRow, 3).setValue("OFFBOARDED"); // Status column
    configSheet.getRange(sheetRow, 8).setValue(new Date()); // OffboardDate column
    
    Logger.log(`[OFFBOARDING] Successfully offboarded sheet: ${sheetName}`);
    
    return {
      success: true,
      message: `Sheet "${sheetName}" has been successfully offboarded from the dashboard`,
      sheetName: sheetName,
      archivedLogs: archiveData
    };
    
  } catch (error) {
    Logger.log(`[OFFBOARDING ERROR] ${error.message}`);
    return {
      success: false,
      message: `Offboarding failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Finds a sheet in the configuration
 * @param {Sheet} configSheet - The configuration sheet
 * @param {string} sheetName - The name to search for
 * @returns {number} The row number (1-indexed) or -1 if not found
 */
function findSheetInConfig(configSheet, sheetName) {
  const data = configSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sheetName) {
      return i + 1; // getRange uses 1-indexed rows
    }
  }
  
  return -1;
}

/**
 * Archives error logs for a sheet before offboarding
 * @param {Spreadsheet} spreadsheet - The dashboard spreadsheet
 * @param {string} sheetName - The name of the sheet
 */
function archiveSheetErrorLogs(spreadsheet, sheetName) {
  try {
    Logger.log(`[ARCHIVE] Archiving error logs for sheet: ${sheetName}`);
    
    const errorSheet = spreadsheet.getSheetByName("ErrorLogs");
    if (!errorSheet) {
      Logger.log("[ARCHIVE] No error logs sheet found");
      return;
    }
    
    // Create archive sheet if it doesn't exist
    let archiveSheet = spreadsheet.getSheetByName("ErrorLogs_Archive");
    if (!archiveSheet) {
      archiveSheet = spreadsheet.insertSheet("ErrorLogs_Archive");
      
      // Copy headers from error sheet
      const headers = errorSheet.getRange(1, 1, 1, errorSheet.getLastColumn()).getValues();
      archiveSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
      archiveSheet.setFrozenRows(1);
    }
    
    // Find all rows for this sheet
    const data = errorSheet.getDataRange().getValues();
    const rowsToArchive = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === sheetName) {
        rowsToArchive.push(i);
      }
    }
    
    // Copy rows to archive sheet
    for (const rowIndex of rowsToArchive) {
      const rowData = errorSheet.getRange(rowIndex + 1, 1, 1, errorSheet.getLastColumn()).getValues();
      const lastArchiveRow = archiveSheet.getLastRow() + 1;
      archiveSheet.getRange(lastArchiveRow, 1, 1, rowData[0].length).setValues(rowData);
    }
    
    Logger.log(`[ARCHIVE] Archived ${rowsToArchive.length} error log entries`);
    
  } catch (error) {
    Logger.log(`[ARCHIVE ERROR] ${error.message}`);
  }
}

/**
 * Removes all error logs for a sheet
 * @param {Spreadsheet} spreadsheet - The dashboard spreadsheet
 * @param {string} sheetName - The name of the sheet
 */
function removeSheetErrorLogs(spreadsheet, sheetName) {
  try {
    Logger.log(`[CLEANUP] Removing error logs for sheet: ${sheetName}`);
    
    const errorSheet = spreadsheet.getSheetByName("ErrorLogs");
    if (!errorSheet) {
      return;
    }
    
    const data = errorSheet.getDataRange().getValues();
    const rowsToDelete = [];
    
    // Find all rows for this sheet (iterate backwards to avoid index shifts)
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][1] === sheetName) {
        rowsToDelete.push(i + 1); // Convert to 1-indexed
      }
    }
    
    // Delete rows in reverse order
    for (const rowNum of rowsToDelete) {
      errorSheet.deleteRow(rowNum);
    }
    
    Logger.log(`[CLEANUP] Deleted ${rowsToDelete.length} error log entries`);
    
  } catch (error) {
    Logger.log(`[CLEANUP ERROR] ${error.message}`);
  }
}

/**
 * Performs validation checks before offboarding
 * @param {string} sheetName - The name of the sheet
 * @returns {object} Validation result
 */
function validateOffboarding(sheetName) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    
    if (!configSheet) {
      return {
        valid: false,
        issues: ["Dashboard configuration sheet not found"]
      };
    }
    
    const sheetRow = findSheetInConfig(configSheet, sheetName);
    if (sheetRow === -1) {
      return {
        valid: false,
        issues: [`Sheet "${sheetName}" not found in configuration`]
      };
    }
    
    const status = configSheet.getRange(sheetRow, 3).getValue();
    if (status === "OFFBOARDED") {
      return {
        valid: false,
        issues: [`Sheet "${sheetName}" is already offboarded`]
      };
    }
    
    // Count associated error logs
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    let errorCount = 0;
    
    if (errorSheet) {
      const data = errorSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === sheetName) {
          errorCount++;
        }
      }
    }
    
    return {
      valid: true,
      sheetName: sheetName,
      currentStatus: status,
      errorLogsCount: errorCount
    };
    
  } catch (error) {
    Logger.log(`[VALIDATION ERROR] ${error.message}`);
    return {
      valid: false,
      issues: [error.message]
    };
  }
}
