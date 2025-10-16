---
title: 'A Small Edge, Carefully Kept — and How It Connects to “Trading Big Bags”'
pubDate: 2025-09-18T01:28:55Z
updatedDate: 2025-10-16T10:42:53Z
excerpt: >-
  Back when BitMEX paid maker rebates, I turned ~$30 into ~$2,000 by posting passive liquidity and
  guarding inventory. This post breaks down the rebate math, spread capture, and kill-switches—and
  shows how that small-edge discipline connects to “Trading Big Bags,” where structure, not bravado,
  determines survival.
cover: ./cover.png
coverAlt: >-
  'Cover artwork (cover.png) for the article titled A Small Edge, Carefully Kept - and How It Connects to "Trading Big Bags".'
author: sayed-hamid-fatimi
categories:
  - economy-and-finance
  - philosophy
tags:
  - adverse selection
  - architecture of risk
  - BitMEX
  - crypto microstructure
  - funding rates
  - inventory risk
  - inverse perpetuals
  - liquidity provision
  - maker rebates
  - market making
  - post-only orders
  - risk management
  - spread capture
  - trading big bags
  - trading edge
canonical: https://sayedhfatimi.blog/2025/09/18/a-small-edge-carefully-kept-and-how-it-connects-to-trading-big-bags/
---

In [*Trading Big Bags: Liquidity, Leverage, and the Architecture of Risk*](/2025/09/17/trading-big-bags-liquidity-leverage-and-the-architecture-of-risk/), I argued that size turns you from spectator into visible liquidity, and that survival depends on structure: distribution, alignment, and discipline. This post is the companion from the other end of the spectrum. Years ago ('18-'19), in a very specific BitMEX fee regime, I grew roughly \$30 into about \$2,000 in a week by posting passive liquidity and collecting *maker rebates*. The edge wasn't in any single position — it was in repetition, running 60–120 trades a day, each one tiny, each one managed with care. It worked then because the context allowed a small, conditional edge to compound. This is not a victory lap; it's a study in how microstructure, incentives, and humility can matter at small scale — and what breaks as you grow.

**Humility first:** Edges are conditional. The fee schedule, the microstructure, and my own small footprint all mattered. Change any of those and the edge can vanish.

## What This Was (and Wasn't)

- **Was:** A grind of 60–120 small trades a day, posting passive liquidity on both sides of the spread, earning maker rebates and capturing slivers of spread; inventory kept tight; quoting shut down in toxic or trending moments.

- **Wasn't:** Big directional bets, outsized leverage, or "risk-free" carry. The real risks were adverse selection and inventory drifting the wrong way into a trend.

- **Assumptions (historical):** A negative maker fee (rebate) on fills, higher taker fee on crosses, a reliable *post-only* order flag, and an inverse, BTC-settled perpetual contract with predictable mechanics.

## Where the PnL Came From (Small Edges Add Up)

- **Maker rebate:** Each maker fill paid a few bps of notional. Tiny per fill, meaningful across many cycles.

- **Micro-spread capture:** Selling slightly dearer and buying slightly cheaper than mid retained a sliver of the spread.

- **Directional drift (sometimes):** If inventory leaned with a short move, PnL improved; lean into a real trend and it hurt. Inventory control mattered more than drift windfalls.

- **Funding/basis:** Depending on regime and side, funding helped or hurt. The goal was to avoid letting funding bleed a small edge.

### Back-of-Envelope (Edge Components)

One round-trip (one maker buy + one maker sell), ignoring direction:

$$
\text{Rebate PnL} \approx 2 \times r_{\text{bps}} \times \text{notional}
$$

$$
\text{Spread PnL} \approx \delta_{\text{bps}} \times \text{notional}
$$

$$
E \approx (2r+\delta)\,N - S - C \pm F
$$

- *$E$* — Net edge per round-trip (USD)
- *$r$* — Maker rebate per fill (bps)
- *$\delta$* — Micro-spread capture (bps)
- *$N$* — Notional traded (USD)
- *$S$* — Adverse selection cost (USD)
- *$C$* — Inventory carry / drift cost (USD)
- *$F$* — Net funding impact (USD; positive if received, negative if paid)

*Units:* If $r$ and $\delta$ are in bps, the dollar contribution from the first term is $(2r+\delta)\times N \times 10^{-4}$.

Everything here lives and dies on *adverse selection* (getting lifted before price runs) and on hard limits to inventory.

## Mechanics: Inverse Perp Math (Clarity, Not Nostalgia)

