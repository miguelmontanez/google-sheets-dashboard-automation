# Google Sheets Dashboard Scripts - Complete Implementation Guide

## Project Overview

This project provides a complete Google Apps Script solution for managing a dashboard that integrates multiple Google Sheets with automated error handling based on client KPIs.

**Key Features:**
- 🔄 Onboarding/Offboarding of sheets
- 📊 KPI threshold monitoring
- 🚨 Automated error detection and logging
- 📈 Error severity classification
- 💾 Error log archival
- 📧 Email notifications
- ⏰ Scheduled error checks

---

## Project Structure

```
app-script/
├── src/
│   ├── Onboarding.gs          # Sheet onboarding logic
│   ├── Offboarding.gs         # Sheet offboarding logic
│   ├── ErrorHandling.gs       # KPI monitoring and error creation
│   ├── Utilities.gs           # Helper functions
│   └── Main.gs                # Entry points and examples
├── config/
│   └── config.json            # Configuration reference
├── docs/
│   ├── SETUP.md               # Setup instructions
│   ├── API_REFERENCE.md       # Function documentation
│   └── TROUBLESHOOTING.md     # Common issues
└── README.md                  # This file
```

---

## Quick Start

### 1. Initial Setup

In Google Apps Script IDE, run the setup function once:

```javascript
setupDashboard()
```

This will:
- Create the `DashboardConfig` sheet
- Create the `ErrorLogs` sheet
- Set up the automated error check trigger

### 2. Onboard Your First Sheet

```javascript
onboardSheet(
  "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit",
  "Q1 Sales Report",
  ["Revenue", "Conversion_Rate", "Customer_Acquisition"],
  {
    "Revenue": 50000,
    "Conversion_Rate": 3.5,
    "Customer_Acquisition": 100
  }
)
```

**Parameters:**
- `sheetUrl`: The full URL of the Google Sheet
- `sheetName`: A friendly identifier for the sheet (used in dashboard)
- `kpiNames`: Array of column headers that contain KPI values
- `kpiThresholds`: Object mapping KPI names to their minimum acceptable values

### 3. Monitor Errors

The dashboard automatically:
- Checks all sheets every 30 minutes
- Creates a row in `ErrorLogs` when a KPI drops below threshold
- Color-codes errors by severity (red=critical, orange=high, etc.)

View current errors:

```javascript
const errors = getSheetErrorLogs("Q1 Sales Report")
console.log(errors)
```

### 4. Offboard a Sheet

When you're done with a sheet:

```javascript
offboardSheet("Q1 Sales Report", true) // true = archive error logs first
```

---

## Core Modules

### 1. Onboarding Module (`Onboarding.gs`)

**Main Functions:**

#### `onboardSheet(sheetUrl, sheetName, kpiNames, kpiThresholds)`

Adds a new sheet to the dashboard and sets up error tracking.

```javascript
const result = onboardSheet(
  "https://docs.google.com/spreadsheets/d/SHEET_ID/edit",
  "Q1 Report",
  ["Revenue", "Cost"],
  {"Revenue": 1000, "Cost": 500}
)
// Returns: {success: true, message: "Sheet \"Q1 Report\" has been successfully onboarded..."}
```

**What happens:**
1. Validates the sheet URL and accessibility
2. Checks that all required KPI columns exist
3. Registers the sheet in `DashboardConfig`
4. Initializes error tracking records

#### `validateSheetStructure(sheet, requiredColumns)`

Checks if a sheet has all required columns.

**Throws error if:**
- Sheet doesn't exist
- Required columns are missing

---

### 2. Offboarding Module (`Offboarding.gs`)

**Main Functions:**

#### `offboardSheet(sheetName, archiveData = true)`

Removes a sheet from the dashboard.

```javascript
const result = offboardSheet("Q1 Report", true)
// Returns: {success: true, message: "Sheet \"Q1 Report\" has been successfully offboarded..."}
```

**What happens:**
1. Archives all error logs (if requested)
2. Removes error log entries
3. Updates status to "OFFBOARDED" in config
4. Records offboard date

#### `validateOffboarding(sheetName)`

Pre-check before offboarding to see current state.

```javascript
const validation = validateOffboarding("Q1 Report")
// Returns: {
//   valid: true,
//   sheetName: "Q1 Report",
//   currentStatus: "ACTIVE",
//   errorLogsCount: 5
// }
```

---

### 3. Error Handling Module (`ErrorHandling.gs`)

**Main Functions:**

#### `checkAllSheetsForErrors()`

Checks all active sheets for KPI violations. Called automatically every 30 minutes.

