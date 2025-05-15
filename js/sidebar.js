document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});

const sidebar = document.querySelector('.sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');

function initSidebar() {
    if (toggleBtn && sidebar) {
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';

        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('active');

            if (sidebar.classList.contains('active')) {
                toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
                toggleBtn.style.backgroundColor = '#ff4757';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                toggleBtn.style.backgroundColor = '';
            }
        });

        document.addEventListener('click', function (event) {
            if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                toggleBtn.style.backgroundColor = '';
            }
        });
    }

    generateSidebarNav();
    initSidebarNav();

    const quickNav = document.getElementById('quick-nav');
    if (quickNav) {
        const quickNavTitle = quickNav.querySelector('h3');
        if (quickNavTitle) {
            quickNavTitle.addEventListener('click', () => {
                quickNav.classList.toggle('expanded');
            });

            const navLinks = quickNav.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    setTimeout(() => {
                        quickNav.classList.remove('expanded');
                    }, 1000);
                });
            });
        }
    }
}

function generateSidebarNav() {
    const quickNavSection = document.querySelector('#quick-nav');
    if (!quickNavSection) return;

    const sidebarSections = Array.from(document.querySelectorAll('.sidebar-content > section'))
        .filter(section => section.id !== 'quick-nav');

    let navListHtml = '<h3>快速导航</h3><ul class="nav-list">';

    sidebarSections.forEach(section => {
        if (window.getComputedStyle(section).display === 'none') return;

        const sectionId = section.id;
        const sectionTitle = section.querySelector('h2') ?
            section.querySelector('h2').textContent.trim() :
            sectionId.replace(/-/g, ' ');

        let iconClass = 'fas fa-link';

        switch (sectionId) {
            case 'weather': iconClass = 'fas fa-cloud-sun'; break;
            case 'donate-button-section': iconClass = 'fas fa-heart'; break;
            case 'site-status': iconClass = 'fas fa-chart-line'; break;
            case 'scripts-download': iconClass = 'fas fa-code'; break;
            case 'games': iconClass = 'fas fa-gamepad'; break;
            case 'steam-games': iconClass = 'fab fa-steam-symbol'; break;
            case 'steam-status': iconClass = 'fas fa-user-circle'; break;
            case 'article-network': iconClass = 'fas fa-project-diagram'; break;
            case 'music-player': iconClass = 'fas fa-music'; break;
            case 'live2d-settings': iconClass = 'fas fa-sliders-h'; break;
            default: iconClass = 'fas fa-link';
        }

        navListHtml += `
            <li class="nav-item">
                <a href="javascript:void(0)" data-target="${sectionId}" class="nav-link">
                    <i class="${iconClass}"></i>
                    <span class="link-text">${sectionTitle}</span>
                </a>
            </li>
        `;
    });

    navListHtml += '</ul>';

    quickNavSection.innerHTML = navListHtml;
}

function initSidebarNav() {
    const quickNavInstance = document.getElementById('quick-nav');
    if (!quickNavInstance) return;

    const actualNavLinks = quickNavInstance.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.sidebar-content > section');
    const sidebarContent = document.querySelector('.sidebar-content');

    actualNavLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            actualNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl && sidebarContent) {
                const top = Math.max(0, targetEl.offsetTop - 10);
                sidebarContent.scrollTo({ top, behavior: 'smooth' });
            }


            const quickNav = quickNavInstance;
            if (quickNav.classList.contains('expanded') && window.innerWidth <= 768) {
                setTimeout(() => quickNav.classList.remove('expanded'), 300);
            }

            return false;
        });
    });

    if (sidebarContent && sections.length && actualNavLinks.length) {
        setTimeout(() => highlightCurrentSection(sections, actualNavLinks, sidebarContent), 500);
    }
}

function highlightCurrentSection(sections, navLinks, container) {
    let currentSection = null;
    const scrollTop = container.scrollTop;

    sections.forEach(section => {
        const sectionTopInContainer = section.offsetTop;

        if (sectionTopInContainer <= scrollTop + 100) {
            currentSection = section;
        }
    });

    if (scrollTop < 50 && sections.length > 0 && !currentSection) {
        currentSection = sections[0];
    }

    if (currentSection) {
        const currentId = currentSection.getAttribute('id');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentId}`) {
                link.classList.add('active');
            }
        });
    } else {
        navLinks.forEach(link => link.classList.remove('active'));
    }
}

function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}