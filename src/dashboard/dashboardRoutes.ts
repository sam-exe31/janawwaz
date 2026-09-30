import { Router, Request, Response } from 'express';

const router = Router();

/* =========================================================================
   1. CITIZEN DASHBOARD ENDPOINTS (/dashboard/citizen/*)
   ========================================================================= */

router.get('/citizen/summary', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      myComplaints: 24,
      verified: 21,
      inProgress: 5,
      resolved: 16,
      peopleImpacted: 380000,
      impactCreatedLabel: '92 / 100',
    },
    isDemo: true,
  });
});

router.get('/citizen/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { name: 'Roads & Potholes', count: 11, percentage: 46 },
      { name: 'Water Supply', count: 5, percentage: 21 },
      { name: 'Streetlights', count: 4, percentage: 17 },
      { name: 'Drainage & Waste', count: 3, percentage: 12 },
      { name: 'Other', count: 1, percentage: 4 },
    ],
    isDemo: true,
  });
});

router.get('/citizen/activity-trend', (req: Request, res: Response) => {
  const range = (req.query.range as string) || '30d';
  const data = [
    { period: 'Week 1', reports: 3, resolved: 2 },
    { period: 'Week 2', reports: 7, resolved: 4 },
    { period: 'Week 3', reports: 6, resolved: 5 },
    { period: 'Week 4', reports: 8, resolved: 5 },
  ];
  res.json({ success: true, data, isDemo: true });
});

router.get('/citizen/status-breakdown', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { status: 'Submitted', count: 2 },
      { status: 'Under Review', count: 1 },
      { status: 'Verified', count: 4 },
      { status: 'In Progress', count: 5 },
      { status: 'Resolved', count: 12 },
    ],
    isDemo: true,
  });
});

router.get('/citizen/top-reports', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'JNV-1042',
        title: 'Hadapsar Flyover Pothole Cluster',
        location: 'Hadapsar, Pune',
        peopleAffected: 84000,
        impactScore: 92,
        status: 'IN_PROGRESS',
        category: 'Roads',
        date: '2026-09-28',
      },
      {
        id: 'JNV-1029',
        title: 'Kharadi Main Water Pipeline Leakage',
        location: 'Kharadi Bypass, Pune',
        peopleAffected: 62000,
        impactScore: 89,
        status: 'RESOLVED',
        category: 'Water',
        date: '2026-09-22',
      },
      {
        id: 'JNV-1015',
        title: 'Viman Nagar Broken Streetlight Grid',
        location: 'Viman Nagar, Pune',
        peopleAffected: 31000,
        impactScore: 78,
        status: 'RESOLVED',
        category: 'Streetlight',
        date: '2026-09-15',
      },
    ],
    isDemo: true,
  });
});

router.get('/citizen/recent-activity', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        complaintId: 'JNV-1042',
        title: 'Main Road Rehabilitation',
        description: 'Milestone 2 completed by Swachh Pune Foundation. Surface asphalt curing.',
        timeAgo: '2 hours ago',
        type: 'MILESTONE',
      },
      {
        id: 2,
        complaintId: 'JNV-1042',
        title: 'Claimed by Impact Partner',
        description: 'Assigned to Field Helper Santosh Rao with high priority equipment.',
        timeAgo: '5 hours ago',
        type: 'CLAIM',
      },
      {
        id: 3,
        complaintId: 'JNV-1029',
        title: 'Pipeline Overhaul Verified',
        description: 'Resolution confirmed by citizen review and municipal water pressure check.',
        timeAgo: '2 days ago',
        type: 'RESOLVED',
      },
    ],
    isDemo: true,
  });
});

router.get('/citizen/people-impacted', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalPeopleAffected: 380000,
      reportedIssuesCount: 24,
      estimateNote: 'Estimated affected population associated with reported issues, not necessarily unique individuals.',
    },
    isDemo: true,
  });
});

