# Architectural Decisions

## 1. Dashboard Framework
**Decision**: Next.js 16 with TypeScript and Tailwind CSS
**Rationale**: Strong typing, static export for Cloudflare Pages, component ecosystem

## 2. Benchmark Storage
**Decision**: LocalStorage for trending, GitHub API for historical results
**Rationale**: Simple persistence without backend dependency

## 3. Build Tags for External Benchmarks
**Decision**: Use Go build tags (`//go:build external`) for conditional compilation
**Rationale**: Allows single binary with multiple entry points

## 4. Context Parameters in Go API
**Decision**: All Scan* functions accept context.Context
**Rationale**: Proper cancellation support, follows Go best practices

## 5. Anonymized Hardware Specs
**Decision**: Display CPU model without owner identification
**Rationale**: Privacy while providing meaningful benchmark context
