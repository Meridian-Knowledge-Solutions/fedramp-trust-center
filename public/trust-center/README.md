# Meridian Knowledge Solutions — FedRAMP 20x Trust Center Authorization Package

**FedRAMP ID:** FR2412075M
**Provider:** Meridian Knowledge Solutions

## Package Contents

| Directory | Contents |
|-----------|----------|
| `schemas/` | JSON Schema definitions for FedRAMP 20x report types (VDR, OAR, SCN) |
| `reports/json/` | Machine-readable compliance reports |
| `reports/html/` | Human-readable rendered compliance reports |
| `assessments/` | 3PAO assessment report, security assessment report, authorization letter |
| `policies/` | Security governance policy documents |
| `manifest.json` | Package manifest with SHA-256 checksums for all files |

## Historical Package Access (FRR-ADS-09)

Leveraging agencies can access prior versions of this authorization package
through the mechanisms described below.

### How historical data is retained

**S3 Archive (timestamped snapshots):**
When compliance data changes between pipeline runs (e.g., KSI pass/fail counts
shift, new vulnerabilities are assessed, VDR metrics update), the CI/CD pipeline
archives both the individual changed files and the complete authorization package
zip to a versioned S3 archive. Snapshots are stored at:

    s3://fedramp-compliance-{account}/archive/{filename}/{timestamp}/{filename}
    s3://fedramp-compliance-{account}/archive/trust-center-data/{timestamp}/trust-center-data.zip

Each archive entry includes metadata (commit SHA, workflow run ID, archive date)
for full traceability.

Archive manifests are stored at:

    s3://fedramp-compliance-{account}/manifests/{timestamp}-manifest.json

**Git version history:**
All source artifacts — schemas, report templates, assessment metadata, and
pipeline definitions — are version-controlled in Git. The full history of every
file is available via the repository commit log, providing line-level change
tracking with author, date, and context for every modification.

### What triggers an archive snapshot

Archival is **change-driven**, not calendar-driven. A new timestamped snapshot is
created only when monitored compliance files have actual content differences from
the previous commit. This avoids storing redundant identical copies and ensures
every archived version represents a meaningful state change.

Monitored files include: compliance validation reports, VDR public metrics,
assessed vulnerabilities, KSI validation results, vulnerability bridge logs,
execution quality reports, and failure trackers.

### Accessing historical data

To request a prior version of the authorization package, contact:

- **Trust Center:** Accessible to leveraging agencies via the Meridian Trust Center
- **Direct request:** Contact Meridian's security team for specific historical snapshots
- **S3 API:** Agencies with granted access can query the archive bucket directly

### Package versioning

The `manifest.json` file included in each package contains:
- `version` — date-based version identifier (YYYY.MM.DD)
- `generated_at` — exact UTC timestamp of package generation
- SHA-256 checksums for every file in the package

Compare manifests across versions to identify exactly what changed between any
two package snapshots.