router.get('/citizen/insight', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Emerging Road Hazard Detected in Hadapsar',
      message: 'Your report JNV-1042 combined with 14 nearby reports triggered an automated civic hotspot. The municipal road authority has scheduled expedited asphalt repaving.',
      actionText: 'Explore Hotspot',
      actionTo: '/app/map?hotspot=hadapsar',
    },
    isDemo: true,
  });
});

router.get('/citizen/outcomes', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'JNV-1029',
        title: 'Kharadi Bypass Water Pipeline Repair',
        category: 'Water Supply',
        location: 'Kharadi, Pune',
        beforePhoto: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
        afterPhoto: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80',
        peopleBenefited: 62000,
        completionTime: '18 Hours',
        projectCostINR: 18500,
        partnerName: 'Pune Water Action Taskforce',
        verified: true,
        closedAt: '2026-09-23T14:30:00Z',
      },
      {
        id: 'JNV-1015',
        title: 'Viman Nagar Streetlight Grid Replacement',
        category: 'Streetlight',
        location: 'Viman Nagar, Pune',
        beforePhoto: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
        afterPhoto: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
        peopleBenefited: 31000,
        completionTime: '12 Hours',
        projectCostINR: 12000,
        partnerName: 'Civic Bright Foundation',
        verified: true,
        closedAt: '2026-09-16T18:00:00Z',
      },
    ],
    isDemo: true,
  });
});

/* =========================================================================
   2. NGO / CSR DASHBOARD ENDPOINTS (/dashboard/ngo/*)
   ========================================================================= */

router.get('/ngo/summary', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      projectsSupported: 24,
      peopleBenefited: 240000,
      totalContributionINR: 28000000, // ₹2.8 Cr
      projectsCompleted: 18,
      activeProjects: 6,
      impactScoreGenerated: 94,
      portfolio: {
        totalContributionINR: 28000000,
        projects: 24,
        peopleAffected: 420000,
        peopleBenefited: 240000,
        infrastructureImproved: 48,
        projectsCompleted: 18,
        avgCompletionTimeDays: 4.2,
      },
    },
    isDemo: true,
  });
});

router.get('/ngo/contribution-breakdown', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { category: 'Roads & Transport', amountINR: 9800000, percentage: 35 },
      { category: 'Water & Sanitation', amountINR: 7000000, percentage: 25 },
      { category: 'Healthcare Facilities', amountINR: 4200000, percentage: 15 },
      { category: 'Solid Waste Management', amountINR: 2800000, percentage: 10 },
      { category: 'Education & Digital', amountINR: 2800000, percentage: 10 },
      { category: 'Public Lighting', amountINR: 1400000, percentage: 5 },
    ],
    isDemo: true,
  });
});

router.get('/ngo/contribution-trend', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { month: 'Apr', amountINR: 1800000, projects: 2 },
      { month: 'May', amountINR: 3200000, projects: 3 },
      { month: 'Jun', amountINR: 4500000, projects: 4 },
      { month: 'Jul', amountINR: 6200000, projects: 5 },
      { month: 'Aug', amountINR: 5800000, projects: 4 },
      { month: 'Sep', amountINR: 6500000, projects: 6 },
    ],
    isDemo: true,
  });
});

router.get('/ngo/people-benefited', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { category: 'Roads', peopleBenefited: 96000 },
      { category: 'Water', peopleBenefited: 74000 },
      { category: 'Healthcare', peopleBenefited: 38000 },
      { category: 'Sanitation', peopleBenefited: 22000 },
      { category: 'Lighting', peopleBenefited: 10000 },
    ],
    isDemo: true,
  });
});

router.get('/ngo/portfolio-status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { status: 'Completed', count: 18, percentage: 75 },
      { status: 'Active In Progress', count: 4, percentage: 17 },
      { status: 'Awaiting Milestone', count: 2, percentage: 8 },
    ],
    isDemo: true,
  });
});

