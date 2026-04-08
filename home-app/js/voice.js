/* ============================
   Voice Notes Module
   ============================ */

const Voice = (() => {
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordingTimer = null;
    let seconds = 0;

    function init() {
        const recBtn = App.$('#btnVoiceRecord');
        if (recBtn) recBtn.addEventListener('click', toggleRecording);
    }

    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
            audioChunks = [];
            seconds = 0;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                const reader = new FileReader();
                reader.onload = () => {
                    const audioData = reader.result;
                    App.$('#voiceAudioData').value = audioData;
                    App.$('#voicePreview').innerHTML = `
                        <audio controls src="${audioData}" class="voice-audio-player"></audio>
                        <button type="button" class="voice-remove-btn" onclick="Voice.clearRecording()">
                            <span class="material-icons-round">delete</span>
                        </button>
                    `;
                    App.$('#voicePreview').style.display = 'flex';
                };
                reader.readAsDataURL(blob);
            };

            mediaRecorder.start();
            isRecording = true;
            updateRecordingUI(true);
            recordingTimer = setInterval(() => {
                seconds++;
                App.$('#voiceTimer').textContent = formatTime(seconds);
            }, 1000);
        } catch (err) {
            App.showToast('Microphone access denied', 'error');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        clearInterval(recordingTimer);
        updateRecordingUI(false);
    }

    function clearRecording() {
        App.$('#voiceAudioData').value = '';
        const preview = App.$('#voicePreview');
        if (preview) {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    }

    function updateRecordingUI(recording) {
        const btn = App.$('#btnVoiceRecord');
        const timer = App.$('#voiceTimer');
        const indicator = App.$('#voiceRecIndicator');
        if (btn) {
            btn.classList.toggle('recording', recording);
            btn.querySelector('.material-icons-round').textContent = recording ? 'stop' : 'mic';
        }
        if (timer) timer.textContent = recording ? '0:00' : '';
        if (indicator) indicator.style.display = recording ? 'flex' : 'none';
    }

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function getSupportedMimeType() {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
        for (const t of types) {
            if (MediaRecorder.isTypeSupported(t)) return t;
        }
        return 'audio/webm';
    }

    function renderAudioPlayer(audioData) {
        if (!audioData) return '';
        return `<div class="voice-note-player">
            <audio controls src="${audioData}" class="voice-audio-player"></audio>
        </div>`;
    }

    function getRecordedAudio() {
        const input = App.$('#voiceAudioData');
        return input ? input.value : '';
    }

    document.addEventListener('DOMContentLoaded', init);

    return { toggleRecording, clearRecording, renderAudioPlayer, getRecordedAudio };
})();
