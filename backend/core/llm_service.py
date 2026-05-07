"""
LLM Integration Module (Groq - LLaMA)
- Used ONLY for narrative insights, not core logic
- Structured prompts for scene-level and overall analysis
"""

import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Lazy-load the client to avoid errors when key is missing
_client = None


def _get_client(api_key=None):
    global _client
    
    # If a specific API key is provided, create a one-off client
    if api_key:
        try:
            from groq import AsyncGroq
            return AsyncGroq(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialise custom Groq client: {e}")
            return None

    # Fallback to global client or env var
    if _client is not None:
        return _client
    
    env_api_key = os.getenv("GROQ_API_KEY")
    if not env_api_key:
        logger.warning("GROQ_API_KEY not set — LLM insights will be unavailable")
        return None
    try:
        from groq import AsyncGroq
        _client = AsyncGroq(api_key=env_api_key)
    except Exception as e:
        logger.error(f"Failed to initialise Groq client: {e}")
        return None
    return _client


SCENE_INSIGHT_PROMPT = """You are a film production advisor. Analyze this scene and provide insights.

Scene #{scene_number}: {heading}
Location: {location}
Setting: {setting}
Characters ({num_characters}): {characters}
Features detected: {features_str}
Risk Score: {risk_score}/100 ({risk_level})
Estimated Budget: ${budget:,}

Scene excerpt (first 500 chars):
{excerpt}

Respond in valid JSON only (no markdown, no code fences):
{{
  "summary": "2-sentence production summary",
  "top_risks": [
    {{"risk": "risk description", "mitigation": "how to mitigate"}}
  ],
  "cost_optimizations": ["suggestion 1", "suggestion 2"],
  "difficulty": "Easy|Medium|Hard|Extreme",
  "shooting_days_estimate": 1
}}"""


OVERALL_INSIGHT_PROMPT = """You are a film production advisor. Analyze this full script breakdown and provide a high-level production report.

Script: {title}
Total Scenes: {total_scenes}
Total Budget Estimate: ${total_budget:,}
Average Risk Score: {avg_risk:.1f}/100
High-Risk Scenes (≥50): {high_risk_count}
Critical Scenes (≥70): {critical_count}

Top 5 riskiest scenes:
{top_risky}

Feature frequency across all scenes:
{feature_freq}

Respond in valid JSON only (no markdown, no code fences):
{{
  "executive_summary": "3-4 sentence overview",
  "key_concerns": ["concern 1", "concern 2", "concern 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"],
  "suggested_shoot_order": "suggestion for optimal shooting sequence",
  "estimated_total_shooting_days": 0
}}"""


def _safe_parse_json(text: str) -> dict:
    """Try to parse JSON from LLM response, stripping markdown fences if needed."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse LLM response", "raw": text}


async def generate_scene_insight(scene: dict, api_key: str = None) -> dict:
    """Generate LLM insight for a single scene using Groq."""
    client = _get_client(api_key)
    if client is None:
        return _fallback_scene_insight(scene)

    try:
        active_features = [k for k, v in scene["features"].items() if v]
        prompt = SCENE_INSIGHT_PROMPT.format(
            scene_number=scene["scene_number"],
            heading=scene["heading"],
            location=scene.get("location", "Unknown"),
            setting=f"{'INT' if scene['scene_type']['interior'] else 'EXT'} / {scene['scene_type']['day_night']}",
            num_characters=scene.get("num_characters", 0),
            characters=", ".join(scene.get("characters", [])) or "None detected",
            features_str=", ".join(active_features) or "None",
            risk_score=scene.get("risk_score", 0),
            risk_level=scene.get("risk_level", "LOW"),
            budget=scene.get("budget", 0),
            excerpt=scene.get("body", "")[:500],
        )
        
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        return _safe_parse_json(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"LLM scene insight error: {e}")
        return _fallback_scene_insight(scene)


async def generate_overall_insight(analysis: dict, api_key: str = None) -> dict:
    """Generate LLM insight for the full script analysis using Groq."""
    client = _get_client(api_key)
    if client is None:
        return _fallback_overall_insight(analysis)

    try:
        scenes = analysis["scenes"]
        sorted_risky = sorted(scenes, key=lambda s: s["risk_score"], reverse=True)[:5]
        top_risky = "\n".join(
            f"  - Scene #{s['scene_number']}: {s['heading']} (Risk: {s['risk_score']}, Budget: ${s['budget']:,})"
            for s in sorted_risky
        )
        freq = {}
        for s in scenes:
            for feat, present in s["features"].items():
                if present:
                    freq[feat] = freq.get(feat, 0) + 1
        feature_freq = "\n".join(f"  - {k}: {v} scenes" for k, v in sorted(freq.items(), key=lambda x: -x[1]))

        prompt = OVERALL_INSIGHT_PROMPT.format(
            title=analysis.get("script_title", "Untitled"),
            total_scenes=analysis["total_scenes"],
            total_budget=analysis["total_budget"],
            avg_risk=analysis["avg_risk_score"],
            high_risk_count=analysis["high_risk_scenes"],
            critical_count=sum(1 for s in scenes if s["risk_score"] >= 70),
            top_risky=top_risky,
            feature_freq=feature_freq or "  None",
        )
        
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        return _safe_parse_json(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"LLM overall insight error: {e}")
        return _fallback_overall_insight(analysis)


async def chat_with_script(analysis: dict, messages: list, selected_scene_id: int = None, api_key: str = None) -> str:
    """Send a chat message to Groq with script context."""
    client = _get_client(api_key)
    if client is None:
        return "I'm sorry, but Groq is not configured. Please add your GROQ_API_KEY in the System Configuration panel (top right)."

    # Build context string for the System Prompt
    context = f"Script Title: {analysis.get('script_title', 'Untitled')}\n"
    context += f"Total Budget: ${analysis.get('total_budget', 0):,}\n"
    
    if selected_scene_id:
        scene = next((s for s in analysis.get('scenes', []) if s['scene_number'] == selected_scene_id), None)
        if scene:
            context += f"\nCurrently focusing on Scene #{scene['scene_number']}: {scene['heading']}\n"
            context += f"Risk Score: {scene['risk_score']}/100\n"
            context += f"Budget: ${scene['budget']:,}\n"
            context += f"Characters: {', '.join(scene.get('characters', []))}\n"
            context += f"Excerpt: {scene.get('body', '')[:800]}\n"

    system_prompt = "You are an expert film production assistant. You are helping the user analyze a script breakdown and cost/risk estimates. Use the provided context to answer their questions. Keep answers concise and helpful.\n\nContext:\n" + context

    # Convert generic UI messages to OpenAI format
    gpt_messages = [{"role": "system", "content": system_prompt}]
    
    for m in messages:
        # Map frontend "model" role to OpenAI "assistant" role
        role = "assistant" if m["role"] == "model" else "user"
        gpt_messages.append({"role": role, "content": m["content"]})

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=gpt_messages
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM chat error: {e}")
        return f"Sorry, Groq returned an error: {e}"

    # Build context string for the System Prompt
    context = f"Script Title: {analysis.get('script_title', 'Untitled')}\n"
    context += f"Total Budget: ${analysis.get('total_budget', 0):,}\n"
    
    if selected_scene_id:
        scene = next((s for s in analysis.get('scenes', []) if s['scene_number'] == selected_scene_id), None)
        if scene:
            context += f"\nCurrently focusing on Scene #{scene['scene_number']}: {scene['heading']}\n"
            context += f"Risk Score: {scene['risk_score']}/100\n"
            context += f"Budget: ${scene['budget']:,}\n"
            context += f"Characters: {', '.join(scene.get('characters', []))}\n"
            context += f"Excerpt: {scene.get('body', '')[:800]}\n"

    system_prompt = "You are an expert film production assistant. You are helping the user analyze a script breakdown and cost/risk estimates. Use the provided context to answer their questions. Keep answers concise and helpful.\n\nContext:\n" + context

    # Convert generic UI messages to OpenAI format
    gpt_messages = [{"role": "system", "content": system_prompt}]
    
    for m in messages:
        # Map frontend "model" role to OpenAI "assistant" role
        role = "assistant" if m["role"] == "model" else "user"
        gpt_messages.append({"role": role, "content": m["content"]})

    try:
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=gpt_messages
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM chat error: {e}")
        return f"Sorry, Groq returned an error: {e}"


def _fallback_scene_insight(scene: dict) -> dict:
    """Deterministic fallback when LLM is unavailable."""
    active = [k for k, v in scene["features"].items() if v]
    risk = scene.get("risk_score", 0)
    difficulty = "Easy" if risk < 30 else "Medium" if risk < 50 else "Hard" if risk < 70 else "Extreme"
    return {
        "summary": f"Scene #{scene['scene_number']} at {scene.get('location', 'unknown location')}. Features: {', '.join(active) or 'standard setup'}.",
        "top_risks": [{"risk": f, "mitigation": f"Plan for {f} requirements"} for f in active[:3]],
        "cost_optimizations": ["Consider combining with adjacent scenes at same location"],
        "difficulty": difficulty,
        "shooting_days_estimate": 1 if risk < 30 else 2 if risk < 60 else 3,
    }


def _fallback_overall_insight(analysis: dict) -> dict:
    """Deterministic fallback for overall insight."""
    return {
        "executive_summary": f"Script contains {analysis['total_scenes']} scenes with an estimated budget of ${analysis['total_budget']:,}. "
                             f"Average risk score is {analysis['avg_risk_score']:.1f}/100.",
        "key_concerns": [f"{analysis['high_risk_scenes']} high-risk scenes require careful planning"],
        "recommendations": ["Prioritize high-risk scenes in pre-production"],
        "suggested_shoot_order": "Group scenes by location to minimize company moves",
        "estimated_total_shooting_days": max(analysis["total_scenes"] // 3, 1),
    }
