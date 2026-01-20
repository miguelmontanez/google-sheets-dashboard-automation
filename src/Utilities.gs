/**
 * UTILITIES MODULE
 * Helper functions for configuration, logging, and common operations
 */

/**
 * Gets all active sheets from the dashboard configuration
 * @returns {Array<object>} Array of sheet configuration objects
 */
function getAllActiveSheets() {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    
    if (!configSheet) {
      return [];
    }
    
    const data = configSheet.getDataRange().getValues();
    const activeSheets = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === "ACTIVE") {
        activeSheets.push({
          sheetName: data[i][0],
          sheetUrl: data[i][1],
          status: data[i][2],
          kpis: data[i][3].split(", "),
          thresholds: JSON.parse(data[i][4]),
          onboardDate: data[i][5],
          lastSyncDate: data[i][6]
        });
      }
    }
    
    return activeSheets;
    
  } catch (error) {
    Logger.log(`[UTILITIES ERROR] ${error.message}`);
    return [];
  }
}

/**
 * Gets all error logs for a specific sheet
 * @param {string} sheetName - The name of the sheet
 * @returns {Array<object>} Array of error log objects
 */
function getSheetErrorLogs(sheetName) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    
    if (!errorSheet) {
      return [];
    }
    
    const data = errorSheet.getDataRange().getValues();
    const errors = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === sheetName) {
        errors.push({
          timestamp: data[i][0],
          sheetName: data[i][1],
          errorType: data[i][2],
          errorMessage: data[i][3],
          status: data[i][4],
          resolution: data[i][5]
        });
      }
    }
    
    return errors;
    
  } catch (error) {
    Logger.log(`[UTILITIES ERROR] ${error.message}`);
    return [];
  }
}

/**
 * Gets error summary statistics
 * @returns {object} Summary statistics of all errors
 */
function getErrorSummary() {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    
    if (!errorSheet) {
      return { totalErrors: 0, byType: {}, bySeverity: {} };
    }
    
    const data = errorSheet.getDataRange().getValues();
    const summary = {
      totalErrors: 0,
      byType: {},
      bySeverity: {},
      bySheet: {}
    };
    
    for (let i = 1; i < data.length; i++) {
      const errorType = data[i][2];
      const severity = data[i][4];
      const sheetName = data[i][1];
      
      summary.totalErrors++;
      
      summary.byType[errorType] = (summary.byType[errorType] || 0) + 1;
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1;
      summary.bySheet[sheetName] = (summary.bySheet[sheetName] || 0) + 1;
    }
    
    return summary;
    
  } catch (error) {
    Logger.log(`[UTILITIES ERROR] ${error.message}`);
    return { totalErrors: 0, byType: {}, bySeverity: {} };
  }
}

/**
 * Clears all error logs (use with caution)
 * @param {string} sheetName - If provided, clears logs only for this sheet. If null, clears all.
 * @returns {object} Result of the operation
 */
