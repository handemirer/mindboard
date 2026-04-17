# MindBoard

**[English](#english) | [Türkçe](#türkçe)**

---

## English

A transparent, always-on-top whiteboard for macOS. Sits over your other windows so you can sketch, annotate, and brainstorm without switching apps.

### Features

- **Transparent overlay mode** — Floats above all windows; activate by holding a key or toggling with a shortcut
- **Normal mode** — Use as a standard window when needed
- **Multiple boards** — Create and switch between separate boards for different projects or topics
- **Excalidraw-powered** — Hand-drawn style shapes, text, and freehand drawing
- **Customizable shortcuts** — All keybindings can be changed from within the app
- **Auto-save** — Boards are saved automatically to `~/.mindboard/`

### Default Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + F1` | Hold to activate overlay mode |
| `Ctrl + F2` | Toggle window visibility |

> All shortcuts can be changed in the settings panel.

### Installation

**Requirements:** macOS, [Node.js](https://nodejs.org/) v18+

```bash
git clone https://github.com/handemirer/mindboard.git
cd mindboard
npm install
npm start
```

**Build a distributable:**

```bash
npm run make
```

Output is placed in the `out/` folder.

### Tech Stack

[Electron](https://www.electronjs.org/) · [React](https://react.dev/) · [Excalidraw](https://excalidraw.com/) · [Vite](https://vitejs.dev/)

### License

MIT

---

## Türkçe

macOS için şeffaf, her zaman üstte kalan bir beyaz tahta uygulaması. Diğer pencerelerin üzerinde çalışarak uygulama değiştirmeden not alın, çizim yapın ve beyin fırtınası yürütün.

### Özellikler

- **Şeffaf overlay modu** — Tüm pencerelerin üzerinde görünür; tuşa basılı tutarak veya kısayolla aktif edilir
- **Normal mod** — Gerektiğinde standart pencere olarak kullanılabilir
- **Birden fazla tahta** — Farklı projeler için ayrı tahtalar oluşturun ve aralarında geçiş yapın
- **Excalidraw tabanlı** — El yazısı görünümlü şekiller, metin ve serbest çizim
- **Özelleştirilebilir kısayollar** — Tüm kısayol tuşları uygulama içinden değiştirilebilir
- **Otomatik kayıt** — Tahtalar `~/.mindboard/` klasörüne otomatik olarak kaydedilir

### Varsayılan Kısayollar

| Kısayol | Eylem |
|---|---|
| `Ctrl + F1` | Basılı tutarak overlay modunu aktif et |
| `Ctrl + F2` | Pencereyi göster / gizle |

> Tüm kısayollar ayarlar panelinden değiştirilebilir.

### Kurulum

**Gereksinimler:** macOS, [Node.js](https://nodejs.org/) v18+

```bash
git clone https://github.com/handemirer/mindboard.git
cd mindboard
npm install
npm start
```

**Dağıtım paketi oluşturma:**

```bash
npm run make
```

Çıktı `out/` klasörüne oluşturulur.

### Lisans

MIT
