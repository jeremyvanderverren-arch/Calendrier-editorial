import streamlit as st
import pandas as pd
import datetime
import json
import os
import calendar
import urllib.request

# Page Config
st.set_page_config(
    page_title="EditoFlow - Calendrier Éditorial",
    page_icon="📅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling to mimic the pristine React UI
st.markdown("""
<style>
    /* Main container and typography improvements */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .stApp {
        background-color: #f8fafc;
    }
    
    /* Sidebar premium styling overrides */
    [data-testid="stSidebar"] {
        background-color: #020617 !important;
        border-right: 1px solid #1e293b !important;
    }
    
    [data-testid="stSidebar"] * {
        color: #94a3b8 !important;
    }
    
    [data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2, [data-testid="stSidebar"] h3, [data-testid="stSidebar"] h4, [data-testid="stSidebar"] strong {
        color: #ffffff !important;
        font-weight: 700;
    }
    
    /* Style the sidebar navigation buttons */
    div[data-testid="stSidebar"] button {
        background-color: transparent !important;
        color: #94a3b8 !important;
        border: none !important;
        text-align: left !important;
        justify-content: flex-start !important;
        padding: 0.6rem 0.8rem !important;
        font-size: 0.875rem !important;
        font-weight: 600 !important;
        transition: all 0.2s !important;
        border-radius: 0.5rem !important;
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        margin-bottom: 0.25rem !important;
    }
    
    div[data-testid="stSidebar"] button:hover {
        color: #ffffff !important;
        background-color: #0f172a !important;
    }
    
    div[data-testid="stSidebar"] button[kind="primary"] {
        background-color: #4f46e5 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2) !important;
    }
    
    /* Code and ID styles */
    code, pre {
        font-family: 'JetBrains Mono', monospace !important;
    }
    
    /* Header & Titles */
    .app-header {
        background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
        padding: 2rem;
        border-radius: 1.25rem;
        color: white;
        margin-bottom: 2rem;
        border: 1px solid #1e293b;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }
    
    .app-title {
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
        color: #ffffff !important;
    }
    
    .app-subtitle {
        color: #94a3b8;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        font-weight: 500;
    }
    
    /* Custom Card Style */
    .custom-card {
        background-color: white;
        padding: 1.5rem;
        border-radius: 1.25rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
        margin-bottom: 1.25rem;
        transition: all 0.2s ease-in-out;
    }
    
    .custom-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
    }
    
    /* Badge styling */
    .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    /* Channels color mapping */
    .badge-linkedin { background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-blog { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-newsletter { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .badge-instagram { background-color: #fdf2f8; color: #9d174d; border: 1px solid #fbcfe8; }
    .badge-default { background-color: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    
    /* Statuses color mapping */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 700;
        border: 1px solid;
    }
    .status-idee { background-color: #f8fafc; border-color: #cbd5e1; color: #475569; }
    .status-redaction { background-color: #fffbeb; border-color: #fde68a; color: #b45309; }
    .status-revision { background-color: #f0fdfa; border-color: #99f6e4; color: #0f766e; }
    .status-planifie { background-color: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .status-publie { background-color: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    
    /* Calendar Grid UI components */
    .calendar-header {
        text-align: center;
        font-weight: 700;
        font-size: 0.85rem;
        color: #475569;
        background-color: #e2e8f0;
        padding: 0.5rem;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .calendar-day-box {
        background-color: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 0.5rem;
        min-height: 110px;
        transition: all 0.2s;
    }
    
    .calendar-day-box:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }
    
    .calendar-day-active {
        font-weight: 800;
        color: #1e293b;
        font-size: 0.95rem;
    }
    
    .calendar-day-muted {
        color: #94a3b8;
        background-color: #f8fafc;
    }
    
    /* User sidebar widget */
    .user-profile-badge {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background-color: #1e293b;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #334155;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- DIRECT GEMINI API REST CLIENT -----------------
def call_gemini_direct(system_instruction, user_prompt, response_json=False):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": user_prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [
                {"text": system_instruction}
            ]
        }
        
    if response_json:
        payload["generationConfig"]["responseMimeType"] = "application/json"
        
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            candidates = result.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as e:
        print("Gemini Direct API Error:", e)
    return None

# Spacer for alignment

# ----------------- LOCAL DATA STORAGE PERSISTENCE -----------------
# We use local files to persist data, simulating Firestore/localStorage on a clean build
PUBS_FILE = "storage_pubs.json"
USERS_FILE = "storage_users.json"
TAXONOMY_FILE = "storage_taxonomy.json"

DEFAULT_USERS = [
    {"id": "u-1", "name": "Jérémy", "email": "jeremy.vanderverren@ucm.be", "role": "editor", "avatar": "👨‍💻"},
    {"id": "u-2", "name": "Alice", "email": "alice@ucm.be", "role": "editor", "avatar": "👩‍💼"},
    {"id": "u-3", "name": "Laurent", "email": "laurent@ucm.be", "role": "editor", "avatar": "👨‍🎨"},
    {"id": "u-4", "name": "Sophie", "email": "sophie@ucm.be", "role": "editor", "avatar": "👩‍🔬"}
]

DEFAULT_PUBLICATIONS = [
    {
        "id": "pub-1",
        "date": "2026-06-17",
        "title": "Le futur de l'IA en SaaS",
        "channel": "LinkedIn",
        "persona": "CTO / Leaders Tech",
        "status": "Publié",
        "copywriting": "L'IA ne remplacera pas les développeurs. Mais les développeurs qui maîtrisent l'IA remplaceront ceux qui s'en méfient.\n\nVoici 3 compétences clés à acquérir dès aujourd'hui pour garder l'avantage.",
        "kpi": "Engagement",
        "createdBy": "u-1"
    },
    {
        "id": "pub-2",
        "date": "2026-06-19",
        "title": "Guide: Recrutement Marketing B2B",
        "channel": "Blog",
        "persona": "CEO & Fondateurs",
        "status": "Planifié",
        "copywriting": "Arrêtez de chercher le candidat miracle à tout faire.\n\nConstruisez une équipe aux talents complémentaires. Notre guide gratuit vous dévoile la structure optimale en 2026.",
        "kpi": "Trafic",
        "createdBy": "u-1"
    },
    {
        "id": "pub-3",
        "date": "2026-06-19",
        "title": "Newsletter #42 : Spécial Automatisation",
        "channel": "Newsletter",
        "persona": "Tous abonnés",
        "status": "En rédaction",
        "copywriting": "Cette semaine, découvrez comment diviser par 2 le temps consacré à vos tâches répétitives.\n\n3 outils simples et un plan d'action immédiat pour booster votre productivité de marketeur.",
        "kpi": "Leads",
        "createdBy": "u-3"
    },
    {
        "id": "pub-4",
        "date": "2026-06-21",
        "title": "Notre culture d'entreprise en image",
        "channel": "Instagram",
        "persona": "Futurs Talents",
        "status": "Idée",
        "copywriting": "Flexibilité totale, projets ambitieux et apprentissage continu.\n\nVoici le quotidien de notre équipe marketing en coulisses. Rejoignez l'aventure !",
        "kpi": "Engagement",
        "createdBy": "u-3"
    }
]

DEFAULT_TAXONOMY = {
    "channels": ["LinkedIn", "Blog", "Newsletter", "Instagram"],
    "kpis": ["Engagement", "Trafic", "Leads"],
    "statuses": ["Idée", "En rédaction", "En révision", "Planifié", "Publié"],
    "personas": ["CTO / Leaders Tech", "CEO & Fondateurs", "Futurs Talents", "Tous abonnés"]
}

def load_data():
    # Load users
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            st.session_state.users = json.load(f)
    else:
        st.session_state.users = DEFAULT_USERS.copy()
        save_users()

    # Load publications
    if os.path.exists(PUBS_FILE):
        with open(PUBS_FILE, 'r', encoding='utf-8') as f:
            st.session_state.publications = json.load(f)
    else:
        st.session_state.publications = DEFAULT_PUBLICATIONS.copy()
        save_pubs()

    # Load taxonomies
    if os.path.exists(TAXONOMY_FILE):
        with open(TAXONOMY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            st.session_state.channels = data.get("channels", DEFAULT_TAXONOMY["channels"])
            st.session_state.kpis = data.get("kpis", DEFAULT_TAXONOMY["kpis"])
            st.session_state.statuses = data.get("statuses", DEFAULT_TAXONOMY["statuses"])
            st.session_state.personas = data.get("personas", DEFAULT_TAXONOMY["personas"])
    else:
        st.session_state.channels = DEFAULT_TAXONOMY["channels"].copy()
        st.session_state.kpis = DEFAULT_TAXONOMY["kpis"].copy()
        st.session_state.statuses = DEFAULT_TAXONOMY["statuses"].copy()
        st.session_state.personas = DEFAULT_TAXONOMY["personas"].copy()
        save_taxonomy()

def save_users():
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(st.session_state.users, f, ensure_ascii=False, indent=2)

def save_pubs():
    with open(PUBS_FILE, 'w', encoding='utf-8') as f:
        json.dump(st.session_state.publications, f, ensure_ascii=False, indent=2)

def save_taxonomy():
    data = {
        "channels": st.session_state.channels,
        "kpis": st.session_state.kpis,
        "statuses": st.session_state.statuses,
        "personas": st.session_state.personas
    }
    with open(TAXONOMY_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Initialize Session State values if not loaded
if "users" not in st.session_state:
    load_data()

if "current_user_id" not in st.session_state:
    st.session_state.current_user_id = "u-1"

if "selected_pub_id" not in st.session_state:
    st.session_state.selected_pub_id = None

if "editing_pub_id" not in st.session_state:
    st.session_state.editing_pub_id = None

# Active user object lookup
def get_active_user():
    for u in st.session_state.users:
        if u["id"] == st.session_state.current_user_id:
            return u
    # fallback
    if st.session_state.users:
        st.session_state.current_user_id = st.session_state.users[0]["id"]
        return st.session_state.users[0]
    return {"id": "u-1", "name": "Jérémy", "email": "jeremy.vanderverren@ucm.be", "role": "editor", "avatar": "👨‍💻"}

active_user = get_active_user()

# ----------------- COHERENCE & BRAINSTORMING HELPERS -----------------
def parse_ideas_via_gemini(raw_input):
    system_instruction = """Tu es un expert en marketing et calendrier éditorial. L'utilisateur te fournit des idées en vrac de publications. Ton rôle est de les analyser et de générer une ou plusieurs publications structurées.
Pour chaque publication, génère les champs suivants :
- date : une date pertinente au format YYYY-MM-DD (proche de 2026-06-19). Évite de tout planifier le même jour.
- title : titre ou sujet de la publication (court et clair).
- channel : le canal idéal choisi parmi [LinkedIn, Blog, Newsletter, Instagram].
- persona : le public cible ou persona marketing le plus adapté.
- status : choisi parmi [Idée, En rédaction, En révision, Planifié, Publié]. Par défaut, mets "Idée" ou "En rédaction".
- copywriting : un texte d'accroche rédigé avec un style copywriting minimaliste (phrases courtes, impactantes, sans superlatifs clichés).
- kpi : le KPI de succès visé choisi parmi [Trafic, Engagement, Leads].

Retourne ABSOLUMENT un tableau d'objets JSON valides décrivant ces publications."""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        result_text = call_gemini_direct(system_instruction, f"Voici les idées brutes de l'utilisateur :\n\"{raw_input}\"", response_json=True)
        if result_text:
            try:
                clean_text = result_text.strip()
                if clean_text.startswith("```"):
                    lines = clean_text.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    clean_text = "\n".join(lines).strip()
                
                parsed_list = json.loads(clean_text)
                if isinstance(parsed_list, list):
                    final_pubs = []
                    for i, p in enumerate(parsed_list):
                        p["id"] = f"ai-pub-{int(datetime.datetime.now().timestamp())}-{i}"
                        p["createdBy"] = st.session_state.current_user_id
                        final_pubs.append(p)
                    return final_pubs
            except Exception as e:
                print("Error parsing Gemini JSON:", e)
                
    # Fallback simulation
    import random
    lines = [line.strip() for line in raw_input.split("\n") if line.strip()]
    extracted = []
    channels = ["LinkedIn", "Blog", "Newsletter", "Instagram"]
    kpis = ["Engagement", "Trafic", "Leads"]
    personas = ["CTO / Leaders Tech", "CEO & Fondateurs", "Futurs Talents", "Tous abonnés"]
    
    for i, line in enumerate(lines):
        clean_line = line
        for prefix in ["-", "*", "Idée 1:", "Idée 2:", "Idée 3:", "Idée:", "1.", "2.", "3."]:
            if clean_line.startswith(prefix):
                clean_line = clean_line[len(prefix):].strip()
        
        if not clean_line:
            continue
            
        chan = channels[i % len(channels)]
        kpi = kpis[i % len(kpis)]
        pers = personas[i % len(personas)]
        day_offset = 17 + (i * 2)
        date_str = f"2026-06-{day_offset:02d}"
        
        copy_text = f"💡 Nouveau focus sur : {clean_line}.\n\nPour les {pers}, ce contenu apporte des solutions directes aux problématiques de performance de leur domaine.\n\nQu'en pensez-vous ? Discutons-en en commentaires !"
        
        extracted.append({
            "id": f"ai-pub-{int(datetime.datetime.now().timestamp())}-{i}",
            "date": date_str,
            "title": clean_line[:40] if len(clean_line) > 40 else clean_line,
            "channel": chan,
            "persona": pers,
            "status": "Idée",
            "copywriting": copy_text,
            "kpi": kpi,
            "createdBy": st.session_state.current_user_id
        })
        
    if not extracted:
        extracted.append({
            "id": f"ai-pub-{int(datetime.datetime.now().timestamp())}-0",
            "date": "2026-06-18",
            "title": "Idée de contenu " + raw_input[:20],
            "channel": "LinkedIn",
            "persona": "CEO & Fondateurs",
            "status": "Idée",
            "copywriting": f"Voici l'idée brute mise en forme :\n\n{raw_input}",
            "kpi": "Engagement",
            "createdBy": st.session_state.current_user_id
        })
    return extracted

def run_coherence_check():
    alerts = []
    publications = st.session_state.publications
    
    # 1. Overload warning: >1 publication on same channel and same date
    schedule_map = {}
    for p in publications:
        key = (p["date"], p["channel"])
        schedule_map[key] = schedule_map.get(key, []) + [p]
        
    for (date, chan), items in schedule_map.items():
        if len(items) > 1:
            alerts.append({
                "type": "warning",
                "message": f"Surcharge de canal : {len(items)} publications planifiées sur {chan} le {date}.",
                "suggestion": f"Pour maintenir l'équilibre éditorial, décalage temporel conseillé pour l'une d'entre elles."
            })
            
    # 2. Empty Copywriting text
    for p in publications:
        if not p.get("copywriting", "").strip():
            alerts.append({
                "type": "info",
                "message": f"Contenu vide : '{p['title']}' ({p['channel']}) n'a aucun texte rédigé.",
                "suggestion": "Utilisez le bouton d'optimisation IA pour générer un premier jet."
            })
            
    # 3. KPI Diversity Check
    kpi_distribution = {}
    for p in publications:
        kpi_distribution[p["kpi"]] = kpi_distribution.get(p["kpi"], 0) + 1
    if len(kpi_distribution) == 1 and len(publications) > 2:
        alerts.append({
            "type": "info",
            "message": f"Concentration de KPI unique : Toutes vos publications ciblent uniquement '{list(kpi_distribution.keys())[0]}'.",
            "suggestion": "Diversifiez vos objectifs stratégiques (Engagement, Trafic, Leads) pour optimiser le tunnel de conversion."
        })
        
    return alerts

# ----------------- SIDEBAR: LOGIN & NAVIGATION -----------------
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80", width=80)
    st.markdown("## 📅 EditoFlow")
    st.markdown("<p style='font-size: 0.8rem; color:#64748b; margin-top:-10px;'>Outil de Planification & Optimisation Éditoriale</p>", unsafe_allow_html=True)
    st.markdown("---")

    # Navigation list
    st.markdown("### 🧭 Navigation")
    menu_options = {
        "dashboard": "📊 Tableau de Bord",
        "calendar": "📅 Calendrier Visuel",
        "list": "📋 Liste des Publications",
        "configs": "⚙️ Configuration Taxonomies"
    }
    
    if "current_nav" not in st.session_state or st.session_state.current_nav == "team":
        st.session_state.current_nav = "dashboard"
        
    for key, val in menu_options.items():
        # Highlight active menu
        btn_type = "primary" if st.session_state.current_nav == key else "secondary"
        if st.button(val, key=f"nav_btn_{key}", use_container_width=True, type=btn_type):
            st.session_state.current_nav = key
            st.session_state.selected_pub_id = None
            st.session_state.editing_pub_id = None
            st.rerun()

    # ----------------- SIDEBAR: AI BRAINSTORMING -----------------
    st.markdown("---")
    st.markdown("### ✨ Brainstorming IA")
    st.markdown("<p style='font-size:0.75rem; color:#94a3b8; line-height:1.4;'>Désactivez la routine. Saisissez vos idées en vrac : l'IA va structurer, planifier et optimiser les publications.</p>", unsafe_allow_html=True)
    
    raw_idea = st.text_area("Vos idées brutes", placeholder="Ex:\nIdée 1: Un post LinkedIn sur l'usage de Recharts pour la dataviz.\nIdée 2: Un article de blog pour annoncer notre intégration Stripe.", height=120, key="sidebar_raw_idea", label_visibility="collapsed")
    
    if st.button("🪄 Générer les Publications", type="secondary", key="btn_generate_ideas", use_container_width=True):
        if not raw_idea.strip():
            st.warning("Veuillez saisir des idées d'abord.")
        else:
            with st.spinner("Analyse et génération par l'IA d'EditoFlow..."):
                new_pubs = parse_ideas_via_gemini(raw_idea.strip())
                if new_pubs:
                    st.session_state.publications.extend(new_pubs)
                    save_pubs()
                    st.success(f"🎉 {len(new_pubs)} publication(s) générée(s) et ajoutée(s) !")
                    st.rerun()

    # ----------------- SIDEBAR: COHERENCE STATUS WIDGET -----------------
    st.markdown("---")
    st.markdown("### 🔍 Conformité & Cohérence")
    
    alerts = run_coherence_check()
    
    if not alerts:
        st.markdown("""
        <div style="background-color: #0f2d1e; border: 1px solid #166534; padding: 0.75rem; border-radius: 0.5rem; text-align: center;">
            <span style="color: #4ade80; font-size: 0.8rem; font-weight: bold;">✅ Calendrier 100% Cohérent !</span>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"<p style='font-size:0.75rem; color:#94a3b8; font-weight:bold; margin-bottom:8px;'>Alertes détectées ({len(alerts)}) :</p>", unsafe_allow_html=True)
        for idx, alert in enumerate(alerts[:3]): # Show top 3 to prevent sidebar bloat
            bg_col = "#2d1f0f" if alert["type"] == "warning" else "#0f1c2d"
            border_col = "#b45309" if alert["type"] == "warning" else "#1e40af"
            text_col = "#fbbf24" if alert["type"] == "warning" else "#60a5fa"
            icon = "⚠️" if alert["type"] == "warning" else "💡"
            
            st.markdown(f"""
            <div style="background-color: {bg_col}; border: 1px solid {border_col}; padding: 0.6rem; border-radius: 0.5rem; margin-bottom: 6px;">
                <div style="font-size: 0.75rem; font-weight: bold; color: {text_col}; display: flex; align-items: start; gap: 4px;">
                    <span>{icon}</span>
                    <span>{alert['message']}</span>
                </div>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 4px; padding-left: 14px;">
                    <strong>Solution :</strong> {alert['suggestion']}
                </div>
            </div>
            """, unsafe_allow_html=True)
        if len(alerts) > 3:
            st.markdown(f"<p style='font-size:0.7rem; color:#64748b; text-align:center;'>... et {len(alerts) - 3} autres suggestions</p>", unsafe_allow_html=True)

# ----------------- MAIN PANEL HEADER -----------------
st.markdown(f"""
<div class="app-header">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div>
            <h1 class="app-title">EditoFlow 🚀</h1>
            <p class="app-subtitle">Planification, organisation de campagnes marketing et optimisation de contenu.</p>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ----------------- AI COPYWRITING OPTIMIZER FUNCTION -----------------
def optimize_copywriting(title, channel, persona, kpi, original_copy=""):
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        system_prompt = """Tu es un copywriter de classe mondiale spécialisé dans le marketing digital. Ton but est d'optimiser le texte proposé par l'utilisateur ou d'en rédiger un nouveau à partir du sujet.
Règles strictes :
1. Style minimaliste : des phrases courtes, rythmées et percutantes.
2. Éliminer les clichés : bannis absolument les mots de remplissage, de marketing paresseux et les adjectifs galvaudés (interdit : "révolutionnaire", "innovant", "unique", "révolution", "bouleverser", "disrupter").
3. Orientation bénéfice : focalise-toi sur le problème résolu et le bénéfice pour le Persona cible indiqué.
4. Adapté au canal : le ton doit correspondre au format et aux codes du canal sélectionné (LinkedIn professionnel, Newsletter intime et directe, Instagram visuel et engageant, Blog structuré et pédagogique).
5. Ne renvoie que le texte optimisé final, sans commentaires additionnels ni métadonnées d'explication. Pas de "Voici le texte optimisé...". Uniquement le post final à copier-coller."""

        user_message = f"Sujet : {title}\nCanal : {channel}\nPublic cible (Persona) : {persona}\nTexte original ou contexte :\n\"{original_copy or title}\""
        
        result = call_gemini_direct(system_prompt, user_message)
        if result:
            return result.strip()

    # Prompt-engineering template formulas to generate stunning copy offline if no real key is configured
    templates = {
        "LinkedIn": {
            "Engagement": [
                "💡 L'IA ne va pas remplacer les experts en {persona}.\n\nMais les experts qui s'en servent vont dépasser les autres. Voici notre constatation sur '{title}'...\n\n👇 Qu'en pensez-vous ? Répondez en commentaire !",
                "📈 3 erreurs fréquentes concernant '{title}' qui coûtent cher aux {persona}.\n\nLa 2ème erreur est particulièrement vicieuse car on pense bien faire.\n\nDécryptage complet dans ce post 🧵..."
            ],
            "Trafic": [
                "Nous venons de publier notre analyse sur '{title}' dédiée aux {persona}.\n\nVous y découvrirez les étapes concrètes pour optimiser vos résultats.\n\n🔗 Le lien complet est disponible en premier commentaire !",
                "🔥 Question pour les {persona} : Comment gérez-vous '{title}' au quotidien ?\n\nNous avons regroupé les meilleures pratiques du secteur dans un dossier spécial.\n\n👉 Accès direct via le lien en commentaire !"
            ],
            "Leads": [
                "⚠️ Alerte pour les {persona}.\n\n'{title}' devient l'enjeu majeur de cette fin d'année. Êtes-vous prêts ?\n\nNous offrons un audit d'aide gratuit aux 10 premiers inscrits via le lien ci-dessous 🚀."
            ]
        },
        "Blog": {
            "Engagement": [
                "Dans cet article de blog approfondi, nous étudions l'évolution de '{title}' pour les {persona}.\n\nPourquoi les anciennes méthodes ne fonctionnent plus, et comment rebondir avec brio."
            ],
            "Trafic": [
                "Guide complet : Tout savoir sur '{title}'. Un dossier technique pensé exclusivement pour les {persona} voulant maximiser leur trafic et leur notoriété."
            ]
        },
        "Newsletter": {
            "Engagement": [
                "Bonjour à tous,\n\nCette semaine dans la newsletter, on s'attaque à un sujet brûlant : '{title}'.\n\nQue vous soyez un expert ou débutant parmi les {persona}, vous allez adorer ce condensé de conseils pratiques."
            ]
        },
        "Instagram": {
            "Engagement": [
                "✨ Zoom sur '{title}' !\n\nSwipe à gauche pour découvrir les 3 conseils de notre équipe pour les {persona} ! 🔥\n\n💾 Enregistre ce post pour plus tard !"
            ]
        }
    }
    
    # Grab matches or resolve fallback
    chan_key = channel if channel in templates else "LinkedIn"
    kpi_key = kpi if kpi in templates.get(chan_key, {}) else list(templates.get(chan_key, {}).keys())[0] if templates.get(chan_key) else "Engagement"
    
    pool = templates.get(chan_key, {}).get(kpi_key, [
        f"Nouveau contenu sur '{title}' spécifiquement conçu pour notre cible '{persona}'.\n\nObjectif visé : {kpi}."
    ])
    
    import random
    # Seed with title length to keep it deterministic but tailored
    random.seed(len(title) + len(persona))
    result = random.choice(pool).format(title=title, persona=persona, kpi=kpi)
    return result


# ----------------- VIEW 0: DASHBOARD VIEW -----------------
if st.session_state.current_nav == "dashboard":
    st.markdown("### 📊 Tableau de Bord d'ÉditoFlow")
    st.markdown("Suivez les métriques de production éditoriale, l'équilibre des canaux de distribution et la cohérence des cibles.")

    publications = st.session_state.publications
    total = len(publications)
    
    # Calculate stats
    ready_or_pub = sum(1 for p in publications if p["status"] in ["Planifié", "Publié"])
    ready_pct = int((ready_or_pub / max(total, 1)) * 100)
    drafts = sum(1 for p in publications if p["status"] in ["En rédaction", "En révision"])
    ideas = sum(1 for p in publications if p["status"] == "Idée")
    
    st.markdown(f"""
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.25rem;">
        <!-- Card 1 -->
        <div class="custom-card" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
            <div style="background-color: #eff6ff; color: #1e40af; padding: 0.85rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid #bfdbfe;">
                📊
            </div>
            <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Total Contenus</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">{total}</div>
            </div>
        </div>
        <!-- Card 2 -->
        <div class="custom-card" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
            <div style="background-color: #f0fdf4; color: #166534; padding: 0.85rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid #bbf7d0;">
                ✅
            </div>
            <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Prêt / Publié</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">{ready_or_pub} <span style="font-size: 0.85rem; font-weight: 600; color: #64748b;">({ready_pct}%)</span></div>
            </div>
        </div>
        <!-- Card 3 -->
        <div class="custom-card" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
            <div style="background-color: #fffbeb; color: #b45309; padding: 0.85rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid #fde68a;">
                📝
            </div>
            <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">En cours</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">{drafts}</div>
            </div>
        </div>
        <!-- Card 4 -->
        <div class="custom-card" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0;">
            <div style="background-color: #faf5ff; color: #6b21a8; padding: 0.85rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid #e9d5ff;">
                ✨
            </div>
            <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Idées en attente</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">{ideas}</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("<h3 style='font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem;'>📺 Répartition par Canal</h3>", unsafe_allow_html=True)
        channels = st.session_state.channels
        for chan in channels:
            count = sum(1 for p in publications if p["channel"] == chan)
            pct = int((count / max(total, 1)) * 100)
            
            bar_color = "#3b82f6"
            if chan == "LinkedIn": bar_color = "#2563eb"
            elif chan == "Blog": bar_color = "#d97706"
            elif chan == "Newsletter": bar_color = "#16a34a"
            elif chan == "Instagram": bar_color = "#db2777"
            
            st.markdown(f"""
            <div class="custom-card" style="margin-bottom: 1rem; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">{chan}</span>
                    <span style="font-size: 0.85rem; font-weight: 700; color: {bar_color};">{count} post(s) ({pct}%)</span>
                </div>
                <div style="background-color: #f1f5f9; height: 8px; border-radius: 9999px; overflow: hidden;">
                    <div style="background-color: {bar_color}; width: {pct}%; height: 100%; border-radius: 9999px;"></div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
    with col2:
        st.markdown("<h3 style='font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem;'>🎯 Objectifs Stratégiques (KPIs)</h3>", unsafe_allow_html=True)
        kpis = st.session_state.kpis
        for kpi in kpis:
            count = sum(1 for p in publications if p["kpi"] == kpi)
            pct = int((count / max(total, 1)) * 100)
            
            bar_color = "#6366f1"
            if kpi == "Engagement": bar_color = "#ec4899"
            elif kpi == "Trafic": bar_color = "#4f46e5"
            elif kpi == "Leads": bar_color = "#14b8a6"
            
            st.markdown(f"""
            <div class="custom-card" style="margin-bottom: 1rem; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">{kpi}</span>
                    <span style="font-size: 0.85rem; font-weight: 700; color: {bar_color};">{count} post(s) ({pct}%)</span>
                </div>
                <div style="background-color: #f1f5f9; height: 8px; border-radius: 9999px; overflow: hidden;">
                    <div style="background-color: {bar_color}; width: {pct}%; height: 100%; border-radius: 9999px;"></div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown("<h3 style='font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-top: 1.5rem; margin-bottom: 1rem;'>👥 Diversité des Personas Cibles</h3>", unsafe_allow_html=True)
        personas = st.session_state.personas
        persona_counts = []
        for p in personas:
            count = sum(1 for pub in publications if pub["persona"] == p)
            persona_counts.append((p, count))
            
        persona_counts.sort(key=lambda x: x[1], reverse=True)
        
        for p_name, p_count in persona_counts:
            p_pct = int((p_count / max(total, 1)) * 100)
            st.markdown(f"""
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-size: 0.85rem; color: #475569; font-weight: 600;">🎯 {p_name}</span>
                <span style="font-size: 0.85rem; color: #1e293b; font-weight: 700;">{p_count} post(s) <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">({p_pct}%)</span></span>
            </div>
            """, unsafe_allow_html=True)


# ----------------- VIEW 1: CALENDAR VIEW -----------------
elif st.session_state.current_nav == "calendar":
    st.markdown("### 📅 Calendrier de Publication")
    st.markdown("Explorez le calendrier éditorial. Cliquez sur un jour ou sur une publication pour l'afficher ou la modifier.")

    # Target month: June 2026 as the seed data center point
    col_sel1, col_sel2, col_sel3 = st.columns([2, 2, 4])
    with col_sel1:
        sel_month = st.selectbox("Mois", options=["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"], index=5)
    with col_sel2:
        sel_year = st.selectbox("Année", options=[2025, 2026, 2027], index=1)
        
    month_map = {
        "Janvier": 1, "Février": 2, "Mars": 3, "Avril": 4, "Mai": 5, "Juin": 6,
        "Juillet": 7, "Août": 8, "Septembre": 9, "Octobre": 10, "Novembre": 11, "Décembre": 12
    }
    month_num = month_map[sel_month]
    
    # Get weeks grid from calendar
    cal = calendar.HTMLCalendar(calendar.MONDAY)
    month_weeks = calendar.monthcalendar(sel_year, month_num)
    
    # Weekday headers
    wdays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
    cols = st.columns(7)
    for i, wday in enumerate(wdays):
        cols[i].markdown(f"<div class='calendar-header'>{wday}</div>", unsafe_allow_html=True)
        
    # Render weeks
    for week in month_weeks:
        cols = st.columns(7)
        for day_idx, day_num in enumerate(week):
            with cols[day_idx]:
                if day_num == 0:
                    st.markdown("<div class='calendar-day-box calendar-day-muted'></div>", unsafe_allow_html=True)
                else:
                    date_str = f"{sel_year}-{month_num:02d}-{day_num:02d}"
                    
                    # Find publications scheduled for this day
                    day_pubs = [p for p in st.session_state.publications if p["date"] == date_str]
                    
                    # Render box day header
                    pub_count_badge = f"<span style='float:right; font-size:0.65rem; background-color:#eff6ff; color:#2563eb; padding:1px 5px; border-radius:4px; font-weight:800;'>{len(day_pubs)}</span>" if day_pubs else ""
                    st.markdown(f"<div class='calendar-day-active'>{day_num} {pub_count_badge}</div>", unsafe_allow_html=True)
                    
                    # Render publication buttons inside day
                    for pub in day_pubs:
                        # Channel badge background styles
                        c_badge = "badge-default"
                        if pub["channel"] == "LinkedIn": c_badge = "badge-linkedin"
                        elif pub["channel"] == "Blog": c_badge = "badge-blog"
                        elif pub["channel"] == "Newsletter": c_badge = "badge-newsletter"
                        elif pub["channel"] == "Instagram": c_badge = "badge-instagram"
                        
                        btn_label = f"[{pub['channel']}] {pub['title']}"
                        
                        # Shorten for card layout
                        if len(btn_label) > 28:
                            btn_label = btn_label[:26] + "..."
                            
                        if st.button(btn_label, key=f"cal_pub_{pub['id']}", use_container_width=True):
                            st.session_state.selected_pub_id = pub["id"]
                            st.session_state.editing_pub_id = pub["id"]
                            
                    # Add new publication directly on this day
                    if active_user["role"] == "editor":
                        if st.button("➕ Ajouter", key=f"add_on_{date_str}", use_container_width=True, type="secondary"):
                            # Prepare a temporary new publication template
                            new_pub_id = f"pub-temp-{int(datetime.datetime.now().timestamp())}"
                            temp_pub = {
                                "id": new_pub_id,
                                "date": date_str,
                                "title": "Nouveau Sujet",
                                "channel": st.session_state.channels[0] if st.session_state.channels else "LinkedIn",
                                "persona": st.session_state.personas[0] if st.session_state.personas else "Tous abonnés",
                                "status": "Idée",
                                "copywriting": "",
                                "kpi": st.session_state.kpis[0] if st.session_state.kpis else "Engagement",
                                "createdBy": active_user["id"]
                            }
                            st.session_state.publications.append(temp_pub)
                            save_pubs()
                            st.session_state.selected_pub_id = new_pub_id
                            st.session_state.editing_pub_id = new_pub_id
                            st.rerun()

    # --- PUBLICATION DRAWER / FORM (RIGHT BAR OR INLINE SECTION) ---
    if st.session_state.selected_pub_id:
        st.markdown("---")
        
        # Lookup publication
        pub = next((p for p in st.session_state.publications if p["id"] == st.session_state.selected_pub_id), None)
        
        if pub:
            is_new_temp = pub["id"].startswith("pub-temp-")
            pub_creator = next((u for u in st.session_state.users if u["id"] == pub["createdBy"]), None)
            creator_name = f"{pub_creator['avatar']} {pub_creator['name']}" if pub_creator else "👤 Jérémy"
            
            st.markdown(f"### ✏️ Édition / Consultation : *{pub['title']}*")
            
            # Roles notification banner
            if active_user["role"] == "viewer":
                st.info("🔒 **Mode Lecture Seule activé :** Vous pouvez consulter cette publication mais seul un utilisateur ayant le rôle **Éditeur** peut appliquer des changements.")
            else:
                st.success("✍️ **Mode Éditeur activé :** Vous disposez des droits complets de modification et de suppression sur cette publication.")
                
            col_form1, col_form2 = st.columns([1, 1])
            
            with col_form1:
                # Disable fields if role is viewer
                dis = active_user["role"] == "viewer"
                
                new_title = st.text_input("Sujet / Titre de la publication", value=pub["title"], disabled=dis)
                new_date = st.date_input("Date de publication planifiée", value=datetime.datetime.strptime(pub["date"], "%Y-%m-%d").date(), disabled=dis)
                
                # Check dynamic select items are valid
                chan_opt = st.session_state.channels
                if pub["channel"] not in chan_opt:
                    chan_opt = [pub["channel"]] + chan_opt
                new_channel = st.selectbox("Canal de distribution", options=chan_opt, index=chan_opt.index(pub["channel"]), disabled=dis)
                
                pers_opt = st.session_state.personas
                if pub["persona"] not in pers_opt:
                    pers_opt = [pub["persona"]] + pers_opt
                new_persona = st.selectbox("Public ciblé (Persona)", options=pers_opt, index=pers_opt.index(pub["persona"]), disabled=dis)
                
            with col_form2:
                stat_opt = st.session_state.statuses
                if pub["status"] not in stat_opt:
                    stat_opt = [pub["status"]] + stat_opt
                new_status = st.selectbox("Statut d'avancement", options=stat_opt, index=stat_opt.index(pub["status"]), disabled=dis)
                
                kpi_opt = st.session_state.kpis
                if pub["kpi"] not in kpi_opt:
                    kpi_opt = [pub["kpi"]] + kpi_opt
                new_kpi = st.selectbox("KPI Objectif Visé", options=kpi_opt, index=kpi_opt.index(pub["kpi"]), disabled=dis)
                
                st.markdown(f"**Créé par :** `{creator_name}`")
                
            # Copywriting Area
            st.markdown("#### 📝 Contenu Rédactionnel (Copywriting)")
            new_copy = st.text_area("Rédigez le texte de votre publication", value=pub.get("copywriting", ""), height=150, disabled=dis)
            
            # AI Optimization assist
            if not dis:
                if st.button("✨ Optimiser / Générer avec l'IA d'EditoFlow", use_container_width=True):
                    # Smart local prompt solver
                    suggested_copy = optimize_copywriting(new_title, new_channel, new_persona, new_kpi, new_copy)
                    st.session_state.optimized_copy_suggest = suggested_copy
                    st.toast("Texte optimisé généré !", icon="✨")
                    
                if "optimized_copy_suggest" in st.session_state:
                    st.markdown("**💡 Proposition de l'IA :**")
                    st.info(st.session_state.optimized_copy_suggest)
                    if st.button("Appliquer cette proposition", type="primary"):
                        new_copy = st.session_state.optimized_copy_suggest
                        del st.session_state.optimized_copy_suggest
                        st.rerun()
            
            # Action controls
            st.markdown("<br>", unsafe_allow_html=True)
            col_actions = st.columns([2, 2, 4])
            
            with col_actions[0]:
                if not dis:
                    if st.button("💾 Enregistrer la publication", type="primary", use_container_width=True):
                        # Save
                        pub["title"] = new_title
                        pub["date"] = new_date.strftime("%Y-%m-%d")
                        pub["channel"] = new_channel
                        pub["persona"] = new_persona
                        pub["status"] = new_status
                        pub["kpi"] = new_kpi
                        pub["copywriting"] = new_copy
                        
                        # Remove temp status
                        if is_new_temp:
                            # Keep it
                            pass
                            
                        save_pubs()
                        st.session_state.selected_pub_id = None
                        st.success("Publication sauvegardée avec succès !")
                        st.rerun()
                else:
                    st.button("Fermer l'aperçu", on_click=lambda: st.session_state.update({"selected_pub_id": None}), use_container_width=True)
                    
            with col_actions[1]:
                if not dis:
                    # Deletion trigger
                    if st.button("🗑️ Supprimer", type="secondary", use_container_width=True, help="Cette action est irréversible"):
                        st.session_state.confirm_delete_pub_id = pub["id"]
                        
            # Inline Deletion Safety Checks
            if "confirm_delete_pub_id" in st.session_state and st.session_state.confirm_delete_pub_id == pub["id"]:
                st.markdown("""
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 1rem; border-radius: 0.5rem; margin-top:10px;">
                    <span style="color:#991b1b; font-weight:bold;">⚠️ Êtes-vous sûr de vouloir supprimer cette publication définitivement ?</span>
                </div>
                """, unsafe_allow_html=True)
                col_del_check = st.columns([1, 1, 6])
                with col_del_check[0]:
                    if st.button("Oui, supprimer", type="primary", key="yes_del_pub"):
                        st.session_state.publications = [p for p in st.session_state.publications if p["id"] != pub["id"]]
                        save_pubs()
                        st.session_state.selected_pub_id = None
                        del st.session_state.confirm_delete_pub_id
                        st.success("Publication supprimée.")
                        st.rerun()
                with col_del_check[1]:
                    if st.button("Annuler", key="no_del_pub"):
                        del st.session_state.confirm_delete_pub_id
                        st.rerun()


# ----------------- VIEW 2: PUBLICATION TABLE -----------------
elif st.session_state.current_nav == "list":
    st.markdown("### 📋 Table des Publications")
    st.markdown("Filtrez, recherchez et gérez l'ensemble des publications de votre équipe.")

    # Table controls (Filters)
    col_f1, col_f2, col_f3, col_f4 = st.columns([2, 1, 1, 1])
    with col_f1:
        search_query = st.text_input("🔍 Rechercher une publication", placeholder="Ex: IA, SaaS, Guide...")
    with col_f2:
        filter_channel = st.selectbox("Canal", options=["Tous"] + st.session_state.channels)
    with col_f3:
        filter_status = st.selectbox("Statut", options=["Tous"] + st.session_state.statuses)
    with col_f4:
        filter_persona = st.selectbox("Public ciblé (Persona)", options=["Tous"] + st.session_state.personas)

    # Apply filters
    filtered_pubs = st.session_state.publications.copy()
    if search_query:
        q = search_query.lower()
        filtered_pubs = [p for p in filtered_pubs if q in p["title"].lower() or q in p.get("copywriting", "").lower()]
    if filter_channel != "Tous":
        filtered_pubs = [p for p in filtered_pubs if p["channel"] == filter_channel]
    if filter_status != "Tous":
        filtered_pubs = [p for p in filtered_pubs if p["status"] == filter_status]
    if filter_persona != "Tous":
        filtered_pubs = [p for p in filtered_pubs if p["persona"] == filter_persona]

    if not filtered_pubs:
        st.info("Aucune publication ne correspond à vos filtres.")
    else:
        # Build pandas dataframe for clean rendering or custom lines
        data_rows = []
        for p in filtered_pubs:
            creator_obj = next((u for u in st.session_state.users if u["id"] == p["createdBy"]), None)
            creator_name = f"{creator_obj['avatar']} {creator_obj['name']}" if creator_obj else "👤 Jérémy"
            
            data_rows.append({
                "Date": p["date"],
                "Sujet / Titre": p["title"],
                "Canal": p["channel"],
                "Persona": p["persona"],
                "KPI": p["kpi"],
                "Auteur": creator_name,
                "Statut": p["status"],
                "Actions": p["id"]
            })
            
        df = pd.DataFrame(data_rows)
        
        # We'll display them in a list of beautiful custom cards with click-to-edit
        for index, row in df.iterrows():
            pub_id = row["Actions"]
            
            # Lookup real pub object
            pub_obj = next((p for p in st.session_state.publications if p["id"] == pub_id), None)
            
            # Status Badge Class
            status_cls = "status-idee"
            if row["Statut"] == "En rédaction": status_cls = "status-redaction"
            elif row["Statut"] == "En révision": status_cls = "status-revision"
            elif row["Statut"] == "Planifié": status_cls = "status-planifie"
            elif row["Statut"] == "Publié": status_cls = "status-publie"
            
            # Channel class
            chan_cls = "badge-default"
            if row["Canal"] == "LinkedIn": chan_cls = "badge-linkedin"
            elif row["Canal"] == "Blog": chan_cls = "badge-blog"
            elif row["Canal"] == "Newsletter": chan_cls = "badge-newsletter"
            elif row["Canal"] == "Instagram": chan_cls = "badge-instagram"
            
            st.markdown(f"""
            <div style="background-color:white; padding:1.25rem; border-radius:0.75rem; border:1px solid #e2e8f0; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                    <div style="font-size:0.75rem; color:#64748b; font-weight:700;">📅 {row['Date']}</div>
                    <div style="font-size:1rem; font-weight:800; color:#1e293b; margin: 4px 0;">{row['Sujet / Titre']}</div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:8px;">
                        <span class="badge {chan_cls}">{row['Canal']}</span>
                        <span style="font-size:0.75rem; color:#64748b; font-weight:600;">🎯 Persona : {row['Persona']}</span>
                        <span style="font-size:0.75rem; color:#94a3b8;">|</span>
                        <span style="font-size:0.75rem; color:#64748b; font-weight:600;">📊 KPI : {row['KPI']}</span>
                        <span style="font-size:0.75rem; color:#94a3b8;">|</span>
                        <span style="font-size:0.75rem; color:#64748b; font-weight:600;">Auteur : {row['Auteur']}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="status-badge {status_cls}">{row['Statut']}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Action button for this item
            col_act_left, col_act_right = st.columns([8, 2])
            with col_act_right:
                action_text = "👁️ Consulter" if active_user["role"] == "viewer" else "✏️ Modifier / Optimiser"
                if st.button(action_text, key=f"edit_tbl_btn_{pub_id}", use_container_width=True):
                    st.session_state.current_nav = "calendar"
                    st.session_state.selected_pub_id = pub_id
                    st.session_state.editing_pub_id = pub_id
                    st.rerun()


# ----------------- VIEW 3: CONFIGURATIONS & TAXONOMIES -----------------
elif st.session_state.current_nav == "configs":
    st.markdown("### ⚙️ Configurations & Taxonomies Globales")
    st.markdown("Structurez vos listes de distribution, KPIs stratégiques, statuts et segments d'audience.")

    is_editor = active_user["role"] == "editor"
    if not is_editor:
        st.warning("🔒 Mode Lecture Seule : Seul un Éditeur peut ajouter ou modifier les taxonomies globales.")
        
    col_c1, col_c2 = st.columns([1, 1])
    
    # 1. Channels
    with col_c1:
        st.markdown("#### 📺 Canaux de distribution")
        for chan in st.session_state.channels:
            col_list1, col_list2 = st.columns([8, 2])
            with col_list1:
                st.code(chan)
            with col_list2:
                if is_editor:
                    if st.button("×", key=f"del_chan_{chan}", help="Supprimer ce canal"):
                        if len(st.session_state.channels) <= 1:
                            st.error("Conservez au moins un canal.")
                        else:
                            st.session_state.channels.remove(chan)
                            save_taxonomy()
                            st.rerun()
                            
        if is_editor:
            with st.form("add_channel_form"):
                new_chan = st.text_input("Ajouter un canal", placeholder="Ex: TikTok")
                if st.form_submit_button("Ajouter") and new_chan.strip():
                    val = new_chan.strip()
                    if val not in st.session_state.channels:
                        st.session_state.channels.append(val)
                        save_taxonomy()
                        st.rerun()

    # 2. KPIs
    with col_c2:
        st.markdown("#### 📊 KPIs Visés")
        for kpi in st.session_state.kpis:
            col_list1, col_list2 = st.columns([8, 2])
            with col_list1:
                st.code(kpi)
            with col_list2:
                if is_editor:
                    if st.button("×", key=f"del_kpi_{kpi}", help="Supprimer ce KPI"):
                        if len(st.session_state.kpis) <= 1:
                            st.error("Conservez au moins un KPI.")
                        else:
                            st.session_state.kpis.remove(kpi)
                            save_taxonomy()
                            st.rerun()
                            
        if is_editor:
            with st.form("add_kpi_form"):
                new_kpi = st.text_input("Ajouter un KPI", placeholder="Ex: Ventes")
                if st.form_submit_button("Ajouter") and new_kpi.strip():
                    val = new_kpi.strip()
                    if val not in st.session_state.kpis:
                        st.session_state.kpis.append(val)
                        save_taxonomy()
                        st.rerun()

    col_c3, col_c4 = st.columns([1, 1])
    
    # 3. Statuses
    with col_c3:
        st.markdown("#### 🏷️ Statuts de workflow")
        for stat in st.session_state.statuses:
            col_list1, col_list2 = st.columns([8, 2])
            with col_list1:
                st.code(stat)
            with col_list2:
                if is_editor:
                    if st.button("×", key=f"del_stat_{stat}", help="Supprimer ce statut"):
                        if len(st.session_state.statuses) <= 1:
                            st.error("Conservez au moins un statut.")
                        else:
                            st.session_state.statuses.remove(stat)
                            save_taxonomy()
                            st.rerun()
                            
        if is_editor:
            with st.form("add_status_form"):
                new_stat = st.text_input("Ajouter un statut", placeholder="Ex: Archivé")
                if st.form_submit_button("Ajouter") and new_stat.strip():
                    val = new_stat.strip()
                    if val not in st.session_state.statuses:
                        st.session_state.statuses.append(val)
                        save_taxonomy()
                        st.rerun()

    # 4. Personas
    with col_c4:
        st.markdown("#### 🎯 Publics Cibles (Personas)")
        for pers in st.session_state.personas:
            col_list1, col_list2 = st.columns([8, 2])
            with col_list1:
                st.code(pers)
            with col_list2:
                if is_editor:
                    if st.button("×", key=f"del_pers_{pers}", help="Supprimer ce public"):
                        if len(st.session_state.personas) <= 1:
                            st.error("Conservez au moins un public.")
                        else:
                            st.session_state.personas.remove(pers)
                            save_taxonomy()
                            st.rerun()
                            
        if is_editor:
            with st.form("add_persona_form"):
                new_pers = st.text_input("Ajouter un public", placeholder="Ex: Freelancers")
                if st.form_submit_button("Ajouter") and new_pers.strip():
                    val = new_pers.strip()
                    if val not in st.session_state.personas:
                        st.session_state.personas.append(val)
                        save_taxonomy()
                        st.rerun()

    # Reset default configs
    if is_editor:
        st.markdown("---")
        st.markdown("#### ⚠️ Zone de réinitialisation")
        if st.button("Restaurer les taxonomies d'origine d'EditoFlow", type="secondary"):
            st.session_state.channels = DEFAULT_TAXONOMY["channels"].copy()
            st.session_state.kpis = DEFAULT_TAXONOMY["kpis"].copy()
            st.session_state.statuses = DEFAULT_TAXONOMY["statuses"].copy()
            st.session_state.personas = DEFAULT_TAXONOMY["personas"].copy()
            save_taxonomy()
            st.success("Configurations techniques restaurées !")
            st.rerun()
