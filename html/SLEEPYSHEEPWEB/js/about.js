document.addEventListener("DOMContentLoaded", function() {
    const container = document.querySelector(".music-lib-music-sleep-container");
    const blocks = document.querySelectorAll(".music-lib-music-sleep");
    let toggle = false;
    let interval;

    function switchPositions() {
        if (toggle) {
            blocks[0].classList.add("move-left");
            blocks[1].classList.add("move-right");
        } else {
            blocks[0].classList.remove("move-left");
            blocks[1].classList.remove("move-right");
        }
        toggle = !toggle;
    }

    function startAnimation() {
        interval = setInterval(switchPositions, 2000);
    }

    function stopAnimation() {
        clearInterval(interval);
    }

    container.addEventListener("mouseenter", stopAnimation);
    container.addEventListener("mouseleave", startAnimation);

    startAnimation();
});


document.addEventListener("DOMContentLoaded", function() {
    const slogan = document.querySelector(".slogan");

    slogan.addEventListener("mouseenter", function() {
        slogan.classList.add("slogan-paused");
    });

    slogan.addEventListener("mouseleave", function() {
        slogan.classList.remove("slogan-paused");
    });
});

let isDragging = false;

function updateProgressBar() {
    if (isDragging) return;

    const audio = document.getElementById('myAudio');
    const progressBar = document.getElementById('Line_active_');
    const slider = document.getElementById('Oval-2');

    const duration = audio.duration;
    const currentTime = audio.currentTime;
    const progress = currentTime / duration;

    const totalLengthOfLine = 1350;
    const startXOfLine = 1200;

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

            const totalLengthOfLine = 1350;
            const startXOfLine = 1200;
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

function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    const now = new Date();
    const formattedTime = now.toDateString(); // 格式化时间，例如 "Tue Nov 07 2023"
    currentTimeElement.textContent = formattedTime;
}


setInterval(updateCurrentTime, 1000);


let count = 910; // init

function updateListenerCount() {
    const listenerCountElement = document.getElementById('listener-count');
    listenerCountElement.textContent = count + '+ ';
    count++;
}

// update timer
setInterval(updateListenerCount, 1000);

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("heart").addEventListener("click", function () {
        this.classList.toggle("heart-red");
    });
    document.getElementById("broken-heart").addEventListener("click", function () {
        this.classList.toggle("heart-red");
    });
});


document.addEventListener("DOMContentLoaded", function () {
    document.querySelector('.daily_recommendation').addEventListener('mouseover', function () {
        document.querySelector('.music-description').style.display = 'block';
    });

    document.querySelector('.daily_recommendation').addEventListener('mouseout', function () {
        document.querySelector('.music-description').style.display = 'none';
    });
});
