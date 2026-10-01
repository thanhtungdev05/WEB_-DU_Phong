#!/usr/bin/env python3
"""Merge the active fallback database into a complete primary database.

This is intentionally not a generic database copier.  It reconciles the FTC
business schema by stable natural keys, allocates fresh numeric identifiers
where the independently-created databases can collide, and validates the
result before committing one target transaction.

The command never prints connection strings or row values containing personal
data.  Production execution requires an explicit confirmation phrase.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any, Iterable

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


ROOT = Path(__file__).resolve().parents[1]
TRACKED_TABLES = (
    "users",
    "regions",
    "org_units",
    "device_catalog",
    "lab_catalog",
    "curricula",
    "curriculum_labs",
    "training_classes",
    "class_enrollments",
    "class_lab_assignments",
    "lab_assignments",
    "timer_sessions",
    "timer_session_assignment_links",
    "login_logs",
    "app_sessions",
    "django_admin_log",
    "django_content_type",
    "auth_user",
)
REQUIRED_TARGET_MIGRATIONS = {
    "047_dashboard_transfer_guard",
    "048_dashboard_revision_sequence",
    "048a_prepare_mikrotik_hexs_catalog",
    "049_activate_mikrotik_hexs_catalog",
    "050_dashboard_technician_pagination_indexes",
    "051_activate_ax3000cv2_easymesh_lab",
    "052_db_guardian_cleanup_views",
}
PRODUCTION_CONFIRMATION = "MERGE_FALLBACK_INTO_PRIMARY"


class MergeSafetyError(RuntimeError):
    pass


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key.strip()] = value
    return values


def normalize_email(value: Any) -> str:
    return str(value or "").strip().lower()


def db_value(value: Any) -> Any:
    return Jsonb(value) if isinstance(value, (dict, list)) else value


def rows_by(rows: Iterable[dict[str, Any]], key_fn) -> dict[Any, dict[str, Any]]:
    result: dict[Any, dict[str, Any]] = {}
    for row in rows:
        key = key_fn(row)
        if key in result:
            raise MergeSafetyError(f"Duplicate natural key detected in {key_fn.__name__}.")
        result[key] = row
    return result


def fetch_table(cur: psycopg.Cursor, table: str) -> list[dict[str, Any]]:
    cur.execute(sql.SQL("SELECT * FROM {}").format(sql.Identifier(table)))
    return list(cur.fetchall())


def table_counts(cur: psycopg.Cursor) -> dict[str, int]:
    result: dict[str, int] = {}
    for table in TRACKED_TABLES:
        cur.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(table)))
        result[table] = int(cur.fetchone()["count"])
    return result


def source_fingerprint(url: str) -> str:
    """Hash every source row without returning row contents to the caller."""
    digest = hashlib.sha256()
    with psycopg.connect(url, connect_timeout=15) as conn:
        with conn.cursor() as cur:
            cur.execute("SET TRANSACTION READ ONLY")
            cur.execute("SET LOCAL statement_timeout = '120s'")
            for table in TRACKED_TABLES:
                cur.execute(
                    sql.SQL(
                        "SELECT md5(row_to_json(t)::text) "
                        "FROM {} t ORDER BY md5(row_to_json(t)::text)"
                    ).format(sql.Identifier(table))
                )
                digest.update(table.encode())
                for (row_hash,) in cur:
                    digest.update(row_hash.encode())
    return digest.hexdigest()


def ensure_migrations(cur: psycopg.Cursor) -> None:
    cur.execute("SELECT version FROM schema_migrations")
    applied = {row["version"] for row in cur.fetchall()}
    missing = sorted(REQUIRED_TARGET_MIGRATIONS - applied)
    if missing:
        raise MergeSafetyError(
            "Target is missing required migrations: " + ", ".join(missing)
        )


def ensure_no_fk_violations(cur: psycopg.Cursor) -> None:
    checks = {
        "users.region": """
            SELECT count(*) FROM users u LEFT JOIN regions r ON r.region_id=u.region_id
            WHERE u.region_id IS NOT NULL AND r.region_id IS NULL
        """,
        "users.unit": """
            SELECT count(*) FROM users u LEFT JOIN org_units o ON o.unit_id=u.unit_id
            WHERE u.unit_id IS NOT NULL AND o.unit_id IS NULL
        """,
        "enrollment.user": """
            SELECT count(*) FROM class_enrollments e LEFT JOIN users u ON u.user_id=e.user_id
            WHERE u.user_id IS NULL
        """,
        "enrollment.class": """
            SELECT count(*) FROM class_enrollments e
            LEFT JOIN training_classes c ON c.class_id=e.class_id WHERE c.class_id IS NULL
        """,
        "assignment.enrollment": """
            SELECT count(*) FROM lab_assignments a
            LEFT JOIN class_enrollments e ON e.enrollment_id=a.enrollment_id
            WHERE e.enrollment_id IS NULL
        """,
        "assignment.curriculum_lab": """
            SELECT count(*) FROM lab_assignments a
            LEFT JOIN curriculum_labs c ON c.curriculum_lab_id=a.curriculum_lab_id
            WHERE c.curriculum_lab_id IS NULL
        """,
        "timer_link.session": """
            SELECT count(*) FROM timer_session_assignment_links l
            LEFT JOIN timer_sessions s ON s.id=l.timer_session_id WHERE s.id IS NULL
        """,
        "timer_link.assignment": """
            SELECT count(*) FROM timer_session_assignment_links l
            LEFT JOIN lab_assignments a ON a.assignment_id=l.assignment_id
            WHERE a.assignment_id IS NULL
        """,
    }
    failures: dict[str, int] = {}
    for name, query in checks.items():
        cur.execute(query)
        count = int(cur.fetchone()["count"])
        if count:
            failures[name] = count
    if failures:
        raise MergeSafetyError(f"Foreign-key validation failed: {failures}")


def merge(source_url: str, target_url: str) -> dict[str, Any]:
    initial_source_fingerprint = source_fingerprint(source_url)

    source = psycopg.connect(source_url, row_factory=dict_row, connect_timeout=15)
    target = psycopg.connect(target_url, row_factory=dict_row, connect_timeout=15)
    try:
        source.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
        source.execute("SET LOCAL statement_timeout = '120s'")
        target.execute("SET LOCAL statement_timeout = '180s'")
        target.execute("SET LOCAL lock_timeout = '15s'")
        target.execute("SELECT pg_advisory_xact_lock(hashtext('ftc_fallback_merge_v1'))")

        scur = source.cursor()
        tcur = target.cursor()
        ensure_migrations(tcur)
        before_counts = table_counts(tcur)

        source_rows = {table: fetch_table(scur, table) for table in TRACKED_TABLES}
        target_rows = {table: fetch_table(tcur, table) for table in TRACKED_TABLES}

        # Stable catalog mappings.  Migrations 049/051 must already have made
        # the fallback catalog a subset of the target catalog.
        target_regions = rows_by(target_rows["regions"], lambda r: r["region_code"])
        target_units = rows_by(target_rows["org_units"], lambda r: r["unit_code"])
        target_devices_by_id = rows_by(target_rows["device_catalog"], lambda r: r["device_id"])
        target_devices_by_name = rows_by(target_rows["device_catalog"], lambda r: r["device_name"])
        target_labs_by_id = rows_by(target_rows["lab_catalog"], lambda r: r["lab_id"])

        region_map: dict[Any, Any] = {}
        for row in source_rows["regions"]:
            match = target_regions.get(row["region_code"])
            if not match:
                raise MergeSafetyError("A fallback region code is absent from the target.")
            region_map[row["region_id"]] = match["region_id"]

        unit_map: dict[Any, Any] = {}
        for row in source_rows["org_units"]:
            match = target_units.get(row["unit_code"])
            if not match:
                raise MergeSafetyError("A fallback unit code is absent from the target.")
            unit_map[row["unit_id"]] = match["unit_id"]

        device_map: dict[Any, Any] = {}
        for row in source_rows["device_catalog"]:
            match = target_devices_by_id.get(row["device_id"])
            if not match:
                match = target_devices_by_name.get(row["device_name"])
            if not match:
                raise MergeSafetyError("A fallback device is absent from the migrated target.")
            device_map[row["device_id"]] = match["device_id"]

        lab_map: dict[Any, Any] = {}
        for row in source_rows["lab_catalog"]:
            match = target_labs_by_id.get(row["lab_id"])
            if not match:
                raise MergeSafetyError("A fallback lab is absent from the migrated target.")
            lab_map[row["lab_id"]] = match["lab_id"]

        target_curricula = rows_by(
            target_rows["curricula"],
            lambda r: (r["curriculum_code"], r["version"]),
        )
        curriculum_map: dict[Any, Any] = {}
        for row in source_rows["curricula"]:
            match = target_curricula.get((row["curriculum_code"], row["version"]))
            if not match:
                raise MergeSafetyError("A fallback curriculum is absent from the target.")
            curriculum_map[row["curriculum_id"]] = match["curriculum_id"]

        target_curriculum_labs = rows_by(
            target_rows["curriculum_labs"],
            lambda r: (r["curriculum_id"], r["lab_id"], r["required_mode"]),
        )
        curriculum_lab_map: dict[Any, Any] = {}
        for row in source_rows["curriculum_labs"]:
            key = (
                curriculum_map[row["curriculum_id"]],
                lab_map[row["lab_id"]],
                row["required_mode"],
            )
            match = target_curriculum_labs.get(key)
            if not match:
                raise MergeSafetyError("A fallback curriculum lab is absent from the target.")
            curriculum_lab_map[row["curriculum_lab_id"]] = match["curriculum_lab_id"]

        # Users are matched by normalized email.  Sparse fallback profiles may
        # enrich but never blank historical roster fields.
        target_users = rows_by(target_rows["users"], lambda r: normalize_email(r["email"]))
        target_user_ids = {row["user_id"] for row in target_rows["users"]}
        user_map: dict[Any, Any] = {}
        inserted_users = 0
        updated_users = 0
        user_columns = [
            "user_id", "email", "display_name", "role", "last_login_at",
            "iam_profile", "created_at", "updated_at", "employee_id", "job_title",
            "training_start_date", "training_end_date", "class_code", "is_terminated",
            "termination_date", "termination_reason", "unit_code", "unit_name",
            "region_code", "dashboard_region", "employee_source", "employee_seed_batch",
            "employee_synced_at", "region_id", "unit_id",
        ]
        insert_user_sql = sql.SQL("INSERT INTO users ({}) VALUES ({})").format(
            sql.SQL(",").join(map(sql.Identifier, user_columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in user_columns),
        )
        for row in source_rows["users"]:
            key = normalize_email(row["email"])
            match = target_users.get(key)
            mapped_region = region_map.get(row["region_id"]) if row["region_id"] else None
            mapped_unit = unit_map.get(row["unit_id"]) if row["unit_id"] else None
            if not match:
                if row["user_id"] in target_user_ids:
                    raise MergeSafetyError("A fallback user UUID collides with another target email.")
                values = dict(row)
                values["region_id"] = mapped_region
                values["unit_id"] = mapped_unit
                tcur.execute(insert_user_sql, [db_value(values[c]) for c in user_columns])
                user_map[row["user_id"]] = row["user_id"]
                inserted_users += 1
                target_user_ids.add(row["user_id"])
            else:
                tcur.execute(
                    """
                    UPDATE users SET
                        display_name=COALESCE(NULLIF(%s,''),display_name),
                        role=COALESCE(NULLIF(%s,''),role),
                        last_login_at=GREATEST(last_login_at,%s),
                        iam_profile=COALESCE(iam_profile,'{}'::jsonb) || COALESCE(%s,'{}'::jsonb),
                        updated_at=GREATEST(updated_at,%s),
                        employee_id=COALESCE(NULLIF(%s,''),employee_id),
                        job_title=COALESCE(NULLIF(%s,''),job_title),
                        training_start_date=COALESCE(%s,training_start_date),
                        training_end_date=COALESCE(%s,training_end_date),
                        class_code=COALESCE(NULLIF(%s,''),class_code),
                        is_terminated=(is_terminated OR %s),
                        termination_date=COALESCE(%s,termination_date),
                        termination_reason=COALESCE(NULLIF(%s,''),termination_reason),
                        unit_code=COALESCE(NULLIF(%s,''),unit_code),
                        unit_name=COALESCE(NULLIF(%s,''),unit_name),
                        region_code=COALESCE(NULLIF(%s,''),region_code),
                        dashboard_region=COALESCE(NULLIF(%s,''),dashboard_region),
                        employee_source=COALESCE(NULLIF(%s,''),employee_source),
                        employee_seed_batch=COALESCE(NULLIF(%s,''),employee_seed_batch),
                        employee_synced_at=GREATEST(employee_synced_at,%s),
                        region_id=COALESCE(%s,region_id),
                        unit_id=COALESCE(%s,unit_id)
                    WHERE email=%s
                    """,
                    (
                        row["display_name"], row["role"], row["last_login_at"], db_value(row["iam_profile"]),
                        row["updated_at"], row["employee_id"], row["job_title"],
                        row["training_start_date"], row["training_end_date"], row["class_code"],
                        row["is_terminated"], row["termination_date"], row["termination_reason"],
                        row["unit_code"], row["unit_name"], row["region_code"],
                        row["dashboard_region"], row["employee_source"], row["employee_seed_batch"],
                        row["employee_synced_at"], mapped_region, mapped_unit, match["email"],
                    ),
                )
                user_map[row["user_id"]] = match["user_id"]
                updated_users += 1

        email_to_target_user = {
            normalize_email(row["email"]): user_map[row["user_id"]]
            for row in source_rows["users"]
        }
        for row in target_rows["users"]:
            email_to_target_user.setdefault(normalize_email(row["email"]), row["user_id"])

        def timer_identity(user_id: Any, email: Any, technician_id: Any) -> str | None:
            if user_id is not None:
                return str(user_id)
            if email is not None and str(email).lower() != "":
                return str(email).lower()
            if technician_id is not None and str(technician_id) != "":
                return str(technician_id)
            return None

        target_attempt_max: dict[tuple[str | None, Any], int] = {}
        for row in target_rows["timer_sessions"]:
            if row["mode"] not in {"Thực hành", "practice"} or row["practice_attempt_no"] is None:
                continue
            key = (
                timer_identity(row["user_id"], row["email"], row["technician_id"]),
                row["lab_id"],
            )
            target_attempt_max[key] = max(
                target_attempt_max.get(key, 0), int(row["practice_attempt_no"])
            )

        def mapped_timer_identity(row: dict[str, Any]) -> tuple[str | None, Any]:
            mapped_user = None
            if row["user_id"] is not None:
                mapped_user = user_map.get(row["user_id"])
            if mapped_user is None and row["email"]:
                mapped_user = email_to_target_user.get(normalize_email(row["email"]))
            return (
                timer_identity(mapped_user, row["email"], row["technician_id"]),
                lab_map.get(row["lab_id"], row["lab_id"]),
            )

        # Training classes are stable by class_code.
        target_classes = rows_by(target_rows["training_classes"], lambda r: r["class_code"])
        target_class_ids = {row["class_id"] for row in target_rows["training_classes"]}
        class_map: dict[Any, Any] = {}
        inserted_classes = 0
        class_columns = [
            "class_id", "class_code", "class_name", "region_name", "region_id",
            "curriculum_id", "start_date", "capacity", "status", "instructor_user_id",
            "created_by", "description", "is_mock", "seed_batch", "created_at", "updated_at",
        ]
        insert_class_sql = sql.SQL("INSERT INTO training_classes ({}) VALUES ({})").format(
            sql.SQL(",").join(map(sql.Identifier, class_columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in class_columns),
        )
        for row in source_rows["training_classes"]:
            match = target_classes.get(row["class_code"])
            if match:
                class_map[row["class_id"]] = match["class_id"]
                continue
            if row["class_id"] in target_class_ids:
                raise MergeSafetyError("A fallback class UUID collides with another target class.")
            values = dict(row)
            values["region_id"] = region_map.get(row["region_id"]) if row["region_id"] else None
            values["curriculum_id"] = curriculum_map.get(row["curriculum_id"]) if row["curriculum_id"] else None
            values["instructor_user_id"] = user_map.get(row["instructor_user_id"]) if row["instructor_user_id"] else None
            values["created_by"] = user_map.get(row["created_by"]) if row["created_by"] else None
            tcur.execute(insert_class_sql, [values[c] for c in class_columns])
            class_map[row["class_id"]] = row["class_id"]
            inserted_classes += 1

        # Enrollments allocate fresh bigint IDs and map by class/user/date.
        tcur.execute("SELECT enrollment_id,class_id,user_id,valid_from FROM class_enrollments")
        target_enrollments = {
            (r["class_id"], r["user_id"], r["valid_from"]): r["enrollment_id"]
            for r in tcur.fetchall()
        }
        enrollment_map: dict[Any, Any] = {}
        inserted_enrollments = 0
        for row in source_rows["class_enrollments"]:
            key = (class_map[row["class_id"]], user_map[row["user_id"]], row["valid_from"])
            existing = target_enrollments.get(key)
            if existing is not None:
                enrollment_map[row["enrollment_id"]] = existing
                continue
            tcur.execute(
                """
                INSERT INTO class_enrollments
                    (class_id,user_id,source_class_code,status,valid_from,valid_to,is_mock,
                     seed_batch,created_at,updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING enrollment_id
                """,
                (
                    key[0], key[1], row["source_class_code"], row["status"], row["valid_from"],
                    row["valid_to"], row["is_mock"], row["seed_batch"], row["created_at"],
                    row["updated_at"],
                ),
            )
            new_id = tcur.fetchone()["enrollment_id"]
            enrollment_map[row["enrollment_id"]] = new_id
            target_enrollments[key] = new_id
            inserted_enrollments += 1

        # Class-level lab assignments are stable by mapped class/curriculum lab.
        tcur.execute("SELECT * FROM class_lab_assignments")
        current_class_labs = list(tcur.fetchall())
        target_class_labs = {
            (r["class_id"], r["curriculum_lab_id"]): r for r in current_class_labs
        }
        target_class_lab_ids = {r["class_lab_assignment_id"] for r in current_class_labs}
        class_lab_map: dict[Any, Any] = {}
        inserted_class_labs = 0
        for row in source_rows["class_lab_assignments"]:
            key = (class_map[row["class_id"]], curriculum_lab_map[row["curriculum_lab_id"]])
            existing = target_class_labs.get(key)
            if existing:
                class_lab_map[row["class_lab_assignment_id"]] = existing["class_lab_assignment_id"]
                continue
            if row["class_lab_assignment_id"] in target_class_lab_ids:
                raise MergeSafetyError("A class-lab UUID collides with an unrelated target row.")
            tcur.execute(
                """
                INSERT INTO class_lab_assignments
                    (class_lab_assignment_id,class_id,curriculum_lab_id,assigned_at,due_at,status,
                     assignment_source,is_inferred,created_at,updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    row["class_lab_assignment_id"], key[0], key[1], row["assigned_at"],
                    row["due_at"], row["status"], row["assignment_source"], row["is_inferred"],
                    row["created_at"], row["updated_at"],
                ),
            )
            class_lab_map[row["class_lab_assignment_id"]] = row["class_lab_assignment_id"]
            inserted_class_labs += 1

        # Individual assignments preserve UUIDs after their relational context
        # has been remapped.
        tcur.execute("SELECT enrollment_id,curriculum_lab_id,assignment_id FROM lab_assignments")
        target_assignments = {
            (r["enrollment_id"], r["curriculum_lab_id"]): r["assignment_id"]
            for r in tcur.fetchall()
        }
        target_assignment_ids = set(target_assignments.values())
        assignment_map: dict[Any, Any] = {}
        inserted_assignments = 0
        source_enrollment_by_id = {
            row["enrollment_id"]: row for row in source_rows["class_enrollments"]
        }
        source_curriculum_lab_by_id = {
            row["curriculum_lab_id"]: row for row in source_rows["curriculum_labs"]
        }
        assignment_columns = [
            "assignment_id", "enrollment_id", "class_lab_assignment_id", "curriculum_lab_id",
            "assigned_at", "due_at", "status", "first_pass_attempt_no", "first_try_evidence",
            "completed_at", "passed_at", "region_id_snapshot", "class_id_snapshot",
            "assignment_source", "is_inferred", "created_at", "updated_at", "unit_id_snapshot",
        ]
        insert_assignment_sql = sql.SQL("INSERT INTO lab_assignments ({}) VALUES ({})").format(
            sql.SQL(",").join(map(sql.Identifier, assignment_columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in assignment_columns),
        )
        for row in source_rows["lab_assignments"]:
            mapped_enrollment = enrollment_map[row["enrollment_id"]]
            mapped_curriculum_lab = curriculum_lab_map[row["curriculum_lab_id"]]
            key = (mapped_enrollment, mapped_curriculum_lab)
            existing = target_assignments.get(key)
            if existing:
                assignment_map[row["assignment_id"]] = existing
                continue
            if row["assignment_id"] in target_assignment_ids:
                raise MergeSafetyError("A fallback assignment UUID collides with another target row.")
            values = dict(row)
            values["enrollment_id"] = mapped_enrollment
            values["class_lab_assignment_id"] = (
                class_lab_map.get(row["class_lab_assignment_id"])
                if row["class_lab_assignment_id"] else None
            )
            values["curriculum_lab_id"] = mapped_curriculum_lab
            values["region_id_snapshot"] = (
                region_map.get(row["region_id_snapshot"]) if row["region_id_snapshot"] else None
            )
            values["unit_id_snapshot"] = (
                unit_map.get(row["unit_id_snapshot"]) if row["unit_id_snapshot"] else None
            )
            values["class_id_snapshot"] = class_map[row["class_id_snapshot"]]
            if row["first_pass_attempt_no"] is not None:
                source_enrollment = source_enrollment_by_id[row["enrollment_id"]]
                mapped_user = user_map[source_enrollment["user_id"]]
                source_curriculum_lab = source_curriculum_lab_by_id[row["curriculum_lab_id"]]
                mapped_lab = lab_map[source_curriculum_lab["lab_id"]]
                attempt_base = target_attempt_max.get((str(mapped_user), mapped_lab), 0)
                values["first_pass_attempt_no"] = int(row["first_pass_attempt_no"]) + attempt_base
            tcur.execute(insert_assignment_sql, [values[c] for c in assignment_columns])
            assignment_map[row["assignment_id"]] = row["assignment_id"]
            inserted_assignments += 1
            target_assignment_ids.add(row["assignment_id"])

        # Every fallback timer session was created after primary stopped and has
        # a globally unique submission_id.  Numeric IDs are always reallocated.
        source_submission_ids = [r["submission_id"] for r in source_rows["timer_sessions"]]
        if any(not value for value in source_submission_ids):
            raise MergeSafetyError("A fallback timer session has no submission_id.")
        if len(source_submission_ids) != len(set(source_submission_ids)):
            raise MergeSafetyError("Fallback contains duplicate submission_id values.")
        tcur.execute(
            "SELECT count(*) FROM timer_sessions WHERE submission_id = ANY(%s)",
            (source_submission_ids,),
        )
        if int(tcur.fetchone()["count"]):
            raise MergeSafetyError("Target already contains fallback submission IDs; refusing replay.")

        timer_columns = [key for key in source_rows["timer_sessions"][0].keys() if key != "id"]
        timer_sql = sql.SQL("INSERT INTO timer_sessions ({}) VALUES ({})").format(
            sql.SQL(",").join(map(sql.Identifier, timer_columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in timer_columns),
        )
        timer_values = []
        old_timer_by_submission: dict[str, Any] = {}
        for row in source_rows["timer_sessions"]:
            values = dict(row)
            mapped_user = user_map.get(row["user_id"]) if row["user_id"] else None
            if mapped_user is None and row["email"]:
                mapped_user = email_to_target_user.get(normalize_email(row["email"]))
            values["user_id"] = mapped_user
            values["device_id"] = device_map.get(row["device_id"]) if row["device_id"] else None
            values["lab_id"] = lab_map.get(row["lab_id"], row["lab_id"])
            if row["mode"] in {"Thực hành", "practice"} and row["practice_attempt_no"] is not None:
                attempt_base = target_attempt_max.get(mapped_timer_identity(row), 0)
                values["practice_attempt_no"] = int(row["practice_attempt_no"]) + attempt_base
            old_timer_by_submission[row["submission_id"]] = row["id"]
            timer_values.append([db_value(values[c]) for c in timer_columns])
        tcur.executemany(timer_sql, timer_values)
        tcur.execute(
            "SELECT id,submission_id FROM timer_sessions WHERE submission_id = ANY(%s)",
            (source_submission_ids,),
        )
        timer_map = {
            old_timer_by_submission[r["submission_id"]]: r["id"] for r in tcur.fetchall()
        }
        if len(timer_map) != len(source_rows["timer_sessions"]):
            raise MergeSafetyError("Not every fallback timer session was inserted.")

        link_values = [
            (
                timer_map[row["timer_session_id"]],
                assignment_map[row["assignment_id"]],
                row["link_source"],
                row["linked_at"],
            )
            for row in source_rows["timer_session_assignment_links"]
        ]
        tcur.executemany(
            """
            INSERT INTO timer_session_assignment_links
                (timer_session_id,assignment_id,link_source,linked_at)
            VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING
            """,
            link_values,
        )

        # Logs are append-only.  Their timestamp ranges must not overlap the
        # historical primary, which prevents accidental replay/ID collision.
        def assert_append_only(source_table: str, timestamp_column: str) -> None:
            rows = source_rows[source_table]
            if not rows:
                return
            source_min = min(r[timestamp_column] for r in rows)
            tcur.execute(
                sql.SQL("SELECT max({}) FROM {}").format(
                    sql.Identifier(timestamp_column), sql.Identifier(source_table)
                )
            )
            target_max = tcur.fetchone()["max"]
            if target_max is not None and source_min <= target_max:
                raise MergeSafetyError(f"{source_table} timestamp ranges overlap; manual review required.")

        assert_append_only("login_logs", "created_at")
        login_columns = [key for key in source_rows["login_logs"][0].keys() if key != "id"]
        login_sql = sql.SQL("INSERT INTO login_logs ({}) VALUES ({})").format(
            sql.SQL(",").join(map(sql.Identifier, login_columns)),
            sql.SQL(",").join(sql.Placeholder() for _ in login_columns),
        )
        login_values = []
        for row in source_rows["login_logs"]:
            values = dict(row)
            values["user_id"] = user_map.get(row["user_id"]) if row["user_id"] else None
            login_values.append([values[c] for c in login_columns])
        tcur.executemany(login_sql, login_values)

        target_content_types = rows_by(
            target_rows["django_content_type"],
            lambda r: (r["app_label"], r["model"]),
        )
        source_content_by_id = {
            r["id"]: (r["app_label"], r["model"])
            for r in fetch_table(scur, "django_content_type")
        }
        target_auth_users = rows_by(fetch_table(tcur, "auth_user"), lambda r: r["username"])
        source_auth_by_id = {r["id"]: r for r in fetch_table(scur, "auth_user")}
        auth_user_map = {
            source_id: target_auth_users[row["username"]]["id"]
            for source_id, row in source_auth_by_id.items()
            if row["username"] in target_auth_users
        }
        assert_append_only("django_admin_log", "action_time")
        admin_values = []
        for row in source_rows["django_admin_log"]:
            content_type_id = None
            if row["content_type_id"] is not None:
                natural = source_content_by_id[row["content_type_id"]]
                match = target_content_types.get(natural)
                if not match:
                    raise MergeSafetyError("A Django content type used by admin logs is absent.")
                content_type_id = match["id"]
            if row["user_id"] not in auth_user_map:
                raise MergeSafetyError("A Django admin-log user is absent from the target.")
            admin_values.append(
                (
                    row["action_time"], row["object_id"], row["object_repr"], row["action_flag"],
                    row["change_message"], content_type_id, auth_user_map[row["user_id"]],
                )
            )
        tcur.executemany(
            """
            INSERT INTO django_admin_log
                (action_time,object_id,object_repr,action_flag,change_message,content_type_id,user_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            admin_values,
        )

        # Preserve active PHP sessions so the cutover does not force every user
        # to sign in again.  Session hashes are opaque and source-owned.
        app_session_values = [tuple(row.values()) for row in source_rows["app_sessions"]]
        tcur.executemany(
            """
            INSERT INTO app_sessions (session_id_hash,data,expires_at,created_at,updated_at)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (session_id_hash) DO UPDATE SET
                data=EXCLUDED.data, expires_at=EXCLUDED.expires_at,
                updated_at=EXCLUDED.updated_at
            """,
            app_session_values,
        )

        tcur.execute("SET CONSTRAINTS ALL IMMEDIATE")
        ensure_no_fk_violations(tcur)

        after_counts = table_counts(tcur)
        expected_deltas = {
            "users": inserted_users,
            "training_classes": inserted_classes,
            "class_enrollments": inserted_enrollments,
            "class_lab_assignments": inserted_class_labs,
            "lab_assignments": inserted_assignments,
            "timer_sessions": len(source_rows["timer_sessions"]),
            "timer_session_assignment_links": len(source_rows["timer_session_assignment_links"]),
            "login_logs": len(source_rows["login_logs"]),
            "django_admin_log": len(source_rows["django_admin_log"]),
        }
        for table, expected in expected_deltas.items():
            actual = after_counts[table] - before_counts[table]
            if actual != expected:
                raise MergeSafetyError(
                    f"Unexpected {table} delta: expected {expected}, observed {actual}."
                )

        # A fresh connection must see the exact same fallback snapshot before
        # target commit.  Any concurrent source write aborts the entire merge.
        final_source_fingerprint = source_fingerprint(source_url)
        if final_source_fingerprint != initial_source_fingerprint:
            raise MergeSafetyError("Fallback changed during merge; target transaction was rolled back.")

        target.commit()
        return {
            "status": "committed",
            "inserted": {
                "users": inserted_users,
                "training_classes": inserted_classes,
                "class_enrollments": inserted_enrollments,
                "class_lab_assignments": inserted_class_labs,
                "lab_assignments": inserted_assignments,
                "timer_sessions": len(source_rows["timer_sessions"]),
                "timer_session_assignment_links": len(source_rows["timer_session_assignment_links"]),
                "login_logs": len(source_rows["login_logs"]),
                "django_admin_log": len(source_rows["django_admin_log"]),
            },
            "updated_users": updated_users,
            "source_stable": True,
            "foreign_keys_valid": True,
        }
    except Exception:
        target.rollback()
        raise
    finally:
        source.close()
        target.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", choices=("rehearsal", "primary"), required=True)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--confirm", default="")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    env = load_dotenv(ROOT / ".env")
    source_url = env.get("FALLBACK_DATABASE_URL", "")
    target_key = "MERGE_TEST_DATABASE_URL" if args.target == "rehearsal" else "DATABASE_URL"
    target_url = env.get(target_key, "")
    if not source_url or not target_url:
        raise MergeSafetyError(f"Missing FALLBACK_DATABASE_URL or {target_key}.")
    if hashlib.sha256(source_url.encode()).digest() == hashlib.sha256(target_url.encode()).digest():
        raise MergeSafetyError("Source and target connection strings are identical.")
    if not args.execute:
        raise MergeSafetyError("No changes made. Re-run with --execute after reviewing the target.")
    if args.target == "primary" and args.confirm != PRODUCTION_CONFIRMATION:
        raise MergeSafetyError(
            f"Production requires --confirm {PRODUCTION_CONFIRMATION}."
        )

    result = merge(source_url, target_url)
    print(json.dumps(result, ensure_ascii=True, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except MergeSafetyError as exc:
        print(json.dumps({"status": "aborted", "reason": str(exc)}, ensure_ascii=True))
        raise SystemExit(2)
