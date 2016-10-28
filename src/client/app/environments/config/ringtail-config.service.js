(function() {
  var rolesData;

  angular
    .module('app.environments.config')
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

  /* eslint-disable */
  rolesData = [
    {
      "roles": ["SKYTAP-WEB", "WEB", "WEBAGENT", "NOHELP_WEB", "SKYTAP-ALLINONE"],
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
        "Ringtail8|RINGTAILCLASSICWEBSITEMAPPING",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    },
    {
      "roles": ["SKYTAP-WEB", "WEB", "WEBAGENT", "NOHELP_WEB", "SKYTAP-ALLINONE", "DEV-FULL"],
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
        "RingtailLegalApplicationServer|WEBBROWSERPROTOCOL",
        "Common|UNINSTALL_EXCLUSIONS"
      ],
    },
    {
      "roles": ["SKYTAP-AGENT", "SKYTAP-WEBAGENT", "SKYTAP-WEB", "AGENT", "AGT_NATIVE", "WEBAGENT", "WEB", "NOHELP_WEB", "SKYTAP-ALLINONE", "DEV-FULL"],
      "configs": [
        "RingtailConfigurator|CONFIGURATORPORT",
        "RingtailConfigurator|HOST",
        "RingtailConfigurator|NT_DOMAIN",
        "RingtailConfigurator|NT_USER",
        "RingtailConfigurator|NT_PASSWORD",
        "RingtailConfigurator|CONFIG_USERNAME",
        "RingtailConfigurator|CONFIG_PASSWORD",
        "RingtailConfigurator|IS_SQLSERVER_SERVER",
        "RingtailConfigurator|IS_SQLSERVER_USERNAME",
        "RingtailConfigurator|IS_SQLSERVER_PASSWORD",
        "RingtailConfigurator|IS_SQLSERVER_DATABASE",
        "RingtailConfigurator|DB_PORT",
        "RingtailConfigurator|AGENT_VIRTUAL_NAME",
        "RingtailConfigurator|APP_POOL",
        "RingtailConfigurator|AGENT_APP_POOL",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    },
    {
      "roles": ["AGT_NATIVE"],
      "configs": [
        "NativeFileServiceSetup|SERVICEUSER",
        "NativeFileServiceSetup|SERVICEPASSWORD",
        "NativeFileServiceSetup|NATIVEFILESERVICESERVERS",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    },
    {
      "roles": ["SKYTAP-RPF-COORDINATOR", "RPF-COORDINATOR", "SKYTAP-ALLINONE", "DEV-FULL"],
      "configs": [
        "RingtailProcessingFrameworkWorkers|RPFWORKERPATH",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    },
    {
      "roles": ["SKYTAP-RPF-COORDINATOR", "RPF-COORDINATOR", "SKYTAP-RPF-SUPERVISOR",  "RPF-SUPERVISOR", "SKYTAP-ALLINONE", "DEV-FULL"],
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
        "RingtailProcessingFramework|RPFWORKERPATH",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    },
    {
      "roles": ["SEARCHSERVER", "SKYTAP-AGENT", "AGENT", "SKYTAP-ALLINONE"],
      "configs": [
        "Ringtail-Svc-ContentSearch|SERVICEUSERNAME",
        "Ringtail-Svc-ContentSearch|SERVICEPASSWORD"
      ]
    },
    {
      "roles": ["SKYTAP-WEB", "WEB", "SVC-PORTAL", "SKYTAP-ALLINONE"],
      "configs": [
        "Ringtail-Svc-Portal|PortalDBServer",
        "Ringtail-Svc-Portal|PortalDBName",
        "Ringtail-Svc-Portal|PortalDBUser",
        "Ringtail-Svc-Portal|PortalDBPassword",
        "Ringtail-Svc-Portal|RpfDBServer",
        "Ringtail-Svc-Portal|RpfDBName",
        "Ringtail-Svc-Portal|RpfDBUser",
        "Ringtail-Svc-Portal|RpfDBPassword",
        "Ringtail-Svc-Portal|RpfDBPort"
      ]
    },    
    {
      "roles": ["SKYTAP-DB", "DATABASE", "DEV-FULL", "SKYTAP-ALLINONE"],
      "configs": [
        "RingtailDatabaseUtility|IS_SQLSERVER_SERVER",
        "RingtailDatabaseUtility|IS_SQLSERVER_USERNAME",
        "RingtailDatabaseUtility|IS_SQLSERVER_PASSWORD",
        "RingtailDatabaseUtility|IS_SQLSERVER_DATABASE",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    },
    {
      "roles": ["SKYTAP-DB", "DATABASE", "DEV-FULL", "SKYTAP-ALLINONE"],
      "configs": [
        "DatabaseUpgrader|IS_SQLSERVER_SERVER",
        "DatabaseUpgrader|IS_SQLSERVER_USERNAME",
        "DatabaseUpgrader|IS_SQLSERVER_PASSWORD",
        "DatabaseUpgrader|DATACAMEL_ACTION",
        "DatabaseUpgrader|DATACAMEL_DATABASES",
        "Common|UNINSTALL_EXCLUSIONS"
      ]
    }
  ];
  /* eslint-enable */

}());

