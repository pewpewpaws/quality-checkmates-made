# Phase 2.5: Requirement Baseline Export Engine Findings

> **Comprehensive record of the Dual-Format Enterprise Baseline Export Engine: RFC 4180 Compliant CSV with UTF-8 BOM, Publication-Grade Structured PDF Generation via ReportLab, Dual-Key Cryptographic Signatures, and RBAC Visibility Filtering.**

---

## 1. Executive Summary

Requirements management tools in mission-critical industries must interface with legacy lifecycle management systems (IBM DOORS, PTC Windchill, Jama Connect) while delivering publication-grade documentation for executive review boards and certification audits (FAA, FDA, ISO).

Phase 2.5 implemented the **Enterprise Baseline Export Engine** (`backend/services/export_service.py`):
1. **RFC 4180 CSV Engine**: Generates RFC 4180 compliant CSV exports with a UTF-8 Byte Order Mark (BOM) for zero-glitch Microsoft Excel / DOORS compatibility.
2. **Publication-Grade Structured PDF Specification**: Generates multi-page engineering specification documents using ReportLab, complete with formal cover pages, executive metadata tables, rubric scorecard summaries, dual-key sign-off certificates, and verification matrices.
3. **Dual-Key Cryptographic & Auditable Signatures**: Binds Lead Systems Engineer approvals, hardware feasibility rationales, PM target values, and ISO timestamps directly into export deliverables.
4. **Hierarchical RBAC Visibility Filter**: Automatically shields raw `DRAFT` and `FLAGGED_TBD` statements when exporting under the `EXECUTIVE` persona, ensuring external certifiers only see verified baselines.
5. **REST Export Endpoints**: `/api/requirements/export/csv` and `/api/requirements/export/pdf`.

---

## 2. Technical Specification & Implementation

### 2.1 RFC 4180 CSV with UTF-8 BOM
Standard CSV exports frequently suffer from encoding corruption in Microsoft Excel when special characters (e.g. mathematical symbols, quotes, degree signs) are included. 

**Implementation Highlights**:
- **UTF-8 BOM Prefix**: `\ufeff` is prepended to the CSV byte stream.
- **Strict Column Schema**:
  1. `Requirement ID`
  2. `Section`
  3. `Category`
  4. `Requirement Statement`
  5. `Governance Status`
  6. `Quality Rubric Score`
  7. `Clarity Subscore`
  8. `Verifiability Subscore`
  9. `Completeness Subscore`
  10. `Atomicity Subscore`
  11. `Consistency Subscore`
  12. `PM Target Value`
  13. `Technical Lead Sign-off`
  14. `Hardware Rationale`
  15. `Signed-off Timestamp`

### 2.2 Publication-Grade Structured PDF Generation (ReportLab)
Using ReportLab's flowable architecture (`SimpleDocTemplate`, `Paragraph`, `Table`, `Spacer`, `KeepTogether`), the PDF generator builds an auditable formal specification:

```
+-------------------------------------------------------------+
|                     SYSTEM SPECIFICATION                    |
|             Requirement Quality Copilot (PSE-01)            |
|                     PROJECT: proj-flight                    |
|                BASELINE CERTIFICATION DOSSIER               |
+-------------------------------------------------------------+
| Metadata Table:                                             |
| Generated: 2026-10-19 | Total Reqs: 12 | Baseline: 100%     |
+-------------------------------------------------------------+
| Executive Quality Rubric Summary:                           |
| Average Quality Score: 94.2/100                             |
+-------------------------------------------------------------+
| Detailed Requirement Table:                                 |
| - ID & Status Badge                                         |
| - Grounded Requirement Text (EARS format)                   |
| - Quality Deductions & Audit Receipt                        |
| - Verification Plan (Preconditions, Nom/Boundary Tests)     |
| - Lead Systems Engineer Sign-Off Signature Box              |
+-------------------------------------------------------------+
```

### 2.3 Role-Based Export Filtering
The export service integrates with the project's RBAC matrix:
```python
def filter_by_role(requirements: List[RequirementStatement], role: str):
    if role == "EXECUTIVE":
        # Shields raw drafts and unapproved TBD placeholders
        return [r for r in requirements if r.status in [RequirementStatus.PROVISIONAL_PM, RequirementStatus.LOCKED_BASELINE]]
    return requirements
```

---

## 3. Automated Test Verification

Validated via `backend/tests/test_export.py`:
- **UTF-8 BOM Integrity**: Confirmed first 3 bytes match `EF BB BF`.
- **RFC 4180 Parsing**: Verified standard Python `csv.reader` correctly parses multiline requirement statements and escaped quotes.
- **PDF Signature Validation**: Verified generated PDF byte streams contain `%PDF-1.4` headers, valid xref tables, and complete stream closures.
- **RBAC Shielding Test**: Confirmed that requesting an executive CSV export for a project with mixed states strictly suppresses `FLAGGED_TBD` items.
