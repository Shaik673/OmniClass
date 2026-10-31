import os

def generate_svgs():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "diagrams"))
    os.makedirs(output_dir, exist_ok=True)

    # 1. Full-Stack Flow SVG
    svg_flow = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 250" width="750" height="250">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
    </marker>
    <marker id="arrow-slate" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="750" height="250" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Client Box -->
  <g filter="url(#shadow)">
    <rect x="20" y="25" width="200" height="200" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 20 33 Q 20 25 28 25 L 212 25 Q 220 25 220 33 L 220 60 L 20 60 Z" fill="#2563eb"/>
    <text x="120" y="46" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="12" font-weight="700" text-anchor="middle">CLIENT PRESENTATION</text>
    <text x="120" y="78" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="11" font-weight="700" text-anchor="middle">React 18 + Vite SPA</text>
    <line x1="35" y1="88" x2="205" y2="88" stroke="#e2e8f0" stroke-width="1"/>
    <text x="35" y="108" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Tailwind CSS + Framer Motion</text>
    <text x="35" y="128" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Eye-Friendly Creamy Theme</text>
    <text x="35" y="148" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Live AI Typewriter Stream</text>
    <text x="35" y="168" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Voice Speech Audio Player</text>
    <text x="35" y="188" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Recharts Visual Analytics</text>
    <text x="35" y="208" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Responsive Mobile Drawer</text>
  </g>

  <!-- Arrow Client -> Server -->
  <path d="M 220 125 L 265 125" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <rect x="222" y="98" width="46" height="18" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
  <text x="245" y="110" fill="#1d4ed8" font-family="Segoe UI, sans-serif" font-size="8" font-weight="700" text-anchor="middle">HTTPS</text>

  <!-- Server Box -->
  <g filter="url(#shadow)">
    <rect x="270" y="25" width="220" height="200" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 270 33 Q 270 25 278 25 L 482 25 Q 490 25 490 33 L 490 60 L 270 60 Z" fill="#0f172a"/>
    <text x="380" y="46" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="12" font-weight="700" text-anchor="middle">API GATEWAY &amp; APP SERVER</text>
    <text x="380" y="78" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Express.js + Node.js 22 LTS</text>
    <line x1="285" y1="88" x2="475" y2="88" stroke="#e2e8f0" stroke-width="1"/>
    <text x="285" y="108" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; JWT HttpOnly Cookie Session</text>
    <text x="285" y="128" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Bcrypt Password Hash (Cost 12)</text>
    <text x="285" y="148" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Strict RBAC Middleware</text>
    <text x="285" y="168" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Rate Limiting &amp; Helmet Headers</text>
    <text x="285" y="188" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Request ID Tracing &amp; Logger</text>
    <text x="285" y="208" fill="#475569" font-family="Segoe UI, sans-serif" font-size="9.5">&bull; Modular MVC Routers</text>
  </g>

  <!-- Arrows Server -> Data Services -->
  <path d="M 490 85 L 535 55" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-slate)"/>
  <path d="M 490 125 L 535 125" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-slate)"/>
  <path d="M 490 165 L 535 195" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-slate)"/>

  <!-- Right Service 1: MongoDB -->
  <g filter="url(#shadow)">
    <rect x="540" y="25" width="190" height="60" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 540 33 Q 540 25 548 25 L 722 25 Q 730 25 730 33 L 730 48 L 540 48 Z" fill="#059669"/>
    <text x="635" y="40" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">PRIMARY PERSISTENCE</text>
    <text x="635" y="64" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">MongoDB Atlas Cluster</text>
    <text x="635" y="78" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8.5" text-anchor="middle">Mongoose ODM &bull; Atomic Transactions</text>
  </g>

  <!-- Right Service 2: Redis Cloud -->
  <g filter="url(#shadow)">
    <rect x="540" y="95" width="190" height="60" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 540 103 Q 540 95 548 95 L 722 95 Q 730 95 730 103 L 730 118 L 540 118 Z" fill="#dc2626"/>
    <text x="635" y="110" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">CACHE &amp; QUEUES</text>
    <text x="635" y="134" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Redis Cloud (TLS)</text>
    <text x="635" y="148" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8.5" text-anchor="middle">BullMQ Jobs &bull; Token Rate Limiter</text>
  </g>

  <!-- Right Service 3: Gemini 2.0 Flash -->
  <g filter="url(#shadow)">
    <rect x="540" y="165" width="190" height="60" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 540 173 Q 540 165 548 165 L 722 165 Q 730 165 730 173 L 730 188 L 540 188 Z" fill="#7c3aed"/>
    <text x="635" y="180" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">APPLIED AI ORCHESTRATION</text>
    <text x="635" y="204" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700" text-anchor="middle">Google Gemini 2.0 Flash</text>
    <text x="635" y="218" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8.5" text-anchor="middle">Omni Tutor &bull; Summarizer &bull; AI Quiz</text>
  </g>
