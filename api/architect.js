export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { mode, inputData, contextData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    let systemPrompt = "";

    if (mode === "plu") {
        // MODE 1 : ASSISTANT RÈGLEMENTAIRE
        systemPrompt = `Tu es un Expert en Urbanisme et Droit de la Construction.
        Voici un extrait du RÈGLEMENT (PLU) fourni par l'architecte :
        "${contextData}"

        QUESTION DE L'ARCHITECTE : "${inputData}"

        MISSION :
        Réponds uniquement en te basant sur le texte fourni.
        Cite l'article précis s'il existe.
        Sois synthétique et direct (Style : Note de synthèse).
        Si l'info n'est pas dans le texte, dis-le clairement.`;
    } 
    else if (mode === "report") {
        // MODE 2 : COMPTE-RENDU DE CHANTIER
        systemPrompt = `Tu es un Assistant de Maîtrise d'Œuvre.
        Voici les NOTES EN VRAC prises sur le chantier :
        "${inputData}"

        MISSION :
        Transforme ces notes en un "Compte-Rendu de Chantier" professionnel et structuré.
        1. Classe les remarques par LOT (Maçonnerie, Plomberie, Électricité, Peinture...).
        2. Utilise un ton impératif et professionnel (ex: "L'entreprise X doit reprendre...").
        3. Ajoute une section "Planning" si des dates sont mentionnées.
        4. Ajoute une mention légale standard en bas.
        
        Format de sortie : Texte brut bien mis en forme avec des titres clairs.`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        res.status(200).send(rawText); // On renvoie du texte brut ici, plus simple pour le copier-coller

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}