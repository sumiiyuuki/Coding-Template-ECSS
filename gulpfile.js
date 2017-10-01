var gulp         = require("gulp");
var browserify   = require("browserify");
var babelify     = require('babelify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var eslint       = require('gulp-eslint');
var sass         = require('gulp-sass');
var sourcemap    = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var nunjucks     = require('gulp-nunjucks');
var plumber      = require('gulp-plumber');
var gulpif       = require('gulp-if');
var runSequence  = require('run-sequence');
var rimraf       = require('rimraf');
var minimist     = require('minimist');
var webserver    = require('gulp-webserver');

var argv = minimist(process.argv.slice(2));
var RELEASE = !! argv.release;

var conf = {
  babel: {
    src: './src/babel/**/*.js',
    dist: './build/js/',
    entrypoint: './src/babel/index.js'
  },
  sass: {
    common: {
      src: './src/scss/**/*.scss',
      dest: './build/css',
      option: { indentedSyntax: false }
    },
    page: {
      src: './src/html/**/*.scss',
      dest: './build/css',
      option: {
        includePaths: [
          './src/scss/base'
        ],
        indentedSyntax: false
      }
    }
  },
  html: {
    src: [
      'src/html/**/*.html',
      '!src/html/**/_*.html'
    ],
    build: './build/**/*.html',
    watch: './src/html/**/*.html',
    dest: './build/'
  },
  img: {
    src: [
      'src/html/**/*.jpg',
      'src/html/**/*.gif',
      'src/html/**/*.png'
    ],
    dest: './build/images'
  },
  statics: {
    src: './src/static/**/*',
    dest: './build/'
  },
  server: {
    port: 3000
  }
}

//
// Babel(ECMAScript6) の文法チェック
// ========================================
gulp.task('babel-lint', function() {
  return gulp.src(conf['babel']['src'])
    .pipe(plumber())
    .pipe(eslint({useEslintrc: true}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

//
// Babel(ECMAScript6) をJSにコンパイル
// ========================================
gulp.task('babel-build', function() {
  browserify(conf['babel']['entrypoint'], { debug: true })
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .on("error", function (err) {
      console.log("Error : " + err.message);
    })
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemap.init({loadMaps: true}))
    .pipe(gulpif(! RELEASE, sourcemap.write('./')))
    .pipe(gulp.dest(conf['babel']['dist']))
});

//
// 共通SCSS のコンパイル
// ========================================
gulp.task('sass-common-build', function() {
  return gulp.src(conf['sass']['common']['src'])
    .pipe(sourcemap.init())
    .pipe(sass(conf['sass']['common']['option']).on('error', sass.logError))
    .pipe(gulpif(! RELEASE, sourcemap.write()))
    .pipe(autoprefixer({
      browsers: ['last 4 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(conf['sass']['common']['dest']))
});

//
// ページSCSS のコンパイル
// ========================================
gulp.task('sass-page-build', function() {
  return gulp.src(conf['sass']['page']['src'])
    .pipe(sourcemap.init())
    .pipe(sass(conf['sass']['page']['option']).on('error', sass.logError))
    .pipe(gulpif(! RELEASE, sourcemap.write()))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest(conf['sass']['page']['dest']))
});


//
// HTMLテンプレート(nunjucks) のコンパイル
// ========================================
gulp.task('html-build', function() {
  return gulp.src(conf['html']['src'])
    .pipe(plumber())
    .pipe(nunjucks.compile())
    // .pipe(nunjucks.compile({name: 'Sindre'}))
    .pipe(gulp.dest(conf['html']['dest']))
});


//
// HTMLテンプレート内の画像のコンパイル
// ========================================
gulp.task('img-build', function() {
  return gulp.src(conf['img']['src'])
    .pipe(plumber())
    .pipe(gulp.dest(conf['img']['dest']))
});


//
// 静的ファイルのコピー
// ========================================
gulp.task('static-copy', function() {
  return gulp.src(conf['statics']['src'])
    .pipe(gulp.dest(conf['statics']['dest']))
})


//
// ページjsファイルのコピー
// ========================================
gulp.task('js-copy', function() {
  return gulp.src(conf['js']['src'])
    .pipe(plumber())
    .pipe(gulp.dest(conf['js']['dist']))
})
// ページxmlファイルのコピー
// ========================================
gulp.task('xml-copy', function() {
  return gulp.src(conf['xml']['src'])
    .pipe(plumber())
    .pipe(gulp.dest(conf['xml']['dist']))
})
// ページmp4ファイルのコピー
// ========================================
gulp.task('movie-copy', function() {
  return gulp.src(conf['movie']['src'])
    .pipe(plumber())
    .pipe(gulp.dest(conf['movie']['dist']))
})
// ページpdfファイルのコピー
// ========================================
gulp.task('pdf-copy', function() {
  return gulp.src(conf['pdf']['src'])
    .pipe(plumber())
    .pipe(gulp.dest(conf['pdf']['dist']))
})
// ページdocファイルのコピー
// ========================================
gulp.task('doc-copy', function() {
  return gulp.src(conf['doc']['src'])
    .pipe(plumber())
    .pipe(gulp.dest(conf['doc']['dist']))
})


//
// 全ビルド & コピータスクの実行
// ========================================
gulp.task('build', function() {
  return runSequence(
    [
      'babel-build',
      'sass-common-build',
      'sass-page-build',
      'html-build',
      'img-build',
      'static-copy',
    ]
  );
});


//
// ファイルが更新されたらビルドを実行
// ========================================
gulp.task('watch', ['build'], function(callback) {
  gulp.watch(conf['babel']['src'], ['babel-build']);
  gulp.watch(conf['sass']['common']['src'], ['sass-common-build']);
  gulp.watch(conf['sass']['page']['src'], ['sass-page-build']);
  gulp.watch(conf['html']['watch'], ['html-build']);
  gulp.watch(conf['img']['watch'], ['img-build']);
  gulp.watch(conf['statics']['src'], ['static-copy']);
});


//
// コンパイル済みファイルの削除
// ========================================
gulp.task('clean', function(callback) {
  rimraf('./build', callback);
});


//
// プレビューサーバーの起動
// ========================================
gulp.task('serve', ['build'], function() {
  gulp.src('./build')
    .pipe(webserver({
      host: '0.0.0.0',
      livereload: true,
      port: conf['server']['port']
    }));
});


gulp.task('default', ['serve', 'watch']);
