// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
'use strict';

var fileUtils = require('file-utils'); //文件处理工具
var urlparse = require('url');
var path = require('path');
var os = require('os');

function wrapReq(req){
      var url = urlparse.parse(req.url , true);
      req.pathname = url.pathname;
      req.params = url.query;
      req.href = url.href;
      return req;
}


function filterDeviceTag(root , options) {

    if (!root) throw new Error('static() root path required');

    return function(req , res , next){

        if ('GET' != req.method && 'HEAD' != req.method) return next();
        var _req = wrapReq(req);
        var filepath = _req.pathname;
        var param = _req.params;
        var device = "pc";
        if(param){
            if(param['device']){
                device = param['device'];
            }
        }
        var end = filepath.substr(filepath.length-1);
        if(end == '/'){
            filepath += "index.html";
        }
        filepath = (root+filepath).replace(/\\/g , "/");
        if(path.extname(filepath) != '.html' && path.extname(filepath) != '.htm'){
             //如果不是html则不需要c
             return next();
        }
        var content = fileUtils.read(filepath);
        var regbuild = function(){
            return /(<!--\s*build:\s*([^\s]*)\s*([^\s]*)\s*(lib)*\s*(?:device:\s*([^\s]*))*\s*-->((\n|\r|.)*?)<!--\s*endbuild\s*-->)/ig;
        }
        var blockMatchs = content.match(regbuild()) || [];
        blockMatchs.forEach(function(block){
            var arr = regbuild().exec(block);
            var blockDevice = arr[5];
            var blockInnerContent =  arr[1]
            if(blockDevice && blockDevice!=device){
                content = content.replace(blockInnerContent , "");
            }
        })

        res.write(content);
        res.end();
    }
}


var getRoot = function () {
    var platform = os.platform();
    var root;
    if (platform === 'win32') {
        root = path.parse(process.cwd()).root;
    } else {
        root = os.homedir();
    }
    return root;
};

var isModuleInstall = function () {
    
};

var loadTasks = function (grunt) {
    var tasks = ['grunt-contrib-copy',
                 'grunt-contrib-concat',
                 'grunt-contrib-jshint',
                 'grunt-contrib-connect',
                 'grunt-contrib-clean',
                 'grunt-contrib-watch',
                 'grunt-concurrent',
                 'grunt-replacecdn',
                 'grunt-ifbuild',
                 'grunt-resfetch',
                 'grunt-tpltools'];
    var root = getRoot();
    for (var task of tasks) {
        grunt.loadTasks(path.resolve(root, 'node_modules', task, 'tasks'));
    }
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    // require('load-grunt-tasks')(grunt);
    loadTasks(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        pkg : grunt.file.readJSON('package.json'),
        // Project settings
        appconf: {
            // Configurable paths
            app: 'app',
            dist: 'dist'
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: ['<%= appconf.app %>/scripts/{,*/}*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            template: {
                files: '<%=tpltojs.src%>',
                tasks: ['tpltojs'],
                options: {
                    spawn: false
                }
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= appconf.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= appconf.app %>/images/{,*/}*.{gif,jpeg,jpg,png,svg,webp}'
                ]
            }
        },


        tpltojs: {
            src: 'app/tpls/*.html',
            options: {
                moduleName : 'dev',
                outfile : 'app/scripts/dev_template.js',
                base : 'app/tpls/'
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost',
                // hostname: '172.30.157.122',
                middleware: function (connect, options) {
                    var middlewares = [];
                    //相关设备tag内容过滤
                    middlewares.push((function(){
                        var  fdt = filterDeviceTag((process.cwd()+"/app").replace(/\\/g , "/") , {});
                        return fdt;
                    })());
                    if (!Array.isArray(options.base)) {
                      options.base = [options.base];
                    }
                    var directory = options.directory || options.base[options.base.length - 1];
                    options.base.forEach(function(base) {
                      // Serve static files.
                      middlewares.push(connect.static(base));
                    });
                    // Make directory browse-able.
                    middlewares.push(connect.directory(directory));
                    return middlewares;
                }
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '.tmp',
                        '<%= appconf.app %>'
                    ]
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= appconf.dist %>',
                    livereload: false
                }
            }
        },
        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '<%= resfetch.options.distPath %>',
                        '<%= appconf.dist %>/*',
                        '!<%= appconf.dist %>/.git*'
                    ]
                }]
            },
            fetchTemp :{
                files: [{
                    dot: true,
                    src: [
                        '<%= resfetch.options.distPath %>'
                    ]
                }]
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= appconf.app %>/scripts/{,*/}*.js',
                '!<%= appconf.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },


        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= resfetch.options.distPath %>',
                    dest: '<%= appconf.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        'images/{,*/}*.*',
                        'styles/{,*/}*.*',
                        'scripts/{,*/}*.*'
                    ]
                }]
            }
        },

        replacecdn :{
            options:{
                cdnpath:'http://y0.ifengimg.com/fe/<%=pkg.name%>/',
                rootpath : '<%= appconf.dist %>'
            },
            files:['<%= appconf.dist %>/{,*/}*.{html,htm,css}']
        },

        resfetch :{
            options:{
                distPath:'fetchtemp'
            },
            files:['<%= appconf.app %>/*.html']
        },
        ifbuild :{
            options:{
                destPath:"<%= appconf.dist %>",
                appDir:'<%= resfetch.options.distPath %>'
            },
            files:['<%= resfetch.options.distPath %>/*.html']
        },

        ifbuildDebug :{
            options:{
                destPath:"<%= appconf.dist %>",
                appDir:'<%= appconf.app %>'
            },
            files:['<%= appconf.app %>/*.html']
        },
        uploadcdn :{
            options :{
                basePath : "<%= appconf.dist %>",
                appname : "<%=pkg.name%>"
            },
            files:[
                   '<%= appconf.dist %>/scripts/{,*/}*.*',
                   '<%= appconf.dist %>/images/{,*/}*.*',
                   '<%= appconf.dist %>/styles/{,*/}*.*'
                   ]
        }
    });


    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('server', function () {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve']);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'tpltojs',
        'resfetch',
        'copy:dist',
        'ifbuild',
        'ifbuildDebug',
        'clean:fetchTemp'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
