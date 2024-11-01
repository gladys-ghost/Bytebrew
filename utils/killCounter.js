export class KillCounterSystem {
    constructor(options = {}) {
        this.config = {
            totalEnemies: options.totalEnemies || 10,
            ...options
        };

        // State
        this.state = {
            enemiesKilled: 0
        };

        this.ui = {};
        
        this.initializeUI();
    }

    createContainer() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            userSelect: 'none',
            zIndex: '1000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: '200px'
        });
        return container;
    }

    createKillDisplay() {
        const kills = document.createElement('div');
        Object.assign(kills.style, {
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        });

        const icon = document.createElement('span');
        icon.textContent = '💀';
        Object.assign(icon.style, {
            fontSize: '20px'
        });

        const text = document.createElement('span');
        text.textContent = `${this.state.enemiesKilled}/${this.config.totalEnemies}`;

        kills.appendChild(icon);
        kills.appendChild(text);
        return kills;
    }

    createMissionText() {
        const mission = document.createElement('div');
        Object.assign(mission.style, {
            fontSize: '14px',
            color: '#aaa',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '8px',
            textAlign: 'center'
        });
        
        // Create mission icon and text
        const icon = document.createElement('span');
        icon.textContent = '🎯 ';
        
        const text = document.createElement('span');
        text.textContent = `Kill ${this.config.totalEnemies} enemies`;
        
        mission.appendChild(icon);
        mission.appendChild(text);
        
        return mission;
    }

    initializeUI() {
        // Create main container
        this.ui.container = this.createContainer();
        
        // Create and store UI elements
        this.ui.killDisplay = this.createKillDisplay();
        this.ui.missionText = this.createMissionText();

        // Assemble UI
        this.ui.container.appendChild(this.ui.killDisplay);
        this.ui.container.appendChild(this.ui.missionText);
        
        // Add to document
        document.body.appendChild(this.ui.container);
    }

    updateUI() {
        const textElement = this.ui.killDisplay.querySelector('span:last-child');
        if (textElement) {
            textElement.textContent = `${this.state.enemiesKilled}/${this.config.totalEnemies}`;
        }

        // Update mission text style based on completion
        if (this.state.enemiesKilled === this.config.totalEnemies) {
            Object.assign(this.ui.missionText.style, {
                color: '#4caf50',
                fontWeight: 'bold'
            });
            this.ui.missionText.querySelector('span:last-child').textContent = 
                `Kill ${this.config.totalEnemies} enemies - Completed!`;
            this.showVictoryEffect();
        }
    }

    incrementKills() {
        if (this.state.enemiesKilled < this.config.totalEnemies) {
            this.state.enemiesKilled++;
            this.updateUI();
            this.showKillEffect();
            return true;
        }
        return false;
    }

    showKillEffect() {
        // Create and show a brief flash effect when enemy is killed
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(255, 215, 0, 0.1)', // Golden flash
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
            zIndex: '999'
        });

        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => document.body.removeChild(flash), 200);
        }, 100);
    }

    showVictoryEffect() {
        // Create victory message
        const victory = document.createElement('div');
        Object.assign(victory.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px 40px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '12px',
            color: 'gold',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: '1001',
            animation: 'fadeIn 0.5s ease-in'
        });
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        victory.textContent = '🏆 Victory! All Enemies Defeated! 🏆, You can now opem the door';
        document.body.appendChild(victory);

        // Remove after 3 seconds
        setTimeout(() => {
            victory.style.opacity = '0';
            victory.style.transition = 'opacity 0.5s';
            setTimeout(() => document.body.removeChild(victory), 500);
        }, 3000);
    }

    getKillCount() {
        return this.state.enemiesKilled;
    }

    getTotalEnemies() {
        return this.config.totalEnemies;
    }

    reset() {
        this.state.enemiesKilled = 0;
        // Reset mission text style
        Object.assign(this.ui.missionText.style, {
            color: '#aaa',
            fontWeight: 'normal'
        });
        this.ui.missionText.querySelector('span:last-child').textContent = 
            `Kill ${this.config.totalEnemies} enemies`;
        this.updateUI();
    }
}