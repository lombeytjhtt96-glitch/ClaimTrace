"""
ClaimTrace JKN — Keycloak Enterprise OIDC / SAML 2.0 SSO Integration Helper.
Exposes OIDC discovery metadata, PKCE authorization URL generation, and live
Keycloak reachability status while preserving local MFA session compatibility.
"""

from __future__ import annotations

import os
from typing import Any, Dict
from urllib.parse import urlencode

import httpx

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://127.0.0.1:8180").rstrip("/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "claimtrace-jkn").strip()
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "claimtrace-web").strip()
KEYCLOAK_REDIRECT_URI = os.getenv("KEYCLOAK_REDIRECT_URI", "http://localhost:8080/login").strip()


def get_oidc_endpoints() -> Dict[str, str]:
    issuer = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
    return {
        "issuer": issuer,
        "discovery_url": f"{issuer}/.well-known/openid-configuration",
        "authorization_endpoint": f"{issuer}/protocol/openid-connect/auth",
        "token_endpoint": f"{issuer}/protocol/openid-connect/token",
        "jwks_uri": f"{issuer}/protocol/openid-connect/certs",
        "logout_endpoint": f"{issuer}/protocol/openid-connect/logout",
        "saml_metadata_url": f"{issuer}/protocol/saml/descriptor",
    }


def build_pkce_authorization_url(state: str = "claimtrace-oidc", code_challenge: str = "") -> str:
    eps = get_oidc_endpoints()
    params = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "redirect_uri": KEYCLOAK_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid profile email roles",
        "state": state,
    }
    if code_challenge:
        params["code_challenge"] = code_challenge
        params["code_challenge_method"] = "S256"
    return f"{eps['authorization_endpoint']}?{urlencode(params)}"


def get_keycloak_status() -> Dict[str, Any]:
    eps = get_oidc_endpoints()
    reachable = False
    if not os.getenv("PYTEST_CURRENT_TEST") and os.getenv("CLAIMTRACE_DISABLE_KEYCLOAK") != "1":
        try:
            res = httpx.get(eps["discovery_url"], timeout=0.6)
            reachable = res.status_code == 200
        except Exception:
            reachable = False
    return {
        "engine": "keycloak-oidc-saml",
        "realm": KEYCLOAK_REALM,
        "client_id": KEYCLOAK_CLIENT_ID,
        "keycloak_reachable": reachable,
        "mode": "keycloak_oidc_live" if reachable else "local_sso_mfa_with_oidc_ready",
        "pkce_method": "S256",
        "endpoints": eps,
        "realm_export_file": "infra/keycloak/claimtrace-realm.json",
    }
