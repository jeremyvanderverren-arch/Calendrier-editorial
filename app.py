import streamlit as st
import pandas as pd
import datetime
import json
import os
import calendar

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
    
    /* Code and ID styles */
    code, pre {
        font-family: 'JetBrains Mono', monospace !important;
    }
    
    /* Header & Titles */
    .app-header {
        background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
        padding: 2rem;
        border-radius: 1rem;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    
    .app-title {
        font-weight: 800;
        letter-spacing: -0.025em;
        margin: 0;
    }
    
    .app-subtitle {
        color: #e0e7ff;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        font-weight: 500;
    }
    
    /* Custom Card Style */
    .custom-card {
        background-color: white;
        padding: 1.5rem;
        border-radius: 1rem;
        border: 1px solid #f1f5f9;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        margin-bottom: 1rem;
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
    .badge-linkedin { background-color: #e0f2fe; color: #0369a1; }
    .badge-blog { background-color: #f1f5f9; color: #334155; }
    .badge-newsletter { background-color: #f0fdf4; color: #15803d; }
    .badge-instagram { background-color: #fdf2f8; color: #be185d; }
    .badge-default { background-color: #f3e8ff; color: #6b21a8; }
    
    /* Statuses color mapping */
    .status-badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.7rem;
        font-weight: 700;
        border: 1px solid;
    }
    .status-idee { background-color: #f8fafc; border-color: #cbd5e1; color: #475569; }
    .status-redaction { background-color: #fffbeb; border-color: #fde68a; color: #b45309; }
    .status-revision { background-color: #f0fdfa; border-color: #99f6e4; color: #0f766e; }
    .status-planifie { background-color: #e0f2fe; border-color: #bae6fd; color: #0369a1; }
    .status-publie { background-color: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
    
    /* Calendar Grid UI components */
    .calendar-header {
        text-align: center;
        font-weight: 700;
        font-size: 0.85rem;
        color: #64748b;
        background-color: #f1f5f9;
        padding: 0.5rem;
        border-radius: 0.375rem;
        margin-bottom: 0.5rem;
    }
    
    .calendar-day-box {
        background-color: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 0.5rem;
        min-height: 100px;
        transition: all 0.2s;
    }
    
    .calendar-day-box:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }
    
    .calendar-day-active {
        font-weight: 800;
        color: #1e293b;
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
        background-color: #f1f5f9;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #e2e8f0;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- LOCAL DATA STORAGE PERSISTENCE -----------------
# We use local files to persist data, simulating Firestore/localStorage on a clean build
PUBS_FILE = "storage_pubs.json"
USERS_FILE = "storage_users.json"
TAXONOMY_FILE = "storage_taxonomy.json"

DEFAULT_USERS = [
    {"id": "u-1", "name": "Jérémy", "email": "jeremy.vanderverren@ucm.be", "role": "editor", "avatar": "👨‍💻"},
    {"id": "u-2", "name": "Alice", "email": "alice@ucm.be", "role": "viewer", "avatar": "👩‍💼"},
    {"id": "u-3", "name": "Laurent", "email": "laurent@ucm.be", "role": "editor", "avatar": "👨‍🎨"},
    {"id": "u-4", "name": "Sophie", "email": "sophie@ucm.be", "role": "viewer", "avatar": "👩‍🔬"}
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

# ----------------- SIDEBAR: LOGIN & NAVIGATION -----------------
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80", width=80)
    st.markdown("## 📅 EditoFlow")
    st.markdown("<p style='font-size: 0.8rem; color:#64748b; margin-top:-10px;'>Outil de Planification & Optimisation Éditoriale</p>", unsafe_allow_html=True)
    st.markdown("---")

    # --- STANDARD EMAIL LOGIN / RECOGNITION SYSTEM ---
    st.markdown("### 🔑 Identification Collaborateur")
    login_email = st.text_input("Saisissez votre e-mail", value="", placeholder="Ex: jeremy.vanderverren@ucm.be", key="login_email_input")
    
    if st.button("Se connecter par e-mail", use_container_width=True):
        cleaned_email = login_email.strip().lower()
        if cleaned_email:
            matched = None
            for u in st.session_state.users:
                if u["email"].lower() == cleaned_email:
                    matched = u
                    break
            
            if matched:
                st.session_state.current_user_id = matched["id"]
                st.success(f"Bienvenue, {matched['name']} !")
                st.rerun()
            else:
                st.error(f"Aucun compte associé à '{cleaned_email}'. Créez d'abord ce compte dans l'onglet '👥 Équipe'.")
    
    # Fast switch dropdown for easier simulation
    st.markdown("<p style='font-size:0.75rem; color:#94a3b8; font-weight:bold; margin-bottom:5px;'>Simulateur rapide de profil :</p>", unsafe_allow_html=True)
    sim_user_names = [f"{u['avatar']} {u['name']} ({'Éditeur' if u['role']=='editor' else 'Lecteur'})" for u in st.session_state.users]
    
    # Find index of current user
    curr_idx = 0
    for idx, u in enumerate(st.session_state.users):
        if u["id"] == st.session_state.current_user_id:
            curr_idx = idx
            break
            
    sim_switch = st.selectbox(
        "Changer d'utilisateur simulé",
        options=sim_user_names,
        index=curr_idx,
        key="sim_switch_select",
        label_visibility="collapsed"
    )
    
    # Detect quick selector change
    selected_user_id = st.session_state.users[sim_user_names.index(sim_switch)]["id"]
    if selected_user_id != st.session_state.current_user_id:
        st.session_state.current_user_id = selected_user_id
        st.rerun()

    # Active user card presentation
    st.markdown("### 👤 Session Actuelle")
    active_user = get_active_user()
    role_color = "emerald" if active_user["role"] == "editor" else "orange"
    role_title = "Éditeur (Modifications autorisées)" if active_user["role"] == "editor" else "Lecteur (Lecture seule)"
    
    st.markdown(f"""
    <div class="user-profile-badge">
        <span style="font-size:1.8rem;">{active_user.get('avatar', '👤')}</span>
        <div style="min-width:0; flex:1;">
            <div style="font-weight:700; color:#1e293b; font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{active_user['name']}</div>
            <div style="font-size:0.75rem; color:#64748b; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{active_user['email']}</div>
            <span class="badge" style="background-color: {'#dcfce7' if active_user['role']=='editor' else '#ffedd5'}; color: {'#15803d' if active_user['role']=='editor' else '#c2410c'}; font-size:0.65rem; padding: 0.1rem 0.4rem; margin-top:4px;">
                {active_user['role'].upper()}
            </span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")
    
    # Navigation list
    st.markdown("### 🧭 Navigation")
    menu_options = {
        "calendar": "📅 Calendrier Visuel",
        "list": "📋 Liste des Publications",
        "team": "👥 Équipe & Rôles",
        "configs": "⚙️ Configuration Taxonomies"
    }
    
    if "current_nav" not in st.session_state:
        st.session_state.current_nav = "calendar"
        
    for key, val in menu_options.items():
        # Highlight active menu
        btn_type = "primary" if st.session_state.current_nav == key else "secondary"
        if st.button(val, key=f"nav_btn_{key}", use_container_width=True, type=btn_type):
            st.session_state.current_nav = key
            st.session_state.selected_pub_id = None
            st.session_state.editing_pub_id = None
            st.rerun()

    st.markdown("---")
    # Quick Statistics Widget
    total_pubs = len(st.session_state.publications)
    st.markdown(f"**Total Publications :** `{total_pubs}`")
    
    # Progress bars by status
    st.markdown("<p style='font-size:0.8rem; font-weight:bold; color:#64748b; margin-bottom:5px;'>Statut des publications</p>", unsafe_allow_html=True)
    for stat in st.session_state.statuses:
        count = sum(1 for p in st.session_state.publications if p["status"] == stat)
        ratio = count / max(total_pubs, 1)
        st.markdown(f"<p style='font-size:0.7rem; margin:0;'>{stat} ({count})</p>", unsafe_allow_html=True)
        st.progress(ratio)

# ----------------- MAIN PANEL HEADER -----------------
st.markdown(f"""
<div class="app-header">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div>
            <h1 class="app-title">EditoFlow 🚀</h1>
            <p class="app-subtitle">Planification collaborative, contrôle des droits d'édition et optimisation de contenu.</p>
        </div>
        <div style="background-color: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 0.5rem; text-align:right;">
            <div style="font-size:0.75rem; color:#e0e7ff; font-weight:700;">PROFIL ACTUEL</div>
            <div style="font-weight:800; font-size:1.1rem;">{active_user['avatar']} {active_user['name']}</div>
            <div style="font-size:0.7rem; color:#c7d2fe; font-weight:700;">{role_title}</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ----------------- AI COPYWRITING OPTIMIZER FUNCTION -----------------
def optimize_copywriting(title, channel, persona, kpi):
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


# ----------------- VIEW 1: CALENDAR VIEW -----------------
if st.session_state.current_nav == "calendar":
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
                    suggested_copy = optimize_copywriting(new_title, new_channel, new_persona, new_kpi)
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


# ----------------- VIEW 3: TEAM & ROLES (WITH STANDARD USER DELETION & EMAIL ASSOCIATION) -----------------
elif st.session_state.current_nav == "team":
    st.markdown("### 👥 Équipe & Gestion des Rôles")
    st.markdown("Déclarez des collaborateurs, associez-les à une adresse e-mail unique pour la reconnaissance d'accès, et configurez leurs rôles.")

    # Create layout
    col_t1, col_t2 = st.columns([2, 3])
    
    with col_t1:
        st.markdown("#### ➕ Ajouter un collaborateur")
        
        # Disable if user is viewer
        is_viewer_mode = active_user["role"] == "viewer"
        
        if is_viewer_mode:
            st.warning("🔒 Seul un **Éditeur** peut ajouter ou supprimer des collaborateurs.")
            
        with st.form("add_user_form", clear_on_submit=True):
            new_name = st.text_input("Nom complet", placeholder="Ex: Jean Dupont", disabled=is_viewer_mode)
            new_email = st.text_input("Adresse e-mail unique (Reconnaissance d'accès)", placeholder="Ex: jean.dupont@ucm.be", disabled=is_viewer_mode)
            new_role = st.selectbox("Rôle stratégique", options=["editor", "viewer"], format_func=lambda x: "✍️ Éditeur (Droit complet)" if x == "editor" else "👁️ Lecteur (Lecture seule uniquement)", disabled=is_viewer_mode)
            new_avatar = st.selectbox("Avatar Emoji", options=["👨‍💻", "👩‍💼", "👨‍🎨", "👩‍🔬", "👨‍💼", "👩‍💻", "👤"], disabled=is_viewer_mode)
            
            submit_user = st.form_submit_button("Enregistrer le collaborateur", disabled=is_viewer_mode)
            
            if submit_user and not is_viewer_mode:
                # Validations
                name_clean = new_name.strip()
                email_clean = new_email.strip().lower()
                
                if not name_clean or not email_clean:
                    st.error("Le nom complet et l'adresse e-mail sont obligatoires.")
                elif any(u["name"].lower() == name_clean.lower() for u in st.session_state.users):
                    st.error("Un collaborateur avec ce nom existe déjà.")
                elif any(u["email"].lower() == email_clean for u in st.session_state.users):
                    st.error("Cette adresse e-mail est déjà associée à un autre collaborateur.")
                else:
                    # Save
                    new_id = f"u-{int(datetime.datetime.now().timestamp())}"
                    st.session_state.users.append({
                        "id": new_id,
                        "name": name_clean,
                        "email": email_clean,
                        "role": new_role,
                        "avatar": new_avatar
                    })
                    save_users()
                    st.success(f"Collaborateur {name_clean} enregistré avec succès !")
                    st.rerun()

    with col_t2:
        st.markdown("#### 📋 Liste de l'Équipe")
        
        for u in st.session_state.users:
            is_active_sim = u["id"] == st.session_state.current_user_id
            active_border = "border: 2px solid #4f46e5; background-color: #f5f3ff;" if is_active_sim else "border: 1px solid #e2e8f0; background-color: white;"
            role_tag = "✍️ Éditeur" if u["role"] == "editor" else "👁️ Lecteur seul"
            
            st.markdown(f"""
            <div style="padding: 1rem; border-radius: 0.75rem; margin-bottom: 12px; {active_border}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap: 12px;">
                        <span style="font-size: 2rem;">{u['avatar']}</span>
                        <div>
                            <div style="font-weight: 800; font-size: 0.95rem; color:#1e293b;">
                                {u['name']} { ' <span style="font-size:0.7rem; background-color:#4f46e5; color:white; padding:1px 5px; border-radius:3px; margin-left:5px;">SIMULÉ</span>' if is_active_sim else '' }
                            </div>
                            <div style="font-size: 0.8rem; color:#64748b; font-family: 'JetBrains Mono', monospace;">{u['email']}</div>
                            <div style="font-size: 0.75rem; font-weight:700; color:{'#15803d' if u['role']=='editor' else '#b45309'}; margin-top:4px;">{role_tag}</div>
                        </div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # User delete and simulated switcher buttons
            col_item1, col_item2, col_item3 = st.columns([3, 3, 4])
            with col_item1:
                if not is_active_sim:
                    if st.button("🔌 Activer ce profil", key=f"act_user_{u['id']}", use_container_width=True):
                        st.session_state.current_user_id = u["id"]
                        st.success(f"Session basculée sur {u['name']}.")
                        st.rerun()
            
            with col_item2:
                # Double-confirmation block for user deletion (exactly resolving user delete bugs!)
                if not is_viewer_mode:
                    if st.button("🗑️ Supprimer", key=f"del_user_{u['id']}", use_container_width=True):
                        st.session_state.user_to_delete = u["id"]
                        st.rerun()
            
            # Standard delete inline warning confirmation
            if "user_to_delete" in st.session_state and st.session_state.user_to_delete == u["id"]:
                st.markdown(f"""
                <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 0.75rem; border-radius: 0.5rem; margin-top:5px; margin-bottom:5px;">
                    <span style="color:#991b1b; font-size:0.8rem; font-weight:bold;">⚠️ Confirmer la suppression définitive de {u['name']} ?</span>
                </div>
                """, unsafe_allow_html=True)
                col_confirm1, col_confirm2, col_confirm3 = st.columns([2, 2, 6])
                with col_confirm1:
                    if st.button("Oui, Supprimer", key=f"confirm_yes_del_u_{u['id']}", type="primary"):
                        if len(st.session_state.users) <= 1:
                            st.error("Impossible de supprimer le dernier utilisateur.")
                        else:
                            # Remove
                            remaining = [item for item in st.session_state.users if item["id"] != u["id"]]
                            st.session_state.users = remaining
                            save_users()
                            
                            # If active user deleted, fallback
                            if is_active_sim:
                                st.session_state.current_user_id = remaining[0]["id"]
                                
                            del st.session_state.user_to_delete
                            st.success(f"L'utilisateur {u['name']} a été supprimé.")
                            st.rerun()
                with col_confirm2:
                    if st.button("Annuler", key=f"confirm_no_del_u_{u['id']}"):
                        del st.session_state.user_to_delete
                        st.rerun()


# ----------------- VIEW 4: CONFIGURATIONS & TAXONOMIES -----------------
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
