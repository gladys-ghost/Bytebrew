export class HealthBar {
    constructor(maxHealth, initialHealth, options = {}) {
        this.maxHealth = maxHealth;
        this.currentHealth = initialHealth;
        
        this.options = {
            position: { top: '20px', left: '20px' },
            width: '200px',
            barHeight: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            barColors: {
                high: '#44ff44',    // Green
                medium: '#ffaa44',  // Orange
                low: '#ff4444'      // Red
            },
            ...options
        };
        
        this.initialize();
    }
    
    initialize() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = this.options.position.top;
        this.container.style.left = this.options.position.left;
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = this.options.backgroundColor;
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.borderRadius = '5px';
        this.container.style.minWidth = this.options.width;
        
        // Create text display
        this.healthText = document.createElement('div');
        this.healthText.style.textAlign = 'center';
        this.healthText.style.marginBottom = '5px';
        
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
        this.container.appendChild(this.healthText);
        this.container.appendChild(this.progressContainer);
        
        this.updateDisplay();
    }
    
    mount(parentElement = document.body) {
        parentElement.appendChild(this.container);
    }
    
    unmount() {
        this.container.remove();
    }
    
    updateDisplay() {
        const healthPercentage = Math.floor ((this.currentHealth / this.maxHealth) * 100);
        this.healthText.textContent = `Health: ${this.currentHealth}/${this.maxHealth}`;
        this.progressBar.style.width = `${healthPercentage}%`;
        
        if (healthPercentage < 25) {
            this.progressBar.style.backgroundColor = this.options.barColors.low;
        } else if (healthPercentage < 50) {
            this.progressBar.style.backgroundColor = this.options.barColors.medium;
        } else {
            this.progressBar.style.backgroundColor = this.options.barColors.high;
        }
    }
    
    addHealth(amount) {
        this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
        this.updateDisplay();
    }
    
    damage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateDisplay();
        
        if (this.currentHealth <= 0) {
            this.onGameOver();
        }
    }
    
    setHealth(amount) {
        this.currentHealth = Math.max(0, Math.min(amount, this.maxHealth));
        this.updateDisplay();
    }

    getHealth(){
        return this.currentHealth;
    }
    
    onGameOver() {
        console.log('Game Over!');
    }
}