</svg>'''

    with open(os.path.join(output_dir, "fullstack_flow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_flow)

    # 2. Functional Modules Ecosystem SVG
    svg_modules = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 320" width="750" height="320">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="750" height="320" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Tier 1: Access & Governance -->
  <rect x="15" y="15" width="720" height="85" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="url(#shadow)"/>
  <rect x="25" y="25" width="220" height="65" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
  <text x="35" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">MODULE 1: User Authentication</text>
  <text x="35" y="60" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Bcrypt Cost 12 &bull; JWT Cookies &bull; OAuth2</text>
  <text x="35" y="75" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Role-based access &bull; Session invalidation</text>

  <rect x="265" y="25" width="220" height="65" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
  <text x="275" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">MODULE 2: Student Dashboard</text>
  <text x="275" y="60" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Recharts Analytics &bull; Enrolled Courses</text>
  <text x="275" y="75" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Weekly study velocity &bull; Quick resume</text>

  <rect x="505" y="25" width="220" height="65" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <text x="515" y="44" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">MODULE 10: Admin Governance</text>
  <text x="515" y="60" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Institutional KPIs &bull; Course Approvals</text>
  <text x="515" y="75" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">User directory &bull; Branding controls</text>

  <!-- Tier 2: Academic Curriculum -->
  <rect x="15" y="112" width="720" height="85" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="url(#shadow)"/>
  <rect x="25" y="122" width="165" height="65" rx="6" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1"/>
  <text x="35" y="141" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">MODULE 3: Course Lifecycle</text>
  <text x="35" y="157" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.2">Catalog CRUD &bull; Pro Pricing</text>
  <text x="35" y="172" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.8">Approval queue workflow</text>

  <rect x="202" y="122" width="165" height="65" rx="6" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1"/>
  <text x="212" y="141" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">MODULE 4: Enrollment</text>
  <text x="212" y="157" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.2">Free &amp; Razorpay Checkout</text>
  <text x="212" y="172" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.8">Progress tracking &bull; Orders</text>

  <rect x="380" y="122" width="165" height="65" rx="6" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1"/>
  <text x="390" y="141" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">MODULE 5: 5 Modules</text>
  <text x="390" y="157" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.2">Hierarchical Curriculum</text>
  <text x="390" y="172" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.8">Sequential module unlocking</text>

  <rect x="558" y="122" width="165" height="65" rx="6" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1"/>
  <text x="568" y="141" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">MODULE 6: Learning Materials</text>
  <text x="568" y="157" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.2">Rich Markdown &bull; Code Cards</text>
  <text x="568" y="172" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.8">PDF links &amp; references</text>

  <!-- Tier 3: Evaluation & Credentials -->
  <rect x="15" y="210" width="720" height="95" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="url(#shadow)"/>
  <rect x="25" y="222" width="220" height="70" rx="6" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
  <text x="35" y="242" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">MODULE 7: Assignments</text>
  <text x="35" y="260" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Course assignments with deadlines</text>
  <text x="35" y="275" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Rubric points &amp; grading criteria</text>

  <rect x="265" y="222" width="220" height="70" rx="6" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
  <text x="275" y="242" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">MODULE 8: Submissions</text>
  <text x="275" y="260" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">GitHub repos, URLs &amp; commentary</text>
  <text x="275" y="275" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Instructor scoring &amp; formative feedback</text>

  <rect x="505" y="222" width="220" height="70" rx="6" fill="#fefce8" stroke="#fef08a" stroke-width="1"/>
  <text x="515" y="242" fill="#854d0e" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">MODULE 9: Progress &amp; Certification</text>
  <text x="515" y="260" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">30-MCQ Exam (&ge;70% pass criteria)</text>
  <text x="515" y="275" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Verifiable A4 Certificate &bull; QR Code</text>
</svg>'''

    with open(os.path.join(output_dir, "functional_modules.svg"), "w", encoding="utf-8") as f:
        f.write(svg_modules)

    # 3. Student Workflow SVG
    svg_student = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 230" width="750" height="230">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
    </marker>
  </defs>
  <rect width="750" height="230" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Row 1: Steps 1 to 5 -->
  <!-- Step 1 -->
  <g filter="url(#shadow)">
    <rect x="15" y="20" width="125" height="80" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1"/>
    <circle cx="35" cy="40" r="12" fill="#2563eb"/>
    <text x="35" y="44" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">1</text>
    <text x="52" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">Auth / Login</text>
    <text x="25" y="65" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Email/Pwd or OAuth</text>
    <text x="25" y="80" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">JWT Cookie Session</text>
  </g>
  <path d="M 140 60 L 155 60" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 2 -->
  <g filter="url(#shadow)">
    <rect x="160" y="20" width="125" height="80" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1"/>
    <circle cx="180" cy="40" r="12" fill="#2563eb"/>
    <text x="180" y="44" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">2</text>
    <text x="197" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">Course Catalog</text>
    <text x="170" y="65" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Search &amp; Filters</text>
    <text x="170" y="80" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Syllabi &amp; Instructor</text>
  </g>
  <path d="M 285 60 L 300 60" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 3 -->
  <g filter="url(#shadow)">
    <rect x="305" y="20" width="125" height="80" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1"/>
    <circle cx="325" cy="40" r="12" fill="#2563eb"/>
    <text x="325" y="44" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">3</text>
    <text x="342" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">Enrollment</text>
    <text x="315" y="65" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Free Tier Instant</text>
    <text x="315" y="80" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Pro Tier Razorpay</text>
  </g>
  <path d="M 430 60 L 445 60" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 4 -->
  <g filter="url(#shadow)">
    <rect x="450" y="20" width="135" height="80" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1"/>
    <circle cx="470" cy="40" r="12" fill="#2563eb"/>
    <text x="470" y="44" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">4</text>
    <text x="487" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">Read 5 Modules</text>
    <text x="460" y="65" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Markdown &amp; Code</text>
    <text x="460" y="80" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Sequential Progress</text>
  </g>
  <path d="M 585 60 L 600 60" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 5 -->
  <g filter="url(#shadow)">
    <rect x="605" y="20" width="130" height="80" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1"/>
    <circle cx="625" cy="40" r="12" fill="#7c3aed"/>
    <text x="625" y="44" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">5</text>
    <text x="642" y="44" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">AI Study Room</text>
    <text x="615" y="65" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Omni Tutor Streaming</text>
    <text x="615" y="80" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Voice Q&amp;A &bull; Summary</text>
  </g>

  <!-- Curve Down Arrow from Step 5 to Step 6 -->
  <path d="M 670 100 L 670 115 Q 670 125 660 125 L 610 125" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Row 2: Steps 6 to 9 (Right to Left or Left to Right) -->
  <!-- Step 6 -->
  <g filter="url(#shadow)">
    <rect x="475" y="130" width="130" height="80" rx="6" fill="#ffffff" stroke="#bbf7d0" stroke-width="1"/>
    <circle cx="495" cy="150" r="12" fill="#059669"/>
    <text x="495" y="154" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">6</text>
    <text x="512" y="154" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">Submit Project</text>
    <text x="485" y="175" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">GitHub Repo &amp; Demo</text>
    <text x="485" y="190" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Detailed Commentary</text>
  </g>
  <path d="M 475 170 L 455 170" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 7 -->
  <g filter="url(#shadow)">
    <rect x="320" y="130" width="130" height="80" rx="6" fill="#ffffff" stroke="#bbf7d0" stroke-width="1"/>
    <circle cx="340" cy="150" r="12" fill="#059669"/>
    <text x="340" y="154" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">7</text>
    <text x="357" y="154" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">Faculty Review</text>
    <text x="330" y="175" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Rubric-based scoring</text>
    <text x="330" y="190" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Constructive feedback</text>
  </g>
  <path d="M 320 170 L 300 170" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 8 -->
  <g filter="url(#shadow)">
    <rect x="165" y="130" width="130" height="80" rx="6" fill="#ffffff" stroke="#fde047" stroke-width="1"/>
    <circle cx="185" cy="150" r="12" fill="#d97706"/>
    <text x="185" y="154" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">8</text>
    <text x="202" y="154" fill="#b45309" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">30-MCQ Exam</text>
    <text x="175" y="175" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Proctored assessment</text>
    <text x="175" y="190" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Pass Threshold &ge; 70%</text>
  </g>
  <path d="M 165 170 L 150 170" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 9 -->
  <g filter="url(#shadow)">
    <rect x="15" y="130" width="130" height="80" rx="6" fill="#ffffff" stroke="#fde047" stroke-width="1.5"/>
    <circle cx="35" cy="150" r="12" fill="#d97706"/>
    <text x="35" y="154" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">9</text>
    <text x="52" y="154" fill="#b45309" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">A4 Certificate</text>
    <text x="25" y="175" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Tamper-proof QR code</text>
    <text x="25" y="190" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">1-Click LinkedIn Share</text>
  </g>
