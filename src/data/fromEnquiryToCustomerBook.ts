/**
 * FROM ENQUIRY TO CUSTOMER
 * Customer Communication, Follow-Up and Sales Systems for Nigerian Entrepreneurs
 * Author: S. B. OMOTOSO, FCIA
 * Published by Tintol Business Services (Scholar Suite), Ibadan and Abeokuta, Nigeria
 * First Edition, 2026.
 */

export interface BookChapterData {
  number: number;
  part: string;
  title: string;
  pages: number;
  scenario: string;
  objectives: string[];
  sections: {
    heading: string;
    body: string;
    bulletPoints?: string[];
    callout?: string;
  }[];
  practicalExercise?: string;
  commonMistakes: string[];
  actionChecklist: string[];
  recap: string;
}

export interface BookAppendixData {
  id: string;
  title: string;
  content: string;
}

export const FROM_ENQUIRY_TO_CUSTOMER_METADATA = {
  id: 'prod-ebook-enquiry-to-customer',
  slug: 'from-enquiry-to-customer-sales-systems-nigeria',
  title: 'FROM ENQUIRY TO CUSTOMER',
  subtitle: 'Customer Communication, Follow-Up and Sales Systems for Nigerian Entrepreneurs',
  tagline: 'A practical guide for small-business owners, online vendors, freelancers and service providers',
  subjectLine: 'CUSTOMER COMMUNICATION, FOLLOW-UP AND SALES SYSTEMS',
  author: 'S. B. OMOTOSO, FCIA',
  authorRole: 'Managing Consultant, Tintol Business Services (Scholar Suite)',
  publisher: 'Tintol Business Services (Scholar Suite)',
  publicationPlace: 'Ibadan and Abeokuta, Nigeria',
  year: '2026',
  edition: 'First edition, 2026',
  isbn: '978-978-790-215-8',
  coverImage: '/images/ebooks/from-enquiry-to-customer-cover.png',
  backCoverImage: '/images/ebooks/from-enquiry-to-customer-back.png',
  disclaimer:
    'This book provides general educational information about customer communication, sales processes and small-business operations. It is not legal, tax, accounting, financial, medical or professional advice. Laws and regulatory guidance may change; readers should consult qualified professionals about circumstances requiring specialist advice. Platform features, prices and policies can change and should be checked directly before use. No particular sales, income or business result is promised.',
  howToUse:
    'Read the chapters in sequence the first time. Then return to the scripts, worksheets and trackers when handling real enquiries. Adapt every example to your products, customers, capacity and applicable rules. The examples are illustrative, not testimonials or claims about actual businesses.\n\nYou do not need expensive software to begin. A notebook or spreadsheet, a clearly managed business phone and a consistent routine are enough to build a basic system. Start small, record what happens, and improve from evidence.',
  corePrinciple:
    'Make it easy for a suitable customer to understand what you offer, decide whether it meets their needs, and complete the next step without confusion or pressure.',
  introduction:
    'A customer sends a message asking, "How much?" You reply with a price. The customer reads it and disappears. Another person asks whether delivery is available. You answer, but the conversation goes quiet. A third person requests a quotation, says they will get back to you, and never does.\n\nThese experiences are common in small businesses. They can be frustrating, especially when you are managing stock, production, delivery, payments and marketing at the same time. It is tempting to conclude that customers are unserious or that the only solution is to reduce prices. Sometimes price is the issue. Often, however, the customer needs clearer information, more confidence, a suitable option, a timely response or simply more time.\n\nThis book treats customer communication as a business process rather than a collection of clever messages. The goal is to help you handle the journey from first enquiry to purchase and, where appropriate, repeat business. You will learn how to understand customer needs, answer questions, present an offer, handle hesitation, follow up respectfully, confirm orders, protect information and learn from your results.\n\nThe examples focus on Nigerian small businesses, including online vendors, freelancers and service providers. The principles can also be adapted by businesses in other markets. The book does not promise that a script will make every person buy. Customers have different budgets, priorities and circumstances. A sound system improves the quality and consistency of your process; it cannot control every buying decision.',
};

