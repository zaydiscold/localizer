// Localizer — by Zayd @ ColdCooks
// https://github.com/zaydiscold

(() => {
  const TZ_OFFSETS = {
    UTC: 0, GMT: 0,
    EST: -300, EDT: -240,
    CST: -360, CDT: -300,
    MST: -420, MDT: -360,
    PST: -480, PDT: -420,
    AKST: -540, AKDT: -480,
    HST: -600,
    AST: -240, ADT: -180,
    NST: -210, NDT: -150,
    CET: 60, CEST: 120,
    EET: 120, EEST: 180,
    WET: 0, WEST: 60,
    IST: 330, JST: 540, KST: 540,
    CST_CN: 480,
    AEST: 600, AEDT: 660,
    ACST: 570, ACDT: 630,
    AWST: 480,
    NZST: 720, NZDT: 780,
  };

  const TZ_NAMES = Object.keys(TZ_OFFSETS).filter((k) => !k.includes("_"));
  const TZ_PATTERN = TZ_NAMES.join("|");
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
  const TZ_HINT_REGEX = new RegExp(`\\b(?:${TZ_PATTERN})\\b`);
  const ELEMENT_CANDIDATE_SELECTOR = "small, time, span, p, div, li";
  const MAX_ELEMENT_TEXT_LENGTH = 140;

  // Matches:
  // - 11:49 UTC
  // - 2:30 PM EST
  // - 2026-03-02 14:00 GMT
  // - Mar 03, 2026 - 08:39 UTC
  const TIME_REGEX = new RegExp(
    "(?:" +
      "(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2})" +
      "|" +
      "((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{4})" +
    ")?" +
    "[-–—\\s]*" +
    "(\\d{1,2}:\\d{2}(?::\\d{2})?)" +
    "\\s*" +
    "(AM|PM|am|pm)?" +
    "\\s*(?:[-–—]\\s*)?" +
    "(" + TZ_PATTERN + ")" +
    "(?![A-Za-z])",
    "g"
  );

  function parseMatchToUTCDate(match) {
    const [, isoDate, textDate, timeStr, ampm, tz] = match;

    const [hourStr, minStr, secStr] = timeStr.split(":");
    let hours = Number.parseInt(hourStr, 10);
    const minutes = Number.parseInt(minStr, 10);
    const seconds = secStr ? Number.parseInt(secStr, 10) : 0;

    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return null;
    }

    if (ampm) {
      const upper = ampm.toUpperCase();
      if (upper === "PM" && hours < 12) hours += 12;
      if (upper === "AM" && hours === 12) hours = 0;
    }

    const offsetMinutes = TZ_OFFSETS[tz];
    if (offsetMinutes === undefined) return null;

    let date;
    if (isoDate) {
      const [y, m, d] = isoDate.split(/[-/]/).map(Number);
      date = new Date(Date.UTC(y, m - 1, d, hours, minutes, seconds));
    } else if (textDate) {
      const parsedDate = new Date(`${textDate} ${timeStr}`);
      if (Number.isNaN(parsedDate.getTime())) return null;
      date = new Date(Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        hours,
        minutes,
        seconds
      ));
    } else {
      const now = new Date();
      date = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        seconds
      ));
    }

    date.setUTCMinutes(date.getUTCMinutes() - offsetMinutes);
    return date;
  }

  function formatLocal(utcDate, hadDate, hadSeconds) {
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || "en-US";

    const timeOpts = {
      hour: "numeric",
      minute: "2-digit",
      timeZone: userTZ,
    };
    if (hadSeconds) timeOpts.second = "2-digit";

    if (hadDate) {
      const dateOpts = {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...timeOpts,
      };
      return new Intl.DateTimeFormat(locale, dateOpts).format(utcDate);
    }

    return new Intl.DateTimeFormat(locale, timeOpts).format(utcDate);
  }

  function replaceDateTimes(input) {
    TIME_REGEX.lastIndex = 0;

    return input.replace(TIME_REGEX, (...args) => {
      const fullMatch = args[0];
      const isoDate = args[1];
      const textDate = args[2];
      const timeStr = args[3];
      const ampm = args[4];
      const tz = args[5];

      const utcDate = parseMatchToUTCDate([fullMatch, isoDate, textDate, timeStr, ampm, tz]);
      if (!utcDate || Number.isNaN(utcDate.getTime())) return fullMatch;

      const hadDate = Boolean(isoDate || textDate);
      const hadSeconds = timeStr.split(":").length === 3;
      return formatLocal(utcDate, hadDate, hadSeconds);
    });
  }

  function cleanConvertedText(input) {
    return input
      .replace(/\s+/g, " ")
      .replace(/,\s*/g, ", ")
      .replace(/\s*-\s*/g, " - ")
      .trim();
  }

  function shouldSkipTextNode(node) {
    const parentEl = node.parentElement;
    if (!parentEl) return false;
    return SKIP_TAGS.has(parentEl.tagName);
  }

  function processTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (shouldSkipTextNode(node)) return;

    const original = node.textContent;
    if (!original || !/\d{1,2}:\d{2}/.test(original)) return;

    const result = replaceDateTimes(original);

    if (result !== original) {
      node.textContent = result;
    }
  }

  function shouldSkipElementNode(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return true;
    if (SKIP_TAGS.has(element.tagName)) return true;
    if (element.closest("script, style, noscript, textarea, code, pre")) return true;
    if (element.querySelector("a, button, input, select, textarea")) return true;
    return false;
  }

  function processElementNode(element) {
    if (shouldSkipElementNode(element)) return;

    const originalRaw = element.textContent;
    if (!originalRaw) return;

    const original = cleanConvertedText(originalRaw);
    if (!original) return;
    if (original.length > MAX_ELEMENT_TEXT_LENGTH) return;
    if (!TZ_HINT_REGEX.test(original)) return;
    if (!/\d{1,2}:\d{2}/.test(original)) return;

    const result = cleanConvertedText(replaceDateTimes(original));
    if (result !== original) {
      element.textContent = result;
    }
  }

  function scanTree(root) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      processElementNode(root);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      processTextNode(currentNode);
    }

    if (root.nodeType === Node.ELEMENT_NODE && root.querySelectorAll) {
      const candidates = root.querySelectorAll(ELEMENT_CANDIDATE_SELECTOR);
      for (const candidate of candidates) {
        processElementNode(candidate);
      }
    }
  }

  function observeDynamicContent() {
    if (!document.body) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          processTextNode(mutation.target);
          continue;
        }

        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const addedNode of mutation.addedNodes) {
            scanTree(addedNode);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function start() {
    scanTree(document.body);
    observeDynamicContent();

    // Catch common async rendering windows.
    setTimeout(() => scanTree(document.body), 1000);
    setTimeout(() => scanTree(document.body), 3000);
  }

  chrome.storage.local.get({ enabled: true }, (data) => {
    if (data.enabled) start();
  });
})();