```javascript
const summary = checkAllSheetsForErrors()
// Returns: {
//   total: 3,
//   sheets: [
//     {
//       sheetName: "Q1 Report",
//       errorCount: 2,
//       errors: [
//         {
//           kpiName: "Revenue",
//           currentValue: 45000,
//           threshold: 50000,
//           severity: "MEDIUM"
//         }
//       ]
//     }
//   ]
// }
```

#### `onboardKPITracking(sheetName, kpiName, threshold)`

Adds a new KPI to an existing sheet's error tracking.

```javascript
const result = onboardKPITracking("Q1 Report", "MarketShare", 15)
// Adds "MarketShare" KPI with threshold of 15 to the "Q1 Report" sheet
```

#### `offboardKPITracking(sheetName, kpiName)`

Removes a KPI from error tracking without offboarding the entire sheet.

```javascript
const result = offboardKPITracking("Q1 Report", "MarketShare")
// Removes "MarketShare" from tracking but keeps sheet active
```

**Error Severity Classification:**
- **CRITICAL**: Value is 50%+ below threshold (RED)
- **HIGH**: Value is 30-50% below threshold (ORANGE)
- **MEDIUM**: Value is 15-30% below threshold (YELLOW)
- **LOW**: Value is <15% below threshold (LIGHT ORANGE)

---

### 4. Utilities Module (`Utilities.gs`)

**Main Functions:**

#### `getAllActiveSheets()`

Returns all currently active sheets.

```javascript
const activeSheets = getAllActiveSheets()
// Returns: [
//   {
//     sheetName: "Q1 Report",
//     sheetUrl: "https://...",
//     status: "ACTIVE",
//     kpis: ["Revenue", "Cost"],
//     thresholds: {Revenue: 1000, Cost: 500},
//     onboardDate: Date,
//     lastSyncDate: Date
//   }
// ]
```

#### `getErrorSummary()`

Gets statistics on all errors.

```javascript
const summary = getErrorSummary()
// Returns: {
//   totalErrors: 15,
//   byType: {KPI_THRESHOLD_VIOLATION: 15, KPI_ONBOARDED: 2, ...},
//   bySeverity: {CRITICAL: 3, HIGH: 5, MEDIUM: 4, LOW: 3},
//   bySheet: {"Q1 Report": 8, "Q2 Report": 7}
// }
```

#### `createErrorCheckTrigger(intervalMinutes)`

Sets up scheduled error checking.

```javascript
// Check every 30 minutes (5, 15, or 30 supported)
createErrorCheckTrigger(30)
```

#### `sendErrorNotification(email, errorSummary)`

Sends an email report of errors.

```javascript
const summary = getErrorSummary()
sendErrorNotification("admin@company.com", summary)
```

#### `exportErrorLogsAsCSV(sheetName)`

Exports error logs in CSV format.

```javascript
const csv = exportErrorLogsAsCSV() // All sheets
const csv = exportErrorLogsAsCSV("Q1 Report") // Specific sheet
```

#### `clearErrorLogs(sheetName)`

Deletes error logs (use carefully!).

```javascript
clearErrorLogs() // Clear all
clearErrorLogs("Q1 Report") // Clear specific sheet only
```

---

## Dashboard Sheets Reference

### DashboardConfig Sheet

**Columns:**
| Column | Description |
|--------|-------------|
| SheetName | Identifier for the sheet |
| SheetURL | Full URL to the Google Sheet |
| Status | ACTIVE, OFFBOARDED |
| KPIs | Comma-separated list of KPI names |
| Thresholds | JSON object of KPI names to thresholds |
| OnboardDate | When the sheet was added |
| LastSyncDate | Last time errors were checked |
| OffboardDate | When the sheet was removed (if applicable) |

### ErrorLogs Sheet

**Columns:**
| Column | Description |
|--------|-------------|
| Timestamp | When the error was recorded |
| SheetName | Which sheet the error is from |
| ErrorType | Type of error (KPI_THRESHOLD_VIOLATION, KPI_ONBOARDED, etc.) |
| ErrorMessage | Details about the error |
| Status | Severity level (CRITICAL, HIGH, MEDIUM, LOW, SUCCESS) |
| Resolution | Notes on resolution or action taken |

**Color Coding:**
- 🔴 RED (CRITICAL)
- 🟠 ORANGE (HIGH)
- 🟡 YELLOW (MEDIUM)
- 🟡 LIGHT ORANGE (LOW)

### ErrorLogs_Archive Sheet

Automatically created when sheets are offboarded. Contains historical error data.

---

## Configuration

