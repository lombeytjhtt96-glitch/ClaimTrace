"""
GSAP Skills & 60fps Motion Stack Verification Script for ClaimTrace JKN.
Verifies registration, component lifecycle hooks, Vite chunking, and strict quality gates.
"""

import os
import re
import json
import subprocess
import sys

def run_checks():
    checks_passed = 0
    total_checks = 10

    print("==================================================")
    print("CLAIMTRACE JKN - GSAP MOTION STACK VERIFICATION")
    print("==================================================")

    # 1. Global Repository Installation
    gsap_repo = "/home/Khalaf-Dev/gsap-skills"
    if os.path.isdir(os.path.join(gsap_repo, "skills", "gsap-core")):
        print("[PASS] 1. Global gsap-skills repository exists and has core skills")
        checks_passed += 1
    else:
        print("[FAIL] 1. Global gsap-skills repository missing")

    # 2. Global Skills Registry
    registry_path = "/home/Khalaf-Dev/.gemini/config/skills.json"
    try:
        with open(registry_path, "r", encoding="utf-8") as f:
            registry = json.load(f)
        entries = registry.get("entries", registry.get("skills", []))
        has_gsap = any("gsap-skills" in item.get("path", "") for item in entries)
        if has_gsap:
            print("[PASS] 2. gsap-skills registered in ~/.gemini/config/skills.json")
            checks_passed += 1
        else:
            print("[FAIL] 2. gsap-skills not found in skills.json")
    except Exception as e:
        print(f"[FAIL] 2. Error reading skills.json: {e}")

    # 3. Project Symlink
    symlink_path = os.path.abspath(".github/skills/gsap-skills")
    if os.path.islink(symlink_path) and os.path.exists(symlink_path):
        print(f"[PASS] 3. Symlink .github/skills/gsap-skills is valid -> {os.readlink(symlink_path)}")
        checks_passed += 1
    else:
        print("[FAIL] 3. Project symlink .github/skills/gsap-skills invalid or missing")

    # 4. Frontend Dependencies in package.json
    try:
        with open("app/package.json", "r", encoding="utf-8") as f:
            pkg = json.load(f)
        deps = pkg.get("dependencies", {})
        if "gsap" in deps and "@gsap/react" in deps:
            print(f"[PASS] 4. Dependencies present: gsap ({deps['gsap']}), @gsap/react ({deps['@gsap/react']})")
            checks_passed += 1
        else:
            print("[FAIL] 4. gsap or @gsap/react missing in app/package.json")
    except Exception as e:
        print(f"[FAIL] 4. Error reading package.json: {e}")

    # 5. Rollup manualChunks configuration
    try:
        with open("app/vite.config.js", "r", encoding="utf-8") as f:
            vite_cfg = f.read()
        if "gsap" in vite_cfg and "return 'gsap'" in vite_cfg:
            print("[PASS] 5. Dedicated gsap Rollup chunk configured in vite.config.js")
            checks_passed += 1
        else:
            print("[FAIL] 5. gsap manualChunks missing in vite.config.js")
    except Exception as e:
        print(f"[FAIL] 5. Error reading vite.config.js: {e}")

    # 6. Built Asset Verification
    dist_assets = "app/dist/assets"
    if os.path.isdir(dist_assets):
        gsap_bundles = [f for f in os.listdir(dist_assets) if f.startswith("gsap-") and f.endswith(".js")]
        if gsap_bundles:
            print(f"[PASS] 6. Compiled GSAP production chunk generated: {gsap_bundles[0]}")
            checks_passed += 1
        else:
            print("[FAIL] 6. No gsap production chunk found in app/dist/assets")
    else:
        print("[FAIL] 6. app/dist/assets does not exist (run npm run build first)")

    # 7. useGSAP in Components
    comp_files = [
        "app/src/components/Dashboard/TemporalAlertCard.jsx",
        "app/src/components/Dashboard/DecisionConsole.jsx"
    ]
    all_hooked = True
    for cf in comp_files:
        try:
            with open(cf, "r", encoding="utf-8") as f:
                code = f.read()
            if "useGSAP" not in code or "gsap.registerPlugin(useGSAP)" not in code:
                all_hooked = False
                print(f"[FAIL] 7. useGSAP or registerPlugin missing in {cf}")
        except Exception as e:
            all_hooked = False
            print(f"[FAIL] 7. Error reading {cf}: {e}")
    if all_hooked:
        print("[PASS] 7. Components properly import useGSAP and registerPlugin(useGSAP)")
        checks_passed += 1

    # 8. Instruction & Agent Specifications
    inst_file = ".github/instructions/gsap-animation.instructions.md"
    agent_file = ".github/agents/gsap-motion-engineer.agent.md"
    if os.path.isfile(inst_file) and os.path.isfile(agent_file):
        print("[PASS] 8. Instruction and Agent markdown files exist in .github/")
        checks_passed += 1
    else:
        print("[FAIL] 8. Missing instruction or agent file")

    # 9. Zero Emojis Quality Gate
    files_to_scan = [
        "app/src/components/Dashboard/TemporalAlertCard.jsx",
        "app/src/components/Dashboard/DecisionConsole.jsx",
        inst_file,
        agent_file,
        ".github/copilot-instructions.md"
    ]
    emoji_pattern = re.compile(r"[\U00010000-\U0010ffff]", re.UNICODE)
    emoji_free = True
    for path in files_to_scan:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            matches = emoji_pattern.findall(content)
            if matches:
                emoji_free = False
                print(f"[FAIL] 9. Emojis detected in {path}: {matches}")
    if emoji_free:
        print("[PASS] 9. Zero emojis verified across all modified files")
        checks_passed += 1

    # 10. Zero Vendor Leaks Gate
    vendor_pattern = re.compile(r"\b(Anthropic|Claude|OpenAI|GPT-3|GPT-4|Gemini|Mistral|Llama|Pinecone|Weaviate|Qdrant|Milvus)\b", re.IGNORECASE)
    vendor_free = True
    for path in files_to_scan:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            # Allow model or plugin definitions if strictly needed, but let's check
            matches = vendor_pattern.findall(content)
            if matches:
                vendor_free = False
                print(f"[FAIL] 10. Vendor leak detected in {path}: {matches}")
    if vendor_free:
        print("[PASS] 10. Zero vendor leaks verified across all files")
        checks_passed += 1

    print("==================================================")
    print(f"RESULT: {checks_passed}/{total_checks} CHECKS PASSED")
    print("==================================================")

    return checks_passed == total_checks

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
