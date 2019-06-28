import gulp from 'gulp';
import gulpSequence from 'gulp-sequence';

gulp.task('build', gulpSequence(
    'clean',
    [
        'styles',
        'scripts',
        'html',
        'locales',
        'images',
        'fonts',
        'manifest',
        'chromereload'
    ]
));