router.get('/ngo/funding', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      committedINR: 28000000,
      releasedINR: 21500000,
      pendingINR: 4500000,
      utilizedINR: 20000000,
      timeline: [
        { date: '2026-09-01', title: 'Q2 CSR Tranche Released', amountINR: 5000000, status: 'RELEASED' },
        { date: '2026-09-15', title: 'Hadapsar Road Milestone 1 Verified', amountINR: 1800000, status: 'UTILIZED' },
        { date: '2026-09-28', title: 'Kharadi Water Project Final Milestone', amountINR: 1200000, status: 'PENDING_VERIFICATION' },
      ],
    },
    isDemo: true,
  });
});

router.get('/ngo/tax-tracking', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      documentedContributionINR: 28000000,
      eligibleBenefitINR: 14000000,
      documentationPercentage: 100,
      certificatesCount: 24,
      isIllustrative: true,
      fixedDisclaimer:
        "Tax treatment and applicable benefits depend on the organization's jurisdiction, eligibility, approved project structure and applicable regulations. Janavaaj tracks documented contributions and eligible benefits; it does not determine tax liability.",
    },
    isDemo: true,
  });
});

router.get('/ngo/impact-roi', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      perLakhINR: {
        peopleBenefited: 857,
        infrastructureUnits: 1.7,
        issuesResolved: 2.1,
      },
    },
    isDemo: true,
  });
});

router.get('/ngo/insights', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: 'High Social Return in Water Supply',
        summary: 'Projects funded in water distribution have achieved 1,240 people benefited per ₹1 Lakh contributed, 45% above regional baseline.',
      },
      {
        id: 2,
        title: 'Milestone 2 Awaiting Verification in Hadapsar',
        summary: 'Road resurfacing is 85% complete. Contractor submitted geotagged completion evidence for review.',
      },
    ],
    isDemo: true,
  });
});

/* =========================================================================
   3. POLICYMAKER / COMMAND CENTER ENDPOINTS (/dashboard/policy/*)
   ========================================================================= */

router.get('/policy/summary', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalComplaints: 24680,
      verifiedComplaints: 21420,
      pendingVerification: 1840,
      highImpactIssues: 38,
      peopleAffected: 380000,
      activeProjects: 42,
      resolvedComplaints: 18920,
      totalFundingINR: 48000000, // ₹4.8 Cr
    },
    isDemo: true,
  });
});

router.get('/policy/priority-issues', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'ISS-401',
        issue: 'Baner-Balewadi High Street Storm Drain Collapse',
        location: 'Zone 2 (Baner), Pune',
        complaintCount: 142,
        peopleAffected: 120000,
        severity: 'CRITICAL',
        infrastructureImportance: 'Arterial Corridor',
        evidenceConfidence: 98,
        impactScore: 94,
        status: 'IDENTIFIED',
      },
      {
        id: 'ISS-402',
        issue: 'Hadapsar Flyover Structural Road Crater',
        location: 'Zone 4 (Hadapsar), Pune',
        complaintCount: 96,
        peopleAffected: 84000,
        severity: 'HIGH',
        infrastructureImportance: 'Heavy Transit Route',
        evidenceConfidence: 96,
        impactScore: 89,
        status: 'ASSIGNED',
      },
      {
        id: 'ISS-403',
        issue: 'Sinhagad Road Water Pipeline Contamination',
        location: 'Zone 3 (Sinhagad), Pune',
        complaintCount: 68,
        peopleAffected: 68000,
        severity: 'CRITICAL',
        infrastructureImportance: 'Potable Grid',
        evidenceConfidence: 94,
        impactScore: 88,
        status: 'PRIORITIZED',
      },
      {
        id: 'ISS-404',
        issue: 'Kothrud Substation Transformer Fault',
        location: 'Zone 1 (Kothrud), Pune',
        complaintCount: 52,
        peopleAffected: 45000,
        severity: 'MEDIUM',
        infrastructureImportance: 'Residential Power',
        evidenceConfidence: 91,
        impactScore: 82,
        status: 'ACTIVE',
      },
    ],
    isDemo: true,
  });
});

