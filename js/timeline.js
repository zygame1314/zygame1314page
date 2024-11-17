document.querySelectorAll('.milestone').forEach(function (milestone) {
    var content = milestone.querySelector('.milestone-content');
    milestone.addEventListener('mouseenter', function () {
        content.style.maxHeight = content.scrollHeight + 'px';
    });
    milestone.addEventListener('mouseleave', function () {
        content.style.maxHeight = '70px';
    });
});