# Troubleshooting Guide

## Common Issues & Solutions

### Issue: "Failed to access sheet at URL"

**Symptoms:**
- Error message: `Failed to access sheet at URL: https://...`
- Onboarding fails with validation error

**Causes:**
1. Incorrect or incomplete sheet URL
2. Apps Script doesn't have permission to access the sheet
3. Sheet has been deleted or moved to trash
4. Sheet is restricted/private

**Solutions:**

1. **Verify the URL:**
   - Open the sheet in Google Sheets
   - Click Share (or use the URL bar)
   - Copy the complete URL from the address bar
   - Verify it includes `/edit` at the end

   Correct format:
   ```
   https://docs.google.com/spreadsheets/d/1A-_P4kCgZBzC-DP9a7jxKL_8m9l/edit#gid=0
   ```

2. **Check permissions:**
   - Open the sheet in Google Sheets
   - Click Share
   - Ensure "Editor" or "Viewer" access is available
   - If the sheet is private, add the Apps Script project email:
     - In Apps Script IDE: Project Settings > Copy the script ID
     - Go to sheet > Share > Share with the script ID email

3. **Restore deleted sheets:**
   - Check Google Drive trash
   - Restore the sheet if deleted

4. **Check sheet exists:**
   - Manually open the sheet in Google Sheets to verify it's accessible

---

### Issue: "Required column not found"

**Symptoms:**
- Error: `Required column not found: Revenue`
- Validation fails during onboarding

**Causes:**
1. Column name typo (case-sensitive)
2. Column is hidden
3. Column doesn't exist in the sheet
4. Column data is in a different row than row 1

**Solutions:**

1. **Verify column names exactly:**
   - Open the sheet in Google Sheets
   - Look at row 1 - these are the column headers
   - Copy the exact text (including case, spaces, special characters)
   - Example: If the header says "Revenue ($)" then use "Revenue ($)" in your KPI array

   ❌ Wrong:
   ```javascript
   onboardSheet(url, name, ["revenue", "COST"], thresholds)
   ```

   ✅ Correct:
   ```javascript
   onboardSheet(url, name, ["Revenue", "Cost"], thresholds)
   ```

2. **Check for hidden columns:**
   - In Google Sheets, right-click column header
   - If "Unhide" appears, columns are hidden
   - Unhide them and verify the column names

3. **Verify row 1 has headers:**
   - First row of data must contain column headers
   - If headers are in a different row, hide rows 1 to (header row - 1)

4. **Check for special characters:**
   - Column names might have trailing spaces or special characters
   - Use quotes for exact matching: `"Revenue "`

---

### Issue: Errors not being created

**Symptoms:**
- No errors appear in `ErrorLogs` sheet even though KPIs are below threshold
- `checkAllSheetsForErrors()` returns `total: 0`

**Causes:**
1. Error check hasn't run yet (scheduled for every 30 minutes)
2. KPI values are not numeric
3. `ErrorLogs` sheet doesn't exist
4. Configuration is incorrect

**Solutions:**

1. **Manually trigger error check:**
   ```javascript
   checkAllSheetsForErrors()
   ```
   - This runs immediately and shows results in the log

2. **Verify KPI values are numeric:**
   - In the sheet, check that the KPI columns contain only numbers
   - Remove any text, formatting, or currency symbols
   - Example: Use `50000` not `$50,000` or `50000 USD`

3. **Check that ErrorLogs sheet exists:**
   ```javascript
   setupDashboard()
   ```
   - This creates the sheet if missing

4. **Verify configuration:**
   - Open `DashboardConfig` sheet
   - Check that:
     - Sheet status is "ACTIVE" (not "OFFBOARDED")
     - KPI names match the column headers exactly
     - Thresholds are properly formatted as JSON

5. **Check data is below threshold:**
   - Example: If threshold is 50000 and value is 50000, no error is created
   - Value must be strictly less than threshold
   - Adjust thresholds if needed

---

### Issue: Trigger not running automatically

**Symptoms:**
- Errors manually trigger fine with `checkAllSheetsForErrors()`
- But automated checks aren't running
- No entries in logs appear at regular intervals

**Causes:**
1. Trigger was never created
2. Trigger was deleted
3. Apps Script project permissions are restricted
4. Account quota/limits reached

**Solutions:**

1. **Create the trigger:**
   ```javascript
   setupDashboard()
   ```
   - This sets up the 30-minute trigger

   Or manually:
   ```javascript
   createErrorCheckTrigger(30)
   ```

