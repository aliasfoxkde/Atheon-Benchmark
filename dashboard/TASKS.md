# Tasks: GAP Phase 4 Hardcoded Values Fix

## H2: Patterns Bundle Path
- [x] Add DEFAULT_ATHEON_BUNDLE_PATH constant
- [ ] Update loadAtheonPatterns() to use env var with fallback

## H6: max_retries Constant
- [ ] Extract DEFAULT_MAX_RETRIES constant
- [ ] Replace hardcoded max_retries: 3 values

## H7: Statistical Constants
- [ ] Extract CONFIDENCE_LEVEL_95 constant (1.96)
- [ ] Extract P_VALUE_THRESHOLD constant (0.05)
- [ ] Extract CONFIDENCE_LEVEL constant (0.95)

## H3: Dashboard URL
- [ ] Check env var usage for dashboard URL
- [ ] Update hardcoded references

## Verification
- [ ] Run lint checks
- [ ] Run tests
- [ ] Commit changes
