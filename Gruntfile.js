
var tmp = require('tmp');
module.exports = function(grunt) {
    grunt.initConfig({
        // connect: {
        //     options: {
        //         port: 8000,
        //         hostname: 'localhost'
        //     },
            // runtime: {
            //     options: {
            //         middleware: function (connect) {
            //             return [
            //                 lrSnippet,
            //                 mountFolder(connect, 'instrumented'),
            //                 mountFolder(connect, '.......')
            //             ];
            //         }
            //     }
            // }

        // Before generating any new files, remove any previously-created files.
        // },
        clean: {
          options: {
            force:true
          },
          tests: ['tmp', 'build', 'instrumented', 'coverage', 'reports'],
        },
        connect: {
          server: {
            options: {
              port: 3000,
              base: 'instrumented/seed/static/seed/js'
            }
          },
        },
        instrument: {
            files: 'seed/static/seed/js/**/*.js',
            options: {
            lazy: true,
                basePath: "instrumented"
            }
        },
        copy: {
          'instrument': {
            files: [{
              src: ['seed/static/seed/js/**/*', '!seed/static/seed/js/**/*.js'],
              dest: 'instrumented/'
            }]
          },
        },
        protractor_coverage: {
            options: {
                keepAlive: true,
                noColor: false,
                coverageDir: 'coverage',
                args: {
                    baseUrl: 'http://localhost:8000'
                }
            },
            local: {
                options: {
                    configFile: 'seed/static/seed/tests/protractor-tests/protractorConfigCoverage.js'
                }
            },
            travis: {
                options: {
                    configFile: 'seed/static/seed/tests/protractor-tests/protractorConfigCoverage.js'
                }
            }
        },
        makeReport: {
            src: 'seed/static/seed/tests/protractor-tests/*.json',
            options: {
                type: 'lcov',
                dir: 'reports',
                print: 'detail'
            }
        },
        coveralls: {
            main:{
                src: 'reports/**/*.info',
                options: {
                    force: true
                },
            },
        },
    });

    // Actually load this plugin's task(s).
    // grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-protractor-coverage');
    // grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    // grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-coveralls');
    grunt.loadNpmTasks('grunt-selenium-webdriver');


    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('coverage', ['clean', 'copy', 'instrument', 'connect:server', 'selenium_start', 'protractor_coverage:local', 'selenium_stop', 'makeReport', 'coveralls']);

    grunt.registerTask('default', ['coverage']);
};
