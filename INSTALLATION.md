# Installation Guide

This guide will walk you through installing and setting up the Color Picker Card for Home Assistant.

## Prerequisites

- Home Assistant 2021.3.0 or newer
- Access to your Home Assistant configuration files

## Installation Methods

### Method 1: HACS (Recommended)

*Coming soon - This card will be submitted to HACS*

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click the "+" button
4. Search for "Color Picker Card"
5. Click "Install"
6. Restart Home Assistant

### Method 2: Manual Installation

1. **Download the file**
   - Download [color-picker-card.js](color-picker-card.js) from this repository

2. **Copy to your Home Assistant**
   - Copy the file to your `/config/www/` folder
   - If the `www` folder doesn't exist, create it in your config directory

3. **Add the resource to Lovelace**

   **Option A: Via UI (Recommended)**
   - Navigate to Settings → Dashboards → Resources (top right menu)
   - Click "Add Resource"
   - Set URL to `/local/color-picker-card.js`
   - Set Resource type to "JavaScript Module"
   - Click "Create"

   **Option B: Via YAML**
   - Edit your `configuration.yaml` or `ui-lovelace.yaml`
   - Add:
     ```yaml
     lovelace:
       mode: yaml
       resources:
         - url: /local/color-picker-card.js
           type: module
     ```

4. **Restart Home Assistant**
   - Go to Developer Tools → YAML
   - Click "Restart" (or restart from the command line)

5. **Clear browser cache**
   - Hard refresh your browser (Ctrl+F5 on Windows/Linux, Cmd+Shift+R on Mac)

## Setup

### Step 1: Create Helper Entities

Before using the card, you need to create text helper entities to store the color values.

**Via UI (Recommended):**

1. Navigate to Settings → Devices & Services → Helpers
2. Click "+ Create Helper" button
3. Select "Text"
4. Configure the helper:
   - **Name**: Choose a descriptive name (e.g., "LED Color", "RGB Strip Color")
   - **Icon**: (Optional) Choose an icon like `mdi:palette` or `mdi:led-strip`
   - **Maximum length**: Set to `7` (to store format like `#RRGGBB` or `RRGGBB`)
   - **Initial value**: (Optional) Set a starting color like `FF0000` for red
5. Click "Create"

**Via YAML:**

Add to your `configuration.yaml`:

```yaml
input_text:
  led_color:
    name: LED Color
    initial: "FF0000"
    max: 7
    icon: mdi:palette

  rgb_strip_color:
    name: RGB Strip Color
    initial: "00FF00"
    max: 7
    icon: mdi:led-strip-variant

  night_light_color:
    name: Night Light Color
    initial: "0F0000"
    max: 7
    icon: mdi:sleep
```

Then restart Home Assistant or reload helpers.

### Step 2: Add the Card to Your Dashboard

**Via UI:**

1. Edit your dashboard (three dots → Edit Dashboard)
2. Click "+ Add Card"
3. Search for "Custom: Color Picker Card"
4. Select it
5. In the configuration, set the entity to your helper:
   ```yaml
   type: custom:color-picker-card
   entity: input_text.led_color
   ```
6. (Optional) Customize:
   ```yaml
   type: custom:color-picker-card
   entity: input_text.led_color
   name: My LED Strip
   icon: mdi:led-strip-variant
   show_header: true
   ```
7. Click "Save"

**Via YAML:**

1. Edit your dashboard in YAML mode
2. Add the card configuration:
   ```yaml
   - type: custom:color-picker-card
     entity: input_text.led_color
     name: LED Color Picker
     icon: mdi:palette
   ```

### Step 3: Connect to Your Devices

Create an automation to apply the color to your actual devices when the helper changes:

**For RGB Lights:**

```yaml
automation:
  - id: update_led_strip_color
    alias: "Update LED Strip from Color Picker"
    trigger:
      - platform: state
        entity_id: input_text.led_color
    action:
      - service: light.turn_on
        target:
          entity_id: light.my_led_strip
        data:
          rgb_color: >
            {% set hex = states('input_text.led_color').lstrip('#') %}
            {{ [
              hex[0:2]|int(base=16),
              hex[2:4]|int(base=16),
              hex[4:6]|int(base=16)
            ] }}
```