2. **Verify trigger exists:**
   ```javascript
   getActiveTriggers()
   ```
   - Should show a trigger with function `checkAllSheetsForErrors`

3. **View triggers in IDE:**
   - Apps Script IDE
   - Click "⏰ Triggers" (clock icon on left)
   - Should see `checkAllSheetsForErrors` with frequency set

4. **Check permissions:**
   - Apps Script > Project Settings > Permissions
   - Verify the account has permission to edit the spreadsheet

5. **Check quota:**
   - If many other scripts are running, try reducing check frequency
   - Or run in off-peak hours
   - Contact Google Workspace admin if hitting hard limits

---

### Issue: "Sheet already offboarded" error

**Symptoms:**
- Can't offboard a sheet: "Sheet is already offboarded"
- Status shows "OFFBOARDED" in config

**Causes:**
1. Sheet was already offboarded previously
2. Attempting to re-offboard without re-onboarding

**Solutions:**

1. **Check status first:**
   ```javascript
   validateOffboarding("Sheet Name")
   ```
   - If `valid: false`, sheet is already offboarded

2. **To use the sheet again:**
   ```javascript
   offboardSheet("Sheet Name", false) // Don't archive again
   ```

   Then re-onboard:
   ```javascript
   onboardSheet(url, "Sheet Name", kpis, thresholds)
   ```

3. **Or create a new sheet configuration:**
   ```javascript
   onboardSheet(url, "Sheet Name v2", kpis, thresholds)
   ```
   - Use a different name identifier

---

### Issue: Error severity colors not showing

**Symptoms:**
- Errors appear in `ErrorLogs` but have no color formatting
- All rows have white background

**Causes:**
1. `ErrorLogs` sheet was manually created
2. Sheet formatting was cleared
3. Permission issue with formatting

**Solutions:**

1. **Re-run error check:**
   ```javascript
   checkAllSheetsForErrors()
   ```
   - New errors created by this will be color-coded

