export class FlickeringLightSystem {
    constructor(options = {}) {
        this.config = {
            intensity: options.intensity || 0.5,        // 0 to 1
            flickerSpeed: options.flickerSpeed || 1,    // Speed multiplier
            minOpacity: options.minOpacity || 0.1,     // Minimum opacity
            maxOpacity: options.maxOpacity || 0.3,     // Maximum opacity
            ...options
        };

        this.light = null;
        this.isActive = true;
        this.time = 0;
        
        this.initializeLight();
        this.startAnimation();
    }

    initializeLight() {
        // Create the light overlay
        this.light = document.createElement('div');
        
        // Set initial styles
        Object.assign(this.light.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'red',
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '9999',
            transition: 'opacity 0.05s ease-in-out',
            mixBlendMode: 'multiply'
        });

        // Add to document
        document.body.appendChild(this.light);
    }

    startAnimation() {
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            if (!this.isActive) return;

            // Calculate delta time
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Update time
            this.time += deltaTime * this.config.flickerSpeed;

            // Calculate flicker effect
            const flicker = this.calculateFlicker();
            
            // Apply the flicker
            if (this.light) {
                this.light.style.opacity = flicker.toString();
            }

            // Request next frame
            requestAnimationFrame(animate);
        };

        // Start the animation loop
        requestAnimationFrame(animate);
    }

    calculateFlicker() {
        // Use multiple sine waves with different frequencies for more organic flickering
        const baseFlicker = Math.sin(this.time * 10) * 0.5 + 0.5;
        const rapidFlicker = Math.sin(this.time * 25) * 0.25 + 0.75;
        const slowFlicker = Math.sin(this.time * 3) * 0.15 + 0.85;

        // Combine the flickers
        let combinedFlicker = baseFlicker * rapidFlicker * slowFlicker;

        // Add some random noise
        combinedFlicker *= (0.9 + Math.random() * 0.2);

        // Scale to desired range
        const opacity = this.lerp(
            this.config.minOpacity,
            this.config.maxOpacity,
            combinedFlicker * this.config.intensity
        );

        return opacity;
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    setIntensity(intensity) {
        this.config.intensity = Math.max(0, Math.min(1, intensity));
    }

    setFlickerSpeed(speed) {
        this.config.flickerSpeed = speed;
    }

    setOpacityRange(min, max) {
        this.config.minOpacity = min;
        this.config.maxOpacity = max;
    }

    start() {
        this.isActive = true;
        this.startAnimation();
    }

    stop() {
        this.isActive = false;
        if (this.light) {
            this.light.style.opacity = '0';
        }
    }

    destroy() {
        this.stop();
        if (this.light && this.light.parentNode) {
            this.light.parentNode.removeChild(this.light);
        }
        this.light = null;
    }
}