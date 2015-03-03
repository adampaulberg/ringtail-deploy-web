(function() {
  var rolesData;

  angular
    .module('app.environments.taskdefs.ringtail')
    .service('RingtailConfig', RingtailConfig);

  RingtailConfig.$inject = ['_'];

  function RingtailConfig(_) {
    var instanceData = rolesData;

    return {
      configsForRole: configsForRole,
      updateRolesData: updateRolesData
    };

    function updateRolesData(rolesData) {
      instanceData = rolesData;
    }

    function configsForRole(role) {
      var results = [];
      instanceData.forEach(function(data) {
        if(_.contains(data.roles, role)) {
          results = results.concat(data.configs);
        }
      });
      return results;
    }

  }

  /* jshint es5:false    */
  /* jshint ignore:start */
  rolesData = [
    { 
      "roles": ["SKYTAP-WEB", "WEB", "WEBAGENT"], 
      "configs": [
        "Ringtail8|IS_SQLSERVER_SERVER",
        "Ringtail8|IS_SQLSERVER_USERNAME",
        "Ringtail8|IS_SQLSERVER_PASSWORD",
        "Ringtail8|IS_SQLSERVER_DATABASE",
        "Ringtail8|RINGTAILIISWEBAPPLICATIONNAME",
        "Ringtail8|RINGTAILWEBAPPNAME",
        "Ringtail8|RINGTAILIISVIRTUALDIRECTORYPHYSICALPATH",
        "Ringtail8|RINGTAILIISWEBAPPLICATIONURL",
        "Ringtail8|RINGTAILUISTATICCONTENTURL",
        "Ringtail8|RINGTAILHELPURL",
        "Ringtail8|RINGTAILSTSURL",
        "Ringtail8|RINGTAILSTSCERTIFICATETHUMBPRINT",
        "Ringtail8|SSLUSAGEPROPERTY",
        "Ringtail8|RINGTAILSTSCERTIFICATENAME",
        "Ringtail8|RINGTAILSTSCERTIFICATEISSUERNAME",
        "Ringtail8|RINGTAILSTSIISVIRTUALDIRECTORYPHYSICALPATH",
        "Ringtail8|RINGTAILUIIISVIRTUALDIRECTORYPHYSICALPATH",
        "Ringtail8|IISAUTHENTICATIONMETHOD",
        "Ringtail8|SELFSERVICEAUTHENTICATIONMODE",
        "Ringtail8|RINGTAILSTSIISAPPLICATIONNAME",
        "Ringtail8|RINGTAILUIIISAPPLICATONNAME",
        "Ringtail8|WEBBROWSERPROTOCOL",
        "Ringtail8|WEBSERVERSSLUSAGE",
        "Ringtail8|RMCIISWEBAPPLICATIONNAME",
        "Ringtail8|RMCAPPNAME",
        "Ringtail8|RMCIISVIRTUALDIRECTORYPHYSICALPATH",
        "Ringtail8|RMCIISWEBAPPLICATIONURL",
        "Ringtail8|RINGTAILCLASSICURL",
        "Ringtail8|RLMIISWEBAPPLICATIONNAME",
        "Ringtail8|RLMIISVIRTUALDIRECTORYPHYSICALPATH",
        "Ringtail8|RINGTAILCLASSICWEBSITENAME",
        "Ringtail8|RINGTAILCLASSICWEBSITEMAPPING"
      ]
    },
    {
      "roles": ["SKYTAP-WEB", "WEB", "WEBAGENT"], 
      "configs": [
        "RingtailLegalApplicationServer|IS_SQLSERVER_SERVER",
        "RingtailLegalApplicationServer|IS_SQLSERVER_USERNAME",
        "RingtailLegalApplicationServer|IS_SQLSERVER_PASSWORD",
        "RingtailLegalApplicationServer|IS_SQLSERVER_DATABASE",
        "RingtailLegalApplicationServer|RINGTAILLEGALURL",
        "RingtailLegalApplicationServer|LEGALPATH",
        "RingtailLegalApplicationServer|RINGTAILSTSURL",
        "RingtailLegalApplicationServer|RMCIISWEBAPPLICATIONURL",
        "RingtailLegalApplicationServer|RINGTAILURL",
        "RingtailLegalApplicationServer|RINGTAILSTSCERTIFICATETHUMBPRINT",
        "RingtailLegalApplicationServer|RINGTAILSTSCERTIFICATENAME",
        "RingtailLegalApplicationServer|WEBSERSSLUSAGE",
        "RingtailLegalApplicationServer|WEBBROWSERPROTOCOL"
      ],
    },
    {
      "roles": ["SKYTAP-AGENT", "SKYTAP-WEBAGENT", "SKYTAP-WEB", "AGENT", "WEBAGENT", "WEB"],
      "configs": [
        "RingtailConfigurator|CONFIGURATORPORT",
        "RingtailConfigurator|HOST",
        "RingtailConfigurator|NT_DOMAIN",
        "RingtailConfigurator|NT_USER",
        "RingtailConfigurator|NT_PASSWORD",
        "RingtailConfigurator|CONFIG_USERNAME",
        "RingtailConfigurator|CONFIG_PASSWORD"
      ]
    },
    {
      "roles": ["SKYTAP-RPF-COORDINATOR", "SKYTAP-RPF-SUPERVISOR"],
      "configs": [
        "RingtailProcessingFrameworkWorkers|RPFWORKERPATH"
      ]
    },
    {
      "roles": ["SKYTAP-RPF-SUPERVISOR", "RPF-SUPERVISOR"],
      "configs": [
        "RingtailProcessingFramework|ADDLOCAL",
        "RingtailProcessingFramework|IS_SQLSERVER_SERVER",
        "RingtailProcessingFramework|IS_SQLSERVER_USERNAME",
        "RingtailProcessingFramework|IS_SQLSERVER_PASSWORD",
        "RingtailProcessingFramework|IS_SQLSERVER_DATABASE",
        "RingtailProcessingFramework|RINGTAILIISWEBAPPLICATIONNAME",
        "RingtailProcessingFramework|RINGTAILIISVIRTUALDIRECTORYPHYSICALPATH",
        "RingtailProcessingFramework|RT_COORDINATOR_URL",
        "RingtailProcessingFramework|SERVICEUSERNAME",
        "RingtailProcessingFramework|SERVICEPASSWORD",
        "RingtailProcessingFramework|RPFWORKERPATH"
      ]
    },
    {
      "roles": ["SKYTAP-DB", "DATABASE"],
      "configs": [
        "RingtailDatabaseUtility|IS_SQLSERVER_USERNAME",
        "RingtailDatabaseUtility|IS_SQLSERVER_PASSWORD",
        "DatabaseUpgrader|IS_SQLSERVER_USERNAME",
        "DatabaseUpgrader|IS_SQLSERVER_PASSWORD",
        "DatabaseUpgrader|DATACAMEL_ACTION",
        "DatabaseUpgrader|DATACAMEL_DATABASES"
      ]
    }
  ]
  /* jshint ignore:end */

}());