- **Contracts / notional:** $\text{contracts} = \text{BTC}_{\text{coll}} \times \text{entry} \times \text{leverage}$.
- **Inverse PnL (BTC):** $\text{PnL}_{\text{BTC}} = \text{contracts} \times \big(\frac{1}{\text{entry}} - \frac{1}{\text{exit}}\big)$.
- **USD value:** $\text{PnL}_{\text{USD}} = \text{PnL}_{\text{BTC}} \times \text{exit price}$.
- **Rebates:** Per maker fill ≈ $(\text{maker bps}) \times \text{filled notional}$.

*Toy illustration:* \$100,000 notional per side; maker rebate 2.5 bps; one tick of spread capture ≈ 1.0 bps. If both orders fill as maker, Rebate ≈ \$50 and Spread ≈ \$10 — about \$60 before drift/funding. The scale was "small bites, many repetitions, strict risk." In practice, that meant dozens upon dozens of such round-trips each day — roughly 60–120 trades — where the law of large numbers let conditional edges show up in PnL.

## The Playbook I Actually Used

- **Post-only or don't post:** Guaranteed maker status; if a replace would cross, it cancelled.
- **Small, many, both sides:** Ladders of tiny orders above and below mid. One big order is easy prey; many small quotes are manageable and less visible.
- **Inventory-aware quoting:** Long inventory → tighten offers, widen bids (and vice versa) until flat.
- **Hard inventory caps:** Max long/short units scaled to recent volatility; hit the cap → stop quoting that side and work down risk.
- **Kill-switches:** Pull everything on trend breaks, spread collapse, funding flips against inventory, or venue wobble.
- **Low effective leverage:** Maker strategies die from liquidation, not fees. Sizing assumed routine swings.
- **Cancel discipline:** Throttled replaces to keep queue position and avoid turning makers into takers.

## How This Ties Back to "Big Bags" (From Micro-Edge to Architecture)

In the big-bags piece, I wrote: *"Survivability is the first alpha."* The same principle powered this small account. The difference is footprint. Small size can be invisible; big size becomes the liquidity. Here's the mapping:

| Small-Account Rule (This Post)                    | Big-Bag Architecture (Prior Post)                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Post-only to earn rebates and avoid crossing      | Participation caps and time-slicing to avoid impact and signaling       |
| Hard inventory caps by recent vol                 | Gross/net exposure limits; VaR budgets; stress-tested drawdown guards   |
| Kill-switch on trend/spread collapse              | Circuit-breakers; cross-venue failover; session redundancy              |
| Funding-aware inventory bias                      | Basis management; term structure alignment with mandate                 |
| Track edge components (rebate, spread, selection) | Attribution by venue/contract; slippage & impact analytics; funding PnL |
| Stay invisible (small clips, many levels)         | Multi-venue distribution; lower footprint per book; queue management    |

**Same principle, different scale:** Structure — not bravado — is what lets you stay around long enough for edge to matter.

## What Scales, What Breaks

- **Scales conceptually:** Kill-switches, inventory caps, and refusing toxic flow. These remain core, just implemented with bigger tooling (risk engines, venue routers).
- **Breaks with size:** Rebate-harvest at the inside quote. As notional grows, you become the queue; your fills get more toxic; the edge turns into impact.
- **Context shift:** If your mandate moves from BTC accumulation to USD returns/hedges, settlement alignment matters (inverse vs linear) — as discussed in the big-bags post.

## When to Stop Scaling the Maker-Rebate Loop

- **Participation too high:** Your quotes consistently make up an outsized share of top-of-book depth.
- **Edge attribution flips:** Adverse selection + funding > rebates + spread over a meaningful window.
- **Queue position degrades:** More last-in-line fills; more toxic hits; rising cancel/replace churn.
- **Venue risk rises:** Outages, index anomalies, or fee tweaks begin to dominate PnL variance.

## What I Took Away

- **Small edges compound when protected:** The craft is in refusing bad trades, not forcing good ones.
- **Context governs edge:** A modest process in the right microstructure can work. The same process in a different context can fail fast.
- **From micro to macro:** The big-bags toolkit is the small-account toolkit, scaled and made redundant — participation limits, distribution, alignment, discipline.

It wasn't about turning \$30 into \$2,000. It was about learning how a tiny edge, guarded by discipline and repeated 60–120 times a day, can exist at all — and how quickly it disappears when discipline or context does.

> *Disclaimer:* This is a personal account of a past approach in a specific environment. Markets change. This is not advice. If you experiment, paper-test against live order book data, assume the edge is thinner than it looks, and remember the first principle from the big-bags piece: survivability is the first alpha.
