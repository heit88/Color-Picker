# Color Picker Card for Home Assistant

A custom Lovelace card that provides an intuitive color picker with **separate hue/saturation and brightness controls**. Perfect for controlling RGB LEDs with very dim colors that would appear black on traditional color pickers.

![Color Picker Card](https://via.placeholder.com/600x400?text=Color+Picker+Card+Screenshot)

## Features

- 🎨 **HSV-based color picker** - Three separate sliders for hue, saturation, and value
- 💡 **Separate brightness control** - Brightness slider stays visible even at 0% brightness
- 🔍 **Visual preview** - See the actual color including dim values like `#0F0000`
- 🎯 **Entity icon display** - Shows the entity's icon colored by the hue (at full brightness)
- ⌨️ **Direct hex input** - Type hex codes directly to duplicate colors across entities
- 📦 **Compact mode** - Space-efficient design perfect for controlling multiple LEDs
- 🔽 **Collapsible picker** - Defaults to collapsed; click to expand when needed
- 📝 **Hex output** - Writes hex color values to `input_text` or text helper entities
- 🎯 **Perfect for LEDs** - Easily select very dim colors that are invisible on traditional pickers

## Why This Card?

Traditional color pickers combine color and brightness, making it impossible to see and select very dim colors. For example:
- `#0F0000` (very dim red) appears as black on most color pickers
- `#00000F` (very dim blue) also appears as black
- But on LEDs, these colors are clearly visible as red and blue!

This card solves this by separating the color selection (hue/saturation) from brightness, similar to how Home Assistant's light controls work.

## Installation

### HACS (Recommended)

*Coming soon - This card will be available in HACS*

### Manual Installation

1. Download [color-picker-card.js](color-picker-card.js)
2. Copy it to your `config/www` folder
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/color-picker-card.js
    type: module
```

4. Restart Home Assistant

## Configuration

### Step 1: Create an input_text helper

First, create a text helper to store the hex color value:

**Via UI:**
1. Go to Settings → Devices & Services → Helpers
2. Click "Create Helper"
3. Select "Text"
4. Name it (e.g., "LED Color")
5. Set max length to 7 (for `#RRGGBB` format)

**Via YAML** (in `configuration.yaml`):
```yaml
input_text:
  led_color:
    name: LED Color
    initial: "FF0000"
    max: 7
```

### Step 2: Add the card to your dashboard

**Minimal configuration:**
```yaml
type: custom:color-picker-card
entity: input_text.led_color
```

**Full configuration:**
```yaml
type: custom:color-picker-card
entity: input_text.led_color
name: LED Strip Color
icon: mdi:led-strip-variant
compact: true
default_collapsed: false
```

## Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `entity` | string | **Yes** | - | The `input_text` or text helper entity to control |
| `name` | string | No | Entity's friendly name | Custom name to display (overrides entity's friendly name) |
| `icon` | string | No | Entity's icon or `mdi:palette` | Icon to display, colored by the hue at full brightness |
| `compact` | boolean | No | `true` | Use compact layout (smaller padding and sliders) |
| `default_collapsed` | boolean | No | `true` | Start with the color picker collapsed |

## Usage Examples

### Single LED Control (Compact & Collapsed)

Perfect for dashboards with multiple LEDs:

```yaml
type: custom:color-picker-card
entity: input_text.desk_led_color
name: Desk LED
icon: mdi:desk-lamp
compact: true
default_collapsed: true
```

The card will show a compact row with the icon (colored by hue), name, preview, hex input, and expand button. Click to expand the full color picker when needed.

### RGB LED Strip Control

```yaml
type: custom:color-picker-card
entity: input_text.rgb_strip_color
name: RGB LED Strip
icon: mdi:led-strip-variant
compact: true
```

Then use the color in your automations:

```yaml
automation:
  - alias: "Update LED Color"
    trigger:
      - platform: state
        entity_id: input_text.rgb_strip_color
    action:
      - service: light.turn_on
        target:
          entity_id: light.led_strip
        data:
          rgb_color: >
            {% set hex = states('input_text.rgb_strip_color').lstrip('#') %}
            {{ [
              hex[0:2]|int(base=16),
              hex[2:4]|int(base=16),
              hex[4:6]|int(base=16)
            ] }}
```

### Very Dim Colors for Night Lights

Perfect for selecting barely-visible colors for nighttime:

```yaml
type: custom:color-picker-card
entity: input_text.night_light_color
name: Night Light
icon: mdi:sleep
```

Now you can easily select colors like:
- `#0F0000` - Very dim red (6% brightness)
- `#00001F` - Very dim blue (12% brightness)
- `#1F0F00` - Very dim orange

These would all appear as black on a traditional color picker!

