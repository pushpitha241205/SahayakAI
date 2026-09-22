import re
import json
import logging
from typing import Dict, Any, List
import httpx
from backend.config import settings

logger = logging.getLogger(__name__)

# Predefined Knowledge-base for Emergency Categorization & Guidance
CATEGORIES_INFO = {
    "Medical Emergency": {
        "keywords": ["collapse", "heart attack", "chest pain", "unconscious", "breathing", "stroke", "bleeding", "fainted", "choking", "seizure", "vomiting blood", "overdose", "స్పృహ", "గుండె", "శ్వాస", "రక్తం"],
        "default_severity": "CRITICAL",
        "guidance": [
            "Call local medical emergency immediately (e.g., 108 / 112).",
            "Check if the patient is conscious and breathing normally.",
            "Do NOT move the patient unless there is imminent environmental danger.",
            "Keep the patient calm and warm; loosen tight clothing around the neck."
        ],
        "info_needed": ["Is the person breathing?", "Are they responsive to voice or touch?", "Are there visible major injuries?"]
    },
    "Accident": {
        "keywords": ["car crash", "bike accident", "hit and run", "collision", "vehicle", "fracture", "road accident", "rolled over", "trapped", "ప్రమాదం", "యాక్సిడెంట్", "గాయం"],
        "default_severity": "HIGH",
        "guidance": [
            "Ensure you are in a safe spot away from oncoming traffic.",
            "Call emergency response (112 or highway patrol).",
            "Turn on vehicle hazard lights to warn other drivers.",
            "Do not remove a helmet from an injured rider unless breathing is obstructed."
        ],
        "info_needed": ["How many vehicles and people are involved?", "Is anyone trapped inside?", "Is there any fuel leak or fire risk?"]
    },
    "Fire": {
        "keywords": ["fire", "smoke", "burning", "explosion", "blaze", "gas leak", "lpg cylinder", "flames", "మంటలు", "అగ్ని", "పొగ"],
        "default_severity": "CRITICAL",
        "guidance": [
            "Evacuate the premises immediately; do not use elevators.",
            "Call Fire Services (101 or 112) immediately.",
            "Stay low to the floor to avoid inhaling toxic smoke.",
            "Touch doors with back of hand before opening; if hot, find another escape route."
        ],
        "info_needed": ["Is anyone trapped inside the building?", "What floor or area is burning?", "Are there flammable materials or gas cylinders nearby?"]
    },
    "Harassment / Personal Danger": {
        "keywords": ["stalking", "harassment", "assault", "following me", "stalker", "attack", "threat", "danger", "abused", "eve teasing", "వేధింపులు", "దాడి", "భయం", "అపాయం"],
        "default_severity": "HIGH",
        "guidance": [
            "Move towards a crowded, well-lit public area (store, station, hotel lobby).",
            "Dial emergency police (112 or 100) or women's helpline (1091).",
            "Share your live location with trusted emergency contacts.",
            "Make noise or use a whistle/alarm to draw public attention."
        ],
        "info_needed": ["Can you reach a crowded/safe space right now?", "Are you alone or with companions?", "Can you describe the person or vehicle threatening you?"]
    },
    "Crime / Threat": {
        "keywords": ["robbery", "theft", "weapon", "gun", "knife", "break-in", "burglar", "hostage", "shooting", "దొంగతనం", "తుపాకీ", "కత్తి"],
        "default_severity": "CRITICAL",
        "guidance": [
            "Prioritize personal safety over property or belongings.",
            "Get to a locked, concealed shelter if possible.",
            "Call Police (100 / 112) in silence or whisper if safe to do so.",
            "Do not confront armed or agitated intruders."
        ],
        "info_needed": ["Are weapons visible?", "How many suspects are present?", "What is their current direction of travel?"]
    },
    "Missing Person": {
        "keywords": ["missing child", "missing person", "lost kid", "lost elderly", "cannot find", "disappeared", "తప్పిపోయిన", "జాడలేదు"],
        "default_severity": "MEDIUM",
        "guidance": [
            "Check immediate surrounding vicinity and familiar spots.",
            "File a missing person report at the nearest police station immediately (no waiting period for children/vulnerable).",
            "Keep recent high-resolution photos and clothes description ready.",
            "Coordinate with building security or nearby CCTV operators."
        ],
        "info_needed": ["When and where was the person last seen?", "What clothing/footwear were they wearing?", "Are there any health or memory conditions?"]
    },
    "Natural Disaster": {
        "keywords": ["flood", "earthquake", "cyclone", "landslide", "storm", "building collapse", "తుఫాను", "భూకంపం", "వరదలు"],
        "default_severity": "HIGH",
        "guidance": [
            "Move to designated higher ground or open area away from structures and power lines.",
            "Disconnect electrical mains if flooding occurs.",
            "Tune in to local disaster management broadcasts (NDRF / SDRF).",
            "Keep an emergency grab-bag with water, documents, and flashlight."
        ],
        "info_needed": ["Are you trapped or injured?", "Is water rising rapidly around you?", "Are utilities (gas/power) severed?"]
    }
}

