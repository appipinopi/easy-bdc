# JSONBETAWIKI

## JSON規格
### json2code
```json
  "関数名": {
    "description": "説明",
    "category": "カテゴリー",
    "type": "block",
    "return": "戻り値",
    "placeholders": ["プレースホルダー名"],
    "template": "変換後のコード"
  }
```
### json2ui
```json
  "関数名": {
    "title": "表示名",
    "type": "statement",
    "statements": ["DO"],
    "statementLabels": { "DO": "文*1" },
    "previous": true,
    "next": true,
    "color": 30,*2
    "tooltip": "説明"
  }
```

### 注釈
*1 文は以下画像の実行する処理に当たります

![image](img/ss1.png)

*2 colorの値は色相値を用いています
