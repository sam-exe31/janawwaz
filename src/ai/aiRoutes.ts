import { Router, Request, Response } from 'express';
import { getGeminiClient } from './geminiClient';
import { config } from '../config';

const router = Router();

/**
 * POST /api/v1/ai/chat
 * Role-aware conversational AI assistant for Citizen, NGO, Policymaker.
 * Supports English, Hindi, and Marathi.
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, context = {}, language = 'en' } = req.body;
    const role = (context.role || 'CITIZEN').toUpperCase();
    const entityId = context.entityId;

    const lowerMsg = (message || '').toLowerCase();

    // Multilingual greetings / tone
    let reply = '';
    let actions: Array<{ type: string; label: string; payload?: any; to?: string }> = [];
    let cards: any[] = [];

    if (role === 'CITIZEN') {
      if (lowerMsg.includes('jnv-1042') || lowerMsg.includes('pending') || lowerMsg.includes('status')) {
        if (language === 'hi') {
          reply = `आपकी शिकायत **JNV-1042 (हडपसर मेन रोड गड्ढे)** वर्तमान में **प्रगति में (In Progress)** है। इसे 4 घंटे पहले स्वच्छ पुणे फाउंडेशन (NGO) द्वारा क्लेम किया गया था और फील्ड हेल्पर को असाइन किया गया है। अनुमानित समाधान समय: आज शाम 6:00 बजे तक।`;
        } else if (language === 'mr') {
          reply = `तुमची तक्रार **JNV-1042 (हडपसर मुख्य रस्ता खड्डे)** सध्या **प्रगतीपथावर (In Progress)** आहे. स्वच्छ पुणे फाउंडेशनने ४ तासांपूर्वी ती स्वीकारली असून काम सुरू झाले आहे. अंदाजे निवारण वेळ: आज संध्याकाळी ६:०० पर्यंत.`;
        } else {
          reply = `Your complaint **JNV-1042 (Hadapsar Main Road Pothole)** is currently **In Progress**. It was claimed by Swachh Pune Foundation 4 hours ago and assigned to a field helper. Materials have arrived on site and repair work is 65% complete. Expected completion: by 6:00 PM today.`;
        }
        actions = [
          { type: 'NAVIGATE', label: 'View Complaint Details', to: '/app/citizen/complaints/1042' },
          { type: 'ACTION', label: 'Receive SMS Updates', payload: { complaintId: 'JNV-1042', notify: true } }
        ];
      } else if (lowerMsg.includes('pothole') || lowerMsg.includes('road') || lowerMsg.includes('गड्ढा') || lowerMsg.includes('खड्डा') || lowerMsg.includes('report')) {
        if (language === 'hi') {
          reply = `मैंने आपकी समस्या समझी है। क्या आप सड़क के गड्ढे या क्षति की रिपोर्ट दर्ज करना चाहते हैं? मैं आपके लिए एक ड्राफ्ट तैयार कर सकता हूँ।`;
        } else if (language === 'mr') {
          reply = `मी तुमची समस्या समजून घेतली. तुम्ही रस्त्यावरील खड्ड्याची तक्रार नोंदवू इच्छिता का? मी आपल्यासाठी ड्राफ्ट तयार करू शकतो.`;
        } else {
          reply = `I understand you want to report road damage or a pothole. I can initialize a verified complaint draft with GPS location and department routing to the PMC Road Department.`;
        }
        actions = [
          { type: 'CREATE_COMPLAINT_DRAFT', label: 'Draft Road Complaint', payload: { category: 'Roads', priority: 'HIGH' } },
          { type: 'NAVIGATE', label: 'Open Camera & Report', to: '/app/citizen/report' }
        ];
      } else {
        if (language === 'hi') {
          reply = `नमस्ते! मैं **जनआवाज AI** हूँ। मैं आपकी नागरिक समस्याओं को दर्ज करने, शिकायतों की स्थिति ट्रैक करने और क्षेत्र के प्रभाव को देखने में सहायता कर सकता हूँ।`;
        } else if (language === 'mr') {
          reply = `नमस्कार! मी **जनआवाज AI** आहे. मी आपल्या नागरी समस्या नोंदवणे, तक्रारींचा पाठपुरावा करणे आणि परिसरातील विकास पाहण्यास मदत करू शकतो.`;
        } else {
          reply = `Hello! I am **Janavaaj AI**, your civic intelligence assistant. I can help you report civic issues via voice/text/photo, track live complaint resolution, and discover neighborhood improvements.`;
        }
        actions = [
          { type: 'NAVIGATE', label: 'Raise a Civic Issue', to: '/app/citizen/report' },
          { type: 'NAVIGATE', label: 'Explore Impact Map', to: '/app/map' }
        ];
      }
    } else if (role === 'NGO' || role === 'NGO_CSR') {
      if (lowerMsg.includes('50,000') || lowerMsg.includes('people') || lowerMsg.includes('benefiting')) {
        reply = `Found **3 verified civic projects** impacting over 50,000 residents awaiting adoption in Pune East:\n\n1. **Kharadi Water Pipeline Augmentation** — 62,000 people benefited · Required: ₹4.8 Lakh · Evidence Confidence: 98%\n2. **Hadapsar Arterial Road Reconstruction** — 84,000 people benefited · Required: ₹8.2 Lakh · Evidence Confidence: 96%\n3. **Viman Nagar Drainage Overhaul** — 51,500 people benefited · Required: ₹3.6 Lakh · Evidence Confidence: 94%`;
        actions = [
          { type: 'NAVIGATE', label: 'Discover High-Impact Projects', to: '/app/ngo/discover' },
          { type: 'NAVIGATE', label: 'Generate CSR Impact Report', to: '/app/ngo/reports' }
        ];
      } else if (lowerMsg.includes('tax') || lowerMsg.includes('80g') || lowerMsg.includes('benefit')) {
        reply = `Under Janavaaj's CSR & Regulatory Tracking, your organization has documented **₹2.8 Crore** in verified civic impact contributions across 24 projects in FY 2025-26. 100% of documentation and milestone completion certificates are audited and available for export.`;
        actions = [
          { type: 'NAVIGATE', label: 'View Tax & Regulatory Portal', to: '/app/ngo/funding' }
        ];
      } else {
        reply = `Welcome to the Janavaaj Social Impact Intelligence partner console. You can query project demographics, track milestone releases, generate certified ESG/CSR reports, and inspect field verification proof.`;
        actions = [
          { type: 'NAVIGATE', label: 'Discover Projects', to: '/app/ngo/discover' },
          { type: 'NAVIGATE', label: 'View Portfolio', to: '/app/ngo' }
        ];
      }
    } else {
      // POLICYMAKER / ADMIN
      if (lowerMsg.includes('hotspot') || lowerMsg.includes('emerging') || lowerMsg.includes('rate')) {
        reply = `🚨 **Emerging Hotspot Alert (Zone 4 - Hadapsar/Kharadi)**:\n- Road damage reports increased by **+240%** in the past 7 days.\n- Estimated affected population: **1.8 Lakh citizens**.\n- Primary root cause identified by AI: Heavy monsoon runoff combined with metro construction detours.\n- Recommendation: Prioritize emergency asphalt resurfacing tender before upcoming transit rush.`;
        actions = [
          { type: 'NAVIGATE', label: 'Investigate Hotspot on Map', to: '/app/map?hotspot=zone-4' },
          { type: 'NAVIGATE', label: 'Review Evidence in Verification Center', to: '/app/policy/verification' }
        ];
      } else if (lowerMsg.includes('unassigned') || lowerMsg.includes('high-impact') || lowerMsg.includes('issues')) {
        reply = `There are **4 High-Impact Issues** with Impact Score > 85 not yet assigned to an execution partner or project:\n1. **Baner-Balewadi Storm Drain Blockage** (Score: 94 · 1.2 Lakh affected)\n2. **Kothrud High-Tension Cable Hazard** (Score: 91 · 45,000 affected)\n3. **Hadapsar Arterial Road Failure** (Score: 89 · 84,000 affected)\n4. **Sinhagad Road Water Contamination** (Score: 88 · 68,000 affected)`;
        actions = [
          { type: 'NAVIGATE', label: 'Open Priority Issues Table', to: '/app/policy/issues' },
          { type: 'NAVIGATE', label: 'Open Verification Center', to: '/app/policy/verification' }
        ];
      } else {
        reply = `Janavaaj Civic Intelligence Command Center AI active. 24,680 civic signals processed across Pune District. 89.4% evidence confidence rating. 3.8 Lakh population impact mapped. How can I assist municipal planning today?`;
        actions = [
          { type: 'NAVIGATE', label: 'Export Executive Briefing (PDF)', to: '/app/reports' },
          { type: 'NAVIGATE', label: 'Open Verification Center', to: '/app/policy/verification' }
        ];
      }
    }

    return res.json({
      success: true,
      data: {
        reply,
        actions,
        cards,
        language,
        timestamp: new Date().toISOString(),
      },
      isDemo: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'AI_CHAT_ERROR', message: error.message || 'AI assistant failed' },
    });
  }
});

/**
 * POST /api/v1/complaints/analyze
 * Multi-modal issue classification, priority assignment, department routing & duplicate detection.
 */