**For ESPHome Devices:**

```yaml
automation:
  - id: update_esphome_led
    alias: "Update ESPHome LED Color"
    trigger:
      - platform: state
        entity_id: input_text.esphome_led_color
    action:
      - service: esphome.device_name_set_rgb
        data:
          red: >
            {{ states('input_text.esphome_led_color')[0:2]|int(base=16) }}
          green: >
            {{ states('input_text.esphome_led_color')[2:4]|int(base=16) }}
          blue: >
            {{ states('input_text.esphome_led_color')[4:6]|int(base=16) }}
```

## Verification

To verify the installation worked:

1. **Check the browser console**
   - Open Developer Tools (F12)
   - Look for the Color Picker Card version message
   - Should see: `COLOR-PICKER-CARD Version 1.0.0`

2. **Test the card**
   - The color picker wheel and brightness slider should appear
   - Changing colors should update the preview
   - The hex value should display below the preview
   - The entity value should update in real-time

3. **Check for errors**
   - If the card doesn't appear, check the browser console for errors
   - Check Home Assistant logs for any service call errors

## Troubleshooting

### Card doesn't appear

**Problem**: Card shows as "Custom element doesn't exist: color-picker-card"

**Solutions**:
1. Verify the file is in `/config/www/color-picker-card.js`
2. Check that the resource is added correctly in Lovelace resources
3. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
4. Restart Home Assistant
5. Check browser console for JavaScript errors

### Entity not found

**Problem**: "Entity not found: input_text.xxx"

**Solutions**:
1. Verify the helper entity exists (Settings → Devices & Services → Helpers)
2. Check the entity ID matches exactly (case-sensitive)
3. Reload helpers or restart Home Assistant

### Colors not updating

**Problem**: Moving the color picker doesn't update the entity

**Solutions**:
1. Check Home Assistant logs for service call errors
2. Verify the entity is an `input_text` type (not text sensor)
3. Ensure the entity's max length is at least 6 characters
4. Test calling `input_text.set_value` manually from Developer Tools

### Color picker is too small/large

**Problem**: The color picker size doesn't fit well

**Solutions**:
1. The default size is 200px width
2. You can modify the `width` parameter in the JavaScript file
3. Look for `width: 200` in the `initColorPicker()` function
4. Change to your preferred size (e.g., `width: 250`)

### CDN blocked

**Problem**: iro.js library not loading (CSP or network issues)

**Solutions**:
1. Download iro.js locally:
   - Download from: https://cdn.jsdelivr.net/npm/@jaames/iro@5/dist/iro.min.js
   - Save to `/config/www/iro.min.js`
2. Update the import in `color-picker-card.js`:
   - Change: `import 'https://cdn.jsdelivr.net/npm/@jaames/iro@5/dist/iro.min.js';`
   - To: `import '/local/iro.min.js';`

## Upgrading

### From Manual Installation

1. Download the latest `color-picker-card.js`
2. Replace the file in `/config/www/`
3. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
4. Refresh the page

### From HACS

*Coming soon*

## Uninstalling

1. Remove the card from all dashboards
2. Remove the resource from Lovelace resources
3. Delete `/config/www/color-picker-card.js`
4. (Optional) Remove any helper entities you created for the card
5. Clear browser cache

## Next Steps

- Check out [example-config.yaml](example-config.yaml) for more configuration examples
- Read the [README.md](README.md) for detailed usage instructions
- Create automations to control your RGB devices
- Experiment with very dim colors for night lights

## Getting Help

If you're still having issues:

1. Check existing GitHub issues
2. Open a new issue with:
   - Your Home Assistant version
   - Browser and version
   - Complete error messages
   - Your card configuration
   - Screenshots if applicable

## Support This Project

If this card is useful to you:
- ⭐ Star the repository on GitHub
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔀 Submit pull requests
