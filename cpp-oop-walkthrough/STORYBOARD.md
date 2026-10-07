---
format: 1920x1080
duration: 207.281s
message: "C++ OOP interview readiness comes from eight practical mental models and knowing when each one applies"
arc: listicle
audience: software engineers preparing for C++ interviews
mode: autonomous
music: none
captions: true
---

## Frame 1 — The map, not the trivia

- status: animated
- src: compositions/frames/01-map.html
- duration: 14.827s
- poster: 10s
- transition_in: cut
- type: hook
- persuasion: Pain validation + Frame-then-fill
- beat: Recognition + focus
- blueprint: grid-card-assemble
- scene: Eight numbered interview topics assemble into one navigable mental map.
- voiceover: "C plus plus object-oriented interviews can feel like disconnected trivia. They are easier when you see the map: ownership, interfaces, inheritance, composition, encapsulation, initialization, object representation, and precise polymorphic APIs."

**narrativeRole:** Reframes eight source questions as one compact interview-prep map.

**keyMessage:** The viewer should organize the document as a set of decision rules, not isolated definitions.

**shotSequence:**
- 0–3s — Open on the question “Eight topics—or one mental map?” with a small `C++ / OOP` folio label.
- 3–10s — Assemble eight numbered cards in four paired beats: ownership/interfaces, inheritance/composition, encapsulation/initialization, representation/APIs.
- 10–14.827s — Pull back to the complete map; connect the cards with one restrained coral path and hold for orientation.

**blueprintPosture:** Adapt `grid-card-assemble` into an editorial map; cards reveal by category rather than all at once.

**focalElement:** The complete eight-topic map.

**roles:** eyebrow label, hero question, eight numbered topic cards, connecting path, source-document footer.

## Frame 2 — Own resources deliberately

- status: animated
- src: compositions/frames/02-resource-ownership.html
- duration: 28.922s
- poster: 16s
- transition_in: push-slide LEFT
- type: feature_showcase
- persuasion: Rule of three + Common-belief vs reality
- beat: Clarity + confidence
- blueprint: comparison-split
- scene: A raw-pointer object branches into Three, Five, and Zero, with Zero winning the modern path.
- voiceover: "First, special member functions. The Rule of Three says that if you manually define destruction, copying, or copy assignment, you probably need all three. C plus plus eleven adds move construction and move assignment: the Rule of Five. But the preferred modern answer is the Rule of Zero. Put ownership in vector, string, unique pointer, or another RAII type, and let the compiler generate correct copy and move behavior. The interview signal is judgment: manual resource, think Five; RAII members, choose Zero."

**narrativeRole:** Establishes the highest-value ownership rule and its modern default.

**keyMessage:** Prefer Rule of Zero; use Rule of Five only when the type truly owns a raw resource.

**shotSequence:**
- 0–6s — A raw pointer enters a warning lane; destructor, copy constructor, and copy assignment appear as the Rule of Three.
- 6–15s — Two move operations extend the lane from Three to Five.
- 15–24s — The right panel replaces the raw pointer with `std::vector`, `std::string`, and `std::unique_ptr`; the compiler-generated path lights up.
- 24–28.922s — Resolve to a two-line decision rule: “manual resource → Five / RAII members → Zero.”

**blueprintPosture:** Follow `comparison-split`; left is manual ownership, right is RAII, with Zero receiving the dominant visual weight.

**focalElement:** The Five-versus-Zero decision rule.

**roles:** section label, Three/Five sequence, ownership examples, compiler badge, final decision strip.

## Frame 3 — Interfaces define substitution

- status: animated
- src: compositions/frames/03-interfaces.html
- duration: 27.727s
- poster: 13s
- transition_in: crossfade
- type: feature_showcase
- persuasion: Question→answer pairing + Progressive disclosure
- beat: Orientation + comprehension
- blueprint: grid-card-assemble
- scene: A Shape contract fans out to concrete implementations while a virtual destructor seals the interface.
- voiceover: "Second, abstract classes and interfaces. A pure virtual function uses equals zero, and one pure virtual function makes the class abstract. C plus plus has no interface keyword, so an interface is a convention: pure virtual operations, no state, and a virtual destructor. That last detail matters because callers may destroy a concrete object through a base pointer. Multiple interface inheritance is usually safe because the contracts carry behavior, not duplicated state."

**narrativeRole:** Shows how C++ expresses behavioral contracts and safe substitution.

**keyMessage:** A C++ interface is a stateless abstract base with pure virtual operations and a virtual destructor.