router.post('/complaints/analyze', async (req: Request, res: Response) => {
  try {
    const { description = '', categoryId, latitude, longitude, addressText, language = 'en' } = req.body;
    const desc = description.toLowerCase();

    // Determine category based on keywords if not explicit
    let detectedCategory = 'Roads';
    let detectedDept = 'PMC Road & Infrastructure Department';
    let priority = 'HIGH';
    let impactScore = 88;
    let peopleAffected = 24500;
    let confidence = 0.95;

    if (desc.includes('water') || desc.includes('leak') || desc.includes('pipe') || desc.includes('पानी') || desc.includes('पाणी')) {
      detectedCategory = 'Water';
      detectedDept = 'Pune Water Supply & Sewerage Board';
      priority = 'CRITICAL';
      impactScore = 92;
      peopleAffected = 48000;
    } else if (desc.includes('light') || desc.includes('electric') || desc.includes('dark') || desc.includes('लाइट') || desc.includes('दिवा')) {
      detectedCategory = 'Streetlight';
      detectedDept = 'MSEDCL & Municipal Electrical Dept';
      priority = 'MEDIUM';
      impactScore = 74;
      peopleAffected = 12000;
    } else if (desc.includes('garbage') || desc.includes('waste') || desc.includes('trash') || desc.includes('कचरा')) {
      detectedCategory = 'Waste';
      detectedDept = 'Solid Waste Management Dept';
      priority = 'MEDIUM';
      impactScore = 81;
      peopleAffected = 19000;
    } else if (desc.includes('drain') || desc.includes('sewage') || desc.includes('गटर') || desc.includes('नाला')) {
      detectedCategory = 'Drainage';
      detectedDept = 'Drainage & Stormwater Department';
      priority = 'HIGH';
      impactScore = 87;
      peopleAffected = 31000;
    }

    // Check for simulated duplicate nearby
    const duplicateWarning = desc.includes('hadapsar') || desc.includes('pothole')
      ? {
          isDuplicateCandidate: true,
          existingComplaintId: 'JNV-1042',
          title: 'Deep pothole cluster near Hadapsar Flyover',
          distanceMeters: 45,
          reportedHoursAgo: 6,
          supportCount: 14,
        }
      : null;

    return res.json({
      success: true,
      data: {
        category: detectedCategory,
        department: detectedDept,
        priority,
        impactScore,
        estimatedPeopleAffected: peopleAffected,
        confidence,
        duplicateWarning,
        smartFeatures: [
          { name: 'AI Classification', status: 'verified', note: 'Confidence 95%' },
          { name: 'GPS Geofencing', status: 'verified', note: `${latitude || 18.5204}, ${longitude || 73.8567}` },
          { name: 'Duplicate Detection', status: duplicateWarning ? 'match_found' : 'clear' },
          { name: 'Smart Priority', status: priority },
          { name: 'Department Routing', status: 'assigned', note: detectedDept },
        ],
      },
      isDemo: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'AI_ANALYSIS_ERROR', message: error.message || 'Issue analysis failed' },
    });
  }
});

