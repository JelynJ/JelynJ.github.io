function handleCloudClick(event) {
    // 所有云渐隐
    document.querySelectorAll('.cls-1').forEach(function(cloud) {
        cloud.classList.add('fadeOut');
    });

    // 延时后执行页面跳转
    setTimeout(function() {
        var targetURL = '';
        switch(event.target.id) {
            case 'UI-UX':
                targetURL = 'gallery8.html';
                break;
            case 'DATA-INFORMATION':
                targetURL = 'gallery6.html';
                break;
            case 'GAME-WEB':
                targetURL = 'gallery5.html';
                break;
            case 'VI_CI':
                targetURL = 'gallery2.html';
                break;
            case 'EXHIBITION-_CULTURE':
                targetURL = 'gallery4.html';
                break;
            case '_3D-MODELING':
                targetURL = 'gallery7.html';
                break;
            case 'PACKAGING':
                targetURL = 'gallery3.html';
                break;
            case 'BOOK-LAYOUT':
                targetURL = 'gallery8.html';
                break;
            // 更多的云可以在这里添加
        }
        window.location.href = targetURL;
    }, 1000);  // 与渐隐动画时间一致
}

// 为每一朵云添加点击事件监听器
document.querySelectorAll('.cls-1').forEach(function(cloud) {
    cloud.addEventListener('click', handleCloudClick);
});
