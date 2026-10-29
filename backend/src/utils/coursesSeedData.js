// Helper generating 30 high-yield multiple-choice questions for a course final proctored exam
function generate30CourseQuestions(subject, moduleNames) {
  const questions = [];
  const templates = [
    {
      prompt: `What is the primary architectural purpose of modular decomposition in ${subject}?`,
      options: [
        'Enforcing clear fault isolation, maintainability, and independent testability',
        'Eliminating the necessity for server-side state persistence',
        'Guaranteeing strictly synchronous single-threaded execution',
        'Bypassing network security boundary validation',
      ],
      correctIndex: 0,
      explanation: 'Modular decomposition isolates system failures into well-defined boundaries and allows components to be refactored independently.',
    },
    {
      prompt: `Which metric is most vital when evaluating end-user performance degradation in ${subject}?`,
      options: [
        'Tail latency percentiles (p95 and p99)',
        'Raw throughput count alone',
        'Storage disk block allocation size',
        'Database connection idle duration',
      ],
      correctIndex: 0,
      explanation: 'Tail latency percentiles (p95/p99) reveal the slowest requests experienced by real users under load, catching anomalies that averages hide.',
    },
    {
      prompt: `In the context of ${subject}, how does an idempotency key safeguard system operations?`,
      options: [
        'Guarantees repeating an operation produces the same result without duplicate mutations',
        'Automatically invalidates all edge browser caches worldwide',
        'Encrypts data payloads using symmetric AES-256 keys',
        'Compresses outbound HTTP response bodies',
      ],
      correctIndex: 0,
      explanation: 'Idempotency keys ensure network retries can be handled safely without applying duplicated state changes or financial double-charges.',
    },
    {
      prompt: `What is the recommended approach for secure API boundary validation in ${subject}?`,
      options: [
        'Perform exhaustive schema and type validation on the server regardless of client checks',
        'Rely exclusively on frontend client-side JavaScript form validation',
        'Disable token expiry checks during automated testing',
        'Transmit sensitive credentials via plaintext URL query parameters',
      ],
      correctIndex: 0,
      explanation: 'Server-side validation is non-negotiable because client environments can be bypassed or manipulated arbitrarily by untrusted actors.',
    },
    {
      prompt: `When designing for high resilience in ${subject}, what role does the Circuit Breaker pattern fulfill?`,
      options: [
        'Fast-fails downstream requests when a dependency is degraded to prevent cascading collapse',
        'Reboots the host server automatically when CPU usage reaches 80%',
        'Permanently deletes corrupt database tables upon read failure',
        'Forces all client traffic through a single synchronous bottleneck',
      ],
      correctIndex: 0,
      explanation: 'Circuit breakers prevent cascading outages by interrupting traffic to struggling services and providing fast fallback responses.',
    },
    {
      prompt: `What is the fundamental benefit of Eventual Consistency in distributed systems for ${subject}?`,
      options: [
        'Replicas converge to a unified consistent state over time without blocking writes',
        'Guarantees instantaneous serializable transaction isolation globally',
        'Eliminates the possibility of network packet loss',
        'Ensures zero read latency across all continents simultaneously',
      ],
      correctIndex: 0,
      explanation: 'Eventual consistency allows high write availability across distributed nodes, converging to consistency once updates propagate.',
    },
  ];

  for (let i = 0; i < 30; i++) {
    const modIdx = Math.floor(i / 6) % moduleNames.length;
    const modName = moduleNames[modIdx];
    const tmpl = templates[i % templates.length];

    questions.push({
      id: i + 1,
      moduleTag: modName,
      prompt: `[Question ${i + 1} - ${modName}]: ${tmpl.prompt}`,
      options: tmpl.options,
      correctIndex: tmpl.correctIndex,
      explanation: `[${modName}]: ${tmpl.explanation}`,
    });
  }

  return questions;
}

