// Upload these MP3 files directly next to index.html.
// Keeping the audio files at the site root avoids nested-path/hosting issues.
let myCustomPlaylist = [
    { id: "box-1", title: ".يا ستي يا ختيارة", src: "kht.mp3", cover: "kht.png" },
    { id: "box-2", title: ".أعظم إنجازاتي", src: "Athm.mp3", cover: "Athm.png" },
];

let currentTrackIndex = -1;
let isLoopingAll = true;
let isLoopingOne = false;

let audioPlayer, wPlayBtn, wLoopBtn, wTrackTitle, wTrackArt,
    progressBar, currentTimeLabel, totalDurationLabel, wHeartBtn;

document.addEventListener("DOMContentLoaded", function() {
    audioPlayer = document.getElementById('global-audio-player');
    wPlayBtn = document.getElementById('w-play-btn');
    wLoopBtn = document.getElementById('w-loop-btn');
    wTrackTitle = document.getElementById('widget-track-title');
    wTrackArt = document.getElementById('widget-track-art');
    progressBar = document.getElementById('track-progress-bar');
    currentTimeLabel = document.getElementById('current-time');
    totalDurationLabel = document.getElementById('total-duration');
    wHeartBtn = document.getElementById('widget-heart-btn');

    if (audioPlayer) {
        audioPlayer.onended = handleTrackEnded;
        audioPlayer.addEventListener('timeupdate', updateProgress);
    }

    reorderPlaylistByLikes();
});

function reorderPlaylistByLikes() {
    let likedSongs = [];
    let regularSongs = [];

    myCustomPlaylist.forEach(track => {
        if (localStorage.getItem('box_like_' + track.id) === 'true') {
            likedSongs.push(track);
        } else {
            regularSongs.push(track);
        }
    });

    myCustomPlaylist = [...likedSongs, ...regularSongs];
}

function togglePlayerWidget() {
    const widget = document.getElementById('player-widget');
    if (widget) widget.classList.toggle('active');
}

function toggleGlobalPlay() {
    if (currentTrackIndex === -1) {
        loadTrack(0);
        return;
    }

    if (audioPlayer.paused) {
        audioPlayer.play().then(() => wPlayBtn.classList.add('paused'))
            .catch(err => console.log(err));
    } else {
        audioPlayer.pause();
        wPlayBtn.classList.remove('paused');
    }
}

function loadTrack(index) {
    if (index < 0 || index >= myCustomPlaylist.length) return;

    currentTrackIndex = index;
    const track = myCustomPlaylist[index];

    // Use a relative root URL so the same code works on localhost and normal web hosting.
    audioPlayer.src = encodeURI(track.src);
    audioPlayer.load();
    wTrackTitle.innerText = track.title;
    wTrackArt.src = track.cover || "cover.png";

    progressBar.value = 0;
    progressBar.style.setProperty('--progress-tail', '0%');

    const isLiked = localStorage.getItem('box_like_' + track.id) === 'true';

    if (wHeartBtn) {
        wHeartBtn.innerText = isLiked ? '♥︎' : '♡';
        wHeartBtn.style.color = isLiked ? '#ff375f' : '#8e8e93';
    }

    audioPlayer.play().then(() => wPlayBtn.classList.add('paused'))
        .catch(() => {
            wTrackTitle.innerText = "Unable to play this track";
        });
}

