export class AmmoDisplay {
    constructor(maxAmmo, initialAmmo, options = {}) {
        this.maxAmmo = maxAmmo;
        this.currentAmmo = initialAmmo;
        this.isReloading = false;
        
        // Default options
        this.options = {
            position: { top: '60px', right: '20px' },
            width: '200px',
            barHeight: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            barColors: {
                full: '#ffcc00',     // Gold
                medium: '#ff9900',   // Orange
                low: '#ff4444',      // Red
                reloading: '#3498db' // Blue
            },
            reloadTime: 2000,        // Default reload time in ms
            showProgressBar: true,   // Option to show/hide the progress bar
            ...options
        };
        
        this.initialize();
    }
    
    initialize() {
        // Create main container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = this.options.position.top;
        this.container.style.left = this.options.position.left;
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = this.options.backgroundColor;
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.borderRadius = '5px';
        this.container.style.minWidth = this.options.width;
        
        // Create text display
        this.ammoText = document.createElement('div');
        this.ammoText.style.textAlign = 'center';
        this.ammoText.style.marginBottom = '5px';
        
        if (this.options.showProgressBar) {
            // Create progress container
            this.progressContainer = document.createElement('div');
            this.progressContainer.style.width = '100%';
            this.progressContainer.style.height = this.options.barHeight;
            this.progressContainer.style.backgroundColor = '#333';
            this.progressContainer.style.borderRadius = '10px';
            this.progressContainer.style.overflow = 'hidden';
            this.progressContainer.style.marginTop = '5px';
            
            // Create progress bar
            this.progressBar = document.createElement('div');
            this.progressBar.style.height = '100%';
            this.progressBar.style.width = '100%';
            this.progressBar.style.transition = 'width 0.3s ease-in-out';
            
            this.progressContainer.appendChild(this.progressBar);
        }
        
        // Create reload indicator
        this.reloadIndicator = document.createElement('div');
        this.reloadIndicator.style.textAlign = 'center';
        this.reloadIndicator.style.fontSize = '0.8em';
        this.reloadIndicator.style.marginTop = '5px';
        this.reloadIndicator.style.opacity = '0';
        this.reloadIndicator.style.transition = 'opacity 0.3s ease-in-out';
        
        // Assemble components
        this.container.appendChild(this.ammoText);
        if (this.options.showProgressBar) {
            this.container.appendChild(this.progressContainer);
        }
        this.container.appendChild(this.reloadIndicator);
        
        // Initial update
        this.updateDisplay();
    }
    
    mount(parentElement = document.body) {
        parentElement.appendChild(this.container);
    }
    
    unmount() {
        this.container.remove();
    }
    
    updateDisplay() {
        const ammoPercentage = (this.currentAmmo / this.maxAmmo) * 100;
        this.ammoText.textContent = `Ammo: ${this.currentAmmo}/${this.maxAmmo}`;
        
        if (this.options.showProgressBar) {
            this.progressBar.style.width = `${ammoPercentage}%`;
            
            // Update colors based on ammo percentage or reload state
            if (this.isReloading) {
                this.progressBar.style.backgroundColor = this.options.barColors.reloading;
            } else if (ammoPercentage < 25) {
                this.progressBar.style.backgroundColor = this.options.barColors.low;
            } else if (ammoPercentage < 50) {
                this.progressBar.style.backgroundColor = this.options.barColors.medium;
            } else {
                this.progressBar.style.backgroundColor = this.options.barColors.full;
            }
        }
    }
    
    useAmmo(amount = 1) {
        if (this.isReloading) return false;
        
        if (this.currentAmmo >= amount) {
            this.currentAmmo -= amount;
            this.updateDisplay();
            return true;
        }
        return false;
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo) return;
        
        this.isReloading = true;
        this.reloadIndicator.textContent = 'Reloading...';
        this.reloadIndicator.style.opacity = '1';
        this.updateDisplay();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                this.currentAmmo = this.maxAmmo;
                this.isReloading = false;
                this.reloadIndicator.style.opacity = '0';
                this.updateDisplay();
                resolve();
            }, this.options.reloadTime);
        });
    }
    
    setAmmo(amount) {
        this.currentAmmo = Math.max(0, Math.min(amount, this.maxAmmo));
        this.updateDisplay();
    }
}