router.get('/policy/impact-vs-complaints', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { name: 'Baner Drain', complaints: 142, peopleAffected: 120000, score: 94, category: 'Drainage' },
      { name: 'Hadapsar Road', complaints: 96, peopleAffected: 84000, score: 89, category: 'Roads' },
      { name: 'Sinhagad Water (High Impact Outlier)', complaints: 28, peopleAffected: 95000, score: 92, category: 'Water', outlier: true },
      { name: 'Kothrud Cable', complaints: 52, peopleAffected: 45000, score: 82, category: 'Electricity' },
      { name: 'Kharadi Bypass', complaints: 18, peopleAffected: 62000, score: 88, category: 'Water', outlier: true },
      { name: 'Viman Nagar Light', complaints: 88, peopleAffected: 24000, score: 71, category: 'Streetlight' },
      { name: 'Aundh Garbage', complaints: 110, peopleAffected: 32000, score: 75, category: 'Waste' },
    ],
    isDemo: true,
  });
});

router.get('/policy/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { category: 'Roads & Potholes', count: 9850, percentage: 40 },
      { category: 'Water Supply', count: 6170, percentage: 25 },
      { category: 'Drainage & Stormwater', count: 3700, percentage: 15 },
      { category: 'Solid Waste', count: 2468, percentage: 10 },
      { category: 'Electricity & Lighting', count: 2492, percentage: 10 },
    ],
    isDemo: true,
  });
});

router.get('/policy/locations', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { location: 'Zone 4 (Hadapsar)', peopleAffected: 142000, issues: 18 },
      { location: 'Zone 2 (Baner/Kharadi)', peopleAffected: 118000, issues: 14 },
      { location: 'Zone 3 (Sinhagad Road)', peopleAffected: 86000, issues: 11 },
      { location: 'Zone 1 (Kothrud/Shivajinagar)', peopleAffected: 74000, issues: 9 },
    ],
    isDemo: true,
  });
});

router.get('/policy/trend', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { period: 'Day 1', complaints: 820, verified: 740, resolved: 680 },
      { period: 'Day 5', complaints: 950, verified: 880, resolved: 790 },
      { period: 'Day 10', complaints: 1120, verified: 1040, resolved: 950 },
      { period: 'Day 15', complaints: 1240, verified: 1180, resolved: 1080 },
      { period: 'Day 20', complaints: 1410, verified: 1320, resolved: 1210 },
      { period: 'Day 25', complaints: 1350, verified: 1290, resolved: 1260 },
      { period: 'Day 30', complaints: 1280, verified: 1220, resolved: 1190 },
    ],
    isDemo: true,
  });
});

router.get('/policy/hotspots', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'HOT-01',
        title: 'Road Damage Surge in Hadapsar',
        surgeRate: '+240%',
        zone: 'Zone 4 (Hadapsar Arterial)',
        estimatedAffected: 180000,
        explanation: 'Monsoon runoff combined with heavy metro route detours damaged 2.4 km of dual carriageway.',
        severity: 'CRITICAL',
      },
      {
        id: 'HOT-02',
        title: 'Drainage Overflow Cluster in Baner',
        surgeRate: '+165%',
        zone: 'Zone 2 (Baner High St)',
        estimatedAffected: 95000,
        explanation: 'Culvert silt accumulation caused localized street flooding in 6 residential societies.',
        severity: 'HIGH',
      },
    ],
    isDemo: true,
  });
});

router.get('/policy/insights', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: 'Predictive Asphalt Degradation',
        summary: 'Machine learning analysis predicts 3 additional road failures along Kharadi Bypass if seal coating is not executed within 14 days.',
      },
      {
        id: 2,
        title: 'Water Pressure Discrepancy',
        summary: 'Sensor telemetry and citizen signal density indicate an underground burst between Ward 14 and Ward 16.',
      },
    ],
    isDemo: true,
  });
});

