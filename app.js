(function startWordIsland() {
  "use strict";

  const WORDS = window.WORD_DATA || [];
  const Logic = window.WordLogic;
  const WORD_BY_ID = new Map(WORDS.map((word) => [word.id, word]));
  const STORAGE_KEY = "word-island-state-v1";
  const TARGET_WORDS = 1000;
  const BATCH_SIZE = 10;
  const MAX_DAILY_REVIEWS = 10;
  const DEFAULT_STATE = Object.freeze({
    version: 1,
    profile: {
      name: "小小探险家",
      onboarded: false
    },
    settings: {
      dailyNew: 20,
      sound: true,
      nightMode: false
    },
    words: {},
    activity: {},
    dailyPlans: {},
    activeSession: null,
    lastSession: null
  });

  let state = loadState();
  let currentView = "dashboard";
  let toastTimer = null;
  let speechVoices = [];
  let deferredInstallPrompt = null;

  const elements = {
    onboardingModal: document.getElementById("onboardingModal"),
    onboardingName: document.getElementById("onboardingName"),
    onboardingStartButton: document.getElementById("onboardingStartButton"),
    childName: document.getElementById("childName"),
    greetingText: document.getElementById("greetingText"),
    heroMessage: document.getElementById("heroMessage"),
    heroNewCount: document.getElementById("heroNewCount"),
    heroReviewCount: document.getElementById("heroReviewCount"),
    startLessonButton: document.getElementById("startLessonButton"),
    startLessonLabel: document.getElementById("startLessonLabel"),
    quickReviewButton: document.getElementById("quickReviewButton"),
    progressOrbit: document.getElementById("progressOrbit"),
    orbitPercent: document.getElementById("orbitPercent"),
    orbitWordCount: document.getElementById("orbitWordCount"),
    stableWordCount: document.getElementById("stableWordCount"),
    dueWordCount: document.getElementById("dueWordCount"),
    accuracyValue: document.getElementById("accuracyValue"),
    streakValue: document.getElementById("streakValue"),
    todayStatusBadge: document.getElementById("todayStatusBadge"),
    missionReviewText: document.getElementById("missionReviewText"),
    missionReviewDot: document.getElementById("missionReviewDot"),
    missionBatchOneDot: document.getElementById("missionBatchOneDot"),
    missionBatchTwoDot: document.getElementById("missionBatchTwoDot"),
    recentWords: document.getElementById("recentWords"),
    parentShortcut: document.getElementById("parentShortcut"),
    bottomNav: document.getElementById("bottomNav"),
    sessionStage: document.getElementById("sessionStage"),
    sessionPhaseLabel: document.getElementById("sessionPhaseLabel"),
    sessionStepLabel: document.getElementById("sessionStepLabel"),
    sessionProgressBar: document.getElementById("sessionProgressBar"),
    exitSessionButton: document.getElementById("exitSessionButton"),
    sessionSoundButton: document.getElementById("sessionSoundButton"),
    mapProgressValue: document.getElementById("mapProgressValue"),
    islandGrid: document.getElementById("islandGrid"),
    parentStartedCount: document.getElementById("parentStartedCount"),
    parentStableCount: document.getElementById("parentStableCount"),
    parentDueCount: document.getElementById("parentDueCount"),
    parentAccuracy: document.getElementById("parentAccuracy"),
    weekChart: document.getElementById("weekChart"),
    childNameInput: document.getElementById("childNameInput"),
    dailyNewSelect: document.getElementById("dailyNewSelect"),
    soundSetting: document.getElementById("soundSetting"),
    nightSetting: document.getElementById("nightSetting"),
    saveSettingsButton: document.getElementById("saveSettingsButton"),
    parentGuidanceTitle: document.getElementById("parentGuidanceTitle"),
    parentGuidanceText: document.getElementById("parentGuidanceText"),
    exportDataButton: document.getElementById("exportDataButton"),
    importDataButton: document.getElementById("importDataButton"),
    importDataInput: document.getElementById("importDataInput"),
    resetDataButton: document.getElementById("resetDataButton"),
    installPanel: document.querySelector(".install-panel"),
    installTitle: document.getElementById("installTitle"),
    installDescription: document.getElementById("installDescription"),
    installSteps: document.getElementById("installSteps"),
    installAppButton: document.getElementById("installAppButton"),
    installStatusBadge: document.getElementById("installStatusBadge"),
    toast: document.getElementById("toast")
  };

  initialize();

  function initialize() {
    applyTheme();
    bindGlobalEvents();
    populateSpeechVoices();
    renderAll();
    updateInstallUi();

    if (!state.profile.onboarded) {
      elements.onboardingModal.classList.add("is-visible");
      window.setTimeout(() => elements.onboardingName.focus(), 250);
    } else {
      elements.onboardingModal.classList.remove("is-visible");
    }

    if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // The app remains fully usable without offline caching.
      });
    }
  }

  function loadState() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return structuredCloneSafe(DEFAULT_STATE);
      const parsed = JSON.parse(stored);
      return {
        ...structuredCloneSafe(DEFAULT_STATE),
        ...parsed,
        profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
        words: parsed.words || {},
        activity: parsed.activity || {},
        dailyPlans: parsed.dailyPlans || {}
      };
    } catch (error) {
      return structuredCloneSafe(DEFAULT_STATE);
    }
  }

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      showToast("学习记录暂时无法保存，请检查浏览器存储权限。");
    }
  }

  function bindGlobalEvents() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      updateInstallUi();
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      updateInstallUi();
      showToast("词汇小岛已经安装到设备。");
    });
    window.matchMedia("(display-mode: standalone)").addEventListener?.("change", updateInstallUi);

    document.querySelectorAll("[data-view-target]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.viewTarget));
    });

    elements.parentShortcut.addEventListener("click", () => showView("parent"));
    elements.onboardingStartButton.addEventListener("click", finishOnboarding);
    elements.onboardingName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") finishOnboarding();
    });
    elements.startLessonButton.addEventListener("click", handlePrimaryStart);
    elements.quickReviewButton.addEventListener("click", startQuickReview);
    elements.exitSessionButton.addEventListener("click", () => showView("dashboard"));
    elements.sessionSoundButton.addEventListener("click", toggleSound);
    elements.sessionStage.addEventListener("click", handleSessionClick);
    elements.saveSettingsButton.addEventListener("click", saveSettings);
    elements.exportDataButton.addEventListener("click", exportData);
    elements.importDataButton.addEventListener("click", () => elements.importDataInput.click());
    elements.importDataInput.addEventListener("change", async () => {
      const [file] = elements.importDataInput.files;
      if (file) await importData(file);
      elements.importDataInput.value = "";
    });
    elements.resetDataButton.addEventListener("click", resetProgress);
    elements.installAppButton.addEventListener("click", installApp);
    elements.soundSetting.addEventListener("change", () => {
      state.settings.sound = elements.soundSetting.checked;
      saveState();
      updateSoundButton();
    });
    elements.nightSetting.addEventListener("change", () => {
      state.settings.nightMode = elements.nightSetting.checked;
      applyTheme();
      saveState();
    });
  }

  function finishOnboarding() {
    const name = elements.onboardingName.value.trim() || "小小探险家";
    state.profile.name = name.slice(0, 16);
    state.profile.onboarded = true;
    saveState();
    elements.onboardingModal.classList.remove("is-visible");
    renderAll();
    requestPersistentStorage();
    showToast(`欢迎，${state.profile.name}。第一组词等你出发。`);
  }

  function showView(viewName) {
    if (!["dashboard", "session", "map", "parent"].includes(viewName)) return;
    currentView = viewName;
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("is-active", view.id === `view-${viewName}`);
    });
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
    });
    document.body.classList.toggle("in-session", viewName === "session");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "map") renderMap();
    if (viewName === "parent") renderParent();
    if (viewName === "session") renderSession();
  }

  function renderAll() {
    applyTheme();
    renderDashboard();
    renderMap();
    renderParent();
    updateSoundButton();
  }

  function renderDashboard() {
    const now = Date.now();
    const today = Logic.toDayKey(new Date());
    const plan = state.dailyPlans[today] || buildPlanPreview(today, now);
    const startedIds = getStartedWordIds();
    const stableIds = getStableWordIds();
    const dueIds = getDueWordIds(now);
    const activityStats = getLifetimeActivityStats();
    const dashboardAccuracy = Logic.accuracy(activityStats.correct, activityStats.attempts);
    const activeSession = getTodayActiveSession();
    const isCompleted = Boolean(plan.completedAt) && !activeSession;
    const dailyNew = plan.newIds.length;
    const reviewCount = plan.reviewIds.length;

    elements.childName.textContent = state.profile.name;
    elements.greetingText.textContent = getGreeting();
    elements.heroNewCount.textContent = String(dailyNew);
    elements.heroReviewCount.textContent = String(reviewCount);
    elements.orbitWordCount.textContent = `${Math.min(startedIds.length, TARGET_WORDS)} / ${TARGET_WORDS}`;
    elements.stableWordCount.textContent = String(stableIds.length);
    elements.dueWordCount.textContent = String(dueIds.length);
    elements.accuracyValue.textContent =
      dashboardAccuracy === null ? "—" : `${dashboardAccuracy}%`;
    elements.streakValue.textContent = `${calculateStreak()} 天`;

    const percentage = Math.min(100, Math.round((startedIds.length / TARGET_WORDS) * 100));
    elements.orbitPercent.textContent = `${percentage}%`;
    elements.progressOrbit.style.background = `conic-gradient(var(--mint) 0% ${percentage}%, var(--surface-soft) ${percentage}% 100%)`;

    if (activeSession) {
      elements.heroMessage.textContent = "你的学习进度已经保存，可以接着上次的位置继续。";
      elements.startLessonLabel.textContent = "继续今天的学习";
      elements.todayStatusBadge.textContent = "进行中";
    } else if (isCompleted) {
      elements.heroMessage.textContent =
        reviewCount > 0
          ? "今天的任务已经完成。想再巩固一下，可以做一轮短复习。"
          : "今天的任务已经完成。早点休息，明天再见。";
      elements.startLessonLabel.textContent = "再复习 5 分钟";
      elements.todayStatusBadge.textContent = "已完成";
    } else if (dailyNew === 0) {
      elements.heroMessage.textContent =
        "当前词包的新词已经学完，接下来优先巩固旧词和等待更多词包加入。";
      elements.startLessonLabel.textContent = "开始旧词复习";
      elements.todayStatusBadge.textContent = "复习模式";
    } else {
      elements.heroMessage.textContent = `今天学 ${dailyNew} 个新词，再花几分钟把之前见过的词找回来。`;
      elements.startLessonLabel.textContent = `开始今天的 ${dailyNew} 词`;
      elements.todayStatusBadge.textContent = "待开始";
    }

    elements.missionReviewText.textContent = reviewCount
      ? `${reviewCount} 个词已经到复习时间`
      : "今天没有到期的复习";
    elements.missionReviewDot.classList.toggle("is-done", reviewCount === 0 || isCompleted);
    elements.missionBatchOneDot.classList.toggle(
      "is-done",
      isCompleted || (activeSession && canMarkFirstBatchDone(activeSession))
    );
    elements.missionBatchTwoDot.classList.toggle("is-done", isCompleted);
    renderRecentWords();
  }

  function renderRecentWords() {
    const recent = Object.entries(state.words)
      .filter(([, progress]) => progress && progress.introducedAt)
      .sort((a, b) => (b[1].lastSeenAt || 0) - (a[1].lastSeenAt || 0))
      .slice(0, 6)
      .map(([id]) => WORD_BY_ID.get(Number(id)))
      .filter(Boolean);

    if (!recent.length) {
      elements.recentWords.innerHTML = `
        <div class="empty-recent">
          <span aria-hidden="true">🌱</span>
          <p>第一颗词汇种子还在等你。</p>
        </div>
      `;
      return;
    }

    elements.recentWords.innerHTML = recent
      .map((word) => {
        const progress = state.words[word.id];
        return `
          <button class="recent-word" type="button" data-speak-word="${escapeHtml(word.word)}">
            <span aria-hidden="true">${escapeHtml(word.emoji)}</span>
            <div>
              <strong>${escapeHtml(word.word)}</strong>
              <small>${escapeHtml(Logic.masteryLabel(progress?.stage || 0))} · ${escapeHtml(word.meaning)}</small>
            </div>
          </button>
        `;
      })
      .join("");

    elements.recentWords.querySelectorAll("[data-speak-word]").forEach((button) => {
      button.addEventListener("click", () => speak(button.dataset.speakWord));
    });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return "夜深了";
    if (hour < 11) return "早上好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  }

  function getStartedWordIds() {
    return Object.keys(state.words)
      .filter((id) => state.words[id]?.introducedAt)
      .map(Number)
      .filter((id) => WORD_BY_ID.has(id));
  }

  function getStableWordIds() {
    return Object.entries(state.words)
      .filter(([, progress]) => Number(progress.stage) >= 3)
      .map(([id]) => Number(id))
      .filter((id) => WORD_BY_ID.has(id));
  }

  function getDueWordIds(now = Date.now()) {
    return Object.entries(state.words)
      .filter(([, progress]) => Logic.isDue(progress, now))
      .sort((a, b) => Number(a[1].dueAt) - Number(b[1].dueAt))
      .map(([id]) => Number(id))
      .filter((id) => WORD_BY_ID.has(id));
  }

  function getLearnedWordIds() {
    return Object.entries(state.words)
      .filter(([, progress]) => Number(progress.attempts) > 0)
      .map(([id]) => Number(id))
      .filter((id) => WORD_BY_ID.has(id));
  }

  function getLifetimeActivityStats() {
    return Object.values(state.activity).reduce(
      (total, day) => {
        total.attempts += Number(day.attempts) || 0;
        total.correct += Number(day.correct) || 0;
        total.newWords += Number(day.newWords) || 0;
        total.reviews += Number(day.reviews) || 0;
        return total;
      },
      { attempts: 0, correct: 0, newWords: 0, reviews: 0 }
    );
  }

  function calculateStreak() {
    const today = Logic.toDayKey(new Date());
    let cursor = today;
    if (!hasStudyActivity(cursor)) cursor = Logic.shiftDayKey(cursor, -1);
    let streak = 0;
    while (hasStudyActivity(cursor) && streak < 365) {
      streak += 1;
      cursor = Logic.shiftDayKey(cursor, -1);
    }
    return streak;
  }

  function hasStudyActivity(dayKey) {
    const activity = state.activity[dayKey];
    return Boolean(activity && (Number(activity.attempts) > 0 || Number(activity.newWords) > 0));
  }

  function buildPlanPreview(dayKey, now = Date.now()) {
    const unseen = Logic.roundRobinByCategory(WORDS).filter(
      (word) => !state.words[word.id]?.introducedAt && !state.words[word.id]?.attempts
    );
    const dueIds = getDueWordIds(now);
    return {
      date: dayKey,
      newIds: unseen.slice(0, state.settings.dailyNew).map((word) => word.id),
      reviewIds: dueIds.slice(0, Math.min(MAX_DAILY_REVIEWS, state.settings.dailyNew)),
      createdAt: null,
      completedAt: null
    };
  }

  function getOrCreateDailyPlan() {
    const today = Logic.toDayKey(new Date());
    if (!state.dailyPlans[today]) {
      state.dailyPlans[today] = {
        ...buildPlanPreview(today),
        createdAt: Date.now()
      };
      saveState();
    }
    return state.dailyPlans[today];
  }

  function getTodayActiveSession() {
    const today = Logic.toDayKey(new Date());
    return state.activeSession?.date === today ? state.activeSession : null;
  }

  function handlePrimaryStart() {
    const active = getTodayActiveSession();
    if (active) {
      showView("session");
      return;
    }

    const today = Logic.toDayKey(new Date());
    const plan = state.dailyPlans[today];
    if (plan?.completedAt) {
      startQuickReview();
      return;
    }

    startDailySession();
  }

  function startDailySession() {
    const plan = getOrCreateDailyPlan();
    if (!plan.newIds.length && !plan.reviewIds.length) {
      showToast("当前词包已经学完，先做旧词复习吧。");
      startQuickReview();
      return;
    }

    state.activeSession = {
      id: `session-${Date.now()}`,
      date: Logic.toDayKey(new Date()),
      kind: "daily",
      reviewIds: plan.reviewIds.slice(),
      newIds: plan.newIds.slice(),
      stepIndex: 0,
      correct: 0,
      attempts: 0,
      completedWordIds: [],
      answeredSteps: {},
      quizCache: {},
      startedAt: Date.now()
    };
    saveState();
    showView("session");
  }

  function startQuickReview() {
    const now = Date.now();
    const due = getDueWordIds(now);
    const learned = getLearnedWordIds();
    let reviewIds = due.slice(0, 8);

    if (reviewIds.length < 6) {
      const filler = Logic.shuffle(
        learned.filter((id) => !reviewIds.includes(id))
      ).slice(0, 8 - reviewIds.length);
      reviewIds = [...reviewIds, ...filler];
    }

    if (!reviewIds.length) {
      showToast("还没有可以复习的词，先完成今天的第一组吧。");
      return;
    }

    state.activeSession = {
      id: `quick-${Date.now()}`,
      date: Logic.toDayKey(new Date()),
      kind: "quick",
      reviewIds,
      newIds: [],
      stepIndex: 0,
      correct: 0,
      attempts: 0,
      completedWordIds: [],
      answeredSteps: {},
      quizCache: {},
      startedAt: Date.now()
    };
    saveState();
    showView("session");
  }

  function buildSessionSteps(session) {
    const steps = [];

    if (session.reviewIds.length) {
      steps.push({
        type: "review-intro",
        count: session.reviewIds.length
      });
      session.reviewIds.forEach((wordId, index) => {
        steps.push({
          type: "review-quiz",
          wordId,
          quizSequence: index
        });
      });
    }

    Logic.chunk(session.newIds, BATCH_SIZE).forEach((batch, batchIndex) => {
      steps.push({
        type: "batch-intro",
        batchIndex,
        count: batch.length
      });
      batch.forEach((wordId) => {
        steps.push({
          type: "teach",
          wordId,
          batchIndex
        });
      });
      batch.forEach((wordId, index) => {
        steps.push({
          type: "new-quiz",
          wordId,
          quizSequence: index + batchIndex * BATCH_SIZE
        });
      });
    });

    steps.push({ type: "summary" });
    return steps;
  }

  function renderSession() {
    const session = getTodayActiveSession();
    if (!session) {
      showView("dashboard");
      return;
    }

    const steps = buildSessionSteps(session);
    const safeIndex = Math.min(session.stepIndex, steps.length - 1);
    const step = steps[safeIndex];
    const progress = Math.min(100, Math.round((safeIndex / Math.max(1, steps.length - 1)) * 100));

    elements.sessionProgressBar.style.width = `${progress}%`;
    elements.sessionStepLabel.textContent = `${Math.min(safeIndex + 1, steps.length)} / ${steps.length}`;
    elements.sessionPhaseLabel.textContent = getPhaseLabel(step, session);
    updateSoundButton();

    if (step.type === "review-intro") {
      elements.sessionStage.innerHTML = reviewIntroTemplate(step.count);
      return;
    }

    if (step.type === "batch-intro") {
      elements.sessionStage.innerHTML = batchIntroTemplate(step);
      return;
    }

    if (step.type === "teach") {
      const word = WORD_BY_ID.get(step.wordId);
      elements.sessionStage.innerHTML = teachTemplate(word, step.batchIndex);
      return;
    }

    if (step.type === "review-quiz" || step.type === "new-quiz") {
      renderQuizStep(session, step, safeIndex);
      return;
    }

    elements.sessionStage.innerHTML = summaryTemplate(session);
  }

  function getPhaseLabel(step, session) {
    if (step.type === "review-intro") return "旧词热身";
    if (step.type === "review-quiz") return session.kind === "quick" ? "快速复习" : "找回旧词";
    if (step.type === "batch-intro") return `第 ${step.batchIndex + 1} 组 · 准备`;
    if (step.type === "teach") return `第 ${step.batchIndex + 1} 组 · 新词`;
    if (step.type === "new-quiz") return `第 ${step.batchIndex + 1} 组 · 小测`;
    return "今日完成";
  }

  function reviewIntroTemplate(count) {
    return `
      <article class="session-card intro-card">
        <div class="intro-emoji" aria-hidden="true">🧠</div>
        <span class="section-kicker">WARM-UP RECALL</span>
        <h2>先把 ${count} 个旧词找回来</h2>
        <p>这里不是重新背一遍，而是主动从记忆里提取。想不起来也没关系，答错的词会更快回来。</p>
        <div class="intro-notes">
          <span>不用提示</span>
          <span>先想再看</span>
          <span>约 5 分钟</span>
        </div>
        <button class="primary-button continue-button" type="button" data-next-step>
          开始热身
          <span aria-hidden="true">→</span>
        </button>
      </article>
    `;
  }

  function batchIntroTemplate(step) {
    const isFirst = step.batchIndex === 0;
    return `
      <article class="session-card intro-card">
        <div class="intro-emoji" aria-hidden="true">${isFirst ? "🌿" : "🌊"}</div>
        <span class="section-kicker">ROUND ${step.batchIndex + 1}</span>
        <h2>${isFirst ? "第一组" : "第二组"} ${step.count} 个新词</h2>
        <p>${
          isFirst
            ? "先看图、听发音、读例句。学完这一组，我们马上做一轮小测。"
            : "前一组已经装进脑袋。接下来再走一小段，最后把所有词混合起来。"
        }</p>
        <div class="intro-notes">
          <span>听发音</span>
          <span>大声跟读</span>
          <span>马上回忆</span>
        </div>
        <button class="primary-button continue-button" type="button" data-next-step>
          开始这一组
          <span aria-hidden="true">→</span>
        </button>
      </article>
    `;
  }

  function teachTemplate(word, batchIndex) {
    if (!word) return "";
    return `
      <article class="session-card teach-card">
        <div class="card-label-row">
          <span><i></i> 第 ${batchIndex + 1} 组 · 新词</span>
          <span>${escapeHtml(word.category)}</span>
        </div>
        <div>
          <div class="word-visual" aria-hidden="true">${escapeHtml(word.emoji)}</div>
          <button class="word-sound-button" type="button" data-speak="${escapeHtml(word.word)}">
            <span aria-hidden="true">🔊</span>
            点这里听发音
          </button>
          <h1 class="teach-word">${escapeHtml(word.word)}</h1>
          <p class="teach-meaning">${escapeHtml(word.meaning)}</p>
          <div class="example-box">
            <strong>${escapeHtml(word.example)}</strong>
            <span>${escapeHtml(word.exampleZh)}</span>
          </div>
        </div>
        <div class="card-actions">
          <span class="word-tip">轻声跟着读一遍，<br />让耳朵也记住它。</span>
          <button class="primary-button continue-button" type="button" data-next-step>
            学会了，继续
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    `;
  }

  function getQuizForStep(session, step, stepIndex) {
    if (!session.quizCache) session.quizCache = {};
    const key = String(stepIndex);
    if (!session.quizCache[key]) {
      const word = WORD_BY_ID.get(step.wordId);
      const type = Logic.nextQuizType((step.quizSequence || 0) + stepIndex);
      session.quizCache[key] = Logic.makeQuiz(word, WORDS, type);
      saveState();
    }
    return session.quizCache[key];
  }

  function renderQuizStep(session, step, stepIndex) {
    const word = WORD_BY_ID.get(step.wordId);
    const quiz = getQuizForStep(session, step, stepIndex);
    const feedback = session.answeredSteps?.[String(stepIndex)] || null;
    const isReview = step.type === "review-quiz";
    const promptType = quiz.type;

    let promptMarkup = "";
    if (promptType === "meaning") {
      promptMarkup = `
        <div class="quiz-prompt">
          <span class="quiz-big">${escapeHtml(word.word)}</span>
          <span class="quiz-small">它最接近哪个意思？</span>
        </div>
      `;
    } else if (promptType === "word") {
      promptMarkup = `
        <div class="quiz-prompt">
          <span class="quiz-emoji" aria-hidden="true">${escapeHtml(word.emoji)}</span>
          <span class="quiz-big">${escapeHtml(word.meaning)}</span>
          <span class="quiz-small">英文是哪一个？</span>
        </div>
      `;
    } else {
      promptMarkup = `
        <div class="quiz-prompt">
          <span class="quiz-emoji" aria-hidden="true">🎧</span>
          <button class="quiz-listen-button" type="button" data-speak="${escapeHtml(word.word)}">
            <span aria-hidden="true">🔊</span>
            再听一遍
          </button>
          <span class="quiz-small">听发音，选出你听到的单词</span>
        </div>
      `;
    }

    const options = quiz.options
      .map((option) => {
        let extraClass = "";
        if (feedback && option.id === quiz.answerId) extraClass = " is-correct";
        if (feedback && option.id === feedback.choiceId && !feedback.correct) {
          extraClass = " is-wrong";
        }
        return `
          <button
            class="choice-button${extraClass}"
            type="button"
            data-choice="${option.id}"
            ${feedback ? "disabled" : ""}
          >${escapeHtml(option.label)}</button>
        `;
      })
      .join("");

    let feedbackMarkup = "";
    if (feedback) {
      const answerWord = WORD_BY_ID.get(quiz.answerId);
      feedbackMarkup = `
        <div class="feedback-bar ${feedback.correct ? "correct" : "wrong"}">
          <div>
            <strong>${feedback.correct ? "答对了，提取成功。" : "这次没想起来，没关系。"}</strong>
            <span>
              ${feedback.correct ? `${escapeHtml(answerWord.word)} · ${escapeHtml(answerWord.meaning)}` : `正确答案：${escapeHtml(answerWord.word)} · ${escapeHtml(answerWord.meaning)}。它会在下一次复习里更早出现。`}
            </span>
          </div>
          <button type="button" data-feedback-next>继续</button>
        </div>
      `;
    }

    elements.sessionStage.innerHTML = `
      <article class="session-card quiz-card">
        <div class="card-label-row">
          <span><i></i> ${isReview ? "旧词复习" : "即时小测"}</span>
          <span>${isReview ? "主动回忆" : "刚刚学过"}</span>
        </div>
        ${promptMarkup}
        <div class="choice-grid">${options}</div>
        ${feedbackMarkup}
      </article>
    `;
  }

  function summaryTemplate(session) {
    const accuracy = Logic.accuracy(session.correct, session.attempts);
    const stars = accuracy >= 85 ? 3 : accuracy >= 70 ? 2 : 1;
    const words = Array.from(new Set([...session.reviewIds, ...session.newIds]))
      .slice(0, 14)
      .map((id) => WORD_BY_ID.get(id))
      .filter(Boolean);
    return `
      <article class="session-card summary-card">
        <div class="summary-stars" aria-label="${stars} 颗星">
          ${[0, 1, 2].map((index) => `<span class="${index < stars ? "is-earned" : ""}">★</span>`).join("")}
        </div>
        <span class="section-kicker">TRAIL COMPLETE</span>
        <h2>${session.kind === "quick" ? "旧词又被你找回来了" : "今天的旅程完成了"}</h2>
        <p>
          ${
            session.kind === "quick"
              ? "短复习的价值在“想起来”，不在做很多题。现在可以安心休息。"
              : "这些词已经进入复习队列。真正记住它们，靠的是接下来几次短暂回忆。"
          }
        </p>
        <div class="summary-grid">
          <div><strong>${session.correct}</strong><span>答对</span></div>
          <div><strong>${session.attempts}</strong><span>练习</span></div>
          <div><strong>${accuracy === null ? "—" : `${accuracy}%`}</strong><span>正确率</span></div>
        </div>
        <div class="summary-word-list">
          ${words.map((word) => `<span>${escapeHtml(word.word)}</span>`).join("")}
        </div>
        <button class="primary-button continue-button" type="button" data-finish-session>
          回到首页
          <span aria-hidden="true">→</span>
        </button>
      </article>
    `;
  }

  function handleSessionClick(event) {
    const speakButton = event.target.closest("[data-speak]");
    if (speakButton) {
      speak(speakButton.dataset.speak);
      return;
    }

    if (event.target.closest("[data-next-step]")) {
      advanceSessionStep();
      return;
    }

    if (event.target.closest("[data-feedback-next]")) {
      advanceSessionStep();
      return;
    }

    if (event.target.closest("[data-finish-session]")) {
      finishSession();
      return;
    }

    const choiceButton = event.target.closest("[data-choice]");
    if (choiceButton && !choiceButton.disabled) {
      answerCurrentQuiz(Number(choiceButton.dataset.choice));
    }
  }

  function advanceSessionStep() {
    const session = getTodayActiveSession();
    if (!session) return;
    const steps = buildSessionSteps(session);
    const currentStep = steps[Math.min(session.stepIndex, steps.length - 1)];

    if (currentStep.type === "teach") {
      const wordId = currentStep.wordId;
      state.words[wordId] = Logic.markIntroduced(state.words[wordId], Date.now());
    }

    session.stepIndex = Math.min(session.stepIndex + 1, steps.length - 1);
    saveState();
    renderSession();
  }

  function answerCurrentQuiz(choiceId) {
    const session = getTodayActiveSession();
    if (!session) return;
    const steps = buildSessionSteps(session);
    const stepIndex = Math.min(session.stepIndex, steps.length - 1);
    const step = steps[stepIndex];
    if (!["review-quiz", "new-quiz"].includes(step.type)) return;
    if (session.answeredSteps?.[String(stepIndex)]) return;

    const quiz = getQuizForStep(session, step, stepIndex);
    const correct = choiceId === quiz.answerId;
    const now = Date.now();
    const previous = state.words[step.wordId] || Logic.markIntroduced(null, now);
    state.words[step.wordId] = Logic.scheduleAnswer(previous, correct, now);

    if (!session.answeredSteps) session.answeredSteps = {};
    session.answeredSteps[String(stepIndex)] = {
      choiceId,
      correct,
      answeredAt: now
    };
    session.attempts += 1;
    if (correct) session.correct += 1;

    if (!session.completedWordIds.includes(step.wordId)) {
      session.completedWordIds.push(step.wordId);
      recordActivity(step.type === "new-quiz" ? "new" : "review", correct);
    }

    saveState();
    playFeedbackTone(correct);
    renderSession();
  }

  function recordActivity(kind, correct) {
    const today = Logic.toDayKey(new Date());
    const activity = state.activity[today] || {
      attempts: 0,
      correct: 0,
      newWords: 0,
      reviews: 0,
      minutes: 0
    };

    if (kind === "new") activity.newWords += 1;
    if (kind === "review") activity.reviews += 1;
    activity.attempts += 1;
    if (correct) activity.correct += 1;
    state.activity[today] = activity;
  }

  function finishSession() {
    const session = getTodayActiveSession();
    if (!session) {
      showView("dashboard");
      return;
    }

    const today = session.date;
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
    if (!state.activity[today]) {
      state.activity[today] = {
        attempts: 0,
        correct: 0,
        newWords: 0,
        reviews: 0,
        minutes: 0
      };
    }
    state.activity[today].minutes += elapsedMinutes;

    if (session.kind === "daily" && state.dailyPlans[today]) {
      state.dailyPlans[today].completedAt = Date.now();
    }

    state.lastSession = {
      date: today,
      kind: session.kind,
      attempts: session.attempts,
      correct: session.correct,
      minutes: elapsedMinutes,
      wordIds: Array.from(new Set([...session.reviewIds, ...session.newIds])),
      finishedAt: Date.now()
    };
    state.activeSession = null;
    saveState();
    renderAll();
    showView("dashboard");
    showToast(`完成 ${session.attempts} 道回忆练习，学习记录已保存。`);
  }

  function canMarkFirstBatchDone(session) {
    const batchSize = Math.min(BATCH_SIZE, session.newIds.length);
    if (!batchSize) return true;
    const firstBatch = session.newIds.slice(0, batchSize);
    return firstBatch.every((id) => session.completedWordIds?.includes(id));
  }

  function toggleSound() {
    state.settings.sound = !state.settings.sound;
    saveState();
    updateSoundButton();
    showToast(state.settings.sound ? "提示音已开启" : "提示音已关闭");
  }

  function updateSoundButton() {
    if (!elements.sessionSoundButton) return;
    elements.sessionSoundButton.classList.toggle("is-muted", !state.settings.sound);
    elements.sessionSoundButton.setAttribute(
      "aria-label",
      state.settings.sound ? "关闭提示音" : "开启提示音"
    );
    if (elements.soundSetting) {
      elements.soundSetting.checked = Boolean(state.settings.sound);
    }
  }

  function playFeedbackTone(correct) {
    if (!state.settings.sound) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const notes = correct ? [523.25, 659.25] : [246.94];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + index * 0.08;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.2);
      });
      window.setTimeout(() => context.close(), 500);
    } catch (error) {
      // Sound is a progressive enhancement.
    }
  }

  function populateSpeechVoices() {
    if (!("speechSynthesis" in window)) return;
    speechVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", () => {
      speechVoices = window.speechSynthesis.getVoices();
    });
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      showToast("当前浏览器不支持朗读，请换用 Safari 或 Chrome。");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(String(text));
    const englishVoice =
      speechVoices.find((voice) => /^en-US/i.test(voice.lang)) ||
      speechVoices.find((voice) => /^en/i.test(voice.lang));
    if (englishVoice) utterance.voice = englishVoice;
    utterance.lang = englishVoice?.lang || "en-US";
    utterance.rate = 0.86;
    utterance.pitch = 1.04;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function renderMap() {
    const started = getStartedWordIds().length;
    const islandNames = [
      "晨光草地",
      "词语溪谷",
      "声音树林",
      "故事山坡",
      "动物营地",
      "食物小镇",
      "学校码头",
      "情绪花园",
      "家庭港湾",
      "动作峡谷",
      "天气原野",
      "交通山口",
      "时间平原",
      "颜色海岸",
      "复习森林",
      "挑战石桥",
      "故事古城",
      "表达高塔",
      "流利云岛",
      "千词灯塔"
    ];
    const islandEmojis = [
      "🌅",
      "💧",
      "🎧",
      "⛰️",
      "🦊",
      "🥐",
      "⛵",
      "🌻",
      "🏡",
      "🪨",
      "🌤️",
      "🚌",
      "🕰️",
      "🎨",
      "🌲",
      "🌉",
      "🏛️",
      "🗼",
      "☁️",
      "🗼"
    ];

    elements.mapProgressValue.textContent = String(Math.min(started, TARGET_WORDS));
    elements.islandGrid.innerHTML = islandNames
      .map((name, index) => {
        const start = index * 50;
        const end = start + 50;
        let status = "locked";
        let statusLabel = "未抵达";
        if (started >= end) {
          status = "complete";
          statusLabel = "已走过";
        } else if (started >= start) {
          status = "current";
          statusLabel = "当前";
        }
        return `
          <article class="island-card is-${status}">
            <span class="island-status">${statusLabel}</span>
            <span class="island-emoji" aria-hidden="true">${islandEmojis[index]}</span>
            <strong>${escapeHtml(name)}</strong>
            <small>第 ${start + 1}–${end} 词</small>
          </article>
        `;
      })
      .join("");
  }

  function renderParent() {
    const started = getStartedWordIds().length;
    const stable = getStableWordIds().length;
    const due = getDueWordIds().length;
    const stats = getLifetimeActivityStats();
    const accuracy = Logic.accuracy(stats.correct, stats.attempts);

    elements.parentStartedCount.textContent = String(started);
    elements.parentStableCount.textContent = String(stable);
    elements.parentDueCount.textContent = String(due);
    elements.parentAccuracy.textContent = accuracy === null ? "—" : `${accuracy}%`;
    elements.childNameInput.value = state.profile.name;
    elements.dailyNewSelect.value = String(state.settings.dailyNew);
    elements.soundSetting.checked = Boolean(state.settings.sound);
    elements.nightSetting.checked = Boolean(state.settings.nightMode);
    renderWeekChart();
    renderParentGuidance({ due, accuracy, stats });
    updateInstallUi();
  }

  function renderWeekChart() {
    const days = Logic.lastNDayKeys(7);
    const labels = ["日", "一", "二", "三", "四", "五", "六"];
    const values = days.map((dayKey) => {
      const activity = state.activity[dayKey];
      return activity
        ? (Number(activity.newWords) || 0) + (Number(activity.reviews) || 0)
        : 0;
    });
    const max = Math.max(20, ...values);

    elements.weekChart.innerHTML = days
      .map((dayKey, index) => {
        const date = new Date(`${dayKey}T12:00:00`);
        const height = Math.max(values[index] ? 9 : 4, Math.round((values[index] / max) * 138));
        const isToday = index === days.length - 1;
        return `
          <div class="chart-day ${isToday ? "is-today" : ""}">
            <span class="chart-value">${values[index] || ""}</span>
            <div class="chart-bar-wrap">
              <span class="chart-bar" style="height:${height}px"></span>
            </div>
            <span class="chart-label">${labels[date.getDay()]}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderParentGuidance({ due, accuracy, stats }) {
    const today = Logic.toDayKey(new Date());
    const todayActivity = state.activity[today];
    const started = getStartedWordIds().length;
    let title = "先开始今天的第一组";
    let text =
      "让孩子按 10 个一组完成。如果第二组明显疲劳，就停在两组之间，不需要为了进度硬撑。";

    if (due > state.settings.dailyNew * 1.5) {
      title = "复习开始有些积压";
      text = `现在有 ${due} 个词到期。建议先做两三天短复习，再把新词恢复到 20 个，避免越学越乱。`;
    } else if (accuracy !== null && accuracy < 75 && stats.attempts >= 20) {
      title = "先保住记住的部分";
      text = `累计正确率为 ${accuracy}%。建议把每天新词暂时降到 12–15 个，先提高复习提取成功率。`;
    } else if (todayActivity?.attempts > 0) {
      title = "今天已经产生有效回忆";
      text = `今天完成 ${todayActivity.newWords || 0} 个新词和 ${
        todayActivity.reviews || 0
      } 个旧词练习。睡前只需再听几句发音，不必追加新题。`;
    } else if (started === 0) {
      title = "第一次先用 10 个词试节奏";
      text =
        "如果孩子第一次学习时明显分心或疲惫，今天可以只完成第一组。稳定执行比第一天冲满更关键。";
    }

    if (started >= WORDS.length) {
      title = "当前词包已全部接触";
      text =
        "首批内置词包已经学完。下一阶段应继续扩充 1000 词词库，同时用既有错词和到期复习维持记忆。";
    }

    elements.parentGuidanceTitle.textContent = title;
    elements.parentGuidanceText.textContent = text;
  }

  function saveSettings() {
    const name = elements.childNameInput.value.trim() || "小小探险家";
    const dailyNew = Number(elements.dailyNewSelect.value);
    state.profile.name = name.slice(0, 16);
    state.settings.dailyNew = [10, 15, 20].includes(dailyNew) ? dailyNew : 20;
    state.settings.sound = elements.soundSetting.checked;
    state.settings.nightMode = elements.nightSetting.checked;
    saveState();
    applyTheme();
    renderAll();
    showToast("设置已保存，新词数量从下一次新计划开始生效。");
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.nightMode ? "night" : "light";
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", state.settings.nightMode ? "#1c2533" : "#f8f2e7");
    }
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "词汇小岛",
      contentWordCount: WORDS.length,
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `word-island-progress-${Logic.toDayKey(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("学习记录已导出为 JSON 文件。");
  }

  async function importData(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("备份文件超过 5 MB，无法导入。");
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeImportedState(parsed);
      const confirmed = window.confirm(
        `将导入“${imported.profile.name}”的学习记录，并覆盖当前设备上的全部进度。继续吗？`
      );
      if (!confirmed) return;

      state = imported;
      saveState();
      renderAll();
      requestPersistentStorage();
      showToast("学习记录已导入，进度和复习计划已恢复。");
    } catch (error) {
      showToast("无法读取这个备份文件，请选择由词汇小岛导出的 JSON 文件。");
    }
  }

  function normalizeImportedState(payload) {
    const raw = payload?.state && typeof payload.state === "object" ? payload.state : payload;
    if (!raw || typeof raw !== "object" || !raw.words || typeof raw.words !== "object") {
      throw new Error("invalid backup");
    }

    const validIds = new Set(WORDS.map((word) => String(word.id)));
    const words = {};
    Object.entries(raw.words).forEach(([id, progress]) => {
      if (!validIds.has(String(id)) || !progress || typeof progress !== "object") return;
      words[String(id)] = {
        stage: Math.max(0, Math.min(5, Number(progress.stage) || 0)),
        dueAt: Number(progress.dueAt) || 0,
        attempts: Math.max(0, Number(progress.attempts) || 0),
        correctCount: Math.max(0, Number(progress.correctCount) || 0),
        wrongCount: Math.max(0, Number(progress.wrongCount) || 0),
        introducedAt: Number(progress.introducedAt) || null,
        lastSeenAt: Number(progress.lastSeenAt) || null,
        lastCorrectAt: Number(progress.lastCorrectAt) || null
      };
    });

    const activity = {};
    Object.entries(raw.activity || {}).forEach(([dayKey, value]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || !value || typeof value !== "object") return;
      activity[dayKey] = {
        attempts: Math.max(0, Number(value.attempts) || 0),
        correct: Math.max(0, Number(value.correct) || 0),
        newWords: Math.max(0, Number(value.newWords) || 0),
        reviews: Math.max(0, Number(value.reviews) || 0),
        minutes: Math.max(0, Number(value.minutes) || 0)
      };
    });

    const dailyPlans = {};
    Object.entries(raw.dailyPlans || {}).forEach(([dayKey, plan]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || !plan || typeof plan !== "object") return;
      const cleanIds = (ids) =>
        Array.isArray(ids)
          ? ids.map(Number).filter((id) => validIds.has(String(id)))
          : [];
      dailyPlans[dayKey] = {
        date: dayKey,
        newIds: cleanIds(plan.newIds),
        reviewIds: cleanIds(plan.reviewIds),
        createdAt: Number(plan.createdAt) || null,
        completedAt: Number(plan.completedAt) || null
      };
    });

    return {
      version: 1,
      profile: {
        name: String(raw.profile?.name || "小小探险家").slice(0, 16),
        onboarded: true
      },
      settings: {
        dailyNew: [10, 15, 20].includes(Number(raw.settings?.dailyNew))
          ? Number(raw.settings.dailyNew)
          : 20,
        sound: raw.settings?.sound !== false,
        nightMode: Boolean(raw.settings?.nightMode)
      },
      words,
      activity,
      dailyPlans,
      activeSession: null,
      lastSession: raw.lastSession && typeof raw.lastSession === "object" ? raw.lastSession : null
    };
  }

  async function requestPersistentStorage() {
    try {
      if (navigator.storage?.persist) await navigator.storage.persist();
    } catch (error) {
      // Persistence is an optional browser capability.
    }
  }

  function isStandaloneMode() {
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone
    );
  }

  function updateInstallUi() {
    if (!elements.installPanel) return;
    const installed = isStandaloneMode();
    elements.installPanel.classList.toggle("is-installed", installed);

    if (installed) {
      elements.installTitle.textContent = "词汇小岛已作为应用运行";
      elements.installDescription.textContent =
        "当前页面已从主屏幕或独立窗口打开。学习记录保存在这个安装实例中，请定期导出备份。";
      elements.installSteps.hidden = true;
      elements.installAppButton.hidden = true;
      elements.installStatusBadge.textContent = "已安装 · 独立窗口运行";
      return;
    }

    elements.installTitle.textContent = "把词汇小岛安装到 iPad";
    elements.installDescription.textContent =
      "安装后会从主屏幕全屏打开，并可在首次联网加载后离线学习。iPad 必须通过 Safari 打开 HTTPS 地址。";
    elements.installSteps.hidden = false;
    elements.installStatusBadge.textContent = "尚未按安装模式运行";
    elements.installAppButton.hidden = !deferredInstallPrompt;
  }

  async function installApp() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallUi();
    showToast(choice.outcome === "accepted" ? "正在安装词汇小岛。" : "已取消本次安装。");
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "确定清空本机学习进度吗？孩子称呼和学习设置会保留，所有词汇熟练度、复习计划和答题记录会删除。"
    );
    if (!confirmed) return;

    const profile = { ...state.profile };
    const settings = { ...state.settings };
    state = {
      ...structuredCloneSafe(DEFAULT_STATE),
      settings,
      profile: { ...profile, onboarded: true }
    };
    saveState();
    renderAll();
    showToast("学习进度已清空。");
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2800);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
