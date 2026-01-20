# API Reference - Google Sheets Dashboard Scripts

## Table of Contents

1. [Onboarding Module](#onboarding-module)
2. [Offboarding Module](#offboarding-module)
3. [Error Handling Module](#error-handling-module)
4. [Utilities Module](#utilities-module)

---

## Onboarding Module

### `onboardSheet(sheetUrl, sheetName, kpiNames, kpiThresholds)`

Adds a new Google Sheet to the dashboard and sets up KPI error tracking.

**Parameters:**
- `sheetUrl` (string, required): Full URL of the Google Sheet
  - Format: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- `sheetName` (string, required): Identifier for the sheet in the dashboard
  - Used in `DashboardConfig` and `ErrorLogs` sheets
  - Should be descriptive but concise
- `kpiNames` (Array<string>, required): Column headers containing KPI data
  - Must match exactly how they appear in row 1 of the sheet
  - Case-sensitive
  - Example: `["Revenue", "Cost", "Margin"]`
- `kpiThresholds` (object, required): Minimum acceptable values for each KPI
  - Keys must match `kpiNames`
  - Values are numbers (numeric thresholds)
  - Example: `{"Revenue": 50000, "Cost": 25000, "Margin": 30}`

**Returns:**
```javascript
{
  success: true,
  message: "Sheet \"Q1 Report\" has been successfully onboarded to the dashboard",
  sheetName: "Q1 Report"
}
```

**Throws:**
- Error if sheet URL is invalid or inaccessible
- Error if required KPI columns don't exist
- Error if parameters are missing

**Example:**
```javascript
onboardSheet(
  "https://docs.google.com/spreadsheets/d/1A-_P4kCgZBzC-DP9a7jxKL_8m9l/edit",
  "Sales Q1 2026",
  ["Revenue", "Conversion_Rate", "Customer_Count"],
  {
    "Revenue": 100000,
    "Conversion_Rate": 2.5,
    "Customer_Count": 500
  }
)
```

---

### `validateSheetStructure(sheet, requiredColumns)`

Verifies that a sheet contains all required KPI columns.

**Parameters:**
- `sheet` (Sheet, required): Google Sheet object
- `requiredColumns` (Array<string>, required): Column names to verify

**Returns:**
- `true` if all columns exist
- Throws error if validation fails

**Example:**
```javascript
const sheet = SpreadsheetApp.openByUrl("https://...")
validateSheetStructure(sheet, ["Revenue", "Cost"])
```

---

### `getOrCreateConfigSheet(spreadsheet)`

Gets the `DashboardConfig` sheet or creates it if it doesn't exist.

**Parameters:**
- `spreadsheet` (Spreadsheet, required): The dashboard spreadsheet

**Returns:**
- Sheet object for `DashboardConfig`

**Internal use:** Called automatically by `onboardSheet()`

---

### `registerSheetConfiguration(configSheet, sheetConfig)`

Registers a sheet's configuration in the `DashboardConfig` sheet.

**Parameters:**
- `configSheet` (Sheet, required): The configuration sheet
- `sheetConfig` (object, required): Configuration object with:
  - `sheetName`: (string)
  - `sheetUrl`: (string)
  - `kpiNames`: (Array<string>)
  - `kpiThresholds`: (object)
  - `status`: (string) "ACTIVE" or "OFFBOARDED"
  - `onboardDate`: (Date)
  - `lastSyncDate`: (Date or null)

**Returns:**
- void (modifies sheet directly)

**Internal use:** Called automatically by `onboardSheet()`

---

### `initializeErrorTracking(sheetName, kpiNames)`

Sets up error tracking for a newly onboarded sheet.

**Parameters:**
- `sheetName` (string, required): Name of the sheet
- `kpiNames` (Array<string>, required): KPI names to track

**Returns:**
- void

**Internal use:** Called automatically by `onboardSheet()`

---

### `getOrCreateErrorLogsSheet(spreadsheet)`

Gets the `ErrorLogs` sheet or creates it if it doesn't exist.

**Parameters:**
- `spreadsheet` (Spreadsheet, required): The dashboard spreadsheet

**Returns:**
- Sheet object for `ErrorLogs`

**Internal use:** Called automatically during setup

---

## Offboarding Module

### `offboardSheet(sheetName, archiveData = true)`

Removes a sheet from the dashboard, optionally archiving error logs first.

**Parameters:**
- `sheetName` (string, required): Name of the sheet to offboard
- `archiveData` (boolean, optional, default: true): Whether to archive error logs

**Returns:**
```javascript
{
  success: true,
  message: "Sheet \"Q1 Report\" has been successfully offboarded from the dashboard",
  sheetName: "Q1 Report",
  archivedLogs: true
}
```

**What happens:**
1. Validates the sheet exists in configuration
2. Archives error logs (if requested)
3. Removes error log entries
4. Updates configuration status to "OFFBOARDED"
5. Records offboard date

**Example:**
```javascript
// Archive logs before removing
offboardSheet("Q1 Report", true)

// Remove without archiving (not recommended)
offboardSheet("Q1 Report", false)
```

---

### `findSheetInConfig(configSheet, sheetName)`

Finds a sheet in the configuration.

**Parameters:**
- `configSheet` (Sheet, required): The `DashboardConfig` sheet
- `sheetName` (string, required): Name to search for

**Returns:**
- (number) Row number (1-indexed) if found, or -1 if not found

**Internal use:** Used by offboarding and validation functions

---

### `archiveSheetErrorLogs(spreadsheet, sheetName)`

Copies all error logs for a sheet to the archive sheet.

**Parameters:**
- `spreadsheet` (Spreadsheet, required): The dashboard spreadsheet
- `sheetName` (string, required): Name of the sheet

**Returns:**
- void (modifies sheets directly)

**Internal use:** Called by `offboardSheet()` when archiving

---

### `removeSheetErrorLogs(spreadsheet, sheetName)`

Deletes all error log entries for a sheet.

**Parameters:**
- `spreadsheet` (Spreadsheet, required): The dashboard spreadsheet
- `sheetName` (string, required): Name of the sheet

**Returns:**
- void (modifies sheet directly)

**Internal use:** Called by `offboardSheet()` after archiving

---

### `validateOffboarding(sheetName)`

Pre-check to see if a sheet can be offboarded and its current state.

**Parameters:**
- `sheetName` (string, required): Name of the sheet to validate

**Returns:**
```javascript
{
  valid: true,
  sheetName: "Q1 Report",
  currentStatus: "ACTIVE",
  errorLogsCount: 5
}
```

Or on error:
```javascript
{
  valid: false,
  issues: ["Sheet not found in configuration"]
}
```

**Example:**
```javascript
const validation = validateOffboarding("Q1 Report")
if (validation.valid) {
  offboardSheet("Q1 Report", true)
}
```

---

## Error Handling Module

### `checkAllSheetsForErrors()`

Checks all active sheets for KPI threshold violations. Called automatically every 30 minutes.

**Parameters:**
- None

**Returns:**
```javascript
{
  total: 3,
  sheets: [
    {
      sheetName: "Q1 Report",
      errorCount: 2,
      errors: [
        {
          sheetName: "Q1 Report",
          kpiName: "Revenue",
          currentValue: 45000,
          threshold: 50000,
          rowNumber: 5,
          severity: "MEDIUM",
          timestamp: Date
        }
      ]
    }
  ],
  timestamp: Date
}
```

**Example:**
```javascript
const summary = checkAllSheetsForErrors()
Logger.log(`Found ${summary.total} errors`)
```

---

### `checkSheetForErrors(sheetUrl, sheetName, kpiNames, kpiThresholds)`

Checks a single sheet for KPI violations.

**Parameters:**
- `sheetUrl` (string, required): URL of the sheet
- `sheetName` (string, required): Name identifier for the sheet
- `kpiNames` (Array<string>, required): KPI column names
- `kpiThresholds` (object, required): Minimum values for each KPI

**Returns:**
- Array of error objects (empty if no errors)

**Internal use:** Called by `checkAllSheetsForErrors()`

---

### `calculateErrorSeverity(value, threshold)`

Determines error severity based on how far below threshold.

**Parameters:**
- `value` (number, required): Current KPI value
- `threshold` (number, required): Threshold value

**Returns:**
- (string) One of: "CRITICAL", "HIGH", "MEDIUM", "LOW"

**Severity Calculation:**
- CRITICAL: value ≤ threshold × 0.5 (50%+ below)
- HIGH: value ≤ threshold × 0.7 (30-50% below)
- MEDIUM: value ≤ threshold × 0.85 (15-30% below)
- LOW: value > threshold × 0.85 (<15% below)

**Example:**
```javascript
calculateErrorSeverity(25000, 50000) // Returns "CRITICAL" (50% below)
calculateErrorSeverity(35000, 50000) // Returns "HIGH" (30% below)
```

---

### `logErrorToSheet(error)`

Creates a new row in `ErrorLogs` for an error and color-codes it by severity.

**Parameters:**
- `error` (object, required): Error object with:
  - `timestamp`: Date
  - `sheetName`: string
  - `kpiName`: string
  - `currentValue`: number
  - `threshold`: number
  - `rowNumber`: number
  - `severity`: string

**Returns:**
- void (modifies sheet directly)

**Internal use:** Called by `checkSheetForErrors()`

---

### `formatErrorRow(sheet, rowNum, severity)`

Formats an error row with background color based on severity.

**Parameters:**
- `sheet` (Sheet, required): The error logs sheet
- `rowNum` (number, required): Row number (1-indexed)
- `severity` (string, required): "CRITICAL", "HIGH", "MEDIUM", or "LOW"

**Color mapping:**
- CRITICAL → Red (#ff0000)
- HIGH → Orange (#ff9900)
- MEDIUM → Yellow (#ffff00)
- LOW → Light Orange (#ffcc99)

**Returns:**
- void (modifies sheet directly)

**Internal use:** Called by `logErrorToSheet()`

---

### `onboardKPITracking(sheetName, kpiName, threshold)`

Adds a new KPI to an existing sheet's error tracking.

**Parameters:**
- `sheetName` (string, required): Name of the sheet
- `kpiName` (string, required): New KPI column name
- `threshold` (number, required): Minimum acceptable value

**Returns:**
```javascript
{
  success: true,
  message: "KPI \"MarketShare\" has been onboarded for tracking",
  sheetName: "Q1 Report",
  kpiName: "MarketShare",
  threshold: 15
}
```

**Example:**
```javascript
onboardKPITracking("Q1 Report", "MarketShare", 15)
```

---

### `offboardKPITracking(sheetName, kpiName)`

Removes a KPI from error tracking (keeps sheet active).

**Parameters:**
- `sheetName` (string, required): Name of the sheet
- `kpiName` (string, required): KPI to remove

**Returns:**
```javascript
{
  success: true,
  message: "KPI \"MarketShare\" has been offboarded from tracking",
  sheetName: "Q1 Report",
  kpiName: "MarketShare"
}
```

**Example:**
```javascript
offboardKPITracking("Q1 Report", "MarketShare")
```

---

### `findSheetRowInConfig(data, sheetName)`

Finds a sheet in parsed configuration data.

**Parameters:**
- `data` (Array<Array>, required): Parsed data from config sheet
- `sheetName` (string, required): Name to find

**Returns:**
- (number) Row index (0-based) or -1 if not found

**Internal use:** Used by KPI tracking functions

---

## Utilities Module

### `getAllActiveSheets()`

Returns all currently active sheets in the dashboard.

**Parameters:**
- None

**Returns:**
```javascript
[
  {
    sheetName: "Q1 Report",
    sheetUrl: "https://docs.google.com/spreadsheets/d/...",
    status: "ACTIVE",
    kpis: ["Revenue", "Cost", "Margin"],
    thresholds: {Revenue: 100000, Cost: 50000, Margin: 30},
    onboardDate: Date,
    lastSyncDate: Date
  }
]
```

**Example:**
```javascript
const active = getAllActiveSheets()
active.forEach(sheet => {
  Logger.log(`${sheet.sheetName}: ${sheet.kpis.length} KPIs tracked`)
})
```

---

### `getSheetErrorLogs(sheetName)`

Gets all error log entries for a specific sheet.

**Parameters:**
- `sheetName` (string, required): Name of the sheet

**Returns:**
```javascript
[
  {
    timestamp: Date,
    sheetName: "Q1 Report",
    errorType: "KPI_THRESHOLD_VIOLATION",
    errorMessage: "Revenue: 45000 (threshold: 50000)",
    status: "MEDIUM",
    resolution: ""
  }
]
```

**Example:**
```javascript
const logs = getSheetErrorLogs("Q1 Report")
Logger.log(`${logs.length} errors for Q1 Report`)
```

---

### `getErrorSummary()`

Gets statistical summary of all errors.

**Parameters:**
- None

**Returns:**
```javascript
{
  totalErrors: 15,
  byType: {
    KPI_THRESHOLD_VIOLATION: 15,
    KPI_ONBOARDED: 2,
    KPI_OFFBOARDED: 1
  },
  bySeverity: {
    CRITICAL: 3,
    HIGH: 5,
    MEDIUM: 4,
    LOW: 3
  },
  bySheet: {
    "Q1 Report": 8,
    "Q2 Report": 7
  }
}
```

**Example:**
```javascript
const summary = getErrorSummary()
Logger.log(`Critical errors: ${summary.bySeverity.CRITICAL}`)
```

---

### `clearErrorLogs(sheetName = null)`

Deletes error log entries (use with caution!).

**Parameters:**
- `sheetName` (string, optional): If provided, delete only logs for this sheet. If null, delete all.

**Returns:**
```javascript
{
  success: true,
  message: "Cleared 15 error log entries",
  rowsCleared: 15
}
```

**Example:**
```javascript
// Clear all logs
clearErrorLogs()

// Clear only for Q1 Report
clearErrorLogs("Q1 Report")
```

---

### `updateLastSyncDate(sheetName)`

Updates the `LastSyncDate` for a sheet.

**Parameters:**
- `sheetName` (string, required): Name of the sheet

**Returns:**
- (boolean) true if successful, false if sheet not found

**Internal use:** Called after checking sheets for errors

---

### `sendErrorNotification(recipientEmail, errorSummary)`

Sends an email with error report summary.

**Parameters:**
- `recipientEmail` (string, required): Email address to send to
- `errorSummary` (object, required): Summary object from `getErrorSummary()`

**Returns:**
- void

**Requires:** Email permissions enabled in Apps Script

**Example:**
```javascript
const summary = getErrorSummary()
sendErrorNotification("admin@company.com", summary)
```

---

### `createErrorCheckTrigger(intervalMinutes = 30)`

Sets up scheduled automatic error checking.

**Parameters:**
- `intervalMinutes` (number, optional, default: 30): Check frequency
  - Supported values: 5, 15, 30

**Returns:**
```javascript
{
  success: true,
  message: "Error check trigger created for every 30 minutes",
  interval: 30
}
```

**Example:**
```javascript
createErrorCheckTrigger(5)   // Every 5 minutes
createErrorCheckTrigger(15)  // Every 15 minutes
createErrorCheckTrigger(30)  // Every 30 minutes
```

---

### `getActiveTriggers()`

Lists all scheduled triggers.

**Parameters:**
- None

**Returns:**
```javascript
[
  {
    handlerFunction: "checkAllSheetsForErrors",
    triggerSource: "SPREADSHEET",
    eventType: "ON_CHANGE"
  }
]
```

---

### `exportErrorLogsAsCSV(sheetName = null)`

Exports error logs in CSV format.

**Parameters:**
- `sheetName` (string, optional): If provided, export only logs for this sheet. If null, export all.

**Returns:**
- (string) CSV formatted data

**Example:**
```javascript
// Export all logs
const csv = exportErrorLogsAsCSV()

// Export only Q1 Report
const csv = exportErrorLogsAsCSV("Q1 Report")

// Save to file
DriveApp.createFile("error-logs.csv", csv, MimeType.CSV)
```

---

## Global Setup Function

### `setupDashboard()`

Initializes the dashboard with all required sheets and triggers.

**Parameters:**
- None

**Returns:**
- void (logs setup progress)

**What it does:**
1. Creates/verifies `DashboardConfig` sheet
2. Creates/verifies `ErrorLogs` sheet
3. Sets up error check trigger (every 30 minutes)

**Example:**
```javascript
// Run this once when setting up the dashboard
setupDashboard()
```

---

## Error Handling

All functions include error handling and log to the Apps Script execution log.

**To view logs:**
1. Open Apps Script IDE
2. Click Extensions > Apps Script
3. View Execution Log

**Error log format:**
```
[MODULE_NAME] Message
[ERROR_HANDLING ERROR] Error message
```

---

## Data Types

### Sheet Configuration Object
```javascript
{
  sheetName: string,
  sheetUrl: string,
  status: "ACTIVE" | "OFFBOARDED",
  kpis: string[],
  thresholds: {[kpiName: string]: number},
  onboardDate: Date,
  lastSyncDate: Date | null
}
```

### Error Object
```javascript
{
  timestamp: Date,
  sheetName: string,
  errorType: string,
  errorMessage: string,
  status: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SUCCESS",
  resolution: string
}
```

### Error Severity
```javascript
"CRITICAL"  // 50%+ below threshold
"HIGH"      // 30-50% below threshold
"MEDIUM"    // 15-30% below threshold
"LOW"       // <15% below threshold
```

---

## Rate Limiting & Quotas

Google Apps Script has quotas for:
- Spreadsheet operations: 500/minute
- Email sends: 100/day
- Script execution: 6 minutes maximum

The dashboard checks are optimized to stay within these limits.

---

## Version

API Version: 1.0.0
Last Updated: 2026-01-19