**shotSequence:**
- 0–6s — Reveal a central `Shape` contract and highlight `draw() = 0`.
- 6–15s — Fan out to `Circle` and `Rectangle`; tag the base as abstract and stateless.
- 15–23s — Animate deletion through a base pointer and seal the contract with `virtual ~Shape()`.
- 23–27.727s — Add a second slim contract to show safe multiple interface inheritance; hold the complete substitution diagram.

**blueprintPosture:** Adapt `grid-card-assemble` into a contract graph with one dominant center and restrained satellite nodes.

**focalElement:** The `Shape` interface contract.

**roles:** interface code card, implementation nodes, substitution arrows, virtual-destructor safety seal.

## Frame 4 — Inheritance must mean is-a

- status: animated
- src: compositions/frames/04-inheritance-composition.html
- duration: 33.423s
- poster: 17s
- transition_in: push-slide LEFT
- type: feature_showcase
- persuasion: Comparison of two options + Counterexample
- beat: Aha + foresight
- blueprint: comparison-split
- scene: An IS-A inheritance lane is contrasted with a HAS-A composition lane; access mappings fold into the decision.
- voiceover: "Third and fourth, inheritance access and composition. Public inheritance preserves the base public interface: use it for a genuine is-a relationship. Protected inheritance hides that interface from ordinary callers, and private inheritance makes it an implementation detail. Both are rare. If the relationship is has-a or uses-a, prefer composition. A car has an engine; it is not an engine. Composition reduces coupling, protects encapsulation, and lets you replace or mock dependencies. Reserve inheritance for polymorphism and base classes deliberately designed for extension."

**narrativeRole:** Converts two related source questions into one design-choice test.

**keyMessage:** Public inheritance models is-a; composition handles has-a and should be the default elsewhere.

**shotSequence:**
- 0–7s — Establish two labeled lanes: `IS-A` and `HAS-A`.
- 7–16s — Step through public, protected, and private inheritance access mappings; public remains visually primary.
- 16–26s — Correct the counterexample from `Car : Engine` to `Car` containing an `Engine` component.
- 26–33.423s — Land the rule: inheritance for substitution; composition for collaboration and replaceability.

**blueprintPosture:** Follow `comparison-split`; use the center divider as the semantic test between inheritance and composition.

**focalElement:** The `IS-A` versus `HAS-A` test.

**roles:** two lane headers, access-mapping stack, Car/Engine diagram, corrected relationship, closing rule.

## Frame 5 — PImpl buys a boundary

- status: animated
- src: compositions/frames/05-pimpl.html
- duration: 27.535s
- poster: 12s
- transition_in: blur-crossfade
- type: feature_showcase
- persuasion: Before/after + Causal chain
- beat: Comprehension + tradeoff awareness
- blueprint: video-text-pivot
- scene: A crowded public header collapses behind one opaque Impl pointer, then the costs appear.
- voiceover: "Fifth, PImpl: pointer to implementation. Move private members into an Impl structure defined in the source file, and keep only a forward declaration plus a unique pointer in the header. The payoff is fewer compile-time dependencies and a more stable binary interface for libraries. The cost is an allocation, pointer indirection, less inlining, and extra copy semantics when copying is required. Use it at public library boundaries, not automatically for every internal class."

**narrativeRole:** Presents PImpl as an explicit boundary tradeoff rather than a universal pattern.

**keyMessage:** PImpl trades runtime and code complexity for compile isolation and ABI stability.

**shotSequence:**
- 0–6s — Show a crowded public header with private fields and heavy includes.
- 6–14s — Collapse the details behind `struct Impl;` and `std::unique_ptr<Impl>` while the source file receives the implementation.
- 14–23s — Balance a benefit/cost ledger: compile isolation and ABI stability versus allocation, indirection, and copy work.
- 23–27.535s — Frame the public library boundary and hold the rule “buy the boundary only when it matters.”

**blueprintPosture:** Adapt `video-text-pivot` as a before/after code transformation with a compact tradeoff ledger replacing footage.

**focalElement:** The opaque `Impl` boundary.

**roles:** before header, after header, source-file implementation, boundary line, benefit/cost ledger.

## Frame 6 — Construction syntax changes meaning

