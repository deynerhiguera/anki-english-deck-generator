# Quality Checklist

> Reference rules backed by `card-philosophy.md` and `style-guide.md`. When in conflict, philosophy wins.
>
> Each rule is tagged **HARD** (FAIL — the card is rejected unless the user explicitly overrides) or **SOFT** (WARN — the card is accepted and the warning is surfaced in the UI for the user to dismiss).
>
> The validator runs by default in **lenient mode**: only HARD failures block card acceptance. SOFT warnings always pass through to the UI as info banners. A toggle in settings (future) will let the user switch to **strict mode** if desired.

---

## A. Word (`Q1`–`Q4`)

| ID   | Rule                                                                                            | Tag   |
|------|-------------------------------------------------------------------------------------------------|-------|
| Q1   | `Word` is non-empty after trimming.                                                             | HARD  |
| Q2   | First character of `Word` is lowercase.                                                          | HARD  |
| Q3   | `Word` does not start or end with whitespace; no double-spaces inside.                          | HARD  |
| Q4   | `Word` contains no newline characters.                                                          | HARD  |

Verb prefix detection: if `Word` looks like a verb pattern (sample list: `forge`, `solve`, `figure`, `stick`, `keep`, `go`, `solve`, `debug`, `push`, `ship`, `review`, `break`, `run`, `occupy`, `nail`, `come`) and does NOT start with `to `, the validator flags it as **SOFT** so the user can confirm whether the prefix should be added.

---

## B. Meaning (`Q5`–`Q12`)

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q5    | `Meaning` is non-empty.                                                                            | HARD  |
| Q6    | `Meaning` length is between 4 and 18 words. Words defined as whitespace-separated tokens.          | HARD  |
| Q7    | `Meaning` contains no Spanish stopwords (`el`, `la`, `lo`, `los`, `las`, `de`, `del`, `que`, `con`, `para`, `por`, `sin`, `una`, `uno`, `es`, `son`, `está`, `están`, `ser`, `tener`, `hacer`). | HARD  |
| Q8    | `Meaning` does not begin with `the act of`, `used to`, `refers to`, `means`, `is when`, `this word`. | SOFT  |
| Q9    | `Meaning` does not contain etymology markers (`from latin`, `from old english`, `from greek`, `etymology`). | SOFT  |
| Q10   | `Meaning` does not contain double quotes (no nested “definitions of definitions”).                  | SOFT  |
| Q11   | If `Word` starts with `to ` → `Meaning` starts with `to `.                                         | HARD  |
| Q12   | If `Word` is an adverb (heuristic: ends in `-ly` and not a noun) → `Meaning` starts with `in a ` or `in an `. | SOFT  |

Q11 is HARD because it makes the meaning scroll naturally with the Word on the card front. Q12 is SOFT because some adverbs can be defined differently and the user often has a preferred phrasing.

---

## C. Example (`Q13`–`Q22`)

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q13   | `Example` is non-empty.                                                                           | HARD  |
| Q14   | `Example` contains the target `Word` as a complete token (whitespace or punctuation-bounded) at least once. | HARD  |
| Q15   | `Example` word count is between 6 and 20 inclusive.                                              | HARD  |
| Q16   | `Example` ends with `.`, `?`, or `!`.                                                            | HARD  |
| Q17   | `Example` is single-clause or two short clauses: it must not contain `;` (semicolon).             | SOFT  |
| Q18   | `Example` contains a subject — at least one of: `I`, `you`, `he`, `she`, `it`, `we`, `they`, or a capitalized common noun. | HARD  |
| Q19   | `Example` uses only present simple or past simple tense. Detect forbidden auxiliaries: `will`, `would`, `have been`, `has been`, `had been`, `might`, `could`, `should`, `going to`, `was going to`, `were going to`. | SOFT  |
| Q20   | `Example` does not contain greetings (`Hello`, `Hi`, `Hey there`, `Dear `, `Greetings`).         | SOFT  |
| Q21   | `Example` does not contain textbook-character names (`John`, `Mary`, `Peter`, `Anna`).            | SOFT  |
| Q22   | `Example` topic fits one of the seven style-guide clusters (A–G in `style-guide.md` §9).           | SOFT  |

Q14 is HARD — without the target word in the Example, the cloze is broken. Q15 and Q18 are HARD because Anki layout depends on them. Q17, Q19, Q20, Q21 stay SOFT — common phrasing sometimes pushes past these niceties and the user should decide.

If Q14 fails because the `Word` is a multi-word expression and the Example uses only part of it (e.g. `Word = to stick to` but Example says `stick with it`), that is HARD — the unit must appear whole.

---

## D. Cloze (`Q23`–`Q26`)

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q23   | `Cloze` is non-empty.                                                                             | HARD  |
| Q24   | `Cloze` contains exactly one occurrence of `{{c1::` and exactly one matching `}}`.                | HARD  |
| Q25   | The text inside `{{c1::...}}` equals `Word` verbatim.                                             | HARD  |
| Q26   | Replacing the cloze markup and inner text with `Word` yields a string identical to `Example`.     | HARD  |

If Q24 fails, rebuild the field rather than emit. Never silently pass.

---

