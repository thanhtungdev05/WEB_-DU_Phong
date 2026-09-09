---
name: xlsx-import-export
description: Use for PhpSpreadsheet roster imports, XLSX report exports, workbook parsing, validation, file limits, formula handling, or spreadsheet personal-data safety.
---

# XLSX import/export workflow

1. Identify the exact workbook/template contract.
2. Validate extension, MIME/content assumptions, size, worksheet/header structure, and required columns.
3. Handle blank cells, unexpected types, dates, numbers-as-text, merged cells, and duplicate rows deliberately.
4. Do not execute or trust spreadsheet formulas as application logic.
5. Avoid CSV/formula injection in exported user-controlled values where applicable.
6. Do not log personal spreadsheet data unnecessarily.
7. Make bulk imports transactional or safely resumable where possible.
8. Preserve deterministic export column ordering and formatting required by consumers.
9. Add regression fixtures/tests for parsing edge cases.
