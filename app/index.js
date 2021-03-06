'use strict';

// 1) Setup Grunt (Copy package.json and Gruntfile.js to root folder)
// 2) Create Wordpress database
// 3) Download and unzip latest Wordpress version into root
// 4) Download and install a third party theme if specified and rename it. (Theme name taken from site name at prompt)
// 5) Rename TwentyFourteen theme if no third party theme is specified
// 6) Download Advanced Custom Fields and move to plugins folder if requested
// 7) Download Yoast SEO plugin and move to plugins folder if requested
// 8) Update wp-config with DB details and environment detection
// 9) Update theme name in stylesheet
// 10) Run Wordpress install script
// 11) Set current theme in Database

var util = require('util'),
    path = require('path'),
    yeoman = require('yeoman-generator'),
    shell = require('shelljs');


var DevpressGenerator = module.exports = function DevpressGenerator(args, options, config) {
    yeoman.generators.Base.apply(this, arguments);

    this.on('end', function () {
        this.installDependencies({ skipInstall: options['skip-install'] });
    });

    this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(DevpressGenerator, yeoman.generators.Base);

DevpressGenerator.prototype.askFor = function askFor() {
    var cb = this.async();

    // have Yeoman greet the user.
    console.log(this.yeoman);

    var prompts = [
        {
            type: 'input',
            name: 'siteTitle',
            message: 'Please enter the sites name/title'
        },
        {
            type: 'input',
            name: 'siteURL',
            message: 'The Site URL (e.g. 127.0.0.1/devpress or mylocalsite.co.uk)'
        },
        {
            type: 'input',
            name: 'adminUser',
            message: 'The wordpress admin username (Will be used to login to Wordpress)',
            default: 'admin'
        },
        {
            type: 'input',
            name: 'adminPassword',
            message: 'The wordpress admin password (Will be used to login to Wordpress)',
            default: 'access1234'
        },
        {
            type: 'input',
            name: 'adminEmail',
            message: 'The wordpress admin users email address'
        },
        {
            type: 'input',
            name: 'installDevpressTheme',
            message: 'To install a third party theme, enter it\'s download URL. (Leave blank to continue without). Not installing another theme will set your grunt file up using the twentyfourteen theme'
        },
        {
            when: function (response) {
                return response.installDevpressTheme;
            },
            type: 'input',
            name: 'themeName',
            message: 'Enter a name for your theme',
            default: ''
        },
        {
            type: 'confirm',
            name: 'installAcf',
            message: 'Would you like to install the Advanced Custom Fields plugin?'
        },
        {
            type: 'confirm',
            name: 'installYoast',
            message: 'Would you like to install the Yoast SEO plugin?'
        },
        {
            type: 'input',
            name: 'dbName',
            message: 'Database Name'
        },
        {
            type: 'input',
            name: 'dbUser',
            message: 'Database Username',
            default: 'root'
        },
        {
            type: 'input',
            name: 'dbPass',
            message: 'Database Password',
            default: 'root'
        }
    ];

    this.prompt(prompts, function (props) {
        this.siteTitle = props.siteTitle;
        this.siteURL = props.siteURL;
        this.adminUser = props.adminUser;
        this.adminPassword = props.adminPassword;
        this.adminEmail = props.adminEmail;
        this.installAcf = props.installAcf;
        this.installYoast = props.installYoast;


        this.installDevpressTheme = props.installDevpressTheme;
        this.dbName = props.dbName;
        this.dbUser = props.dbUser;
        this.dbPass = props.dbPass;
        this.themeName = props.themeName;

        if(!this.themeName){
            this.themeName = this.siteTitle.toLowerCase().replace(/ /g, '-');
        }

        cb();
    }.bind(this));
};

DevpressGenerator.prototype.gruntFiles = function gruntFiles() {
    this.copy('_package.json', 'package.json');
    this.copy('_bower.json', 'bower.json');
    this.copy('_Gruntfile.js', 'Gruntfile.js');
};

DevpressGenerator.prototype.LatestWordpress = function LatestWordpress() {
    var cb   = this.async();

    this.log.writeln('\n*************************************************\n** Downloading the latest Version of Wordpress **\n*************************************************');
    this.tarball('http://wordpress.org/latest.zip', './', cb);
};


DevpressGenerator.prototype.removeThemes= function removeThemes() {

    this.log.writeln('\n*******************************************\n** Deleting the default Wordpress themes **\n*******************************************');
    shell.rm('-rf', './wp-content/themes/*');

};

DevpressGenerator.prototype.DevpressTheme = function DevpressTheme() {

    if( this.installDevpressTheme ){
        var cb   = this.async();

        this.log.writeln('\n*********************************************************************\n** Downloading and installing your theme **\n********************************************************************');
        this.tarball(this.installDevpressTheme, 'wp-content/themes/' + this.themeName, cb);
    }else{
        var cb   = this.async();

        this.log.writeln('\n*********************************************************************\n** Downloading and installing your theme **\n********************************************************************');
        this.tarball('https://wordpress.org/themes/download/twentyfourteen.1.0.zip', 'wp-content/themes/' + this.themeName, cb);
    }

};

DevpressGenerator.prototype.acfWordpress = function acfWordpress() {

    if( this.installAcf ){
        var cb   = this.async();

        this.log.writeln('\n*****************************************************************************************************\n** Installing the latest Advanced Custom Fields **\n*****************************************************************************************************');
        this.tarball('https://github.com/elliotcondon/acf/archive/master.tar.gz', 'wp-content/plugins/advanced-custom-fields', cb);
    }
};

DevpressGenerator.prototype.yoastWordpress = function yoastWordpress() {

    if( this.installYoast){
        var cb   = this.async();

        this.log.writeln('\n*******************************************************************************************************************\n** Installing Yoast **\n*******************************************************************************************************************');
        this.tarball('https://github.com/Yoast/wordpress-seo/archive/master.tar.gz', 'wp-content/plugins/wordpress-seo', cb);
    }
};

DevpressGenerator.prototype.updateWpConfig = function updateWpConfig() {
    shell.rm('-rf', './wp-config.php');
    this.log.writeln('\n*********************************\n** Updating the wp-config file **\n*********************************');
    this.copy('wp-config.php.tmpl', 'wp-config.php');
};

//move css template and update theme name
DevpressGenerator.prototype.moveCss = function moveCss() {
    this.log.writeln('\n************************************\n** Adding theme name to style.css **\n************************************');
    shell.exec("sed -i -e 's/.*Theme Name.*/Theme Name: " + this.themeName + "/' ./wp-content/themes/" + this.themeName + "/style.css")
    shell.exec("rm -f -r ./wp-content/themes/" + this.themeName + "/style.css-e")
};

//Create database
DevpressGenerator.prototype.CreateDatabase = function CreateDatabase() {

    this.log.writeln('\n***********************\n** Creating database **\n***********************');
    shell.exec('mysql --user="' + this.dbUser + '" --password="' + this.dbPass + '" -e "create database ' + this.dbName + '"');
};

//Install Wordpress
DevpressGenerator.prototype.InstallWordpress = function InstallWordpress() {

    this.log.writeln('\n**************************\n** Installing Wordpress **\n**************************');
    shell.exec('curl -d "weblog_title=' + this.siteTitle + '&user_name=' + this.adminUser + '&admin_password=' + this.adminPassword + '&admin_password2=' + this.adminPassword + '&admin_email=' + this.adminEmail + '" http://' + this.siteURL + '/wp-admin/install.php?step=2')
};

//Update theme in database
DevpressGenerator.prototype.UpdateThemeInDb = function UpdateThemeInDb() {

    this.log.writeln('\n********************************\n** Updating Theme in Database **\n********************************');

    shell.exec('mysql --user="' + this.dbUser + '" --password="' + this.dbPass + '" -D ' + this.dbName + ' -e "UPDATE wp_options SET option_value = \'' + this.themeName + '\' WHERE option_name = \'template\'"');
    shell.exec('mysql --user="' + this.dbUser + '" --password="' + this.dbPass + '" -D ' + this.dbName + ' -e "UPDATE wp_options SET option_value = \'' + this.themeName + '\' WHERE option_name = \'stylesheet\'"');
    shell.exec('mysql --user="' + this.dbUser + '" --password="' + this.dbPass + '" -D ' + this.dbName + ' -e "UPDATE wp_options SET option_value = \'' + this.themeName + '\' WHERE option_name = \'current_theme\'"');

};