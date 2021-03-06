(function () {
  'use strict';

  angular
    .module('shared')
    .directive('datepickerPopup', datepickerPopup);

  // fix for date picker failing to display unformatted on changes
  // refer to: http://stackoverflow.com/questions/25742445/angularjs-1-3-datepicker-initial-format-is-incorrect
  function datepickerPopup(dateFilter, datepickerPopupConfig) {
    return {
      restrict: 'A',
      priority: 1,
      require: 'ngModel',
      link: function(scope, element, attr, ngModel) {
        var dateFormat = attr.datepickerPopup || datepickerPopupConfig.datepickerPopup;
        ngModel.$formatters.push(function (value) {
          return dateFilter(value, dateFormat);
        });
      }
    };
  }

}());