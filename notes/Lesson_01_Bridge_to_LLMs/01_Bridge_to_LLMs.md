# Lesson 1: Bridge to LLMs (Day 23)

> **Goal:** Look inside ChatGPT-style models. Build a tiny one ourselves, from the bottom floor to the top floor, using one sentence: **"i drink sweet ___" → the model must guess "tea"**.

---

## 📚 The Big Words You Need First

Before writing a single line of code, let's understand the vocabulary:

| Word | What it Means | Real-World Example |
|------|---------------|--------------------|
| **Language** | Human words (English, Urdu) and code | Everything you type or speak |
| **Model** | A program that learned patterns from examples | Your phone's autocorrect learned from millions of messages |
| **LLM** | **L**arge **L**anguage **M**odel — a very big model that guesses the next word | ChatGPT, Claude, Gemini |
| **Parameters** (weights) | The numbers a model **learns** during training. "Large" means a huge number of them | Like a student's memory — more memory = more knowledge |
| **SLM** | **S**mall **L**anguage **M**odel — same idea, but smaller. Runs on a laptop or phone | Like a village clinic vs a big hospital |
| **Transformer** | The **design** (shape) of the network inside an LLM | Like how a CNN is the design for images, a Transformer is the design for text |

### How Big Are These Models?

| Model | Parameters (learned numbers) |
|-------|------------------------------|
| A tiny classroom neural network | 147 |
| A slightly bigger one | 5,130 |
| SLM (small language model) | 1 to 8 **billion** |
| LLM (large language model) | 100 **billion** or more |

> **Everyday analogy:** An LLM is a big hospital with every kind of doctor. An SLM is a village clinic: fast and cheap, but not for everything.

---

## 🏗️ The 8-Layer Architecture

We climb 8 floors (layers). **Each floor fixes a problem of the floor below.**

```
TOP     Layer 7   The real LLM          the same recipe, but huge
          ▲
        Layer 6   Repeat               write a full sentence, word by word
          ▲
        Layer 5   Softmax              scores → chances → pick the next word
          ▲
        Layer 4   Attention            look at the useful words  ← the HEART of Transformer
          ▲
        Layer 3   Words → numbers      tokens, IDs, embeddings
          ▲
        Layer 2   Count (more words)   works, but breaks on new phrases
          ▲
        Layer 1   Count and guess      works, but gets a tie
          ▲
BOTTOM  Layer 0   The goal              guess the next word
```

---

## Layer 0: The Goal — Autocomplete

| New Word | Meaning |
|----------|---------|
| **Next-word prediction** | Look at the text so far, and guess the word that comes next |
| **Autocomplete** | A tool that suggests the next word. Your phone keyboard has one |

**Key insight:** An LLM does the same as your phone keyboard, but much better. Its **only job** is to guess the **next word**. Then add it and guess again.

```
i drink sweet  →  tea
i drink sweet tea  →  .
```

Every layer in this lesson is a better way to make this **one guess**.

> **Think about it:** On your phone you type "good". Which word will it suggest? **"morning"** (or "luck"). The phone has seen "good morning" many times, so it guesses the word that came next most often.

---

## Layer 1: Count and Guess

| New Word | Meaning |
|----------|---------|
| **Training text** | The text the model learns from. Ours is 4 small sentences |
| **Counter** | A Python tool that counts how many times each item appears |

**Idea:** Look at lots of text. After the word "sweet", which word came **most often**? Guess that one.

> **Everyday analogy:** A shopkeeper notices that after "sweet", customers ask for tea most of the time. So he starts the tea.

### The Code

```python
from collections import Counter    # counts how many times each item appears

text = ["i drink sweet tea",
        "we drink sweet tea",
        "i eat sweet apple",
        "we eat sweet apple"]

after_sweet = Counter()            # a counter: word → how many times

for sentence in text:
    w = sentence.split()           # cut into words
    for i in range(len(w) - 1):    # look at each word and the one after it
        if w[i] == "sweet":
            after_sweet[w[i + 1]] += 1   # count the word that came after "sweet"

print(after_sweet)                 # Counter({'tea': 2, 'apple': 2})
```

### Why This Code?

