/**
 * Color Picker Card for Home Assistant
 *
 * A custom Lovelace card that provides a color picker with separate
 * hue/saturation and brightness controls. Writes hex color values to
 * input_text entities.
 *
 * Features:
 * - HSV-based color picker (hue/saturation always at full brightness)
 * - Separate brightness slider for dim colors (e.g., #0F0000)
 * - Visual preview of actual color
 * - Works with input_text and text helper entities
 */

import 'https://cdn.jsdelivr.net/npm/@jaames/iro@5/dist/iro.min.js';

class ColorPickerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._colorPicker = null;
    this._isCollapsed = true; // Track collapsed state
    this._isEditingHex = false; // Track when user is editing hex input
  }

  /**
   * Called by Home Assistant when the card configuration is set
   */
  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }

    this.config = config;
    this.render();
  }

  /**
   * Home Assistant will set this property when state changes
   */
  set hass(hass) {
    this._hass = hass;

    // Get the current entity state
    const entityId = this.config.entity;
    const state = hass.states[entityId];

    if (!state) {
      console.warn(`Entity ${entityId} not found`);
      return;
    }

    // Update entity name if available
    this.updateEntityName();

    // Update color picker if the entity state changed
    this.updateColorFromEntity(state.state);

    // Ensure collapsed state is maintained (important for mobile app)
    this.applyCollapsedState();
  }

  get hass() {
    return this._hass;
  }

  /**
   * Converts hex color to HSV
   */
  hexToHsv(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const v = max;

    if (diff !== 0) {
      s = diff / max;

      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }

      h *= 60;
      if (h < 0) h += 360;
    }

    return { h, s: s * 100, v: v * 100 };
  }

  /**
   * Converts HSV to hex color
   */
  hsvToHex(h, s, v) {
    s = s / 100;
    v = v / 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    const hexR = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const hexG = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const hexB = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${hexR}${hexG}${hexB}`.toUpperCase();
  }

  /**
   * Get bright hue color (full saturation and brightness)
   * Used for coloring the icon
   */
  getBrightHueColor(hexColor) {
    const hsv = this.hexToHsv(hexColor);

    // If the color is grayscale (very low saturation), keep the original color
    // This prevents black/gray/white from becoming red
    if (hsv.s < 10) {
      return hexColor;
    }

    // Use the same hue, but set saturation and value to 100%
    return this.hsvToHex(hsv.h, 100, 100);
  }

  /**
   * Update the color picker when entity state changes
   */
  updateColorFromEntity(hexColor) {
    if (!this._colorPicker || !hexColor) return;

    // Don't update if user is actively editing the hex input
    if (this._isEditingHex) return;

    // Ensure hex color has # prefix
    if (!hexColor.startsWith('#')) {
      hexColor = '#' + hexColor;
    }

    // Convert to HSV and update picker
    const hsv = this.hexToHsv(hexColor);
    this._colorPicker.color.hsv = hsv;

    // Update preview
    this.updatePreview(hexColor);
  }

  /**
   * Update the preview display
   */
  updatePreview(hexColor) {
    const previewBox = this.shadowRoot.querySelector('.color-preview');
    const hexInput = this.shadowRoot.querySelector('.hex-input');

    if (previewBox) {
      previewBox.style.backgroundColor = hexColor;
    }
    if (hexInput) {
      hexInput.value = hexColor.toUpperCase();
    }

    // Update icon color with bright hue
    this.updateIcon(hexColor);
  }

  /**
   * Update the icon color with bright hue
   */
  updateIcon(hexColor) {
    const iconElement = this.shadowRoot.querySelector('.entity-icon');
    if (!iconElement || !hexColor) return;

    const brightHueColor = this.getBrightHueColor(hexColor);
    iconElement.style.color = brightHueColor;
  }

  /**
   * Update the entity name and icon display
   */
  updateEntityName() {
    const nameElement = this.shadowRoot.querySelector('.entity-name');
    const iconElement = this.shadowRoot.querySelector('.entity-icon');

    if (!this._hass || !this.config.entity) return;

    // Get entity state
    const state = this._hass.states[this.config.entity];
    if (!state) return;

    // Update entity name
    if (nameElement && state.attributes && state.attributes.friendly_name) {
      const entityName = state.attributes.friendly_name;
      const name = this.config.name || entityName;
      nameElement.textContent = name;
    }

    // Update icon
    if (iconElement) {
      const icon = this.config.icon || state.attributes.icon || 'mdi:palette';
      iconElement.setAttribute('icon', icon);
    }
  }

  /**
   * Handle manual hex input from user
   */
  handleHexInput(event) {
    let hex = event.target.value.trim();

    // Add # if missing
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }

    // Validate hex format (3 or 6 digits)
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      // Expand 3-digit hex to 6-digit
      if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }

      this._isUpdating = true;
      const hsv = this.hexToHsv(hex);
      this._colorPicker.color.hsv = hsv;
      this._isUpdating = false;

      this.updateEntity(hex);
    }
  }

  /**
   * Toggle picker visibility
   */
  togglePicker() {
    const pickerContainer = this.shadowRoot.querySelector('.color-picker-container');
    const toggleBtn = this.shadowRoot.querySelector('.toggle-picker-btn');

    this._isCollapsed = !this._isCollapsed;

    if (this._isCollapsed) {
      pickerContainer.classList.remove('expanded');
      toggleBtn.textContent = '▶';
    } else {
      pickerContainer.classList.add('expanded');
      toggleBtn.textContent = '▼';
    }
  }

  /**
   * Apply the current collapsed state to the picker
   */
  applyCollapsedState() {
    const pickerContainer = this.shadowRoot.querySelector('.color-picker-container');
    const toggleBtn = this.shadowRoot.querySelector('.toggle-picker-btn');

    if (!pickerContainer || !toggleBtn) return;

    if (this._isCollapsed) {
      pickerContainer.classList.remove('expanded');
      toggleBtn.textContent = '▶';
    } else {
      pickerContainer.classList.add('expanded');
      toggleBtn.textContent = '▼';
    }
  }

  /**
   * Call Home Assistant service to update entity
   */
  updateEntity(hexColor) {
    if (!this._hass) return;

    // Remove # prefix for storage
    const value = hexColor.replace('#', '');

    this._hass.callService('input_text', 'set_value', {
      entity_id: this.config.entity,
      value: value
    });
  }

  /**
   * Initialize the color picker
   */
  initColorPicker() {
    const container = this.shadowRoot.querySelector('.sliders-wrapper');
    if (!container) return;

    const compact = this.config.compact !== false;
    const sliderWidth = compact ? 250 : 300;

    // Create iro.js color picker with separate sliders for hue, saturation, and value
    // This keeps hue and saturation sliders always visible at full brightness
    const config = {
      width: sliderWidth,
      layout: [
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'hue'
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'saturation'
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'value'
          }
        }
      ]
    };

    this._colorPicker = new iro.ColorPicker(container, config);
    this._isUpdating = false;

    this._colorPicker.on('color:change', (color) => {
      if (this._isUpdating) return;

      const hexColor = color.hexString;
      this.updatePreview(hexColor);
    });

    // Update entity when user finishes changing color
    this._colorPicker.on('input:end', (color) => {
      const hexColor = color.hexString;
      this.updateEntity(hexColor);
    });

    // Initialize with current entity state
    if (this._hass) {
      const state = this._hass.states[this.config.entity];
      if (state && state.state) {
        this.updateColorFromEntity(state.state);
      }
    }
  }

  /**
   * Render the card HTML
   */
  render() {
    if (!this.shadowRoot) return;

    // Get entity friendly name
    let entityName = 'Color Picker';
    if (this._hass && this.config.entity) {
      const state = this._hass.states[this.config.entity];
      if (state && state.attributes && state.attributes.friendly_name) {
        entityName = state.attributes.friendly_name;
      }
    }

    const name = this.config.name || entityName;
    const compact = this.config.compact !== false;
    const defaultCollapsed = this.config.default_collapsed !== false;

    // Store the collapsed state
    this._isCollapsed = defaultCollapsed;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          padding: ${compact ? '12px' : '16px'};
        }

        .compact-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .entity-icon {
          --mdc-icon-size: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .entity-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text-color);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .color-preview {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: 2px solid var(--divider-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          flex-shrink: 0;
        }

        .hex-input {
          font-family: 'Roboto Mono', monospace;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          outline: none;
          transition: border-color 0.2s;
          width: 85px;
          text-align: center;
        }

        .hex-input:focus {
          border-color: var(--primary-color);
        }

        .hex-input:invalid {
          border-color: var(--error-color);
        }

        .toggle-picker-btn {
          background: none;
          border: none;
          color: var(--primary-text-color);
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          opacity: 0.5;
          transition: opacity 0.2s;
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-picker-btn:hover {
          opacity: 1;
        }

        .color-picker-container {
          display: none;
          flex-direction: column;
          align-items: stretch;
          gap: ${compact ? '12px' : '16px'};
          margin-top: ${compact ? '8px' : '12px'};
          padding-top: ${compact ? '8px' : '12px'};
          border-top: 1px solid var(--divider-color);
        }

        .color-picker-container.expanded {
          display: flex;
        }

        .sliders-wrapper {
          width: 100%;
          max-width: ${compact ? '250px' : '300px'};
          margin: 0 auto;
        }

        .IroSlider {
          margin-bottom: ${compact ? '12px' : '16px'};
        }

        .IroSlider svg {
          display: block;
          width: 100%;
        }
      </style>

      <ha-card>
        <div class="compact-row">
          <ha-icon class="entity-icon" icon="mdi:palette"></ha-icon>
          <div class="entity-name">${name}</div>
          <div class="color-preview" title="Click to toggle picker"></div>
          <input
            type="text"
            class="hex-input"
            placeholder="#000000"
            maxlength="7"
            pattern="^#?[0-9A-Fa-f]{6}$"
          />
          <button class="toggle-picker-btn" title="Toggle color picker">${defaultCollapsed ? '▶' : '▼'}</button>
        </div>

        <div class="color-picker-container">
          <div class="sliders-wrapper"></div>
        </div>
      </ha-card>
    `;

    // Attach event listeners
    const toggleBtn = this.shadowRoot.querySelector('.toggle-picker-btn');
    const previewBox = this.shadowRoot.querySelector('.color-preview');
    const hexInput = this.shadowRoot.querySelector('.hex-input');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePicker());
    }

    if (previewBox) {
      previewBox.addEventListener('click', () => this.togglePicker());
    }

    if (hexInput) {
      hexInput.addEventListener('focus', () => {
        this._isEditingHex = true;
      });
      hexInput.addEventListener('blur', (e) => {
        this._isEditingHex = false;
        this.handleHexInput(e);
      });
      hexInput.addEventListener('change', (e) => this.handleHexInput(e));
    }

    // Apply initial collapsed state immediately
    this.applyCollapsedState();

    // Re-apply after a short delay to handle mobile app initialization
    setTimeout(() => this.applyCollapsedState(), 50);
    setTimeout(() => this.applyCollapsedState(), 200);

    // Initialize color picker after render
    setTimeout(() => this.initColorPicker(), 0);
  }

  /**
   * Return the card size for layout calculation
   */
  getCardSize() {
    return 4;
  }

  /**
   * Return the stub config for the card picker
   */
  static getStubConfig() {
    return {
      entity: 'input_text.color_picker'
    };
  }
}

// Define the custom element
customElements.define('color-picker-card', ColorPickerCard);

// Add card to custom cards list
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'color-picker-card',
  name: 'Color Picker Card',
  description: 'A color picker with separate brightness control for input_text entities',
  preview: false,
  documentationURL: 'https://github.com/yourusername/color-picker-card'
});

console.info(
  '%c COLOR-PICKER-CARD %c Version 2.0.0 ',
  'color: white; background: #0066cc; font-weight: bold;',
  'color: #0066cc; background: white; font-weight: bold;'
);
