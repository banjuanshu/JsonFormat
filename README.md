![JSON Format](promo_1400*560.png)


# JSON Format - Easy & Powerful Viewer

[中文](./README_CN.md)

A lightweight, high-performance, and feature-rich JSON formatter extension for Chrome, fully compatible with Manifest V3.

This extension automatically detects raw JSON content in your browser and presents it in a beautifully formatted, collapsible tree view. It helps developers debug and view JSON data efficiently.

## Key Features

- **Auto-Formatting**: Automatically formats JSON responses into a readable tree structure.
- **Collapsible Trees**: Easily expand and collapse JSON objects and arrays. Click the `-`/`+` icons to toggle visibility.
- **Syntax Highlighting**: Color-coded output for keys, strings, numbers, booleans, and null values.
- **History Records**: Automatically saves your recent JSON views. Access them from the sidebar to revisit previous data.
- **Diff Comparison**: Compare the current JSON with any historical record side-by-side.
  - **Aligned View**: Keys are aligned for easy comparison.
  - **Color Coding**: Visual indicators for Added (Green), Removed (Red), and Changed (Yellow) fields.
  - **Synchronized Collapsing**: Collapsing a node in the comparison view keeps the structure aligned.
- **Clickable URLs**: Automatically detects URLs in strings and converts them into clickable links (opening in new tabs).
- **History Management**: 
  - View timestamps and source URLs for each record.
  - Resize the history panel by dragging.
  - Clear history with a single click.

## Installation

### From Chrome Web Store
[Download from Chrome Web Store](https://chromewebstore.google.com/detail/json-format/cacimhdphkcihjfpnpmmndgjjnnfoobm)

### Manual Installation (Developer Mode)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the project directory (`JsonFormat`).

## Usage

1. Open any URL that returns a raw JSON response (e.g., API endpoints).
2. The extension will automatically format the JSON.
3. Use the **Right Panel** to access history.
4. Click on a history item to enter **Diff Mode**.
5. Drag the border of the history panel to resize it.

## Build

To build the project for the Chrome Web Store (minifies JS/CSS and creates a ZIP):

```bash
npm install
node build.js
```

The output `JsonFormat.zip` will be generated in the project root.

## License

ISC