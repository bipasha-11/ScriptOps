"""
Risk Scoring & Budget Estimation Engine
- Weighted risk model based on production complexity factors
- Budget estimation with base cost + feature multipliers
"""

# ── Risk weights (total possible = 115, clamped to 100) ──────────────────────
RISK_WEIGHTS: dict[str, int] = {
    "stunt":   25,   # Safety risk, insurance, stunt coordinators
    "vfx":     20,   # Post-production time & cost
    "crowd":   15,   # Extras management, crowd control
    "weapon":  10,   # Armorer, safety protocols
    "vehicle": 10,   # Permits, safety, equipment
    "rain":    10,   # Rain machines or weather delays
    "animal":  10,   # Handlers, unpredictability
    "night":   10,   # Limited shooting hours, lighting rigs
}

EXTERIOR_RISK = 5  # Weather dependency risk for exterior scenes

# ── Budget constants ──────────────────────────────────────────────────────────
BASE_COST_PER_SCENE = 5_000  # USD baseline per scene

COST_MULTIPLIERS: dict[str, int] = {
    "stunt":   8_000,
    "vfx":    12_000,
    "crowd":   6_000,
    "vehicle": 5_000,
    "rain":    4_000,
    "animal":  4_000,
    "weapon":  3_000,
    "night":   3_000,
}

CHARACTER_COST = 500  # Per character per scene


def compute_risk_score(features: dict[str, bool], scene_type: dict) -> int:
    """
    Compute a 0-100 risk score for a scene.
    Higher score = more complex / dangerous to produce.
    """
    score = 0
    for feat, present in features.items():
        if present and feat in RISK_WEIGHTS:
            score += RISK_WEIGHTS[feat]
    if scene_type.get("exterior"):
        score += EXTERIOR_RISK
    return min(score, 100)


def estimate_budget(
    features: dict[str, bool],
    scene_type: dict,
    num_characters: int,
) -> int:
    """
    Estimate production budget for a scene in USD.
    Base cost + feature add-ons + per-character cost.
    """
    cost = BASE_COST_PER_SCENE
    for feat, present in features.items():
        if present and feat in COST_MULTIPLIERS:
            cost += COST_MULTIPLIERS[feat]
    if scene_type.get("day_night") == "NIGHT":
        cost += COST_MULTIPLIERS.get("night", 0)
    cost += num_characters * CHARACTER_COST
    return cost


def get_risk_level(score: int, threshold: int = 50) -> str:
    """
    Return a human-readable risk level label based on a dynamic threshold.
    Standard thresholds: LOW < 30, MEDIUM < 50, HIGH < 70, CRITICAL >= 70
    Adjusted based on threshold: 
    - CRITICAL: threshold + 20
    - HIGH: threshold
    - MEDIUM: threshold - 20
    """
    if score >= threshold + 20:
        return "CRITICAL"
    elif score >= threshold:
        return "HIGH"
    elif score >= threshold - 20:
        return "MEDIUM"
    else:
        return "LOW"


def analyze_risk_and_cost(scene: dict) -> dict:
    """Add risk_score, budget, and risk_level to an enriched scene dict."""
    features = scene["features"]
    scene_type = scene["scene_type"]
    num_characters = scene.get("num_characters", 0)

    risk_score = compute_risk_score(features, scene_type)
    budget = estimate_budget(features, scene_type, num_characters)
    risk_level = get_risk_level(risk_score)

    scene["risk_score"] = risk_score
    scene["budget"] = budget
    scene["risk_level"] = risk_level
    return scene