- `Counter()` — This is from Python's built-in `collections` module. It's a special dictionary that counts things. Instead of writing `my_dict[word] = my_dict.get(word, 0) + 1`, you just write `counter[word] += 1`.
- `sentence.split()` — Splits a string by spaces into a list of words. `"i drink sweet tea"` becomes `["i", "drink", "sweet", "tea"]`.
- `range(len(w) - 1)` — We go up to the second-to-last word because we always look at `w[i + 1]` (the next word). If we went to the very last word, `w[i + 1]` would crash with an IndexError.

### The Problem: It's a Tie!

**Result:** `tea: 2, apple: 2`. Both words appeared after "sweet" exactly 2 times. The model cannot choose.

**What breaks:** One word is not enough context. We need to look at **more words**. → Layer 2

---

## Layer 2: Count with More Words (Context)

| New Word | Meaning |
|----------|---------|
| **Context** | The words around (before) the word we want to guess. It gives clues |
| **Dictionary `{}`** | A Python table: a **key** (what we look up) and a **value** (the answer) |

**Idea:** Don't use only the last word. Use the **last two words**.

- `drink sweet` → tea
- `eat sweet` → apple

> **Everyday analogy:** "sweet" alone is not enough. "drink sweet" and "eat sweet" are different questions. The word before it is the clue.

### The Code

```python
table = {}                                # (word before, last word) → counter of next words
for sentence in text:
    w = sentence.split()
    for i in range(1, len(w) - 1):
        key = (w[i - 1], w[i])            # a tuple of two words as the key
        table.setdefault(key, Counter())[w[i + 1]] += 1

print(table[("drink", "sweet")])          # Counter({'tea': 2})  → no tie now!
print(table[("eat", "sweet")])            # Counter({'apple': 2})
```

### Why This Code?

- `(w[i - 1], w[i])` — A **tuple** (pair) of two words. We use TWO words as the key instead of one. This gives us more context.
- `table.setdefault(key, Counter())` — If `key` doesn't exist in `table` yet, create it with an empty Counter. Then add to it. This avoids a KeyError.
- `range(1, len(w) - 1)` — We start from index 1 (not 0) because we need `w[i - 1]` (the word before). We stop at `len(w) - 1` because we need `w[i + 1]` (the word after).

### The Tie is Gone!

`"drink sweet"` → tea (2 times, no competition). More context fixed it.

### But What Breaks Now?

```python
print(table.get(("drink", "sugary")))     # None: the table has no answer
```

The table only knows **exact phrases it has seen**. It doesn't know "sugary" ≈ "sweet". To remember every possible phrase, the table would grow forever.

**What we need:** A way to say "sugary" and "sweet" mean almost the same thing. For that, **words must become numbers**. → Layer 3

---

## Layer 3: Words Become Numbers

A computer cannot read words. We do **3 small steps**:

1. **Tokens**: cut the text into pieces
2. **Token IDs**: give each piece a number (like a roll number)
3. **Embeddings**: give each piece a **list of numbers that describes its meaning**

| New Word | Meaning |
|----------|---------|
| **Token** | One piece of text. A word, or part of a word |
| **Tokenizer** | The tool that cuts text into tokens |
| **Vocabulary** | The list of all tokens the model knows |
| **Token ID** | The position of a token in the vocabulary (its roll number) |
| **Vector** | A list of numbers, like `[0, 2, 0, 0]` |
| **Embedding** | The vector that describes one token's meaning |

### Step 3a: Tokens (Cutting Text into Pieces)

```python
sentence = "i drink sweet"
tokens = sentence.split()        # cut at the spaces
print(tokens)                    # ['i', 'drink', 'sweet']
```

