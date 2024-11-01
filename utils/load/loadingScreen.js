export class LoadingScreen {
    constructor(gameName, options = {}) {
        this.gameName = gameName;
        
        // Default options
        this.options = {
            backgroundColor: '#000000',
            titleColor: '#ffffff',
            loadingColor: '#888888',
            dotColors: ['#ff0000', '#00ff00', '#0000ff'],
            fadeTime: 500, 
            fontSize: {
                title: '48px',
                loading: '24px'
            },
            fontFamily: 'Arial, sans-serif',
            ...options
        };
        
        this.initialize();
    }
    
    initialize() {
        // Create main container
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: this.options.backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: '0',
            transition: `opacity ${this.options.fadeTime}ms ease-in-out`,
            zIndex: '9999'
        });
        
        // Create title (H1)
        this.title = document.createElement('h1');
        Object.assign(this.title.style, {
            color: this.options.titleColor,
            fontSize: this.options.fontSize.title,
            fontFamily: this.options.fontFamily,
            margin: '0 0 20px 0',
            textAlign: 'center',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
        });
        this.title.textContent = this.gameName;
        
        // Create loading text (H3)
        this.loadingContainer = document.createElement('h3');
        Object.assign(this.loadingContainer.style, {
            color: this.options.loadingColor,
            fontSize: this.options.fontSize.loading,
            fontFamily: this.options.fontFamily,
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
        });
        
        // Create the "Loading" text
        this.loadingText = document.createElement('span');
        this.loadingText.textContent = 'Loading';
        
        // Create loading dots container
        this.dotsContainer = document.createElement('span');
        this.dots = [];
        
        // Create three animated dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            Object.assign(dot.style, {
                color: this.options.dotColors[i],
                marginLeft: '4px',
                opacity: '0',
                transition: 'opacity 0.3s ease-in-out',
                animation: `loadingDotBounce${i} 1s infinite`
            });
            dot.textContent = '.';
            this.dots.push(dot);
            this.dotsContainer.appendChild(dot);
        }
        
        // Add loading text and dots to loading container
        this.loadingContainer.appendChild(this.loadingText);
        this.loadingContainer.appendChild(this.dotsContainer);
        
        // Add elements to main container
        this.container.appendChild(this.title);
        this.container.appendChild(this.loadingContainer);
        
        // Create and add keyframe animations
        this.createAnimations();
    }
    
    createAnimations() {
        const style = document.createElement('style');
        const keyframes = this.dots.map((_, i) => `
            @keyframes loadingDotBounce${i} {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
            }
        `).join('\n');
        
        style.textContent = keyframes;
        document.head.appendChild(style);
    }
    
    mount(parentElement = document.body) {
        parentElement.appendChild(this.container);
        // Trigger fade in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
            setTimeout(() => {
                this.title.style.opacity = '1';
                this.title.style.transform = 'translateY(0)';
                this.loadingContainer.style.opacity = '1';
                this.loadingContainer.style.transform = 'translateY(0)';
                this.dots.forEach((dot, i) => {
                    setTimeout(() => {
                        dot.style.opacity = '1';
                    }, i * 150);
                });
            }, 100);
        });
    }
    
    unmount() {
        return new Promise(resolve => {
            this.container.style.opacity = '0';
            setTimeout(() => {
                this.container.remove();
                resolve();
            }, this.options.fadeTime);
        });
    }
    
    setProgress(progress) {
        this.loadingText.textContent = `Loading ${Math.round(progress)}%`;
    }
    
    setMessage(message) {
        this.loadingText.textContent = message;
    }
}