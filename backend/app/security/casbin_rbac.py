"""
ClaimTrace JKN — PyCasbin Enterprise RBAC/ABAC Policy Enforcement Engine.
Loads hierarchical BPJS Kesehatan access policies (`ANALYST` < `VERIFICATOR_MEDIS` < `KEPALA_CABANG` < `ADMIN`)
with `keyMatch2` wildcard path matching.
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import casbin

_SEC_DIR = Path(__file__).resolve().parent
MODEL_PATH = _SEC_DIR / "casbin_model.conf"
POLICY_PATH = _SEC_DIR / "casbin_policy.csv"

_LOCK = threading.RLock()
_ENFORCER: Optional[casbin.Enforcer] = None


def get_casbin_enforcer() -> casbin.Enforcer:
    global _ENFORCER
    with _LOCK:
        if _ENFORCER is None:
            _ENFORCER = casbin.Enforcer(str(MODEL_PATH), str(POLICY_PATH))
        return _ENFORCER


def enforce_policy(subject_role: str, resource: str, action: str) -> Dict[str, Any]:
    """Evaluates whether `subject_role` is allowed to perform `action` on `resource`."""
    role = (subject_role or "ANALYST").strip().upper()
    act = (action or "GET").strip().upper()
    res = (resource or "/").strip()
    with _LOCK:
        enforcer = get_casbin_enforcer()
        allowed = bool(enforcer.enforce(role, res, act))
        implicit_roles = list(enforcer.get_implicit_roles_for_user(role))
    return {
        "allowed": allowed,
        "subject": role,
        "resource": res,
        "action": act,
        "inherited_roles": implicit_roles,
        "engine": "pycasbin-rbac-keyMatch2",
    }


def list_casbin_policies() -> Dict[str, Any]:
    """Lists all loaded Casbin permission policies and role inheritance groupings."""
    with _LOCK:
        enforcer = get_casbin_enforcer()
        policies = [
            {"subject": p[0], "resource": p[1], "action": p[2]}
            for p in enforcer.get_policy()
            if len(p) >= 3
        ]
        groupings = [
            {"role": g[0], "inherits": g[1]}
            for g in enforcer.get_grouping_policy()
            if len(g) >= 2
        ]
    return {
        "engine": "pycasbin",
        "model": MODEL_PATH.name,
        "policy_file": POLICY_PATH.name,
        "total_policies": len(policies),
        "total_role_links": len(groupings),
        "policies": policies,
        "role_hierarchy": groupings,
    }
