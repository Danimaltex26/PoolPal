import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "poolpal" } }
);

const CERT_LEVELS = [
  { key: "CPO",         name: "CPO",         fullTitle: "Certified Pool Operator",      questionCount: 50,  timeMinutes: 75,  passPercent: 70 },
  { key: "CST",         name: "CST",         fullTitle: "Certified Service Technician", questionCount: 60,  timeMinutes: 90,  passPercent: 70 },
  { key: "RESIDENTIAL", name: "Residential", fullTitle: "Residential Pool Specialist",  questionCount: 50,  timeMinutes: 75,  passPercent: 70 },
  { key: "COMMERCIAL",  name: "Commercial",  fullTitle: "Commercial Pool Specialist",   questionCount: 75,  timeMinutes: 120, passPercent: 72 },
];

// GET /path — Returns the certification ladder with user progress
router.get("/path", async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all modules (for counts and estimated hours)
    const { data: modules, error: modErr } = await supabase
      .from("training_modules")
      .select("cert_level, estimated_minutes")
      .eq("is_published", true);

    if (modErr) throw modErr;

    // Fetch user readiness for all cert levels
    const { data: readinessRows, error: readErr } = await supabase
      .from("training_readiness")
      .select("cert_level, overall_readiness_percent")
      .eq("user_id", userId);

    if (readErr) throw readErr;

    // Build lookup maps
    const moduleCounts = {};
    const estimatedHours = {};
    for (const m of modules || []) {
      moduleCounts[m.cert_level] = (moduleCounts[m.cert_level] || 0) + 1;
      estimatedHours[m.cert_level] = (estimatedHours[m.cert_level] || 0) + m.estimated_minutes;
    }

    const readinessMap = {};
    for (const r of readinessRows || []) {
      readinessMap[r.cert_level] = Number(r.overall_readiness_percent) || 0;
    }

    // Determine locked status — CPO → CST → RESIDENTIAL/COMMERCIAL (parallel)
    const cpoReady = readinessMap["CPO"] || 0;
    const cstReady = readinessMap["CST"] || 0;

    function isUnlocked(key) {
      if (key === "CPO") return true;
      if (key === "CST") return cpoReady >= 80;
      if (key === "RESIDENTIAL") return cstReady >= 80;
      if (key === "COMMERCIAL") return cstReady >= 80;
      return false;
    }

    const path = CERT_LEVELS.map((level) => ({
      key: level.key,
      name: level.name,
      fullTitle: level.fullTitle,
      questionCount: level.questionCount,
      timeMinutes: level.timeMinutes,
      passPercent: level.passPercent,
      moduleCount: moduleCounts[level.key] || 0,
      estimatedHours: Math.round(((estimatedHours[level.key] || 0) / 60) * 10) / 10,
      readiness: readinessMap[level.key] || 0,
      locked: !isUnlocked(level.key),
    }));

    res.json({ path });
  } catch (err) {
    console.error("GET /path error:", err);
    res.status(500).json({ error: "Failed to load certification path" });
  }
});

export default router;
