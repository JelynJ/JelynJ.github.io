let isDragging = false;

function updateProgressBar() {
    if (isDragging) return;

    const audio = document.getElementById('myAudio');
    const progressBar = document.getElementById('Line_active_');
    const slider = document.getElementById('Oval-2');

    const duration = audio.duration;
    const currentTime = audio.currentTime;
    const progress = currentTime / duration;

    const totalLengthOfLine = 1950;
    const startXOfLine = 450;

    progressBar.setAttribute('width', progress * totalLengthOfLine);

    const newSliderPosition = startXOfLine + progress * totalLengthOfLine;
    slider.setAttribute('cx', newSliderPosition);
}

document.addEventListener("DOMContentLoaded", function() {
    const audio = document.getElementById('myAudio');
    const slider = document.getElementById('Oval-2');
    const line = document.getElementById('Line');
    const playButton = document.getElementById('play_button');
    const pauseButton = document.getElementById("pause_button");
    let isDragging = false;

    playButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });

    pauseButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });

    playButton.addEventListener("click", function() {
        playButton.style.display = "none";
        pauseButton.style.display = "block";
    });

    pauseButton.addEventListener("click", function() {
        pauseButton.style.display = "none";
        playButton.style.display = "block";
    });


    slider.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const lineRect = line.getBoundingClientRect();
            const lineStartX = lineRect.left;
            const lineLength = lineRect.width;

            let newSliderPosition = e.clientX - lineStartX;
            newSliderPosition = Math.max(0, Math.min(newSliderPosition, lineLength));

            const totalLengthOfLine = 1950;
            const startXOfLine = 450;
            slider.setAttribute('cx', startXOfLine + (newSliderPosition / lineLength) * totalLengthOfLine);

            const duration = audio.duration;
            const progress = newSliderPosition / lineLength;
            audio.currentTime = duration * progress;
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        updateProgressBar();
    });

    audio.addEventListener('timeupdate', updateProgressBar);
});



let count = 910;

function updateListenerCount() {
    const listenerCountElement = document.getElementById('listener-count');
    listenerCountElement.textContent = count + '+ ';
    count++;
}

setInterval(updateListenerCount, 1000);

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("heart").addEventListener("click", function () {
        if (this.classList.contains("cls-7")) {
            this.classList.toggle("heart-red");

        } else {
            this.classList.toggle("cls-7");
        }
    });
    document.getElementById("broken-heart").addEventListener("click", function () {
        this.classList.toggle("heart-red");
    });
});
