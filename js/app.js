(function () {
  "use strict";

  var STORAGE_KEY = "diet-tracker-data-v1";
  var DAY_MS = 24 * 60 * 60 * 1000;

  var BADGES = [
    { days: 1, icon: "🌱", label: "はじめの一歩" },
    { days: 3, icon: "🔥", label: "3日坊主突破" },
    { days: 7, icon: "🥉", label: "1週間継続" },
    { days: 14, icon: "🥈", label: "2週間継続" },
    { days: 21, icon: "🥇", label: "習慣化の壁" },
    { days: 30, icon: "🏅", label: "1か月継続" },
    { days: 50, icon: "💪", label: "50日継続" },
    { days: 100, icon: "🏆", label: "100日継続" },
    { days: 200, icon: "🌟", label: "200日継続" },
    { days: 365, icon: "👑", label: "1年継続" }
  ];

  var MOODS = ["😀", "🙂", "😐", "😞"];

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var parsed = JSON.parse(raw);
      return Object.assign(defaultData(), parsed);
    } catch (e) {
      return defaultData();
    }
  }

  function defaultData() {
    return {
      entries: {},
      startWeight: null,
      goalWeight: null,
      unlockedBadges: {},
      reminderHour: 20,
      lastNotifiedDate: null
    };
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  var data = loadData();

  function todayStr() {
    return formatDate(new Date());
  }

  function formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseDate(str) {
    var parts = str.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function sortedDates() {
    return Object.keys(data.entries).sort();
  }

  function currentStreak() {
    var dates = new Set(Object.keys(data.entries));
    if (dates.size === 0) return 0;
    var cursor = new Date();
    if (!dates.has(formatDate(cursor))) {
      cursor = new Date(cursor.getTime() - DAY_MS);
      if (!dates.has(formatDate(cursor))) return 0;
    }
    var streak = 0;
    while (dates.has(formatDate(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return streak;
  }

  function bestStreak() {
    var dates = sortedDates();
    if (dates.length === 0) return 0;
    var best = 1;
    var run = 1;
    for (var i = 1; i < dates.length; i++) {
      var prev = parseDate(dates[i - 1]);
      var cur = parseDate(dates[i]);
      if (cur.getTime() - prev.getTime() === DAY_MS) {
        run++;
      } else {
        run = 1;
      }
      if (run > best) best = run;
    }
    return best;
  }

  function updateBadges() {
    var best = bestStreak();
    BADGES.forEach(function (b) {
      if (best >= b.days && !data.unlockedBadges[b.days]) {
        data.unlockedBadges[b.days] = todayStr();
      }
    });
  }

  function minWeightBeforeOrOn(dateStr) {
    var dates = sortedDates().filter(function (d) { return d <= dateStr; });
    var min = Infinity;
    dates.forEach(function (d) {
      var w = data.entries[d].weight;
      if (w < min) min = w;
    });
    return min;
  }

  function renderStreak() {
    document.getElementById("streakNum").textContent = currentStreak();
  }

  function renderMessage() {
    var streak = currentStreak();
    var total = sortedDates().length;
    var el = document.getElementById("encourageMessage");
    var msg;
    var loggedToday = !!data.entries[todayStr()];
    if (total === 0) {
      msg = "今日の記録から始めましょう！小さな一歩が継続の力になります。";
    } else if (!loggedToday) {
      if (streak > 0) {
        msg = "現在" + streak + "日連続中！今日も記録して継続を伸ばしましょう。";
      } else {
        msg = "また今日から始めましょう。記録を再開すれば継続はいつでもやり直せます。";
      }
    } else if (streak === 1) {
      msg = "記録できました！まずは3日続けることを目指しましょう。";
    } else if (streak < 7) {
      msg = streak + "日連続達成中！この調子でいきましょう。";
    } else if (streak < 30) {
      msg = "素晴らしい！" + streak + "日連続です。習慣になってきていますね。";
    } else {
      msg = "驚異の" + streak + "日連続！あなたはもう継続のプロです。";
    }
    el.textContent = msg;
  }

  function renderProgress() {
    var stats = document.getElementById("progressStats");
    var fill = document.getElementById("progressBarFill");
    document.getElementById("startWeightInput").value = data.startWeight || "";
    document.getElementById("goalWeightInput").value = data.goalWeight || "";

    var dates = sortedDates();
    var current = dates.length ? data.entries[dates[dates.length - 1]].weight : null;
    var start = data.startWeight;
    var goal = data.goalWeight;

    var parts = [];
    parts.push({ label: "開始", value: start != null ? start + " kg" : "-" });
    parts.push({ label: "現在", value: current != null ? current + " kg" : "-" });
    parts.push({ label: "目標", value: goal != null ? goal + " kg" : "-" });

    if (start != null && current != null) {
      var lost = (start - current).toFixed(1);
      parts.push({ label: "変化", value: (lost >= 0 ? "-" : "+") + Math.abs(lost) + " kg" });
    }

    stats.innerHTML = parts.map(function (p) {
      return '<div class="stat"><strong>' + p.value + '</strong><span>' + p.label + '</span></div>';
    }).join("");

    var pct = 0;
    if (start != null && goal != null && current != null && start !== goal) {
      pct = ((start - current) / (start - goal)) * 100;
      pct = Math.max(0, Math.min(100, pct));
    }
    fill.style.width = pct + "%";
  }

  function renderChart() {
    var canvas = document.getElementById("weightChart");
    var hint = document.getElementById("chartEmptyHint");
    var dates = sortedDates();
    if (dates.length < 2) {
      canvas.style.display = "none";
      hint.style.display = "block";
      return;
    }
    canvas.style.display = "block";
    hint.style.display = "none";

    var dpr = window.devicePixelRatio || 1;
    var cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth;
    var cssHeight = 220;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.height = cssHeight + "px";

    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    var weights = dates.map(function (d) { return data.entries[d].weight; });
    var allValues = weights.slice();
    if (data.goalWeight != null) allValues.push(data.goalWeight);
    var min = Math.min.apply(null, allValues) - 1;
    var max = Math.max.apply(null, allValues) + 1;

    var padL = 36, padR = 10, padT = 12, padB = 24;
    var w = cssWidth - padL - padR;
    var h = cssHeight - padT - padB;

    function x(i) { return padL + (dates.length === 1 ? 0 : (i / (dates.length - 1)) * w); }
    function y(v) { return padT + h - ((v - min) / (max - min)) * h; }

    var styles = getComputedStyle(document.documentElement);
    var textColor = styles.getPropertyValue("--text-muted").trim() || "#888";
    var lineColor = styles.getPropertyValue("--primary").trim() || "#2f9e6e";
    var goalColor = styles.getPropertyValue("--accent").trim() || "#ff9f43";

    ctx.strokeStyle = "#00000015";
    ctx.fillStyle = textColor;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    var steps = 4;
    for (var s = 0; s <= steps; s++) {
      var v = min + ((max - min) * s) / steps;
      var yy = y(v);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + w, yy);
      ctx.stroke();
      ctx.fillText(v.toFixed(1), padL - 6, yy + 3);
    }

    if (data.goalWeight != null) {
      ctx.strokeStyle = goalColor;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y(data.goalWeight));
      ctx.lineTo(padL + w, y(data.goalWeight));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    dates.forEach(function (d, i) {
      var px = x(i), py = y(data.entries[d].weight);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.fillStyle = lineColor;
    dates.forEach(function (d, i) {
      ctx.beginPath();
      ctx.arc(x(i), y(data.entries[d].weight), 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    var labelCount = Math.min(5, dates.length);
    for (var li = 0; li < labelCount; li++) {
      var idx = Math.round((li / (labelCount - 1 || 1)) * (dates.length - 1));
      var label = dates[idx].slice(5);
      ctx.fillText(label, x(idx), cssHeight - 6);
    }
  }

  function renderCalendar() {
    var container = document.getElementById("calendarHeatmap");
    container.innerHTML = "";
    var totalDays = 119; // 17 weeks
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var start = new Date(today.getTime() - (totalDays - 1) * DAY_MS);
    // align start to Sunday
    start = new Date(start.getTime() - start.getDay() * DAY_MS);

    var cursor = new Date(start);
    var cells = [];
    while (cursor <= today || cursor.getDay() !== 0) {
      cells.push(new Date(cursor));
      cursor = new Date(cursor.getTime() + DAY_MS);
      if (cells.length > 140) break;
    }

    cells.forEach(function (d) {
      var ds = formatDate(d);
      var cell = document.createElement("div");
      if (d > today) {
        cell.className = "cal-cell future";
      } else {
        var entry = data.entries[ds];
        cell.className = "cal-cell" + (entry ? " logged" : "");
        if (entry) {
          var isBest = entry.weight <= minWeightBeforeOrOn(ds);
          if (isBest) cell.className += " best";
          cell.title = ds + ": " + entry.weight + "kg" + (entry.mood ? " " + entry.mood : "");
        } else {
          cell.title = ds;
        }
      }
      container.appendChild(cell);
    });
  }

  function renderBadges() {
    var grid = document.getElementById("badgesGrid");
    grid.innerHTML = BADGES.map(function (b) {
      var unlocked = !!data.unlockedBadges[b.days];
      return '<div class="badge' + (unlocked ? " unlocked" : "") + '" title="' + b.days + '日連続で解除">' +
        '<span class="badge-icon">' + b.icon + '</span>' +
        '<span class="badge-label">' + b.label + '</span></div>';
    }).join("");
  }

  function renderStats() {
    var grid = document.getElementById("statsGrid");
    var dates = sortedDates();
    var weights = dates.map(function (d) { return data.entries[d].weight; });
    var lowest = weights.length ? Math.min.apply(null, weights) : null;
    var boxes = [
      { label: "総記録日数", value: dates.length + "日" },
      { label: "最長連続記録", value: bestStreak() + "日" },
      { label: "最軽量", value: lowest != null ? lowest + " kg" : "-" },
      { label: "現在の連続記録", value: currentStreak() + "日" }
    ];
    grid.innerHTML = boxes.map(function (b) {
      return '<div class="stat-box"><strong>' + b.value + '</strong><span>' + b.label + '</span></div>';
    }).join("");
  }

  function renderHistory() {
    var list = document.getElementById("historyList");
    var dates = sortedDates().slice().reverse().slice(0, 30);
    if (dates.length === 0) {
      list.innerHTML = '<p class="empty-hint">まだ記録がありません。</p>';
      return;
    }
    list.innerHTML = dates.map(function (d) {
      var e = data.entries[d];
      return '<div class="history-row"><span class="h-date">' + d + ' ' + (e.mood || "") + '</span>' +
        '<span>' + e.weight + ' kg' + (e.bodyFat ? " / " + e.bodyFat + "%" : "") + '</span>' +
        '<button class="h-delete" data-date="' + d + '">削除</button></div>';
    }).join("");
  }

  function renderAll() {
    updateBadges();
    saveData();
    renderStreak();
    renderMessage();
    renderProgress();
    renderChart();
    renderCalendar();
    renderBadges();
    renderStats();
    renderHistory();
  }

  // ---- form wiring ----
  var selectedMood = null;

  function initForm() {
    var dateInput = document.getElementById("dateInput");
    dateInput.value = todayStr();
    dateInput.max = todayStr();
    document.getElementById("todayDateLabel").textContent =
      "(" + parseDate(todayStr()).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" }) + ")";

    document.getElementById("moodPicker").addEventListener("click", function (e) {
      var btn = e.target.closest(".mood-btn");
      if (!btn) return;
      var isSame = btn.classList.contains("selected");
      document.querySelectorAll(".mood-btn").forEach(function (b) { b.classList.remove("selected"); });
      if (!isSame) {
        btn.classList.add("selected");
        selectedMood = btn.dataset.mood;
      } else {
        selectedMood = null;
      }
    });

    document.getElementById("entryForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var date = dateInput.value || todayStr();
      var weight = parseFloat(document.getElementById("weightInput").value);
      if (isNaN(weight)) return;
      var fat = document.getElementById("fatInput").value;
      var memo = document.getElementById("memoInput").value.trim();

      data.entries[date] = {
        weight: weight,
        bodyFat: fat ? parseFloat(fat) : null,
        memo: memo || null,
        mood: selectedMood
      };
      if (data.startWeight == null) {
        data.startWeight = weight;
      }
      document.getElementById("entryForm").reset();
      dateInput.value = todayStr();
      selectedMood = null;
      document.querySelectorAll(".mood-btn").forEach(function (b) { b.classList.remove("selected"); });
      renderAll();
    });

    document.getElementById("goalForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var sw = parseFloat(document.getElementById("startWeightInput").value);
      var gw = parseFloat(document.getElementById("goalWeightInput").value);
      data.startWeight = isNaN(sw) ? data.startWeight : sw;
      data.goalWeight = isNaN(gw) ? null : gw;
      renderAll();
    });

    document.getElementById("historyList").addEventListener("click", function (e) {
      var btn = e.target.closest(".h-delete");
      if (!btn) return;
      var d = btn.dataset.date;
      if (confirm(d + " の記録を削除しますか？")) {
        delete data.entries[d];
        renderAll();
      }
    });
  }

  function initDataControls() {
    document.getElementById("exportBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "diet-tracker-" + todayStr() + ".json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("importInput").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(reader.result);
          if (!confirm("現在のデータを上書きしてインポートしますか？")) return;
          data = Object.assign(defaultData(), imported);
          renderAll();
        } catch (err) {
          alert("読み込みに失敗しました。正しいJSONファイルを選択してください。");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    document.getElementById("resetBtn").addEventListener("click", function () {
      if (confirm("全ての記録を削除します。この操作は元に戻せません。よろしいですか？")) {
        data = defaultData();
        renderAll();
      }
    });
  }

  function initReminder() {
    var select = document.getElementById("reminderHour");
    for (var h = 0; h < 24; h++) {
      var opt = document.createElement("option");
      opt.value = h;
      opt.textContent = h + ":00";
      select.appendChild(opt);
    }
    select.value = data.reminderHour;
    select.addEventListener("change", function () {
      data.reminderHour = parseInt(select.value, 10);
      saveData();
    });

    var statusEl = document.getElementById("notifStatus");
    function updateStatus() {
      if (!("Notification" in window)) {
        statusEl.textContent = "このブラウザは通知に対応していません。";
        return;
      }
      if (Notification.permission === "granted") {
        statusEl.textContent = "通知は有効です。";
      } else if (Notification.permission === "denied") {
        statusEl.textContent = "通知がブロックされています。ブラウザ設定から許可してください。";
      } else {
        statusEl.textContent = "通知は未設定です。";
      }
    }
    updateStatus();

    document.getElementById("enableNotifBtn").addEventListener("click", function () {
      if (!("Notification" in window)) return;
      Notification.requestPermission().then(updateStatus);
    });

    checkReminder();
  }

  function checkReminder() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    var now = new Date();
    var today = todayStr();
    if (data.entries[today]) return;
    if (now.getHours() < data.reminderHour) return;
    if (data.lastNotifiedDate === today) return;
    new Notification("つづくダイエット", {
      body: "今日はまだ記録していません。継続のために記録しましょう！",
      icon: undefined
    });
    data.lastNotifiedDate = today;
    saveData();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initForm();
    initDataControls();
    initReminder();
    renderAll();
    window.addEventListener("resize", renderChart);
  });
})();