export const ENQUIRY_BOOK_CHAPTERS: BookChapterData[] = [
  {
    number: 1,
    part: 'Part One: Understand the customer',
    title: 'Understanding the Customer Journey',
    pages: 12,
    scenario:
      'A customer discovers a home-baking business on Instagram, views a cake photograph, sends a direct message, asks about a birthday cake, receives a quotation, pays a deposit, collects the cake and later recommends the baker. The sale is not one isolated moment. It is a sequence of experiences.',
    objectives: [
      'Describe the five main stages of a customer journey in Nigerian retail and services',
      'Identify where prospect enquiries are being dropped or neglected',
      'Map the explicit steps customers take before, during, and after completing a purchase',
    ],
    sections: [
      {
        heading: 'The Five Stages of Conversion',
        body: 'A customer does not buy in a vacuum. Every completed transaction represents progress across five sequential phases:',
        bulletPoints: [
          'Awareness: The prospect discovers your business via Instagram, word of mouth, Google search, an event, or a referral.',
          'Interest: The prospect inspects your catalog, checks highlights, compares alternatives, and saves your contact details.',
          'Enquiry & Consideration: The customer asks questions, requests prices, verifies delivery coverage, and checks suitability.',
          'Purchase: The customer formally accepts terms, provides specifications, and pays through verified banking or Paystack channels.',
          'Post-Purchase Experience: Delivery is fulfilled, onboarding happens, issues are resolved, and reviews or repeat orders occur.',
        ],
      },
      {
        heading: 'Why the Complete Journey Matters',
        body: 'A business can attract thousands of views on TikTok or Instagram, but lose everyone because its WhatsApp link is broken or response times exceed 12 hours. Conversely, a seller might answer quickly but fail to disclose dispatch fees until after the customer prepares to pay, destroying trust at the finish line. Fixing marketing cannot heal operational friction later in the journey.',
      },
      {
        heading: 'Illustrative Nigerian Case Study: The Lagos Ready-to-Wear Vendor',
        body: 'A ready-to-wear fashion vendor based in Yaba, Lagos, receives 40 Instagram DMs and WhatsApp enquiries daily. The vendor noticed that 70% of potential buyers stopped replying after asking for prices. Upon auditing conversations, the vendor realized that buyers were confused about whether sizes followed UK or US standards, what dispatch to Lekki or Ikeja cost, and whether fabric stretch was forgiving. By introducing a standardized 1-page digital size guide, fixed interstate/intra-state courier matrices, and clear return guidelines, conversion from enquiry to paid order rose by 34% without spending an extra naira on ads.',
      },
    ],
    practicalExercise:
      'Choose one core product or service. Write down the 5 stages a prospect passes through. Under each stage, write one common question the customer asks and one concrete improvement you will test.',
    commonMistakes: [
      'Treating every initial enquiry as a guaranteed immediate sale',
      'Investing solely in top-of-funnel ads while ignoring slow response times',
      'Assuming customers understand your unwritten operational policies',
      'Failing to deliver post-purchase follow-up and care',
      'Not recording where conversations stop or drop off',
    ],
    actionChecklist: [
      'I can clearly articulate how customers discover my business.',
      'My contact numbers, WhatsApp links, and catalog details are current.',
      'I know the top 5 questions customers ask before paying.',
      'My ordering, banking, and dispatch terms are unambiguous.',
      'I have a defined protocol for post-delivery customer care.',
    ],
    recap:
      'A customer journey is an interconnected sequence from first impression to post-purchase advocacy. Pinpoint where friction occurs rather than assuming every lost prospect is solely a pricing issue.',
  },
  {
    number: 2,
    part: 'Part One: Understand the customer',
    title: 'Why Customers Enquire but Do Not Buy',
    pages: 14,
    scenario:
      'A prospect messages asking for the price of a solar inverter or phone accessory and stops replying the moment you state the price. You assume they found you too expensive. In reality, they were comparing battery wattages, waiting for end-of-month salary, or checking whether installation was included.',
    objectives: [
      'Identify genuine non-purchase factors across Nigerian market segments',
      'Distinguish factual feedback from defensive seller assumptions',
      'Utilize an enquiry logbook to optimize conversion bottlenecks',
    ],
    sections: [
      {
        heading: 'The Psychology of the Silent Prospect',
        body: 'Silence does not equal hostility or cheapness. When a Nigerian customer goes quiet, common underlying realities include: comparing multiple quotes, waiting for cashflow or monthly salary payment, uncertainty about seller legitimacy, lack of clear installation/delivery details, or simply being interrupted by daily life.',
        bulletPoints: [
          'Budget Timing: Many customers inquire 2 weeks before payday to budget accurately.',
          'Trust Deficit: Online scams make buyers cautious until verifiable business proof is supplied.',
          'Ambiguity: Vague answers ("It depends on what you want") cause decision fatigue.',
          'Delivery Friction: Unclear interstate transit times cause immediate drop-offs.',
        ],
      },
      {
        heading: 'Working Customer Categories',
        body: 'Categorize your prospects into three functional profiles to tailor your communication style:',
        bulletPoints: [
          'Information Seekers: Exploring options and learning terminology. They need education and clarity.',
          'Active Evaluators: Comparing 2-3 shortlisted providers. They need distinct value differentiation and scope breakdown.',
          'Ready-to-Buy Decision Makers: Asking about stock, delivery schedule, and bank accounts. They need frictionless transaction closing.',
        ],
      },
      {
        heading: 'Illustrative Freelancer Case Study: The Brand Identity Designer',
        body: 'A freelance graphic designer in Abuja regularly quoted ₦80,000 for corporate logo design and saw 8 out of 10 clients disappear. A systematic review revealed that the quote contained only a total figure without explaining revision limits, file formats (AI, PNG, SVG), brand color guidelines, or intellectual property transfer. Once the designer packaged the service as a comprehensive "Brand Identity Launchpad" with structured deliverables, clients appreciated the value and paid without dispute.',
      },
    ],
    practicalExercise:
      'Review your last 10 lost WhatsApp or Instagram enquiries. Categorize them honestly into Information Seeker, Evaluator, or Ready-to-Buy. Record what caused the pause and identify one operational gap.',
    commonMistakes: [
      'Assuming price is the only variable that determines a sale',
      'Bombarding silent prospects with aggressive messages',
      'Arguing with prospects who point out lower competitor rates',
      'Slashing prices instantly before determining the true bottleneck',
    ],
    actionChecklist: [
      'I log the outcome of all serious incoming enquiries.',
      'I separate confirmed customer feedback from my own emotional assumptions.',
      'I have proactive answers for the top 3 hesitations in my industry.',
      'I maintain courteous composure when prospects decline or postpone.',
    ],
    recap:
      'Non-purchase is an outcome, not an insult. Treat silence with professional respect, diagnose friction through structured records, and continuously eliminate friction from your sales pipeline.',
  },
  {
    number: 3,
    part: 'Part One: Understand the customer',
    title: 'Understanding Your Ideal Customer',
    pages: 12,
    scenario:
      'An enterprise that supplies healthy office lunch bowls tries to market simultaneously to university students, corporate bank executives in Victoria Island, and event planners. Because the messaging tries to speak to everyone, it resonates with no one.',
    objectives: [
      'Define an actionable Ideal Customer Profile (ICP) based on actual market evidence',
      'Differentiate between demographic stereotypes and genuine behavioral buying triggers',
      'Focus limited marketing and operational energy on high-fit, repeatable client relationships',
    ],
    sections: [
      {
        heading: 'Target Audience vs. Ideal Customer Profile',
        body: 'A target audience is broad (e.g., "Working professionals in Lagos"). An Ideal Customer Profile is specific and operational: "Mid-level corporate professionals in Marina and Ikeja who work 10-hour days, value punctual 12:30 PM desk delivery, order weekly meal subscriptions, and prefer automated debit payments."',
      },
      {
        heading: 'Core Dimensions of an Actionable Profile',
        body: 'Construct your profile around verified operational criteria:',
        bulletPoints: [
          'Problem Urgency: How severe is the pain your product resolves?',
          'Delivery Reach: Can your logistics reliably serve this geographic radius within promise times?',
          'Budget Realism: Does the customer possess the financial capacity to pay sustainable margins?',
          'Communication Preference: Do they prefer structured email briefs or fast WhatsApp voice notes?',
          'Trust Factors: What certifications, reviews, or guarantees do they require to feel safe?',
        ],
      },
    ],
    practicalExercise:
      'Complete this formula: "My offer creates maximum value for [specific group] who struggle with [core headache] and are willing to invest in [your solution] because they value [key benefit]."',
    commonMistakes: [
      'Believing everyone in Nigeria is your prospective customer',
      'Constructing personas from imagination rather than real transaction history',
      'Rejecting suitable clients who deviate slightly from ideal definitions',
    ],
    actionChecklist: [
      'I can state my ICP in two clear sentences.',
      'My pricing aligns with my ICP purchasing capacity.',
      'My marketing channels match where my ICP actually spends attention.',
    ],
    recap:
      'A sharp customer profile prevents wasted ad spend and operational exhaustion. Focus relentlessly on the buyers you can delight and serve profitably.',
  },
  {
    number: 4,
    part: 'Part Two: Build reliable communication',
    title: 'Creating a Professional First Impression',
    pages: 14,
    scenario:
      'Two different computer repair technicians in Computer Village, Ikeja receive the same enquiry: "Can you fix a MacBook screen?" One replies "Yes, 120k". The other replies: "Hello, good day! Yes, we replace MacBook screens with original Grade-A displays. The cost is ₦120,000, which includes testing, installation, and a 90-day warranty. What exact model number is written on the underside of your laptop so I can confirm stock right now?" The second technician won the customer instantly.',
    objectives: [
      'Master the five pillars of professional business correspondence in Nigeria',
      'Implement the 5-step First Response Framework for WhatsApp and DMs',
      'Establish dependable response-time protocols without burning out',
    ],
    sections: [
      {
        heading: 'The Five Pillars of Professional Tone',
        body: 'Every message sent from your business phone creates or destroys equity:',
        bulletPoints: [
          'Courtesy: Welcoming greeting, respectful address, and professional poise.',
          'Clarity: Direct answers without industry jargon or ambiguous ranges.',
          'Accuracy: Confirming inventory and pricing before committing to promises.',
          'Responsiveness: Acknowledging enquiries within a predictable, published timeframe.',
          'Consistency: Delivering the same high standard regardless of who handles the phone.',
        ],
      },
      {
        heading: 'The 5-Step First Response Framework',
        body: 'Structure your opening response with this disciplined anatomy:',
        bulletPoints: [
          '1. Warm Professional Greeting: "Hello, thank you for reaching out to [Business]."',
          '2. Direct Answer: Answer the primary question within the first 10 words.',
          '3. Vital Context & Value: State what is included (warranty, delivery, bonuses).',
          '4. Qualifying Question: Ask one relevant question to determine exact needs.',
          '5. Clear Next Step: Explain the precise action required to proceed.',
        ],
      },
    ],
    practicalExercise:
      'Draft your business’s standardized greeting template using the 5-step framework. Test it with your team or trusted partner.',
    commonMistakes: [
      'Sending a bare price with zero context or explanation',
      'Making promises before verifying stock on the ground',
      'Over-familiarity or using slang in professional commerce conversations',
    ],
    actionChecklist: [
      'My greeting includes my business name and professional warmth.',
      'My standard pricing discloses what is included.',
      'My business hours and response expectations are published.',
    ],
    recap:
      'First impressions establish your perceived authority and trustworthiness. Courtesy, clarity, and speed will win customers over larger competitors.',
  },
  {
    number: 5,
    part: 'Part Two: Build reliable communication',
    title: 'Setting Up Your Customer Communication Channels',
    pages: 16,
    scenario:
      'A boutique vendor runs Facebook Ads to WhatsApp, takes orders via Instagram DMs, and promises to email tracking slips. Conversations get fragmented across 3 phones, receipts are lost, and angry customers post complaints online because messages were missed.',
    objectives: [
      'Differentiate between WhatsApp Business App and WhatsApp Business Platform',
      'Organize customer conversations using systematic tagging and pipeline labels',
      'Comply with Meta Business Policies and the Nigeria Data Protection Act (NDPA 2023)',
    ],
    sections: [
      {
        heading: 'WhatsApp Business App vs. Cloud Platform',
        body: 'Small vendors managing up to 100 conversations daily benefit most from the free WhatsApp Business App. Growing companies handling high volumes require the WhatsApp Business Platform (Cloud API) for multi-agent support and automated CRM integrations.',
      },
      {
        heading: 'The 7-Stage Pipeline Labeling Standard',
        body: 'Never leave incoming chats unorganized. Tag every conversation with standard pipeline labels:',
        bulletPoints: [
          '1. New Enquiry: Fresh inbound lead awaiting initial qualification.',
          '2. Awaiting Customer: Quotation or options presented; awaiting decision.',
          '3. Quote Sent: Formal scope and price delivered.',
          '4. Awaiting Payment: Order details locked; invoice/account number issued.',
          '5. Payment Verified: Funds confirmed cleared in business account.',
          '6. In Fulfillment / Dispatched: Package packed or tracking number provided.',
          '7. Completed & Retained: Order delivered; satisfaction survey completed.',
        ],
      },
      {
        heading: 'Legal Compliance: NDPA 2023 & Meta Rules',
        body: 'A customer messaging your business to ask for price is NOT an open invitation to spam them with unrelated product broadcasts. The Nigeria Data Protection Act 2023 requires a lawful basis for personal data processing. Respect customer privacy, enable two-factor authentication on all business SIMs, and immediately honor opt-out requests.',
      },
    ],
    practicalExercise:
      'Set up the 7 standard pipeline labels in your WhatsApp Business app. Label all current active conversations accordingly before close of business today.',
    commonMistakes: [
      'Managing business enquiries on an unbacked-up personal phone number',
      'Adding phone numbers to broadcast lists without explicit permission',
      'Ignoring two-step verification and suffering WhatsApp account hijacking',
    ],
    actionChecklist: [
      'My WhatsApp Business profile has complete address, website, and hours.',
      'My 7 pipeline labels are active and applied daily.',
      'Two-step verification is enabled on all business devices.',
    ],
    recap:
      'Discipline beats chaos. A structured, secured, and compliant communication channel ensures zero missed sales and protects your business reputation.',
  },
  {
    number: 6,
    part: 'Part Two: Build reliable communication',
    title: 'Asking the Right Questions',
    pages: 14,
    scenario:
      'A corporate client asks a commercial printer in Shomolu: "How much for 500 brochures?" The printer quotes ₦95,000. When the artwork arrives, it is a 32-page full-color saddle-stitched catalog with spot-UV lamination, which actually costs ₦340,000 to print. An uncomfortable dispute ensues because the printer quoted without asking qualifying questions.',
    objectives: [
      'Master the distinction between Open Discovery Questions and Closed Verification Questions',
      'Qualify prospect requirements, timelines, and budget without causing offense',
      'Summarize customer specifications to achieve mutual agreement before quoting',
    ],
    sections: [
      {
        heading: 'Open Discovery vs. Closed Verification',
        body: 'Use open questions to understand the scope and closed questions to confirm details:',
        bulletPoints: [
          'Open: "What specific objective do you want this marketing brochure to achieve?"',
          'Open: "How will these items be transported or presented to your guests?"',
          'Closed: "Is your event date fixed for Saturday the 14th?"',
          'Closed: "Do you have print-ready PDF artwork prepared already?"',
        ],
      },
      {
        heading: 'The Delicate Art of Budget Discovery',
        body: 'Asking "What is your budget?" directly often makes Nigerian buyers feel defensive or suspicious that you will inflate prices. Instead, use comparative bracket framing: "We have two popular tiers for this event package: our Essential Tier at ₦45,000 and our Executive Tier at ₦95,000. Which range aligns closer with your planned allocation?"',
      },
    ],
    practicalExercise:
      'Write down the 4 mandatory qualifying questions you must know before quoting your flagship service. Arrange them in logical conversational order.',
    commonMistakes: [
      'Quoting blindly before knowing key variables',
      'Subjecting prospects to an aggressive police-style interrogation',
      'Collecting sensitive personal data unnecessary for the transaction',
    ],
    actionChecklist: [
      'I ask discovery questions before giving custom quotes.',
      'I use price bracket framing to uncover budget expectations.',
      'I summarize the customer’s request in writing before accepting money.',
    ],
    recap:
      'The vendor who asks the smartest questions positions themselves as an expert advisor rather than an ordinary commodity hawker.',
  },
  {
    number: 7,
    part: 'Part Two: Build reliable communication',
    title: 'Responding to Enquiries Effectively',
    pages: 14,
    scenario:
      'A customer asks an online electronics vendor: "Do you have the iPhone 13 Pro 128GB in Sierra Blue, and does it come with charger?" The vendor replies 4 hours later: "Yes we have it". The customer is left wondering: What is the price? Is it brand new or UK used? What battery health? Is it available today? The customer moves on to another seller.',
    objectives: [
      'Master comprehensive single-response communication to reduce chat friction',
      'Differentiate clearly between dispatch estimates and guaranteed delivery windows',
      'Handle pricing, payment terms, and delivery transparency gracefully',
    ],
    sections: [
      {
        heading: 'The Complete Single-Response Model',
        body: 'Every response should give the buyer enough clear information to take the next step without requiring 15 back-and-forth messages:',
        bulletPoints: [
          'Direct Status: Confirm stock, condition, and color immediately.',
          'Total Pricing: Clearly display item cost and expected delivery fees.',
          'Included Deliverables: Specify warranty, accessories, and packaging.',
          'Fulfillment Timeline: State exact processing and transit hours.',
          'Call to Action: Provide a single, easy choice to complete the order.',
        ],
      },
      {
        heading: 'Estimates vs. Guarantees in Nigerian Logistics',
        body: 'Traffic, interstate dispatch hubs, and dispatch riders make logistics volatile. Never guarantee a delivery time unless you control the fleet directly. Use honest ranges: "Orders dispatched by 11:00 AM are delivered to Mainland addresses between 2:00 PM and 5:00 PM same day. Island deliveries arrive next day before 1:00 PM."',
      },
    ],
    practicalExercise:
      'Review your 3 most frequently asked product questions. Draft complete, single-response answers that eliminate back-and-forth delays.',
    commonMistakes: [
      'Burying the total price in confusing calculations',
      'Over-promising delivery speeds that external dispatchers cannot meet',
      'Ignoring inbound customer questions during official business hours',
    ],
    actionChecklist: [
      'My answers are complete, clear, and actionable.',
      'I distinguish processing time from transit time.',
      'I provide honest timelines that protect customer trust.',
    ],
    recap:
      'Complete, thoughtful answers make buying effortless for busy customers. Eliminate unnecessary message loops to accelerate sales conversions.',
  },
  {
    number: 8,
    part: 'Part Two: Build reliable communication',
    title: 'Presenting Your Products and Services',
    pages: 14,
    scenario:
      'A software developer trying to sell an inventory and billing system to a supermarket owner in Port Harcourt spends 40 minutes explaining React, Supabase, and PostgreSQL databases. The supermarket owner is bored and unimpressed. A competing vendor shows up with a 3-minute video showing a cashier scanning a barcode, printing a receipt in 2 seconds, and sending daily profit summaries to the owner’s WhatsApp. The second vendor closes the sale immediately.',
    objectives: [
      'Distinguish Technical Features from Tangible Customer Benefits',
      'Structure high-converting proposals and quotations for services',
      'Utilize authentic proof and portfolio examples responsibly and legally',
    ],
    sections: [
      {
        heading: 'Features Tell, Benefits Sell',
        body: 'A feature is what your product has or is; a benefit is what it does for the customer’s life, time, or wallet:',
        bulletPoints: [
          'Feature: 100% Cotton 300GSM fabric. -> Benefit: Stays crisp all day in humid weather without excessive sweating.',
          'Feature: Cloud-synced daily backup. -> Benefit: Never lose your sales records even if your cashier’s laptop is stolen.',
          'Feature: 90-Minute video walkthrough. -> Benefit: Onboard new staff in one afternoon without taking time away from your desk.',
        ],
      },
      {
        heading: 'The Reusable 8-Part Quotation Format',
        body: 'Standardize all proposals into this structured document layout: 1. Customer Need Summary; 2. Recommended Package; 3. Explicit Inclusions; 4. Explicit Exclusions; 5. Transparent Pricing; 6. Milestone Schedule; 7. Verified Portfolio Proof; 8. Acceptance Instructions.',
      },
    ],
    practicalExercise:
      'Take 3 technical features of your main product and translate each into a vivid, practical benefit that directly addresses a Nigerian business owner’s priority.',
    commonMistakes: [
      'Drowning prospects in technical jargon they do not understand',
      'Failing to disclose exclusions before work commences',
      'Using fabricated reviews or copyright-infringing photos from Pinterest',
    ],
    actionChecklist: [
      'My product descriptions highlight tangible customer benefits.',
      'My proposals clearly state both what is included and what is excluded.',
      'My testimonials and case studies are authentic and verified.',
    ],
    recap:
      'Customers do not buy features; they buy peace of mind, time saved, and status gained. Present your offers in terms of outcomes your buyer deeply desires.',
  },
  {
    number: 9,
    part: 'Part Three: Convert enquiries responsibly',
    title: 'Handling Customer Objections',
    pages: 14,
    scenario:
      'A prospect says: "Ah, your price is too high! Someone in Aba is selling this exact same shoe for ₦12,000, why are you charging ₦22,000?" The seller gets defensive and responds: "Go and buy the fake one then!" The customer leaves with a bitter taste. A master seller responds with calm curiosity, explains the genuine leather grade and sole durability, and wins the customer’s respect.',
    objectives: [
      'Implement the 4-Step Objection Resolution Framework (Listen, Validate, Clarify, Resolve)',
      'Neutralize the "Your price is too high" objection without panic discounting',
      'Build institutional trust when prospects fear online payment scams',
    ],
    sections: [
      {
        heading: 'The 4-Step Objection Framework',
        body: 'An objection is not a rejection; it is an invitation for more information:',
        bulletPoints: [
          '1. Listen: Allow the prospect to finish their thought completely without interruption.',
          '2. Validate: Acknowledge the validity of their concern ("I completely understand why price and quality matter to you").',
          '3. Clarify: Isolate the root concern ("Are you comparing our handmade full-grain leather with imported synthetic shoes?").',
          '4. Resolve: Provide verifiable facts or offer a suitable alternative tier, then give them space to decide.',
        ],
      },
      {
        heading: 'Answering Nigerian Scam Concerns',
        body: 'Due to prevalent online fraud, Nigerian buyers are naturally vigilant. Win trust through transparency: provide registered CAC business details, active business bank accounts, genuine video walk-throughs of stock, customer unboxing clips, and option for physical pickup in major hubs.',
      },
    ],
    practicalExercise:
      'Write down your standard, respectful response to: 1. "Price is too high", 2. "I will get back to you", and 3. "How am I sure you will deliver after I pay?"',
    commonMistakes: [
      'Taking customer price negotiations as personal insults',
      'Slashing prices instantly and proving your initial price was inflated',
      'Falsifying government certifications or company registrations',
    ],
    actionChecklist: [
      'I stay calm and polite when objections arise.',
      'I clarify what the customer is comparing before responding.',
      'I provide verifiable business proof to eliminate scam fears.',
    ],
    recap:
      'Handle objections with dignity, empathy, and truth. When you stand confidently behind your value, discerning customers will gladly pay for quality.',
  },
  {
    number: 10,
    part: 'Part Three: Convert enquiries responsibly',
    title: 'Following Up Without Being Pushy',
    pages: 14,
    scenario:
      'A prospective corporate client asked for a training quote for their sales team on Tuesday. On Wednesday, Thursday, and Friday, the vendor sends: "Good morning sir, any update?", "Sir, did you see my message?", "Sir, please reply." The client blocks the vendor for harassment.',
    objectives: [
      'Establish agreed follow-up permissions at the point of initial quotation',
      'Differentiate between transactional order updates and promotional marketing',
      'Master the Value-Added Follow-Up Method',
    ],
    sections: [
      {
        heading: 'Permission-Based Follow-Up Protocol',
        body: 'Never leave the next touchpoint undefined. When delivering a quotation, always secure agreed timing: "I know you need to discuss this with your directors. When would be a convenient time for me to check back on your decision—would Friday afternoon or Monday morning work better?" Once they give a date, mark it in your calendar.',
      },
      {
        heading: 'The Value-Added Follow-Up Method',
        body: 'Never send a naked "Have you paid?" or "Any update?" Instead, attach fresh value to the follow-up:',
        bulletPoints: [
          'Share a relevant insight: "Hello [Name], while preparing for your project, I put together this 1-page setup checklist that will save your team 2 hours during onboarding."',
          'Confirm reserved capacity: "Hello [Name], checking in as promised. Our workshop schedule for next week closes today at 4:00 PM. Would you like us to hold your slot?"',
        ],
      },
    ],
    practicalExercise:
      'Audit your current follow-up scripts. Strip out guilt, desperation, and generic prompts. Replace them with helpful, value-added check-ins.',
    commonMistakes: [
      'Spamming prospects daily until they block you',
      'Guilt-tripping customers for not responding immediately',
      'Failing to record callback commitments and missing agreed windows',
    ],
    actionChecklist: [
      'I agree on a specific follow-up date before ending quotes.',
      'My follow-up messages provide helpful context or value.',
      'I honor opt-outs immediately and cease unwanted messaging.',
    ],
    recap:
      'Consistent, respectful follow-up accounts for up to 60% of small business revenue. Be persistent in being helpful, never in being annoying.',
  },
  {
    number: 11,
    part: 'Part Three: Convert enquiries responsibly',
    title: 'Closing Sales and Managing Payments',
    pages: 16,
    scenario:
      'A customer says "Send account number". The seller immediately drops a bank account number without confirming product color, size, delivery address, or courier fees. The customer transfers the money, but sends a blurred screenshot. Two days later, an argument erupts because the seller says the transfer never landed in their bank, while the item was already sold to someone else.',
    objectives: [
      'Execute the 5-Point Order Confirmation Protocol before issuing payment details',
      'Protect your business against fake payment receipts and transfer reversal scams',
      'Issue professional digital invoices, receipts, and order tracking summaries',
    ],
    sections: [
      {
        heading: 'The 5-Point Order Confirmation Protocol',
        body: 'Before sending bank account details, always send a structured confirmation summary:',
        bulletPoints: [
          '1. Item & Specifications: Model, color, size, edition, or scope.',
          '2. Subtotal & Dispatch Fee: Item cost + exact courier delivery cost to address.',
          '3. Delivery Address & Recipient Phone: Full street address, landmark, and reachable contact number.',
          '4. Estimated Delivery Window: Day and timeframe of expected arrival.',
          '5. Payment Instruction & Bank Details: Account name, bank, account number, and verification instruction.',
        ],
      },
      {
        heading: 'Payment Security: Independent Verification',
        body: 'Never dispatch goods or release software keys based solely on an SMS alert or a WhatsApp screenshot. Bank screenshots can be forged in 30 seconds using mock payment apps. Always independently log into your corporate banking app or Paystack dashboard to verify cleared funds before marking an order as paid.',
      },
    ],
    practicalExercise:
      'Create a standard Order Confirmation Template for your business. Practice issuing it on your next 3 transactions.',
    commonMistakes: [
      'Sending bank details before confirming delivery address and total charges',
      'Trusting SMS alerts without checking cleared ledger balance',
      'Failing to issue an official receipt after payment is confirmed',
    ],
    actionChecklist: [
      'I confirm all 5 order points before payment.',
      'I independently verify funds in my banking app before dispatching.',
      'I issue an immediate receipt or confirmation code upon verification.',
    ],
    recap:
      'A sale is not finished when the customer says yes; it is finished when cleared funds are confirmed, terms are documented, and fulfillment begins.',
  },
  {
    number: 12,
    part: 'Part Four: Keep trust and improve',
    title: 'Building Customer Trust and Protecting Customer Information',
    pages: 14,
    scenario:
      'An online vendor collects customer home addresses, phone numbers, and full names on WhatsApp. The vendor casually screenshots customer orders—including full phone numbers and home addresses—and posts them as "proof of sales" on their public Instagram story. A customer discovers their private home address published online and threatens legal action.',
    objectives: [
      'Understand the principles and requirements of the Nigeria Data Protection Act 2023',
      'Safeguard customer contact information, delivery addresses, and payment records',
      'Build long-term brand equity through ethical, transparent data stewardship',
    ],
    sections: [
      {
        heading: 'The Nigeria Data Protection Act (NDPA 2023)',
        body: 'The NDPA 2023 establishes binding legal principles for handling personal data in Nigeria. Personal data includes names, phone numbers, email addresses, home addresses, bank account details, and photos. Small businesses must collect only what is strictly necessary, protect stored data from unauthorized leaks, and never publish identifiable customer records without explicit, informed consent.',
      },
      {
        heading: 'Ethical Proof Sharing',
        body: 'Social proof is vital, but privacy is sacred. When posting screenshots of reviews or bank alerts on WhatsApp Status or Instagram Stories: Always redact or blur customer names, phone numbers, bank account numbers, profile pictures, and home addresses.',
      },
    ],
    practicalExercise:
      'Review your phone gallery and public social media accounts. Delete or redact any customer posts displaying unblurred phone numbers, home addresses, or private banking details.',
    commonMistakes: [
      'Publishing customer phone numbers on social media stories without consent',
      'Storing customer records on shared, unsecured family devices',
      'Selling or sharing customer contact lists with third-party promoters',
    ],
    actionChecklist: [
      'I collect only data necessary for fulfillment.',
      'I blur sensitive information on all public screenshots.',
      'My devices and business accounts are secured with strong PINs and 2FA.',
    ],
    recap:
      'Customer trust takes years to build and seconds to lose. Treat your customers’ personal data with the same uncompromising security you demand for your own money.',
  },
  {
    number: 13,
    part: 'Part Four: Keep trust and improve',
    title: 'Handling Complaints and Difficult Customers',
    pages: 16,
    scenario:
      'A customer orders a custom-made suit for a wedding. The tailor delivers it 2 days late and the trousers are 2 inches too short. The furious customer sends a voice note screaming and insulting the tailor. The tailor reacts angrily: "Are you mad? Is it my fault the courier had an accident?" The dispute explodes on Twitter/X, severely damaging the tailor’s brand.',
    objectives: [
      'Implement the De-escalation Sequence for heated customer disputes',
      'Understand statutory consumer protection rights under the FCCPC Act 2018',
      'Turn customer complaints into opportunities for lasting brand loyalty',
    ],
    sections: [
      {
        heading: 'The De-escalation Sequence: Calm, Acknowledge, Investigate, Resolve',
        body: 'When a customer is angry, logic will not work until their emotions are acknowledged:',
        bulletPoints: [
          '1. Calm: Take a deep breath. Never respond in the heat of anger.',
          '2. Acknowledge: Validate their pain without accepting unproven blame: "I hear your frustration and I am very sorry for the stress this timing has caused."',
          '3. Investigate: Gather facts quickly: check order specifications, tracking slips, and photos.',
          '4. Resolve: Propose a fair, concrete solution (immediate alteration, partial refund, free dispatch on replacement).',
        ],
      },
      {
        heading: 'The Federal Competition and Consumer Protection Act (FCCPA 2018)',
        body: 'Under Nigerian law, consumers are entitled to goods of merchantable quality and services delivered with reasonable care. Blank statements like "NO REFUNDS UNDER ANY CIRCUMSTANCES" cannot override statutory consumer rights if a vendor delivers defective, counterfeit, or materially incorrect goods.',
      },
    ],
    practicalExercise:
      'Write down your standard operating procedure for handling a damaged product delivery or delayed service milestone. Define who can authorize refunds or replacements.',
    commonMistakes: [
      'Engaging in public social media shouting matches with dissatisfied clients',
      'Hiding behind rigid "No refund" policies when the business failed on its promise',
      'Deleting negative comments instead of addressing legitimate service breakdowns',
    ],
    actionChecklist: [
      'I acknowledge complaints within 60 minutes during business hours.',
      'I investigate facts objectively before defending my position.',
      'I offer proportionate, fair remedies when my business makes an error.',
    ],
    recap:
      'How you resolve a service failure reveals your true character as an entrepreneur. Fair, calm dispute resolution turns angry critics into your most loyal lifelong advocates.',
  },
  {
    number: 14,
    part: 'Part Four: Keep trust and improve',
    title: 'Measuring Your Sales and Customer Communication Performance',
    pages: 14,
    scenario:
      'A vendor boasts: "Business is booming! We got over 500 WhatsApp messages this week!" But at the end of the month, their bank account is empty, they cannot pay rent, and inventory is unaccounted for. Without tracking conversion metrics, high chat volume is merely vanity.',
    objectives: [
      'Calculate Enquiry-to-Sale Conversion Rate, Average Order Value (AOV), and Repeat Purchase Rate',
      'Construct a simple monthly sales performance dashboard in a basic spreadsheet',
      'Use data-driven insights to refine product pricing, marketing, and follow-up routines',
    ],
    sections: [
      {
        heading: 'The Core Conversion Formulas',
        body: 'Track these 4 vital signs of business health every month:',
        bulletPoints: [
          'Enquiry-to-Sale Conversion Rate = (Completed Orders ÷ Total Qualified Enquiries) × 100',
          'Average Order Value (AOV) = Total Monthly Revenue ÷ Number of Completed Orders',
          'Repeat Customer Rate = (Customers with >1 Purchase in Period ÷ Total Unique Customers) × 100',
          'Quotation-to-Sale Rate = (Accepted Quotations ÷ Total Quotations Issued) × 100',
        ],
      },
      {
        heading: 'The Simple Monthly Performance Dashboard',
        body: 'You do not need complex software. A simple 10-column spreadsheet updated weekly tracks: Month; Inquiries Received; Quotes Sent; Orders Paid; Total Revenue (₦); AOV (₦); Conversion %; Complaints Logged; Top Reason for Lost Sales; Key Improvement for Next Month.',
      },
    ],
    practicalExercise:
      'Calculate your business’s Conversion Rate and Average Order Value for the past 30 days using real records. Identify your single biggest revenue leak.',
    commonMistakes: [
      'Equating chat messages with actual revenue',
      'Failing to track where leads drop off in the conversion pipeline',
      'Changing pricing erratically without measuring conversion data first',
    ],
    actionChecklist: [
      'I record daily enquiry and order counts in a spreadsheet.',
      'I calculate my conversion rate and AOV monthly.',
      'I test one specific process improvement each month based on data.',
    ],
    recap:
      'What gets measured gets managed. Consistent metrics transform vague hopes into a predictable, profitable, and scalable commercial enterprise.',
  },
  {
    number: 15,
    part: 'Part Four: Keep trust and improve',
    title: 'Building Your 30-Day Customer Conversion System',
    pages: 18,
    scenario:
      'A business owner finishes reading about frameworks, response structures, and metrics, but feels overwhelmed by where to start. Trying to change everything on Monday morning leads to confusion and abandonment by Wednesday. Sustainable mastery requires a structured 30-day rollout.',
    objectives: [
      'Execute the step-by-step 30-Day Commercial Implementation Roadmap',
      'Establish a 20-minute daily customer communication routine',
      'Delegate operational roles clearly across sales, fulfillment, and customer support',
    ],
    sections: [
      {
        heading: 'The 30-Day Phased Implementation Calendar',
        body: 'Roll out your customer conversion engine systematically across 4 structured weeks:',
        bulletPoints: [
          'Days 1-3 (Audit & Observe): Log every incoming enquiry without changing anything. Identify top 5 customer questions and points of confusion.',
          'Days 4-7 (Organize Channels): Clean WhatsApp Business profile. Implement the 7 standard pipeline labels. Activate two-step verification.',
          'Days 8-10 (First Response Standard): Deploy standardized professional greetings and pricing breakdown templates.',
          'Days 11-14 (Catalog & Offers): Update product descriptions, transparent delivery schedules, and clear terms of service.',
          'Days 15-18 (Discovery & Qualification): Train on asking open qualifying questions before issuing custom proposals.',
          'Days 19-21 (Follow-up Discipline): Establish permission-based follow-up dates and value-added check-in templates.',
          'Days 22-24 (Payment & Order Protocol): Implement the 5-point order confirmation and independent bank verification protocol.',
          'Days 25-27 (Service Recovery): Define the complaint de-escalation sequence and consumer rights standards.',
          'Days 28-30 (Review & Measure): Calculate your baseline conversion rate and AOV. Lock in the daily routine for the next quarter.',
        ],
      },
      {
        heading: 'The 20-Minute Daily Execution Routine',
        body: 'Morning (10 mins): Review new enquiries, check urgent deliveries, confirm incoming bank transfers. Afternoon (5 mins): Follow up on agreed quote dates using value-added notes. Evening (5 mins): Update pipeline labels, log daily metrics, and file receipts.',
      },
    ],
    practicalExercise:
      'Print or write out your 30-Day Implementation Calendar. Hang it near your workstation and mark off each day as you build your operational habits.',
    commonMistakes: [
      'Attempting to automate everything on day 1 with expensive software',
      'Neglecting daily pipeline label maintenance',
      'Giving up after 3 days when habits feel unfamiliar',
    ],
    actionChecklist: [
      'My 30-day calendar is scheduled with explicit milestone dates.',
      'My 20-minute daily routine is protected in my work schedule.',
      'I celebrate progress in process consistency rather than short-term luck.',
    ],
    recap:
      'Excellence is not an act, but a habit. Build your customer communication system step by step over 30 days, protect customer trust, and enjoy sustainable business growth.',
  },
];

