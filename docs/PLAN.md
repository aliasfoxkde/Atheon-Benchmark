# Implementation Plan: Atheon-Benchmark Improvements

## Phase 1: Critical Fixes (Completed)
- [x] Fix statistical bugs in benchmarks/cmd/run.go
- [x] Add context.Context to pattern_matching.go
- [x] Add SetBundleDownloadURL to core/bundle.go

## Phase 2: New Features (Completed)
- [x] Create external.go for competitor benchmarking
- [x] Add benchmark trending component
- [x] Add pattern breakdown component
- [x] Add version comparison component
- [x] Add export functionality

## Phase 3: PWA Improvements (In Progress)
- [ ] Add PWA install prompt component
- [ ] Add component to layout.tsx
- [ ] Test installation flow

## Phase 4: Anomaly Detection (Pending)
- [ ] Create anomaly detection component
- [ ] Integrate with benchmark trending
- [ ] Add visual indicators for regressions

## Phase 5: WebSocket Integration (Future)
- [ ] Wire up lib/websocket/client.ts
- [ ] Connect to dashboard for real-time updates
- [ ] Or remove dead code if not needed

## Phase 6: i18n (Future)
- [ ] Add Spanish locale (es.json)
- [ ] Add French locale (fr.json)
- [ ] Wire up language selector

## Dependencies
- wrangler CLI for deployment
- next.js 16.2.9 for dashboard
- Go 1.21+ for benchmarks

## Risks
- PWA install prompts can be intrusive if shown too early
- WebSocket infrastructure may require significant rework
- i18n requires professional translations for quality