- status: animated
- src: compositions/frames/06-initialization.html
- duration: 34.81s
- poster: 15s
- transition_in: push-slide LEFT
- type: feature_showcase
- persuasion: Demonstration + Comparison of two options
- beat: Surprise + mastery
- blueprint: panel-edit-live-sync
- scene: Four initialization forms flow through explicit-constructor, narrowing, and initializer-list gates.
- voiceover: "Sixth, initialization and copy elision. Parentheses perform direct initialization and may call explicit constructors. Equals syntax performs copy initialization and cannot. Braces reject narrowing, but initializer-list constructors receive priority, which explains why vector brace five means one element while vector parenthesis five means five elements. Finally, returning a temporary by value has guaranteed copy elision since C plus plus seventeen. Named return value optimization is common, but still not guaranteed. The syntax is not cosmetic; it changes overload selection and safety."

**narrativeRole:** Turns several syntax rules into a compact decision pipeline.

**keyMessage:** Initialization spelling affects explicit constructors, narrowing, initializer-list priority, and whether copies exist.

**shotSequence:**
- 0–7s — Place direct initialization and copy initialization on a syntax rail; route only parentheses through `explicit`.
- 7–14s — Introduce braces and stop a narrowing conversion at the gate.
- 14–23s — Compare `vector<int>(5)` with `vector<int>{5}` using five empty slots versus one value card.
- 23–32s — Return a temporary into its destination with no intermediate object; distinguish guaranteed elision from NRVO.
- 32–34.81s — Hold the summary: spelling changes overloads, safety, and object creation.

**blueprintPosture:** Follow `panel-edit-live-sync`; the code rail drives synchronized semantic results in the adjacent panel.

**focalElement:** The vector parentheses-versus-braces comparison.

**roles:** syntax rail, explicit-constructor gate, narrowing gate, vector result panel, copy-elision path.

## Frame 7 — Know the object model, then be precise

- status: animated
- src: compositions/frames/07-object-model-recap.html
- duration: 40.037s
- poster: 15s
- transition_in: crossfade
- type: branding
- persuasion: Distillation + Callback
- beat: Satisfaction + resolve
- blueprint: kinetic-type-beats
- scene: Triviality and covariance land as the final two cards, then all eight rules resolve into a concise checklist.
- voiceover: "Seventh, trivial and trivially copyable are related, but not identical. Trivially copyable answers whether byte-wise copying is valid. Trivial also requires trivial default construction. Standard layout is a separate promise about memory layout, and POD is the older combination, deprecated in C plus plus twenty. Eighth, covariant returns let an override return a pointer or reference to a more derived type, useful for clone-style APIs without a cast. That is the walkthrough: choose ownership deliberately, use interfaces for substitution, inherit only for is-a, compose by default, hide implementation when the boundary justifies it, know your initialization forms, and be exact about the object model."

**narrativeRole:** Completes the source coverage and compresses all eight topics into an interview-ready checklist.

**keyMessage:** Strong interview answers distinguish adjacent concepts precisely and finish with the design rule that governs their use.

**shotSequence:**
- 0–9s — Separate `trivially copyable` from `trivial` with a nested-but-not-equal diagram.
- 9–17s — Add `standard layout` as an independent axis; mark POD as the older intersection and deprecated in C++20.
- 17–25s — Show a clone API narrowing its return from `Base*` to `Derived*` through covariance.
- 25–37s — Rebuild the eight-card map from Frame 1 as an interview checklist, one compact beat at a time.
- 37–40.037s — Close on “Know the rule. Know when.” with the full map faintly retained behind it.

**blueprintPosture:** Follow `kinetic-type-beats`; alternate precise terminology with small diagrams, then callback to the opening map.

**focalElement:** The final eight-rule checklist.

**roles:** object-model Venn, covariance code card, eight-rule checklist, closing statement.

## Video direction

- Visual system: warm editorial code notebook — cream canvas, ink navy, terracotta/coral emphasis, pale blue secondary fields, thin ruled lines, and restrained paper texture.
- Typography: EB Garamond for editorial hero phrases; IBM Plex Sans for labels and explanation; JetBrains Mono for every C++ token.
- Composition: maintain a small top folio label and generous margins across all frames; alternate map, comparison, contract graph, and code-driven panels so consecutive frames never feel identical.
- Motion: use purposeful build order, short staggered reveals, and stable end holds. No decorative drift, bouncing, or continuous ambient movement.
- Transitions: preserve the storyboard transition choices; repeated leftward push-slides should feel like advancing through interview notes.
- Caption safety: reserve the lower safe band for two-line captions and keep essential diagrams above it.
- Audio: narration only. No BGM or SFX, keeping the technical walkthrough focused and fully local.
