# Style Guide

> Source of truth for the visual and structural format of every card this app generates in deck `English Automatic`.
> Backed by `card-philosophy.md`. When in conflict, philosophy wins.

---

## 1. Model fields (exact seven)

Every card occupies exactly these fields, in this order. Nothing more, nothing less.

| Field           | Always present | Value                                       |
|-----------------|----------------|---------------------------------------------|
| `Word`          | yes            | target vocabulary unit                      |
| `Sound`         | yes            | empty string (see §7)                       |
| `Sound_Example` | yes            | `[sound:filename.mp3]` reference            |
| `Meaning`       | yes            | English functional definition               |
| `Example`       | yes            | one full natural sentence                   |
| `IPA`           | yes            | American phonetic transcription             |
| `Cloze`         | yes            | Example with target replaced by cloze markup|

The app **never** adds or renames fields. It only fills them.

---

## 2. Word

* Lowercase first letter always.
* Multi-word expressions are treated as a single unit. Never split them apart.
* Verbs and phrasal verbs are prefixed with `to `:
  * `to stick to`, `to figure out`, `to keep up`, `to go through`
* Adverbs, adjectives, and nouns appear as-is, no `to`:
  * `steadily`, `reluctant`, `auto-renewal`, `forge`, `occupy`
* No trailing spaces. No line breaks.

**Examples**

| Input             | Normalized `Word` |
|-------------------|-------------------|
| "Stick to"        | `to stick to`     |
| "stick to"        | `to stick to`     |
| "STICK TO"        | `to stick to`     |
| "Steadily"        | `steadily`        |
| "auto-renewal"    | `auto-renewal`    |
| "to figure out"   | `to figure out`   |

---

## 3. Meaning

A short, functional description of how the word is actually used. Written the way a good English teacher would explain it. Not a dictionary entry. Never translated into Spanish.

### Format rules

* 5–15 words. Aim for the lower end when possible.
* Verbs and verb phrases → start with `to <infinitive>`.
* Adverbs → start with `in a/an <...> manner/way`.
* Adjectives → describe the quality the word points to.
* Nouns → describe the thing in plain language.
* Two common senses may be joined with ` or `.
* Useful context optional, between commas:
  * `to experience or deal with something, often something difficult or challenging`
* English only. No Spanish words, no parenthetical translations.
* Do not start with "the act of", "used to", "refers to", "means", "is when".
* Do not end with a period. (Anki field, no terminal punctuation unless necessary.)
* No examples inside the meaning.

**Good**

```
to continue doing something despite difficulties or to follow a plan or principle
to find an answer to a problem or question
to stay at the same level or pace as someone or something
in a regular or even manner; without sudden changes
```

**Bad**

```
The act of continuing to do something even when it is hard.  // ✗ "act of", period, too long
```

---

## 4. Example

One complete, natural-sounding English sentence that uses the target word exactly as a person would say it today.

### Length and shape

* 8–15 words. Aim for 9–12.
* Starts with a capital letter. Ends with `.` (period).
* Subject is typically a pronoun or a generic person: `I`, `She`, `He`, `You`, `We`, `They`, or a domain-agnostic noun.
* Tense: present simple or past simple. Avoid future, avoid perfect tenses, avoid conditionals.
* Single sentence. No semicolons, no multiple clauses joined with `but` and `however`.

### Pronoun distribution

Across a batch, subject pronouns should follow this distribution target. Roughly:

| Pronoun | Target share | Why                                              |
|---------|--------------|--------------------------------------------------|
| `I`     | ~60%         | First-person thinking is what fluency produces.  |
| `We`    | ~20%         | Team / collaboration is half of working life.    |
| `You`   | ~10%         | Advice, generic truths, direct prompts.          |
| Other   | ~10%         | `The team`, `Engineers`, `She`, `He`, etc.       |

Generated batches should be checked after the fact against this distribution. A single card may be any pronoun; the distribution goal applies to the batch as a whole. `She` / `He` are allowed but capped — never let the batch become a wall of third-person examples.

### Realism: the 30-day rule

Every example should be something the user could realistically say within the next 30 days.

