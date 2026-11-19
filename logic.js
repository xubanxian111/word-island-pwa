(function attachWordLogic(root, factory) {
  const logic = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = logic;
  } else {
    root.WordLogic = logic;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createWordLogic() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const RETRY_DELAY_MS = 12 * 60 * 60 * 1000;
  const STAGE_INTERVALS_DAYS = Object.freeze([1, 3, 7, 14, 30]);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function shiftDayKey(dayKey, amount) {
    const parts = dayKey.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + amount);
    return toDayKey(date);
  }

  function lastNDayKeys(count, endDate = new Date()) {
    const endKey = toDayKey(endDate);
    return Array.from({ length: count }, (_, index) =>
      shiftDayKey(endKey, index - count + 1)
    );
  }

  function scheduleAnswer(previousState, correct, now = Date.now()) {
    const previous = previousState || {};
    const previousStage = Number(previous.stage) || 0;
    let stage;
    let dueAt;

    if (correct) {
      stage = clamp(Math.max(1, previousStage + 1), 0, 5);
      dueAt = now + STAGE_INTERVALS_DAYS[stage - 1] * DAY_MS;
    } else {
      stage = Math.max(1, previousStage - 1);
      dueAt = now + RETRY_DELAY_MS;
    }

    return {
      ...previous,
      stage,
      dueAt,
      attempts: (Number(previous.attempts) || 0) + 1,
      correctCount: (Number(previous.correctCount) || 0) + (correct ? 1 : 0),
      wrongCount: (Number(previous.wrongCount) || 0) + (correct ? 0 : 1),
      lastSeenAt: now,
      lastCorrectAt: correct ? now : previous.lastCorrectAt || null,
      introducedAt: previous.introducedAt || now
    };
  }

  function markIntroduced(previousState, now = Date.now()) {
    return {
      stage: 0,
      dueAt: now,
      attempts: 0,
      correctCount: 0,
      wrongCount: 0,
      introducedAt: now,
      lastSeenAt: now,
      lastCorrectAt: null,
      ...previousState
    };
  }

  function isDue(wordState, now = Date.now()) {
    return Boolean(
      wordState &&
        Number(wordState.attempts) > 0 &&
        Number(wordState.dueAt) > 0 &&
        Number(wordState.dueAt) <= now
    );
  }

  function accuracy(correct, attempts) {
    if (!attempts) return null;
    return Math.round((correct / attempts) * 100);
  }

  function chunk(items, size) {
    const result = [];
    for (let index = 0; index < items.length; index += size) {
      result.push(items.slice(index, index + size));
    }
    return result;
  }

  function roundRobinByCategory(words) {
    const buckets = new Map();
    words.forEach((word) => {
      if (!buckets.has(word.category)) buckets.set(word.category, []);
      buckets.get(word.category).push(word);
    });

    const groups = Array.from(buckets.values());
    const result = [];
    let cursor = 0;
    while (groups.some((group) => cursor < group.length)) {
      groups.forEach((group) => {
        if (group[cursor]) result.push(group[cursor]);
      });
      cursor += 1;
    }
    return result;
  }

  function shuffle(items, random = Math.random) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }

  function makeQuiz(word, pool, type, random = Math.random) {
    const safeType = ["meaning", "word", "listen"].includes(type) ? type : "meaning";
    const field = safeType === "meaning" ? "meaning" : "word";
    const seen = new Set([word[field]]);
    const distractors = [];

    const sameCategory = shuffle(
      pool.filter(
        (candidate) =>
          candidate.id !== word.id &&
          candidate.category === word.category &&
          !seen.has(candidate[field])
      ),
      random
    );

    sameCategory.forEach((candidate) => {
      if (distractors.length >= 3 || seen.has(candidate[field])) return;
      seen.add(candidate[field]);
      distractors.push(candidate);
    });

    if (distractors.length < 3) {
      shuffle(
        pool.filter(
          (candidate) =>
            candidate.id !== word.id &&
            !seen.has(candidate[field])
        ),
        random
      ).forEach((candidate) => {
        if (distractors.length >= 3 || seen.has(candidate[field])) return;
        seen.add(candidate[field]);
        distractors.push(candidate);
      });
    }

    const options = shuffle([word, ...distractors], random).map((candidate) => ({
      id: candidate.id,
      label: candidate[field]
    }));

    return {
      type: safeType,
      field,
      options,
      answerId: word.id
    };
  }

  function nextQuizType(sequenceIndex) {
    return ["meaning", "word", "listen"][sequenceIndex % 3];
  }

  function masteryLabel(stage) {
    if (stage >= 5) return "熟练";
    if (stage >= 3) return "稳定";
    if (stage >= 1) return "认识";
    return "刚遇见";
  }

  return {
    DAY_MS,
    RETRY_DELAY_MS,
    STAGE_INTERVALS_DAYS,
    accuracy,
    chunk,
    isDue,
    lastNDayKeys,
    makeQuiz,
    markIntroduced,
    masteryLabel,
    nextQuizType,
    roundRobinByCategory,
    scheduleAnswer,
    shiftDayKey,
    shuffle,
    toDayKey
  };
});
