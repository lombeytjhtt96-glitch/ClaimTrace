feat/enterprise-security-hardening-and-rules-engine
<!-- pr-agent-generated -->
### **User description**
fix(imports): import secrets module at top level to avoid NameError in verify_verifikator_pin
 fix(auth): enforce strict per-account constant-time PIN validation eliminating weak PIN fallbacks
 fix(auth): eliminate hardcoded OTP bypass and implement constant-time replay-protected verification
 fix(security & fhir): apply PR-Agent recommendations - use secrets CSPRNG for OTP and valid JSONResponse for FHIR creation
 feat(security): enterprise OWASP headers, rate limiting, SQL firewall, UU PDP scrubbing, deep clinical rules engine


___

### **PR Type**
Enhancement, Bug fix, Tests


___

### **Description**
- Implement enterprise security hardening and OWASP headers

- Add deep clinical rules and claims engines

- Introduce FHIR integration and semantic analysis

- Add comprehensive test suite for security controls


___

None


___

