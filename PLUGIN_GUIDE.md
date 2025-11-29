# EDBP プラグイン開発ガイド

Easy Discord Bot Builder (EDBB) のプラグインシステム (EDBP) を使用して、カスタムプラグインを作成する方法を説明します。

## 📦 プラグインの構造

プラグインはZIPファイルとして配布されます。以下の構造が必要です：

```
my-plugin.zip
├── plugin.json    # プラグインのマニフェスト（必須）
├── main.js        # メインのプラグインコード（必須）
└── (その他のファイル)  # オプション
```

## 📄 plugin.json の形式

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "プラグインの説明",
  "main": "main.js",
  "official": false
}
```

**重要**: JSONの構文に注意してください
- すべての文字列は二重引用符（`"`）で囲む必要があります
- 文字列内に改行を含める場合は `\n` としてエスケープしてください
- 最後のプロパティの後にカンマ（`,`）を付けないでください
- すべての括弧が正しく閉じられているか確認してください

**正しい例:**
```json
{
  "description": "これは説明です"
}
```

**間違った例:**
```json
{
  "description": "これは説明です,  // ← 閉じ引用符がない
  "description": "1行目
2行目"  // ← 改行がエスケープされていない
}
```

**改行を含む説明の正しい書き方:**
```json
{
  "description": "1行目\n2行目"
}
```

### フィールド説明

- `id`: プラグインの一意なID（英数字、ハイフン、アンダースコアのみ）
- `name`: プラグインの表示名
- `version`: バージョン番号（セマンティックバージョニング推奨）
- `author`: 作者名
- `description`: プラグインの説明
- `main`: メインのJavaScriptファイル名（通常は`main.js`）
- `official`: 公式プラグインかどうか（`true`/`false`）

## 🚀 プラグインAPI

プラグインの`main.js`では、`api`オブジェクトを通じてEDBBの機能にアクセスできます。

### スタイルの変更

```javascript
// CSSを追加してUIをカスタマイズ
api.addStyle(`
  .my-custom-class {
    color: #9333ea;
    font-weight: bold;
  }
`);
```

### ブロックの追加

```javascript
// 新しいブロックを定義
api.registerBlock('my_custom_block', {
  init: function() {
    this.appendDummyInput()
      .appendField('カスタムブロック');
    this.setColour('#9333ea');
    this.setTooltip('これはカスタムブロックです');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  }
}, function(block) {
  // Pythonコード生成
  return 'print("Hello from custom block!")\n';
});
```

### カテゴリーの追加

```javascript
// 新しいカテゴリーを追加
api.addCategory('カスタムカテゴリー', '#9333ea', [
  'my_custom_block',
  'another_block'
]);
```

### 言語の追加

```javascript
// 翻訳を追加
api.addTranslation('ja', {
  'MY_CUSTOM_BLOCK': 'カスタムブロック'
});
```

### カスタム機能の実行

```javascript
// 任意のコードを実行
api.execute(`
  // Blocklyやworkspaceに直接アクセス
  console.log('Plugin loaded!');
  Blockly.Msg['MY_MESSAGE'] = 'カスタムメッセージ';
`);
```

## 📝 プラグインの例

### 例1: シンプルなスタイル変更プラグイン

**plugin.json:**
```json
{
  "id": "dark-theme-enhancer",
  "name": "Dark Theme Enhancer",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "ダークテーマをさらに見やすくします",
  "main": "main.js"
}
```

**main.js:**
```javascript
api.addStyle(`
  .blocklyToolboxDiv {
    background-color: #000000 !important;
  }
`);
```

### 例2: カスタムブロック追加プラグイン

**plugin.json:**
```json
{
  "id": "math-extensions",
  "name": "Math Extensions",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "数学関数の拡張ブロック",
  "main": "main.js"
}
```

**main.js:**
```javascript
// 平方根ブロックを追加
api.registerBlock('math_sqrt', {
  init: function() {
    this.appendValueInput('NUM')
      .setCheck('Number')
      .appendField('√');
    this.setOutput(true, 'Number');
    this.setColour('#5b80a5');
    this.setTooltip('平方根を計算します');
  }
}, function(block) {
  const num = Blockly.Python.valueToCode(block, 'NUM', Blockly.Python.ORDER_NONE) || '0';
  return [`math.sqrt(${num})`, Blockly.Python.ORDER_FUNCTION_CALL];
});

// カテゴリーに追加
api.addCategory('数学拡張', '#5b80a5', ['math_sqrt']);
```

## 📦 プラグインのパッケージング

1. プラグインのファイルを準備します
   - `plugin.json`
   - `main.js`（その他のファイルも可）

2. すべてのファイルをZIP形式で圧縮します
   ```bash
   zip -r my-plugin.zip plugin.json main.js
   ```

3. ZIPファイルを配布します

## 🔒 セキュリティについて

### 公式プラグイン
- EDBP/EDBP-APIリポジトリから取得されるプラグインは自動的に「公式」としてマークされます
- 公式プラグインは安全性が確認されています

### 非公式プラグイン
- 手動でインストールするプラグインは「非公式」としてマークされます
- インストール前にプラグインの内容を確認してください
- 信頼できるソースからのみプラグインをインストールしてください

## 🛠️ プラグインのテスト

1. プラグインをZIPファイルとして作成
2. EDBBエディタで「EDBP」ボタンをクリック
3. 「DL」タブでZIPファイルを選択してインストール
4. 「List」タブでプラグインを読み込む
5. 動作を確認

## 📚 利用可能なAPI

### `api.addStyle(css)`
CSSスタイルを追加します。

### `api.registerBlock(blockType, blockDef, codeGenerator)`
新しいブロックを登録します。
- `blockType`: ブロックのタイプ名（一意である必要があります）
- `blockDef`: ブロック定義オブジェクト（`init`関数を含む）
- `codeGenerator`: Pythonコード生成関数（オプション）

### `api.addCategory(name, colour, blocks)`
新しいカテゴリーをツールボックスに追加します。
- `name`: カテゴリー名
- `colour`: カテゴリーの色（16進数またはBlocklyの色番号）
- `blocks`: ブロックタイプの配列

### `api.addTranslation(locale, translations)`
翻訳を追加します。
- `locale`: ロケールコード（例: 'ja', 'en'）
- `translations`: 翻訳オブジェクト

### `api.getPluginInfo()`
現在のプラグイン情報を取得します。

### `api.execute(code)`
任意のJavaScriptコードを実行します（高度な機能）。

## 🎯 ベストプラクティス

1. **一意なIDを使用**: プラグインIDは他のプラグインと重複しないようにしてください
2. **バージョン管理**: セマンティックバージョニングを使用してください
3. **エラーハンドリング**: プラグインコードでエラーが発生しないように注意してください
4. **ドキュメント**: プラグインの機能を明確に説明してください
5. **テスト**: インストール前に十分にテストしてください

## ❓ トラブルシューティング

### プラグインが読み込まれない
- `plugin.json`の形式が正しいか確認
- `main.js`が存在するか確認
- ブラウザのコンソールでエラーを確認

### ブロックが表示されない
- ブロックが正しく登録されているか確認
- カテゴリーに追加されているか確認
- ワークスペースをリロードしてみる

### スタイルが適用されない
- CSSセレクタが正しいか確認
- より具体的なセレクタを使用する
- `!important`を使用する

## 📞 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。

---

Happy Plugin Development! 🎉
