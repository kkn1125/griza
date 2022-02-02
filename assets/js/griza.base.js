/**!
 * griza v0.1.0 (https://github.com/kkn1125/griza)
 * Copyright 2021 Authors (https://github.com/kkn1125/griza/graphs/contributors) kkn1125
 * Licensed under MIT (https://github.com/kkn1125/griza/blob/main/LICENSE)
 */
'use strict';
let app;
(function () {
    if (document.documentElement.lang !== 'ko') document.documentElement.lang = navigator.language.split('-').shift();
})();

fetch('assets/data/griza.json').then(response => {
    response.text().then(text => {
        app = JSON.parse(text).app;
    });
});