document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const phone = document.getElementById('phone');
    const wallpaper = document.getElementById('wallpaper');
    const appBoxes = document.querySelectorAll('.box'); // All app icons
    const allAppScreens = document.querySelectorAll('.app'); // All app screens
    const homeBar = document.getElementById('home-bar'); // Home bar element
    const closeAppButtons = document.querySelectorAll('.back-button'); // All back buttons in apps
    const loadingScreen = document.getElementById('loading-screen'); // Loading screen
    const lockScreen = document.getElementById('lock-screen'); // Lock screen
    const lockScreenTime = document.getElementById('lock-screen-time');
    const lockScreenDate = document.getElementById('lock-screen-date');
    const calculatorApp = document.getElementById('calculator-app');
    const calculatorButtons = calculatorApp ? calculatorApp.querySelector('.calculator-buttons') : null;
    const calculatorExpressionDisplay = calculatorApp ? calculatorApp.querySelector('[data-display="expression"]') : null;
    const calculatorResultDisplay = calculatorApp ? calculatorApp.querySelector('[data-display="result"]') : null;

    // Animation Settings UI elements
    const animationSpeedSlider = document.getElementById('animationSpeed');
    const animationSpeedValueDisplay = document.getElementById('animationSpeedValue');
    const baseDurationSlider = document.getElementById('baseDuration');
    const baseDurationValueDisplay = document.getElementById('baseDurationValue');

    let activeAppScreen = null;
    let activeIconBox = null;
    let isAnimating = false;
    let isLocked = true; // State for lock screen

    // --- Lock Screen Clock and Date Update ---
    const updateLockScreenClock = () => {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };

        if (lockScreenTime) lockScreenTime.textContent = now.toLocaleTimeString([], timeOptions);
        if (lockScreenDate) lockScreenDate.textContent = now.toLocaleDateString([], dateOptions);
    };

    // Update clock every second
    setInterval(updateLockScreenClock, 1000);
    updateLockScreenClock(); // Initial call

    // --- Loading Screen Logic (modified to show lock screen) ---
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            lockScreen.style.display = 'flex'; // Ensure lock screen is visible
            lockScreen.classList.remove('hidden'); // Show lock screen
        }, 300); 
    }, 1000); 

    // --- Animation Variables (extracted and made dynamic) ---
    // Load from localStorage or use defaults
    let currentSpeed = parseFloat(localStorage.getItem('animationSpeed')) || 1.0; 
    let baseDuration = parseFloat(localStorage.getItem('baseDuration')) || 0.5;
    let cubic_all = "cubic-bezier(0.25,0.1,0.25,1)"; // General opening easing (hardcoded for now)
    let cubic_transform_closing = `cubic-bezier(.25,.1,.25,1)`; // General closing easing (hardcoded for now)


    // --- Function to update all derived animation timings ---
    const updateAnimationTimings = () => {
        // Derived animation timings
        const time_opening_app = baseDuration * currentSpeed;
        const time_aspect_ratio_app = time_opening_app * 0.9; // Keeping ratio from original

        const timeTransformClosing = (baseDuration * currentSpeed); 

        // Apply updated values to CSS variables for transitions
        document.documentElement.style.setProperty('--bg--timeShowingIcon', `${time_opening_app}s`);
        document.documentElement.style.setProperty('--bg--delayShowingIcon', `0s`); // Simplification
        document.documentElement.style.setProperty('--bg--timeHidingIcon', `${timeTransformClosing}s`);
        document.documentElement.style.setProperty('--bg--delayHidingIcon', `0s`); // Simplification

        // Update slider display values
        if (animationSpeedValueDisplay) animationSpeedValueDisplay.textContent = currentSpeed.toFixed(1);
        if (baseDurationValueDisplay) baseDurationValueDisplay.textContent = baseDuration.toFixed(2);
    };

    // --- Initialize slider values and update timings ---
    if (animationSpeedSlider) animationSpeedSlider.value = currentSpeed;
    if (baseDurationSlider) baseDurationSlider.value = baseDuration;
    updateAnimationTimings();

    // --- Event Listeners for Animation Settings Sliders ---
    if (animationSpeedSlider) {
        animationSpeedSlider.addEventListener('input', (e) => {
            currentSpeed = parseFloat(e.target.value);
            localStorage.setItem('animationSpeed', currentSpeed);
            updateAnimationTimings();
        });
    }
    if (baseDurationSlider) {
        baseDurationSlider.addEventListener('input', (e) => {
            baseDuration = parseFloat(e.target.value);
            localStorage.setItem('baseDuration', baseDuration);
            updateAnimationTimings();
        });
    }


    // --- Initial setup: Hide all app screens ---
    allAppScreens.forEach(app => {
        app.style.display = 'none';
        app.style.opacity = '0';
        app.style.transform = `translateX(-50%) scale(0.1)`; // Initial state for all apps
        app.style.borderRadius = getComputedStyle(document.documentElement).getPropertyValue('--bg--border_radius_system');
    });

    // --- Lock Screen Swipe-to-Unlock Logic ---
    let lockScreenStartY = 0;
    let lockScreenDeltaY = 0;
    let lockScreenDragging = false;
    const maxNav = 100; // Define maxNav, similar to how it might be defined globally or passed in all.js

    lockScreen.addEventListener("touchstart", (e) => {
        if (!isLocked) return;
        lockScreenDragging = true;
        lockScreenStartY = e.touches[0].clientY;
        lockScreenDeltaY = 0;
    }, { passive: false });

    lockScreen.addEventListener("touchmove", (e) => {
        if (!lockScreenDragging || !isLocked) return;
        e.preventDefault(); // Prevent scrolling
        lockScreenDeltaY = lockScreenStartY - e.touches[0].clientY;
        
        // Visual feedback for swipe
        if (lockScreenDeltaY > 0) { // Only animate if swiping up
            lockScreen.style.transition = 'none';
            lockScreen.style.transform = `translateY(${-lockScreenDeltaY}px)`;
            lockScreen.style.opacity = `${1 - lockScreenDeltaY / maxNav}`;
        }
    }, { passive: false });

    lockScreen.addEventListener("touchend", () => {
        if (!lockScreenDragging || !isLocked) return;
        lockScreenDragging = false;

        const unlockThreshold = 50; // Pixels to swipe up to unlock
        if (lockScreenDeltaY > unlockThreshold) {
            // Unlock!
            lockScreen.classList.add('hidden');
            isLocked = false;
            // Reset transform after transition to ensure it doesn't interfere
            setTimeout(() => {
                lockScreen.style.display = 'none';
                lockScreen.style.transform = '';
                lockScreen.style.opacity = '';
            }, 400); // Match CSS transition duration
        } else {
            // Snap back
            lockScreen.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            lockScreen.style.transform = '';
            lockScreen.style.opacity = '';
        }
        lockScreenDeltaY = 0;
    });

    // Mouse events for desktop simulation for lock screen
    lockScreen.addEventListener("mousedown", (e) => {
        if (!isLocked) return;
        lockScreenDragging = true;
        lockScreenStartY = e.clientY;
        lockScreenDeltaY = 0;
    });

    window.addEventListener("mousemove", (e) => {
        if (!lockScreenDragging || !isLocked) return;
        lockScreenDeltaY = lockScreenStartY - e.clientY;
        
        // Visual feedback for swipe
        if (lockScreenDeltaY > 0) { // Only animate if swiping up
            lockScreen.style.transition = 'none';
            lockScreen.style.transform = `translateY(${-lockScreenDeltaY}px)`;
            lockScreen.style.opacity = `${1 - lockScreenDeltaY / maxNav}`;
        }
    });

    window.addEventListener("mouseup", () => {
        if (!lockScreenDragging || !isLocked) return;
        lockScreenDragging = false;

        const unlockThreshold = 50; // Pixels to swipe up to unlock
        if (lockScreenDeltaY > unlockThreshold) {
            // Unlock!
            lockScreen.classList.add('hidden');
            isLocked = false;
            // Reset transform after transition to ensure it doesn't interfere
            setTimeout(() => {
                lockScreen.style.display = 'none';
                lockScreen.style.transform = '';
                lockScreen.style.opacity = '';
            }, 400); // Match CSS transition duration
        } else {
            // Snap back
            lockScreen.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            lockScreen.style.transform = '';
            lockScreen.style.opacity = '';
        }
        lockScreenDeltaY = 0;
    });

    const openApp = (event) => {
        if (isAnimating || isLocked) return;
        isAnimating = true;

        activeIconBox = event.currentTarget;
        const appId = activeIconBox.dataset.appId;
        activeAppScreen = document.getElementById(appId);

        if (!activeAppScreen) {
            console.error(`App screen with ID ${appId} not found.`);
            isAnimating = false;
            return;
        }

        // Show the specific app screen (before animating)
        activeAppScreen.style.display = 'flex';
        activeAppScreen.offsetHeight; // Force reflow

        // Apply OriginOS-style animation properties
        activeIconBox.classList.add('open'); // Hide icon's background
        
        // Complex transform from OriginOS for app opening (simulating from icon)
        const iconRect = activeIconBox.getBoundingClientRect();
        const phoneRect = phone.getBoundingClientRect();

        const scaleX = iconRect.width / phoneRect.width;
        const scaleY = iconRect.height / phoneRect.height;
        const translateX = (iconRect.left + iconRect.width / 2) - (phoneRect.left + phoneRect.width / 2);
        const translateY = (iconRect.top + iconRect.height / 2) - (phoneRect.top + phoneRect.height / 2);

        activeAppScreen.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(${scaleX}, ${scaleY})`;
        activeAppScreen.style.borderRadius = activeIconBox.style.borderRadius || 'var(--bg--border_radius_system)';

        activeAppScreen.offsetHeight; // Force reflow after setting initial transform

        // Start the transition to full screen
        activeAppScreen.style.transition = `all ${baseDuration * currentSpeed}s ${cubic_all}`;
        activeAppScreen.style.transform = `translateX(-50%) scale(1.0)`; // The target 'open' state transform
        activeAppScreen.style.opacity = '1';
        activeAppScreen.style.borderRadius = `calc(var(--bg--border_radius_phone) - 1px)`; // Transition to phone's border radius

        wallpaper.classList.add('open'); // Zooms the wallpaper
        
        setTimeout(() => {
            isAnimating = false;
            // Ensure final state is set
            activeAppScreen.style.transform = `translateX(-50%) scale(1)`;
            activeAppScreen.style.opacity = '1';
            activeAppScreen.style.pointerEvents = 'auto'; // Make app interactive
        }, baseDuration * currentSpeed * 1000 + 50);
    };

    // --- App Closing Logic (triggered by back button or home bar) ---
    const closeApp = () => {
        if (isAnimating || !activeAppScreen) return;
        isAnimating = true;

        // Apply OriginOS-style animation properties for closing
        const iconRect = activeIconBox ? activeIconBox.getBoundingClientRect() : null;
        const phoneRect = phone.getBoundingClientRect();

        const scaleX = iconRect ? iconRect.width / phoneRect.width : 0.6;
        const scaleY = iconRect ? iconRect.height / phoneRect.height : 0.6;
        const borderRadius = iconRect ? (activeIconBox.style.borderRadius || 'var(--bg--border_radius_system)') : 'var(--bg--border_radius_system)';

        // Trigger CSS closing animations (теперь без бокового смещения)
        activeAppScreen.style.transition = `all ${baseDuration * currentSpeed}s ${cubic_transform_closing}`;
        activeAppScreen.style.transform = `translateX(-50%) scale(${scaleX}, ${scaleY})`;
        activeAppScreen.style.opacity = '0';
        activeAppScreen.style.borderRadius = borderRadius;
        activeAppScreen.style.pointerEvents = 'none'; // Make app non-interactive during close

        wallpaper.classList.remove('open'); // Wallpaper zooms out
        if (activeIconBox) {
            activeIconBox.classList.remove('open'); // Shows icon's inner background again
        }

        setTimeout(() => {
            if (activeAppScreen) {
                activeAppScreen.style.display = 'none';
                // Reset inline styles
                activeAppScreen.style.opacity = '';
                activeAppScreen.style.transform = '';
                activeAppScreen.style.borderRadius = ''; 
                activeAppScreen.style.transition = '';
            }
            activeAppScreen = null;
            activeIconBox = null;
            isAnimating = false;
        }, baseDuration * currentSpeed * 1000 + 50);
    };

    // --- Power Button Logic ---
    const powerButton = document.getElementById('box13'); // Assuming box13 is the power button
    const phoneContainer = document.querySelector('.phone-container'); // Get the phone container
    let isPoweredOff = false;

    // Create a simple overlay for "Powered Off" state
    const poweredOffScreen = document.createElement('div');
    poweredOffScreen.id = 'powered-off-screen';
    poweredOffScreen.style.position = 'fixed';
    poweredOffScreen.style.top = '0';
    poweredOffScreen.style.left = '0';
    poweredOffScreen.style.width = '100%';
    poweredOffScreen.style.height = '100%';
    poweredOffScreen.style.background = 'black';
    poweredOffScreen.style.color = 'white';
    poweredOffScreen.style.display = 'none';
    poweredOffScreen.style.justifyContent = 'center';
    poweredOffScreen.style.alignItems = 'center';
    poweredOffScreen.style.fontSize = '2em';
    poweredOffScreen.style.zIndex = '9999999'; // Ensure it's on top
    poweredOffScreen.textContent = 'Powered Off (Click to turn on)';
    document.body.appendChild(poweredOffScreen);


    const powerOff = () => {
        if (isPoweredOff) return;
        isPoweredOff = true;
        phoneContainer.style.display = 'none';
        poweredOffScreen.style.display = 'flex';

        // Close any open app when powering off
        if (activeAppScreen) {
            closeApp(); // This will reset activeAppScreen etc.
        }
        isLocked = true; // Ensure lock screen appears next time
    };

    const powerOn = () => {
        if (!isPoweredOff) return;
        isPoweredOff = false;
        poweredOffScreen.style.display = 'none';
        phoneContainer.style.display = 'block'; // Or 'flex' depending on its initial display property

        // Re-show lock screen if it was active
        if (isLocked) {
             lockScreen.style.display = 'flex';
             lockScreen.classList.remove('hidden');
        }
    };

    powerButton.addEventListener('click', powerOff);
    poweredOffScreen.addEventListener('click', powerOn);


    // --- Swipe-up-to-close gesture logic ---
    let startY = 0;
    let startX = 0;
    let deltaY = 0;
    let deltaX = 0;
    let dragging = false;

    // Function to update app screen transform based on drag
    function updateAppScreenTransform(y) { // Simplified to only vertical drag
        if (!activeAppScreen) return;
        y = Math.max(0, y); // Only drag upwards
        y = Math.min(maxNav, y); // Limit drag distance (maxNav from original all.js, can be a setting)

        activeAppScreen.style.transition = `none`; // Disable transition during drag
        activeAppScreen.style.transform = `translateX(-50%) translateY(${-y}px) scale(${1 - y / (maxNav * 2)})`;
        activeAppScreen.style.opacity = `${1 - y / maxNav}`;

        wallpaper.style.transition = `none`;
        wallpaper.style.transform = `scale(${1.1 + (y / maxNav * 0.1)})`; // Wallpaper zooms slightly more
    }

    // Function to reset app screen or trigger close animation
    function resetOrCloseApp(y) {
        if (!activeAppScreen) return;

        const sensitivityThreshold = 40; // From original all.js deltaY > 40
        if (y > sensitivityThreshold) { // If swiped enough, close the app
            closeApp(); // Call the regular close function
        } else { // Otherwise, snap back to open state
            activeAppScreen.style.transition = `all 0.3s cubic-bezier(0.23, 0.55, 0.54, 0.97)`; // Snap back transition
            activeAppScreen.style.transform = `translateX(-50%) scale(1)`;
            activeAppScreen.style.opacity = '1';

            wallpaper.style.transition = `all 0.3s cubic-bezier(0.23, 0.55, 0.54, 0.97)`;
            wallpaper.style.transform = `scale(1.1)`; // Snap wallpaper back to zoomed state
            
            // Re-enable pointer events if it snapped back to open
            activeAppScreen.style.pointerEvents = 'auto';
        }
    }

    // Touch/Mouse event listeners for home bar swipe
    homeBar.addEventListener("touchstart", (e) => {
        if (!activeAppScreen || isAnimating) return;
        dragging = true;
        startY = e.touches[0].clientY;
        deltaY = 0;
        activeAppScreen.style.pointerEvents = 'none'; // Disable interaction with app content during drag
    }, { passive: false });

    homeBar.addEventListener("touchmove", (e) => {
        if (!dragging || !activeAppScreen || isAnimating) return;
        e.preventDefault(); // Prevent scrolling
        deltaY = startY - e.touches[0].clientY;
        updateAppScreenTransform(deltaY);
    }, { passive: false });

    homeBar.addEventListener("touchend", () => {
        if (!dragging || !activeAppScreen || isAnimating) return;
        dragging = false;
        resetOrCloseApp(deltaY);
        deltaY = 0;
    });

    // Mouse events for desktop simulation
    homeBar.addEventListener("mousedown", (e) => {
        if (!activeAppScreen || isAnimating) return;
        dragging = true;
        startY = e.clientY;
        deltaY = 0;
        activeAppScreen.style.pointerEvents = 'none';
    });

    window.addEventListener("mousemove", (e) => {
        if (!dragging || !activeAppScreen || isAnimating) return;
        deltaY = startY - e.clientY;
        updateAppScreenTransform(deltaY);
    });

    window.addEventListener("mouseup", () => {
        if (!dragging || !activeAppScreen || isAnimating) return;
        dragging = false;
        resetOrCloseApp(deltaY);
        deltaY = 0;
    });

    // --- Calculator Logic ---
    if (calculatorApp && calculatorButtons && calculatorExpressionDisplay && calculatorResultDisplay) {
        let calcTokens = [];
        let calcCurrentValue = '0';
        let calcAwaitingEntry = false;
        let calcLastKeyType = 'init';
        let calcEqualsExpression = '';

        const setExpressionText = (text) => {
            calculatorExpressionDisplay.textContent = text && text.trim() ? text : '\u00A0';
        };

        const updateCalculatorDisplay = () => {
            if (calcEqualsExpression) {
                setExpressionText(calcEqualsExpression);
            } else {
                const parts = [...calcTokens];
                if (!calcAwaitingEntry && calcLastKeyType !== 'operator' && calcLastKeyType !== 'equals') {
                    if (parts.length) {
                        parts.push(calcCurrentValue);
                    } else if (calcCurrentValue !== '0') {
                        parts.push(calcCurrentValue);
                    }
                }
                setExpressionText(parts.join(' '));
            }
            calculatorResultDisplay.textContent = calcCurrentValue;
        };

        const resetCalculator = () => {
            calcTokens = [];
            calcCurrentValue = '0';
            calcAwaitingEntry = false;
            calcLastKeyType = 'clear';
            calcEqualsExpression = '';
            updateCalculatorDisplay();
        };

        const sanitizeStateIfNeeded = () => {
            if (calcCurrentValue === 'Error') {
                calcTokens = [];
                calcCurrentValue = '0';
            }
            if (calcLastKeyType === 'equals') {
                calcTokens = [];
            }
            if (calcAwaitingEntry) {
                calcCurrentValue = '0';
                calcAwaitingEntry = false;
            }
            calcEqualsExpression = '';
        };

        const appendDigit = (digit) => {
            sanitizeStateIfNeeded();
            if (digit === '00') {
                if (calcCurrentValue !== '0') {
                    calcCurrentValue += '00';
                }
            } else {
                if (calcCurrentValue === '0') {
                    calcCurrentValue = digit;
                } else {
                    calcCurrentValue += digit;
                }
            }
            calcLastKeyType = 'digit';
            updateCalculatorDisplay();
        };

        const appendDecimal = () => {
            sanitizeStateIfNeeded();
            if (!calcCurrentValue.includes('.')) {
                calcCurrentValue = calcCurrentValue === '' ? '0.' : `${calcCurrentValue}.`;
            }
            calcLastKeyType = 'decimal';
            updateCalculatorDisplay();
        };

        const setOperator = (operator) => {
            if (calcCurrentValue === 'Error') {
                resetCalculator();
                return;
            }

            if (calcLastKeyType === 'operator' && calcTokens.length) {
                calcTokens[calcTokens.length - 1] = operator;
            } else {
                if (calcLastKeyType === 'equals') {
                    calcTokens = [calcCurrentValue];
                } else {
                    calcTokens.push(calcCurrentValue);
                }
                calcTokens.push(operator);
            }

            calcAwaitingEntry = true;
            calcLastKeyType = 'operator';
            calcEqualsExpression = '';
            updateCalculatorDisplay();
        };

        const computeOperations = (arr, operators) => {
            let index = 1;
            while (index < arr.length - 1) {
                const op = arr[index];
                if (operators.includes(op)) {
                    const left = parseFloat(arr[index - 1]);
                    const right = parseFloat(arr[index + 1]);
                    if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
                    let value;
                    switch (op) {
                        case '×':
                            value = left * right;
                            break;
                        case '÷':
                            if (right === 0) return null;
                            value = left / right;
                            break;
                        case '+':
                            value = left + right;
                            break;
                        case '-':
                            value = left - right;
                            break;
                        default:
                            value = null;
                    }
                    if (value === null || !Number.isFinite(value)) return null;
                    arr.splice(index - 1, 3, value.toString());
                } else {
                    index += 2;
                }
            }
            return arr;
        };

        const evaluateTokens = (baseTokens) => {
            if (!baseTokens.length) return parseFloat(calcCurrentValue);
            const working = baseTokens.map(String);
            if (working.length === 1) {
                const single = parseFloat(working[0]);
                return Number.isFinite(single) ? single : null;
            }
            const firstPass = computeOperations(working, ['×', '÷']);
            if (!firstPass) return null;
            const secondPass = computeOperations(firstPass, ['+', '-']);
            if (!secondPass) return null;
            const result = parseFloat(secondPass[0]);
            return Number.isFinite(result) ? result : null;
        };

        const formatResult = (value) => {
            if (value === null || !Number.isFinite(value)) {
                return 'Error';
            }
            if (Math.abs(value) >= 1e10 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
                return value.toExponential(6).replace(/\.?0+e/, 'e');
            }
            const fixed = parseFloat(value.toFixed(10));
            return fixed.toString().replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
        };

        const handleEquals = () => {
            if (calcCurrentValue === 'Error') {
                resetCalculator();
                return;
            }

            if (calcLastKeyType === 'operator' && calcTokens.length) {
                calcTokens.pop();
                calcLastKeyType = 'digit';
            }

            if (!calcTokens.length) {
                calcEqualsExpression = '';
                updateCalculatorDisplay();
                return;
            }

            const evaluationTokens = [...calcTokens, calcCurrentValue];
            const value = evaluateTokens(evaluationTokens);
            calcEqualsExpression = `${evaluationTokens.join(' ')} =`;
            calcCurrentValue = formatResult(value);
            calcTokens = [];
            calcAwaitingEntry = true;
            calcLastKeyType = 'equals';
            updateCalculatorDisplay();
        };

        const handleDelete = () => {
            if (calcCurrentValue === 'Error') {
                resetCalculator();
                return;
            }
            if (calcLastKeyType === 'equals') {
                calcTokens = [];
                calcEqualsExpression = '';
                calcAwaitingEntry = false;
            }
            if (calcAwaitingEntry) {
                calcCurrentValue = '0';
                calcAwaitingEntry = false;
            }
            if (calcCurrentValue.length > 1) {
                calcCurrentValue = calcCurrentValue.slice(0, -1);
            } else {
                calcCurrentValue = '0';
            }
            calcLastKeyType = 'digit';
            updateCalculatorDisplay();
        };

        calculatorButtons.addEventListener('click', (event) => {
            const key = event.target.closest('button');
            if (!key || key.hasAttribute('aria-hidden')) return;

            const { digit, decimal, operator, action } = key.dataset;

            if (digit !== undefined) {
                appendDigit(digit);
                return;
            }
            if (decimal !== undefined) {
                appendDecimal();
                return;
            }
            if (operator !== undefined) {
                setOperator(operator);
                return;
            }
            if (action === 'clear') {
                resetCalculator();
                return;
            }
            if (action === 'delete') {
                handleDelete();
                return;
            }
            if (action === 'equals') {
                handleEquals();
            }
        });

        const handleKeyboardInput = (event) => {
            if (activeAppScreen !== document.getElementById('app1')) return;
            const { key } = event;
            if (/^[0-9]$/.test(key)) {
                event.preventDefault();
                appendDigit(key);
                return;
            }
            if (key === '.') {
                event.preventDefault();
                appendDecimal();
                return;
            }
            if (key === '+' || key === '-' || key === '*' || key === '×' || key === '/' || key === '÷') {
                event.preventDefault();
                const mapped = key === '*' ? '×' : key === '/' ? '÷' : key;
                setOperator(mapped);
                return;
            }
            if (key === 'Enter' || key === '=') {
                event.preventDefault();
                handleEquals();
                return;
            }
            if (key === 'Backspace') {
                event.preventDefault();
                handleDelete();
                return;
            }
            if (key === 'Escape') {
                event.preventDefault();
                resetCalculator();
            }
        };

        window.addEventListener('keydown', handleKeyboardInput);
        updateCalculatorDisplay();
    }

    // --- Event Listeners ---
    appBoxes.forEach(icon => icon.addEventListener('click', openApp));
    closeAppButtons.forEach(button => button.addEventListener('click', closeApp));
    // homeBar's click functionality is now handled by the swipe touchend/mouseup that calls closeApp
    // A direct click listener on homeBar might conflict with drag logic

    // --- Dynamic phone scale adjustment ---
    const adjustPhoneScale = () => {
        const defaultPhoneHeight = 700; 
        const defaultPhoneWidth = 330; 

        const availableHeight = window.innerHeight;
        const availableWidth = window.innerWidth;

        const scaleHeight = availableHeight / (defaultPhoneHeight + 100); 
        const scaleWidth = availableWidth / (defaultPhoneWidth + 100); 

        const newScale = Math.min(scaleHeight, scaleWidth, 1); 

        document.documentElement.style.setProperty('--bg--scale_phone', newScale.toFixed(3));
    };

    adjustPhoneScale();
    window.addEventListener('resize', adjustPhoneScale);
});