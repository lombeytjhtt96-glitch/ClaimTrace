# Last30Days Temporal Intelligence Instructions

## Core Principles
1. **30-Day Sliding Lookback Window**: Every clinical fraud investigation and regulatory cross-reference must inspect circulars, audits, and precedents issued within the last 30 days.
2. **Regulatory Precedence Triangulation**: Correlate ICD-10 primary diagnoses and INA-CBG codes against active KPK, BPJS Kesehatan, and Kemenkes circulars.
3. **Risk Elevation Factors**:
   - `CRITICAL` 30-day circular (e.g., biometrics on repeat hemodialysis): 1.35x scrutiny multiplier.
   - `HIGH` 30-day circular (e.g., pre-op refraction photos for cataract phacoemulsification, ICU ventilator logs): 1.20x scrutiny multiplier.
   - `MEDIUM` 30-day circular (e.g., unindicated C-section rates): 1.10x scrutiny multiplier.
   - Baseline / standard verification: 1.00x multiplier.
4. **Offline & Mock Safety**:
   - Automated unit tests and continuous integration must use `--mock` mode to prevent external network latency and flakiness.
   - When deployed to production with valid search credentials, the engine leverages multi-platform social and institutional consensus.
5. **Tamper-Evident Hashing**:
   - Every temporal radar summary and claim intelligence brief must produce a SHA-256 seal covering version, date window, codes, and risk factors.