router.get('/policy/pipeline', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { stage: 'Identified', count: 38 },
      { stage: 'Prioritized', count: 29 },
      { stage: 'Assigned', count: 24 },
      { stage: 'Active Execution', count: 18 },
      { stage: 'Completed', count: 14 },
      { stage: 'Verified & Closed', count: 12 },
    ],
    isDemo: true,
  });
});

router.get('/policy/projects', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'PRJ-101',
        name: 'Hadapsar Arterial Road Reconstruction',
        location: 'Zone 4, Pune',
        peopleAffected: 84000,
        partner: 'Swachh Pune Foundation (CSR: Tata Tech)',
        progress: 65,
        fundingINR: 1800000,
        status: 'IN_PROGRESS',
      },
      {
        id: 'PRJ-102',
        name: 'Kharadi Water Mains Overhaul',
        location: 'Zone 2, Pune',
        peopleAffected: 62000,
        partner: 'Pune Water Taskforce (CSR: Infosys)',
        progress: 100,
        fundingINR: 1200000,
        status: 'COMPLETED',
      },
      {
        id: 'PRJ-103',
        name: 'Baner Culvert Desilting Project',
        location: 'Zone 2, Pune',
        peopleAffected: 45000,
        partner: 'Green Earth Trust',
        progress: 30,
        fundingINR: 850000,
        status: 'IN_PROGRESS',
      },
    ],
    isDemo: true,
  });
});

router.get('/policy/funding', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      approvedINR: 48000000,
      releasedINR: 36000000,
      utilizedINR: 32000000,
      pendingINR: 12000000,
      byCategory: [
        { category: 'Roads & Infrastructure', amountINR: 21600000 },
        { category: 'Water & Sanitation', amountINR: 14400000 },
        { category: 'Drainage & Stormwater', amountINR: 7200000 },
        { category: 'Environment & Waste', amountINR: 4800000 },
      ],
    },
    isDemo: true,
  });
});

router.get('/policy/network', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      activePartnersCount: 16,
      totalCommittedINR: 48000000,
      peopleBenefited: 240000,
      partners: [
        {
          name: 'Swachh Pune Foundation',
          activeProjects: 4,
          completedProjects: 8,
          avgResolutionHours: 28,
          peopleBenefited: 92000,
          complianceRate: 98,
        },
        {
          name: 'Pune Water Action Taskforce',
          activeProjects: 3,
          completedProjects: 6,
          avgResolutionHours: 19,
          peopleBenefited: 84000,
          complianceRate: 96,
        },
        {
          name: 'Civic Infrastructure Consortium',
          activeProjects: 2,
          completedProjects: 4,
          avgResolutionHours: 34,
          peopleBenefited: 64000,
          complianceRate: 95,
        },
      ],
    },
    isDemo: true,
  });
});

router.get('/policy/resolution-funnel', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { stage: 'Reports Received', count: 24680 },
      { stage: 'AI Screened & Verified', count: 21420 },
      { stage: 'High Impact Filtered', count: 1840 },
      { stage: 'Prioritized & Approved', count: 420 },
      { stage: 'Partner Assigned', count: 180 },
      { stage: 'Work Completed', count: 142 },
      { stage: 'Citizen Verified & Closed', count: 136 },
    ],
    isDemo: true,
  });
});

router.get('/policy/outcomes', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      issuesResolved: 18920,
      peopleBenefited: 240000,
      infrastructureUnitsImproved: 340,
      avgResolutionHours: 32,
      fundingUtilizedINR: 32000000,
      costPerPersonBenefitedINR: 133,
    },
    isDemo: true,
  });
});

