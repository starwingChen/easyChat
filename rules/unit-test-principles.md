# Unit Test Principles

Date: 2026-03-28

This document defines how unit tests in this repository should be written, organized, and reviewed.

These are repository rules, not suggestions.

## Purpose

Unit tests in this repository exist to protect stable behavior and contracts at a reasonable maintenance cost.

They do not exist to freeze demo content, runtime seed data, or incidental implementation details.

## Core Principles

### 1. Prefer stable contracts over mutable defaults

Tests should primarily protect:

- parsing behavior
- request/response contracts
- state transitions
- selection logic
- error handling
- key user interactions

Tests should generally not protect:

- demo text
- greeting copy
- default seed snapshots
- bot ordering unless ordering is part of the product contract
- specific default model names unless explicitly required by product rules

If a default value is a real product requirement, keep that coverage in a very small number of explicit specification tests.

### 2. Only core code deserves unit-test coverage

Before adding or keeping a test, first ask whether the code is core to the product.

Core code usually means code that would cause meaningful product breakage if it regressed, such as:

- protocol handling
- parsing
- state transitions
- reducer/selector logic
- persistence rules
- domain services
- adapter/client error handling
- key user interactions that are true product contracts

Non-core code should usually not have dedicated unit tests. This includes code whose main value is presentation, wiring, or easily-changed details, such as:

- copy wording
- DOM structure details
- visual ordering that is not a product contract
- environment-specific storage shims
- thin wrapper components
- display-only formatting
- incidental accessibility labels that are not the real contract being protected

Agent rule:

1. If the code is not core, default to no unit test.
2. If a test mainly couples to copy, markup, temporary defaults, or host-environment behavior, delete it or do not add it.
3. If the same behavior is already protected at a lower and more stable layer, remove the higher-layer test.
4. When unsure, bias toward fewer tests and keep only the tests that protect important contracts.

### 3. Test lower layers before higher layers

Prefer writing tests for:

- pure functions
- reducers
- selectors
- services
- parsers
- clients
- adapter state machines

Use integration tests only when behavior spans multiple layers and cannot be protected clearly at a lower layer.

Use component tests only when user interaction itself is the contract.

### 4. Keep React component tests narrow

Component tests are allowed for key interaction components only.

Examples:

- input submission
- dropdown selection
- cancel/stop actions
- confirmation dialogs
- accessibility-critical interactions

Avoid component tests for:

- thin containers
- presentational-only components
- logic that can be moved into pure helpers, selectors, or services

### 5. Use factories and domain fixtures, not runtime seed data

Shared test data belongs in `test/factories`.

Factories must:

- create minimal valid entities
- avoid encoding product defaults
- support per-test overrides

Domain fixtures may live under a domain-local `__tests__/fixtures` directory.

Fixtures must:

- express scenario meaning for that domain
- stay local unless they are truly generic

Runtime seed/config files such as `src/mock/mock.js` must not be used as the main source of unit-test fixture data.

### 6. Each test must protect a single clear contract

Before adding or keeping a test, be able to answer:

- What behavior is this test protecting?
- Why is this the right layer to test it?
- Would a lower-level test be more stable?

If the answer is unclear, the test is probably misplaced or low value.

## Organization Rules

Tests should be grouped by domain.

Recommended structure:

- `test/factories/*`
- `src/bots/__tests__/*`
- `src/store/__tests__/*`
- `src/features/*/__tests__/*`
- `src/components/*/__tests__/*`
- `src/entry/*/__tests__/*`

Within a domain:

- keep pure logic tests first
- keep adapter/protocol tests near their implementation
- keep only a small number of integration or component tests

## Assertion Rules

Prefer assertions that state business meaning directly.

Good examples:

- reducer output objects
- selected ids
- returned status values
- request payload structure
- visible interaction outcomes

Avoid these as primary assertion styles:

- `JSON.stringify(state)` followed by `toContain(...)`
- style-class assertions
- DOM structure assertions without business meaning
- exact equality against large mutable fixtures
- assertions that depend on demo seed text

## Change Tolerance Rules

The following changes should usually not break most unit tests:

- updating demo snapshots
- renaming seed models
- changing greeting copy
- changing non-contract default values

If such a change breaks many tests, the suite is too coupled to mutable data.

## Allowed Exceptions

An explicit specification test may lock down a default value when all of the following are true:

1. The value is a product requirement, not just a demo default.
2. The requirement is stable enough to justify maintenance cost.
3. The test file makes that intent obvious.

These tests should be rare.

## Review Checklist For Humans And Agents

Before submitting or keeping a test, check:

1. Is the code under test core to the product, or is it incidental glue/presentation?
2. Is this test at the lowest stable layer?
3. Does it rely on runtime seed data or mutable demo content?
4. Could a factory produce a smaller and more focused input?
5. Is this component test protecting a real interaction contract?
6. Does this assertion describe behavior rather than implementation detail?
7. If this test fails after a copy/default-data edit, DOM tweak, or environment shim change, is that failure actually valuable?

If the answer to question 1 is “no”, or the answer to question 7 is “no”, rewrite or remove the test.

## Repository-specific Guardrails

- Do not import `src/mock/mock.js` into new unit tests unless the test is explicitly about validating that runtime configuration module itself.
- Do not let large context/provider tests become the main protection for reducer or selector behavior.
- Do not add style-detail assertions to compensate for missing behavior tests.
- Do not keep broad component tests once equivalent lower-level tests exist.
- Do not keep tests whose main purpose is to lock down non-core UI wording, DOM shape, environment shims, or incidental wiring.

## Agent Instruction Summary

When adding or modifying tests in this repository:

1. Start by deciding whether the code is core. If not, prefer no test.
2. Start from the behavior contract.
3. Choose the lowest stable layer.
4. Build inputs with factories or domain fixtures.
5. Keep component coverage limited to key interactions.
6. Avoid binding tests to runtime seed defaults.
7. Prefer deleting low-value tests over preserving noisy coverage.