### Theme Color Selector

Store theme colors for your dashboard:

```yaml
type: custom:color-picker-card
entity: input_text.theme_primary_color
name: Primary Theme Color
icon: mdi:palette
```

## Use with ESPHome

Great for controlling RGB LEDs with ESPHome:

**Home Assistant:**
```yaml
input_text:
  esphome_led_color:
    name: ESPHome LED Color
    initial: "FF0000"
    max: 7
```

**ESPHome:**
```yaml
light:
  - platform: rgb
    name: "ESPHome RGB LED"
    red: output_component1
    green: output_component2
    blue: output_component3

text_sensor:
  - platform: homeassistant
    id: led_color_hex
    entity_id: input_text.esphome_led_color
    on_value:
      then:
        - lambda: |-
            auto color = id(led_color_hex).state;
            // Parse hex to RGB and set light color
```

## How It Works

1. **User selects color** - Use three sliders for hue, saturation, and value
2. **Direct input option** - Or type hex codes directly in the input field
3. **Card calculates hex** - Converts HSV to hex format (e.g., `#0F0000`)
4. **Updates entity** - Calls `input_text.set_value` service
5. **Icon updates** - Entity icon color reflects the hue at full brightness
6. **Automation triggered** - Your automation uses the hex value

## UI Components

The card displays a compact header row with:

- **Entity Icon**: Colored using the hue at full saturation/brightness (grayscale colors show actual value)
- **Entity Name**: Displays the entity's friendly name (or custom name from config)
- **Color Preview**: Shows the actual selected color (including dim values)
- **Hex Input**: Type or copy hex codes (with or without `#` prefix)
- **Expand Button**: Click to show/hide the color picker sliders

When expanded, you get three sliders:
- **Hue** (0-360°): Select the color (red, orange, yellow, green, cyan, blue, magenta)
- **Saturation** (0-100%): Control color intensity (0% = gray, 100% = pure color)
- **Value/Brightness** (0-100%): Control brightness (0% = black, 100% = full brightness)

## Color Format

The card stores colors in 6-character hex format without the `#` prefix:
- `FF0000` = Red at full brightness
- `0F0000` = Red at ~6% brightness
- `00FF00` = Green at full brightness
- `00000F` = Blue at ~6% brightness

## Browser Compatibility

Works in all modern browsers that support:
- Custom Elements (Web Components)
- ES6 modules
- Canvas API

Tested on:
- Chrome/Edge 90+
- Firefox 85+
- Safari 14+

## Troubleshooting

### Card doesn't appear
- Make sure the resource is added to your Lovelace configuration
- Check the browser console for errors
- Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Entity not updating
- Verify the entity exists and is an `input_text` type
- Check Home Assistant logs for service call errors
- Make sure the entity's max length is at least 6 characters

### Colors look wrong
- The card uses standard hex RGB format
- Ensure your automation is parsing the hex correctly
- Remember: stored values don't include the `#` prefix

### Very dark colors show as black
This is expected! That's the whole point of this card. The color wheel shows the **hue** at full brightness, while the slider controls **brightness**. The preview box shows the actual dim color.

## Development

Built with:
- Vanilla JavaScript (ES6 modules)
- [iro.js](https://iro.js.org/) - HSV color picker library
- Home Assistant Custom Card API

## Credits

- Built for the Home Assistant community
- Uses [iro.js](https://iro.js.org/) by James Daniel
- Inspired by years of community requests for a color picker helper

## License

MIT License - feel free to use and modify!

## Changelog

### Version 2.0.0 (Latest)

**New Features:**
- ✨ **Compact mode**: Space-efficient layout perfect for multiple LEDs (default: true)
- 🔽 **Collapsible picker**: Cards start collapsed by default to save space
- 🎨 **Entity icon display**: Shows entity icon colored by hue at full brightness
- ⌨️ **Direct hex input**: Type hex codes directly to duplicate colors
- 🎛️ **Three-slider layout**: Separate sliders for hue, saturation, and value
- 🎯 **Smart icon coloring**: Grayscale colors (black/gray/white) keep their actual color

**Improvements:**
- Entity friendly names are now automatically displayed
- Sliders remain visible at all brightness levels
- Better mobile app support with reliable collapsed state
- Improved color conversion accuracy

**Breaking Changes:**
- Default layout changed to `compact: true` (was false)
- Default state changed to `default_collapsed: true` (was false)
- Removed `show_header` option (now uses compact row layout)

### Version 1.0.0

- Initial release
- Basic HSV color picker with separate brightness control
- Hex color output to input_text entities

## Support

If you find this card useful, please ⭐ star the repository!

For issues and feature requests, please use the GitHub issue tracker.
