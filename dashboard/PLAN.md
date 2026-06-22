# Plan: GAP Phase 4 Hardcoded Values Fix

## Phase 1: H2 - Patterns Bundle Path
1. Add DEFAULT_ATHEON_BUNDLE_PATH constant
2. Update loadAtheonPatterns() to use env var with fallback

## Phase 2: H6 - max_retries Constant
1. Extract max_retries: 3 to DEFAULT_MAX_RETRIES constant
2. Replace all hardcoded values with constant reference

## Phase 3: H7 - Statistical Constants
1. Extract 1.96 (z-score for 95% CI) to CONFIDENCE_LEVEL_95 constant
2. Extract 0.05 (p-value threshold) to P_VALUE_THRESHOLD constant
3. Extract 0.95 (confidence level) to CONFIDENCE_LEVEL constant

## Phase 4: H3 - Dashboard URL
1. Check next.config.ts for NEXT_PUBLIC_DASHBOARD_URL
2. Update hardcoded references to use env var

## Phase 5: Verification
1. Run lint checks
2. Run tests
3. Commit changes