router.get('/policy/executive-summary', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Monthly Civic Infrastructure & Impact Intelligence Briefing',
      date: 'September 2026',
      narrative:
        'In the past 30 days, Janavaaj processed 24,680 citizen signals across Pune District with 89.4% evidence confidence. Municipal intervention combined with CSR capital enabled the resolution of 18,920 issues benefiting 2.4 Lakh residents. Two emerging hotspots in Zone 4 (Roads) and Zone 2 (Drainage) were mitigated within 48 hours of automated detection, reducing public dissatisfaction by an estimated 68%.',
      keyMetrics: [
        { label: 'Citizen Trust Index', value: '94.2%' },
        { label: 'Average SLA Adherence', value: '91.8%' },
        { label: 'Public ROI', value: '₹1:₹7.2 Impact Ratio' },
      ],
    },
    isDemo: true,
  });
});

/* =========================================================================
   4. MAP ENDPOINTS (/map/*)
   ========================================================================= */

router.get('/map/issues', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: 'Hadapsar Arterial Road Failure',
        type: 'Roads',
        coordinates: [18.5089, 73.926],
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
        impactScore: 92,
        peopleAffected: 84000,
        evidenceConfidence: 96,
      },
      {
        id: 2,
        title: 'Kharadi Bypass Potable Water Pipeline Leak',
        type: 'Water',
        coordinates: [18.5514, 73.9348],
        severity: 'HIGH',
        status: 'RESOLVED',
        impactScore: 89,
        peopleAffected: 62000,
        evidenceConfidence: 98,
      },
      {
        id: 3,
        title: 'Baner-Balewadi Culvert Blockage',
        type: 'Drainage',
        coordinates: [18.559, 73.7868],
        severity: 'CRITICAL',
        status: 'OPEN',
        impactScore: 94,
        peopleAffected: 120000,
        evidenceConfidence: 95,
      },
      {
        id: 4,
        title: 'Kothrud Substation High Tension Cable',
        type: 'Electricity',
        coordinates: [18.5074, 73.8077],
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        impactScore: 82,
        peopleAffected: 45000,
        evidenceConfidence: 91,
      },
    ],
    isDemo: true,
  });
});

router.get('/map/hotspots', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'HOT-1',
        zone: 'Zone 4 (Hadapsar)',
        coordinates: [18.5089, 73.926],
        radiusMeters: 1200,
        increaseRate: '+240%',
        affectedPopulation: 180000,
      },
    ],
    isDemo: true,
  });
});

router.get('/map/projects', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'PRJ-101',
        name: 'Hadapsar Road Rehabilitation',
        coordinates: [18.5089, 73.926],
        partnerType: 'NGO_CSR',
        progress: 65,
        status: 'ACTIVE',
      },
      {
        id: 'PRJ-102',
        name: 'Kharadi Water Mains Overhaul',
        coordinates: [18.5514, 73.9348],
        partnerType: 'NGO_CSR',
        progress: 100,
        status: 'RESOLVED',
      },
    ],
    isDemo: true,
  });
});

/* =========================================================================
   5. VERIFICATION & MILESTONE ENDPOINTS (/verification/*, /milestones/*)
   ========================================================================= */

router.get('/verification/queue', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1042,
        complaintId: 'JNV-1042',
        title: 'Hadapsar Flyover Pothole Cluster',
        location: 'Hadapsar, Pune',
        gpsVerified: true,
        imageVerified: true,
        gisVerified: true,
        duplicateCandidate: false,
        evidenceConfidence: 96,
        status: 'AWAITING_APPROVAL',
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        submittedAt: '2026-09-28T09:15:00Z',
      },
      {
        id: 1043,
        complaintId: 'JNV-1043',
        title: 'Baner High Street Silt Blockage',
        location: 'Baner, Pune',
        gpsVerified: true,
        imageVerified: true,
        gisVerified: true,
        duplicateCandidate: false,
        evidenceConfidence: 94,
        status: 'AWAITING_APPROVAL',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
        submittedAt: '2026-09-28T11:30:00Z',
      },
    ],
    isDemo: true,
  });
});

router.post('/verification/:id/decision', (req: Request, res: Response) => {
  const { decision, reason } = req.body;
  res.json({
    success: true,
    data: {
      id: req.params.id,
      decision,
      reason,
      updatedAt: new Date().toISOString(),
    },
    message: `Verification decision '${decision}' recorded successfully.`,
    isDemo: true,
  });
});

