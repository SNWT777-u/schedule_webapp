document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Растягиваем приложение на весь экран

    let currentWeekOffset = 0;
    // !!! ВАЖНО: Замените 'https://your-bot-api-url.com' на реальный URL вашего бэкенда
    const API_BASE_URL = 'http://your-server-ip:8080';

    const titleEl = document.getElementById('schedule-title');
    const containerEl = document.getElementById('schedule-container');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const todayBtn = document.getElementById('today');

    // --- ЛОГИКА ---

    const fetchSchedule = async (offset) => {
        try {
            containerEl.innerHTML = '<p>Загрузка...</p>';
            const response = await fetch(`${API_BASE_URL}/api/schedule?week_offset=${offset}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            renderSchedule(data, offset);
        } catch (error) {
            console.error('Fetch error:', error);
            containerEl.innerHTML = '<p>Не удалось загрузить расписание. Попробуйте позже.</p>';
        }
    };

    const renderSchedule = (events, offset) => {
        // Логика группировки по дням
        const scheduleByDay = {};
        events.forEach(event => {
            const day = new Date(event.time_local_iso).getDay(); // 0 = Вс, 1 = Пн ...
            const dayIndex = day === 0 ? 6 : day - 1; // 0 = Пн, ... 6 = Вс
            if (!scheduleByDay[dayIndex]) {
                scheduleByDay[dayIndex] = [];
            }
            scheduleByDay[dayIndex].push(event);
        });

        // Заголовки
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1 + (offset * 7)));
        const endOfWeek = new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 6));

        const formatDate = (date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

        if (offset === 0) titleEl.textContent = 'Текущая неделя';
        else if (offset === 1) titleEl.textContent = 'Следующая неделя';
        else if (offset === -1) titleEl.textContent = 'Прошедшая неделя';
        else titleEl.textContent = `Неделя ${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

        containerEl.innerHTML = ''; // Очищаем контейнер

        const weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + i));
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';

            let dayHtml = `<div class="day-header">${weekdays[i]} <span>${formatDate(dayDate)}</span></div>`;

            if (scheduleByDay[i] && scheduleByDay[i].length > 0) {
                scheduleByDay[i].sort((a, b) => new Date(a.time_local_iso) - new Date(b.time_local_iso));

                scheduleByDay[i].forEach(event => {
                    const eventTime = new Date(event.time_local_iso);
                    const now = new Date();
                    const endTime = new Date(eventTime.getTime() + (event.duration || 7200) * 1000);

                    let statusIcon = '';
                    if (eventTime > now) statusIcon = '🟢';
                    else if (now >= eventTime && now <= endTime) statusIcon = '🔥';
                    else if (event.recording_file_id) statusIcon = '📼';
                    else statusIcon = '☑️';

                    dayHtml += `
                        <div class="event">
                            <span class="event-status">${statusIcon}</span>
                            <div class="event-time">${eventTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div class="event-details">
                                <span class="event-title">${event.subject}: ${event.topic}</span>
                            </div>
                        </div>
                    `;
                });
            } else {
                dayHtml += '<i>Нет запланированных вебинаров.</i>';
            }
            dayCard.innerHTML = dayHtml;
            containerEl.appendChild(dayCard);
        }
    };

    // --- Навигация ---
    prevWeekBtn.addEventListener('click', () => {
        currentWeekOffset--;
        fetchSchedule(currentWeekOffset);
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeekOffset++;
        fetchSchedule(currentWeekOffset);
    });

    todayBtn.addEventListener('click', () => {
        currentWeekOffset = 0;
        fetchSchedule(currentWeekOffset);
    });

    // Первоначальная загрузка
    fetchSchedule(currentWeekOffset);
});