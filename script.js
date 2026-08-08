let currentDate = new Date();
let selectedDate = new Date();

// ローカルストレージからTODOデータを取得
const loadTodos = () => {
    const stored = localStorage.getItem('todos');
    return stored ? JSON.parse(stored) : {};
};

// ローカルストレージにTODOデータを保存
const saveTodos = (todos) => {
    localStorage.setItem('todos', JSON.stringify(todos));
};

let todos = loadTodos();

// 日付を「YYYY-MM-DD」形式の文字列にする
const dateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// カレンダーを描画
const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 月の最初の日と最後の日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // ヘッダーを更新
    const monthYear = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long'
    }).format(firstDay);
    document.getElementById('monthYear').textContent = monthYear;

    // カレンダーを生成
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = dateToString(date);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        // 今月以外の日付
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }

        // 今日
        if (dateToString(new Date()) === dateStr) {
            dayElement.classList.add('today');
        }

        // 選択日
        if (dateToString(selectedDate) === dateStr) {
            dayElement.classList.add('selected');
        }

        // TODOがある日
        if (todos[dateStr] && todos[dateStr].length > 0) {
            dayElement.classList.add('has-todo');
        }

        // クリックで日付を選択
        dayElement.addEventListener('click', () => {
            if (date.getMonth() === month) {
                selectedDate = new Date(date);
                renderCalendar();
                renderTodos();
            }
        });

        calendar.appendChild(dayElement);
    }
};

// TODOを描画
const renderTodos = () => {
    const dateStr = dateToString(selectedDate);
    const date = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    }).format(selectedDate);

    document.getElementById('selectedDate').textContent = date;

    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    const todosForDate = todos[dateStr] || [];

    if (todosForDate.length === 0) {
        todoList.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">TODOはまだ登録されていません</li>';
        return;
    }

    todosForDate.forEach((todo, index) => {
        const todoItem = document.createElement('li');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => {
            todos[dateStr][index].completed = checkbox.checked;
            saveTodos(todos);
            renderTodos();
        });

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-delete';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
            todos[dateStr].splice(index, 1);
            if (todos[dateStr].length === 0) {
                delete todos[dateStr];
            }
            saveTodos(todos);
            renderCalendar();
            renderTodos();
        });

        todoItem.appendChild(checkbox);
        todoItem.appendChild(text);
        todoItem.appendChild(deleteBtn);
        todoList.appendChild(todoItem);
    });
};

// TODOを追加
const addTodo = () => {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (!text) return;

    const dateStr = dateToString(selectedDate);
    if (!todos[dateStr]) {
        todos[dateStr] = [];
    }

    todos[dateStr].push({
        text: text,
        completed: false
    });

    saveTodos(todos);
    input.value = '';
    renderCalendar();
    renderTodos();
};

// Enterキーで追加
const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        addTodo();
    }
};

// 前の月へ
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

// 次の月へ
document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// 初期化
renderCalendar();
renderTodos();