**Why `split()`?** In our toy model, we keep it simple: 1 word = 1 token. A **real** tokenizer (like GPT-4's) cuts words into smaller **pieces**:

```python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")    # the GPT-4 tokenizer
```

| Word | Tokens | Count |
|------|--------|-------|
| `"I drink sweet tea."` | `['I', ' drink', ' sweet', ' tea', '.']` | 5 tokens |
| `"chaiwala"` | `['chai', 'w', 'ala']` | 3 tokens |
| `"unbelievable"` | `['un', 'belie', 'vable']` | 3 tokens |
| `"Lahore"` | `['L', 'ah', 'ore']` | 3 tokens |

**Why sub-word tokens?** If the tokenizer doesn't know a word (like "chaiwala"), it cuts it into pieces it DOES know. This way, it never gets stuck on unknown words.

### Step 3b: Token IDs (Roll Numbers)

```python
vocab = ["i", "drink", "eat", "sweet", "tea", "apple"]  # position 0, 1, 2, 3, 4, 5

ids = [vocab.index(t) for t in tokens]    # find each token's position
print(ids)                                # [0, 1, 3]
```

**Why?** The word "i" is at position 0, "drink" at position 1, "sweet" at position 3. The computer now has numbers instead of strings.

**What happens if a word isn't in the vocabulary?** `vocab.index("mango")` would crash. Real tokenizers never get this error — they cut unknown words into smaller pieces they DO know.

### Step 3c: Embeddings (Vectors That Carry Meaning)

An **ID is only a label.** ID 4 is not "closer" to ID 3 in meaning. So each token gets a **vector**: a list of numbers that says what the word is about.

```python
import numpy as np

#             person drink food sweet
E = np.array([[3,     0,    0,   0],    # 0 "i"     → person
              [0,     2,    0,   0],    # 1 "drink" → drink
              [0,     0,    2,   0],    # 2 "eat"   → food
              [0,     1,    1,   1],    # 3 "sweet" → drink? food? not sure!
              [0,     2,    0,   1],    # 4 "tea"   → drink + sweet
              [0,     0,    2,   1]],   # 5 "apple" → food + sweet
             dtype=float)

vectors = E[ids]           # take the rows for our IDs [0, 1, 3]
print(vectors)
# [[3. 0. 0. 0.]    ← "i"
#  [0. 2. 0. 0.]    ← "drink"
#  [0. 1. 1. 1.]]   ← "sweet"
```

**Why this `E` table?**
- `E` stands for **Embedding matrix** — a table where each row is a word's meaning as numbers.
- Our vectors have 4 numbers with names: **person, drink, food, sweet**.
- `E[ids]` — NumPy fancy indexing. `ids = [0, 1, 3]`, so this grabs rows 0, 1, and 3 from the table.
- **Real models** use 768 or more numbers per token (not 4), and the numbers are **learned** during training (not hand-written like ours).

### Step 3d: Dot Product = Similarity

How do we measure if two words are close in meaning?

| New Word | Meaning |
|----------|---------|
| **Dot product** | **Multiply the matching numbers, then add** |
| **Similarity** | How close two meanings are. Big dot product = similar. 0 = nothing in common |

```python
tea = E[vocab.index("tea")]       # [0, 2, 0, 1]
for word in vocab:
    print(f"tea · {word:7} = {np.dot(tea, E[vocab.index(word)])}")
```

**Result:**
```
tea · i       = 0.0    ← nothing in common
tea · drink   = 4.0    ← very similar! both are "drink" things
tea · eat     = 0.0    ← nothing in common
tea · sweet   = 3.0    ← somewhat similar
tea · tea     = 5.0    ← identical (of course)
tea · apple   = 1.0    ← only "sweet" in common
```

**Why `np.dot(a, b)`?** It multiplies matching positions and adds:  
`tea · drink = (0×0) + (2×2) + (0×0) + (1×0) = 4`

This is the **same "multiply and add"** as a CNN filter and a Dense neuron. It's the fundamental operation in all of deep learning.

---

## Layer 4: Attention — The Heart of the Transformer

| New Word | Meaning |
|----------|---------|
| **Attention** | Each word looks at the other words and **listens more to the useful ones** |
| **Weights** (attention weights) | How much to listen to each word. They add up to 1 |
| **Softmax** | Turns scores into weights (or chances) that add up to 1 |
| **Weighted average** | Mix the vectors, giving the bigger weights a bigger share |

### The Problem (Same Tie as Layer 1)

If we use only the last word "sweet" to score every word in the vocabulary:

```python
sweet = E[vocab.index("sweet")]       # [0, 1, 1, 1]
for word, score in zip(vocab, E @ sweet):
    print(f"{word:7} {score}")
```

```
i       0.0
drink   2.0
eat     2.0
sweet   3.0
tea     3.0     ← TIE!
apple   3.0     ← TIE!
```

Tea 3, apple 3, sweet 3 → **a tie!** "sweet" alone doesn't know if it's about drinking or eating. It needs to look back at "drink".

### The Fix: Attention (3 Small Steps)

> **Everyday analogy:** In a noisy room you hear many voices, but you **listen more** to the person talking to you.

```python
def softmax(scores):
    e = np.exp(scores)          # e to the power of each score
    return e / e.sum()          # divide by total → chances that add up to 1

# Our sentence vectors: "i" [3,0,0,0], "drink" [0,2,0,0], "sweet" [0,1,1,1]
query = vectors[-1]             # Step 0: the last word "sweet" is the query

# Step 1: SCORE — dot product of "sweet" with each word in the sentence
att_scores = vectors @ query    # sweet · i, sweet · drink, sweet · sweet
print("scores: ", att_scores)   # [0, 2, 3]

# Step 2: SOFTMAX — scores → weights that add up to 1
weights = softmax(att_scores)
print("weights:", weights)      # [0.035, 0.259, 0.705]

# Step 3: WEIGHTED AVERAGE — mix the vectors, giving bigger weights a bigger share
mix = weights @ vectors
print("sweet before:", query)   # [0, 1, 1, 1]
print("sweet after: ", mix)     # [0.105, 1.224, 0.705, 0.705]
```

### What Just Happened?

Look at "sweet" before and after attention:
- **Before:** `[0, 1, 1, 1]` → drink=1, food=1 (equally confused)
- **After:**  `[0.105, 1.224, 0.705, 0.705]` → drink went UP (1→1.22), food went DOWN (1→0.71)

The word "sweet" now **knows it is about a drink** because it listened to "drink" in the sentence!

### Why Each Line?

- `vectors @ query` — Matrix multiplication. This computes the dot product of every word's vector with the query word ("sweet"). High score = that word is useful to "sweet".
- `softmax(att_scores)` — Converts raw scores `[0, 2, 3]` into probabilities `[0.035, 0.259, 0.705]` that add up to 1.0. The biggest score gets the biggest share.
- `weights @ vectors` — Weighted average. "sweet" gets 70.5% of itself, 25.9% of "drink", and 3.5% of "i". The result is a NEW vector that carries information from the whole sentence.

> **This is the heart of the Transformer.** In the architecture picture, the purple "Attention" box does exactly these 3 steps: score, softmax, weighted average.

---

## Layer 5: Score Every Word, Softmax, Pick

| New Word | Meaning |
|----------|---------|
| **Score** | A number that says how well a word fits as the next word |
| **Chance** | A score turned into a percentage by softmax. All chances add up to 100% |

Now we have a better "sweet" (the `mix` vector that knows it's about drinking). Compare it with **every word in the vocabulary**:

```python
scores = E @ mix                      # dot product of mixed "sweet" with every word
chances = softmax(scores)

for i in np.argsort(-chances):        # biggest chance first
    print(f"{vocab[i]:7} score {scores[i]:.2f}   chance {chances[i]:.1%}")

print("Next token:", vocab[chances.argmax()])
```

**Result:**
```
tea     score 3.15   chance 37.4%    ← WINNER!
sweet   score 2.64   chance 22.2%
drink   score 2.45   chance 18.5%
apple   score 2.12   chance 13.2%    ← was tied, now behind
eat     score 1.41   chance 6.5%
i       score 0.32   chance 2.2%
Next token: tea
```

### The Tie is Gone!

**Tea wins (37.4%), apple only 13.2%.** Attention fixed what counting could not.

### Why Each Line?

- `E @ mix` — Dot product of our attention-enhanced "sweet" vector with EVERY word in the vocabulary. This scores how well each word fits as the next word.
- `softmax(scores)` — Converts scores into probabilities (chances).
- `np.argsort(-chances)` — Returns indices that would sort the array in descending order (biggest first). The `-` makes it descending.
- `chances.argmax()` — Returns the index of the highest probability.

---

## Layer 6: Put It Together and Repeat

| New Word | Meaning |
|----------|---------|
| **Function** | A saved set of steps we can run again with one name |
| **Loop (repeat)** | Add the new word to the text and guess again |

One function = Layers 3 to 5. Then we **add the new token and run again**. This is how an LLM writes a whole answer, one word at a time.

```python
def next_token(words):
    vectors = E[[vocab.index(w) for w in words]]     # tokens → IDs → vectors
    weights = softmax(vectors @ vectors[-1])          # attention weights for last word
    mix = weights @ vectors                           # weighted average
    chances = softmax(E @ mix)                        # score every word → chances
    return vocab[chances.argmax()], chances

words = ["i", "drink", "sweet"]
for step in range(3):                                # 3 passes = 3 new tokens
    word, chances = next_token(words)
    print(" ".join(words), "→", word, f"({chances.max():.0%})")
    words.append(word)                               # add the guess, then repeat
```

**Result:**
```
i drink sweet → tea (37%)
i drink sweet tea → tea (59%)
i drink sweet tea tea → tea (62%)
```

### Why "tea tea tea"?

Our toy has only 6 words and was never trained. A real LLM:
- Learned from huge amounts of text that "tea tea tea" almost never happens
- Has thousands of tokens to choose from
- Sometimes picks a token that is NOT the top one (this randomness is called **temperature**)

---

## Layer 7 (Top): The Real LLM

| New Word | Meaning |
|----------|---------|
| **Feed-forward** | A small network (like a Dense layer) that "thinks" about each word after attention |
| **Pre-training** | Learning from huge text by guessing hidden words |
| **Loss** | A number that says how wrong the guess was |
| **Gradient descent** | Change the weights a little so the loss gets smaller |
| **Fine-tuning** | Extra training on good question-and-answer examples |
| **Inference** | Using the finished model. The weights are fixed |

Our toy and a real LLM follow **the same recipe**:

| In Our Toy | In a Real LLM |
|------------|----------------|
| 6 words | ~100,000 tokens |
| 4 numbers per word, **we wrote them** | 768 to 12,000+ numbers, **learned** |
| **1** attention step | attention + feed-forward, **repeated 12 to 100+ times** |
| nothing learned | trained on huge text |

### How is a Real LLM Trained? (Same Loop as Neural Networks)

1. **Pre-training:** Show a sentence with the last word hidden (`i drink sweet ___`). The model guesses. The **loss** says how wrong it was. **Gradient descent** changes the weights a little. Repeat **billions** of times on books, websites, and code.
2. **Fine-tuning:** Train more on good question-and-answer examples (and human ratings), so it behaves like a helpful assistant.
3. **Inference:** The weights are now fixed. It only does the steps we built today: guess, add, repeat.

---

## ✅ Complete Code (Everything in One Cell)

```python
import numpy as np

def softmax(scores):
    e = np.exp(scores)
    return e / e.sum()

# Layer 3: tokens → IDs → embeddings (person, drink, food, sweet)
vocab = ["i", "drink", "eat", "sweet", "tea", "apple"]
tokens = "i drink sweet".split()
ids = [vocab.index(t) for t in tokens]

E = np.array([[3, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0],
              [0, 1, 1, 1], [0, 2, 0, 1], [0, 0, 2, 1]], dtype=float)
vectors = E[ids]

# Layer 4: attention for the last word
weights = softmax(vectors @ vectors[-1])
mix = weights @ vectors

# Layer 5: score every word, softmax, pick
chances = softmax(E @ mix)
print("Next token:", vocab[chances.argmax()], f"({chances.max():.1%})")   # tea (37.4%)
```

---

## 🎯 Key Takeaways

1. An **LLM** = **L**arge **L**anguage **M**odel: a very big autocomplete. One job: guess the next token, then repeat.
2. **Counting** (Layers 1–2) breaks: ties, and it only knows phrases it has seen.
3. **Words → numbers** (tokens, IDs, embeddings): similar words get similar numbers.
4. **Attention** fixes the tie: each word listens more to the useful words. It is the **heart of the Transformer**.
5. **Softmax** turns scores into chances that add up to 1.
6. A real LLM = the same block **stacked many times**, with billions of learned numbers. An **SLM** is the same idea, just smaller.

---

## 📝 Practice Problem

Do the **same layers** for the new sentence: **"i eat sweet ___"**

1. Tokens and IDs (Layer 3)
2. Vectors (`E[ids]`)
3. Attention: scores, weights, mix (Layer 4). Compare "sweet" before and after: which number went up?
4. Score every word, softmax (Layer 5). What is the next token, and its chance?
5. In 2 lines: only one word changed (`drink` → `eat`). Which layer made the answer change, and how?

**Expected answer:** `apple (37.4%)`
