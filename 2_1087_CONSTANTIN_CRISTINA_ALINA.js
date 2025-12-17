document.addEventListener("DOMContentLoaded", () => {
    // --- VARIABILE GLOBALE ---
    const video = document.getElementById('videoElement');
    const playlistContainer = document.getElementById('playlist');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const effectSelect = document.getElementById('effectSelect');

    const previewVideo = document.createElement('video');
    previewVideo.muted = true;
    previewVideo.preload = "auto";

    let isProcessing = false;
    let showPreview = false;
    let previewX = 0;
    let previewTime = 0;

    const MAX_WIDTH = 720; 
    const controlsHeight = 50; 
    const btnWidth = 60;

    let playlistData = [
        { name: "Film 1", src: "media/video1.mp4" },
        { name: "Film 2", src: "media/video2.mp4" },
        { name: "Film 3", src: "media/video3.mp4" },
        { name: "Film 4", src: "media/video4.mp4" },
    ];
    let currentTrack = 0;

    // --- LOGICĂ PLAYLIST ---
    function moveTrack(index, direction) {
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < playlistData.length) {
            const temp = playlistData[index];
            playlistData[index] = playlistData[targetIndex];
            playlistData[targetIndex] = temp;
            if (currentTrack === index) currentTrack = targetIndex;
            else if (currentTrack === targetIndex) currentTrack = index;
            renderPlaylist();
        }
    }

    function deleteTrack(index, event) {
        event.stopPropagation();
        playlistData.splice(index, 1);
        if (index === currentTrack) {
            if (playlistData.length > 0) {
                currentTrack = index < playlistData.length ? index : playlistData.length - 1;
                loadTrack(currentTrack);
            } else {
                video.src = "";
                currentTrack = -1;
            }
        } else if (index < currentTrack) {
            currentTrack--;
        }
        renderPlaylist();
    }

    function renderPlaylist() {
        playlistContainer.innerHTML = "";
        playlistData.forEach((item, index) => {
            const li = document.createElement('li');
            if (index === currentTrack) li.style.borderLeft = "4px solid #e74c3c";
            li.innerHTML = `
                <span class="track-name">${item.name}</span>
                <div class="track-controls">
                    <button class="btn-control btn-up">▲</button>
                    <button class="btn-control btn-down">▼</button>
                    <button class="btn-control btn-delete">✖</button>
                </div>
            `;
            li.addEventListener('click', () => loadTrack(index));
            li.querySelector('.btn-up').addEventListener('click', (e) => { e.stopPropagation(); moveTrack(index, -1); });
            li.querySelector('.btn-down').addEventListener('click', (e) => { e.stopPropagation(); moveTrack(index, 1); });
            li.querySelector('.btn-delete').addEventListener('click', (e) => deleteTrack(index, e));
            playlistContainer.appendChild(li);
        });
    }

    function loadTrack(index) {
        if (index >= 0 && index < playlistData.length) {
            currentTrack = index;
            const source = playlistData[currentTrack].src;
            video.src = source;
            previewVideo.src = source; // Sincronizăm sursa pentru preview

            video.onloadedmetadata = () => {
                let scale = Math.min(1, MAX_WIDTH / video.videoWidth);
                canvas.width = video.videoWidth * scale;
                canvas.height = video.videoHeight * scale;
                drawFrame(); 
            };
            video.play();
            renderPlaylist();
        }
    }

    // --- ENGINE VIDEO & CONTROALE ---
    function drawControls() {
        const y = canvas.height - controlsHeight;
        const barX = btnWidth * 3 + 10;
        const barWidth = canvas.width - (btnWidth * 4) - 40;
        
        // Fundal bară
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, y, canvas.width, controlsHeight);

        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";

        // Butoane
        ctx.fillText("|<", 20, y + 32);
        ctx.fillText(video.paused ? "▶" : "II", btnWidth + 20, y + 32);
        ctx.fillText(">|", (btnWidth * 2) + 20, y + 32);

        // Progress Bar fundal
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(barX, y + 22, barWidth, 8);
        
        // Progress Bar activ
        if (video.duration) {
            const progress = (video.currentTime / video.duration) * barWidth;
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(barX, y + 22, progress, 8);
        }

        // Volum
        ctx.fillStyle = "white";
        ctx.fillText("VOL", canvas.width - 50, y + 32);

        // LOGICĂ DESENARE PREVIEW CADRU
        if (showPreview && video.duration) {
            const pWidth = 140;
            const pHeight = 80;
            const pX = Math.max(10, Math.min(previewX - pWidth / 2, canvas.width - pWidth - 10));
            const pY = y - pHeight - 15;

            // Chenar alb
            ctx.fillStyle = "black";
            ctx.fillRect(pX - 2, pY - 2, pWidth + 4, pHeight + 4);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(pX, pY, pWidth, pHeight);
            
            // Desenăm cadrul din video-ul de preview
            ctx.drawImage(previewVideo, pX, pY, pWidth, pHeight);

            // Timp preview
            ctx.fillStyle = "white";
            ctx.font = "11px Arial";
            const m = Math.floor(previewTime / 60);
            const s = Math.floor(previewTime % 60);
            ctx.fillText(`${m}:${s < 10 ? '0' : ''}${s}`, pX + (pWidth/2) - 15, pY + pHeight + 12);
        }
    }

    function drawFrame() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const effect = effectSelect.value;
        if (effect !== "none") {
            let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let data = frame.data;
            for (let i = 0; i < data.length; i += 4) {
                if (effect === "filtru-albastru") {
                    data[i] *= 0.2; data[i+1] *= 0.5; data[i+2] *= 1.5;
                } else if (effect === "filtru-rosu") {
                    data[i] *= 1.5; data[i+1] *= 0.2; data[i+2] *= 0.2;
                } else if (effect === "high-contrast") {
                    let v = ((data[i] + data[i+1] + data[i+2]) / 3) > 128 ? 255 : 0;
                    data[i] = data[i+1] = data[i+2] = v;
                }
            }
            ctx.putImageData(frame, 0, 0);
        }
        drawControls();
    }

    function computeFrame() {
        if (!isProcessing || video.paused || video.ended) {
            isProcessing = false;
            drawFrame();
            return;
        }
        drawFrame();
        requestAnimationFrame(computeFrame);
    }

    // --- INTERACȚIUNE MOUSE & CLICK ---
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        const controlsY = canvas.height - controlsHeight;
        const barX = btnWidth * 3 + 10;
        const barWidth = canvas.width - (btnWidth * 4) - 40;

        if (y > controlsY && x > barX && x < barX + barWidth) {
            showPreview = true;
            previewX = x;
            const pct = (x - barX) / barWidth;
            previewTime = pct * video.duration;
            previewVideo.currentTime = previewTime;
        } else {
            showPreview = false;
        }

        if (video.paused) drawFrame();
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const controlsY = canvas.height - controlsHeight;

        if (y > controlsY) {
            if (x < btnWidth) { // Prev
                let p = currentTrack - 1; if (p < 0) p = playlistData.length - 1; loadTrack(p);
            } else if (x < btnWidth * 2) { // Play/Pause
                if (video.paused) video.play(); else video.pause();
            } else if (x < btnWidth * 3) { // Next
                let n = currentTrack + 1; if (n >= playlistData.length) n = 0; loadTrack(n);
            } else if (x < canvas.width - 60) { // Seek
                const barX = btnWidth * 3 + 10;
                const barWidth = canvas.width - (btnWidth * 4) - 40;
                video.currentTime = ((x - barX) / barWidth) * video.duration;
            } else { // Volum toggle
                video.muted = !video.muted;
            }
        } else {
            if (video.paused) video.play(); else video.pause();
        }
    });

    // --- EVENIMENTE VIDEO ---
    video.addEventListener('play', () => { isProcessing = true; computeFrame(); });
    video.addEventListener('pause', () => { isProcessing = false; drawFrame(); });
    video.addEventListener('ended', () => {
        let next = currentTrack + 1;
        if (next >= playlistData.length) next = 0;
        loadTrack(next);
    });

    // --- UPLOAD & DRAG AND DROP ---
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('video/')) {
                playlistData.push({ name: file.name, src: URL.createObjectURL(file) });
            }
        });
        renderPlaylist();
    }
    fileInput.addEventListener('change', (e) => { handleFiles(e.target.files); fileInput.value = ''; });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });

    loadTrack(0);
});