2. **Manually format existing rows:**
   - In `ErrorLogs` sheet, select a row
   - Severity column (column E):
     - CRITICAL → Red (#ff0000)
     - HIGH → Orange (#ff9900)
     - MEDIUM → Yellow (#ffff00)
     - LOW → Light Orange (#ffcc99)
   - Right-click > Fill color > Select appropriate color

3. **Clear and restart:**
   - Run: `setupDashboard()`
   - Run: `checkAllSheetsForErrors()`

---

### Issue: Cannot send email notifications

**Symptoms:**
- `sendErrorNotification()` doesn't send email
- Error about permissions or email

**Causes:**
1. Apps Script needs Gmail permission
2. Recipient email is invalid
3. Email quota exhausted (100/day limit)

**Solutions:**

1. **Grant Gmail permission:**
   - In Apps Script IDE, run any function that uses `GmailApp`
   - A permission dialog will appear
   - Click "Review permissions" and "Allow"

2. **Verify email address:**
   ```javascript
   // Valid
   sendErrorNotification("user@company.com", summary)
   
   // Invalid - missing @ or domain
   sendErrorNotification("usercompany.com", summary)
   ```

3. **Check email quota:**
   - You can send 100 emails per day
   - If you're at the limit, wait until the next day
   - Or adjust trigger frequency to reduce error checks

4. **Test with a simple email:**
   ```javascript
   GmailApp.sendEmail("your.email@company.com", "Test", "Test message")
   ```
   - If this works, the permission is granted

---

### Issue: Dashboard is slow/performance issues

**Symptoms:**
- Functions take a long time to execute
- Error checking times out
- Spreadsheet becomes unresponsive

**Causes:**
1. Too many sheets being monitored (>10)
2. Sheets have very large datasets (>100k rows)
3. Trigger frequency too high (checking every 5 minutes)
4. Too many error log entries

**Solutions:**

1. **Reduce check frequency:**
   ```javascript
   createErrorCheckTrigger(30) // Instead of 5 or 15 minutes
   ```

2. **Archive old error logs:**
   ```javascript
   clearErrorLogs() // Clear all logs (or specific sheet)
   ```
   - This speeds up error log lookups

3. **Limit sheets being monitored:**
   - Use offboarding to remove unnecessary sheets
   - Keep only active monitoring sheets

4. **Optimize data sheets:**
   - In each monitored sheet, keep only necessary data
   - Move old data to archive sheets
   - Delete unnecessary columns

5. **Split into multiple dashboards:**
   - Create separate Apps Script projects for different departments
   - Reduces load on single project

---

### Issue: Cannot update KPI thresholds

**Symptoms:**
- `onboardKPITracking()` fails silently
- Changes don't appear in configuration

**Causes:**
1. Sheet doesn't exist in configuration
2. Invalid threshold value (non-numeric)
3. Permission issue with editing config

**Solutions:**

1. **Verify sheet exists:**
   ```javascript
   const active = getAllActiveSheets()
   console.log(active.map(s => s.sheetName))
   ```
   - Check if your sheet is in the list

2. **Use correct data types:**
   ```javascript
   // Correct - numeric threshold
   onboardKPITracking("Sheet", "Revenue", 50000)
   
   // Wrong - string threshold
   onboardKPITracking("Sheet", "Revenue", "50000")
   ```

3. **Check permissions:**
   - Verify the Apps Script has edit permission on the spreadsheet
   - Try `setupDashboard()` to reinitialize

4. **Manually edit config:**
   - Open `DashboardConfig` sheet
   - Edit columns 4 (KPIs) and 5 (Thresholds) directly
   - Format: KPIs as comma-separated, Thresholds as JSON

---

### Issue: Sheet name conflicts

**Symptoms:**
- Multiple sheets with similar names cause confusion
- `getSheetErrorLogs()` returns wrong data

**Causes:**
1. Sheet names are too similar
2. Special characters in names cause issues
3. Case sensitivity problems

**Solutions:**

1. **Use unique, descriptive names:**
   ```javascript
   // Good
   onboardSheet(url, "Sales_Q1_2026", kpis, thresholds)
   onboardSheet(url, "Marketing_Q1_2026", kpis, thresholds)
   
   // Bad - confusing
   onboardSheet(url, "Report1", kpis, thresholds)
   onboardSheet(url, "Report2", kpis, thresholds)
   ```

2. **Avoid special characters:**
   - Use: Letters, numbers, underscores, hyphens
   - Avoid: Punctuation, symbols, non-ASCII characters

3. **Check exact name:**
   ```javascript
   const sheets = getAllActiveSheets()
   sheets.forEach(s => Logger.log(s.sheetName)) // See exact names
   ```

---

### Issue: JSON formatting errors

**Symptoms:**
- Error about JSON parsing in threshold data
- Configuration shows `[object Object]` in cells

**Causes:**
1. Thresholds not formatted as valid JSON
2. Manual editing of config introduced errors
3. Non-string keys in threshold object

**Solutions:**

1. **Use correct JSON format:**
   ```javascript
   // Correct
   {"Revenue": 50000, "Cost": 25000}
   
   // Wrong - single quotes
   {'Revenue': 50000}
   
   // Wrong - unquoted keys
   {Revenue: 50000}
   ```

2. **Use programmatic updates:**
   ```javascript
   // Better than manual editing
   onboardKPITracking("Sheet", "NewKPI", 100)
   ```

3. **Clear and restart:**
   - Use `offboardSheet("Name", true)`
   - Then `onboardSheet()` with correct values

4. **Validate JSON:**
   - Use JSON validator: https://jsonlint.com/
   - Paste your threshold JSON to validate

---

## Debug Mode

### Enable Detailed Logging

Add this at the top of your script:

```javascript
const DEBUG = true;

function log(module, message) {
  if (DEBUG) {
    Logger.log(`[${module}] ${message}`)
  }
}
```

Then use throughout code:
```javascript
log("ONBOARDING", "Starting process")
```

### View Execution Logs

1. Open Apps Script IDE
2. Click Extensions > Apps Script
3. View "Execution log" in the bottom panel

### Check Triggers

1. Apps Script IDE
2. Click ⏰ "Triggers" on left sidebar
3. See all active triggers and their status

### Test Individual Functions

```javascript
// Test onboarding
const result = onboardSheet(url, name, kpis, thresholds)
Logger.log(result)

// Test error checking
const errors = checkAllSheetsForErrors()
Logger.log(errors)

// Test utilities
const summary = getErrorSummary()
Logger.log(JSON.stringify(summary, null, 2))
```

---

## Getting Help

If issues persist:

1. **Check the logs:** Apps Script IDE > Execution log
2. **Review the API Reference:** `docs/API_REFERENCE.md`
3. **Check configuration:** Open `DashboardConfig` sheet to verify data
4. **Test manually:** Run functions individually to isolate the issue
5. **Review error logs:** Open `ErrorLogs` sheet for recorded errors

---

## Version Support

- **Google Sheets:** All recent versions
- **Google Apps Script:** V8 runtime (deprecated - upgrade to V18)
- **Browser:** Any modern browser (Chrome, Firefox, Safari, Edge)

For V18 runtime compatibility, no changes needed - code is backward compatible.
