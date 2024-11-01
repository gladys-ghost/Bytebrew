export class InventorySystem {
    constructor(options = {}) {
      this.config = {
        maxHealth: options.maxHealth || 200,
        medkitHealAmount: options.medkitHealAmount || 25,
        initialMedkits: options.initialMedkits || 3,
        gunDamage: options.gunDamage || 20,
        fireRate: options.fireRate || 0.5,
        ...options
      };
  
      // State
      this.state = {
        currentHealth: this.config.maxHealth,
        selectedSlot: 1,
        lastFired: 0,
        items: {
          weapon: {
            equipped: true,
            damage: this.config.gunDamage,
            fireRate: this.config.fireRate
          },
          medkit: {
            uses: this.config.initialMedkits,
            healAmount: this.config.medkitHealAmount
          }
        }
      };
  
      this.ui = {};
      
      this.initializeUI();
      this.bindEvents();
    }
  
    createContainer() {
      const container = document.createElement('div');
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        userSelect: 'none',
        zIndex: '1000'
      });
      return container;
    }
  
    createHealthDisplay() {
      const health = document.createElement('div');
      Object.assign(health.style, {
        marginBottom: '10px',
        fontSize: '16px',
        fontWeight: 'bold'
      });
      health.textContent = `Health: ${this.state.currentHealth}/${this.config.maxHealth}`;
      return health;
    }
  
    createSlot(label, icon) {
      const slot = document.createElement('div');
      Object.assign(slot.style, {
        width: '60px',
        height: '60px',
        border: '2px solid #666',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'rgba(40, 40, 40, 0.6)',
        transition: 'all 0.2s ease'
      });
  
      const iconElement = document.createElement('div');
      Object.assign(iconElement.style, {
        fontSize: '24px',
        marginBottom: '4px'
      });
      iconElement.textContent = icon;
      iconElement.className = 'slot-icon';
  
      const labelElement = document.createElement('div');
      Object.assign(labelElement.style, {
        fontSize: '12px'
      });
      labelElement.textContent = label;
      labelElement.className = 'slot-label';
  
      slot.appendChild(iconElement);
      slot.appendChild(labelElement);
      return slot;
    }
  
    createInventorySlots() {
      const container = document.createElement('div');
      Object.assign(container.style, {
        display: 'flex',
        gap: '10px'
      });
  
      this.ui.gunSlot = this.createSlot('1: Gun', '🔫');
      this.ui.medkitSlot = this.createSlot(`2: Medkit (${this.state.items.medkit.uses})`, '❤️');
  
      container.appendChild(this.ui.gunSlot);
      container.appendChild(this.ui.medkitSlot);
      return container;
    }
  
    createControlsHint() {
      const hint = document.createElement('div');
      Object.assign(hint.style, {
        marginTop: '10px',
        fontSize: '12px',
        color: '#aaa',
        textAlign: 'center'
      });
      hint.textContent = 'Press 1-2 to select, E to use medkit';
      return hint;
    }
  
    initializeUI() {
      // Create main container
      this.ui.container = this.createContainer();
      
      // Create and store UI elements
      this.ui.healthDisplay = this.createHealthDisplay();
      this.ui.slots = this.createInventorySlots();
      this.ui.controls = this.createControlsHint();
  
      // Assemble UI
      this.ui.container.appendChild(this.ui.healthDisplay);
      this.ui.container.appendChild(this.ui.slots);
      this.ui.container.appendChild(this.ui.controls);
      
      // Add to document
      document.body.appendChild(this.ui.container);
  
      // Set initial selection
      this.selectSlot(1);
    }
  
    updateUI() {
      // Update health display
      this.ui.healthDisplay.textContent = 
        `Health: ${Math.ceil(this.state.currentHealth)}/${this.config.maxHealth}`;
      
      // Update medkit count
      const medkitLabel = this.ui.medkitSlot.querySelector('.slot-label');
      if (medkitLabel) {
        medkitLabel.textContent = `2: Medkit (${this.state.items.medkit.uses})`;
      }
    }
  
    bindEvents() {
      window.addEventListener('keydown', this.handleKeyPress.bind(this));
      this.ui.gunSlot.addEventListener('click', () => this.selectSlot(1));
      this.ui.medkitSlot.addEventListener('click', () => this.selectSlot(2));
    }
  
    handleKeyPress(event) {
      const key = event.key.toLowerCase();
      if (key === '1' || key === '2') {
        this.selectSlot(parseInt(key));
      } else if (key === 'e' && this.state.selectedSlot === 2) {
        this.useMedkit();
      }
    }
  
    selectSlot(slot) {
      this.state.selectedSlot = slot;
      this.ui.gunSlot.style.border = slot === 1 ? '2px solid #4a9eff' : '2px solid #666';
      this.ui.medkitSlot.style.border = slot === 2 ? '2px solid #4a9eff' : '2px solid #666';
    }
  
    useMedkit() {
      const { medkit } = this.state.items;
      if (medkit.uses > 0 && this.state.currentHealth < this.config.maxHealth) {
        medkit.uses--;
        this.state.currentHealth = Math.min(
          this.config.maxHealth,
          this.state.currentHealth + medkit.healAmount
        );
        this.updateUI();
        this.showEffect('heal');
      }
    }
  
    takeDamage(amount) {
      this.state.currentHealth = Math.max(0, this.state.currentHealth - amount);
      this.updateUI();
      this.showEffect('damage');
      return this.state.currentHealth <= 0;
    }
  
    canFire() {
      return this.state.selectedSlot === 1 && this.state.lastFired <= 0;
    }
  
    fire() {
      if (this.canFire()) {
        this.state.lastFired = this.state.items.weapon.fireRate;
        return this.state.items.weapon.damage;
      }
      return 0;
    }
  
    update(delta) {
      if (this.state.lastFired > 0) {
        this.state.lastFired -= delta;
      }
    }
  
    showEffect(type) {
      const flash = document.createElement('div');
      Object.assign(flash.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: type === 'heal' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
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
  
    getHealth() {
      return this.state.currentHealth;
    }
  
    getMedkitUses() {
      return this.state.items.medkit.uses;
    }
  
    getSelectedSlot() {
      return this.state.selectedSlot;
    }
  }