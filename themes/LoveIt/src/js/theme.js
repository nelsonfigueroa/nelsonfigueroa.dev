class Util {
    forEach(elements, handler) {
        elements = elements || [];
        for (let i = 0; i < elements.length; i++) handler(elements[i]);
    }

    getScrollTop() {
        return (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
    }

    isMobile() {
        return window.matchMedia('only screen and (max-width: 680px)').matches;
    }

    isTocStatic() {
        return window.matchMedia('only screen and (max-width: 960px)').matches;
    }

    animateCSS(element, animation, reserved, callback) {
        if (!Array.isArray(animation)) animation = [animation];
        element.classList.add('animate__animated', ...animation);
        const handler = () => {
            element.classList.remove('animate__animated', ...animation);
            element.removeEventListener('animationend', handler);
            if (typeof callback === 'function') callback();
        };
        if (!reserved) element.addEventListener('animationend', handler, false);
    }
}

class Theme {
    constructor() {
        this.config = window.config;
        this.data = this.config.data;
        this.isDark = document.body.getAttribute('theme') === 'dark';
        this.util = new Util();
        this.newScrollTop = this.util.getScrollTop();
        this.oldScrollTop = this.newScrollTop;
        this.scrollEventSet = new Set();
        this.resizeEventSet = new Set();
        this.switchThemeEventSet = new Set();
        this.clickMaskEventSet = new Set();
        if (window.objectFitImages) objectFitImages();
    }

    initRaw() {
        this.util.forEach(document.querySelectorAll('[data-raw]'), $raw => {
            $raw.innerHTML = this.data[$raw.id];
        });
    }

    initSVGIcon() {
        this.util.forEach(document.querySelectorAll('[data-svg-src]'), $icon => {
            fetch($icon.getAttribute('data-svg-src'))
                .then(response => response.text())
                .then(svg => {
                    const $temp = document.createElement('div');
                    $temp.insertAdjacentHTML('afterbegin', svg);
                    const $svg = $temp.firstChild;
                    $svg.setAttribute('data-svg-src', $icon.getAttribute('data-svg-src'));
                    $svg.classList.add('icon');
                    const $titleElements = $svg.getElementsByTagName('title');
                    if ($titleElements.length) $svg.removeChild($titleElements[0]);
                    $icon.parentElement.replaceChild($svg, $icon);
                })
                .catch(err => { console.error(err); });
        });
    }

    initMenuMobile() {
        const $menuToggleMobile = document.getElementById('menu-toggle-mobile');
        const $menuMobile = document.getElementById('menu-mobile');
        $menuToggleMobile.addEventListener('click', () => {
            $menuToggleMobile.classList.toggle('active');
            $menuMobile.classList.toggle('active');
        }, false);
        this._menuMobileOnClickMask = this._menuMobileOnClickMask || (() => {
            $menuToggleMobile.classList.remove('active');
            $menuMobile.classList.remove('active');
        });
        this.clickMaskEventSet.add(this._menuMobileOnClickMask);
    }

    initSwitchTheme() {
        this.util.forEach(document.getElementsByClassName('theme-switch'), $themeSwitch => {
            $themeSwitch.addEventListener('click', () => {
                if (document.body.getAttribute('theme') === 'dark') document.body.setAttribute('theme', 'light');
                else document.body.setAttribute('theme', 'dark');
                this.isDark = !this.isDark;
                window.localStorage && localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
                for (let event of this.switchThemeEventSet) event();
            }, false);
        });
    }

    initDetails() {
        this.util.forEach(document.getElementsByClassName('details'), $details => {
            const $summary = $details.getElementsByClassName('details-summary')[0];
            $summary.addEventListener('click', () => {
                $details.classList.toggle('open');
            }, false);
        });
    }

    initHighlight() {
        this.util.forEach(document.querySelectorAll('.highlight > pre.chroma'), $preChroma => {
            const $chroma = document.createElement('div');
            $chroma.className = $preChroma.className;
            const $table = document.createElement('table');
            $chroma.appendChild($table);
            const $tbody = document.createElement('tbody');
            $table.appendChild($tbody);
            const $tr = document.createElement('tr');
            $tbody.appendChild($tr);
            const $td = document.createElement('td');
            $tr.appendChild($td);
            $preChroma.parentElement.replaceChild($chroma, $preChroma);
            $td.appendChild($preChroma);
        });
        this.util.forEach(document.querySelectorAll('.highlight > .chroma'), $chroma => {
            const $codeElements = $chroma.querySelectorAll('pre.chroma > code');
            if ($codeElements.length) {
                const $code = $codeElements[$codeElements.length - 1];
                const $header = document.createElement('div');
                $header.className = 'code-header ' + $code.className.toLowerCase();
                const $title = document.createElement('span');
                $title.classList.add('code-title');
                $title.insertAdjacentHTML('afterbegin', '<i class="arrow fas fa-chevron-right fa-fw" aria-hidden="true"></i>');
                $title.addEventListener('click', () => {
                    $chroma.classList.toggle('open');
                }, false);
                $header.appendChild($title);
                const $ellipses = document.createElement('span');
                $ellipses.insertAdjacentHTML('afterbegin', '<i class="fas fa-ellipsis-h fa-fw" aria-hidden="true"></i>');
                $ellipses.classList.add('ellipses');
                $ellipses.addEventListener('click', () => {
                    $chroma.classList.add('open');
                }, false);
                $header.appendChild($ellipses);
                const $copy = document.createElement('span');
                $copy.insertAdjacentHTML('afterbegin', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M224 0c-35.3 0-64 28.7-64 64V288c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM64 160c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384H304v64c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V224c0-8.8 7.2-16 16-16h64V160H64z"/></svg>');
                $copy.classList.add('copy');
                const code = $code.innerText;
                if (this.config.code.maxShownLines < 0 || code.split('\n').length < this.config.code.maxShownLines + 2) $chroma.classList.add('open');
                if (this.config.code.copyTitle) {
                    $copy.setAttribute('data-clipboard-text', code);
                    $copy.title = this.config.code.copyTitle;
                    const clipboard = new ClipboardJS($copy);
                    clipboard.on('success', _e => {
                        this.util.animateCSS($code, 'animate__flash');
                    });
                    $header.appendChild($copy);
                }
                $chroma.insertBefore($header, $chroma.firstChild);
            }
        });
    }

    initTable() {
        this.util.forEach(document.querySelectorAll('.content table'), $table => {
            const $wrapper = document.createElement('div');
            $wrapper.className = 'table-wrapper';
            $table.parentElement.replaceChild($wrapper, $table);
            $wrapper.appendChild($table);
        });
    }

    initHeaderLink() {
        for (let num = 1; num <= 6; num++) {
            this.util.forEach(document.querySelectorAll('.single .content > h' + num), $header => {
                $header.classList.add('headerLink');
                $header.insertAdjacentHTML('afterbegin', `<a href="#${$header.id}" class="header-mark"></a>`);
            });
        }
    }

    initToc() {
        const $tocCore = document.getElementById('TableOfContents');
        if ($tocCore === null) return;
        if (document.getElementById('toc-static').getAttribute('data-kept') || this.util.isTocStatic()) {
            const $tocContentStatic = document.getElementById('toc-content-static');
            if ($tocCore.parentElement !== $tocContentStatic) {
                $tocCore.parentElement.removeChild($tocCore);
                $tocContentStatic.appendChild($tocCore);
            }
            if (this._tocOnScroll) this.scrollEventSet.delete(this._tocOnScroll);
        } else {
            const $tocContentAuto = document.getElementById('toc-content-auto');
            if ($tocCore.parentElement !== $tocContentAuto) {
                $tocCore.parentElement.removeChild($tocCore);
                $tocContentAuto.appendChild($tocCore);
            }
            const $toc = document.getElementById('toc-auto');
            const $page = document.getElementsByClassName('page')[0];
            const rect = $page.getBoundingClientRect();
            $toc.style.left = `${rect.left + rect.width + 20}px`;
            $toc.style.maxWidth = `${$page.getBoundingClientRect().left - 20}px`;
            $toc.style.visibility = 'visible';
            const $tocLinkElements = $tocCore.querySelectorAll('a:first-child');
            const $tocLiElements = $tocCore.getElementsByTagName('li');
            const $headerLinkElements = document.getElementsByClassName('headerLink');
            const headerIsFixed = document.body.getAttribute('data-header-desktop') !== 'normal';
            const headerHeight = document.getElementById('header-desktop').offsetHeight;
            const TOP_SPACING = 20 + (headerIsFixed ? headerHeight : 0);
            const minTocTop = $toc.offsetTop;
            const minScrollTop = minTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight);
            this._tocOnScroll = this._tocOnScroll || (() => {
                const footerTop = document.getElementById('post-footer').offsetTop;
                const maxTocTop = footerTop - $toc.getBoundingClientRect().height;
                const maxScrollTop = maxTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight);
                if (this.newScrollTop < minScrollTop) {
                    $toc.style.position = 'absolute';
                    $toc.style.top = `${minTocTop}px`;
                } else if (this.newScrollTop > maxScrollTop) {
                    $toc.style.position = 'absolute';
                    $toc.style.top = `${maxTocTop}px`;
                } else {
                    $toc.style.position = 'fixed';
                    $toc.style.top = `${TOP_SPACING}px`;
                }

                this.util.forEach($tocLinkElements, $tocLink => { $tocLink.classList.remove('active'); });
                this.util.forEach($tocLiElements, $tocLi => { $tocLi.classList.remove('has-active'); });
                const INDEX_SPACING = 20 + (headerIsFixed ? headerHeight : 0);
                let activeTocIndex = $headerLinkElements.length - 1;
                for (let i = 0; i < $headerLinkElements.length - 1; i++) {
                    const thisTop = $headerLinkElements[i].getBoundingClientRect().top;
                    const nextTop = $headerLinkElements[i + 1].getBoundingClientRect().top;
                    if ((i == 0 && thisTop > INDEX_SPACING)
                     || (thisTop <= INDEX_SPACING && nextTop > INDEX_SPACING)) {
                        activeTocIndex = i;
                        break;
                    }
                }
                if (activeTocIndex !== -1) {
                    $tocLinkElements[activeTocIndex].classList.add('active');
                    let $parent = $tocLinkElements[activeTocIndex].parentElement;
                    while ($parent !== $tocCore) {
                        $parent.classList.add('has-active');
                        $parent = $parent.parentElement.parentElement;
                    }
                }
            });
            this._tocOnScroll();
            this.scrollEventSet.add(this._tocOnScroll);
        }
    }

    initMath() {
        if (this.config.math) renderMathInElement(document.body, this.config.math);
    }

    initEcharts() {
        if (this.config.echarts) {
            echarts.registerTheme('light', this.config.echarts.lightTheme);
            echarts.registerTheme('dark', this.config.echarts.darkTheme);
            this._echartsOnSwitchTheme = this._echartsOnSwitchTheme || (() => {
                this._echartsArr = this._echartsArr || [];
                for (let i = 0; i < this._echartsArr.length; i++) {
                    this._echartsArr[i].dispose();
                }
                this._echartsArr = [];
                this.util.forEach(document.getElementsByClassName('echarts'), $echarts => {
                    const chart = echarts.init($echarts, this.isDark ? 'dark' : 'light', {renderer: 'svg'});
                    chart.setOption(JSON.parse(this.data[$echarts.id]));
                    this._echartsArr.push(chart);
                });
            });
            this.switchThemeEventSet.add(this._echartsOnSwitchTheme);
            this._echartsOnSwitchTheme();
            this._echartsOnResize = this._echartsOnResize || (() => {
                for (let i = 0; i < this._echartsArr.length; i++) {
                    this._echartsArr[i].resize();
                }
            });
            this.resizeEventSet.add(this._echartsOnResize);
        }
    }
    initCookieconsent() {
        if (this.config.cookieconsent) cookieconsent.initialise(this.config.cookieconsent);
    }

    onScroll() {
        const $headers = [];
        if (document.body.getAttribute('data-header-desktop') === 'auto') $headers.push(document.getElementById('header-desktop'));
        if (document.body.getAttribute('data-header-mobile') === 'auto') $headers.push(document.getElementById('header-mobile'));
        const $fixedButtons = document.getElementById('fixed-buttons');
        const ACCURACY = 20, MINIMUM = 100;
        window.addEventListener('scroll', () => {
            this.newScrollTop = this.util.getScrollTop();
            const scroll = this.newScrollTop - this.oldScrollTop;
            const isMobile = this.util.isMobile();
            this.util.forEach($headers, $header => {
                if (scroll > ACCURACY) {
                    $header.classList.remove('animate__fadeInDown');
                    this.util.animateCSS($header, ['animate__fadeOutUp', 'animate__faster'], true);
                } else if (scroll < - ACCURACY) {
                    $header.classList.remove('animate__fadeOutUp');
                    this.util.animateCSS($header, ['animate__fadeInDown', 'animate__faster'], true);
                }
            });
            if (this.newScrollTop > MINIMUM) {
                if (isMobile && scroll > ACCURACY) {
                    $fixedButtons.classList.remove('animate__fadeIn');
                    this.util.animateCSS($fixedButtons, ['animate__fadeOut', 'animate__faster'], true);
                } else if (!isMobile || scroll < - ACCURACY) {
                    $fixedButtons.style.display = 'block';
                    $fixedButtons.classList.remove('animate__fadeOut');
                    this.util.animateCSS($fixedButtons, ['animate__fadeIn', 'animate__faster'], true);
                }
            } else {
                if (!isMobile) {
                    $fixedButtons.classList.remove('animate__fadeIn');
                    this.util.animateCSS($fixedButtons, ['animate__fadeOut', 'animate__faster'], true);
                }
                $fixedButtons.style.display = 'none';
            }
            for (let event of this.scrollEventSet) event();
            this.oldScrollTop = this.newScrollTop;
        }, false);
    }

    onResize() {
        window.addEventListener('resize', () => {
            if (!this._resizeTimeout) {
                this._resizeTimeout = window.setTimeout(() => {
                    this._resizeTimeout = null;
                    for (let event of this.resizeEventSet) event();
                    this.initToc();
                }, 100);
            }
        }, false);
    }

    onClickMask() {
        document.getElementById('mask').addEventListener('click', () => {
            for (let event of this.clickMaskEventSet) event();
        }, false);
    }

    init() {
        try {
            this.initRaw();
            this.initSVGIcon();
            this.initMenuMobile();
            this.initSwitchTheme();
            this.initDetails();
            this.initHighlight();
            this.initTable();
            this.initHeaderLink();
            this.initMath();
            this.initEcharts();
            this.initCookieconsent();
        } catch (err) {
            console.error(err);
        }

        window.setTimeout(() => {
            this.initToc();
            this.onScroll();
            this.onResize();
            this.onClickMask();
        }, 100);
    }
}

const themeInit = () => {
    const theme = new Theme();
    theme.init();
};

if (document.readyState !== 'loading') {
    themeInit();
} else {
    document.addEventListener('DOMContentLoaded', themeInit, false);
}
