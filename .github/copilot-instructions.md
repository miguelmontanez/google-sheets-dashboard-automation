# Copilot Instructions

This workspace contains a complete Google Apps Script project for managing a reporting dashboard with automated sheet onboarding/offboarding and KPI monitoring.

## Project Overview

**Complete Google Sheet Scripts for Dashboard to work**

A production-ready Google Apps Script solution that provides:
- Sheet onboarding/offboarding workflows
- KPI threshold monitoring and error detection
- Automated error logging with severity classification
- Dashboard configuration management

## Key Files

- **src/Onboarding.gs** - Sheet onboarding workflow (240 lines)
- **src/Offboarding.gs** - Sheet offboarding workflow (210 lines)
- **src/ErrorHandling.gs** - KPI monitoring & error creation (350 lines)
- **src/Utilities.gs** - Helper functions & utilities (400 lines)
- **src/Main.gs** - Entry points & usage examples (180 lines)

- **docs/SETUP.md** - Complete setup & usage guide (500+ lines)
- **docs/API_REFERENCE.md** - Full API documentation (800+ lines)
- **docs/TROUBLESHOOTING.md** - Common issues & solutions (500+ lines)

## Architecture

```
Dashboard (Google Sheet)
├── DashboardConfig (auto-created)
│   └── Tracks: SheetName, URL, Status, KPIs, Thresholds
├── ErrorLogs (auto-created)
│   └── Tracks: Timestamp, Sheet, ErrorType, Severity, Message
└── ErrorLogs_Archive (auto-created on offboarding)
    └── Historical error data
```

## Core Functions

### Onboarding
```javascript
onboardSheet(url, name, ["KPI1", "KPI2"], {KPI1: 100, KPI2: 50})
```

### Offboarding
```javascript
offboardSheet(name, true) // true = archive logs
```

### Error Checking
```javascript
checkAllSheetsForErrors() // Manual check (auto-runs every 30 min)
```

### KPI Management
```javascript
onboardKPITracking(sheet, kpi, threshold)
offboardKPITracking(sheet, kpi)
```

### Utilities
```javascript
getAllActiveSheets()
getErrorSummary()
sendErrorNotification(email, summary)
createErrorCheckTrigger(30)
exportErrorLogsAsCSV()
```

## Quick Start

1. Copy all `.gs` files from `src/` to Google Apps Script editor
2. Run `setupDashboard()` once
3. Run `onboardSheet()` to add sheets
4. Errors auto-checked every 30 minutes
5. View in ErrorLogs sheet

## Module Purposes

**Onboarding.gs**
- Validates sheet structure
- Registers configuration
- Initializes error tracking

**Offboarding.gs**
- Archives error logs
- Cleans up configuration
- Preserves historical data

**ErrorHandling.gs**
- Monitors KPI thresholds
- Creates error records
- Classifies by severity (CRITICAL/HIGH/MEDIUM/LOW)

**Utilities.gs**
- Configuration queries
- Statistics & reporting
- Email notifications
- Automation setup

**Main.gs**
- Entry point examples
- Setup function
- Test functions

## Configuration

Edit `config/config.json` to see:
- KPI threshold examples
- Severity level definitions
- Trigger frequency options

## Troubleshooting

See **docs/TROUBLESHOOTING.md** for solutions to:
- Sheet access issues
- Column validation errors
- Trigger failures
- Permission problems
- Performance optimization

## Documentation Structure

- **README.md** - Project overview & quick start
- **SETUP.md** - Implementation guide & workflows
- **API_REFERENCE.md** - Complete function documentation
- **TROUBLESHOOTING.md** - Debug & fix common issues

## Important Notes

- Code is Google Apps Script (JavaScript variant)
- Uses native Google APIs (no external libraries)
- Production-ready for immediate use
- Fully documented with 1,800+ lines of guides

## Development Workflow

1. Copy `.gs` files to Apps Script project
2. Test with `setupDashboard()`
3. Use example functions in Main.gs
4. Monitor in DashboardConfig and ErrorLogs sheets
5. Adjust thresholds as needed

## Support Resources

1. Check SETUP.md for implementation details
2. Review API_REFERENCE.md for function specs
3. Consult TROUBLESHOOTING.md for issues
4. Use execution logs in Apps Script IDE

## Version

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** January 19, 2026