## E. IPA (`Q27`–`Q32`)

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q27   | `IPA` is non-empty.                                                                               | HARD  |
| Q28   | `IPA` matches the shape `/[^/]+/` (single pair of slashes, non-empty inside).                   | HARD  |
| Q29   | Inside the slashes, only characters from the IPA inventory: `ˈ ˌ a æ ɑ ɔ ɛ e ɜ ɪ i ʊ u ʌ ə ɝ aɪ aʊ oʊ ɔɪ ɛɪ ʊə ɪə eɪ əʊ p b t d k g f v θ ð s z ʃ ʒ h m n ŋ l r w j ʍ tʃ dʒ ɹ ɾ ʔ ɾ ˞ ɫ ɚ aɪ ɑ ɒ + space . ː`. | HARD  |
| Q30   | No British-only `ɒ` symbol anywhere in `IPA`. (Use `ɑ` instead.)                                 | HARD  |
| Q31   | If `Word` starts with `to `, then inside the slashes the first token is one of `tə`, `tu`, `tʊ`, `tɑ`, matching the second syllable of `to`. | HARD  |
| Q32   | Stress mark `ˈ` is present if and only if the Word (excluding `to ` prefix) has more than one syllable. | SOFT  |

IPA is HARD because Anki rendering glitches on bad IPA and the user hears the mistake every review. Stress-mark placement is SOFT — IPA databases disagree and the user can correct it.

---

## F. Audio (`Q33`–`Q36`)

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q33   | `Sound` field is empty.                                                                           | HARD  |
| Q34   | `Sound_Example` matches the regex `^\[sound:[a-z0-9 .\-]+\.mp3\]$`.                              | HARD  |
| Q35   | The filename portion of `Sound_Example` matches `^<word>-<digits>\.mp3$` where `<word>` equals `Word` with spaces preserved and `<digits>` matches the unix-milliseconds pattern produced by `CardBuilder`. | HARD  |
| Q36   | If `Word` starts with `to `, the filename prefix is `to <rest>-`.                                 | HARD  |

All audio format rules are HARD — a malformed `[sound:...]` reference silently breaks the card.

---

## G. Field completeness (`Q37`–`Q39`)

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q37   | All seven fields (`Word`, `Sound`, `Sound_Example`, `Meaning`, `Example`, `IPA`, `Cloze`) are present. | HARD  |
| Q38   | No field contains the literal string `undefined`, `null`, `NaN`.                                  | HARD  |
| Q39   | Total combined `Meaning` + `Example` word count is under 35.                                       | SOFT  |

Q39 is SOFT — sometimes a slightly longer example is worth it.

---

## H. Philosophy alignment (`Q40`–`Q45`)

All SOFT. The validator emits these as info banners; the user decides whether to accept.

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q40   | `Meaning` does not read like a dictionary entry. Heuristic: presence of formal markers (`formal`, `archaic`, `noun:`, `verb:`) triggers a warning. | SOFT  |
| Q41   | `Example` does not sound textbook-like. Heuristic flags `this is because`, `for example`, `such as`, `in conclusion`. | SOFT  |
| Q42   | `Example` includes at least one Cluster A–G marker keyword if any fit the target word naturally.   | SOFT  |
| Q43   | `Example` is not overly positive (`amazing`, `awesome`, `incredible`, `perfect`) — flags tonal pushiness. | SOFT  |
| Q44   | At least one of `Example` / `Meaning` references a topic from Cluster A (software engineering) or Cluster B (AI) if the target word is plausibly tech-adjacent. Small allowlist (informal list, grows over time): `debug, deploy, build, ship, test, code, commit, push, review, refactor, branch, merge, rollback, monitor, log, token, prompt, model, agent, retrieval`. | SOFT  |
| Q45   | `Example` and `Meaning` do not name the user in third person (`Deyn`, `Deyner`, possessive forms). | HARD  |

Q45 is HARD — naming the user breaks the illusion that the card could belong to anyone learning the language.

---

## I. Batch-level checks (`Q46`–`Q48`)

Run after the per-card HARD/SOFT pass. Surfaces only at batch level.

| ID    | Rule                                                                                              | Tag   |
|-------|---------------------------------------------------------------------------------------------------|-------|
| Q46   | Subject-pronoun distribution of the batch is within ±20% of `style-guide.md` §4 target (60/20/10/10 ±20). | SOFT  |
| Q47   | No two consecutive cards reuse the exact same Example template (subject + verb + object skeleton).  | SOFT  |
| Q48   | At least one card in the batch belongs to each of Cluster A and Cluster C across a 10-card batch.  | SOFT  |

Q46's tolerances: I in 48–72%, We in 8–28%, You in 0–20%, Other in 0–20%. SOFT — close enough is fine.

---

## Default execution behavior

* **HARD fail**: the CardBuilder retries up to 2 times with the rule ID appended to the user message. After 2 retries the card is sent to the UI's "needs review" pile with the failing rules listed and an explicit Accept Anyway button.
* **SOFT warning**: the card is accepted, the warning ID and one-line explanation appear in the UI as an info chip. The user can dismiss or regenerate.
* **Strict mode** (future, off by default): all SOFT rules become HARD. Toggle in settings.
* **Override** (always available): on any HARD fail, the user can click Accept Anyway to push the card through unchanged.

The validator never silently rewrites a card. It only accepts, warns, or rejects.
