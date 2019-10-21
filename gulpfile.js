var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var sass = require('gulp-sass');
var purify = require('gulp-purifycss');
let cleanCSS = require('gulp-clean-css');
var responsive = require('gulp-responsive');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var del = require('del');

var paths = {
  styles: {
    src: '_sass/main.scss',
    tmp: 'assets/css/dist',
    dest: '_includes'
  },
  images: {
    src: 'assets/img',
    dest: 'assets/img'
  }
};

function thumbnails() {
  return gulp.src(`${paths.images.src}/**/{main.png,main.jpg}`)
    .pipe(responsive({
      // Resize all images to 100 pixels wide and add suffix -thumbnail
      '*/main.{jpg,jpeg}': {
        width: 300,
        height: 200,
        format: 'jpg',
        rename: { suffix: '-crop'},
      },
      '*/main.png': {
        width: 300,
        height: 200,
        format: 'png',
        rename: { suffix: '-crop'},
      },
    }, {
      // Global configuration for all images
      // The output quality for JPEG, WebP and TIFF output formats
      quality: 70,
      // Use progressive (interlace) scan for JPEG and PNG output
      progressive: true,
      // Zlib compression level of PNG output format
      compressionLevel: 6,
      // Strip all metadata
      withMetadata: false,
      crop: 'entropy'
    }))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ], {verbose: true}))
    .pipe(gulp.dest(paths.images.dest));
}


function images() {
  return gulp.src(`${paths.images.src}/**/{*.png,*.jpg,*.jpeg,*.gif}`)
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ], {verbose: true}))
    .pipe(gulp.dest(paths.images.dest))
}
 
function clean() {
  return del([ paths.styles.tmp ]);
}
 
function purification() {
  return gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(purify(['./_includes/**.html', './_layouts/**.html', './_pages/**.html', './blog/**.html'], {info: true}))
    .pipe(replace(/!important/gm, ''))
    .pipe(gulp.dest(paths.styles.tmp));
}

function concatenation() {
  return gulp.src([`${paths.styles.tmp}/main.css`, 'assets/css/github.css'])
    .pipe(concat('main.css'))
    .pipe(cleanCSS({compatibility: 'ie8'}, (details) => {
      console.log(`Minification of ${details.name}: ${details.stats.originalSize} -> ${details.stats.minifiedSize} b`);
    }))
    .pipe(rename({ suffix: '-min' }))
    .pipe(gulp.dest('./_includes/'));
}
 
var build = gulp.series(clean, purification, concatenation, clean);

function watch() {
  gulp.watch(["_pages/**", "_layouts/**", "_includes/**.html", "blog/*", "_sass/*"], build);
}
 
exports.images = images;
exports.thumbnails = thumbnails;
exports.clean = clean;
exports.purification = purification;
exports.concatenation = concatenation;
exports.build = build;
exports.watch = watch;
/*
 * Define default task that can be called by just running `gulp` from cli
 */
exports.default = build;
