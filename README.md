# Record Time Log to Notion

Raycast拡張機能を使用して、時間管理をNotionデータベースで行うためのツールです。

## 機能

### 1. 時間記録（Record to Notion）
- タスクのタイトル、開始時間、作業時間を記録
- カテゴリ分類（Work/Personal）
- 効率性評価（A～E）
- テンション評価
- 時間分類（浪費、徒労時間など）
- 振り返りメモ
- 連続記録モード

### 2. タイマー機能
- カスタムタイマーの設定
- メニューバーでの残り時間表示
- タイマー終了時の通知
- 5分/15分の休憩タイマー

### 3. 記録の更新（Update to Notion）
- 既存の記録の編集
- 現在時刻での更新
- 連続更新モード

### 4. 日次記録の取得（Get Daily Records）
- 指定日の記録を一括取得
- Work/Personal別のグループ化
- クリップボードへのコピー

## セットアップ

1. Notionインテグレーションの設定
   - Notionで新しいインテグレーションを作成
   - インテグレーショントークンを取得

2. Notionデータベースの準備
   - 以下のプロパティを含むデータベースを作成：
     - タイトル
     - 時間（日時）
     - 振り返り（テキスト）
     - 効率性（セレクト）
     - 時間分類（セレクト）
     - 活動カテゴリ（セレクト）
     - 予定作業時間（数値）
     - テンション（セレクト）

3. Raycast設定
   - Notion API Token
   - Database ID
   - 各プロパティ名の設定

## コマンド

- `Record to Notion`: 新しい時間記録を作成
- `Set Custom Timer`: カスタムタイマーを設定
- `Update to Notion`: 既存の記録を更新
- `Check Task Timer`: タイマーの残り時間を確認（メニューバー）
- `Check Recording`: 記録状態を確認（バックグラウンド）
- `Get Daily Records`: 日次記録を取得

## 開発

```bash
# 依存関係のインストール
npm install

# 開発モード
npm run dev

# ビルド
npm run build

# リント
npm run lint
```

## ライセンス

MIT
