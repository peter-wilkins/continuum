# EPYC Agent Workstation Guide (2026)

## Goal

Build a quiet Linux workstation/server hybrid capable of:

- Running 10+ AI agents concurrently
- Compiling multiple Rust projects simultaneously
- Running Docker containers and local services
- Browser automation
- Vector databases and semantic indexing
- OCR/transcoding/background jobs
- Future GPU expansion

The design target is:

- Quiet
- Stable
- Upgradeable
- Linux-friendly
- High RAM bandwidth
- Massive NVMe throughput
- Minimal operational pain

---

# Core Design Philosophy

Buy the PLATFORM first.

The difficult things to upgrade later are:

- Motherboard
- CPU platform/socket
- Cooling
- PSU
- Case

The easier things to upgrade later are:

- RAM
- NVMe drives
- GPU

Therefore:

- Start with strong EPYC platform
- Start with 256GB RAM
- Expand storage over time
- Add GPU later if needed

---

# Recommended Architecture

## Preferred Platform

### AMD EPYC Milan (7003 series)

Best balance of:

- Price
- Efficiency
- Linux support
- RAM bandwidth
- PCIe lanes
- Used market availability

Rome (7002) is also acceptable and often cheaper.

Avoid Naples unless extremely cheap.

---

# Recommended CPUs

## Sweet Spot CPUs

### 1. EPYC 7543P

- 32 cores / 64 threads
- Excellent all-rounder
- Strong single-thread performance
- Lower operational complexity
- Great workstation feel

Ideal target.

---

### 2. EPYC 7443P

- 24 cores / 48 threads
- Slightly cheaper
- Very efficient
- Still massive concurrency

Good budget option.

---

### 3. EPYC 7702P

- 64 cores / 128 threads
- Absurd concurrency
- Slightly older generation
- Incredible value on used market

Good for maximum agent chaos.

---

### 4. EPYC 7642

- 48 cores / 96 threads
- Excellent used-market value
- Strong parallel build capability

Great for heavy compile workloads.

---

### 5. EPYC 7313P

- 16 cores / 32 threads
- Entry-level but modern
- Excellent power efficiency

Lowest sensible starting point.

---

# Motherboard Requirements

The motherboard is the MOST IMPORTANT component.

Must have:

- Single socket SP3
- ECC support
- 8 RAM channels
- Multiple NVMe slots
- Strong VRM cooling
- IPMI preferred
- ATX/E-ATX preferred

Avoid proprietary enterprise boards if possible.

---

# Recommended Motherboards

## 1. Supermicro H12SSL-i

Excellent Linux compatibility.

Pros:

- Reliable
- Widely used
- Strong BIOS support
- Many PCIe slots
- ECC friendly

Very strong recommendation.

---

## 2. ASRock Rack ROMED8-2T

Pros:

- Dual 10Gb networking
- Excellent homelab reputation
- Compact for EPYC
- Strong IO

Very popular among infrastructure builders.

---

## 3. Gigabyte MZ32-AR0

Pros:

- Enterprise quality
- Excellent expansion
- Strong memory support

More server-oriented.

---

## 4. Supermicro H11SSL-i

Older Rome-compatible option.

Pros:

- Often cheaper used
- Mature platform
- Reliable

Good value build foundation.

---

## 5. ASUS KRPA-U16

Pros:

- Workstation/server hybrid feel
- Strong PCIe layout
- Excellent build quality

Premium option.

---

# RAM Guide

## IMPORTANT

EPYC CPUs use 8 memory channels.

That means RAM should be balanced across 8 slots.

DO NOT:

- Use random mismatched sticks
- Add memory asymmetrically
- Mix many RAM types

IDEAL:

- One stick per memory channel

---

# Recommended Starting Configuration

## 256GB Configuration

Use:

- 8 x 32GB DDR4 ECC Registered DIMMs

This gives:

- Full bandwidth
- Excellent concurrency
- Balanced memory access

---

# Upgrade Path

## 512GB

Replace with:

- 8 x 64GB ECC RDIMMs

---

## 1TB

Replace with:

