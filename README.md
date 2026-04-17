# MindBoard

macOS için şeffaf, her zaman üstte kalan bir beyaz tahta uygulaması. Ekranın üzerine yerleşerek not almak, diyagram çizmek ve beyin fırtınası yapmak için tasarlanmıştır.

## Özellikler

- **Şeffaf overlay modu** — Uygulama diğer pencerelerin üzerinde şeffaf olarak görünür; bir tuşa basılı tutarak veya toggle kısayoluyla aktif hale getirilir
- **Normal mod** — Standart pencere olarak da kullanılabilir
- **Birden fazla tahta** — Projeler veya konular için ayrı tahtalar oluşturup yönetin
- **Excalidraw tabanlı** — El yazısı görünümlü şekiller, metin ve serbest çizim
- **Özelleştirilebilir kısayollar** — Tüm kısayol tuşları uygulama içinden değiştirilebilir
- **Otomatik kayıt** — Tahtalar `~/.mindboard/` klasörüne otomatik olarak kaydedilir

## Varsayılan Kısayollar

| Kısayol | Eylem |
|---|---|
| `Ctrl + F1` | Overlay modunu basılı tutarak aktif et |
| `Ctrl + F2` | Pencereyi göster / gizle |

> Kısayollar ayarlar ekranından değiştirilebilir.

## Kurulum

### Gereksinimler

- macOS
- [Node.js](https://nodejs.org/) v18+

### Geliştirme ortamı

```bash
git clone https://github.com/kullanici-adi/mindboard.git
cd mindboard
npm install
npm start
```

### Dağıtım paketi oluşturma

```bash
npm run make
```

Çıktı `out/` klasörüne oluşturulur.

## Teknolojiler

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Excalidraw](https://excalidraw.com/)
- [Vite](https://vitejs.dev/)

## Lisans

MIT
