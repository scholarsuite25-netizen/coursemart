import type { CourseModule, CourseQuizQuestion, Product } from '../types/marketplace';

interface SectionBlueprint {
  title: string;
  lectures: Array<{
    title: string;
    durationMinutes: number;
    summary: string;
    keyTakeaways: string[];
    textContent: string;
  }>;
  quizTitle: string;
  questions: Array<{
    prompt: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  }>;
}

/** Pad a quiz to at least 5 questions so an 80% passmark is achievable (4/5). */
function padQuestions(
  questions: SectionBlueprint['questions'],
  quizTitle: string
): SectionBlueprint['questions'] {
  const result = [...questions];
  let i = 0;
  const fillers: SectionBlueprint['questions'] = [
    {
      prompt: `Which practice best supports mastery of ${quizTitle}?`,
      options: [
        'Skipping practice and relying solely on memorisation',
        'Applying the concepts step by step and verifying each result',
        'Ignoring feedback and repeating the same mistakes',
        'Avoiding all documentation of the process',
      ],
      correctIndex: 1,
      explanation: 'Deliberate practice with verification is the reliable route to mastery.',
    },
    {
      prompt: `Before applying ${quizTitle} in a real scenario, what should be confirmed?`,
      options: [
        'That no plan or success criteria exist',
        'That assumptions are validated and the intended outcome is clearly defined',
        'That edge cases are ignored to save time',
        'That results will never be measured',
      ],
      correctIndex: 1,
      explanation: 'Validated assumptions and defined outcomes prevent wasted effort and costly errors.',
    },
    {
      prompt: `What indicates a high-quality outcome when working on ${quizTitle}?`,
      options: [
        'The work was rushed with no review',
        'The result was checked against requirements and improved iteratively',
        'Known problems were left unresolved',
        'No metrics were tracked',
      ],
      correctIndex: 1,
      explanation: 'Review against requirements and iteration produce dependable, high-quality outcomes.',
    },
  ];
  while (result.length < 5) {
    result.push(fillers[i % fillers.length]);
    i += 1;
  }
  return result;
}

