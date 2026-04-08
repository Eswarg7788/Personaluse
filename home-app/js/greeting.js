/* ============================
   Greeting Banner — Time-based greeting + quote
   ============================ */
const Greeting = (() => {
    const quotes = [
        "Make today amazing.",
        "Small steps lead to big results.",
        "Stay focused, stay positive.",
        "Progress, not perfection.",
        "You're doing great!",
        "One task at a time.",
        "Your future self will thank you.",
        "Consistency is the key.",
        "Plan today, shine tomorrow.",
        "Every penny counts.",
        "Today is full of possibilities.",
        "Be productive, be happy.",
        "Dream big, act now.",
        "Challenge yourself daily.",
        "You've got this! 💪",
        "Make every moment count.",
        "Discipline equals freedom.",
        "Start where you are.",
        "Track it to improve it.",
        "Build habits, build life."
    ];

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 5)  return { text: 'Good Night!', emoji: '🌙' };
        if (hour < 12) return { text: 'Good Morning!', emoji: '☀️' };
        if (hour < 17) return { text: 'Good Afternoon!', emoji: '🌤️' };
        if (hour < 21) return { text: 'Good Evening!', emoji: '🌆' };
        return { text: 'Good Night!', emoji: '🌙' };
    }

    function getRandomQuote() {
        // Use date-based seed for consistent daily quote
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        return quotes[seed % quotes.length];
    }

    function getStreak() {
        const KEY = 'appStreak';
        const streakData = JSON.parse(localStorage.getItem(`home_${KEY}`) || '{}');
        const todayStr = App.today();
        
        if (streakData.lastDate === todayStr) {
            return streakData.count || 1;
        }

        // Check if yesterday was visited
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let count = 1;
        if (streakData.lastDate === yesterdayStr) {
            count = (streakData.count || 0) + 1;
        }

        localStorage.setItem(`home_${KEY}`, JSON.stringify({
            lastDate: todayStr,
            count: count
        }));

        return count;
    }

    function refresh() {
        const { text, emoji } = getGreeting();
        const quote = getRandomQuote();
        const streak = getStreak();

        const titleEl = document.getElementById('greetingTitle');
        const emojiEl = document.getElementById('greetingEmoji');
        const quoteEl = document.getElementById('greetingQuote');
        const streakEl = document.getElementById('streakCount');

        if (titleEl) titleEl.textContent = text;
        if (emojiEl) emojiEl.textContent = emoji;
        if (quoteEl) quoteEl.textContent = `"${quote}"`;
        if (streakEl) streakEl.textContent = streak;
    }

    document.addEventListener('DOMContentLoaded', () => {
        refresh();
    });

    return { refresh };
})();