class AIService:
    """
    Modular AI service with hybrid processing:
    1. Heuristic & NLP keyword extraction (100% offline, guaranteed 0ms latency and high reliability)
    2. Optional external LLM (Gemini or OpenAI) via environment variables
    """
    
    @classmethod
    def analyze_emergency(cls, text: str, language: str = "en") -> Dict[str, Any]:
        text_lower = text.lower()
        
        # Rule-based detection
        detected_category = "Other Urgent Situation"
        detected_severity = "HIGH"
        matched_keywords = []
        guidance = [
            "Contact your local emergency dispatch service (112) immediately.",
            "Remain in the safest possible location and stay aware of your surroundings.",
            "Keep your mobile device line open for incoming assistance calls."
        ]
        info_needed = [
            "What is your exact location or nearest landmark?",
            "How many people are affected?"
        ]
        explanation = "The input describes an urgent distress situation requiring immediate attention."

        # Match against our safety knowledge base
        for category, data in CATEGORIES_INFO.items():
            for kw in data["keywords"]:
                if re.search(r'\b' + re.escape(kw) + r'\b', text_lower) or kw in text_lower:
                    matched_keywords.append(kw)
                    detected_category = category
                    detected_severity = data["default_severity"]
                    guidance = data["guidance"]
                    info_needed = data["info_needed"]
                    explanation = f"Detected {category} due to critical keywords like '{kw}'."
                    break
            if matched_keywords:
                break
                
        # If severe words are present, escalate severity
        critical_escalators = ["dying", "not breathing", "unconscious", "massive bleeding", "gun", "explosion", "trapped", "రక్తం", "చనిపోతున్నారు"]
        for crit in critical_escalators:
            if crit in text_lower:
                detected_severity = "CRITICAL"
                break
                
        # Try external AI if configured
        if settings.AI_API_KEY and len(settings.AI_API_KEY.strip()) > 5:
            try:
                external_result = cls._call_external_llm(text, language)
                if external_result:
                    return external_result
            except Exception as e:
                logger.warning(f"External AI call failed, falling back to heuristic engine: {e}")

        # Localize explanation if Telugu requested or detected
        if language == "te" or any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in text):
            if detected_category == "Medical Emergency":
                explanation = "ఇది వైద్యపరమైన అత్యవసర పరిస్థితిగా గుర్తించబడింది. వెంటనే 108 కి కాల్ చేయండి."
            elif detected_category == "Accident":
                explanation = "రోడ్డు ప్రమాదం గుర్తించబడింది. వెంటనే 112 లేదా ట్రాఫిక్ పోలీసులను సంప్రదించండి."
            elif detected_category == "Fire":
                explanation = "అగ్ని ప్రమాదం గుర్తించబడింది. వెంటనే 101 ఫైర్ సర్వీస్ కి కాల్ చేయండి."
            elif detected_category == "Harassment / Personal Danger":
                explanation = "వ్యక్తిగత భద్రతకు ముప్పు ఉన్నట్లు గుర్తించబడింది. వెంటనే 100/112 లేదా మహిళా హెల్ప్‌లైన్ 1091 కి కాల్ చేయండి."

        return {
            "emergency_type": detected_category,
            "severity": detected_severity,
            "immediate_guidance": guidance,
            "information_needed": info_needed,
            "detected_keywords": list(set(matched_keywords)),
            "explanation": explanation
        }

    @classmethod
    def _call_external_llm(cls, text: str, language: str) -> Dict[str, Any]:
        """Calls external API (like Google Gemini API) if configured."""
        api_key = settings.AI_API_KEY
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = f"""
You are an expert AI Emergency Safety Assistant for 'Sahayak AI'.
Analyze the following emergency situation:
"{text}"

Return ONLY valid JSON with this exact structure:
{{
  "emergency_type": "Medical Emergency | Accident | Fire | Harassment / Personal Danger | Crime / Threat | Missing Person | Natural Disaster | Other",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "immediate_guidance": ["Step 1", "Step 2", "Step 3"],
  "information_needed": ["Detail 1", "Detail 2"],
  "detected_keywords": ["keyword1", "keyword2"],
  "explanation": "Brief non-technical explanation"
}}
Safety constraint: Never pretend emergency services were actually dispatched. Always advise dialing 112/108/100 for real world help.
Language: {language}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        
        with httpx.Client(timeout=4.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                res_data = resp.json()
                raw_json = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(raw_json)
        return None
