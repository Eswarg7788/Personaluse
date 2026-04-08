/* ============================
   Themes & Customization Module
   ============================ */

const Themes = (() => {
    const presets = {
        midnight: {
            name: 'Midnight', icon: '🌙',
            vars: { '--bg-primary': '#0a0e1a', '--bg-secondary': '#111827', '--bg-card': 'rgba(17,24,39,0.8)', '--accent': '#06b6d4', '--accent-glow': 'rgba(6,182,212,0.3)', '--accent-light': '#22d3ee' }
        },
        ocean: {
            name: 'Ocean', icon: '🌊',
            vars: { '--bg-primary': '#0c1426', '--bg-secondary': '#0f1d35', '--bg-card': 'rgba(15,29,53,0.8)', '--accent': '#0ea5e9', '--accent-glow': 'rgba(14,165,233,0.3)', '--accent-light': '#38bdf8' }
        },
        forest: {
            name: 'Forest', icon: '🌿',
            vars: { '--bg-primary': '#0a1a0f', '--bg-secondary': '#112418', '--bg-card': 'rgba(17,36,24,0.8)', '--accent': '#10b981', '--accent-glow': 'rgba(16,185,129,0.3)', '--accent-light': '#34d399' }
        },
        sunset: {
            name: 'Sunset', icon: '🌅',
            vars: { '--bg-primary': '#1a0e0a', '--bg-secondary': '#271511', '--bg-card': 'rgba(39,21,17,0.8)', '--accent': '#f97316', '--accent-glow': 'rgba(249,115,22,0.3)', '--accent-light': '#fb923c' }
        },
        sakura: {
            name: 'Sakura', icon: '🌸',
            vars: { '--bg-primary': '#1a0a18', '--bg-secondary': '#271127', '--bg-card': 'rgba(39,17,39,0.8)', '--accent': '#ec4899', '--accent-glow': 'rgba(236,72,153,0.3)', '--accent-light': '#f472b6' }
        },
        aurora: {
            name: 'Aurora', icon: '✨',
            vars: { '--bg-primary': '#0a0a1a', '--bg-secondary': '#111127', '--bg-card': 'rgba(17,17,39,0.8)', '--accent': '#8b5cf6', '--accent-glow': 'rgba(139,92,246,0.3)', '--accent-light': '#a78bfa' }
        }
    };

    function init() {
        renderThemePicker();
        renderAccentPicker();
        loadSavedTheme();
    }

    function renderThemePicker() {
        const container = App.$('#themePresetGrid');
        if (!container) return;
        const current = App.getSetting('theme_preset') || 'midnight';
        container.innerHTML = Object.entries(presets).map(([key, p]) => `
            <button class="theme-preset-card ${key === current ? 'active' : ''}" onclick="Themes.applyPreset('${key}')">
                <span class="theme-preset-icon">${p.icon}</span>
                <span class="theme-preset-name">${p.name}</span>
                <div class="theme-preset-preview" style="background:${p.vars['--bg-primary']}">
                    <span style="background:${p.vars['--accent']};width:20px;height:4px;border-radius:2px;display:block"></span>
                </div>
            </button>
        `).join('');
    }

    function renderAccentPicker() {
        const container = App.$('#accentColorGrid');
        if (!container) return;
        const colors = ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#14b8a6'];
        const current = App.getSetting('accent_color') || '#06b6d4';
        container.innerHTML = colors.map(c => `
            <button class="accent-color-btn ${c === current ? 'active' : ''}" 
                style="background:${c}" onclick="Themes.setAccent('${c}')">
                ${c === current ? '<span class="material-icons-round" style="font-size:16px;color:white">check</span>' : ''}
            </button>
        `).join('');
    }

    function applyPreset(presetKey) {
        const preset = presets[presetKey];
        if (!preset) return;

        App.setSetting('theme_preset', presetKey);
        // Apply dark theme base
        document.documentElement.setAttribute('data-theme', 'dark');
        App.setSetting('theme', 'dark');

        Object.entries(preset.vars).forEach(([prop, val]) => {
            document.documentElement.style.setProperty(prop, val);
        });

        // Update the header icon
        const icon = App.$('#themeIcon');
        if (icon) icon.textContent = 'light_mode';
        const meta = App.$('#metaThemeColor');
        if (meta) meta.setAttribute('content', preset.vars['--bg-primary']);

        App.showToast(`${preset.icon} ${preset.name} theme applied`, 'success');
        renderThemePicker();
    }

    function setAccent(color) {
        App.setSetting('accent_color', color);
        document.documentElement.style.setProperty('--accent', color);
        // Compute glow
        const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
        document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.3)`);
        document.documentElement.style.setProperty('--accent-light', color);
        renderAccentPicker();
        App.showToast('Accent color updated', 'success');
    }

    function loadSavedTheme() {
        const preset = App.getSetting('theme_preset');
        const accent = App.getSetting('accent_color');
        const themeMode = App.getSetting('theme') || 'dark';

        if (themeMode === 'light') {
            // Light mode - clear preset vars
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (preset && presets[preset]) {
            applyPresetSilent(preset);
        }

        if (accent) {
            const r = parseInt(accent.slice(1, 3), 16), g = parseInt(accent.slice(3, 5), 16), b = parseInt(accent.slice(5, 7), 16);
            document.documentElement.style.setProperty('--accent', accent);
            document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.3)`);
            document.documentElement.style.setProperty('--accent-light', accent);
        }
    }

    function applyPresetSilent(presetKey) {
        const preset = presets[presetKey];
        if (!preset) return;
        document.documentElement.setAttribute('data-theme', 'dark');
        Object.entries(preset.vars).forEach(([prop, val]) => {
            document.documentElement.style.setProperty(prop, val);
        });
    }

    function switchToLight() {
        // Clear custom properties
        const props = ['--bg-primary', '--bg-secondary', '--bg-card', '--accent', '--accent-glow', '--accent-light'];
        props.forEach(p => document.documentElement.style.removeProperty(p));
        document.documentElement.setAttribute('data-theme', 'light');
        App.setSetting('theme', 'light');
        App.setSetting('theme_preset', '');
        const icon = App.$('#themeIcon');
        if (icon) icon.textContent = 'dark_mode';
        renderThemePicker();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { applyPreset, setAccent, switchToLight, loadSavedTheme };
})();