Edit `config.json` to customize:

```json
{
  "severityLevels": {
    "CRITICAL": "Value is 50% or more below threshold",
    "HIGH": "Value is 30-50% below threshold"
  },
  "triggers": {
    "errorCheck": {
      "frequency": "Every 30 minutes"
    }
  }
}
```

---

## Common Workflows

### Workflow 1: Add a New Sheet to Dashboard

1. Get the sheet URL from Google Sheets (Share > Copy Link)
2. Identify the KPI column names (exactly as they appear in row 1)
3. Determine threshold values for each KPI
4. Run:

```javascript
onboardSheet(
  "SHEET_URL",
  "Friendly Name",
  ["KPI1", "KPI2", "KPI3"],
  {"KPI1": 100, "KPI2": 50, "KPI3": 75}
)
```

### Workflow 2: Adjust KPI Thresholds

Option A: Edit directly in `DashboardConfig` sheet (columns 4-5)

Option B: Use offboarding and re-onboarding:

```javascript
offboardSheet("Sheet Name", true)
onboardSheet("SHEET_URL", "Sheet Name", ["KPI1", "KPI2"], {...updated thresholds...})
```

### Workflow 3: Monitor Errors Continuously

1. Run `setupDashboard()` once (creates triggers)
2. Errors checked automatically every 30 minutes
3. View errors in `ErrorLogs` sheet
4. Check summary with: `getErrorSummary()`

### Workflow 4: Add New KPI to Existing Sheet

```javascript
onboardKPITracking("Sheet Name", "NewKPI", 100)
```

Manually update the sheet URL with the new data.

### Workflow 5: Remove Sheet from Dashboard

```javascript
// Check first
validateOffboarding("Sheet Name")

// Then offboard
offboardSheet("Sheet Name", true)
```

---

## Troubleshooting

### "Failed to access sheet at URL"

- Verify the sheet URL is correct and complete
- Ensure the Apps Script has access to the sheet
- Check that the sheet is not in a trash folder

### "Required column not found"

- Verify column names match exactly (case-sensitive)
- Check that row 1 contains the column headers
- Ensure no hidden rows or columns

### Errors not being created

- Check that `ErrorLogs` sheet exists
- Verify KPI values are numeric
- Confirm threshold values are set correctly
- Manually run: `checkAllSheetsForErrors()`

### Trigger not running

- Check that setup was completed: `setupDashboard()`
- Verify in Apps Script IDE: Extensions > Apps Script > Triggers
- Ensure your Google account allows triggers

### "Sheet already offboarded" error

- Use `validateOffboarding()` to check status
- If truly offboarded, create new entry with `onboardSheet()`

---

## API Quick Reference

```javascript
// ONBOARDING
onboardSheet(url, name, kpis, thresholds)
validateSheetStructure(sheet, columns)

// OFFBOARDING
offboardSheet(name, archiveData)
validateOffboarding(name)

// ERROR HANDLING
checkAllSheetsForErrors()
checkSheetForErrors(url, name, kpis, thresholds)
onboardKPITracking(sheet, kpi, threshold)
offboardKPITracking(sheet, kpi)

// UTILITIES
getAllActiveSheets()
getErrorSummary()
getSheetErrorLogs(name)
clearErrorLogs(name)
sendErrorNotification(email, summary)
createErrorCheckTrigger(minutes)
exportErrorLogsAsCSV(name)
updateLastSyncDate(name)
```

---

## Best Practices

1. **Test before production:** Run functions in a development spreadsheet first
2. **Archive regularly:** Keep `ErrorLogs` manageable by archiving old entries
3. **Set realistic thresholds:** Threshold values should represent true minimums
4. **Monitor emails:** Set up error notifications to stay informed
5. **Review logs weekly:** Identify patterns in KPI violations
6. **Document changes:** Note when KPI thresholds are adjusted
7. **Backup configuration:** Export `DashboardConfig` regularly

---

## Support & Maintenance

### Regular Maintenance Tasks

- Weekly: Review `ErrorLogs` sheet for patterns
- Monthly: Clear or archive old error logs
- Monthly: Review and adjust thresholds if needed
- Quarterly: Export and analyze error trends

### Logs and Debugging

All operations log to the Apps Script IDE console:

```
File > Project Settings > Show "appsscript.json"
Extensions > Apps Script > Editor > Execution Log
```

---

## License

This project is provided as-is for internal use.

---

## Version History

- **v1.0.0** (2026-01-19): Initial release
  - Sheet onboarding/offboarding
  - KPI threshold monitoring
  - Error logging and archival
  - Automated error checking
