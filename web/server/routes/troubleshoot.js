import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import auth from "../middleware/auth.js";
import { callClaude } from "../utils/claudeClient.js";
import { TROUBLESHOOT_SYSTEM_PROMPT } from "../prompts/troubleshoot.js";

const router = Router();

const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "poolpal" } }
);

router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      equipment_type,
      equipment_brand,
      pool_type,
      symptom,
      environment,
      already_tried = [],
      follow_up,
      session_id,
    } = req.body;

    // SUBSCRIPTION GATE — only counts NEW sessions; follow-ups are free
    if (!session_id && req.profile.subscription_tier === "free") {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count } = await supabaseService
        .from("troubleshoot_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth);
      if (count >= 2) {
        return res.status(403).json({
          error: "Monthly limit reached",
          message: "Free tier allows 2 troubleshoot sessions per month. Upgrade to Pro for unlimited.",
        });
      }
    }

    // Load existing session for follow-up
    let existingSession = null;
    let existingHistory = [];
    if (session_id) {
      const { data, error: fetchError } = await supabaseService
        .from("troubleshoot_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", userId)
        .single();
      if (fetchError || !data) {
        return res.status(404).json({ error: "Session not found" });
      }
      existingSession = data;
      existingHistory = data.conversation_json || [];
    }

    if (!session_id && (!symptom || typeof symptom !== "string" || !symptom.trim())) {
      return res.status(400).json({ error: "A symptom description is required" });
    }

    const userMessage = session_id && follow_up
      ? `${follow_up}\n\nRespond with a JSON object exactly matching the schema in your instructions. No prose before or after, no markdown code fences.`
      : buildTroubleshootMessage(req.body);

    const messages = existingHistory.length > 0
      ? [...existingHistory, { role: "user", content: userMessage }]
      : [{ role: "user", content: userMessage }];

    // CLAUDE API CALL: PoolPal troubleshoot diagnosis
    // Model routing: simple symptoms → Haiku, complex → Sonnet
    // Complexity signals passed via context — see utils/modelRouter.js
    const troubleshootContext = {
      // Prior conversation turns — multi-turn escalates to Sonnet
      conversationHistory: existingHistory,

      // Primary symptom for safety keyword detection
      symptom: req.body.symptom || req.body.symptomDescription || '',

      // Chemistry readings provided = quantitative diagnosis = Sonnet
      hasChemistryReadings: !!(
        req.body.chemistry_readings &&
        Object.keys(req.body.chemistry_readings || {}).length > 0
      ),

      // Commercial pool = stricter health code standards = Sonnet
      isCommercial: (req.body.pool_type || '').toLowerCase().includes('commercial'),

      // Salt SWG or specialty sanitizer = system-specific diagnosis = Sonnet
      isSpecialtySanitizer: ['salt', 'swg', 'bromine', 'mineral',
        'uv', 'ozone'].some(
        s => (req.body.sanitizer_type || '').toLowerCase().includes(s)
      ),

      // Pool volume known = dosing calculations possible = Sonnet
      hasPoolVolume: !!(req.body.pool_volume && String(req.body.pool_volume).trim()),

      // 2+ already-tried steps = beyond basic remediation = Sonnet
      alreadyTriedMultiple: (req.body.already_tried?.length || 0) >= 2,

      // Code compliance not typically required for pool service
      requiresCodeCompliance: false,
      isSpecialtyMaterial: false,
    };

    const aiResult = await callClaude({
      feature: 'troubleshoot',
      context: troubleshootContext,
      systemPrompt: TROUBLESHOOT_SYSTEM_PROMPT,
      messages,
    });
    var rawText = aiResult.content;
    let result;
    try {
      // Strip markdown code fences if present, then parse
      const stripped = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      try {
        result = JSON.parse(stripped);
      } catch {
        // Fallback: extract first top-level JSON object by matching balanced braces
        const start = stripped.indexOf("{");
        if (start === -1) throw new Error("No JSON found");
        let depth = 0;
        let end = -1;
        for (let i = start; i < stripped.length; i++) {
          if (stripped[i] === "{") depth++;
          else if (stripped[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end === -1) throw new Error("Unbalanced JSON");
        result = JSON.parse(stripped.slice(start, end + 1));
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr.message, rawText);
      return res.status(500).json({ error: "Failed to parse troubleshoot result", raw: rawText });
    }

    const updatedHistory = [...messages, { role: "assistant", content: rawText }];

    const sessionPayload = {
      user_id: userId,
      equipment_type: equipment_type || existingSession?.equipment_type,
      equipment_brand: equipment_brand || existingSession?.equipment_brand,
      pool_type: pool_type || existingSession?.pool_type,
      symptom: symptom || existingSession?.symptom,
      environment: environment || existingSession?.environment,
      conversation_json: updatedHistory,
      resolved: existingSession?.resolved ?? false,
    };

    let savedSession;
    if (session_id && existingSession) {
      const { data, error: updateError } = await supabaseService
        .from("troubleshoot_sessions")
        .update(sessionPayload)
        .eq("id", session_id)
        .select()
        .single();
      if (updateError) {
        console.error("Session update error:", updateError);
        return res.json({ result, session_id, saved: false, model: aiResult.model });
      }
      savedSession = data;
    } else {
      const { data, error: insertError } = await supabaseService
        .from("troubleshoot_sessions")
        .insert(sessionPayload)
        .select()
        .single();
      if (insertError) {
        console.error("Session insert error:", insertError);
        return res.json({ result, saved: false, model: aiResult.model });
      }
      savedSession = data;
    }

    return res.json({ result, session_id: savedSession.id, model: aiResult.model });
  } catch (err) {
    console.error("Troubleshoot error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Builds the user message from form fields.
// Supports current PoolPal fields (equipment_type, equipment_brand, pool_type,
// symptom, environment, already_tried) plus additional spec fields
// (problem_category, pool_volume, surface_type, sanitizer_type, filter_psi,
// chemistry_readings) if the frontend is extended later to send them.
function buildTroubleshootMessage(body) {
  const lines = [];

  if (body.problem_category) {
    const categoryLabels = {
      water_chemistry: 'Water chemistry problem',
      equipment: 'Equipment issue',
      algae: 'Algae problem',
      water_clarity: 'Water clarity / cloudiness',
      surface: 'Pool surface condition',
      leak: 'Suspected leak',
      other: 'Other',
    };
    lines.push(`Problem type: ${categoryLabels[body.problem_category] || body.problem_category}`);
  }
  if (body.equipment_type) lines.push(`Equipment type: ${body.equipment_type}`);
  if (body.pool_type) lines.push(`Pool type: ${body.pool_type}`);
  if (body.pool_volume && String(body.pool_volume).trim()) {
    lines.push(`Pool volume: ${String(body.pool_volume).trim()} gallons`);
  }
  if (body.surface_type) lines.push(`Surface type: ${body.surface_type}`);
  if (body.sanitizer_type) lines.push(`Sanitizer system: ${body.sanitizer_type}`);
  if (body.equipment_brand && String(body.equipment_brand).trim()) {
    lines.push(`Equipment brand: ${String(body.equipment_brand).trim()}`);
  }
  if (body.environment) lines.push(`Environment: ${body.environment}`);
  if (body.filter_psi && String(body.filter_psi).trim()) {
    lines.push(`Current filter pressure: ${String(body.filter_psi).trim()} PSI`);
  }

  // Chemistry readings — include all provided values
  if (body.chemistry_readings &&
      typeof body.chemistry_readings === 'object' &&
      Object.keys(body.chemistry_readings).length > 0) {
    const readings = [];
    const r = body.chemistry_readings;
    if (r.free_chlorine != null || r.freeChlorine != null) {
      readings.push(`FC: ${r.free_chlorine ?? r.freeChlorine} ppm`);
    }
    if (r.ph != null || r.pH != null) {
      readings.push(`pH: ${r.ph ?? r.pH}`);
    }
    if (r.total_alkalinity != null || r.totalAlkalinity != null) {
      readings.push(`TA: ${r.total_alkalinity ?? r.totalAlkalinity} ppm`);
    }
    if (r.cyanuric_acid != null || r.cyanuricAcid != null) {
      readings.push(`CYA: ${r.cyanuric_acid ?? r.cyanuricAcid} ppm`);
    }
    if (r.calcium_hardness != null || r.calciumHardness != null) {
      readings.push(`CH: ${r.calcium_hardness ?? r.calciumHardness} ppm`);
    }
    if (r.salt != null) readings.push(`Salt: ${r.salt} ppm`);
    if (r.phosphates != null) readings.push(`Phosphates: ${r.phosphates} ppb`);
    if (r.combined_chlorine != null || r.combinedChlorine != null) {
      readings.push(`CC: ${r.combined_chlorine ?? r.combinedChlorine} ppm`);
    }
    if (readings.length > 0) {
      lines.push(`Current chemistry readings: ${readings.join(', ')}`);
    }
  }

  if (body.already_tried && body.already_tried.length > 0) {
    lines.push(`Already tried: ${body.already_tried.join(', ')}`);
  }
  if (body.symptom && String(body.symptom).trim()) {
    lines.push(`Technician description: ${String(body.symptom).trim()}`);
  }

  const contextBlock = lines.length > 0
    ? lines.join('\n')
    : 'No additional context provided.';

  return `${contextBlock}\n\nDiagnose this pool/spa problem and return your complete assessment as a JSON object exactly matching the schema in your instructions. Determine swimming safety first.`;
}

export default router;
