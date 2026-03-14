const fs = require('fs');
const path = require('path');

const artworksDir = path.join(__dirname, 'artworks');
const outputFile = path.join(__dirname, 'data.json');

// 定義基礎架構與分類資訊
const manifest = {
  version: "2.8.0-Auto",
  metadata: {
    categories: [
      { id: "li", folder: "line-art", label: "Line Art" },
      { id: "in", folder: "ink-art", label: "Ink Art" },
      { id: "ch", "folder": "characters", label: "Characters" },
      { id: "an", folder: "anime", label: "Anime" },
      { id: "am", folder: "animals", label: "Animals" }
    ],
    placements: {
      "front": { label: "Front Print", recommendedUse: "Front center T-shirt print", suggestedWidth: "32–38 cm" },
      "back": { label: "Back Print", recommendedUse: "Full back garment print", suggestedWidth: "35–40 cm" },
      "left-chest": { label: "Left Chest", recommendedUse: "Left chest subtle print", suggestedWidth: "8–10 cm" }
    }
  },
  artworks: []
};

// 自動掃描資料夾邏輯
if (fs.existsSync(artworksDir)) {
    const categories = fs.readdirSync(artworksDir);
    categories.forEach(categoryFolder => {
        const categoryPath = path.join(artworksDir, categoryFolder);
        if (fs.statSync(categoryPath).isDirectory()) {
            
            // 找出對應的分類 ID
            const catMeta = manifest.metadata.categories.find(c => c.folder === categoryFolder);
            if (!catMeta) return; // 如果是不認識的資料夾就跳過

            const placements = fs.readdirSync(categoryPath);
            placements.forEach(placementFolder => {
                const placementPath = path.join(categoryPath, placementFolder);
                if (fs.statSync(placementPath).isDirectory()) {
                    
                    const files = fs.readdirSync(placementPath);
                    files.forEach(file => {
                        // 只抓取圖檔
                        if (file.match(/\.(png|jpg|jpeg)$/i)) {
                            manifest.artworks.push({
                                id: `${catMeta.id.toUpperCase()}-${placementFolder.toUpperCase()}-${manifest.artworks.length + 1}`,
                                filename: file,
                                category: catMeta.id,
                                placement: placementFolder
                            });
                        }
                    });
                }
            });
        }
    });
}

// 產生 data.json
fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));
console.log('✅ 自動掃描完成！共發現 ' + manifest.artworks.length + ' 張圖檔。');