const images = document.querySelectorAll('.logo img');
    
images.forEach(img => {
    img.addEventListener('click', function() {
        window.location.href = 'main.html';
    });
});
