// .env ファイルの環境変数をNode.jsのプロセスにロード
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.YOUR_SUPABASE_ANON_KEY;

const options = {
  entryPoints: ['app/javascript/application.js'],
  bundle: true,
  sourcemap: true,
  outdir: 'app/assets/builds',
  
  loader: {
    '.js': 'jsx',
    '.ts': 'tsx',
  },
  external: [], 

  define: {
    'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl || ''),
    'process.env.YOUR_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey || ''),
    
    'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(''),
    'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(''),
    
    'process.env': JSON.stringify({}),
  },
};

require('esbuild').context(options)
  .then(context => {
    console.log("esbuild watching for changes...");
    return context.watch();
  })
  .catch((e) => {
    console.error("esbuild watch failed:", e);
  });