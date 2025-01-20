function setSeasonTheme() {
    const date = new Date();
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 5) {
        document.documentElement.style.setProperty('--primary-color', 'var(--spring-primary)');
        document.documentElement.style.setProperty('--secondary-color', 'var(--spring-secondary)');
        document.documentElement.style.setProperty('--theme-bg', 'var(--spring-bg)');
    } else if (month >= 6 && month <= 8) {
        document.documentElement.style.setProperty('--primary-color', 'var(--summer-primary)');
        document.documentElement.style.setProperty('--secondary-color', 'var(--summer-secondary)');
        document.documentElement.style.setProperty('--theme-bg', 'var(--summer-bg)');
    } else if (month >= 9 && month <= 11) {
        document.documentElement.style.setProperty('--primary-color', 'var(--autumn-primary)');
        document.documentElement.style.setProperty('--secondary-color', 'var(--autumn-secondary)');
        document.documentElement.style.setProperty('--theme-bg', 'var(--autumn-bg)');
    } else {
        document.documentElement.style.setProperty('--primary-color', 'var(--winter-primary)');
        document.documentElement.style.setProperty('--secondary-color', 'var(--winter-secondary)');
        document.documentElement.style.setProperty('--theme-bg', 'var(--winter-bg)');
    }
}

document.addEventListener('DOMContentLoaded', setSeasonTheme);