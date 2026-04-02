import math
from typing import Optional

def calculate_risk_score(
    price_change_pct: float,
    liquidity_usd: float,
    flags_mask: int,
    *,
    vol_weight: float = 50.0,
    liq_weight: float = 30.0,
    flag_penalty: float = 5.0,
    max_score: float = 100.0
) -> float:
    """
    Compute a weighted 0–100 risk score.

    Args:
        price_change_pct: Percent change over period (e.g. +5.0 for +5%).
        liquidity_usd: Total liquidity in USD.
        flags_mask: Integer bitmask of risk flags; each set bit adds a penalty.
        vol_weight: Maximum contribution from volatility (default 50).
        liq_weight: Maximum contribution from liquidity (default 30).
        flag_penalty: Penalty points per set flag bit (default 5).
        max_score: Upper bound for the risk score (default 100).

    Returns:
        Risk score between 0 and `max_score`.
    """
    # volatility component
    vol_component = min(abs(price_change_pct) / 10, 1.0) * vol_weight

    # liquidity component: more liquidity → lower risk
    if liquidity_usd > 0:
        liq_component = max(0.0, liq_weight - (math.log10(liquidity_usd) * 5))
    else:
        liq_component = liq_weight

    # flag penalty
    flag_count = bin(flags_mask & 0xFFFFFFFF).count("1")
    flag_component = flag_count * flag_penalty

    raw_score = vol_component + liq_component + flag_component
    score = round(min(raw_score, max_score), 2)

    return score