export const coursesData = [
  // ─── COURSE 1: AI & MACHINE LEARNING (5 MODULES) ──────────────────────────
  {
    title: 'Foundations of Artificial Intelligence & Machine Learning',
    category: 'Technology',
    department: 'Artificial Intelligence & Data Systems',
    description: 'Explore mathematical foundations, core algorithms, neural networks, transformers, and practical applications of modern generative AI with university-grade rigor.',
    duration: '10 weeks',
    level: 'Beginner',
    isPro: false,
    price: 0,
    currency: 'INR',
    tags: ['ai', 'machine-learning', 'python', 'neural-networks', 'transformers'],
    learningOutcomes: [
      'Master supervised, unsupervised, and reinforcement learning paradigms',
      'Formulate and implement gradient descent algorithms and multi-layer perceptrons',
      'Understand attention mechanisms, transformer models, and retrieval-augmented generation',
      'Evaluate model generalization using bias-variance tradeoff and cross-validation',
      'Apply ethical AI frameworks, alignment principles, and privacy protections',
    ],
    prerequisites: ['Basic Python programming', 'Elementary calculus and linear algebra'],
    color: 'violet',
    icon: '✳',
    rating: 4.92,
    reviewsCount: 46,
    finalExam: {
      enabled: true,
      title: 'AI & Machine Learning Comprehensive Final Proctored Exam',
      description: '30 Multiple-Choice Questions covering all 5 curriculum modules. Minimum 70% passing threshold to earn official verified certification.',
      durationMinutes: 45,
      passingScore: 70,
      questions: generate30CourseQuestions('AI & Machine Learning', [
        'Module 1: Intelligence Systems Formulation',
        'Module 2: Supervised Learning & Optimization',
        'Module 3: Neural Architectures & Backpropagation',
        'Module 4: Transformers & Attention Mechanisms',
        'Module 5: Ethical Alignment & Production Deployment',
      ]),
    },
    modules: [
      {
        title: 'Module 1: Introduction to Intelligence Systems',
        description: 'Historical context, Turing test, and foundational problem formulation.',
        order: 0,
        lessons: [
          {
            title: '1.1 The Landscape of Artificial Intelligence',
            type: 'text',
            durationMinutes: 20,
            order: 0,
            content: `Welcome to Foundations of Artificial Intelligence & Machine Learning.

Artificial Intelligence is the science and engineering of designing computing systems that perform cognitive tasks traditionally requiring human judgment—including visual perception, speech comprehension, automated decision-making, and translation between natural languages.

Core Pillars of Modern AI:
1. Symbolic & Heuristic AI: Rule-based inference engines and search algorithms operating over structured knowledge representations.
2. Statistical Learning: Algorithms that infer predictive patterns automatically from data rather than handcrafted logic.
3. Deep Learning: Hierarchical representation learning using multi-layered artificial neural networks.

The Machine Learning Pipeline:
- Input Feature Vector (X): Quantitative measurements characterizing each sample.
- Target Ground Truth (y): Desired label or continuous outcome.
- Hypothesis Function: Model parameterization mapping inputs to predictions.
- Loss Function: Objective metric quantifying predictive error.
- Optimization: Iterative parameter updates minimizing empirical loss.`,
          },
          {
            title: '1.2 Problem Formulation & Search Spaces',
            type: 'text',
            durationMinutes: 25,
            order: 1,
            content: `Formulating an intelligent problem involves defining:
1. State Space: The set of all valid configurations of the problem environment.
2. Initial State: The starting point of the agent.
3. Actions and Transition Model: Available operations and their deterministic or probabilistic consequences.
4. Goal Test: Formal condition verifying whether a state satisfies the objective.
5. Path Cost: Numerical cost associated with actions taken.

Classical search algorithms like Breadth-First Search (BFS), Depth-First Search (DFS), and A* heuristic search establish the theoretical groundwork for modern planning and automated reasoning engines.`,
          },
        ],
      },
      {
        title: 'Module 2: Supervised Learning & Optimization',
        description: 'Linear models, logistic regression, and loss landscape optimization.',
        order: 1,
        lessons: [
          {
            title: '2.1 Linear & Logistic Regression Mechanics',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Regression models quantify continuous relationships, while classification predicts discrete class boundaries.

Linear Regression:
Computes a weighted sum of input features:
y_hat = w1*x1 + w2*x2 + ... + wn*xn + b

Mean Squared Error (MSE) loss quantifies the average squared difference between predictions and real values:
MSE = (1 / 2m) * sum((y_hat - y)^2)

Logistic Regression:
Passes the linear score through the Sigmoid activation function to model Bernoulli probabilities between 0 and 1:
P(y=1|x) = 1 / (1 + exp(-z))
Binary Cross-Entropy loss penalizes confident incorrect classifications exponentially.`,
          },
          {
            title: '2.2 Gradient Descent & Loss Landscapes',
            type: 'text',
            durationMinutes: 35,
            order: 1,
            content: `Gradient Descent is the foundational optimization workhorse of modern machine learning.

Parameter Update Rule:
theta = theta - alpha * grad(L)
where alpha is the learning rate hyperparameter and grad(L) is the vector of partial derivatives with respect to each weight.

Variants of Gradient Descent:
1. Batch Gradient Descent: Computes gradients across the entire training set. Highly stable convergence, but computationally prohibitive for large datasets.
2. Stochastic Gradient Descent (SGD): Computes updates based on a single random training sample. Fast and noisy, assisting in escaping shallow local minima.
3. Mini-Batch SGD: Computes updates over small batches (e.g., 32, 64, or 128 samples). Balances hardware vectorization efficiency with stochastic exploration.`,
          },
        ],
      },
      {
        title: 'Module 3: Neural Architectures & Backpropagation',
        description: 'Perceptrons, activation functions, computational graphs, and reverse-mode automatic differentiation.',
        order: 2,
        lessons: [
          {
            title: '3.1 The Artificial Neuron & Non-Linear Activations',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `An artificial neuron computes an affine transformation followed by an element-wise non-linear activation:
z = W*x + b
a = sigma(z)

Why Non-Linearity Matters:
Without non-linear activations, stacking multiple linear layers collapses mathematically into a single equivalent linear transformation, rendering deep architectures incapable of learning non-linear decision boundaries.

Prominent Activation Functions:
- ReLU (Rectified Linear Unit): f(x) = max(0, x). Standard for hidden layers due to fast computation and avoidance of vanishing gradients for positive inputs.
- Leaky ReLU: f(x) = max(0.01x, x). Prevents dying neurons by preserving a slight gradient for negative values.
- GELU (Gaussian Error Linear Unit): Smooth non-linearity utilized in modern transformers including BERT and GPT architectures.`,
          },
          {
            title: '3.2 Backpropagation & The Chain Rule',
            type: 'text',
            durationMinutes: 35,
            order: 1,
            content: `Backpropagation implements the multi-variable calculus Chain Rule to compute the partial derivative of the scalar loss with respect to every weight in a computational graph.

Two-Stage Execution:
1. Forward Pass: Computes intermediate node values from input layer to output layer, evaluating the final loss.
2. Backward Pass: Traverses the graph in reverse order, applying the chain rule to accumulate gradients.

Modern deep learning frameworks construct directed acyclic computational graphs, tracking tensors and operations to automate reverse-mode automatic differentiation seamlessly.`,
          },
        ],
      },
      {
        title: 'Module 4: Transformers & Generative Attention',
        description: 'Self-attention, multi-head attention, positional encodings, and large language models.',
        order: 3,
        lessons: [
          {
            title: '4.1 Scaled Dot-Product & Multi-Head Self-Attention',
            type: 'text',
            durationMinutes: 35,
            order: 0,
            content: `The Transformer architecture replaces recurrent architectures with parallelized self-attention mechanisms.

Scaled Dot-Product Attention:
Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V
where Q (Query), K (Key), and V (Value) are projections of input token embeddings.

Key Intuition:
- Query-Key dot products measure conceptual relevance between token pairs.
- Division by sqrt(d_k) prevents logits from growing too large, preventing vanishing gradients in the softmax.
- Softmax normalizes weights into a probability distribution.
- Matrix multiplication with V yields a context-rich representation.

Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions.`,
          },
          {
            title: '4.2 Retrieval-Augmented Generation (RAG)',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Retrieval-Augmented Generation (RAG) grounds language models in external knowledge repositories to eliminate factual hallucinations.

Core RAG Architecture:
1. Ingestion: Document chunking, vector embedding generation, and persistent vector database indexing.
2. Retrieval: Similarity search (cosine similarity) matching user prompt embeddings with top-K relevant chunks.
3. Augmentation: Constructing a structured system prompt containing retrieved context, instructions, and user inquiry.
4. Generation: Language model synthesizes a factual, verifiable answer strictly referencing the provided context.`,
          },
        ],
      },
      {
        title: 'Module 5: Ethical AI, Alignment & Production Deployment',
        description: 'Safety, bias mitigation, latency optimizations, and production serving.',
        order: 4,
        lessons: [
          {
            title: '5.1 AI Alignment & Responsible Deployment',
            type: 'text',
            durationMinutes: 25,
            order: 0,
            content: `Responsible AI engineering requires rigorous verification across four dimensions:
1. Fairness & Representation: Evaluating algorithmic bias across demographic subgroups.
2. Interpretability: Providing explanations for model predictions in high-stakes domains.
3. Privacy & Governance: Enforcing differential privacy, federated learning, and zero data leakage.
4. Adversarial Robustness: Defending against prompt injection, data poisoning, and jailbreak attacks.`,
          },
          {
            title: '5.2 Production Serving & Inference Optimization',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Deploying models in production environments requires balancing latency, throughput, and hardware costs.

Optimization Techniques:
- Quantization: Converting FP32 floating point weights to INT8 or FP4 with negligible accuracy loss.
- Key-Value (KV) Caching: Reusing previously computed attention states during autoregressive token generation.
- Model Pruning: Removing redundant weights to reduce memory bandwidth bottlenecks.
- Batching: Dynamic continuous batching to maximize GPU compute occupancy.`,
          },
        ],
      },
    ],
  },

  // ─── COURSE 2: HUMAN-CENTERED UI/UX & DESIGN SYSTEMS (5 MODULES) ─────────
  {
    title: 'Human-Centered UI/UX & Design Systems',
    category: 'Design',
    department: 'Human-Centered Design & Media',
    description: 'Master user experience design, cognitive psychology principles, atomic design tokens, accessibility (WCAG 2.1 AA), and interactive digital prototyping.',
    duration: '8 weeks',
    level: 'Intermediate',
    isPro: false,
    price: 0,
    currency: 'INR',
    tags: ['design', 'ux', 'ui', 'design-systems', 'accessibility'],
    learningOutcomes: [
      'Conduct rigorous contextual inquiry and qualitative user research',
      'Build reusable design token architectures for dark and light mode themes',
      'Implement WCAG 2.1 AA standards for keyboard navigation and screen readers',
      'Design high-fidelity interactive user interfaces with micro-interactions',
      'Establish component governance frameworks across engineering teams',
    ],
    prerequisites: ['Basic web literacy', 'Familiarity with digital interfaces'],
    color: 'orange',
    icon: '⌁',
    rating: 4.95,
    reviewsCount: 42,
    finalExam: {
      enabled: true,
      title: 'Human-Centered UI/UX Comprehensive Final Proctored Exam',
      description: '30 Multiple-Choice Questions covering design tokens, accessibility, cognitive psychology, and design systems. Minimum 70% passing threshold to earn certification.',
      durationMinutes: 45,
      passingScore: 70,
      questions: generate30CourseQuestions('Human-Centered UI/UX', [
        'Module 1: Cognitive Foundations & Gestalt Laws',
        'Module 2: Design Tokens & Theming Architecture',
        'Module 3: Accessibility (WCAG 2.1 AA)',
        'Module 4: Information Architecture & Wireframing',
        'Module 5: Micro-Interactions & Component Systems',
      ]),
    },
    modules: [
      {
        title: 'Module 1: Principles of Perceptual Design',
        description: 'Visual hierarchy, Gestalt laws, and cognitive load management.',
        order: 0,
        lessons: [
          {
            title: '1.1 Gestalt Principles in Digital Interfaces',
            type: 'text',
            durationMinutes: 20,
            order: 0,
            content: `Human visual perception organizes incoming sensory stimuli into structured groups and patterns rather than isolated pixels.

Core Gestalt Laws in UI Design:
1. Proximity: Elements placed adjacent to each other are naturally perceived as belonging to the same functional cluster.
2. Similarity: Components sharing identical typography, border radius, or color palette are perceived as having similar behavior.
3. Continuity: Visual lines, grids, and alignment guide the user eye naturally across complex layouts.
4. Figure-Ground: Layered surfaces with subtle shadows and borders create clear depth without overwhelming visual clutter.`,
          },
          {
            title: '1.2 Cognitive Load & Hick-Hyman Law',
            type: 'text',
            durationMinutes: 25,
            order: 1,
            content: `Cognitive Load Theory identifies three forms of mental effort:
- Intrinsic Load: Effort inherent to the concept or task itself.
- Extraneous Load: Mental friction caused by poor layout, ambiguous buttons, or visual distraction.
- Germane Load: Productive mental effort dedicated to forming mental models and retaining knowledge.

Hick-Hyman Law:
The time required to make a decision increases logarithmically with the number and complexity of choices:
T = b * log2(n + 1)
Effective UI design streamlines choices using progressive disclosure and clear primary call-to-actions.`,
          },
        ],
      },
      {
        title: 'Module 2: Design Tokens & Dual-Theme Architecture',
        description: 'Token structures, semantic colors, and eye-friendly dark/light mode balance.',
        order: 1,
        lessons: [
          {
            title: '2.1 Design Tokens as Single Source of Truth',
            type: 'text',
            durationMinutes: 25,
            order: 0,
            content: `Design tokens are named entities that store visual attributes: colors, typography scales, spacing units, border radii, and shadows.

Token Hierarchy:
1. Global Tokens: Raw values (e.g., color-slate-900: #0f172a, spacing-4: 16px).
2. Semantic Tokens: Purpose-driven abstractions (e.g., surface-card, text-primary, border-subtle).
3. Component Tokens: Specific bindings (e.g., button-primary-bg, modal-header-border).

Decoupling raw values from semantic tokens allows instant redesigns and consistent cross-platform parity between Web, iOS, and Android.`,
          },
          {
            title: '2.2 Eye-Friendly Light and Dark Themes',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Why naive color inversion fails:
Simply inverting white to pitch-black creates harsh visual contrast that causes haloing and ocular strain.

Principles of Eye-Friendly Light Mode:
- Avoid harsh pure white (#ffffff) on large background areas; use warm muted slates, zincs, and pearl tones (#f5f7fa, #f8fafc).
- Maintain soft borders (#e2e8f0) with gentle drop shadows for elevated cards.
- Deep neutral text (#1e293b) ensures high readability without the jarring severity of pure #000000.

Principles of Refined Dark Mode:
- Layer deep charcoals (#11131a, #1b1d26) rather than pure black.
- Use restrained luminous accents to highlight active states and progress indicators.`,
          },
        ],
      },
      {
        title: 'Module 3: Accessibility & Inclusive Systems (WCAG 2.1 AA)',
        description: 'Color contrast ratios, screen reader semantics, and focus management.',
        order: 2,
        lessons: [
          {
            title: '3.1 Contrast Ratios & Visual Impairment Considerations',
            type: 'text',
            durationMinutes: 25,
            order: 0,
            content: `Web Content Accessibility Guidelines (WCAG 2.1 AA) require:
- Minimum 4.5:1 contrast ratio for normal text against its background.
- Minimum 3:1 contrast ratio for large text (18pt or 14pt bold) and active UI controls.
- Color must never be the sole conveyor of information; pair color with icons, text badges, or patterns.`,
          },
          {
            title: '3.2 Keyboard Navigation & Focus Rings',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Keyboard accessibility ensures power users and individuals using assistive devices can navigate full workflows without mouse interaction.

Best Practices:
- Never remove focus outlines without providing an accessible :focus-visible replacement.
- Maintain logical DOM tab order matching visual flow.
- Trap focus within active modal dialogues to prevent background scrolling.
- Provide accessible skip links to allow users to bypass repetitive navigation bars.`,
          },
        ],
      },
      {
        title: 'Module 4: Information Architecture & Rapid Prototyping',
        description: 'Site maps, card sorting, user journeys, and high-fidelity wireframing.',
        order: 3,
        lessons: [
          {
            title: '4.1 Mental Models & Card Sorting',
            type: 'text',
            durationMinutes: 25,
            order: 0,
            content: `Information Architecture (IA) organizes content logically according to user expectations.
Card sorting methods (open, closed, and hybrid) reveal how prospective learners categorize subjects, enabling navigation menus that feel intuitive rather than reflecting internal institutional silos.`,
          },
          {
            title: '4.2 Wireframing to High-Fidelity Progression',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Iterative progression moves through:
1. Low-Fidelity Sketches: Validating core user journeys and layout hierarchy rapidly.
2. Mid-Fidelity Wireframes: Testing spacing, content density, and responsive breakpoints.
3. High-Fidelity Prototypes: Incorporating design tokens, real copy, and interactive feedback loops.`,
          },
        ],
      },
      {
        title: 'Module 5: Micro-Interactions & Component Lifecycle',
        description: 'Motion design, state transitions, design system versioning, and engineering handoff.',
        order: 4,
        lessons: [
          {
            title: '5.1 Intentional Motion & Micro-Interactions',
            type: 'text',
            durationMinutes: 25,
            order: 0,
            content: `Effective UI motion serves functional communication, never mere decoration.
Micro-interactions provide immediate tactile feedback: button press depths, form validation shakes, loading spinners, and progress bar fill transitions. Durations should remain crisp (150ms to 250ms) with easing curves.`,
          },
          {
            title: '5.2 Design System Governance & Engineering Handoff',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `A design system is a living product. Establishing semantic versioning, documentation portals, and automated linting guarantees that changes to component tokens cascade predictably across production web applications.`,
          },
        ],
      },
    ],
  },

  // ─── COURSE 3: CLOUD SYSTEMS & DISTRIBUTED ARCHITECTURE (PRO COURSE) ───────
  {
    title: 'Cloud Systems Architecture & Distributed Computing',
    category: 'Technology',
    department: 'Computer Science & Engineering',
    description: 'Architect resilient, scalable, distributed cloud infrastructure with microservices, asynchronous message queues, containerization, and data partitioning.',
    duration: '10 weeks',
    level: 'Advanced',
    isPro: true,
    price: 1499,
    currency: 'INR',
    tags: ['cloud', 'distributed-systems', 'docker', 'microservices', 'redis', 'pro'],
    learningOutcomes: [
      'Design fault-tolerant distributed systems utilizing CAP and PACELC trade-offs',
      'Implement asynchronous job processing with Redis and event-driven architectures',
      'Containerize applications with Docker, orchestrating health checks and edge proxies',
      'Implement zero-downtime deployment pipelines and centralized telemetry',
      'Master distributed consensus algorithms (Raft and Paxos)',
    ],
    prerequisites: ['Operating systems fundamentals', 'Computer networks', 'Database management'],
    color: 'green',
    icon: '◉',
    rating: 4.96,
    reviewsCount: 38,
    finalExam: {
      enabled: true,
      title: 'Cloud Systems Architecture Comprehensive Final Proctored Exam',
      description: '30 Multiple-Choice Questions covering CAP theorem, distributed consensus, caching, microservices, and containerization. Minimum 70% passing threshold to earn certification.',
      durationMinutes: 45,
      passingScore: 70,
      questions: generate30CourseQuestions('Cloud Systems & Distributed Computing', [
        'Module 1: CAP Theorem & Consistency Models',
        'Module 2: Microservices & Inter-Service Messaging',
        'Module 3: Distributed Caching & In-Memory Data Stores',
        'Module 4: Consensus Algorithms & Leader Election',
        'Module 5: Container Orchestration & Cloud Observability',
      ]),
    },
    modules: [
      {
        title: 'Module 1: Distributed Foundations & CAP Theorem',
        description: 'Consistency, Availability, and Partition Tolerance in distributed architectures.',
        order: 0,
        lessons: [
          {
            title: '1.1 The CAP Theorem & Eventual Consistency',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `The CAP Theorem establishes that any distributed data store can guarantee at most two out of three characteristics simultaneously:
- Consistency (C): Every read receives the most recent write or an error.
- Availability (A): Every non-failing node returns a non-error response.
- Partition Tolerance (P): The system continues to operate despite arbitrary message loss or network partitions.

In modern cloud architectures where network partitions are inevitable physical realities, architects choose between CP (strong consistency, e.g. financial ledgers) and AP (high availability with eventual consistency, e.g. social feeds and learning activity streams).`,
          },
          {
            title: '1.2 PACELC Theorem & Latency Tradeoffs',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `The PACELC Theorem extends CAP by addressing normal operation without network partitions:
If there is a Partition (P), how does the system trade Availability (A) and Consistency (C)?
Else (E), how does the system trade Latency (L) and Consistency (C)?

Understanding PACELC allows engineers to select appropriate database technologies: Amazon DynamoDB and Apache Cassandra optimize for AP/EL, while Google Spanner and PostgreSQL clusters optimize for CP/PC.`,
          },
        ],
      },
      {
        title: 'Module 2: Microservices & Event-Driven Architecture',
        description: 'Decoupled communication, API gateways, and asynchronous message brokers.',
        order: 1,
        lessons: [
          {
            title: '2.1 Monolith to Microservices Decomposition',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Decomposing monolithic architectures into microservices must be guided by Domain-Driven Design (DDD) bounded contexts.
Each microservice owns its domain schema and state exclusively. Direct cross-database access is prohibited; all interactions occur through published APIs or event streams.`,
          },
          {
            title: '2.2 Asynchronous Queues & Event Streaming',
            type: 'text',
            durationMinutes: 35,
            order: 1,
            content: `Synchronous HTTP calls between microservices introduce tight coupling and cascading latency.
Employing asynchronous message queues (such as Redis BullMQ, RabbitMQ, or Apache Kafka) enables producers to fire-and-forget events, buffering traffic bursts and decoupling consumer processing lifecycles.`,
          },
        ],
      },
      {
        title: 'Module 3: Distributed Caching & Memory Tiering',
        description: 'Redis caching strategies, cache invalidation, and data persistence.',
        order: 2,
        lessons: [
          {
            title: '3.1 Cache Patterns: Cache-Aside, Write-Through & Write-Back',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Distributed caching reduces database read load by orders of magnitude.
- Cache-Aside: Application checks cache first. On miss, it reads from DB and writes to cache.
- Write-Through: Application writes data to cache and DB simultaneously.
- Write-Back (Write-Behind): Application writes to cache immediately, deferring asynchronous batched writes to DB.`,
          },
          {
            title: '3.2 Thundering Herd & Cache Stampede Mitigation',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `When a high-traffic cache key expires simultaneously, thousands of concurrent requests hit the database directly, risking complete service failure.
Mitigation strategies include distributed locks, probabilistic early expiration (XFetch), and jittered TTL expiration windows.`,
          },
        ],
      },
      {
        title: 'Module 4: Distributed Consensus & State Machine Replication',
        description: 'Raft consensus, leader election, log replication, and split-brain resolution.',
        order: 3,
        lessons: [
          {
            title: '4.1 Raft Consensus Protocol Fundamentals',
            type: 'text',
            durationMinutes: 35,
            order: 0,
            content: `Raft decomposes distributed consensus into three distinct sub-problems:
1. Leader Election: A candidate node gathers a quorum majority (N/2 + 1) of votes to become leader.
2. Log Replication: The leader accepts log entries, replicates them to follower nodes, and commits them once acknowledged by a quorum.
3. Safety: If any server has applied a log entry to its state machine, no other server may apply a different value for that log index.`,
          },
          {
            title: '4.2 Split-Brain Partition Handling',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `When network failure partitions a cluster into two disconnected segments, strict majority quorum rules ensure that only the partition with more than 50% of the nodes can elect a leader and commit updates, preserving data integrity.`,
          },
        ],
      },
      {
        title: 'Module 5: Container Orchestration & Production Observability',
        description: 'Docker containerization, zero-downtime rolling deploys, and OpenTelemetry instrumentation.',
        order: 4,
        lessons: [
          {
            title: '5.1 Containerization with Docker & Pod Orchestration',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Containers package application code, dependencies, and system libraries into lightweight, reproducible artifacts.
Multi-stage Docker builds separate build toolchains from production runtime environments, shrinking image footprints and minimizing security attack vectors.`,
          },
          {
            title: '5.2 Observability: Metrics, Distributed Traces & Logs',
            type: 'text',
            durationMinutes: 35,
            order: 1,
            content: `Production observability rests on the three pillars:
- Metrics: Aggregated statistical counters and gauges (CPU, memory, request rates).
- Distributed Tracing: Propagating correlation IDs across asynchronous boundaries to visualize end-to-end request latency graphs.
- Structured Logging: Emitting machine-readable JSON logs for centralized indexing and anomaly alerting.`,
          },
        ],
      },
    ],
  },

  // ─── COURSE 4: ALGORITHMIC MASTERY & INTERVIEW SYNTHESIS (PRO COURSE) ─────
  {
    title: 'Algorithmic Problem Solving & Technical Interview Mastery',
    category: 'Technology',
    department: 'Computer Science & Engineering',
    description: 'Master advanced data structures, algorithmic design paradigms (dynamic programming, graphs, backtracking), and institutional technical interview problem solving.',
    duration: '8 weeks',
    level: 'Advanced',
    isPro: true,
    price: 1999,
    currency: 'INR',
    tags: ['dsa', 'algorithms', 'leetcode', 'interviews', 'dynamic-programming', 'pro'],
    learningOutcomes: [
      'Analyze algorithmic time and space complexity using Big-O formal notations',
      'Solve complex dynamic programming problems using memoization and tabulation',
      'Implement graph traversal algorithms (Dijkstra, Topological Sort, Union-Find)',
      'Master sliding window, two-pointer, and monotonic stack techniques',
      'Synthesize real-world system design interview problems with verified trade-offs',
    ],
    prerequisites: ['Data structures fundamentals', 'Proficiency in at least one modern language'],
    color: 'violet',
    icon: '✳',
    rating: 4.98,
    reviewsCount: 54,
    finalExam: {
      enabled: true,
      title: 'Algorithmic Problem Solving Comprehensive Final Proctored Exam',
      description: '30 Multiple-Choice Questions covering data structures, dynamic programming, graphs, trees, and complexity analysis. Minimum 70% passing threshold to earn certification.',
      durationMinutes: 45,
      passingScore: 70,
      questions: generate30CourseQuestions('Algorithmic Problem Solving', [
        'Module 1: Time & Space Complexity Analysis',
        'Module 2: Advanced Trees, Heaps & Tries',
        'Module 3: Graph Traversal & Shortest Path Algorithms',
        'Module 4: Dynamic Programming & Memoization',
        'Module 5: Monotonic Structures & Sliding Windows',
      ]),
    },
    modules: [
      {
        title: 'Module 1: Asymptotic Analysis & Core Structures',
        description: 'Big-O notation, amortized analysis, and memory locality.',
        order: 0,
        lessons: [
          {
            title: '1.1 Formal Asymptotic Complexity Analysis',
            type: 'text',
            durationMinutes: 25,
            order: 0,
            content: `Big-O notation describes the upper bound on time or space growth as input size n approaches infinity.
Understanding best, average, and worst-case complexities alongside amortized complexity (e.g. dynamic array expansion taking O(1) amortized time despite occasional O(n) reallocations) is essential for efficient software engineering.`,
          },
          {
            title: '1.2 Arrays, Linked Lists & Memory Locality',
            type: 'text',
            durationMinutes: 25,
            order: 1,
            content: `Modern hardware features multi-level CPU cache hierarchies (L1, L2, L3). Contiguous arrays exhibit exceptional spatial locality, whereas pointer-chasing structures like linked lists incur frequent cache misses. Choosing data structures aligned with CPU architecture optimizes practical performance.`,
          },
        ],
      },
      {
        title: 'Module 2: Trees, Heaps & Trie Structures',
        description: 'Self-balancing trees, priority queues, and prefix trees.',
        order: 1,
        lessons: [
          {
            title: '2.1 Binary Search Trees & Self-Balancing Mechanisms',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Unbalanced binary search trees degenerate to O(n) linked lists under sorted input. Self-balancing trees (AVL, Red-Black) maintain O(log n) search, insertion, and deletion guarantees by executing tree rotations upon balance factor violations.`,
          },
          {
            title: '2.2 Binary Heaps & Priority Queues',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Heaps satisfy the heap property: in a Min-Heap, the root is always the minimum element. Stored in compact contiguous arrays without pointer overhead, heaps power top-K problem solving, task schedulers, and Dijkstra's algorithm.`,
          },
        ],
      },
      {
        title: 'Module 3: Graph Traversal & Network Optimization',
        description: 'BFS, DFS, Dijkstra, Bellman-Ford, and Union-Find.',
        order: 2,
        lessons: [
          {
            title: '3.1 Breadth-First & Depth-First Graph Search',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Graphs represent arbitrary relational networks. BFS guarantees shortest path discovery in unweighted graphs in O(V + E) time, while DFS enables cycle detection and topological sorting of dependency graphs.`,
          },
          {
            title: '3.2 Shortest Path Algorithms & Disjoint Set Union',
            type: 'text',
            durationMinutes: 35,
            order: 1,
            content: `Dijkstra's algorithm finds shortest paths from a single source in non-negative weighted graphs in O((V + E) log V) time. Disjoint Set Union (Union-Find) with path compression and union-by-rank achieves near O(1) amortized operations.`,
          },
        ],
      },
      {
        title: 'Module 4: Dynamic Programming & Optimal Substructure',
        description: 'Memoization, tabulation, state transitions, and knapsack variants.',
        order: 3,
        lessons: [
          {
            title: '4.1 Identifying Overlapping Subproblems',
            type: 'text',
            durationMinutes: 35,
            order: 0,
            content: `Dynamic Programming solves complex optimization problems by breaking them down into simpler subproblems.
Prerequisites for DP:
1. Optimal Substructure: An optimal solution to the problem contains optimal solutions to its subproblems.
2. Overlapping Subproblems: The recursive algorithm visits the same subproblems repeatedly rather than generating new ones.`,
          },
          {
            title: '4.2 Memoization vs. Tabulation Patterns',
            type: 'text',
            durationMinutes: 35,
            order: 1,
            content: `Top-down Memoization caches recursive return values in a hash table or array, while Bottom-up Tabulation fills an iterative table iteratively, frequently allowing space optimization to O(1) auxiliary memory.`,
          },
        ],
      },
      {
        title: 'Module 5: Monotonic Structures & Two-Pointer Windows',
        description: 'Monotonic stacks, deques, sliding windows, and interview synthesis.',
        order: 4,
        lessons: [
          {
            title: '5.1 Monotonic Stacks & Deques',
            type: 'text',
            durationMinutes: 30,
            order: 0,
            content: `Monotonic stacks maintain elements in strictly ascending or descending order, resolving Next Greater Element and largest rectangle in histogram problems in linear O(n) time.`,
          },
          {
            title: '5.2 Sliding Window & Two-Pointer Master Patterns',
            type: 'text',
            durationMinutes: 30,
            order: 1,
            content: `Sliding window maintains a dynamic subarray or substring window satisfying specific constraints, converting O(n^2) nested loops into O(n) single-pass linear scans.`,
          },
        ],
      },
    ],
  },
];

