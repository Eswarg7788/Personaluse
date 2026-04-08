/* ============================
   Kanban Board — Visual Task Management
   ============================ */
const Kanban = (() => {
    const columns = [
        { id: 'pending', title: 'To Do', icon: 'inbox', color: '#3b82f6' },
        { id: 'in-progress', title: 'In Progress', icon: 'autorenew', color: '#f59e0b' },
        { id: 'completed', title: 'Done', icon: 'check_circle', color: '#22c55e' }
    ];

    let draggedId = null;

    function refresh() {
        const container = document.getElementById('kanbanBoard');
        if (!container) return;
        const tasks = App.getData('tasks');

        let html = '';
        columns.forEach(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            html += `
            <div class="kanban-column" data-status="${col.id}">
                <div class="kanban-col-header" style="border-color:${col.color}">
                    <span class="material-icons-round" style="color:${col.color}">${col.icon}</span>
                    <span class="kanban-col-title">${col.title}</span>
                    <span class="kanban-col-count">${colTasks.length}</span>
                </div>
                <div class="kanban-col-body" data-status="${col.id}"
                     ondragover="event.preventDefault(); this.classList.add('drag-over')"
                     ondragleave="this.classList.remove('drag-over')"
                     ondrop="Kanban.handleDrop(event, '${col.id}')">
                    ${colTasks.length === 0 ? '<div class="kanban-empty">Drop tasks here</div>' :
                    colTasks.map(t => `
                        <div class="kanban-card" draggable="true"
                             data-id="${t.id}"
                             ondragstart="Kanban.handleDragStart(event, '${t.id}')"
                             ondragend="Kanban.handleDragEnd(event)">
                            <div class="kanban-card-title">${escHtml(t.title)}</div>
                            ${t.desc ? `<div class="kanban-card-desc">${escHtml(t.desc).substring(0,60)}</div>` : ''}
                            <div class="kanban-card-meta">
                                <span class="material-icons-round">calendar_today</span>
                                <span>${t.date ? App.formatDateShort(t.date) : 'No date'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });

        container.innerHTML = html;

        // Touch support for mobile
        initTouchDrag();
    }

    function escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    function handleDragStart(e, id) {
        draggedId = id;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.kanban-col-body').forEach(b => b.classList.remove('drag-over'));
    }

    function handleDrop(e, status) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain') || draggedId;
        if (!id) return;

        const body = e.currentTarget || e.target.closest('.kanban-col-body');
        if (body) body.classList.remove('drag-over');

        const tasks = App.getData('tasks');
        const task = tasks.find(t => t.id === id);
        if (task && task.status !== status) {
            task.status = status;
            task.updatedAt = Date.now();
            App.setData('tasks', tasks);
            App.showToast(`Task moved to ${columns.find(c=>c.id===status).title}`, 'success');
            refresh();
        }
        draggedId = null;
    }

    // Mobile touch drag support
    function initTouchDrag() {
        let touchCard = null;
        let ghost = null;
        let touchId = null;

        document.querySelectorAll('.kanban-card').forEach(card => {
            card.addEventListener('touchstart', (e) => {
                touchCard = card;
                touchId = card.dataset.id;
                setTimeout(() => {
                    if (touchCard) {
                        ghost = touchCard.cloneNode(true);
                        ghost.classList.add('kanban-ghost');
                        document.body.appendChild(ghost);
                        touchCard.classList.add('dragging');
                    }
                }, 200);
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                if (!ghost) return;
                e.preventDefault();
                const touch = e.touches[0];
                ghost.style.left = touch.clientX - 80 + 'px';
                ghost.style.top = touch.clientY - 30 + 'px';

                document.querySelectorAll('.kanban-col-body').forEach(b => {
                    const rect = b.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        b.classList.add('drag-over');
                    } else {
                        b.classList.remove('drag-over');
                    }
                });
            }, { passive: false });

            card.addEventListener('touchend', (e) => {
                if (ghost) {
                    const touch = e.changedTouches[0];
                    document.querySelectorAll('.kanban-col-body').forEach(b => {
                        const rect = b.getBoundingClientRect();
                        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                            const status = b.dataset.status;
                            if (touchId && status) {
                                const tasks = App.getData('tasks');
                                const task = tasks.find(t => t.id === touchId);
                                if (task && task.status !== status) {
                                    task.status = status;
                                    task.updatedAt = Date.now();
                                    App.setData('tasks', tasks);
                                    App.showToast(`Task moved!`, 'success');
                                }
                            }
                        }
                        b.classList.remove('drag-over');
                    });
                    ghost.remove();
                    ghost = null;
                    if (touchCard) touchCard.classList.remove('dragging');
                    touchCard = null;
                    touchId = null;
                    refresh();
                }
            });
        });
    }

    return { refresh, handleDragStart, handleDragEnd, handleDrop };
})();
