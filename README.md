# WEBAPPS
作成した Web アプリケーションを紹介できるポートフォリオサービスです。

## ローカルでの動作確認
Amazon S3 バケットの作成と GitHub 認証のアプリの登録、以下の環境変数の設定が必要です。

```bash
export GITHUB_CLIENT_ID=xxxxxxxxxxxxxxx
export GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxx
export SESSION_SECRET=xxxxxxxxxxxxxxx
export AWS_REGION=xxxxxxxxxxxxxxx
export AWS_BUCKET_NAME=xxxxxxxxxxxxxxx
export AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxx
export AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxx
```

実行
```bash
yarn start
```