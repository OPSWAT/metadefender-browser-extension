import gulp from 'gulp';
import gulpif from 'gulp-if';
import livereload from 'gulp-livereload';
import args from './lib/args';

gulp.task('html', () => {
    return gulp.src(['app/html/**/*.html', 'app/scripts/**/*.html'], {base: 'app'})
        .pipe(gulp.dest(`dist/${args.vendor}/`))
        .pipe(gulpif(args.watch, livereload()));
});
