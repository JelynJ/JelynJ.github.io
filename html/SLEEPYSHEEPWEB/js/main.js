document.addEventListener("DOMContentLoaded", function() {
    const textElement = document.getElementById('all-text');
    const fullText = textElement.innerHTML;
    const shortenedText = `"Sleepy Sheep" is designed to assist students...`;

    textElement.innerHTML = shortenedText;

    textElement.addEventListener('mouseenter', function() {
        textElement.innerHTML = fullText;
    });

    textElement.addEventListener('mouseleave', function() {
        textElement.innerHTML = shortenedText;
    });
});


document.addEventListener("DOMContentLoaded", function() {
    function updateDate() {
        const currentDateElement = document.getElementById('last-updated-date');
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = now.toLocaleDateString('en-US', options);
        currentDateElement.textContent = 'Last Updated ' + formattedDate;
    }

    updateDate();
});