router.get('/milestones', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        projectId: 'PRJ-101',
        title: 'Milestone 1: Surface Milling & Debris Removal',
        progress: 100,
        amountINR: 600000,
        status: 'RELEASED',
        evidenceUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 2,
        projectId: 'PRJ-101',
        title: 'Milestone 2: Sub-base Compaction & Asphalt Laying',
        progress: 75,
        amountINR: 800000,
        status: 'AWAITING_VERIFICATION',
        evidenceUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 3,
        projectId: 'PRJ-101',
        title: 'Milestone 3: Final Sealing, Lane Marking & Testing',
        progress: 0,
        amountINR: 400000,
        status: 'NOT_STARTED',
      },
    ],
    isDemo: true,
  });
});

router.post('/milestones/:id/approve', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      milestoneId: req.params.id,
      status: 'RELEASED',
      releasedAt: new Date().toISOString(),
    },
    message: 'Milestone approved and tranche release authorized.',
    isDemo: true,
  });
});

/* =========================================================================
   6. PROJECTS & ADOPTION ENDPOINTS (/projects/*, /funding/*)
   ========================================================================= */

router.get('/projects', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'PRJ-201',
        title: 'Kharadi Water Pipeline Augmentation',
        location: 'Kharadi, Pune',
        peopleAffected: 62000,
        impactScore: 94,
        fundingRequiredINR: 480000,
        evidenceConfidence: 98,
        category: 'Water',
        status: 'READY_FOR_ADOPTION',
      },
      {
        id: 'PRJ-202',
        title: 'Hadapsar Arterial Road Reconstruction',
        location: 'Hadapsar, Pune',
        peopleAffected: 84000,
        impactScore: 92,
        fundingRequiredINR: 820000,
        evidenceConfidence: 96,
        category: 'Roads',
        status: 'READY_FOR_ADOPTION',
      },
      {
        id: 'PRJ-203',
        title: 'Viman Nagar Drainage Grid Modernization',
        location: 'Viman Nagar, Pune',
        peopleAffected: 51500,
        impactScore: 88,
        fundingRequiredINR: 360000,
        evidenceConfidence: 94,
        category: 'Drainage',
        status: 'READY_FOR_ADOPTION',
      },
    ],
    isDemo: true,
  });
});

router.post('/projects/:id/adopt', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      projectId: req.params.id,
      status: 'ADOPTED',
      adoptedAt: new Date().toISOString(),
    },
    message: 'Project adopted into social impact portfolio.',
    isDemo: true,
  });
});

router.post('/funding/contributions', (req: Request, res: Response) => {
  const { amountINR, projectId } = req.body;
  res.json({
    success: true,
    data: {
      contributionId: `CNT-${Date.now()}`,
      amountINR,
      projectId,
      status: 'COMMITTED',
      timestamp: new Date().toISOString(),
    },
    message: 'Contribution committed. Funds will be released per verified milestone completion.',
    isDemo: true,
  });
});

/* =========================================================================
   7. REPORTS ENDPOINTS (/reports/*)
   ========================================================================= */

router.post('/reports', (req: Request, res: Response) => {
  const { type = 'IMPACT_REPORT', scope = 'Pune District', period = 'Last 30 Days' } = req.body;
  const reportId = `RPT-${Math.floor(1000 + Math.random() * 9000)}`;
  res.json({
    success: true,
    data: {
      id: reportId,
      type,
      scope,
      period,
      status: 'READY',
      downloadUrl: `/api/v1/reports/${reportId}/download`,
      generatedAt: new Date().toISOString(),
    },
    isDemo: true,
  });
});

router.get('/reports/:id', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      status: 'COMPLETED',
      downloadUrl: `https://example.com/reports/${req.params.id}.pdf`,
    },
    isDemo: true,
  });
});

export default router;