function clearErrorLogs(sheetName = null) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    
    if (!errorSheet) {
      return { success: false, message: "Error logs sheet not found" };
    }
    
    const data = errorSheet.getDataRange().getValues();
    const rowsToDelete = [];
    
    if (sheetName) {
      // Delete only logs for this sheet
      for (let i = data.length - 1; i > 0; i--) {
        if (data[i][1] === sheetName) {
          rowsToDelete.push(i + 1);
        }
      }
    } else {
      // Delete all logs except header
      for (let i = data.length - 1; i > 0; i--) {
        rowsToDelete.push(i + 1);
      }
    }
    
    for (const rowNum of rowsToDelete) {
      errorSheet.deleteRow(rowNum);
    }
    
    Logger.log(`[UTILITIES] Cleared ${rowsToDelete.length} error log entries`);
    
    return {
      success: true,
      message: `Cleared ${rowsToDelete.length} error log entries`,
      rowsCleared: rowsToDelete.length
    };
    
  } catch (error) {
    Logger.log(`[UTILITIES ERROR] ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Updates the last sync date for a sheet
 * @param {string} sheetName - The name of the sheet
 * @returns {boolean} Success status
 */
function updateLastSyncDate(sheetName) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = dashboardSpreadsheet.getSheetByName("DashboardConfig");
    
    if (!configSheet) {
      return false;
    }
    
    const data = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sheetName) {
        configSheet.getRange(i + 1, 7).setValue(new Date());
        Logger.log(`[UTILITIES] Updated last sync date for ${sheetName}`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log(`[UTILITIES ERROR] ${error.message}`);
    return false;
  }
}

/**
 * Sends a notification about errors
 * @param {string} recipientEmail - Email address to send notification to
 * @param {object} errorSummary - Summary of errors found
 */
function sendErrorNotification(recipientEmail, errorSummary) {
  try {
    if (!recipientEmail) {
      Logger.log("[NOTIFICATION] No recipient email provided");
      return;
    }
    
    const subject = `Dashboard Error Report - ${new Date().toLocaleDateString()}`;
    
    let emailBody = "Dashboard Error Summary\n";
    emailBody += "========================\n\n";
    emailBody += `Total Errors: ${errorSummary.totalErrors}\n\n`;
    
    emailBody += "Errors by Type:\n";
    for (const [type, count] of Object.entries(errorSummary.byType)) {
      emailBody += `  - ${type}: ${count}\n`;
    }
    
    emailBody += "\nErrors by Severity:\n";
    for (const [severity, count] of Object.entries(errorSummary.bySeverity)) {
      emailBody += `  - ${severity}: ${count}\n`;
    }
    
    emailBody += "\nErrors by Sheet:\n";
    for (const [sheet, count] of Object.entries(errorSummary.bySheet)) {
      emailBody += `  - ${sheet}: ${count}\n`;
    }
    
    GmailApp.sendEmail(recipientEmail, subject, emailBody);
    Logger.log(`[NOTIFICATION] Error report sent to ${recipientEmail}`);
    
  } catch (error) {
    Logger.log(`[NOTIFICATION ERROR] ${error.message}`);
  }
}

/**
 * Creates a scheduled trigger for error checking
 * @param {number} intervalMinutes - Interval in minutes (default: 30)
 * @returns {object} Result of the operation
 */
function createErrorCheckTrigger(intervalMinutes = 30) {
  try {
    // Remove any existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === 'checkAllSheetsForErrors') {
        ScriptApp.deleteTrigger(trigger);
      }
    }
    
    // Create new trigger
    if (intervalMinutes === 5) {
      ScriptApp.newTrigger('checkAllSheetsForErrors').timeBased().everyMinutes(5).create();
    } else if (intervalMinutes === 15) {
      ScriptApp.newTrigger('checkAllSheetsForErrors').timeBased().everyMinutes(15).create();
    } else if (intervalMinutes === 30) {
      ScriptApp.newTrigger('checkAllSheetsForErrors').timeBased().everyMinutes(30).create();
    } else {
      return { success: false, message: "Interval must be 5, 15, or 30 minutes" };
    }
    
    Logger.log(`[TRIGGER] Error check trigger created for every ${intervalMinutes} minutes`);
    
    return {
      success: true,
      message: `Error check trigger created for every ${intervalMinutes} minutes`,
      interval: intervalMinutes
    };
    
  } catch (error) {
    Logger.log(`[TRIGGER ERROR] ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Gets all scheduled triggers
 * @returns {Array<object>} Array of trigger information
 */
function getActiveTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const triggerInfo = [];
    
    for (const trigger of triggers) {
      triggerInfo.push({
        handlerFunction: trigger.getHandlerFunction(),
        triggerSource: trigger.getTriggerSource(),
        eventType: trigger.getEventType()
      });
    }
    
    return triggerInfo;
    
  } catch (error) {
    Logger.log(`[TRIGGER ERROR] ${error.message}`);
    return [];
  }
}

/**
 * Exports error logs to CSV format
 * @param {string} sheetName - If provided, exports logs only for this sheet
 * @returns {string} CSV formatted string
 */
function exportErrorLogsAsCSV(sheetName = null) {
  try {
    const dashboardSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorSheet = dashboardSpreadsheet.getSheetByName("ErrorLogs");
    
    if (!errorSheet) {
      return "";
    }
    
    let csv = "";
    const data = errorSheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (i > 0 && sheetName && data[i][1] !== sheetName) {
        continue;
      }
      
      const row = data[i].map(cell => `"${cell}"`).join(",");
      csv += row + "\n";
    }
    
    return csv;
    
  } catch (error) {
    Logger.log(`[EXPORT ERROR] ${error.message}`);
    return "";
  }
}