* The scenario must be present or near-future, not a distant hypothetical.
* The action must be repeatable: it is the kind of sentence the user would actually keep saying.
* Avoid once-in-a-lifetime setups (`My book launched last week`, `I retired in March`).
* Hobbies, habits, and work routines are fair game; trips-of-a-lifetime are not.
* When in doubt, ask: "Would I say this out loud sometime next month?" If no, rewrite.

### Reusability

Prefer sentences that can be reused in conversations. The example should be a sentence the user keeps coming back to, not a one-off caption.

* The structure should generalize: subject + verb + concrete object + simple context.
* Avoid details that pin the sentence to one moment in time (`last Tuesday`, `on Friday's call`, `at Sarah's birthday`).
* Avoid proper-noun characters. `My coworker Diana showed me...` does not generalize.
* Vague-but-plausible details are fine: `every morning`, `on weekends`, `before standup`, `with my team`.
* The whole point is that the sentence is a portable phrase the user can drop into a real conversation tomorrow.

### Topic selection

Examples lean into the user's real life (per `card-philosophy.md`) but never artificially. Preferred topics, in this priority order:

1. Software engineering, debugging, code review, deployments, AI tooling.
2. Learning English explicitly — talking about it, practicing, struggling, improving.
3. Building personal projects — side projects, experiments, prototypes.
4. Mindset and growth — consistency, discipline, persistence, hard work.
5. Gym, training, basketball, body as a system.
6. Daily life and routine.

Use the first one that produces a sentence that does not feel forced. If a topic does not fit the target word, drop down the list. If nothing fits, daily life is the floor.

### Tone

* Sounds like a thought, not a textbook line.
* Does not name the user in third person.
* Does not pair unrelated hobbies (no `I debug at the gym while reading about AI`).
* Avoids textbook characters (`John and Mary`, `the teacher said`).
* Avoids fabricated scenarios (`I went to Antarctica to debug a server`).
* Can mention realistic places, tools, and habits: `TypeScript`, `PR`, `pull request`, `commit`, `terminal`, `the gym`, `morning routine`, `this song`.
* Reusable across conversations (see "Reusability" above).

**Good**

```
It's important to stick to your coding routine even when you don't feel motivated.
I need to debug this before pushing the PR to the main branch.
She studied English every morning for thirty minutes, steadily.
```

**Bad**

```
John and Mary stuck to the plan.        // ✗ textbook characters
It is important to stick to something.  // ✗ no real context
I will be sticking to it.               // ✗ future tense, vague
```

---

## 5. Cloze

* The `Cloze` field equals the `Example` field, with the entire target word or expression replaced by literal underscores.
* Format: `______` (six underscores, ASCII).
* Exactly **one** blank per card.
* Hide the complete unit. Never partially hide it.
* The user's existing Anki note type "English Active Recall" is a regular Question/Answer template (not an Anki Cloze type), so the Cloze field is rendered as plain text. Anki's `{{c1::...}}` syntax only renders as a real Cloze card when the template uses `{{cloze:Field}}` — which this model does not. Therefore the field is a literal fill-in-the-blank.

**Form**

```
Example:  It's important to stick to your coding routine even when I don't feel motivated.
Cloze:    It's important to ______ your coding routine even when I don't feel motivated.
```

**Bad**

```
Cloze: It's important to ___ to your coding routine ...        // ✗ splits the unit
Cloze: It's important to stick to your coding routine ...      // ✗ no blank
Cloze: ______ important to stick to your coding routine ...    // ✗ hides wrong unit
Cloze: It's important to {{c1::stick to}} ...                 // ✗ Cloze syntax does not render in this model
```

Existing cards in the deck already use this exact convention. The app continues to write `______` for new cards. Matching the existing deck format keeps the deck visually consistent.

---

## 6. IPA

* American English. Always.
* Wrapped in forward slashes.
* Syllables inside the slashes are separated by a single space.
* Primary stress `ˈ` placed before the stressed syllable.
* If the Word begins with `to `, the `to` is part of the transcription: `to stick to` → `/tə stɪk tu/`.
* No syllable stress mark on monosyllabic words.
* Avoid British-only symbols: never use `ɒ` (use `ɑ` for the short-o sound in words like `solve`, `hot`, `stop`).
* No commas, no period, no extra punctuation outside the slashes.