- 8 x 128GB ECC RDIMMs

Only if motherboard supports it.

---

# Recommended RAM Vendors

## Safe Options

### 1. Samsung ECC RDIMM
### 2. Micron ECC RDIMM
### 3. SK Hynix ECC RDIMM
### 4. Kingston Server Premier
### 5. Crucial Server Memory

Prefer:

- DDR4 ECC Registered
- Matched kits
- Identical sticks

---

# Storage Architecture

## Recommended Layout

### Drive 1 — OS

2TB NVMe

Examples:

- Samsung 990 Pro
- WD Black SN850X
- Solidigm P44 Pro

---

### Drive 2 — Scratch / Builds / Agent Work

4TB NVMe

This stores:

- Rust target directories
- Embeddings
- Docker layers
- Temporary indexes
- Vector caches
- Browser automation state

Separating scratch workloads massively improves responsiveness.

---

### Drive 3 — Archive / Data Lake

Can be:

- Large SSD
- HDD mirror
- NAS later

---

# Recommended Cases

IMPORTANT:

Quietness matters.

Avoid rackmount servers unless noise is irrelevant.

Large slow fans are vastly better than tiny fast fans.

---

## 1. Fractal Design Define 7 XL

Extremely strong choice.

Pros:

- Quiet
- Huge airflow
- Massive internal space
- Easy cable management

Top recommendation.

---

## 2. Fractal Meshify 2 XL

Pros:

- Better airflow
- Excellent thermals
- Easier future GPU upgrades

Good if machine may eventually become GPU-heavy.

---

## 3. be quiet! Dark Base Pro 901

Pros:

- Very quiet
- Premium build quality
- Excellent acoustics

---

## 4. Phanteks Enthoo Pro 2

Pros:

- Huge internal volume
- Excellent cooling flexibility
- Great for workstation/server hybrids

---

## 5. Corsair 7000D Airflow

Pros:

- Excellent cooling
- Easy building experience
- Good future expansion

---

# Cooling

Quiet cooling is critical.

## Recommended Cooling Vendors

### 1. Noctua
### 2. be quiet!
### 3. Arctic

Prioritize:

- Large coolers
- Large fans
- Low RPM operation

---

# Power Supply

Do not cheap out here.

Recommended:

- 1000W+
- 80+ Platinum preferred
- Modular
- Quiet fan profile

---

# Recommended PSUs

## 1. Seasonic Prime TX-1000
## 2. Corsair RM1000x
## 3. be quiet! Dark Power 13
## 4. Super Flower Leadex VII
## 5. EVGA SuperNOVA 1000 P6

---

# GPU Strategy

DO NOT overspend initially.

This machine is primarily:

- orchestration
- concurrency
- infrastructure
- builds
- indexing

Start with:

- simple low-power GPU

Examples:

- RTX 3060 12GB
- Intel Arc A380
- basic AMD Radeon

Upgrade later only if local inference becomes central.

---

# Linux Recommendations

## Recommended

### Ubuntu Server LTS

or

### Debian Stable

For workstation feel:

- KDE Plasma
- GNOME minimal

---

# Infrastructure Recommendations

Keep it simple initially.

Avoid:

- premature Kubernetes
- distributed complexity
- infrastructure religion

Prefer:

- Docker Compose
- systemd services
- local queues
- direct orchestration agents

---

# Expected Pricing (UK 2026)

## 256GB EPYC Tower

Typical range:

- £2500–£4500 refurbished complete
- £3500–£6000 polished workstation builds

Depends heavily on:

- RAM amount
- CPU generation
- NVMe included
- acoustic quality

---

# Final Recommendation

Best overall target:

- EPYC 7543P
- Supermicro H12SSL-i
- 256GB ECC (8 x 32GB)
- Fractal Define 7 XL
- Noctua cooling
- 2TB OS NVMe
- 4TB scratch NVMe
- quality 1000W PSU

This should comfortably support:

- many concurrent agents
- multiple Rust builds
- local services
- semantic indexing
- browser automation
- future expansion

without becoming psychologically fragile.
