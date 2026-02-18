export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { mode, inputData, pdfContent, quoteContent, images, currentDate, projectName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    let promptText = "";
    const safeProject = projectName || "Projet sans nom";
    const langForce = " RÉPONDS IMPÉRATIVEMENT EN FRANÇAIS.";

    if (mode === "plu") {
        promptText = `Expert Urbanisme. PROJET : ${safeProject}. Analyse ce PLU : "${pdfContent}". 
        Instruction : "${inputData}". 
        CONSIGNE ABSOLUE : Termine par un TABLEAU RÉCAPITULATIF Markdown (Thème | Règle | Article).` + langForce;

    } else if (mode === "control") {
        promptText = `ROLE: Contrôleur Technique Bâtiment (Sécurité & Accessibilité).
        PROJET: ${safeProject}.
        DOCUMENTS: Plan (Image/PDF) + Contexte : "${inputData}".
        
        ⚠️ CONSIGNE LECTURE (OCR) :
        - IGNORE les cotes extérieures (Limites, Façades totales).
        - FOCUS sur les cotes INTÉRIEURES (Largeur couloir, portes, pièces) pour l'échelle.
        
        MISSION : Audit de conformité.
        
        RÈGLES DE RÉDACTION :
        - Tableau ULTRA-COMPACT.
        - Mots-clés uniquement.
        
        CHECKLIST :
        1. [ÉVACUATION] : Culs-de-sac, Largeurs UP.
        2. [DÉSENFUMAGE] : Locaux aveugles.
        3. [ACCESSIBILITÉ] : Rotation PMR.

        FORMAT DE RÉPONSE ATTENDU (Markdown) :
        
        # 🛡️ AUDIT TECHNIQUE
        
        ## 1. Calibrage Échelle
        *Référence lue : [Citer la cote intérieure]*

        ## 2. Tableau de Contrôle
        | Point Vérifié | Mesure Lue/Estimée | Règle | Verdict |
        | :--- | :--- | :--- | :---: |
        | Cul-de-sac | ~12.50m | Max 10m | 🔴 NOK |
        | Coul. Principal | 1.20m | Min 1.40m | ⚠️ À voir |

        ## 3. Prescriptions
        - [Point à corriger]` + langForce;

    } else if (mode === "acoustic") {
        promptText = `ROLE: Ingénieur Acousticien Expert.
        PROJET: ${safeProject}.
        DOCUMENTS: Plan (Image/PDF) + Contexte : "${inputData}".
        
        MISSION : Analyse acoustique visuelle.
        
        ANALYSE VISUELLE DU PLAN :
        - Cherche les contiguïtés critiques (ex: Gaine technique / Chambre, Ascenseur / Salon, WC / Bureau).
        - Repère les façades exposées.
        
        RÉFÉRENCES : NRA 2000 (Logement), NF S 31-080 (Bureaux).

        FORMAT DE RÉPONSE ATTENDU (Markdown) :
        
        # 🔇 RAPPORT ACOUSTIQUE
        
        ## 1. Zones Critiques (Sur Plan)
        *Points de vigilance repérés :*
        - [Point 1 : ex: "Chambre mitoyenne Ascenseur"] -> *Risque élevé*.
        
        ## 2. Objectifs & Solutions
        | Local Émission | Local Réception | Objectif (DnT,A) | Solution Matériau (Rw+C) |
        | :--- | :--- | :---: | :--- |
        | Extérieur | Intérieur | 30/35 dB | Vitrage 4/16/44.2 |
        | Séjour A | Séjour B | 53 dB | Voile béton 18cm |
        | WC | Chambre | 47 dB | Cloison 98/48 |
        
        ## 3. Conseils Mise en Oeuvre
        - [Conseil technique]` + langForce;

    } else if (mode === "permit") {
        if (inputData.includes("ACTION: IDENTIFICATION CERFA")) {
            promptText = `ROLE: Expert Administratif. CONTEXTE : ${inputData}. Identifie le CERFA exact. Explique pourquoi.` + langForce;
        } else {
            promptText = `ROLE: Architecte DPLG. TACHE : Rédige la NOTICE PC4 pour "${safeProject}". CONTEXTE : "${inputData}". ANALYSE VISUELLE : Décris volumétrie, matériaux, insertion. Structure Markdown.` + langForce;
        }

    } else if (mode === "comparison") {
        promptText = `Économiste. Compare le Devis B ("${quoteContent}") au CCTP A ("${pdfContent}"). Tableau de conformité requis.` + langForce;
    } else if (mode === "situation") {
        promptText = `Expert Travaux. Valide l'avancement (%) sur photos vs devis ("${quoteContent || pdfContent}"). Tableau requis.` + langForce;
    } else if (mode === "report") {
        promptText = `Expert MOE. Rapport chantier du ${currentDate}. Analyse images et notes. Structure par lot.` + langForce;
    } else if (mode === "planning") {
        promptText = `Planificateur BTP. Génère un Gantt/Planning prévisionnel Markdown basé sur : "${inputData}".` + langForce;
    } else if (mode === "legal") {
        promptText = `Juriste BTP. Rédige un courrier formel ou OS basé sur : "${inputData}". Ton professionnel.` + langForce;
    } else {
        promptText = `Expert Archi. Analyse technique : "${pdfContent || "Image"}".` + langForce;
    }

    let parts = [{ text: promptText }];
    if (images && images.length > 0) images.forEach(img => parts.push({ inline_data: { mime_type: "image/jpeg", data: img } }));

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });
        const data = await response.json();
        res.status(200).send(data.candidates[0].content.parts[0].text);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}