**Examples**

| Word              | IPA                  |
|-------------------|----------------------|
| to stick to       | `/tə stɪk tu/`       |
| to solve          | `/tə sɑlv/`          |
| to keep up        | `/tu kip ʌp/`        |
| to go through     | `/tə ɡoʊ θru/`       |
| to figure out     | `/tə ˈfɪɡ·jər aʊt/`  |
| steadily          | `/ˈstɛd·ə·li/`       |

For multi-word expressions the slashes wrap the whole thing, spaces preserved between words inside.

---

## 7. Audio

* `Sound` field is always **empty**. The app does not write to it.
* `Sound_Example` field contains a single Anki sound reference:
  ```
  [sound:to stick to-1777658396030.mp3]
  ```
* Filename rules:
  * Format: `<word>-<unix-milliseconds>.mp3`
  * Spaces preserved in the filename exactly as they appear in `Word`.
  * Lowercase audio.
  * Always `.mp3`.
* TTS voice default: `nova`. Configurable via `OPENAI_TTS_VOICE` in `.env`.
* Each `CardBuilder.build` call generates two audio assets internally (the word alone and the example sentence) but only the example audio is wired to the note. The word-only audio is preserved in `./media/` for diagnostics and future use.

---

## 8. Anti-patterns

Each of these is explicitly **not** allowed in generated cards. The card-validator catches them automatically.

* Definitions that begin with "the act of", "used to", "refers to", "means", "is when".
* Any Spanish word in Meaning or Example.
* Etymology notes ("from Old English", "from Latin").
* Textbook characters ("John", "Mary", "the teacher").
* Greetings ("Hello", "Hi there").
* Future tense or conditional verbs in Example.
* Cloze that hides less than the full target unit.
* Cloze that hides two separate parts of the same Example.
* British IPA symbols (specifically `ɒ`).
* IPA with comma, period, or punctuation outside the slashes.
* Sound field filled with anything.
* Example under 6 words or over 20.
* Sentences that mention three or more unrelated topics at once.
* Forced motivational language when it does not fit the target word.
* Examples that pin themselves to one moment in time (`last Tuesday`, `at Sarah's birthday`, `on Friday's standup`).
* Examples that describe a once-in-a-lifetime event the user could not realistically repeat.
* Batches where every card uses the same subject pronoun (mix is required, see §4).

---

## 9. Topics vocabulary (for prompt guidance)

The PromptBuilder selects Example scenarios from these clusters. The first cluster that yields a natural sentence wins.

**Cluster A — Software engineering**
debug, commit, deploy, refactor, ship, review, merge, run into, break, ship, push, regression, edge case, runtime, build, test, hotfix, rollback, log, monitor, incident, postmortem

**Cluster B — AI**
model, prompt, token, context, hallucinate, fine-tune, inference, agent, retrieval, embedding, evaluation

**Cluster C — Learning English**
vocabulary, pronunciation, grammar, sentence, structure, intonation, fluency, accent, idiom, phrasal verb, native speaker

**Cluster D — Personal projects and side builds**
personal project, side project, prototype, experiment, weekend, scratch, rewrite

**Cluster E — Mindset and discipline**
routine, habit, consistency, keep going, show up, give up, momentum, plateau, breakthrough

**Cluster F — Body and gym**
workout, set, rep, PR (personal record), recovery, sleep, hydration, soreness, warmup, cooldown

**Cluster G — Daily life**
morning, coffee, commute, deadline, calendar, inbox, meeting, message, call

---

## 10. Decision table for the prompt

When the generator faces a choice, follow this exact priority:

1. Does the Example fit Cluster A or B (tech/SWE/AI)? Use it.
2. Else does it fit Cluster C (English-learning explicitly)? Use it.
3. Else Cluster D (personal projects)? Use it.
4. Else Cluster E (mindset/discipline)? Use it.
5. Else Cluster F (gym/body)? Use it.
6. Else Cluster G (daily life). Floor.
7. If none fits, fall back to a clean daily-life sentence. Never invent forced context.

Anti-patterns in §8 always override topic choice. A technically-on-topic sentence that violates an anti-pattern must be regenerated.
