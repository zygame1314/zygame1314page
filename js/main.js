import { initSmoothScroll } from './smoothScroll.js';
import { initTypingEffect } from './typingEffect.js';
import { initParallax } from './parallax.js';
import { initClouds } from './clouds.js';
import { initCursorTrail } from './cursorTrail.js';
import { initWeatherWidget } from './weatherWidget.js';
import { initGamesFetch } from './gamesFetch.js';
import { initPongGame } from './pongGame.js';

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initTypingEffect();
    initParallax();
    initClouds();
    initCursorTrail();
    initWeatherWidget();
    initGamesFetch();
    initPongGame();
});
