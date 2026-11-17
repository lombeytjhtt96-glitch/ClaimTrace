import os
import sys

# Standard test environment defaults for ClaimTrace automated test suite
os.environ.setdefault("CLAIMTRACE_ALLOW_DEMO_ACCOUNTS", "1")
os.environ.setdefault("CLAIMTRACE_ALLOW_JURY_DEMO", "1")
os.environ.setdefault("CLAIMTRACE_DISABLE_DEV_BYPASS", "0")