/**
 * POST /api/v1/ai/image-analyze
 * Analyzes uploaded image for civic issues.
 */
router.post('/image-analyze', async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: {
        category: 'Roads',
        subCategory: 'Pothole & Surface Damage',
        confidence: 0.94,
        description: 'Image analysis suggests severe asphalt pothole and cracked road surface causing traffic hazard.',
        severity: 'HIGH',
        estimatedCostINR: '₹4,500 - ₹8,000',
        enabled: true,
      },
      isDemo: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'IMAGE_ANALYSIS_ERROR', message: error.message || 'Image analysis failed' },
    });
  }
});

/**
 * POST /api/v1/speech/transcribe
 * Transcribe voice complaints in English, Hindi, or Marathi.
 */
router.post('/speech/transcribe', async (req: Request, res: Response) => {
  try {
    const { language = 'en' } = req.body;
    let transcript = 'There is a large pothole in the middle of the road causing dangerous traffic congestion.';
    if (language === 'hi') {
      transcript = 'सड़क के बीच में एक बहुत बड़ा गड्ढा है जिसके कारण आने-जाने वाली गाड़ियों को काफी परेशानी हो रही है।';
    } else if (language === 'mr') {
      transcript = 'रस्त्याच्या मधोमध मोठा खड्डा पडला असून वाहतुकीस गंभीर अडथळा निर्माण होत आहे.';
    }

    return res.json({
      success: true,
      data: {
        transcript,
        language,
        confidence: 0.97,
      },
      isDemo: true,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'STT_ERROR', message: error.message || 'Speech transcription failed' },
    });
  }
});

export default router;
