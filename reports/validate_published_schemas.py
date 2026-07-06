#!/usr/bin/env python3
"""Validate every published JSON schema against the live artifact it governs.

Run from the repo root after regenerating reports or updating pipeline data:
    python3 reports/validate_published_schemas.py
Exits non-zero if any published contract is violated.
"""
import json
import sys
from pathlib import Path

from jsonschema import Draft7Validator

ROOT = Path(__file__).resolve().parent.parent

PAIRS = [
    ("public/data/reports/schemas/unified-ksi-validations-schema.json", "public/data/unified_ksi_validations.json"),
    ("public/trust-center/schemas/unified-ksi-validations-schema.json", "public/data/unified_ksi_validations.json"),
    ("public/data/reports/schemas/oar-schema.json", "public/trust-center/reports/json/oar-report.json"),
    ("public/trust-center/schemas/oar-schema.json", "public/trust-center/reports/json/oar-report.json"),
    ("public/data/reports/schemas/qar-schema.json", "public/trust-center/reports/json/qar-report.json"),
    ("public/data/reports/schemas/vdr-schema.json", "public/trust-center/reports/json/vdr-report.json"),
    ("public/trust-center/schemas/vdr-schema.json", "public/trust-center/reports/json/vdr-report.json"),
    ("public/data/reports/schemas/scn-schema.json", "public/trust-center/reports/json/scn-report.json"),
    ("public/trust-center/schemas/scn-schema.json", "public/trust-center/reports/json/scn-report.json"),
    ("public/data/reports/schemas/cli-command-register-schema.json", "public/data/cli_command_register.json"),
    ("public/trust-center/schemas/cli-command-register-schema.json", "public/data/cli_command_register.json"),
]


def main():
    failed = False
    for schema_rel, data_rel in PAIRS:
        schema_path, data_path = ROOT / schema_rel, ROOT / data_rel
        if not schema_path.exists() or not data_path.exists():
            print(f"SKIP     {schema_rel} (missing file)")
            continue
        schema = json.loads(schema_path.read_text())
        data = json.loads(data_path.read_text())
        errors = list(Draft7Validator(schema).iter_errors(data))
        status = "OK" if not errors else f"{len(errors)} ERRORS"
        print(f"{status:9} {schema_rel}")
        for err in errors[:5]:
            loc = "/".join(str(x) for x in err.path)
            print(f"    - {loc}: {err.message[:140]}")
        if errors:
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
