# WEBAPPS
作成した Web アプリケーションを紹介できるポートフォリオサービスです。

## 管理者機能
![管理者](https://user-images.githubusercontent.com/96284126/156023985-beebb03b-ab2a-47e3-bb50-a0c0b204b3a2.png)
管理者（管理者バッジが付いているユーザー）は次のことができます。
- ユーザーのアプリの紹介を削除できる
- ユーザーのコメントを削除できる

### 管理者権限の付与
`users` の `isAdmin` を `TRUE` に設定してください。
```sql
UPDATE users SET "isAdmin"=TRUE WHERE "userId"=1;
```

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