</svg>'''

    with open(os.path.join(output_dir, "student_workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_student)

    # 4. Instructor Workflow SVG
    svg_instructor = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 210" width="750" height="210">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
    </marker>
  </defs>
  <rect width="750" height="210" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Step 1 -->
  <g filter="url(#shadow)">
    <rect x="20" y="20" width="125" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="30" y="40" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">1. Faculty Auth</text>
    <text x="30" y="58" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Provisioned Account</text>
    <text x="30" y="73" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Role: 'instructor'</text>
  </g>
  <path d="M 145 57 L 165 57" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Step 2 -->
  <g filter="url(#shadow)">
    <rect x="170" y="20" width="125" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="180" y="40" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">2. Course Studio</text>
    <text x="180" y="58" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Title, Slug, Category</text>
    <text x="180" y="73" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Tier &amp; Pro Pricing</text>
  </g>
  <path d="M 295 57 L 315 57" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Step 3 -->
  <g filter="url(#shadow)">
    <rect x="320" y="20" width="125" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="330" y="40" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">3. Author Modules</text>
    <text x="330" y="58" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">5 Structured Modules</text>
    <text x="330" y="73" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Markdown &amp; Code</text>
  </g>
  <path d="M 445 57 L 465 57" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Step 4 -->
  <g filter="url(#shadow)">
    <rect x="470" y="20" width="125" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="480" y="40" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">4. Assignments</text>
    <text x="480" y="58" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Deadlines &amp; Rubrics</text>
    <text x="480" y="73" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Max points criteria</text>
  </g>
  <path d="M 595 57 L 615 57" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Step 5 -->
  <g filter="url(#shadow)">
    <rect x="620" y="20" width="115" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="630" y="40" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">5. Submit Audit</text>
    <text x="630" y="58" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Draft Status</text>
    <text x="630" y="73" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Pending review</text>
  </g>

  <!-- Curve Down Arrow from Step 5 to Step 6 -->
  <path d="M 677 95 L 677 110 Q 677 120 665 120 L 590 120" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Row 2: Steps 6 to 9 -->
  <!-- Step 6 -->
  <g filter="url(#shadow)">
    <rect x="430" y="115" width="150" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="440" y="135" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">6. Admin Review</text>
    <text x="440" y="153" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Quality verification</text>
    <text x="440" y="168" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Status &rarr; 'published'</text>
  </g>
  <path d="M 430 152 L 405 152" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Step 7 -->
  <g filter="url(#shadow)">
    <rect x="250" y="115" width="150" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="260" y="135" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">7. Grade Queue</text>
    <text x="260" y="153" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Review GitHub PRs</text>
    <text x="260" y="168" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Scoring &amp; comments</text>
  </g>
  <path d="M 250 152 L 225 152" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>

  <!-- Step 8 -->
  <g filter="url(#shadow)">
    <rect x="70" y="115" width="150" height="75" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <text x="80" y="135" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="10.5" font-weight="700">8. Cohort Analytics</text>
    <text x="80" y="153" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">Completion rate &amp; scores</text>
    <text x="80" y="168" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8">Intervention alerts</text>
  </g>
</svg>'''

    with open(os.path.join(output_dir, "instructor_workflow.svg"), "w", encoding="utf-8") as f:
        f.write(svg_instructor)

    # 5. Tech Stack SVG
    svg_tech = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 250" width="750" height="250">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="750" height="250" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Col 1: Frontend -->
  <g filter="url(#shadow)">
    <rect x="20" y="20" width="165" height="210" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 20 28 Q 20 20 28 20 L 177 20 Q 185 20 185 28 L 185 52 L 20 52 Z" fill="#2563eb"/>
    <text x="102" y="38" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="11" font-weight="700" text-anchor="middle">FRONTEND LAYER</text>
    <text x="32" y="76" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">&bull; React 18.2 SPA</text>
    <text x="32" y="96" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Vite 5.0 Bundler</text>
    <text x="32" y="116" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Tailwind CSS 3.4</text>
    <text x="32" y="136" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Framer Motion</text>
    <text x="32" y="156" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Lucide React Icons</text>
    <text x="32" y="176" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Recharts Data Charts</text>
    <text x="32" y="196" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Web Speech Synthesis</text>
    <text x="32" y="216" fill="#1d4ed8" font-family="Segoe UI, sans-serif" font-size="8" font-weight="600">Client-Side Rendering</text>
  </g>

  <!-- Col 2: Backend -->
  <g filter="url(#shadow)">
    <rect x="200" y="20" width="165" height="210" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 200 28 Q 200 20 208 20 L 357 20 Q 365 20 365 28 L 365 52 L 200 52 Z" fill="#0f172a"/>
    <text x="282" y="38" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="11" font-weight="700" text-anchor="middle">BACKEND LAYER</text>
    <text x="212" y="76" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">&bull; Node.js 22 LTS</text>
    <text x="212" y="96" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Express.js 4.18</text>
    <text x="212" y="116" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; JWT HttpOnly Session</text>
    <text x="212" y="136" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Bcrypt Password Hash</text>
    <text x="212" y="156" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Express Validator</text>
    <text x="212" y="176" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Helmet &amp; Rate Limiter</text>
    <text x="212" y="196" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Morgan Request Trace</text>
    <text x="212" y="216" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="8" font-weight="600">Modular REST API</text>
  </g>

  <!-- Col 3: Data & Storage -->
  <g filter="url(#shadow)">
    <rect x="380" y="20" width="165" height="210" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 380 28 Q 380 20 388 20 L 537 20 Q 545 20 545 28 L 545 52 L 380 52 Z" fill="#059669"/>
    <text x="462" y="38" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="11" font-weight="700" text-anchor="middle">DATA &amp; CACHE</text>
    <text x="392" y="76" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">&bull; MongoDB Atlas (M0)</text>
    <text x="392" y="96" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Mongoose 8.0 ODM</text>
    <text x="392" y="116" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Compound Indexes</text>
    <text x="392" y="136" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Redis Cloud (TLS)</text>
    <text x="392" y="156" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; BullMQ Task Queues</text>
    <text x="392" y="176" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Atomic Transactions</text>
    <text x="392" y="196" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Zero Mock Fallback</text>
    <text x="392" y="216" fill="#059669" font-family="Segoe UI, sans-serif" font-size="8" font-weight="600">Persistent NoSQL</text>
  </g>

  <!-- Col 4: AI & Cloud -->
  <g filter="url(#shadow)">
    <rect x="560" y="20" width="170" height="210" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M 560 28 Q 560 20 568 20 L 722 20 Q 730 20 730 28 L 730 52 L 560 52 Z" fill="#7c3aed"/>
    <text x="645" y="38" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="11" font-weight="700" text-anchor="middle">AI &amp; CLOUD INFRA</text>
    <text x="572" y="76" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">&bull; Gemini 2.0 Flash</text>
    <text x="572" y="96" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Multi-Model Fallbacks</text>
    <text x="572" y="116" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Vercel Edge CDN</text>
    <text x="572" y="136" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Render Web Service</text>
    <text x="572" y="156" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Razorpay Payments</text>
    <text x="572" y="176" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; Brevo SMTP Mail</text>
    <text x="572" y="196" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8.5">&bull; LeetCode GraphQL</text>
    <text x="572" y="216" fill="#7c3aed" font-family="Segoe UI, sans-serif" font-size="8" font-weight="600">Enterprise Cloud</text>
  </g>
