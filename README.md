# Color Picker Card for Home Assistant

A custom Lovelace card that provides an intuitive color picker with **separate hue/saturation and brightness controls**. Perfect for controlling RGB LEDs with very dim colors that would appear black on traditional color pickers.

![Color Picker Card](https://via.placeholder.com/600x400?text=Color+Picker+Card+Screenshot)

## Features

- 🎨 **HSV-based color picker** - Color wheel shows hue/saturation at full brightness
- 💡 **Separate brightness slider** - Control brightness independently (0-100%)
- 🔍 **Visual preview** - See the actual color including dim values like `#0F0000`
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
show_header: true
```

## Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `entity` | string | **Yes** | - | The `input_text` or text helper entity to control |
| `name` | string | No | "Color Picker" | Name displayed in the card header |
| `icon` | string | No | - | Icon to display in the card header (e.g., `mdi:led-strip`) |
| `show_header` | boolean | No | `true` | Whether to show the card header |

## Usage Examples

### RGB LED Strip Control

```yaml
type: custom:color-picker-card
entity: input_text.rgb_strip_color
name: RGB LED Strip
icon: mdi:led-strip-variant
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

1. **User selects color** - Choose hue/saturation on the color wheel
2. **User adjusts brightness** - Use the slider to set brightness (0-100%)
3. **Card calculates hex** - Converts HSV to hex format (e.g., `#0F0000`)
4. **Updates entity** - Calls `input_text.set_value` service
5. **Automation triggered** - Your automation uses the hex value

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

## Support

If you find this card useful, please ⭐ star the repository!

For issues and feature requests, please use the GitHub issue tracker.