export const ENQUIRY_BOOK_APPENDICES = {
  appendixA: {
    title: 'Appendix A: Message and Sales Templates',
    templates: [
      {
        title: '1. Professional First Response',
        body: 'Hello [Customer Name], thank you for contacting [Business Name]! Yes, [Direct Answer to Question]. The [Product/Service] includes [Key Deliverables/Warranty] and costs [Total Price ₦]. To help me recommend the perfect option for you, may I confirm [One Relevant Detail, e.g., your location / preferred date]? Once I have that, I will immediately confirm availability for you.',
      },
      {
        title: '2. Request for Scope Information',
        body: 'To ensure we quote the exact specifications for your project, could you kindly share [Question 1] and [Question 2]? I am asking so our production team can calculate the accurate turnaround time and material requirements for you.',
      },
      {
        title: '3. Standard Product & Service Presentation',
        body: 'Based on your requirements, I highly recommend our [Option Name]. It includes [Key Features & Scope], is priced at ₦[Amount], and estimated delivery to [Location] is [Timeline]. It does not include [Exclusions]. If this package suits your needs, the next step is to reply "CONFIRM" so we can reserve your stock.',
      },
      {
        title: '4. Respectful Quotation Follow-Up',
        body: 'Hello [Customer Name], I am following up on the quotation sent on [Date] as we agreed. Would you like me to clarify any part of the scope, deliverables, or payment stages? If your project timeline has shifted, that is completely fine—just let me know so we can update our schedule.',
      },
      {
        title: '5. 5-Point Order Confirmation Protocol',
        body: 'To confirm your order, please verify the following details:\n1. Item: [Item Name & Size/Color]\n2. Total Amount: ₦[Subtotal] + ₦[Delivery Fee] = ₦[Grand Total]\n3. Delivery Address: [Full Street Address & Landmark]\n4. Expected Arrival: [Date & Time Window]\n5. Payment: Transfer to [Bank Name], Account: [0123456789], Name: [Business Account Name].\nOnce transferred, reply here and we will immediately verify and issue your official receipt.',
      },
      {
        title: '6. Payment Verified Acknowledgement & Receipt',
        body: 'Payment Verified! We have confirmed cleared receipt of ₦[Amount] on [Date] for Order Reference #[Reference]. Your delivery is scheduled for [Date/Time] via [Courier Name]. Your tracking code / dispatch contact is [Details]. Thank you for choosing [Business Name]!',
      },
      {
        title: '7. Proactive Delay & Logistics Update',
        body: 'Hello [Customer Name], I am reaching out regarding Order Reference #[Reference]. Due to [Accurate Logistics Reason], your package will arrive [Revised Time Window] instead of earlier today. We sincerely apologize for this inconvenience. If you need special delivery instructions for the rider, please let us know immediately.',
      },
      {
        title: '8. Professional Complaint De-escalation',
        body: 'Thank you for bringing this to our attention, [Customer Name]. I am deeply sorry for the frustration this has caused you. I am personally reviewing your order file, photos, and courier notes right now, and I will update you with a fair resolution by [Realistic Time, e.g., 2:00 PM today]. We will make this right.',
      },
      {
        title: '9. Post-Delivery Satisfaction & Review Request',
        body: 'Hello [Customer Name], we hope you are thoroughly enjoying your [Product/Service] delivered yesterday! If you have 60 seconds, we would deeply appreciate an honest review of your experience. Your feedback helps our Nigerian small business improve and helps other customers shop with confidence. Thank you!',
      },
      {
        title: '10. Ethical Marketing Opt-In Request',
        body: 'Would you like to receive our exclusive monthly VIP catalog and seasonal discounts via WhatsApp? We send messages only once or twice a month, never share your number, and you can reply "STOP" at any time to opt out. Reply "YES" if you would like to join!',
      },
    ],
  },
  appendixB: {
    title: 'Appendix B: Worksheets and Trackers',
    content: `1. CUSTOMER JOURNEY MAPPING WORKSHEET
- Awareness: Through what exact channels do customers discover us?
- Interest: What questions arise when they view our catalog or social posts?
- Enquiry: What channel do they use to message us, and what is our median response time?
- Purchase: Are our payment, delivery, and confirmation instructions 100% clear?
- Post-Purchase: How do we verify satisfaction, collect reviews, and encourage repeat orders?

2. IDEAL CUSTOMER PROFILE (ICP) SPECIFICATION
- Primary Problem: What urgent headache does this customer experience?
- Financial Capability: What is their realistic price tolerance?
- Location & Logistics: Are they within our reliable courier delivery radius?
- Decision Factor: Do they prioritize speed, durability, prestige, or lowest price?
- Evidence: What actual past customer transactions prove this profile is viable?

3. DAILY ENQUIRY & SALES TRACKER (Spreadsheet Columns)
- Ref # | Date | Channel | Customer Name | Product Enquired | Budget Tier | Status | Quote Sent (₦) | Follow-Up Date | Outcome | Loss Reason (if confirmed) | Action Notes

4. ORDER & FULFILLMENT REGISTER (Spreadsheet Columns)
- Order # | Date | Customer | Item & Specs | Total (₦) | Payment Verified? | Bank/Provider | Dispatch Rider/Tracking | Delivered Date | Review Received?

5. MONTHLY PERFORMANCE DASHBOARD
- Month | Enquiries Logged | Quotes Sent | Orders Completed | Total Revenue (₦) | Conversion Rate (%) | Average Order Value (₦) | Complaints Logged | Key Takeaway`,
  },
  appendixC: {
    title: 'Appendix C: Glossary & Legal References',
    glossary: [
      { term: 'Average Order Value (AOV)', definition: 'Total revenue divided by the number of completed orders in the same period.' },
      { term: 'Customer Journey', definition: 'The end-to-end series of experiences a buyer has with a brand, from awareness through purchase and repeat business.' },
      { term: 'Enquiry-to-Sale Conversion Rate', definition: 'Number of paid orders divided by qualified enquiries, expressed as a percentage.' },
      { term: 'NDPA 2023', definition: 'The Nigeria Data Protection Act 2023, governing the lawful, secure, and transparent processing of personal data in Nigeria.' },
      { term: 'FCCPA 2018', definition: 'The Federal Competition and Consumer Protection Act 2018, protecting Nigerian consumer rights regarding product quality and fair trade.' },
      { term: 'Opt-in', definition: 'Explicit affirmative consent provided by a customer prior to receiving promotional marketing broadcasts.' },
      { term: 'Qualified Enquiry', definition: 'An inbound lead possessing genuine need, realistic budget, and reachable geographic delivery location.' },
      { term: 'Service Recovery', definition: 'Systematic operational actions taken to resolve a customer complaint and restore trust.' },
      { term: 'Tombstone Record', definition: 'A persistent marker used in data systems to ensure deleted or archived records are never erroneously reloaded.' },
      { term: 'Value-Added Follow-Up', definition: 'Re-engaging a prospective buyer by providing useful context, tips, or timeline clarification rather than a naked demand for payment.' },
    ],
    references: [
      'Federal Competition and Consumer Protection Commission (FCCPC). Consumer Rights and Responsibilities. https://fccpc.gov.ng/',
      'Federal Republic of Nigeria. Nigeria Data Protection Act 2023. Nigeria Data Protection Commission (NDPC). https://ndpc.gov.ng/',
      'Meta. WhatsApp Business Messaging Policy & App Guidelines. https://whatsappbusiness.com/policy/',
      'PwC Nigeria. MSME Survey 2024: Navigating Inflation, Currency Volatility, and Digital Operations. https://www.pwc.com/ng/',
      'Small and Medium Enterprises Development Agency of Nigeria (SMEDAN) and GIZ. Blueprint for the Digital Transformation of MSMEs in Nigeria.',
      'Federal Republic of Nigeria. Copyright Act 2022. Nigerian Copyright Commission. https://copyright.gov.ng/',
      'Madueke, C. C. and Eyupoglu, S. (2024). Sustaining Economic Growth: E-Service Quality Role in Fostering Customer Loyalty in Nigeria SMEs. Sustainability, 16(21), 9175.',
    ],
    aboutAuthor:
      'S. B. Omotoso, FCIA, is Managing Consultant of Tintol Business Services (TBS), an educational and management consultancy operating under the Scholar Suite brand from Ibadan and Abeokuta, Nigeria.\n\nA distinguished lecturer in AI literacy, management administration, and web application development, the author is an active practitioner and trainer in the Nigerian digital entrepreneurship ecosystem. TBS delivers institutional digital library deployments, document production services, and executive training programmes to universities, professional bodies, and enterprise organizations across Nigeria.',
  },
};