</svg>'''

    with open(os.path.join(output_dir, "tech_stack.svg"), "w", encoding="utf-8") as f:
        f.write(svg_tech)

    # 6. System Architecture (Fixing Section 12 Syntax Error)
    svg_arch = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 350" width="750" height="350">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
    <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 0 L 5 10 L 9 0 z" fill="#2563eb" />
    </marker>
    <marker id="arrow-down-slate" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 0 L 5 10 L 9 0 z" fill="#64748b" />
    </marker>
  </defs>
  <rect width="750" height="350" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Tier 1: Client Devices -->
  <g filter="url(#shadow)">
    <rect x="25" y="15" width="700" height="50" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1.2"/>
    <rect x="35" y="23" width="130" height="34" rx="4" fill="#eff6ff" stroke="#93c5fd" stroke-width="1"/>
    <text x="100" y="44" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">TIER 1: CLIENT ACCESS</text>
    <text x="190" y="44" fill="#1e293b" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="600">Learner &amp; Faculty Devices &bull; Desktop (1440px), Tablet (768px), Mobile (375px) &bull; React 18 SPA</text>
  </g>

  <!-- Flow 1 -> 2 -->
  <path d="M 375 65 L 375 80" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-down)"/>
  <text x="450" y="76" fill="#2563eb" font-family="Segoe UI, sans-serif" font-size="8" font-weight="700">HTTPS / TLS 1.3 Encryption</text>

  <!-- Tier 2: Edge CDN -->
  <g filter="url(#shadow)">
    <rect x="25" y="85" width="700" height="55" rx="6" fill="#ffffff" stroke="#bfdbfe" stroke-width="1.2"/>
    <rect x="35" y="93" width="165" height="38" rx="4" fill="#eff6ff" stroke="#93c5fd" stroke-width="1"/>
    <text x="117" y="117" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">TIER 2: EDGE CDN (VERCEL)</text>
    <text x="220" y="110" fill="#334155" font-family="Segoe UI, sans-serif" font-size="9">&bull; Global Anycast Edge Network &bull; Automatic Brotli/Gzip Compression &bull; Static Asset Caching</text>
    <text x="220" y="125" fill="#334155" font-family="Segoe UI, sans-serif" font-size="9">&bull; SPA Deep-Link Rewrites (/index.html) &bull; DDoS Protection &bull; Zero Cold Start Overhead</text>
  </g>

  <!-- Flow 2 -> 3 -->
  <path d="M 375 140 L 375 155" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow-down)"/>
  <text x="450" y="151" fill="#2563eb" font-family="Segoe UI, sans-serif" font-size="8" font-weight="700">REST API / Secure Cookie Headers</text>

  <!-- Tier 3: App Server & API Gateway -->
  <g filter="url(#shadow)">
    <rect x="25" y="160" width="700" height="85" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <rect x="35" y="168" width="180" height="68" rx="4" fill="#0f172a"/>
    <text x="125" y="196" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">TIER 3: API GATEWAY</text>
    <text x="125" y="214" fill="#93c5fd" font-family="Segoe UI, sans-serif" font-size="9" text-anchor="middle">Render Web Service (Node 22)</text>

    <!-- App Server Components -->
    <rect x="230" y="170" width="115" height="65" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="287" y="190" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700" text-anchor="middle">Reverse Proxy</text>
    <text x="287" y="206" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">CORS Whitelist</text>
    <text x="287" y="220" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">Helmet Sec Headers</text>

    <rect x="355" y="170" width="115" height="65" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="412" y="190" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700" text-anchor="middle">Auth Middleware</text>
    <text x="412" y="206" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">JWT Verification</text>
    <text x="412" y="220" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">RBAC Role Guard</text>

    <rect x="480" y="170" width="115" height="65" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="537" y="190" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700" text-anchor="middle">Express Routers</text>
    <text x="537" y="206" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">/auth &bull; /courses</text>
    <text x="537" y="220" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">/certificates &bull; /ai</text>

    <rect x="605" y="170" width="110" height="65" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="660" y="190" fill="#0f172a" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700" text-anchor="middle">AI Orchestrator</text>
    <text x="660" y="206" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">Streaming Engine</text>
    <text x="660" y="220" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">Multi-Model Failover</text>
  </g>

  <!-- Flow 3 -> 4 -->
  <path d="M 375 245 L 375 260" stroke="#64748b" stroke-width="2" marker-end="url(#arrow-down-slate)"/>
  <text x="450" y="255" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="8" font-weight="700">Internal Wire Protocols &bull; SSL/TLS</text>

  <!-- Tier 4: Managed Cloud Services -->
  <g filter="url(#shadow)">
    <rect x="25" y="265" width="700" height="70" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>

    <rect x="35" y="273" width="160" height="54" rx="4" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1"/>
    <text x="115" y="293" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">MongoDB Atlas</text>
    <text x="115" y="307" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8" text-anchor="middle">Document Database &bull; M0 Cluster</text>
    <text x="115" y="319" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">Compound Indexing &bull; Transactions</text>

    <rect x="205" y="273" width="160" height="54" rx="4" fill="#fef2f2" stroke="#fecaca" stroke-width="1"/>
    <text x="285" y="293" fill="#b91c1c" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">Redis Cloud</text>
    <text x="285" y="307" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8" text-anchor="middle">In-Memory Cache (TLS)</text>
    <text x="285" y="319" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">BullMQ Queues &bull; Session Store</text>

    <rect x="375" y="273" width="170" height="54" rx="4" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1"/>
    <text x="460" y="293" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">Google Gemini API</text>
    <text x="460" y="307" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8" text-anchor="middle">Gemini 2.0 Flash LLM</text>
    <text x="460" y="319" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">1500 Requests/Day &bull; Zero Cost</text>

    <rect x="555" y="273" width="160" height="54" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
    <text x="635" y="293" fill="#1d4ed8" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">Brevo &amp; Razorpay</text>
    <text x="635" y="307" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8" text-anchor="middle">Transactional SMTP Mailer</text>
    <text x="635" y="319" fill="#64748b" font-family="Segoe UI, sans-serif" font-size="7.5" text-anchor="middle">Payment Signature Verification</text>
  </g>
</svg>'''

    with open(os.path.join(output_dir, "system_architecture.svg"), "w", encoding="utf-8") as f:
        f.write(svg_arch)

    # 7. Development Roadmap (Fixing Section 16 Truncated Gantt)
    svg_roadmap = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 310" width="750" height="310">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="750" height="310" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Header Timeline Days -->
  <rect x="20" y="15" width="710" height="35" rx="6" fill="#0f172a"/>
  <text x="110" y="37" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">PHASE 1: SETUP</text>
  <text x="325" y="37" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">PHASE 2: CORE ENGINEERING</text>
  <text x="535" y="37" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">PHASE 3: AI &amp; CREDENTIALS</text>
  <text x="670" y="37" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">PHASE 4: PROD</text>

  <!-- Track 1: Setup (Days 1-2) -->
  <g filter="url(#shadow)">
    <rect x="20" y="60" width="180" height="52" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.2"/>
    <text x="30" y="80" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">Day 1: Spec &amp; Schema</text>
    <text x="30" y="98" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">ER models, personas, stack design</text>
    <circle cx="185" cy="78" r="8" fill="#16a34a"/>
    <text x="185" y="81" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7.5" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="20" y="120" width="180" height="52" rx="6" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.2"/>
    <text x="30" y="140" fill="#1e3a8a" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">Day 2: Design System</text>
    <text x="30" y="158" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">Creamy theme, responsive layout</text>
    <circle cx="185" cy="138" r="8" fill="#16a34a"/>
    <text x="185" y="141" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7.5" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <!-- Track 2: Core Engineering (Days 3-7) -->
  <g filter="url(#shadow)">
    <rect x="210" y="60" width="230" height="42" rx="5" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.2"/>
    <text x="220" y="78" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700">Day 3: Express API &amp; MongoDB Atlas</text>
    <text x="220" y="93" fill="#475569" font-family="Segoe UI, sans-serif" font-size="7.8">Server architecture, DB connections, Mongoose models</text>
    <circle cx="425" cy="74" r="7" fill="#16a34a"/>
    <text x="425" y="77" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="210" y="108" width="230" height="42" rx="5" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.2"/>
    <text x="220" y="126" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700">Day 4: Authentication &amp; RBAC</text>
    <text x="220" y="141" fill="#475569" font-family="Segoe UI, sans-serif" font-size="7.8">JWT cookies, bcrypt 12 salt rounds, OAuth social login</text>
    <circle cx="425" cy="122" r="7" fill="#16a34a"/>
    <text x="425" y="125" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="210" y="156" width="230" height="42" rx="5" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.2"/>
    <text x="220" y="174" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700">Day 5: Course Management &amp; Modules</text>
    <text x="220" y="189" fill="#475569" font-family="Segoe UI, sans-serif" font-size="7.8">5 modules per course, markdown reader, code cards</text>
    <circle cx="425" cy="170" r="7" fill="#16a34a"/>
    <text x="425" y="173" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="210" y="204" width="230" height="42" rx="5" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.2"/>
    <text x="220" y="222" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700">Day 6: Enrollment &amp; Course Player</text>
    <text x="220" y="237" fill="#475569" font-family="Segoe UI, sans-serif" font-size="7.8">Progress tracking, Pro checkout (Razorpay), My Courses</text>
    <circle cx="425" cy="218" r="7" fill="#16a34a"/>
    <text x="425" y="221" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="210" y="252" width="230" height="42" rx="5" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.2"/>
    <text x="220" y="270" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700">Day 7: Assignment &amp; Grading Engine</text>
    <text x="220" y="285" fill="#475569" font-family="Segoe UI, sans-serif" font-size="7.8">Submission portal (repos/URLs), faculty rubric scoring</text>
    <circle cx="425" cy="266" r="7" fill="#16a34a"/>
    <text x="425" y="269" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <!-- Track 3: AI & Credentials (Days 8-9) -->
  <g filter="url(#shadow)">
    <rect x="450" y="60" width="170" height="85" rx="6" fill="#f5f3ff" stroke="#ddd6fe" stroke-width="1.2"/>
    <text x="460" y="80" fill="#6d28d9" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">Day 8: Omni Tutor &amp; AI</text>
    <text x="460" y="98" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Gemini 2.0 Flash streaming</text>
    <text x="460" y="113" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Natural voice speech</text>
    <text x="460" y="128" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; 3-Mode content summarizer</text>
    <circle cx="605" cy="78" r="8" fill="#16a34a"/>
    <text x="605" y="81" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7.5" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="450" y="155" width="170" height="90" rx="6" fill="#fefce8" stroke="#fef08a" stroke-width="1.2"/>
    <text x="460" y="175" fill="#854d0e" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">Day 9: Exams &amp; Certificates</text>
    <text x="460" y="193" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; 30-MCQ final proctored exam</text>
    <text x="460" y="208" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Strict &ge;70% passing criteria</text>
    <text x="460" y="223" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; A4 landscape certificate modal</text>
    <text x="460" y="238" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Live QR code verification</text>
    <circle cx="605" cy="173" r="8" fill="#16a34a"/>
    <text x="605" y="176" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="7.5" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>

  <!-- Track 4: Production (Day 10) -->
  <g filter="url(#shadow)">
    <rect x="630" y="60" width="100" height="185" rx="6" fill="#fff7ed" stroke="#fed7aa" stroke-width="1.2"/>
    <text x="640" y="82" fill="#c2410c" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">Day 10: Launch</text>
    <text x="640" y="102" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; E2E Testing</text>
    <text x="640" y="117" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Vercel Config</text>
    <text x="640" y="132" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Render Deploy</text>
    <text x="640" y="147" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; Git Push</text>
    <text x="640" y="162" fill="#475569" font-family="Segoe UI, sans-serif" font-size="8">&bull; 0 Errors Build</text>
    <text x="640" y="180" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="9" font-weight="700">VERIFIED</text>
    <text x="640" y="195" fill="#15803d" font-family="Segoe UI, sans-serif" font-size="8">Production Ready</text>
    <circle cx="680" cy="220" r="10" fill="#16a34a"/>
    <text x="680" y="224" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">&#10003;</text>
  </g>
</svg>'''

    with open(os.path.join(output_dir, "development_roadmap.svg"), "w", encoding="utf-8") as f:
        f.write(svg_roadmap)

    print("Successfully generated all 7 vector SVG visual pictures in assets/diagrams/")

if __name__ == "__main__":
    generate_svgs()

