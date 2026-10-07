# SCRIPT — C++ OOP Interview Walkthrough

**Voice:** Emma (`bf_emma`, Kokoro-82M)
**Voice settings:** speed 1.0 · British English phonemizer
**Voice direction:** Calm, precise, encouraging. Sound like an experienced engineer giving a focused final review, not reading a glossary.

---

## Line 1 — The map, not the trivia (Frame 1)

**Time:** 0 – 18s
**Delivery:** Open directly; emphasize “map.”

    C plus plus object-oriented interviews can feel like disconnected trivia. They are easier when you see the map: ownership, interfaces, inheritance, composition, encapsulation, initialization, object representation, and precise polymorphic APIs.

## Line 2 — Own resources deliberately (Frame 2)

**Time:** 18 – 48s
**Delivery:** Clear contrast; slow slightly on the final rule.

    First, special member functions. The Rule of Three says that if you manually define destruction, copying, or copy assignment, you probably need all three. C plus plus eleven adds move construction and move assignment: the Rule of Five. But the preferred modern answer is the Rule of Zero. Put ownership in vector, string, unique pointer, or another R A I I type, and let the compiler generate correct copy and move behavior. The interview signal is judgment: manual resource, think Five; R A I I members, choose Zero.

## Line 3 — Interfaces define substitution (Frame 3)

**Time:** 48 – 72s
**Delivery:** Explanatory; make the virtual-destructor warning distinct.

    Second, abstract classes and interfaces. A pure virtual function uses equals zero, and one pure virtual function makes the class abstract. C plus plus has no interface keyword, so an interface is a convention: pure virtual operations, no state, and a virtual destructor. That last detail matters because callers may destroy a concrete object through a base pointer. Multiple interface inheritance is usually safe because the contracts carry behavior, not duplicated state.

## Line 4 — Inheritance must mean is-a (Frame 4)

**Time:** 72 – 103s
**Delivery:** Firm, practical design guidance.

    Third and fourth, inheritance access and composition. Public inheritance preserves the base public interface: use it for a genuine is-a relationship. Protected inheritance hides that interface from ordinary callers, and private inheritance makes it an implementation detail. Both are rare. If the relationship is has-a or uses-a, prefer composition. A car has an engine; it is not an engine. Composition reduces coupling, protects encapsulation, and lets you replace or mock dependencies. Reserve inheritance for polymorphism and base classes deliberately designed for extension.

## Line 5 — PImpl buys a boundary (Frame 5)

**Time:** 103 – 126s
**Delivery:** Balanced; give equal weight to benefit and cost.

    Fifth, P Impl: pointer to implementation. Move private members into an Impl structure defined in the source file, and keep only a forward declaration plus a unique pointer in the header. The payoff is fewer compile-time dependencies and a more stable binary interface for libraries. The cost is an allocation, pointer indirection, less inlining, and extra copy semantics when copying is required. Use it at public library boundaries, not automatically for every internal class.

## Line 6 — Construction syntax changes meaning (Frame 6)

**Time:** 126 – 153s
**Delivery:** Crisp; let the vector comparison breathe.

    Sixth, initialization and copy elision. Parentheses perform direct initialization and may call explicit constructors. Equals syntax performs copy initialization and cannot. Braces reject narrowing, but initializer-list constructors receive priority, which explains why vector brace five means one element while vector parenthesis five means five elements. Finally, returning a temporary by value has guaranteed copy elision since C plus plus seventeen. Named return value optimization is common, but still not guaranteed. The syntax is not cosmetic; it changes overload selection and safety.

## Line 7 — Know the object model, then be precise (Frame 7)

**Time:** 153 – 181s
**Delivery:** Build confidence, then close with measured momentum.

    Seventh, trivial and trivially copyable are related, but not identical. Trivially copyable answers whether byte-wise copying is valid. Trivial also requires trivial default construction. Standard layout is a separate promise about memory layout, and P O D is the older combination, deprecated in C plus plus twenty. Eighth, covariant returns let an override return a pointer or reference to a more derived type, useful for clone-style A P I s without a cast. That is the walkthrough: choose ownership deliberately, use interfaces for substitution, inherit only for is-a, compose by default, hide implementation when the boundary justifies it, know your initialization forms, and be exact about the object model.
