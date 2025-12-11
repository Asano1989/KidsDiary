const esbuild = require('esbuild');
const path = require('path');

// dotenvライブラリを使い、.envファイルを読み込む
require('dotenv').config({
  // 開発環境用の.envファイルを明示的に指定
  path: path.resolve(__dirname, '.env.development')
});

// コマンドライン引数から監視モードが指定されているか確認
const watch = process.argv.includes('--watch');

// ====================================================================
// 1. 環境変数の定義
// ====================================================================
const define = {};
for (const key in process.env) {
  // 重要なポイント: process.env.<KEY> を、その値の文字列に置き換える
  define[`process.env.${key}`] = JSON.stringify(process.env[key]);
}

// ====================================================================
// 2. esbuildの共通設定
// ====================================================================
const buildOptions = {
  entryPoints: ['app/javascript/application.js'],
  bundle: true,
  outfile: 'app/assets/builds/application.js',
  loader: { '.js': 'jsx', '.ts': 'tsx' },
  sourcemap: true,
  platform: 'browser',
  // 環境変数を注入
  define: define,
};


async function build() {
  if (watch) {
    // 監視モードの場合: contextを作成し、watch()を実行することでプロセスを常駐させる
    console.log("ESBUILD: Starting watch mode. Watching for changes...");
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    // ここで常駐するため、この関数は終了しない
  } else {
    // 通常ビルドモードの場合: ビルドを実行して終了
    console.log("ESBUILD: Running single build.");
    await esbuild.build(buildOptions);
    console.log("ESBUILD: Build finished successfully.");
  }
}

// ビルド処理を開始
build().catch((error) => {
  console.error("ESBUILD FAILED:", error);
  process.exit(1);
});