function buildModules(
  prefix: string,
  sections: SectionBlueprint[],
  existingModules: CourseModule[] = []
): CourseModule[] {
  return sections.map((sec, sIdx) => {
    const modNum = sIdx + 1;
    const existing = existingModules[sIdx];
    // Reuse previously generated IDs by position so existing student progress
    // (completedLectureIds / quizScoresByModule) survives curriculum upgrades.
    const modId = existing?.id || `${prefix}-m${modNum}`;
    return {
      id: modId,
      title: `Section ${modNum}: ${sec.title}`,
      lectures: sec.lectures.map((lec, lIdx) => ({
        id: existing?.lectures?.[lIdx]?.id || `${prefix}-m${modNum}-l${lIdx + 1}`,
        title: `${modNum}.${lIdx + 1} ${lec.title}`,
        durationMinutes: lec.durationMinutes,
        isPreview: sIdx === 0 && lIdx === 0,
        lectureType: 'video',
        summary: lec.summary,
        keyTakeaways: lec.keyTakeaways,
        textContent: lec.textContent,
      })),
      quiz: {
        id: existing?.quiz?.id || `${prefix}-q${modNum}`,
        title: `Section ${modNum} Assessment: ${sec.quizTitle}`,
        passingScore: 80,
        questions: padQuestions(sec.questions, sec.quizTitle).map((q, qIdx): CourseQuizQuestion => ({
          id: existing?.quiz?.questions?.[qIdx]?.id || `${prefix}-q${modNum}-${qIdx + 1}`,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      },
    };
  });
}

export const AI_AGENCY_MODULES: CourseModule[] = buildModules('ai-ag', [
  {
    title: 'Foundations of the Nigerian & Global AI Agency Model',
    quizTitle: 'AI Agency Positioning & Economics',
    lectures: [
      {
        title: 'Why Nigerian & Diaspora Businesses Pay Premium Retainers for AI',
        durationMinutes: 22,
        summary: 'Understand why SMEs in Lagos, Abuja, and the UK/US diaspora eagerly pay ₦350,000–₦2,500,000/month for revenue-generating AI systems.',
        keyTakeaways: ['B2B pain-point pricing vs hourly billing', 'High-demand Nigerian verticals (real estate, clinics, fintech, logistics)', 'Positioning as an AI Revenue Architect'],
        textContent: 'Businesses do not buy "AI prompts"—they buy saved payroll hours, faster lead response times, and recovered revenue. In Nigeria, where WhatsApp inquiries often go unanswered after 6 PM, an automated AI sales concierge directly increases monthly turnover.',
      },
      {
        title: 'Designing Your 3-Tier Agency Offer Ladder',
        durationMinutes: 25,
        summary: 'Structure a foot-in-the-door Audit, a Core Automation Build (₦500k–₦1.5M), and an Ongoing Optimization Retainer.',
        keyTakeaways: ['₦150k AI Workflow Audit', 'Core Build scope & SLA boundaries', 'Monthly maintenance retainer justification'],
        textContent: 'Never pitch a custom enterprise build on day one. Lead with a paid 7-day Workflow & Conversion Audit, deliver quick ROI wins, then transition the client into a core build and monthly retainer.',
      },
    ],
    questions: [
      {
        prompt: 'What is the strongest value proposition when pitching an AI system to a Nigerian SME owner?',
        options: [
          'Showing off complex LLM model benchmarks',
          'Quantifying recovered leads, faster response times, and saved staff hours',
          'Selling raw ChatGPT prompt lists for ₦5,000',
          'Promising to replace their entire team overnight',
        ],
        correctIndex: 1,
        explanation: 'Business owners pay premium fees for measurable revenue protection and operational speed, not technical jargon.',
      },
      {
        prompt: 'What is the primary purpose of an initial ₦150,000 AI Workflow Audit?',
        options: [
          'To diagnose bottlenecks and de-risk a larger ₦500k–₦1.5M implementation contract',
          'To act as the only service your agency ever sells',
          'To give away free custom software without a contract',
          'To avoid speaking with the client team',
        ],
        correctIndex: 0,
        explanation: 'A paid audit qualifies serious buyers, uncovers high-ROI bottlenecks, and naturally leads into the core build.',
      },
      {
        prompt: 'Which billing structure protects agency margins as client usage grows?',
        options: [
          'One-time lifetime unlimited support for ₦50,000',
          'Setup fee plus a recurring monthly optimization & monitoring retainer',
          'Hourly billing with no minimum commitment',
          'Commission-only with zero upfront commitment',
        ],
        correctIndex: 1,
        explanation: 'Combining a setup fee with a monthly retainer covers API monitoring, prompt tuning, and predictable recurring revenue.',
      },
    ],
  },
  {
    title: 'Zero-Cost & Low-Cost AI Model Routing Architecture',
    quizTitle: 'Model Selection & Cost Control',
    lectures: [
      {
        title: 'Multi-Provider AI Routing (Gemini, Groq & OpenRouter)',
        durationMinutes: 24,
        summary: 'Configure automatic failover across Gemini AI Studio, Groq fast inference, and OpenRouter free/low-cost tiers.',
        keyTakeaways: ['Eliminating single-provider 429 downtime', 'Latency vs reasoning tradeoffs', 'Token budget clamping'],
        textContent: 'Production client bots cannot crash when one API hits a rate limit. By routing fast classification to Groq and long-context synthesis to Gemini Flash with automatic fallback, your agency maintains 99.9% uptime at minimal cost.',
      },
      {
        title: 'Semantic Caching & Deterministic Guardrails',
        durationMinutes: 20,
        summary: 'Cut API bills by up to 70% using SHA-256 response caching for frequent FAQs and strict output length limits.',
        keyTakeaways: ['Caching repetitive customer FAQs', 'Enforcing JSON/structured outputs', 'Preventing hallucinated pricing'],
        textContent: 'Over 60% of customer inquiries ask the same 15 questions about pricing, delivery timelines, and bank details. Caching verified answers prevents hallucinations and keeps token spend near zero.',
      },
    ],
    questions: [
      {
        prompt: 'Why should a production AI agency system implement multi-provider failover?',
        options: [
          'To make the codebase twice as complex for clients',
          'To prevent rate-limit (429) or outage (503) interruptions by switching automatically to a backup model',
          'To avoid using HTTPS endpoints',
          'To double the client API bill intentionally',
        ],
        correctIndex: 1,
        explanation: 'Automatic failover guarantees continuous customer service even if a single upstream LLM provider experiences rate limits.',
      },
      {
        prompt: 'How does semantic/FAQ caching benefit an AI customer-support bot?',
        options: [
          'It slows down responses intentionally',
          'It reduces token costs and prevents hallucinated pricing on repeated questions',
          'It deletes customer chat history',
          'It forces every user to log in twice',
        ],
        correctIndex: 1,
        explanation: 'Returning verified cached answers for common FAQs eliminates unnecessary token spend and ensures 100% accurate business facts.',
      },
      {
        prompt: 'Why is clamping max output tokens important in production workflows?',
        options: [
          'It stops runaway generation loops and controls API costs',
          'It prevents users from typing long questions',
          'It disables streaming responses',
          'It removes the need for system prompts',
        ],
        correctIndex: 0,
        explanation: 'Output token clamping prevents unexpected cost spikes and keeps bot replies concise and mobile-friendly.',
      },
    ],
  },
  {
    title: 'Building WhatsApp & Web AI Sales Agents',
    quizTitle: 'Conversational Sales Engineering',
    lectures: [
      {
        title: 'The 15-Minute Rule & Instant WhatsApp Triage',
        durationMinutes: 26,
        summary: 'Design conversational flows that qualify leads in under 60 seconds and route hot buyers to closing.',
        keyTakeaways: ['Greeting & intent classification', 'Capturing name, budget, and location', 'Escalating VIP buyers to human closers'],
        textContent: 'In Nigerian commerce, buyers message multiple vendors simultaneously. The vendor who responds clearly within 60 seconds wins the trust and the deposit.',
      },
      {
        title: 'Connecting Knowledge Bases (RAG) to Product Catalogs',
        durationMinutes: 28,
        summary: 'Ground your AI agent in real-time inventory, Naira pricing, delivery fees, and refund policies.',
        keyTakeaways: ['Structuring clean product JSON/Markdown', 'Preventing out-of-stock promises', 'Citing verified links'],
        textContent: 'Never let an AI guess product prices. Inject the exact verified product catalog and policy snippet into the context window before generating every reply.',
      },
    ],
    questions: [
      {
        prompt: 'What should an AI WhatsApp sales agent do immediately after greeting a new prospect?',
        options: [
          'Send a 12-page PDF manual unprompted',
          'Ask a simple clarifying question to identify their exact need and urgency',
          'End the conversation if they do not pay in 10 seconds',
          'Ask for their BVN and ATM PIN',
        ],
        correctIndex: 1,
        explanation: 'Fast intent discovery keeps the buyer engaged and lets the agent tailor the exact offer.',
      },
      {
        prompt: 'How do you prevent an AI agent from quoting outdated Naira prices?',
        options: [
          'Let the model rely on its pre-training memory',
          'Ground every response with live structured catalog data (RAG) from the store database',
          'Tell customers prices change every minute',
          'Remove all prices from the system',
        ],
        correctIndex: 1,
        explanation: 'Retrieval-Augmented Generation (RAG) from your live catalog ensures the AI always quotes current, verified prices.',
      },
      {
        prompt: 'When should an AI sales agent hand off a conversation to a human closer?',
        options: [
          'Never—even for custom enterprise contracts',
          'When high-value custom orders, complex complaints, or direct payment confirmations arise',
          'Before saying hello',
          'Only after 30 days of silence',
        ],
        correctIndex: 1,
        explanation: 'Hybrid AI + human escalation combines 24/7 speed with high-trust human closing for large or sensitive deals.',
      },
    ],
  },
  {
    title: 'Workflow Automation with Webhooks, CRMs & Payment Gateways',
    quizTitle: 'Automation & Payment Integration',
    lectures: [
      {
        title: 'Paystack Webhook Verification & Instant Fulfillment',
        durationMinutes: 25,
        summary: 'Automate receipt generation, course enrollment, and WhatsApp onboarding upon confirmed Paystack payment.',
        keyTakeaways: ['HMAC-SHA512 webhook signature verification', 'Idempotent order fulfillment', 'Automated welcome emails & links'],
        textContent: 'Manual payment confirmation creates bottlenecks at scale. Verified Paystack webhooks trigger instant digital delivery and CRM tagging without human intervention.',
      },
      {
        title: 'CRM Lead Scoring & Automated 7-Day Follow-Up Sequences',
        durationMinutes: 23,
        summary: 'Build automated follow-up loops for abandoned checkouts and unpaid bank transfer intents.',
        keyTakeaways: ['Day 1, Day 3, Day 7 polite check-ins', 'Tracking conversion attribution', 'Zero-spam opt-out respect'],
        textContent: 'Over 50% of sales happen between the 2nd and 5th follow-up. Automated CRM reminders recover lost revenue while keeping communication respectful.',
      },
    ],
    questions: [
      {
        prompt: 'Why must a Paystack webhook endpoint verify the cryptographic signature header before fulfilling an order?',
        options: [
          'To make the server response slower',
          'To guarantee the payment notification genuinely came from Paystack and was not spoofed',
          'To bypass HTTPS requirements',
          'To allow unpaid orders to pass',
        ],
        correctIndex: 1,
        explanation: 'Signature verification prevents attackers from forging fake payment webhooks to unlock paid products.',
      },
      {
        prompt: 'What is "idempotent" order fulfillment?',
        options: [
          'Charging the customer twice for the same order',
          'Ensuring duplicate webhook retries fulfill the order only once without duplicate charges or emails',
          'Deleting orders after 1 hour',
          'Disabling email receipts',
        ],
        correctIndex: 1,
        explanation: 'Payment gateways may retry webhooks; idempotency guarantees an order is marked completed and delivered exactly once.',
      },
      {
        prompt: 'Which metric best measures the ROI of an abandoned-cart follow-up automation?',
        options: [
          'Total number of emojis used',
          'Percentage of stalled checkouts converted into completed payments',
          'Server CPU temperature',
          'Number of unsubscribed users',
        ],
        correctIndex: 1,
        explanation: 'Recovered checkout conversion rate directly proves the revenue impact of your follow-up automation.',
      },
    ],
  },
  {
    title: 'Client Acquisition & High-Ticket B2B Outreach in Nigeria',
    quizTitle: 'B2B Outreach & Discovery Calls',
    lectures: [
      {
        title: 'Building a Targeted Prospect List (Lagos, Abuja, Port Harcourt & Diaspora)',
        durationMinutes: 21,
        summary: 'Identify businesses already spending money on Instagram/Google ads who leak leads in their DMs.',
        keyTakeaways: ['Spot slow-replying advertisers', 'Personalize 90-second Loom video audits', 'Reaching decision makers directly'],
        textContent: 'Businesses running paid ads already understand customer acquisition cost. Showing them how many ad clicks die in their unanswered WhatsApp inbox makes your pitch an instant yes.',
      },
      {
        title: 'Running Consultative Discovery Calls That Close at ₦500k+',
        durationMinutes: 27,
        summary: 'Master the 4-part discovery script: Current State, Bottleneck Cost, Future State, and Implementation Roadmap.',
        keyTakeaways: ['Calculating cost of inaction in Naira', 'Handling "it is too expensive" objections', 'Securing 60% upfront deposits'],
        textContent: 'Never present your price before establishing the monthly cost of the client’s current problem. When a clinic loses ₦1.2M/month in missed bookings, a ₦500k automation pays for itself in 2 weeks.',
      },
    ],
    questions: [
      {
        prompt: 'Why are businesses already running paid Instagram or Google Ads ideal prospects for an AI agency?',
        options: [
          'They have unlimited free time',
          'They already invest in generating leads and immediately feel the pain of slow follow-up',
          'They never use WhatsApp',
          'They prefer manual paper ledgers',
        ],
        correctIndex: 1,
        explanation: 'Active advertisers already pay for traffic, so plugging lead leakage delivers immediate, visible ROI.',
      },
      {
        prompt: 'During a discovery call, when should you reveal your implementation fee?',
        options: [
          'In the first 10 seconds before asking any questions',
          'After quantifying the financial cost of the client’s current bottleneck',
          'Only after finishing the entire project',
          'Never state a clear price',
        ],
        correctIndex: 1,
        explanation: 'Anchoring your fee against the monthly value of solving the problem makes the investment logical and compelling.',
      },
      {
        prompt: 'What is a healthy payment milestone structure for a custom agency build?',
        options: [
          '100% after 6 months of free work',
          '60%–70% upfront deposit to kick off, and 30%–40% upon agreed milestone delivery',
          'Zero deposit with verbal promises',
          'Bartering only',
        ],
        correctIndex: 1,
        explanation: 'An upfront deposit protects your engineering time and ensures client commitment throughout delivery.',
      },
    ],
  },
  {
    title: 'Security, NDPA 2023 Compliance & Production Reliability',
    quizTitle: 'Data Privacy & Security Governance',
    lectures: [
      {
        title: 'Protecting Customer PII Under Nigeria Data Protection Act (NDPA 2023)',
        durationMinutes: 22,
        summary: 'Implement consent notices, data minimization, and encrypted storage for client customer records.',
        keyTakeaways: ['Never leak client phone/email data into public prompts', 'Role-based admin access', 'Audit logging for sensitive actions'],
        textContent: 'Enterprise clients require assurance that customer phone numbers, bank details, and chat histories are protected in compliance with NDPA 2023.',
      },
      {
        title: 'Monitoring, Error Alerting & Client SLA Handover',
        durationMinutes: 20,
        summary: 'Set up uptime checks, fallback alerts, and clean handover documentation for every client deployment.',
        keyTakeaways: ['Health check endpoints', 'Client training SOPs', 'Monthly ROI summary reports'],
        textContent: 'Sending a concise 1-page monthly ROI report showing leads captured and hours saved turns one-off clients into multi-year retainer partners.',
      },
    ],
    questions: [
      {
        prompt: 'Under NDPA 2023 best practices, how should customer PII be handled in AI workflows?',
        options: [
          'Posted publicly in community forums for debugging',
          'Minimized, access-controlled, and never exposed in unauthenticated endpoints',
          'Stored in plain text inside frontend JavaScript files',
          'Shared with unrelated third-party agencies',
        ],
        correctIndex: 1,
        explanation: 'Data minimization and strict access control protect user privacy and keep your agency legally compliant.',
      },
      {
        prompt: 'What helps retain monthly AI agency clients long-term?',
        options: [
          'Never contacting them after launch',
          'Sending monthly ROI reports detailing leads handled, hours saved, and system uptime',
          'Disabling error monitoring',
          'Changing their passwords every week without notice',
        ],
        correctIndex: 1,
        explanation: 'Visible, quantified monthly value makes renewing your retainer an easy decision for executives.',
      },
      {
        prompt: 'Where should secret API keys (Paystack, Gemini, Supabase) always be stored?',
        options: [
          'Hardcoded inside React frontend components',
          'In server-side environment variables never exposed to the browser',
          'In public GitHub README files',
          'Inside client-facing PDFs',
        ],
        correctIndex: 1,
        explanation: 'Server-side environment variables prevent attackers from stealing secret keys from browser dev tools.',
      },
    ],
  },
  {
    title: 'Scaling to ₦5M+/Month: Productized Delivery & Team Delegation',
    quizTitle: 'Agency Scaling & Productization',
    lectures: [
      {
        title: 'Turning Custom Builds into Repeatable Industry Templates',
        durationMinutes: 24,
        summary: 'Package your best-performing workflows into reusable templates that deploy in 48 hours instead of 4 weeks.',
        keyTakeaways: ['Standardized onboarding checklists', 'Reusable webhook & prompt modules', 'Protecting 75%+ gross margins'],
        textContent: 'True agency scale happens when 80% of every new client deployment reuses battle-tested templates and only 20% is customized.',
      },
      {
        title: 'Hiring Junior Automation Builders & QA Reviewers',
        durationMinutes: 22,
        summary: 'Delegate routine setup and testing using SOPs while you focus on partnerships and high-ticket sales.',
        keyTakeaways: ['Separation of duties in client accounts', 'Pre-launch QA checklist', 'Building a referral flywheel'],
        textContent: 'Document every deployment step in a repeatable checklist so junior builders deliver consistent quality without founder burnout.',
      },
    ],
    questions: [
      {
        prompt: 'What is the biggest operational benefit of "productizing" an AI agency service?',
        options: [
          'Every client project must be built from scratch over 6 months',
          'Reusable templates cut delivery time dramatically while keeping margins above 70%',
          'It forces you to lower your prices to ₦5,000',
          'It eliminates the need for client onboarding',
        ],
        correctIndex: 1,
        explanation: 'Productized templates let your team deploy faster with fewer bugs and much higher profitability.',
      },
      {
        prompt: 'How should a scaling agency maintain quality when delegating builds to junior staff?',
        options: [
          'Skip testing before going live',
          'Enforce documented SOPs and a mandatory pre-launch QA verification checklist',
          'Give every junior full ownership of company bank accounts',
          'Stop talking to clients completely',
        ],
        correctIndex: 1,
        explanation: 'Standardized SOPs and QA checklists ensure reliable delivery regardless of who executes the build.',
      },
      {
        prompt: 'What creates a compounding referral flywheel for an AI agency?',
        options: [
          'Ignoring client feedback after launch',
          'Delivering measurable early wins, clear ROI reports, and offering partner referral incentives',
          'Hiding case studies from your website',
          'Refusing to support existing clients',
        ],
        correctIndex: 1,
        explanation: 'Satisfied clients who see clear ROI naturally refer peers in their business networks when prompted.',
      },
    ],
  },
]);

function createGeneric7SectionsForCourse(prod: Product): CourseModule[] {
  const existingMods = prod.courseData?.modules ?? [];
  const topic = prod.category || 'Digital Mastery';
  const title = prod.title;
  // Stable, collision-free prefix derived from the full product id (hash short
  // suffix) so different courses never share identical module/lecture IDs.
  let hash = 0;
  for (let i = 0; i < prod.id.length; i += 1) hash = (hash * 31 + prod.id.charCodeAt(i)) | 0;
  const slugPrefix = `${prod.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}-${Math.abs(hash).toString(36)}`;

  const sectionThemes = [
    {
      title: `Foundations & Core Principles of ${topic}`,
      quizTitle: `${topic} Fundamentals`,
      focus: `Core frameworks, market realities, and high-impact foundations in ${title}.`,
    },
    {
      title: `Strategic Architecture & Planning Systems`,
      quizTitle: `Strategy & System Design`,
      focus: `Step-by-step planning, requirement mapping, and avoiding costly beginner mistakes.`,
    },
    {
      title: `Hands-On Execution & Core Workflows`,
      quizTitle: `Execution & Workflow Mastery`,
      focus: `Implementing the primary workflows, templates, and tools covered in ${title}.`,
    },
    {
      title: `Nigerian & Global Market Adaptation`,
      quizTitle: `Market & Context Adaptation`,
      focus: `Adapting systems for Nigerian buyers, Naira pricing, WhatsApp/mobile workflows, and global standards.`,
    },
    {
      title: `Conversion, Quality Assurance & Error Prevention`,
      quizTitle: `Quality Assurance & Optimization`,
      focus: `Testing edge cases, removing friction, and protecting customer trust and reliability.`,
    },
    {
      title: `Automation, Metrics & Performance Tracking`,
      quizTitle: `Analytics & Automation`,
      focus: `Measuring KPIs, automating repetitive tasks, and scaling output without burnout.`,
    },
    {
      title: `Capstone Implementation & Long-Term Scaling`,
      quizTitle: `Capstone & Scaling Readiness`,
      focus: `Combining all modules into a repeatable production system ready for real-world results.`,
    },
  ];

  const blueprints: SectionBlueprint[] = sectionThemes.map((theme, idx) => {
    const existing = existingMods[idx];
    const existingLectures = existing?.lectures ?? [];
    const lectures =
      existingLectures.length >= 2
        ? existingLectures.map((l) => ({
            title: l.title.replace(/^\d+\.\d+\s*/, ''),
            durationMinutes: l.durationMinutes || 18,
            summary: l.summary || theme.focus,
            keyTakeaways:
              l.keyTakeaways && l.keyTakeaways.length > 0
                ? l.keyTakeaways
                : [`Core mastery of ${theme.title}`, 'Actionable implementation checklist'],
            textContent:
              l.textContent ||
              `${l.summary || theme.focus}\n\nApply these principles step by step before moving to the next section assessment.`,
          }))
        : [
            {
              title: existingLectures[0]?.title.replace(/^\d+\.\d+\s*/, '') || `${theme.title} — Core Concepts`,
              durationMinutes: existingLectures[0]?.durationMinutes || 20,
              summary: existingLectures[0]?.summary || theme.focus,
              keyTakeaways:
                existingLectures[0]?.keyTakeaways?.length
                  ? existingLectures[0].keyTakeaways
                  : [
                      `Understand the core mechanics of ${theme.title}`,
                      'Identify common pitfalls and how to prevent them',
                      'Connect theory directly to measurable outcomes',
                    ],
              textContent:
                existingLectures[0]?.textContent ||
                `In this lesson on ${theme.title}, we break down the exact mental models and practical steps required to master ${title}. Focus on completing every checklist item before taking the section assessment.`,
            },
            {
              title: `${theme.title} — Practical Walkthrough & Case Study`,
              durationMinutes: 22,
              summary: `Apply ${theme.title.toLowerCase()} with real-world examples, templates, and Nigerian & international execution benchmarks.`,
              keyTakeaways: [
                'Step-by-step live implementation walkthrough',
                'Real-world troubleshooting & edge-case handling',
                'Ready-to-use execution template for immediate results',
              ],
              textContent: `Putting ${theme.title} into practice separates passive learners from high-performing practitioners. Review the attached takeaways and complete the 5-question section quiz (80% passmark) to unlock the next section.`,
            },
          ];

    const existingQuestions = existing?.quiz?.questions ?? [];
    const defaultQuestions: SectionBlueprint['questions'] = [
      {
        prompt: `What is the primary objective of "${theme.title}" in ${title}?`,
        options: [
          'Skipping foundational steps to guess outcomes randomly',
          `Applying structured, repeatable systems to achieve reliable results in ${topic}`,
          'Ignoring customer feedback and market context',
          'Avoiding measurement and documentation',
        ],
        correctIndex: 1,
        explanation: `Mastering ${theme.title} relies on structured, repeatable execution rather than guesswork.`,
      },
      {
        prompt: `Which habit best ensures consistent quality when implementing ${theme.title}?`,
        options: [
          'Relying on memory without checklists or verification',
          'Validating assumptions against real user/market data and documenting key steps',
          'Copying unverified templates blindly without adaptation',
          'Deploying changes without testing edge cases',
        ],
        correctIndex: 1,
        explanation: 'Verification against real data and clear documentation prevent costly mistakes.',
      },
      {
        prompt: `Before advancing past ${theme.title}, what should a practitioner confirm?`,
        options: [
          'That all core concepts are skipped until the final exam',
          'That every required step, checklist item, and 80% assessment benchmark is met',
          'That only theoretical definitions are memorized without practice',
          'That no metrics are tracked',
        ],
        correctIndex: 1,
        explanation: 'Sequential mastery ensures every section builds solidly on verified competence.',
      },
      {
        prompt: `When applying ${theme.title}, which approach protects the best outcome for ${topic}?`,
        options: [
          'Implementing without a rollback or measurement plan',
          'Documenting decisions and reviewing results against the original goal',
          'Copying a competitor verbatim without adapting to local context',
          'Skipping the verification phase to move faster',
        ],
        correctIndex: 1,
        explanation: 'Documented decisions and measured outcomes enable repeatable quality and measurable improvement.',
      },
      {
        prompt: `What distinguishes a reliable ${theme.title} workflow from an ad-hoc one?`,
        options: [
          'It depends on individual memory and improvisation',
          'It uses a consistent, reviewed checklist with defined quality gates',
          'It avoids all forms of documentation and tracking',
          'It relies exclusively on unverified third-party templates',
        ],
        correctIndex: 1,
        explanation: 'Consistency, review checkpoints, and defined quality gates make a workflow reliable and scalable.',
      },
    ];

    // Preserve existing questions; pad with defaults until there are at least
    // 5 questions so an 80% passmark means 4/5 (not a forced 3/3 = 100%).
    const mergedQuestions: SectionBlueprint['questions'] = [...existingQuestions.map((q) => ({
      prompt: q.prompt,
      options: (q.options.length === 4 ? q.options : [...q.options, 'None of the above', 'All of the above', 'Skip this step'].slice(0, 4)) as [string, string, string, string],
      correctIndex: q.correctIndex,
      explanation: q.explanation || 'Review the section lesson summary for full context.',
    }))];

    let padIdx = 0;
    while (mergedQuestions.length < 5) {
      const template = defaultQuestions[padIdx % defaultQuestions.length];
      mergedQuestions.push(template);
      padIdx += 1;
    }

    return {
      title: existing?.title.replace(/^(Module|Section)\s*\d+:\s*/i, '') || theme.title,
      lectures,
      quizTitle: existing?.quiz?.title || theme.quizTitle,
      questions: mergedQuestions,
    };
  });

  return buildModules(slugPrefix, blueprints, existingMods);
}

/**
 * Guarantees every course has at least 7 full sections and at least 5 quiz
 * questions per section, so an 80% passmark is achievable (4 correct / 5).
 */
export function ensureFullCourseCurriculum(product: Product): Product {
  if (product.type !== 'course') return product;

  if (product.id === 'prod-course-ai-agency') {
    return {
      ...product,
      courseData: {
        ...(product.courseData ?? { totalHours: 14, modules: [] }),
        totalHours: Math.max(product.courseData?.totalHours ?? 14, 14),
        modules: AI_AGENCY_MODULES,
      },
    };
  }

  const existingModules = product.courseData?.modules ?? [];
  const needsUpgrade =
    existingModules.length < 7 ||
    existingModules.some(
      (m) =>
        m.lectures.length < 2 ||
        !m.quiz ||
        m.quiz.questions.length < 5 ||
        (m.quiz.passingScore ?? 0) < 80
    );

  if (!needsUpgrade) return product;

  const upgradedModules = createGeneric7SectionsForCourse(product);
  return {
    ...product,
    courseData: {
      ...(product.courseData ?? { totalHours: 12, modules: [] }),
      totalHours: Math.max(product.courseData?.totalHours ?? 10, 12),
      modules: upgradedModules,
    },
  };
}
