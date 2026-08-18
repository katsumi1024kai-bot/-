let view = new Date();
let selected = new Date();
let todos = JSON.parse(localStorage.getItem('todos') || '{}');
let currentPriority = 'must';

const PRIORITY_ORDER = { must: 0, should: 1, want: 2 };
const PRIORITY_LABEL = { must: '必須', should: '推奨', want: 'やりたい' };

const save = () => localStorage.setItem('todos', JSON.stringify(todos));
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

document.getElementById('todayLabel').textContent =
    new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());

function renderCalendar() {
    const y = view.getFullYear(), m = view.getMonth();
    document.getElementById('monthYear').textContent =
        new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(new Date(y, m, 1));

    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());

    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const todayKey = key(new Date());
    const selKey = key(selected);

    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const btn = document.createElement('button');
        btn.className = 'day';
        btn.textContent = d.getDate();
        const k = key(d);
        const inMonth = d.getMonth() === m;
        if (!inMonth) btn.classList.add('pad');
        if (k === todayKey) btn.classList.add('today');
        if (k === selKey) btn.classList.add('selected');
        if (todos[k] && todos[k].length) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            btn.appendChild(dot);
        }
        btn.addEventListener('click', () => {
            if (!inMonth) return;
            selected = d;
            renderCalendar();
            renderTodos();
        });
        grid.appendChild(btn);
    }
}

function sortedItems(items) {
    return items
        .map((todo, i) => ({ todo, i }))
        .sort((a, b) => {
            if (a.todo.done !== b.todo.done) return a.todo.done ? 1 : -1;
            return PRIORITY_ORDER[a.todo.priority || 'must'] - PRIORITY_ORDER[b.todo.priority || 'must'];
        });
}

function renderTodos() {
    document.getElementById('selectedLabel').textContent =
        new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(selected);

    const k = key(selected);
    const items = todos[k] || [];
    const doneCount = items.filter(t => t.done).length;
    document.getElementById('count').textContent = items.length ? `${doneCount} / ${items.length} 完了` : '';

    const list = document.getElementById('list');
    list.innerHTML = '';

    if (!items.length) {
        list.innerHTML = '<li class="empty">この日のTODOはまだありません</li>';
        return;
    }

    sortedItems(items).forEach(({ todo, i }) => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.done ? ' done' : '');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = todo.done;
        cb.addEventListener('change', () => {
            todos[k][i].done = cb.checked;
            save();
            renderTodos();
        });

        const text = document.createElement('span');
        text.className = 'text';

        const chip = document.createElement('span');
        const p = todo.priority || 'must';
        chip.className = `prio-chip prio-${p}`;
        chip.textContent = PRIORITY_LABEL[p];
        text.appendChild(chip);
        text.appendChild(document.createTextNode(todo.text));

        const del = document.createElement('button');
        del.className = 'del';
        del.textContent = '削除';
        del.addEventListener('click', () => {
            todos[k].splice(i, 1);
            if (!todos[k].length) delete todos[k];
            save();
            renderCalendar();
            renderTodos();
        });

        li.append(cb, text, del);
        list.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('input');
    const text = input.value.trim();
    if (!text) return;
    const k = key(selected);
    if (!todos[k]) todos[k] = [];
    todos[k].push({ text, done: false, priority: currentPriority });
    save();
    input.value = '';
    renderCalendar();
    renderTodos();
}

document.getElementById('addBtn').addEventListener('click', addTodo);
document.getElementById('input').addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });
document.getElementById('prev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); renderCalendar(); });
document.getElementById('next').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); renderCalendar(); });

document.querySelectorAll('.prio-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        currentPriority = btn.dataset.p;
        document.querySelectorAll('.prio-btn').forEach((b) => b.classList.toggle('active', b === btn));
    });
});

renderCalendar();
renderTodos();