function toggleMusicBoxLike(event) {
    event.stopPropagation();
    if (currentTrackIndex === -1) return;

    const currentTrack = myCustomPlaylist[currentTrackIndex];
    const isLiked = localStorage.getItem('box_like_' + currentTrack.id) === 'true';

    if (!isLiked) {
        wHeartBtn.innerText = '♥︎';
        wHeartBtn.style.color = '#ff375f';
        localStorage.setItem('box_like_' + currentTrack.id, 'true');

        const oldBubble = wHeartBtn.querySelector('.music-like-bubble');
        if (oldBubble) oldBubble.remove();

        const bubble = document.createElement('div');
        bubble.className = 'music-like-bubble';
        bubble.innerText = 'I liked it 💘';
        wHeartBtn.appendChild(bubble);

        setTimeout(() => {
            if (bubble.parentNode) bubble.remove();
        }, 1300);
    } else {
        wHeartBtn.innerText = '♡';
        wHeartBtn.style.color = '#8e8e93';
        localStorage.setItem('box_like_' + currentTrack.id, 'false');
    }

    reorderPlaylistByLikes();
    currentTrackIndex = myCustomPlaylist.findIndex(track => track.id === currentTrack.id);
}

function playNextTrack() {
    if (myCustomPlaylist.length === 0) return;
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= myCustomPlaylist.length) nextIndex = 0;
    loadTrack(nextIndex);
}

function playPrevTrack() {
    if (myCustomPlaylist.length === 0) return;
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = myCustomPlaylist.length - 1;
    loadTrack(prevIndex);
}

function toggleGlobalLoop() {
    if (isLoopingAll) {
        isLoopingAll = false;
        isLoopingOne = true;
        audioPlayer.loop = true;
        wLoopBtn.className = "control-btn loop-mode-one";
    } else if (isLoopingOne) {
        isLoopingOne = false;
        audioPlayer.loop = false;
        wLoopBtn.className = "control-btn loop-mode-none";
    } else {
        isLoopingAll = true;
        wLoopBtn.className = "control-btn loop-mode-all";
    }
}

function handleTrackEnded() {
    if (isLoopingOne) audioPlayer.play();
    else if (isLoopingAll) playNextTrack();
    else if (currentTrackIndex === myCustomPlaylist.length - 1)
        wPlayBtn.classList.remove('paused');
    else playNextTrack();
}

function updateProgress() {
    if (!isNaN(audioPlayer.duration)) {
        const progressPercentage =
            (audioPlayer.currentTime / audioPlayer.duration) * 100;

        progressBar.value = progressPercentage;
        progressBar.style.setProperty('--progress-tail', `${progressPercentage}%`);

        let curMins = Math.floor(audioPlayer.currentTime / 60);
        let curSecs = Math.floor(audioPlayer.currentTime - curMins * 60);
        let durMins = Math.floor(audioPlayer.duration / 60);
        let durSecs = Math.floor(audioPlayer.duration - durMins * 60);

        if (curSecs < 10) curSecs = "0" + curSecs;
        if (curMins < 10) curMins = "0" + curMins;
        if (durSecs < 10) durSecs = "0" + durSecs;
        if (durMins < 10) durMins = "0" + durMins;

        currentTimeLabel.innerText = curMins + ":" + curSecs;
        totalDurationLabel.innerText = durMins + ":" + durSecs;
    }
}

function seekTrack() {
    if (!isNaN(audioPlayer.duration)) {
        audioPlayer.currentTime =
            audioPlayer.duration * (progressBar.value / 100);
        progressBar.style.setProperty('--progress-tail', `${progressBar.value}%`);
    }
}

let visits = localStorage.getItem('site_visits');

if (!visits) {
    visits = 160;
} else {
    visits = parseInt(visits, 10) + 1;
}

localStorage.setItem('site_visits', visits);

const countElement = document.getElementById('count');
if (countElement) {
    countElement.innerText = visits;
}

const counter = document.querySelector('.view-counter');
if (counter) {
    counter.addEventListener('click', togglePopupText);
}

function togglePopupText(event) {
    if (event) event.stopPropagation();

    const popupBox = document.getElementById('profile-text-box');
    if (!popupBox) return;

    popupBox.classList.remove('show');
    void popupBox.offsetWidth; 
    popupBox.classList.add('show');

    clearTimeout(window.profilePopupTimer);
    window.profilePopupTimer = setTimeout(function () {
        popupBox.classList.remove('show');
    }, 2400);
}